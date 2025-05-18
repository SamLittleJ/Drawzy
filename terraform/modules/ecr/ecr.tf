resource "aws_ecr_repository" "backend" {
  name = "drawzy-backend"
    image_tag_mutability = "MUTABLE"
  force_delete = true
#   lifecycle {
#     prevent_destroy = true
#   }
 }
resource "aws_ecr_repository" "frontend" {
  name = "drawzy-frontend"
    image_tag_mutability = "MUTABLE"
  force_delete = true
  # lifecycle {
  #   prevent_destroy = true
  # }
}

output "backend_ecr_url" {
  description = "The URL of the backend ECR repository"
  value = aws_ecr_repository.backend.repository_url
}

output "frontend_ecr_url" {
  description = "The URL of the frontend ECR repository"
  value = aws_ecr_repository.frontend.repository_url
}