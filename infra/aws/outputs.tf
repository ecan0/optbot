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

output "analytics_bucket_name" {
  description = "Private bucket containing raw and curated analytics snapshots."
  value       = aws_s3_bucket.analytics.bucket
}

output "analytics_database_name" {
  description = "Glue Catalog database for survey analysis."
  value       = aws_glue_catalog_database.analytics.name
}

output "analytics_quantitative_workgroup_name" {
  description = "Athena workgroup for quantitative response analysis."
  value       = aws_athena_workgroup.quantitative.name
}

output "analytics_restricted_workgroup_name" {
  description = "Athena workgroup for restricted free-text analysis."
  value       = aws_athena_workgroup.restricted.name
}

output "analytics_glue_job_name" {
  description = "Glue job that exports and normalizes response snapshots."
  value       = aws_glue_job.analytics_transform.name
}

output "analytics_transform_role_arn" {
  description = "IAM role assumed by the Glue analytics transform."
  value       = aws_iam_role.analytics_transform.arn
}

output "analytics_snapshot_role_arn" {
  description = "GitHub OIDC role used by the protected snapshot workflow."
  value       = aws_iam_role.analytics_snapshot.arn
}

output "analytics_quantitative_policy_arn" {
  description = "Managed policy to attach to quantitative analysts."
  value       = aws_iam_policy.analytics_quantitative.arn
}

output "analytics_restricted_text_policy_arn" {
  description = "Managed policy to attach only to authorized free-text analysts."
  value       = aws_iam_policy.analytics_restricted.arn
}
