resource "aws_ecr_repository" "backend" {
  name = "drawzy-backend"
    image_tag_mutability = "MUTABLE"
  force_delete = true
#   lifecycle {
#     prevent_destroy = true
#   }
 }

resource "aws_ecr_repository_policy" "backend_policy" {
  repository = aws_ecr_repository.backend.name

  policy = <<EOF
  {
  "rules": [
  {
    "rulePriority": 1,
    "description": "Pastreaza ultimele 10 imagini",
    "selection": {
      "tagStatus": "any",
      "countType": "imageCountMoreThan",
      "countNumber": 5
      },
    "action": {
      "type": "expire"
      }
    }]}
EOF
}

resource "aws_ecr_repository" "frontend" {
  name = "drawzy-frontend"
    image_tag_mutability = "MUTABLE"
  force_delete = true
  # lifecycle {
  #   prevent_destroy = true
  # }
}

resource "aws_ecr_repository_policy" "frontend_policy" {
  repository = aws_ecr_repository.frontend.name

  policy = <<EOF
  {
  "rules": [
  {
    "rulePriority": 1,
    "description": "Pastreaza ultimele 10 imagini",
    "selection": {
      "tagStatus": "any",
      "countType": "imageCountMoreThan",
      "countNumber": 5
      },
    "action": {
      "type": "expire"
      }
    }]}
EOF
}

output "backend_ecr_url" {
  description = "The URL of the backend ECR repository"
  value = aws_ecr_repository.backend.repository_url
}

output "frontend_ecr_url" {
  description = "The URL of the frontend ECR repository"
  value = aws_ecr_repository.frontend.repository_url
}