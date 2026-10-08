# Remote state lives in S3 with DynamoDB locking; both are created by terraform/bootstrap.
terraform {
  backend "s3" {
    bucket         = "drawzy-terraform-state-dev"
    key            = "terraform.tfstate"
    region         = "eu-central-1"
    dynamodb_table = "drawzy-terraform-state-locks"
    encrypt        = true
  }
}
