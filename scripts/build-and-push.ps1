# AWS ECS Build and Push Script (PowerShell)
# This script builds Docker images and pushes them to ECR

param(
    [Parameter(Mandatory=$false)]
    [string]$AWS_REGION = $env:AWS_REGION ?? "ap-southeast-1",
    
    [Parameter(Mandatory=$true)]
    [string]$AWS_ACCOUNT_ID,
    
    [Parameter(Mandatory=$false)]
    [string]$PROJECT_NAME = $env:PROJECT_NAME ?? "turbo-template",
    
    [Parameter(Mandatory=$false)]
    [string]$WEB_IMAGE_TAG = "latest",
    
    [Parameter(Mandatory=$false)]
    [string]$BACKEND_IMAGE_TAG = "latest",
    
    [Parameter(Mandatory=$false)]
    [switch]$UPDATE_ECS
)

# Generated repository names
$WEB_REPO_NAME = if ($env:ECR_REPO_WEB) { $env:ECR_REPO_WEB } else { "${PROJECT_NAME}-web" }
$BACKEND_REPO_NAME = if ($env:ECR_REPO_BACKEND) { $env:ECR_REPO_BACKEND } else { "${PROJECT_NAME}-backend" }

# ECR URIs
$WEB_ECR_URI = "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${WEB_REPO_NAME}:${WEB_IMAGE_TAG}"
$BACKEND_ECR_URI = "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${BACKEND_REPO_NAME}:${BACKEND_IMAGE_TAG}"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "AWS ECS Build and Push Script" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Region: ${AWS_REGION}" -ForegroundColor White
Write-Host "Account ID: ${AWS_ACCOUNT_ID}" -ForegroundColor White
Write-Host "Project: ${PROJECT_NAME}" -ForegroundColor White
Write-Host "Web Image: ${WEB_ECR_URI}" -ForegroundColor White
Write-Host "Backend Image: ${BACKEND_ECR_URI}" -ForegroundColor White
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Login to ECR
Write-Host "Step 1: Logging into ECR..." -ForegroundColor Yellow
$loginPassword = aws ecr get-login-password --region $AWS_REGION
echo $loginPassword | docker login --username AWS --password-stdin "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com" 2>&1 | Out-Null
Write-Host "✓ ECR login successful" -ForegroundColor Green
Write-Host ""

# Build Docker images
Write-Host "Step 2: Building Docker images..." -ForegroundColor Yellow

# Build web image
Write-Host "Building web image..." -ForegroundColor White
docker build `
  -f apps/web/Dockerfile `
  -t "${WEB_REPO_NAME}:${WEB_IMAGE_TAG}" `
  -t ${WEB_ECR_URI} `
  .
Write-Host "✓ Web image built successfully" -ForegroundColor Green

# Build backend image
Write-Host "Building backend image..." -ForegroundColor White
docker build `
  -f apps/backend/Dockerfile `
  -t "${BACKEND_REPO_NAME}:${BACKEND_IMAGE_TAG}" `
  -t ${BACKEND_ECR_URI} `
  .
Write-Host "✓ Backend image built successfully" -ForegroundColor Green
Write-Host ""

# Push images to ECR
Write-Host "Step 3: Pushing images to ECR..." -ForegroundColor Yellow

# Push web image
Write-Host "Pushing web image..." -ForegroundColor White
docker push ${WEB_ECR_URI}
Write-Host "✓ Web image pushed successfully" -ForegroundColor Green

# Push backend image
Write-Host "Pushing backend image..." -ForegroundColor White
docker push ${BACKEND_ECR_URI}
Write-Host "✓ Backend image pushed successfully" -ForegroundColor Green
Write-Host ""

# Update ECS services (optional)
if ($UPDATE_ECS) {
    Write-Host "Step 4: Updating ECS services..." -ForegroundColor Yellow

    $ECS_CLUSTER = "${PROJECT_NAME}-cluster"
    $ECS_SERVICE_WEB = "${PROJECT_NAME}-web-service"
    $ECS_SERVICE_BACKEND = "${PROJECT_NAME}-backend-service"

    # Update web service
    Write-Host "Updating web service..." -ForegroundColor White
    aws ecs update-service `
      --cluster $ECS_CLUSTER `
      --service $ECS_SERVICE_WEB `
      --force-new-deployment `
      --region $AWS_REGION | Out-Null
    Write-Host "✓ Web service updated" -ForegroundColor Green

    # Update backend service
    Write-Host "Updating backend service..." -ForegroundColor White
    aws ecs update-service `
      --cluster $ECS_CLUSTER `
      --service $ECS_SERVICE_BACKEND `
      --force-new-deployment `
      --region $AWS_REGION | Out-Null
    Write-Host "✓ Backend service updated" -ForegroundColor Green
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Build and push completed successfully!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Web image: ${WEB_ECR_URI}" -ForegroundColor White
Write-Host "Backend image: ${BACKEND_ECR_URI}" -ForegroundColor White
Write-Host ""
