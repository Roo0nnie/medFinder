# AWS ECS Deployment Guide

This guide provides step-by-step instructions for deploying your Turborepo monorepo to AWS ECS using GitHub Actions CI/CD.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [GitHub Actions Setup](#github-actions-setup)
3. [Infrastructure Setup](#infrastructure-setup)
4. [Deployment Workflow](#deployment-workflow)
5. [Monitoring and Alerts](#monitoring-and-alerts)
6. [Troubleshooting](#troubleshooting)

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
- **Docker**: Install Docker Desktop (for local testing)
- **GitHub Repository**: Your code must be in a GitHub repository
- **Supabase Database**: Have your Supabase PostgreSQL connection string ready

### Configure AWS CLI (Optional)

You can configure AWS CLI locally for testing, but deployments use GitHub Actions credentials:

```bash
aws configure
```

Enter your:
- AWS Access Key ID
- AWS Secret Access Key
- Default region name (e.g., `us-east-1`)
- Default output format (e.g., `json`)

---

## GitHub Actions Setup

### Step 1: Configure GitHub Secrets

1. Navigate to your GitHub repository
2. Go to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add the following secrets:

| Secret Name | Description | Example |
|-------------|---------------|----------|
| `AWS_ACCESS_KEY_ID` | Your AWS access key ID | `AKIAIOSFODNN7EXAMPLE` |
| `AWS_SECRET_ACCESS_KEY` | Your AWS secret access key | `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY` |

**How to get AWS credentials:**
1. Log into AWS Console
2. Go to IAM → Users → Select your user
3. Security credentials tab → Create access key
4. Copy the Access key ID and Secret access key

### Step 2: Configure GitHub Variables

In the same section (Secrets and variables → Actions), click **Variables** → **New repository variable** and add:

| Variable Name | Description | Example |
|---------------|---------------|----------|
| `AWS_REGION` | AWS region for deployment | `us-east-1` |
| `PROJECT_NAME` | Project name prefix for AWS resources | `turbo-template` |
| `AWS_ACCOUNT_ID` | Your AWS account ID (12 digits) | `123456789012` |

**Note**: Get your AWS Account ID from the AWS Console (top right corner, click on account name).

### Step 3: Verify Repository Structure

Ensure your repository has:
- `.github/workflows/infrastructure.yml` - Infrastructure setup workflow
- `.github/workflows/deploy.yml` - Deployment workflow
- `aws/ecs/task-definition-web.json` - Web task definition template
- `aws/ecs/task-definition-backend.json` - Backend task definition template
- `apps/web/Dockerfile` - Web Docker configuration
- `apps/backend/Dockerfile` - Backend Docker configuration

---

## Infrastructure Setup

The infrastructure setup workflow creates all AWS resources automatically. Run this once before your first deployment.

### Run Infrastructure Setup Workflow

1. Navigate to your GitHub repository
2. Click on **Actions** tab
3. Select **Infrastructure Setup** workflow from the left sidebar
4. Click **Run workflow** button
5. Configure options:
   - **Use default branch**: `main`
   - **Create default VPC and subnets**: Select `true` if you don't have existing VPC
6. Click **Run workflow**

The workflow will create:
- VPC and networking (VPC, subnets, route tables, Internet Gateway)
- Security groups (ALB and ECS)
- ECR repositories (`{PROJECT_NAME}-web`, `{PROJECT_NAME}-backend`)
- ECS cluster (`{PROJECT_NAME}-cluster`)
- Application Load Balancer with target groups
- IAM roles (task execution role)
- CloudWatch Log groups

**Estimated time**: 5-10 minutes

### After Infrastructure Setup

Once the workflow completes successfully:

1. Note the ALB DNS name from the workflow summary
2. Update your GitHub variables with these values (workflow will display them):
   ```
   ECR_REPOSITORY_WEB={PROJECT_NAME}-web
   ECR_REPOSITORY_BACKEND={PROJECT_NAME}-backend
   ECS_CLUSTER={PROJECT_NAME}-cluster
   ECS_SERVICE_WEB={PROJECT_NAME}-web-service
   ECS_SERVICE_BACKEND={PROJECT_NAME}-backend-service
   ECS_TASK_DEFINITION_WEB={PROJECT_NAME}-web
   ECS_TASK_DEFINITION_BACKEND={PROJECT_NAME}-backend
   ```

3. Configure AWS Secrets Manager (see [Environment Variables Management](#environment-variables-management))

### Using Existing Infrastructure

If you already have AWS resources set up, you can skip the infrastructure setup. Just configure the GitHub Variables with your existing resource names.

---

## Deployment Workflow

### Automatic Deployment

The deployment workflow triggers automatically on every push to the `production` branch.

**Your workflow:**
1. Push to `main` branch for development
2. Create a pull request from `main` to `production`
3. Merge the pull request to trigger deployment

```mermaid
graph LR
    A[Merge to production] --> B[GitHub Actions Triggered]
    B --> C[Build Docker Images]
    C --> D[Push to ECR]
    D --> E[Update Task Definitions]
    E --> F[Deploy to ECS]
    F --> G[Wait for Stability]
    G --> H[Deployment Complete]
```

### Manual Deployment

To deploy manually without merging:

1. Navigate to **Actions** tab
2. Select **Deploy to AWS ECS** workflow
3. Click **Run workflow**
4. Select branch to deploy (must be `production`)
5. Click **Run workflow**

### Deployment Process

The deployment workflow performs these steps:

1. **Checkout code** - Gets the latest code from your repository
2. **Configure AWS credentials** - Uses secrets to authenticate with AWS
3. **Login to ECR** - Authenticates Docker push
4. **Build Docker images** - Builds web and backend images using BuildKit
5. **Push to ECR** - Pushes images with commit SHA and `latest` tags
6. **Update task definitions** - Creates new revisions with updated image tags
7. **Deploy to ECS** - Updates services with new task definitions
8. **Wait for stability** - Ensures services are healthy before completing

### Image Tagging

Docker images are tagged with:
- Commit SHA (e.g., `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0`)
- `latest` tag (always points to most recent deployment)

This allows for:
- Easy rollbacks to specific commits
- Version tracking and audit trail
- Immutable deployments

### Rollback Strategy

If a deployment causes issues:

**Option 1: Rollback to previous commit**
```bash
# On GitHub, revert production branch to previous commit or cherry-pick a good commit
git checkout production
git revert HEAD
git push origin production
```

**Option 2: Manual rollback via AWS Console**
1. Navigate to ECS → Task definitions
2. Find the previous working revision (lower revision number)
3. Go to ECS Clusters → Your cluster → Service
4. Click "Update"
5. Select the previous task definition revision
6. Click "Update service"

**Option 3: Force redeployment of previous image**
```bash
aws ecs update-service \
  --cluster ${PROJECT_NAME}-cluster \
  --service ${PROJECT_NAME}-web-service \
  --task-definition ${PREVIOUS_TASK_DEF_ARN} \
  --force-new-deployment
```

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

### Check Service Status

**Using AWS CLI**:
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
```

**Using AWS Console**:
- Go to ECS → Clusters → Your cluster
- Click on "Services" or "Tasks" tab

### Monitor Application Load Balancer

**Get ALB DNS name**:
```bash
aws elbv2 describe-load-balancers \
  --names turbo-template-alb \
  --query 'LoadBalancers[0].DNSName' \
  --output text
```

**View ALB metrics** in CloudWatch:
- Go to CloudWatch → Metrics
- Namespace: `AWS/ApplicationELB`
- Metric: `RequestCount`, `TargetResponseTime`, `HTTPCode_Target_4XX_Count`, etc.

### CloudWatch Alarms

The infrastructure setup includes basic monitoring. To add alerts:

1. Go to CloudWatch → Alarms
2. Click "Create alarm"
3. Select metric (e.g., CPU utilization)
4. Configure thresholds and notification method
5. Create alarm

**Recommended alarms**:
- CPU utilization > 80% for 5 minutes
- Memory utilization > 80% for 5 minutes
- Unhealthy task count > 0
- HTTP 5XX error rate > 5%

---

## Environment Variables Management

### Store Secrets in AWS Secrets Manager

The task definitions reference secrets from AWS Secrets Manager. You must create these secrets.

**Web App Secrets**:

1. Navigate to Secrets Manager → Store a new secret
2. Secret type: Other type of secret
3. Secret name: `{PROJECT_NAME}/web/env`
4. Key/value pairs:
   - `DATABASE_URL`: Your Supabase connection string
   - `NEXT_PUBLIC_BETTER_AUTH_URL`: Your auth URL (e.g., `https://your-alb-dns.amazonaws.com`)
   - `BETTER_AUTH_SECRET`: Generate a secure random string
   - `AUTH_SECRET`: Generate another secure random string
   - `BETTER_AUTH_TRUSTED_ORIGINS`: Comma-separated origins (e.g., `https://yourdomain.com`)
5. Next → Configure secret:
   - Secret name: `{PROJECT_NAME}/web/env`
   - Description: Environment variables for web app
6. Next → Configure rotation:
   - Disable automatic rotation (or enable if desired)
7. Click "Store"

**Backend App Secrets**:

1. Store another secret:
   - Secret name: `{PROJECT_NAME}/backend/env`
   - Key/value pairs:
     - `DATABASE_URL`: Your Supabase connection string
     - `BETTER_AUTH_URL`: Your auth URL
     - `GOOGLE_CLIENT_ID`: Your Google OAuth client ID
     - `GOOGLE_CLIENT_SECRET`: Your Google OAuth secret
2. Follow same steps as web

### Generate Secure Secrets

Use these commands to generate secure random strings:

```bash
# Generate AUTH_SECRET
openssl rand -base64 32

# Generate BETTER_AUTH_SECRET
openssl rand -base64 32
```

### Verify Secrets in ECS

After deployment, verify secrets are loaded:

1. Go to ECS → Task definitions
2. Click on the latest revision
3. Expand "Container definitions"
4. Verify secrets are referenced correctly:
   - `arn:aws:secretsmanager:{REGION}:{ACCOUNT_ID}:secret:{PROJECT_NAME}/web/env::DATABASE_URL`

---

## Troubleshooting

### Common Issues

#### 1. Tasks Not Starting

**Symptoms**: Tasks show as "STOPPED" with no running tasks.

**Solutions**:
- Check security groups allow traffic (inbound rules)
- Verify VPC has internet gateway for public subnets
- Check task definition resource limits (CPU/memory)
- Review CloudWatch logs for errors
- Ensure IAM role has required permissions

#### 2. Health Checks Failing

**Symptoms**: Tasks marked as unhealthy.

**Solutions**:
- Verify health check endpoints exist:
  - Web: `GET /`
  - Backend: `GET /health`
- Check health check timeout and interval settings in task definitions
- Ensure application is listening on correct ports (3000/3001)
- Review application logs for errors
- Check if Supabase connection is working

#### 3. Database Connection Issues

**Symptoms**: Application fails to connect to Supabase.

**Solutions**:
- Verify DATABASE_URL in Secrets Manager is correct
- Check VPC has egress to internet (required for Supabase)
- Verify Supabase allows connections from your VPC CIDR
- Check for IP allowlisting in Supabase settings
- Test connection locally using Supabase connection string

#### 4. Load Balancer Not Routing

**Symptoms**: ALB returns 503 errors or DNS doesn't resolve.

**Solutions**:
- Check target group health status in ALB console
- Verify security groups allow traffic from ALB to tasks
- Ensure tasks are in RUNNING state
- Review ALB listener rules for correct routing
- Wait for DNS propagation (up to 5 minutes)
- Verify ALB is in "active" state

#### 5. High CPU/Memory Usage

**Symptoms**: CloudWatch alarms trigger frequently or tasks are slow.

**Solutions**:
- Increase task CPU/memory allocation in task definitions
- Enable auto-scaling for ECS services
- Profile application for performance issues
- Consider using larger Fargate task sizes
- Optimize database queries

#### 6. GitHub Actions Workflow Fails

**Symptoms**: Deployment workflow fails at build or push step.

**Solutions**:
- Verify AWS credentials in GitHub Secrets are correct
- Check AWS user has required permissions
- Ensure GitHub Variables are properly configured
- Review workflow logs for specific error messages
- Check ECR repositories exist
- Verify task definition JSON files are valid

### Useful AWS CLI Commands

```bash
# List all ECS tasks
aws ecs list-tasks --cluster turbo-template-cluster --region us-east-1

# Describe task
aws ecs describe-tasks --cluster turbo-template-cluster --tasks <TASK-ID> --region us-east-1

# Get task logs
aws logs tail /ecs/turbo-template-web --follow --region us-east-1

# Describe service events
aws ecs describe-services \
  --cluster turbo-template-cluster \
  --services web-service \
  --region us-east-1 \
  --query 'services[0].events'

# List CloudWatch alarms
aws cloudwatch describe-alarms --region us-east-1

# Get ALB DNS name
aws elbv2 describe-load-balancers \
  --names turbo-template-alb \
  --query 'LoadBalancers[0].DNSName' \
  --output text \
  --region us-east-1

# Force new deployment
aws ecs update-service \
  --cluster turbo-template-cluster \
  --service web-service \
  --force-new-deployment \
  --region us-east-1

# Get task definition revision
aws ecs describe-task-definition \
  --task-definition turbo-template-web \
  --query 'taskDefinition.revision' \
  --output text
```

### Docker Local Testing

Before deploying to AWS, test locally with Docker:

```bash
# Build web image
docker build -f apps/web/Dockerfile -t turbo-template-web:test .

# Build backend image
docker build -f apps/backend/Dockerfile -t turbo-template-backend:test .

# Run web container
docker run -p 3001:3001 -e DATABASE_URL="your-db-url" turbo-template-web:test

# Run backend container
docker run -p 3000:3000 -e DATABASE_URL="your-db-url" turbo-template-backend:test

# View logs
docker logs -f <CONTAINER_ID>

# Access running container
docker exec -it <CONTAINER_ID> /bin/bash
```

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     GitHub Repository                     │
│                                                         │
│  Main branch (development)                                 │
│  Create PR → Merge to production → Deployment    │
└───────────────────────────┬─────────────────────────────┘
                        │
                        ↓
┌─────────────────────────────────────────────────────────────┐
│                    AWS Account                           │
│                                                         │
│  ┌─────────────────────────────────────────────────┐      │
│  │   Application Load Balancer (ALB)           │      │
│  │   turbo-template-alb                       │      │
│  │   Public DNS: http://xxx.elb.amazonaws.com │      │
│  └──────────────────┬──────────────────────────┘      │
│                     │                                   │
│        ┌────────────┴────────────┐                   │
│        │                          │                   │
│        ↓                          ↓                   │
│  ┌─────────┐              ┌─────────┐              │
│  │Web SVC  │              │Backend  │              │
│  │Service   │              │Service  │              │
│  │Next.js   │              │NestJS   │              │
│  │Port 3001 │              │Port 3000 │              │
│  └────┬────┘              └────┬────┘              │
│       │                          │                   │
│       └──────────┬───────────────┘                   │
│                  ↓                                   │
│         Supabase PostgreSQL (External)                │
│         https://supabase.io                     │
└───────────────────────────────────────────────────────┘
```

### Key Components

- **GitHub Actions**: CI/CD pipeline
- **ECS Cluster**: `{PROJECT_NAME}-cluster` (Fargate)
- **ALB**: `{PROJECT_NAME}-alb` (Application Load Balancer)
- **Services**:
  - `{PROJECT_NAME}-web-service`: Next.js frontend (port 3001)
  - `{PROJECT_NAME}-backend-service`: NestJS API (port 3000)
- **ECR Repositories**:
  - `{PROJECT_NAME}-web`
  - `{PROJECT_NAME}-backend`
- **Database**: Supabase PostgreSQL (external)
- **Secrets Manager**: Environment variables storage

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
- ALB: ~$18/month
- **Total**: ~$89/month

### Cost-Saving Tips

1. **Enable auto-scaling**: Scale down during low traffic
2. **Use smaller task sizes**: Optimize CPU/memory allocation
3. **Schedule-based scaling**: Scale down during off-hours
4. **Use Spot instances**: For non-critical workloads
5. **Monitor and optimize**: Regularly review CloudWatch metrics
6. **Delete unused resources**: Remove unused ECR images, task definition revisions

---

## Security Best Practices

1. **Never hardcode secrets** in Docker images or code
2. **Use AWS Secrets Manager** for environment variables
3. **Enable VPC flow logs** for network monitoring
4. **Use least-privilege IAM roles** for ECS tasks
5. **Enable encryption** for ECR repositories
6. **Regularly rotate secrets** and credentials
7. **Use SSL/TLS** for all communications (add HTTPS listener to ALB)
8. **Implement rate limiting** on ALB
9. **Enable WAF** for DDoS protection (optional)
10. **Regular security updates**: Keep dependencies updated
11. **Scan Docker images**: Enable ECR image scanning on push

---

## Next Steps

1. **Complete GitHub Actions setup** (see [GitHub Actions Setup](#github-actions-setup))
2. **Run Infrastructure Setup workflow** (see [Infrastructure Setup](#infrastructure-setup))
3. **Configure Secrets Manager** (see [Environment Variables Management](#environment-variables-management))
4. **Deploy your application** (automatic on push to main)
5. **Set up monitoring** (see [Monitoring and Alerts](#monitoring-and-alerts))
6. **Configure custom domain** with SSL certificate (optional)
7. **Enable auto-scaling** for production workloads
8. **Set up CI/CD for multiple environments** (staging, production)

---

## Additional Resources

- [AWS ECS Documentation](https://docs.aws.amazon.com/ecs/)
- [AWS Fargate Documentation](https://docs.aws.amazon.com/AmazonECS/latest/userguide/Fargate.html)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Docker Documentation](https://docs.docker.com/)
- [Supabase Documentation](https://supabase.com/docs)
- [Turborepo Documentation](https://turbo.build/repo/docs)

---

## Support

For issues or questions:

1. Check troubleshooting section above
2. Review GitHub Actions logs
3. Review CloudWatch logs
4. Consult AWS documentation
5. Open an issue in the repository
