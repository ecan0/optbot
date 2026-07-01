data "aws_caller_identity" "current" {}

data "aws_cloudfront_cache_policy" "caching_optimized" {
  name = "Managed-CachingOptimized"
}

data "archive_file" "submit_response" {
  type        = "zip"
  source_file = "${path.module}/lambda/submit_response.py"
  output_path = "${path.module}/submit_response.zip"
}

resource "random_id" "site_suffix" {
  byte_length = 4
}

locals {
  name                    = var.project_name
  site_bucket_name        = var.site_bucket_name != "" ? var.site_bucket_name : "${var.project_name}-site-${random_id.site_suffix.hex}"
  responses_table_name    = var.responses_table_name != "" ? var.responses_table_name : "${var.project_name}-responses"
  use_custom_domain       = var.acm_certificate_arn != ""
  turnstile_parameter_arn = var.turnstile_secret_parameter_name != "" ? "arn:aws:ssm:${var.aws_region}:${data.aws_caller_identity.current.account_id}:parameter${var.turnstile_secret_parameter_name}" : null
}

resource "aws_s3_bucket" "site" {
  bucket = local.site_bucket_name
}

resource "aws_s3_bucket_public_access_block" "site" {
  bucket                  = aws_s3_bucket.site.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_ownership_controls" "site" {
  bucket = aws_s3_bucket.site.id

  rule {
    object_ownership = "BucketOwnerEnforced"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "site" {
  bucket = aws_s3_bucket.site.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_versioning" "site" {
  bucket = aws_s3_bucket.site.id

  versioning_configuration {
    status = var.enable_bucket_versioning ? "Enabled" : "Suspended"
  }
}

resource "aws_cloudfront_origin_access_control" "site" {
  name                              = "${local.name}-site-oac"
  description                       = "Origin access control for ${var.domain_name} static assets"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

resource "aws_cloudfront_distribution" "site" {
  enabled             = true
  comment             = "${var.domain_name} static site"
  default_root_object = "index.html"
  price_class         = var.cloudfront_price_class
  aliases             = local.use_custom_domain ? [var.domain_name] : []

  origin {
    domain_name              = aws_s3_bucket.site.bucket_regional_domain_name
    origin_access_control_id = aws_cloudfront_origin_access_control.site.id
    origin_id                = "site-s3"
  }

  default_cache_behavior {
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]
    cache_policy_id        = data.aws_cloudfront_cache_policy.caching_optimized.id
    compress               = true
    target_origin_id       = "site-s3"
    viewer_protocol_policy = "redirect-to-https"
  }

  custom_error_response {
    error_caching_min_ttl = 0
    error_code            = 403
    response_code         = 200
    response_page_path    = "/index.html"
  }

  custom_error_response {
    error_caching_min_ttl = 0
    error_code            = 404
    response_code         = 200
    response_page_path    = "/index.html"
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    acm_certificate_arn            = local.use_custom_domain ? var.acm_certificate_arn : null
    cloudfront_default_certificate = local.use_custom_domain ? false : true
    minimum_protocol_version       = local.use_custom_domain ? "TLSv1.2_2021" : null
    ssl_support_method             = local.use_custom_domain ? "sni-only" : null
  }
}


data "aws_iam_policy_document" "site_bucket" {
  statement {
    actions   = ["s3:GetObject"]
    resources = ["${aws_s3_bucket.site.arn}/*"]

    principals {
      type        = "Service"
      identifiers = ["cloudfront.amazonaws.com"]
    }

    condition {
      test     = "StringEquals"
      variable = "AWS:SourceArn"
      values   = [aws_cloudfront_distribution.site.arn]
    }
  }
}

resource "aws_s3_bucket_policy" "site" {
  bucket = aws_s3_bucket.site.id
  policy = data.aws_iam_policy_document.site_bucket.json
}

resource "aws_dynamodb_table" "responses" {
  name         = local.responses_table_name
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "response_id"

  attribute {
    name = "response_id"
    type = "S"
  }

  attribute {
    name = "survey_id"
    type = "S"
  }

  attribute {
    name = "submitted_at"
    type = "S"
  }

  global_secondary_index {
    name            = "survey-submitted-at"
    projection_type = "ALL"

    key_schema {
      attribute_name = "survey_id"
      key_type       = "HASH"
    }

    key_schema {
      attribute_name = "submitted_at"
      key_type       = "RANGE"
    }
  }

  point_in_time_recovery {
    enabled = var.enable_dynamodb_pitr
  }

  server_side_encryption {
    enabled = true
  }

  ttl {
    attribute_name = "expires_at"
    enabled        = true
  }
}

resource "aws_cloudwatch_log_group" "submit_response" {
  name              = "/aws/lambda/${local.name}-submit-response"
  retention_in_days = var.lambda_log_retention_days
}

resource "aws_iam_role" "submit_response" {
  name = "${local.name}-submit-response-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "submit_response_basic" {
  role       = aws_iam_role.submit_response.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

data "aws_iam_policy_document" "submit_response" {
  statement {
    actions   = ["dynamodb:PutItem"]
    resources = [aws_dynamodb_table.responses.arn]
  }

  dynamic "statement" {
    for_each = var.turnstile_secret_parameter_name == "" ? [] : [1]

    content {
      actions   = ["ssm:GetParameter"]
      resources = [local.turnstile_parameter_arn]
    }
  }
}

resource "aws_iam_policy" "submit_response" {
  name   = "${local.name}-submit-response-policy"
  policy = data.aws_iam_policy_document.submit_response.json
}

resource "aws_iam_role_policy_attachment" "submit_response" {
  role       = aws_iam_role.submit_response.name
  policy_arn = aws_iam_policy.submit_response.arn
}

resource "aws_lambda_function" "submit_response" {
  function_name    = "${local.name}-submit-response"
  filename         = data.archive_file.submit_response.output_path
  handler          = "submit_response.handler"
  role             = aws_iam_role.submit_response.arn
  runtime          = "python3.12"
  source_code_hash = data.archive_file.submit_response.output_base64sha256
  timeout          = 10

  environment {
    variables = {
      ALLOWED_ORIGIN             = var.frontend_origin
      RESPONSES_TABLE_NAME       = aws_dynamodb_table.responses.name
      RETENTION_DAYS             = tostring(var.retention_days)
      REQUIRE_TURNSTILE          = var.require_turnstile ? "true" : "false"
      TURNSTILE_SECRET_PARAMETER = var.turnstile_secret_parameter_name
    }
  }

  depends_on = [
    aws_cloudwatch_log_group.submit_response,
    aws_iam_role_policy_attachment.submit_response,
    aws_iam_role_policy_attachment.submit_response_basic
  ]
}

resource "aws_apigatewayv2_api" "responses" {
  name          = "${local.name}-responses-api"
  protocol_type = "HTTP"

  cors_configuration {
    allow_headers = ["content-type", "cf-turnstile-response"]
    allow_methods = ["OPTIONS", "POST"]
    allow_origins = [var.frontend_origin]
    max_age       = 300
  }
}

resource "aws_apigatewayv2_integration" "submit_response" {
  api_id                 = aws_apigatewayv2_api.responses.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.submit_response.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "submit_response" {
  api_id    = aws_apigatewayv2_api.responses.id
  route_key = "POST /v1/responses"
  target    = "integrations/${aws_apigatewayv2_integration.submit_response.id}"
}

resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.responses.id
  name        = "$default"
  auto_deploy = true
}

resource "aws_lambda_permission" "api_gateway" {
  statement_id  = "AllowExecutionFromApiGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.submit_response.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.responses.execution_arn}/*/*"
}
