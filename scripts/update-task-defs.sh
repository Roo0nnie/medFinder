#!/bin/bash

# AWS ECS Task Definition Update Script
# This script updates task definitions with new image tags

set -e

# Configuration
AWS_REGION="${AWS_REGION:-us-east-1}"
ACCOUNT_ID="${AWS_ACCOUNT_ID}"
WEB_IMAGE_TAG="${WEB_IMAGE_TAG:-latest}"
BACKEND_IMAGE_TAG="${BACKEND_IMAGE_TAG:-latest}"

# Validate required variables
if [ -z "$ACCOUNT_ID" ]; then
    echo "Error: AWS_ACCOUNT_ID environment variable is required"
    exit 1
fi

echo "Updating task definitions with new image tags..."

# Update web task definition
echo "Step 1: Updating web task definition..."
aws ecs register-task-definition \
  --cli-input-json file://aws/ecs/task-definition-web.json \
  --region ${AWS_REGION} \
  --container-definitions "[{
    \"name\": \"web\",
    \"image\": \"${ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/turbo-template-web:${WEB_IMAGE_TAG}\",
    \"portMappings\": [{\"containerPort\": 3001, \"protocol\": \"tcp\"}],
    \"essential\": true,
    \"environment\": [{\"name\": \"NODE_ENV\", \"value\": \"production\"}],
    \"logConfiguration\": {
      \"logDriver\": \"awslogs\",
      \"options\": {
        \"awslogs-group\": \"/ecs/turbo-template-web\",
        \"awslogs-region\": \"${AWS_REGION}\",
        \"awslogs-stream-prefix\": \"ecs\"
      }
    }
  }]" > /dev/null

WEB_TASK_DEF_ARN=$(aws ecs describe-task-definition \
  --task-definition turbo-template-web \
  --query 'taskDefinition.taskDefinitionArn' \
  --output text \
  --region ${AWS_REGION})

echo "✓ Web task definition updated: ${WEB_TASK_DEF_ARN}"

# Update backend task definition
echo "Step 2: Updating backend task definition..."
aws ecs register-task-definition \
  --cli-input-json file://aws/ecs/task-definition-backend.json \
  --region ${AWS_REGION} \
  --container-definitions "[{
    \"name\": \"backend\",
    \"image\": \"${ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/turbo-template-backend:${BACKEND_IMAGE_TAG}\",
    \"portMappings\": [{\"containerPort\": 3000, \"protocol\": \"tcp\"}],
    \"essential\": true,
    \"environment\": [{\"name\": \"NODE_ENV\", \"value\": \"production\"}, {\"name\": \"PORT\", \"value\": \"3000\"}],
    \"logConfiguration\": {
      \"logDriver\": \"awslogs\",
      \"options\": {
        \"awslogs-group\": \"/ecs/turbo-template-backend\",
        \"awslogs-region\": \"${AWS_REGION}\",
        \"awslogs-stream-prefix\": \"ecs\"
      }
    }
  }]" > /dev/null

BACKEND_TASK_DEF_ARN=$(aws ecs describe-task-definition \
  --task-definition turbo-template-backend \
  --query 'taskDefinition.taskDefinitionArn' \
  --output text \
  --region ${AWS_REGION})

echo "✓ Backend task definition updated: ${BACKEND_TASK_DEF_ARN}"

# Update services
echo "Step 3: Updating ECS services..."

# Update web service
echo "Updating web service..."
aws ecs update-service \
  --cluster turbo-template-cluster \
  --service web-service \
  --task-definition ${WEB_TASK_DEF_ARN} \
  --region ${AWS_REGION} > /dev/null

echo "✓ Web service updated with new task definition"

# Update backend service
echo "Updating backend service..."
aws ecs update-service \
  --cluster turbo-template-cluster \
  --service backend-service \
  --task-definition ${BACKEND_TASK_DEF_ARN} \
  --region ${AWS_REGION} > /dev/null

echo "✓ Backend service updated with new task definition"

echo ""
echo "=========================================="
echo "Task definitions updated successfully!"
echo "=========================================="
echo ""
