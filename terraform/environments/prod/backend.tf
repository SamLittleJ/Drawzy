resource "aws_s3_bucket" "terraform_state_prod" {
  bucket = "drawzy-terraform-state-prod"

  tags = {
    name        = "drawzy-terraform-state-prod"
    Environment = "prod"
  }
}

resource "aws_s3_bucket_versioning" "state_prod_versioning" {
  bucket = aws_s3_bucket.terraform_state_prod.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "state_prod_sse" {
  bucket = aws_s3_bucket.terraform_state_prod.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "state_block_prod" {
  bucket = aws_s3_bucket.terraform_state_prod.id

  block_public_acls       = true
  ignore_public_acls      = true
  restrict_public_buckets = true
  block_public_policy     = true
}