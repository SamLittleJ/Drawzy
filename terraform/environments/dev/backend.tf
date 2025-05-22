resource "aws_s3_bucket" "terraform_state_dev" {
  bucket = "drawzy-terraform-state-dev"
  

  tags = {
    name        = "drawzy-terraform-state-dev"
    Environment = "dev"
  }
}

terraform {
  backend "s3" {
    bucket         = "drawzy-terraform-state-dev"
    key            = "terraform.tfstate"
    region         = "eu-central-1"
    dynamodb_table = "drawzy-terraform-state-locks"
  }
}

resource "aws_dynamodb_table" "terraform_state_locks" {
    name = "drawzy-terraform-state-locks"
    billing_mode = "PAY_PER_REQUEST"
    hash_key = "LockID"

    attribute {
        name = "LockID"
        type = "S"
    }
    tags = {
        name        = "drawzy-terraform-state-locks"
        Environment = "dev"
    }
}
resource "aws_s3_bucket_public_access_block" "state_dev_block" {
  bucket = aws_s3_bucket.terraform_state_dev.id

  block_public_acls       = true
  ignore_public_acls      = true
  block_public_policy     = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_versioning" "state_dev_versioning" {
  bucket = aws_s3_bucket.terraform_state_dev.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "state_dev_sse" {
  bucket = aws_s3_bucket.terraform_state_dev.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}