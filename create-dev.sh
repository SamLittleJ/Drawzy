#!/bin/bash

echo "⚠️ Creating the dev environment..."

cd terraform/environments/dev || exit 1

echo "🔄 Initializing Terraform..."
terraform init -input=false
echo "🔄 Creating the dev environment..."
terraform apply -auto-approve

echo "✅ Dev environment created."