# AWS ECS Deployment Guide

This guide provides step-by-step instructions for deploying your Turborepo monorepo to AWS ECS.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Start](#quick-start)
3. [AWS Infrastructure Setup](#aws-infrastructure-setup)
4. [Building and Pushing Images](#building-and-pushing-images)
5. [Deploying to ECS](#deploying-to-ecs)
6. [CI/CD Pipeline](#cicd-pipeline)
7. [Monitoring and Alerts](#monitoring-and-alerts)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before deploying to AWS, ensure you have:

- **AWS Account**: Create an AWS account with Administrator access
- **AWS CLI**: Install and configure AWS CLI
  ```bash
  # On Windows
  winget install awscli
  
  # On macOS
  brew install awscli
  
  # On Linux
  sudo apt-get install awscli
  ```
- **Docker**: Install Docker Desktop
- **Supabase Database**: Have your Supabase PostgreSQL connection string ready

### Configure AWS CLI

```bash
aws configure
```

Enter your:
- AWS Access Key ID
- AWS Secret Access Key
- Default region name (e.g., `us-east-1`)
- Default output format (e.g., `json`)

---

## Quick Start

For a quick deployment without manual infrastructure setup:

1. **Set up environment variables**:
   ```bash
   export AWS_ACCOUNT_ID="your-aws-account-id"
   export AWS_REGION="us-east-1"
   ```

2. **Build and push images**:
   ```bash
   # On Windows PowerShell
   .\scripts\build-and-push.ps1 -AWS_ACCOUNT_ID $env:AWS_ACCOUNT_ID
   
   # On macOS/Linux
   chmod +x scripts/build-and-push.sh
   AWS_ACCOUNT_ID=123456789012 ./scripts/build-and-push.sh
   ```

3. **Follow the AWS Console setup guide**:
   - See [aws/setup-guide.md](aws/setup-guide.md) for detailed steps

---

## AWS Infrastructure Setup

### Option 1: Manual Setup (Recommended for first-time users)

Follow the detailed guide in [aws/setup-guide.md](aws/setup-guide.md) to set up:
- VPC and networking
- ECR repositories
- ECS cluster
- Application Load Balancer
- Target groups and listeners
- IAM roles
- ECS services
- SSL certificates (optional)

### Option 2: AWS CDK (Infrastructure as Code)

For automated infrastructure provisioning, use AWS CDK. This requires additional setup but provides reproducible deployments.

---

## Building and Pushing Images

### Prerequisites

Make sure you have:
1. Created ECR repositories (see setup guide)
2. Configured AWS CLI with appropriate permissions

### Build and Push Script

The project includes build scripts for both Windows and Unix-based systems:

#### Windows (PowerShell)

```powershell
# Basic usage
.\scripts\build-and-push.ps1 -AWS_ACCOUNT_ID "123456789012"

# With custom region
.\scripts\build-and-push.ps1 -AWS_ACCOUNT_ID "123456789012" -AWS_REGION "us-west-2"

# With custom image tags
.\scripts\build-and-push.ps1 -AWS_ACCOUNT_ID "123456789012" -WEB_IMAGE_TAG "v1.0.0" -BACKEND_IMAGE_TAG "v1.0.0"

# Build and update ECS services
.\scripts\build-and-push.ps1 -AWS_ACCOUNT_ID "123456789012" -UPDATE_ECS
```

#### macOS/Linux (Bash)

```bash
# Make script executable
chmod +x scripts/build-and-push.sh

# Basic usage
AWS_ACCOUNT_ID=123456789012 ./scripts/build-and-push.sh

# With custom region
AWS_REGION=us-west-2 AWS_ACCOUNT_ID=123456789012 ./scripts/build-and-push.sh

# With custom image tags
WEB_IMAGE_TAG=v1.0.0 BACKEND_IMAGE_TAG=v1.0.0 AWS_ACCOUNT_ID=123456789012 ./scripts/build-and-push.sh

# Build and update ECS services
UPDATE_ECS=true AWS_ACCOUNT_ID=123456789012 ./scripts/build-and-push.sh
```

### What the Script Does

1. **Logs into ECR** using AWS CLI
2. **Builds Docker images** for web and backend apps
3. **Tags images** with ECR repository URIs
4. **Pushes images** to ECR
5. **Optionally updates** ECS services (with `-UPDATE_ECS` flag)

### Manual Build and Push (Alternative)

If you prefer to build manually:

```bash
# Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 123456789012.dkr.ecr.us-east-1.amazonaws.com

# Build web image
docker build -f apps/web/Dockerfile -t 123456789012.dkr.ecr.us-east-1.amazonaws.com/turbo-template-web:latest .

# Build backend image
docker build -f apps/backend/Dockerfile -t 123456789012.dkr.ecr.us-east-1.amazonaws.com/turbo-template-backend:latest .

# Push images
docker push 123456789012.dkr.ecr.us-east-1.amazonaws.com/turbo-template-web:latest
docker push 123456789012.dkr.ecr.us-east-1.amazonaws.com/turbo-template-backend:latest
```

---

## Deploying to ECS

### Update Task Definitions

After pushing new images, update your ECS task definitions:

1. **Navigate to ECS Console**:
   - Go to ECS → Task definitions

2. **Create new task definition revision**:
   - Click on the task definition family
   - Click "Create new revision"
   - Update the image URI with the new tag
   - Click "Create"

3. **Update the service**:
   - Go to ECS Clusters → turbo-template-cluster
   - Click on the service (web-service or backend-service)
   - Click "Update"
   - Select the new task definition revision
   - Click "Update service"

### Force New Deployment

To force a new deployment without changing the task definition:

```bash
# Update web service
aws ecs update-service \
  --cluster turbo-template-cluster \
  --service web-service \
  --force-new-deployment \
  --region us-east-1

# Update backend service
aws ecs update-service \
  --cluster turbo-template-cluster \
  --service backend-service \
  --force-new-deployment \
  --region us-east-1
```

### Check Service Status

```bash
# Describe services
aws ecs describe-services \
  --cluster turbo-template-cluster \
  --services web-service backend-service \
  --region us-east-1

# List tasks
aws ecs list-tasks \
  --cluster turbo-template-cluster \
  --service-name web-service \
  --region us-east-1

# Describe tasks
aws ecs describe-tasks \
  --cluster turbo-template-cluster \
  --tasks <TASK-ID> \
  --region us-east-1
```

---

## CI/CD Pipeline

The project includes a GitHub Actions workflow for automated deployments.

### Setup

1. **Add AWS credentials to GitHub Secrets**:
   - Go to your GitHub repository → Settings → Secrets and variables → Actions
   - Add the following secrets:
     - `AWS_ACCESS_KEY_ID`: Your AWS access key
     - `AWS_SECRET_ACCESS_KEY`: Your AWS secret key

2. **Push to main branch**:
   - The workflow triggers automatically on push to `main`

3. **Manual trigger**:
   - Go to Actions tab in GitHub
   - Select "Deploy to AWS ECS" workflow
   - Click "Run workflow"

### Workflow Features

- **Multi-platform builds**: Uses Docker Buildx for efficient builds
- **Layer caching**: Caches Docker layers for faster builds
- **Parallel deployments**: Deploys web and backend simultaneously
- **Health checks**: Waits for service stability before completing
- **Image tagging**: Uses git SHA for version tracking

### Customize Workflow

Edit `.github/workflows/deploy.yml` to customize:
- AWS region
- ECR repository names
- ECS cluster name
- Service names
- Environment variables

---

## Monitoring and Alerts

### View Logs

**Using AWS CLI**:
```bash
# Tail web logs
aws logs tail /ecs/turbo-template-web --follow --region us-east-1

# Tail backend logs
aws logs tail /ecs/turbo-template-backend --follow --region us-east-1

# View last 100 lines
aws logs tail /ecs/turbo-template-web --since 1h --region us-east-1
```

**Using AWS Console**:
- Go to CloudWatch → Log groups
- Select `/ecs/turbo-template-web` or `/ecs/turbo-template-backend`

### Set Up CloudWatch Alarms

Run the alarm setup script:

```bash
# Make script executable
chmod +x aws/monitoring/create-alarms.sh

# Run script
AWS_ACCOUNT_ID=123456789012 ./aws/monitoring/create-alarms.sh
```

This creates:
- CPU utilization alarms (>80%)
- Memory utilization alarms (>80%)
- Unhealthy task count alarms
- ALB error rate alarms (4xx and 5xx)

### Subscribe to Alerts

1. After running the script, note the SNS topic ARN
2. Subscribe your email to receive notifications:
   ```bash
   aws sns subscribe \
     --topic-arn <SNS_TOPIC_ARN> \
     --protocol email \
     --notification-endpoint your-email@example.com \
     --region us-east-1
   ```
3. Confirm your email subscription

---

## Troubleshooting

### Common Issues

#### 1. Tasks Not Starting

**Symptoms**: Tasks show as "STOPPED" with no running tasks.

**Solutions**:
- Check security groups allow traffic
- Verify VPC has internet gateway for public subnets
- Check task definition resource limits (CPU/memory)
- Review CloudWatch logs for errors

#### 2. Health Checks Failing

**Symptoms**: Tasks marked as unhealthy.

**Solutions**:
- Verify health check endpoints exist:
  - Web: `GET /`
  - Backend: `GET /health`
- Check health check timeout and interval settings
- Ensure application is listening on correct ports (3000/3001)
- Review application logs for errors

#### 3. Database Connection Issues

**Symptoms**: Application fails to connect to Supabase.

**Solutions**:
- Verify DATABASE_URL in Secrets Manager is correct
- Check VPC has egress to internet (required for Supabase)
- Verify Supabase allows connections from your VPC CIDR
- Check for any IP allowlisting in Supabase settings

#### 4. Load Balancer Not Routing

**Symptoms**: ALB returns 503 errors.

**Solutions**:
- Check target group health status
- Verify security groups allow traffic from ALB to tasks
- Ensure tasks are in RUNNING state
- Review ALB listener rules for correct routing

#### 5. High CPU/Memory Usage

**Symptoms**: CloudWatch alarms trigger frequently.

**Solutions**:
- Increase task CPU/memory allocation
- Enable auto-scaling for ECS services
- Profile application for performance issues
- Consider using larger Fargate task sizes

### Useful AWS CLI Commands

```bash
# List all ECS tasks
aws ecs list-tasks --cluster turbo-template-cluster --region us-east-1

# Describe task
aws ecs describe-tasks --cluster turbo-template-cluster --tasks <TASK-ID> --region us-east-1

# Get task logs
aws logs tail /ecs/turbo-template-web --follow --region us-east-1

# Describe service events
aws ecs describe-services --cluster turbo-template-cluster --services web-service --region us-east-1 --query 'services[0].events'

# List CloudWatch alarms
aws cloudwatch describe-alarms --region us-east-1

# Get ALB metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/ApplicationELB \
  --metric-name RequestCount \
  --dimensions Name=LoadBalancer,Value=turbo-template-alb \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%SZ) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%SZ) \
  --period 300 \
  --statistics Sum

# Restart service
aws ecs update-service \
  --cluster turbo-template-cluster \
  --service web-service \
  --force-new-deployment \
  --region us-east-1
```

### Docker Local Testing

Before deploying to AWS, test locally with Docker Compose:

```bash
# Build images
docker-compose build

# Start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Rollback Deployment

If a deployment causes issues:

1. **Identify the previous image tag** in ECR
2. **Update task definition** with previous image
3. **Force new deployment**:
   ```bash
   aws ecs update-service \
     --cluster turbo-template-cluster \
     --service web-service \
     --task-definition <PREVIOUS_TASK_DEF_ARN> \
     --force-new-deployment \
     --region us-east-1
   ```

---

## Architecture Overview

```
Internet
    ↓
Application Load Balancer (ALB)
    ├── / → Web Service (Next.js)
    └── /api/* → Backend Service (NestJS)
        ↓
    Supabase PostgreSQL (External)
```

### Key Components

- **ECS Cluster**: `turbo-template-cluster` (Fargate)
- **ALB**: `turbo-template-alb` (Application Load Balancer)
- **Services**:
  - `web-service`: Next.js frontend (port 3001)
  - `backend-service`: NestJS API (port 3000)
- **ECR Repositories**:
  - `turbo-template-web`
  - `turbo-template-backend`
- **Database**: Supabase PostgreSQL (external)

---

## Cost Optimization

### Fargate Pricing

Fargate pricing is based on:
- **vCPU hours**: $0.04048 per vCPU-hour (us-east-1)
- **Memory hours**: $0.004445 per GB-hour (us-east-1)

**Estimated monthly cost** (running 2 tasks each, 24/7):
- Web: 2 × 0.5 vCPU × 24h × 30d = 720 vCPU-hours = $29.15
- Web: 2 × 1 GB × 24h × 30d = 1440 GB-hours = $6.40
- Backend: 2 × 0.5 vCPU × 24h × 30d = 720 vCPU-hours = $29.15
- Backend: 2 × 1 GB × 24h × 30d = 1440 GB-hours = $6.40
- **Total**: ~$71/month (excluding ALB, ECR, etc.)

### Cost-Saving Tips

1. **Enable auto-scaling**: Scale down during low traffic
2. **Use smaller task sizes**: Optimize CPU/memory allocation
3. **Schedule-based scaling**: Scale down during off-hours
4. **Use Spot instances**: For non-critical workloads
5. **Monitor and optimize**: Regularly review CloudWatch metrics

---

## Security Best Practices

1. **Never hardcode secrets** in Docker images or code
2. **Use AWS Secrets Manager** for environment variables
3. **Enable VPC flow logs** for network monitoring
4. **Use least-privilege IAM roles** for ECS tasks
5. **Enable encryption** for ECR repositories
6. **Regularly rotate secrets** and credentials
7. **Use SSL/TLS** for all communications
8. **Implement rate limiting** on the ALB
9. **Enable WAF** for DDoS protection (optional)
10. **Regular security updates**: Keep dependencies updated

---

## Next Steps

1. **Complete AWS infrastructure setup** (see [aws/setup-guide.md](aws/setup-guide.md))
2. **Build and push Docker images** (see [Building and Pushing Images](#building-and-pushing-images))
3. **Deploy to ECS** (see [Deploying to ECS](#deploying-to-ecs))
4. **Set up monitoring** (see [Monitoring and Alerts](#monitoring-and-alerts))
5. **Configure CI/CD** (see [CI/CD Pipeline](#cicd-pipeline))
6. **Set up custom domain** with SSL certificate
7. **Enable auto-scaling** for production workloads

---

## Additional Resources

- [AWS ECS Documentation](https://docs.aws.amazon.com/ecs/)
- [AWS Fargate Documentation](https://docs.aws.amazon.com/AmazonECS/latest/userguide/Fargate.html)
- [Docker Documentation](https://docs.docker.com/)
- [Supabase Documentation](https://supabase.com/docs)
- [Turborepo Documentation](https://turbo.build/repo/docs)

---

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review CloudWatch logs
3. Consult AWS documentation
4. Open an issue in the repository
