#!/bin/bash

set -e

#ECR info
AWS_REGION="eu-central-1"
AWS_ACCOUNT_ID="980921758343"
BACKEND_REPO="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/drawzy-backend"
FRONTEND_REPO="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/drawzy-frontend"

echo "Checking docker buildx installation..."
if ! docker buildx inspect drawzy-builder &>/dev/null; then
    docker buildx create --name drawzy-builder --use
    docker buildx inspect --bootstrap
fi

echo "Logging in to AWS ECR..."
aws ecr get-login-password --region "${AWS_REGION}" | docker login --username AWS --password-stdin "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"

echo "Building and pushing backend image..."
docker buildx build --platform linux/amd64 -t "${BACKEND_REPO}:latest" ./backend --push

echo "Building and pushing frontend image..."
docker buildx build --platform linux/amd64 -t "${FRONTEND_REPO}:latest" ./frontend --push

echo "Docker images built and pushed successfully."