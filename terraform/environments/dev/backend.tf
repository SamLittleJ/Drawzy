# Configurație Terraform Backend: S3 & DynamoDB
# • Rol: Stochează starea Terraform în bucket S3 și folosește DynamoDB pentru blocare.
# • Motiv: Permite colaborarea sigură a echipei și previne scrierea concurentă în același state.
# • Alternative: Backend local (fișier local), Consul sau alți furnizori suportate.
# • Observații: `encrypt = true` asigură criptarea în S3; DynamoDB oferă locking atomic.
terraform {
  backend "s3" {
    bucket         = "drawzy-terraform-state-dev"
    key            = "terraform.tfstate"
    region         = "eu-central-1"
    dynamodb_table = "drawzy-terraform-state-locks"
    encrypt        = true
  }
}

# Resursă: aws_s3_bucket.terraform_state_dev
# • Rol: Creează bucket-ul S3 pentru stocarea fișierului de stare Terraform.
# • Motiv: Terraform backend necesită un bucket dedicat pentru state file.
# • Alternative: Folosirea unui bucket existent sau alt backend (Consul, GCS).
# • Observații: Numele bucket-ului trebuie unic la nivel global.
resource "aws_s3_bucket" "terraform_state_dev" {
    bucket = "drawzy-terraform-state-dev"
}

# Resursă: aws_dynamodb_table.terraform_state_locks
# • Rol: Creează tabel DynamoDB pentru blocarea stării Terraform (state locking).
# • Motiv: Previi rularea paralelă a operațiunilor Terraform și coruperea state.
# • Alternative: Locking la nivel de fișier, backend-ul local (mai puțin sigur).
# • Observații: `billing_mode = "PAY_PER_REQUEST"` asigură costuri flexibile.
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

# Resursă: aws_dynamodb_table.drawzy_sessions
# • Rol: Creează un tabel DynamoDB pentru gestionarea sesiunilor aplicației.
# • Motiv: Persistență rapidă și scalabilă pentru datele de sesiune.
# • Alternative: Redis, memorare în bază de date relațională.
# • Observații: Folosește `PAY_PER_REQUEST` pentru plata la consum efectiv.
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