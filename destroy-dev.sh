#!/bin/bash

echo "⚠️ Destroying the dev environment..."

cd terraform/environments/dev || exit 1

terraform init -input=false
terraform destroy -auto-approve

echo "✅ Dev environment destroyed."