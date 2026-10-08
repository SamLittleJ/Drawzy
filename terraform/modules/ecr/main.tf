locals {
  repositories = toset(["backend", "frontend"])
}

resource "aws_ecr_repository" "app" {
  for_each = local.repositories

  name                 = "drawzy-${each.key}"
  image_tag_mutability = "MUTABLE"
  force_delete         = true
}

resource "aws_ecr_lifecycle_policy" "keep_recent" {
  for_each = aws_ecr_repository.app

  repository = each.value.name
  policy = jsonencode({
    rules = [{
      rulePriority = 1
      description  = "Keep only the 5 most recent images"
      selection = {
        tagStatus   = "any"
        countType   = "imageCountMoreThan"
        countNumber = 5
      }
      action = { type = "expire" }
    }]
  })
}

# Keep existing repositories when upgrading from the earlier one-resource-per-repo layout.
moved {
  from = aws_ecr_repository.backend
  to   = aws_ecr_repository.app["backend"]
}

moved {
  from = aws_ecr_repository.frontend
  to   = aws_ecr_repository.app["frontend"]
}

moved {
  from = aws_ecr_lifecycle_policy.backend_policy
  to   = aws_ecr_lifecycle_policy.keep_recent["backend"]
}

moved {
  from = aws_ecr_lifecycle_policy.frontend_policy
  to   = aws_ecr_lifecycle_policy.keep_recent["frontend"]
}
