# Resursă: aws_ecr_repository.backend
# • Rol: Creează un repository ECR pentru imaginea backend.
# • Motiv: Permite stocarea și versiunea containerelor Docker pentru backend.
# • Alternative: Registry extern (Docker Hub, GitHub Packages).
# • Config: image_tag_mutability=MUTABLE pentru a putea re-împinge tag-uri identice.
# • Considerații: force_delete=true pentru curățare rapidă în medii de test; în producție se recomandă prevent_destroy.
resource "aws_ecr_repository" "backend" {
  name                 = "drawzy-backend"
  image_tag_mutability = "MUTABLE"
  force_delete         = true
}

# Resursă: aws_ecr_lifecycle_policy.backend_policy
# • Rol: Definește politica de expirare a imaginilor din repository-ul backend.
# • Motiv: Previi acumularea de imagini vechi și economisești spațiu.
# • Config: Păstrează ultimele 5 imagini; restul expiră automat.
# • Alternative: Reguli bazate pe tag-uri specifice sau vârsta imaginii.
resource "aws_ecr_lifecycle_policy" "backend_policy" {
  repository = aws_ecr_repository.backend.name

  policy = <<EOF
  {
    "rules": [
      {
        "rulePriority": 1,
        "description": "Pastreaza ultimele 5 imagini",
        "selection": {
          "tagStatus": "any",
          "countType": "imageCountMoreThan",
          "countNumber": 5
        },
        "action": {
          "type": "expire"
        }
      }
    ]
  }
  EOF
}

# Resursă: aws_ecr_repository.frontend
# • Rol: Creează un repository ECR pentru imaginea frontend.
# • Motiv: Permite stocarea și versiunea containerelor Docker pentru frontend.
# • Config: image_tag_mutability=MUTABLE și force_delete=true, similar cu backend.
resource "aws_ecr_repository" "frontend" {
  name                 = "drawzy-frontend"
  image_tag_mutability = "MUTABLE"
  force_delete         = true
}

# Resursă: aws_ecr_lifecycle_policy.frontend_policy
# • Rol: Politica de expirare pentru imaginile frontend din ECR.
# • Motiv: Menținere curată a repository-ului și eliberare spațiu.
# • Config: Păstrează ultimele 5 imagini; restul expiră automat.
resource "aws_ecr_lifecycle_policy" "frontend_policy" {
  repository = aws_ecr_repository.frontend.name

  policy = <<EOF
  {
    "rules": [
      {
        "rulePriority": 1,
        "description": "Pastreaza ultimele 5 imagini",
        "selection": {
          "tagStatus": "any",
          "countType": "imageCountMoreThan",
          "countNumber": 5
        },
        "action": {
          "type": "expire"
        }
      }
    ]
  }
  EOF
}

# Output: backend_ecr_url
# • Rol: Expune URL-ul complet al repository-ului ECR pentru backend.
# • Motiv: Folosit de modulele care lansează instanțe EC2 pentru a trage imaginea corectă.
output "backend_ecr_url" {
  description = "The URL of the backend ECR repository"
  value       = aws_ecr_repository.backend.repository_url
}

# Output: frontend_ecr_url
# • Rol: Expune URL-ul complet al repository-ului ECR pentru frontend.
# • Motiv: Permite implementarea automată a containerelor frontend în EC2 sau ECS.
output "frontend_ecr_url" {
  description = "The URL of the frontend ECR repository"
  value       = aws_ecr_repository.frontend.repository_url
}