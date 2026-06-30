provider "aws" {
  region = var.aws_region

  default_tags {
    tags = merge(
      {
        Project   = var.project_name
        ManagedBy = "Terraform"
        Repo      = "optbot"
      },
      var.tags
    )
  }
}
