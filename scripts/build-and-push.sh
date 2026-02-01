#!/bin/bash

# AWS ECS Build and Push Script
# This script builds Docker images and pushes them to ECR

set -e

# Configuration with defaults
AWS_REGION="${AWS_REGION:-ap-southeast-1}"
ACCOUNT_ID="${AWS_ACCOUNT_ID}"
PROJECT_NAME="${PROJECT_NAME:-turbo-template}"
WEB_IMAGE_TAG="${WEB_IMAGE_TAG:-latest}"
BACKEND_IMAGE_TAG="${BACKEND_IMAGE_TAG:-latest}"

# Generated repository names
WEB_REPO_NAME="${ECR_REPO_WEB:-${PROJECT_NAME}-web}"
BACKEND_REPO_NAME="${ECR_REPO_BACKEND:-${PROJECT_NAME}-backend}"

# Validation
if [ -z "$ACCOUNT_ID" ]; then
    echo "Error: AWS_ACCOUNT_ID environment variable is required"
    echo "Usage: AWS_ACCOUNT_ID=123456789012 ./scripts/build-and-push.sh"
    exit 1
fi

# ECR URIs
WEB_ECR_URI="${ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${WEB_REPO_NAME}:${WEB_IMAGE_TAG}"
BACKEND_ECR_URI="${ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${BACKEND_REPO_NAME}:${BACKEND_IMAGE_TAG}"

echo "=========================================="
echo "AWS ECS Build and Push Script"
echo "=========================================="
echo "Region: ${AWS_REGION}"
echo "Account ID: ${ACCOUNT_ID}"
echo "Project: ${PROJECT_NAME}"
echo "Web Image: ${WEB_ECR_URI}"
echo "Backend Image: ${BACKEND_ECR_URI}"
echo "=========================================="
echo ""

# Login to ECR
echo "Step 1: Logging into ECR..."
aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com
echo "✓ ECR login successful"
echo ""

# Build Docker images
echo "Step 2: Building Docker images..."

# Build web image
echo "Building web image..."
docker build \
  -f apps/web/Dockerfile \
  -t ${WEB_REPO_NAME}:${WEB_IMAGE_TAG} \
  -t ${WEB_ECR_URI} \
  .
echo "✓ Web image built successfully"

# Build backend image
echo "Building backend image..."
docker build \
  -f apps/backend/Dockerfile \
  -t ${BACKEND_REPO_NAME}:${BACKEND_IMAGE_TAG} \
  -t ${BACKEND_ECR_URI} \
  .
echo "✓ Backend image built successfully"
echo ""

# Push images to ECR
echo "Step 3: Pushing images to ECR..."

# Push web image
echo "Pushing web image..."
docker push ${WEB_ECR_URI}
echo "✓ Web image pushed successfully"

# Push backend image
echo "Pushing backend image..."
docker push ${BACKEND_ECR_URI}
echo "✓ Backend image pushed successfully"
echo ""

# Update ECS services (optional)
if [ "$UPDATE_ECS" = "true" ]; then
    echo "Step 4: Updating ECS services..."

    ECS_CLUSTER="${PROJECT_NAME}-cluster"
    ECS_SERVICE_WEB="${PROJECT_NAME}-web-service"
    ECS_SERVICE_BACKEND="${PROJECT_NAME}-backend-service"

    # Update web service
    echo "Updating web service..."
    aws ecs update-service \
      --cluster ${ECS_CLUSTER} \
      --service ${ECS_SERVICE_WEB} \
      --force-new-deployment \
      --region ${AWS_REGION}
    echo "✓ Web service updated"

    # Update backend service
    echo "Updating backend service..."
    aws ecs update-service \
      --cluster ${ECS_CLUSTER} \
      --service ${ECS_SERVICE_BACKEND} \
      --force-new-deployment \
      --region ${AWS_REGION}
    echo "✓ Backend service updated"
fi

echo ""
echo "=========================================="
echo "Build and push completed successfully!"
echo "=========================================="
echo ""
echo "Web image: ${WEB_ECR_URI}"
echo "Backend image: ${BACKEND_ECR_URI}"
echo ""
