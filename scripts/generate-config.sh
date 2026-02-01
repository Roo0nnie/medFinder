#!/bin/bash

# Configuration Template Generator
# Replaces placeholders in configuration files with environment variable values

set -e

# Default values (must be overridden)
PROJECT_NAME="${PROJECT_NAME:-turbo-template}"
AWS_REGION="${AWS_REGION:-ap-southeast-1}"
AWS_ACCOUNT_ID="${AWS_ACCOUNT_ID}"
IMAGE_TAG="${IMAGE_TAG:-latest}"

# Validation
if [ -z "$AWS_ACCOUNT_ID" ]; then
    echo "Error: AWS_ACCOUNT_ID environment variable is required"
    exit 1
fi

echo "=========================================="
echo "Generating Configuration Files"
echo "=========================================="
echo "Project: ${PROJECT_NAME}"
echo "Region: ${AWS_REGION}"
echo "Account ID: ${AWS_ACCOUNT_ID}"
echo "Image Tag: ${IMAGE_TAG}"
echo "=========================================="
echo ""

# Function to replace placeholders in a file
replace_placeholders() {
    local file=$1
    local backup="${file}.backup"

    # Create backup
    if [ -f "$file" ]; then
        cp "$file" "$backup"
    fi

    # Replace placeholders using sed
    sed -i \
        -e "s/\${PROJECT_NAME}/${PROJECT_NAME}/g" \
        -e "s/\${AWS_REGION}/${AWS_REGION}/g" \
        -e "s/\${AWS_ACCOUNT_ID}/${AWS_ACCOUNT_ID}/g" \
        -e "s/\${IMAGE_TAG}/${IMAGE_TAG}/g" \
        "$file"

    echo "✓ Updated: $file"
}

# Update task definitions
echo "Step 1: Updating task definitions..."
replace_placeholders "aws/ecs/task-definition-web.json"
replace_placeholders "aws/ecs/task-definition-backend.json"

# Update CloudWatch alarms
echo "Step 2: Updating CloudWatch alarms..."
replace_placeholders "aws/monitoring/cloudwatch-alarms.json"

echo ""
echo "=========================================="
echo "Configuration generation completed!"
echo "=========================================="
echo ""
echo "Files updated:"
echo "  - aws/ecs/task-definition-web.json"
echo "  - aws/ecs/task-definition-backend.json"
echo "  - aws/monitoring/cloudwatch-alarms.json"
echo ""
echo "Next steps:"
echo "  1. Review the generated files"
echo "  2. Run deployment scripts to apply to AWS"
echo ""
