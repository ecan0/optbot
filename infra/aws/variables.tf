variable "project_name" {
  description = "Short name used for AWS resources."
  type        = string
  default     = "optbot"
}

variable "aws_region" {
  description = "AWS region for S3, Lambda, API Gateway, DynamoDB, and SSM. CloudFront is global."
  type        = string
  default     = "us-east-1"
}

variable "domain_name" {
  description = "Public site domain. Used for documentation and optional CloudFront aliases."
  type        = string
  default     = "optbot.study"
}

variable "frontend_origin" {
  description = "Exact browser origin allowed to call the submit API."
  type        = string
  default     = "https://optbot.study"
}

variable "acm_certificate_arn" {
  description = "Optional ACM certificate ARN in us-east-1 for the CloudFront custom domain. Leave empty for the default CloudFront domain."
  type        = string
  default     = ""
}

variable "site_bucket_name" {
  description = "Optional globally unique S3 bucket name for static assets. Leave empty to generate one."
  type        = string
  default     = ""
}

variable "responses_table_name" {
  description = "Optional DynamoDB response table name."
  type        = string
  default     = ""
}

variable "retention_days" {
  description = "Number of days before DynamoDB TTL may expire submitted responses."
  type        = number
  default     = 365

  validation {
    condition     = var.retention_days >= 1 && var.retention_days <= 3650
    error_message = "retention_days must be between 1 and 3650."
  }
}

variable "require_turnstile" {
  description = "Require Cloudflare Turnstile verification before accepting submissions."
  type        = bool
  default     = false
}

variable "turnstile_secret_parameter_name" {
  description = "Optional SSM SecureString parameter name that stores the Turnstile secret, for example /optbot/turnstile/secret."
  type        = string
  default     = ""

  validation {
    condition     = var.turnstile_secret_parameter_name == "" || startswith(var.turnstile_secret_parameter_name, "/")
    error_message = "turnstile_secret_parameter_name must be empty or start with /."
  }
}

variable "lambda_log_retention_days" {
  description = "CloudWatch log retention for the submit Lambda."
  type        = number
  default     = 14
}

variable "enable_bucket_versioning" {
  description = "Enable S3 bucket versioning for static assets."
  type        = bool
  default     = true
}

variable "enable_dynamodb_pitr" {
  description = "Enable point-in-time recovery for the response table."
  type        = bool
  default     = false
}

variable "cloudfront_price_class" {
  description = "CloudFront price class. PriceClass_100 keeps the footprint small for a class project."
  type        = string
  default     = "PriceClass_100"

  validation {
    condition     = contains(["PriceClass_100", "PriceClass_200", "PriceClass_All"], var.cloudfront_price_class)
    error_message = "cloudfront_price_class must be PriceClass_100, PriceClass_200, or PriceClass_All."
  }
}

variable "tags" {
  description = "Additional tags for AWS resources."
  type        = map(string)
  default     = {}
}
