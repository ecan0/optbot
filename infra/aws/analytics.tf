locals {
  analytics_bucket_name = "${local.name}-analytics-${data.aws_caller_identity.current.account_id}-${var.aws_region}"
  analytics_database    = "${local.name}_analytics"
  quantitative_columns = [
    "analysis_schema_version", "snapshot_id", "extracted_at_utc", "quality_status", "response_id",
    "survey_id", "variant_id", "consent_version", "survey_flow_version", "submitted_at_utc",
    "source_expires_at_utc", "started_at_utc", "completed_at_utc", "study_design", "primary_outcome",
    "notice_presentation_order", "assigned_notice_slot", "notice_variant_id", "notice_variant_label",
    "notice_format", "visual_design_variant_id", "assignment_method", "visual_colorway",
    "visual_icon_style", "visual_density", "visual_section_emphasis", "visual_layout", "age_range",
    "ai_usage_frequency", "presentation_preference",
  ]
  rating_columns = [
    "visual_willingness", "visual_trust", "visual_completeness", "visual_ease_of_use",
    "text_willingness", "text_trust", "text_completeness", "text_ease_of_use",
  ]
  delta_columns = [
    "willingness_delta_visual_minus_text", "trust_delta_visual_minus_text",
    "completeness_delta_visual_minus_text", "ease_of_use_delta_visual_minus_text",
  ]
}

resource "aws_s3_bucket" "analytics" {
  bucket = local.analytics_bucket_name
}

resource "aws_s3_bucket_ownership_controls" "analytics" {
  bucket = aws_s3_bucket.analytics.id

  rule {
    object_ownership = "BucketOwnerEnforced"
  }
}

resource "aws_s3_bucket_public_access_block" "analytics" {
  bucket                  = aws_s3_bucket.analytics.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "analytics" {
  bucket = aws_s3_bucket.analytics.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "analytics" {
  bucket = aws_s3_bucket.analytics.id

  rule {
    id     = "expire-raw-exports"
    status = "Enabled"
    filter { prefix = "raw/" }
    expiration { days = var.analytics_raw_retention_days }
    abort_incomplete_multipart_upload { days_after_initiation = 1 }
  }

  rule {
    id     = "expire-curated-snapshots"
    status = "Enabled"
    filter { prefix = "curated/" }
    expiration { days = var.analytics_snapshot_retention_days }
    abort_incomplete_multipart_upload { days_after_initiation = 1 }
  }

  rule {
    id     = "expire-query-results"
    status = "Enabled"
    filter { prefix = "query-results/" }
    expiration { days = var.analytics_snapshot_retention_days }
    abort_incomplete_multipart_upload { days_after_initiation = 1 }
  }
}

data "aws_iam_policy_document" "analytics_bucket" {
  statement {
    sid     = "DenyInsecureTransport"
    effect  = "Deny"
    actions = ["s3:*"]
    resources = [
      aws_s3_bucket.analytics.arn,
      "${aws_s3_bucket.analytics.arn}/*",
    ]
    principals {
      type        = "*"
      identifiers = ["*"]
    }
    condition {
      test     = "Bool"
      variable = "aws:SecureTransport"
      values   = ["false"]
    }
  }
}

resource "aws_s3_bucket_policy" "analytics" {
  bucket = aws_s3_bucket.analytics.id
  policy = data.aws_iam_policy_document.analytics_bucket.json
}

resource "aws_glue_catalog_database" "analytics" {
  name = local.analytics_database
}

resource "aws_glue_catalog_table" "responses_quantitative" {
  name          = "responses_quantitative"
  database_name = aws_glue_catalog_database.analytics.name
  table_type    = "EXTERNAL_TABLE"
  parameters = {
    classification = "parquet"
    EXTERNAL       = "TRUE"
  }

  storage_descriptor {
    location      = "s3://${aws_s3_bucket.analytics.bucket}/curated/empty/quantitative/"
    input_format  = "org.apache.hadoop.hive.ql.io.parquet.MapredParquetInputFormat"
    output_format = "org.apache.hadoop.hive.ql.io.parquet.MapredParquetOutputFormat"
    ser_de_info {
      serialization_library = "org.apache.hadoop.hive.ql.io.parquet.serde.ParquetHiveSerDe"
    }
    dynamic "columns" {
      for_each = local.quantitative_columns
      content {
        name = columns.value
        type = "string"
      }
    }
    columns {
      name = "completion_duration_seconds"
      type = "bigint"
    }
    columns {
      name = "visual_notice_reviewed"
      type = "boolean"
    }
    columns {
      name = "text_notice_reviewed"
      type = "boolean"
    }
    dynamic "columns" {
      for_each = concat(local.rating_columns, local.delta_columns)
      content {
        name = columns.value
        type = "int"
      }
    }
  }

  lifecycle {
    ignore_changes = [storage_descriptor[0].location]
  }
}

resource "aws_glue_catalog_table" "responses_restricted_text" {
  name          = "responses_restricted_text"
  database_name = aws_glue_catalog_database.analytics.name
  table_type    = "EXTERNAL_TABLE"
  parameters    = { classification = "parquet", EXTERNAL = "TRUE" }

  storage_descriptor {
    location      = "s3://${aws_s3_bucket.analytics.bucket}/curated/empty/restricted-text/"
    input_format  = "org.apache.hadoop.hive.ql.io.parquet.MapredParquetInputFormat"
    output_format = "org.apache.hadoop.hive.ql.io.parquet.MapredParquetOutputFormat"
    ser_de_info {
      serialization_library = "org.apache.hadoop.hive.ql.io.parquet.serde.ParquetHiveSerDe"
    }
    dynamic "columns" {
      for_each = [
        "analysis_schema_version", "snapshot_id", "extracted_at_utc", "response_id", "survey_id",
        "survey_flow_version", "notice_descriptions", "decision_influence",
      ]
      content {
        name = columns.value
        type = "string"
      }
    }
  }

  lifecycle { ignore_changes = [storage_descriptor[0].location] }
}

resource "aws_glue_catalog_table" "response_quality" {
  name          = "response_quality"
  database_name = aws_glue_catalog_database.analytics.name
  table_type    = "EXTERNAL_TABLE"
  parameters    = { classification = "parquet", EXTERNAL = "TRUE" }

  storage_descriptor {
    location      = "s3://${aws_s3_bucket.analytics.bucket}/curated/empty/quality/"
    input_format  = "org.apache.hadoop.hive.ql.io.parquet.MapredParquetInputFormat"
    output_format = "org.apache.hadoop.hive.ql.io.parquet.MapredParquetOutputFormat"
    ser_de_info {
      serialization_library = "org.apache.hadoop.hive.ql.io.parquet.serde.ParquetHiveSerDe"
    }
    dynamic "columns" {
      for_each = [
        "analysis_schema_version", "snapshot_id", "extracted_at_utc", "response_id", "survey_id",
        "submitted_at_utc", "quality_status",
      ]
      content {
        name = columns.value
        type = "string"
      }
    }
    columns {
      name = "quality_reasons"
      type = "array<string>"
    }
  }

  lifecycle { ignore_changes = [storage_descriptor[0].location] }
}

resource "aws_athena_workgroup" "quantitative" {
  name = "${local.name}-analysis"

  configuration {
    enforce_workgroup_configuration    = true
    publish_cloudwatch_metrics_enabled = true
    bytes_scanned_cutoff_per_query     = var.analytics_query_scan_cutoff_bytes
    engine_version { selected_engine_version = "Athena engine version 3" }
    result_configuration {
      output_location = "s3://${aws_s3_bucket.analytics.bucket}/query-results/quantitative/"
      encryption_configuration { encryption_option = "SSE_S3" }
    }
  }
}

resource "aws_athena_workgroup" "restricted" {
  name = "${local.name}-analysis-restricted"

  configuration {
    enforce_workgroup_configuration    = true
    publish_cloudwatch_metrics_enabled = true
    bytes_scanned_cutoff_per_query     = var.analytics_query_scan_cutoff_bytes
    engine_version { selected_engine_version = "Athena engine version 3" }
    result_configuration {
      output_location = "s3://${aws_s3_bucket.analytics.bucket}/query-results/restricted/"
      encryption_configuration { encryption_option = "SSE_S3" }
    }
  }
}

resource "aws_athena_named_query" "current_quantitative" {
  name      = "Current quantitative responses"
  database  = aws_glue_catalog_database.analytics.name
  workgroup = aws_athena_workgroup.quantitative.id
  query     = "SELECT * FROM ${aws_glue_catalog_database.analytics.name}.${aws_glue_catalog_table.responses_quantitative.name} ORDER BY submitted_at_utc"
}

data "aws_iam_policy_document" "glue_assume" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["glue.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "analytics_transform" {
  name               = "${local.name}-analytics-transform-role"
  assume_role_policy = data.aws_iam_policy_document.glue_assume.json
}

data "aws_iam_policy_document" "analytics_transform" {
  statement {
    sid       = "ExportResponseSnapshot"
    actions   = ["dynamodb:DescribeTable", "dynamodb:ExportTableToPointInTime", "dynamodb:DescribeExport"]
    resources = [aws_dynamodb_table.responses.arn, "${aws_dynamodb_table.responses.arn}/export/*"]
  }
  statement {
    sid       = "ListAnalyticsBucket"
    actions   = ["s3:GetBucketLocation", "s3:ListBucket", "s3:ListBucketMultipartUploads"]
    resources = [aws_s3_bucket.analytics.arn]
  }
  statement {
    sid = "ManageAnalyticsObjects"
    actions = [
      "s3:GetObject", "s3:PutObject", "s3:DeleteObject", "s3:AbortMultipartUpload",
      "s3:ListMultipartUploadParts",
    ]
    resources = [
      "${aws_s3_bucket.analytics.arn}/raw/*",
      "${aws_s3_bucket.analytics.arn}/curated/*",
      "${aws_s3_bucket.analytics.arn}/scripts/*",
    ]
  }
  statement {
    sid       = "WriteGlueLogs"
    actions   = ["logs:CreateLogGroup", "logs:CreateLogStream", "logs:PutLogEvents", "logs:AssociateKmsKey"]
    resources = ["arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:log-group:/aws-glue/*"]
  }
}

resource "aws_iam_role_policy" "analytics_transform" {
  name   = "${local.name}-analytics-transform"
  role   = aws_iam_role.analytics_transform.id
  policy = data.aws_iam_policy_document.analytics_transform.json
}

resource "aws_s3_object" "analytics_transform_script" {
  bucket       = aws_s3_bucket.analytics.id
  key          = "scripts/transform_results.py"
  source       = "${path.module}/glue/transform_results.py"
  etag         = filemd5("${path.module}/glue/transform_results.py")
  content_type = "text/x-python"
}

resource "aws_glue_job" "analytics_transform" {
  name              = "${local.name}-results-transform"
  role_arn          = aws_iam_role.analytics_transform.arn
  glue_version      = "5.0"
  worker_type       = "G.1X"
  number_of_workers = 2
  timeout           = 30
  max_retries       = 0
  execution_class   = "STANDARD"

  command {
    name            = "glueetl"
    python_version  = "3"
    script_location = "s3://${aws_s3_object.analytics_transform_script.bucket}/${aws_s3_object.analytics_transform_script.key}"
  }

  default_arguments = {
    "--table_arn"                        = aws_dynamodb_table.responses.arn
    "--analytics_bucket"                 = aws_s3_bucket.analytics.bucket
    "--analysis_schema_version"          = "optbot-analysis-v1"
    "--enable-continuous-cloudwatch-log" = "true"
    "--enable-metrics"                   = "true"
    "--job-language"                     = "python"
  }
}

data "aws_iam_policy_document" "analytics_snapshot_assume" {
  statement {
    actions = ["sts:AssumeRoleWithWebIdentity"]
    principals {
      type        = "Federated"
      identifiers = ["arn:aws:iam::${data.aws_caller_identity.current.account_id}:oidc-provider/token.actions.githubusercontent.com"]
    }
    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:aud"
      values   = ["sts.amazonaws.com"]
    }
    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:sub"
      values   = ["repo:ecan0/optbot:environment:production"]
    }
  }
}

resource "aws_iam_role" "analytics_snapshot" {
  name               = "${local.name}-github-actions-analytics"
  assume_role_policy = data.aws_iam_policy_document.analytics_snapshot_assume.json
}

data "aws_iam_policy_document" "analytics_snapshot" {
  statement {
    sid       = "RunTransform"
    actions   = ["glue:StartJobRun", "glue:GetJobRun"]
    resources = [aws_glue_job.analytics_transform.arn]
  }
  statement {
    sid = "ManageSnapshotTables"
    actions = [
      "glue:GetDatabase", "glue:GetTable", "glue:GetTables", "glue:CreateTable", "glue:UpdateTable", "glue:DeleteTable",
    ]
    resources = [
      aws_glue_catalog_database.analytics.arn,
      "arn:aws:glue:${var.aws_region}:${data.aws_caller_identity.current.account_id}:catalog",
      "arn:aws:glue:${var.aws_region}:${data.aws_caller_identity.current.account_id}:table/${aws_glue_catalog_database.analytics.name}/*",
    ]
  }
  statement {
    sid       = "RunSnapshotQueries"
    actions   = ["athena:StartQueryExecution", "athena:GetQueryExecution", "athena:GetQueryResults"]
    resources = [aws_athena_workgroup.quantitative.arn, aws_athena_workgroup.restricted.arn]
  }
  statement {
    sid       = "InspectSnapshotObjects"
    actions   = ["s3:GetBucketLocation", "s3:ListBucket"]
    resources = [aws_s3_bucket.analytics.arn]
  }
  statement {
    sid       = "ManageQueryResults"
    actions   = ["s3:GetObject", "s3:PutObject"]
    resources = ["${aws_s3_bucket.analytics.arn}/query-results/*"]
  }
}

resource "aws_iam_role_policy" "analytics_snapshot" {
  name   = "${local.name}-analytics-snapshot"
  role   = aws_iam_role.analytics_snapshot.id
  policy = data.aws_iam_policy_document.analytics_snapshot.json
}

data "aws_iam_policy_document" "analytics_quantitative" {
  statement {
    actions   = ["athena:StartQueryExecution", "athena:GetQueryExecution", "athena:GetQueryResults", "athena:StopQueryExecution", "athena:GetWorkGroup"]
    resources = [aws_athena_workgroup.quantitative.arn]
  }
  statement {
    actions = ["glue:GetDatabase", "glue:GetTable", "glue:GetTables", "glue:GetPartitions"]
    resources = [
      "arn:aws:glue:${var.aws_region}:${data.aws_caller_identity.current.account_id}:catalog",
      aws_glue_catalog_database.analytics.arn,
      aws_glue_catalog_table.responses_quantitative.arn,
      aws_glue_catalog_table.response_quality.arn,
    ]
  }
  statement {
    actions   = ["s3:GetBucketLocation", "s3:ListBucket"]
    resources = [aws_s3_bucket.analytics.arn]
    condition {
      test     = "StringLike"
      variable = "s3:prefix"
      values   = ["curated/quantitative/*", "curated/quality/*", "query-results/quantitative/*"]
    }
  }
  statement {
    actions = ["s3:GetObject"]
    resources = [
      "${aws_s3_bucket.analytics.arn}/curated/quantitative/*",
      "${aws_s3_bucket.analytics.arn}/curated/quality/*",
      "${aws_s3_bucket.analytics.arn}/query-results/quantitative/*",
    ]
  }
}

resource "aws_iam_policy" "analytics_quantitative" {
  name   = "${local.name}-analysis-quantitative"
  policy = data.aws_iam_policy_document.analytics_quantitative.json
}

data "aws_iam_policy_document" "analytics_restricted" {
  statement {
    actions   = ["athena:StartQueryExecution", "athena:GetQueryExecution", "athena:GetQueryResults", "athena:StopQueryExecution", "athena:GetWorkGroup"]
    resources = [aws_athena_workgroup.restricted.arn]
  }
  statement {
    actions = ["glue:GetDatabase", "glue:GetTable", "glue:GetTables", "glue:GetPartitions"]
    resources = [
      "arn:aws:glue:${var.aws_region}:${data.aws_caller_identity.current.account_id}:catalog",
      aws_glue_catalog_database.analytics.arn,
      aws_glue_catalog_table.responses_restricted_text.arn,
    ]
  }
  statement {
    actions   = ["s3:GetBucketLocation", "s3:ListBucket"]
    resources = [aws_s3_bucket.analytics.arn]
    condition {
      test     = "StringLike"
      variable = "s3:prefix"
      values   = ["curated/restricted-text/*", "query-results/restricted/*"]
    }
  }
  statement {
    actions = ["s3:GetObject"]
    resources = [
      "${aws_s3_bucket.analytics.arn}/curated/restricted-text/*",
      "${aws_s3_bucket.analytics.arn}/query-results/restricted/*",
    ]
  }
}

resource "aws_iam_policy" "analytics_restricted" {
  name   = "${local.name}-analysis-restricted-text"
  policy = data.aws_iam_policy_document.analytics_restricted.json
}
