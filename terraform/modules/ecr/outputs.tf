output "backend_ecr_url" {
  value = aws_ecr_repository.app["backend"].repository_url
}

output "frontend_ecr_url" {
  value = aws_ecr_repository.app["frontend"].repository_url
}
