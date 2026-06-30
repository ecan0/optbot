output "site_bucket_name" {
  description = "S3 bucket that receives built static assets."
  value       = aws_s3_bucket.site.bucket
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID for cache invalidations."
  value       = aws_cloudfront_distribution.site.id
}

output "cloudfront_domain_name" {
  description = "CloudFront hostname to use before the custom domain is attached."
  value       = aws_cloudfront_distribution.site.domain_name
}

output "custom_domain_enabled" {
  description = "Whether CloudFront is configured with the optbot.study alias."
  value       = local.use_custom_domain
}

output "responses_api_endpoint" {
  description = "API Gateway base URL. Set VITE_PUBLIC_API_BASE_URL to this value for the frontend."
  value       = aws_apigatewayv2_api.responses.api_endpoint
}

output "responses_table_name" {
  description = "DynamoDB table that stores submitted responses."
  value       = aws_dynamodb_table.responses.name
}
