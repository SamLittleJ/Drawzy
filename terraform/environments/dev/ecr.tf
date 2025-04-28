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