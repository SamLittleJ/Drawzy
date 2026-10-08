terraform {
  required_version = ">= 1.5"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# Credentials come from the standard AWS chain (env vars, profile, or OIDC role in CI).
provider "aws" {
  region = var.aws_region
}
