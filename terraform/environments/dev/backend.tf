terraform {
  backend "s3" {
    bucket         = "drawzy-terraform-state-dev"
    key            = "terraform.tfstate"
    region         = "eu-central-1"
    dynamodb_table = "drawzy-terraform-state-locks"
    encrypt        = true
  }
}

resource "aws_s3_bucket" "terraform_state_dev" {
    bucket = "drawzy-terraform-state-dev"
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
    }
}

resource "aws_dynamodb_table" "drawzy_sessions" {
  name = "drawzy-sessions"
  billing_mode = "PAY_PER_REQUEST"
  hash_key = "SessionID"

  attribute {
    name = "SessionID"
    type = "S"
  }

  tags = {
    name = "drawzy-sessions"
  }
}