# AWS Deployment Guide

This guide provides comprehensive instructions for deploying your Turborepo monorepo to AWS ECS with staging and production environments using GitHub Actions for secret management.

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Prerequisites](#prerequisites)
- [Initial Setup](#initial-setup)
- [Environment Configuration](#environment-configuration)
- [Deployment Workflow](#deployment-workflow)
- [GitHub Actions Workflows](#github-actions-workflows)
- [Troubleshooting](#troubleshooting)

## Architecture Overview

This deployment uses a three-stage pipeline with separate AWS infrastructure for staging and production. All secrets are managed via GitHub Actions.

```mermaid
graph LR
    subgraph "Git Flow"
        feature[feature/*] -->|PR| dev[dev branch]
        dev -->|auto| staging[staging branch]
        staging -->|merge tested| production[production branch]
    end

    subgraph "Staging AWS Resources"
        staging_cluster[staging-cluster]
        staging_web[staging-web-service]
        staging_backend[staging-backend-service]
        staging_alb[staging-alb]
    end

    subgraph "Production AWS Resources"
        prod_cluster[production-cluster]
        prod_web[production-web-service]
        prod_backend[production-backend-service]
        prod_alb[production-alb]
    end

    subgraph "Secret Management"
        github[GitHub Secrets/Variables] -->|envsubst| taskdefs[ECS Task Definitions]
        taskdefs -->|environment| containers[Docker Containers]
    end

    staging -->|push| staging_cluster
    production -->|push| prod_cluster
```

### Resource Comparison

| Resource Type | Staging | Production |
|---------------|----------|------------|
| ECS Cluster | `${PROJECT_NAME}-staging-cluster` | `${PROJECT_NAME}-production-cluster` |
| ECR Repos | `${PROJECT_NAME}-web-staging`, `${PROJECT_NAME}-backend-staging` | `${PROJECT_NAME}-web`, `${PROJECT_NAME}-backend` |
| ALB | `${PROJECT_NAME}-staging-alb` | `${PROJECT_NAME}-alb` |
| ECS Services | `${PROJECT_NAME}-staging-web-service`, `${PROJECT_NAME}-staging-backend-service` | `${PROJECT_NAME}-web-service`, `${PROJECT_NAME}-backend-service` |
| Task CPU | 256 (0.25 vCPU) | 512 (0.5 vCPU) |
| Task Memory | 512 MB | 1024 MB |

## Prerequisites

Before starting, ensure you have:

1. **AWS Account** with appropriate permissions
2. **GitHub Repository** configured with appropriate permissions
3. **AWS Credentials** (Access Key ID and Secret Access Key)
4. **pnpm** installed locally
5. **Docker** installed locally (for local testing)

### Required AWS Permissions

The AWS credentials used by GitHub Actions need to following permissions:

- ECR: Full access for repositories
- ECS: Full access for clusters, services, and task definitions
- EC2: For creating VPC, subnets, security groups, and ALB
- Elastic Load Balancing: For creating and managing ALBs
- CloudWatch Logs: For creating log groups
- IAM: For creating and managing ECS task execution roles

## Initial Setup

### Step 1: Configure GitHub Secrets and Variables

Add the following to your GitHub repository:

**GitHub Secrets:**

1. Go to `Settings` > `Secrets and variables` > `Actions`
2. Click `New repository secret`
3. Add the following secrets:

| Secret Name | Description |
|-------------|-------------|
| `AWS_ACCESS_KEY_ID` | Your AWS access key ID |
| `AWS_SECRET_ACCESS_KEY` | Your AWS secret access key |

**GitHub Variables:**

1. Go to `Settings` > `Secrets and variables` > `Actions`
2. Click `Variables` tab
3. Click `New repository variable`

#### Common Variables (for both environments):

| Variable Name | Description | Example |
|---------------|-------------|----------|
| `AWS_REGION` | AWS region for deployment | `us-east-1` |
| `PROJECT_NAME` | Project name prefix for resources | `turbo-template` |
| `AWS_ACCOUNT_ID` | Your AWS account ID | `123456789012` |
| `TURBO_TOKEN` | Turbo remote cache token (optional) | - |
| `TURBO_TEAM` | Turbo remote cache team (optional) | - |

#### Production Variables:

| Variable Name | Description | Example |
|---------------|-------------|----------|
| `ECR_REPOSITORY_WEB` | Production web ECR repository | `turbo-template-web` |
| `ECR_REPOSITORY_BACKEND` | Production backend ECR repository | `turbo-template-backend` |
| `ECS_CLUSTER` | Production ECS cluster name | `turbo-template-production-cluster` |
| `ECS_SERVICE_WEB` | Production web service name | `turbo-template-web-service` |
| `ECS_SERVICE_BACKEND` | Production backend service name | `turbo-template-backend-service` |
| `ECS_TASK_DEFINITION_WEB` | Production web task definition | `turbo-template-web` |
| `ECS_TASK_DEFINITION_BACKEND` | Production backend task definition | `turbo-template-backend` |

#### Staging Variables:

| Variable Name | Description | Example |
|---------------|-------------|----------|
| `ECR_REPOSITORY_WEB_STAGING` | Staging web ECR repository | `turbo-template-web-staging` |
| `ECR_REPOSITORY_BACKEND_STAGING` | Staging backend ECR repository | `turbo-template-backend-staging` |
| `ECS_CLUSTER_STAGING` | Staging ECS cluster name | `turbo-template-staging-cluster` |
| `ECS_SERVICE_WEB_STAGING` | Staging web service name | `turbo-template-staging-web-service` |
| `ECS_SERVICE_BACKEND_STAGING` | Staging backend service name | `turbo-template-staging-backend-service` |
| `ECS_TASK_DEFINITION_WEB_STAGING` | Staging web task definition | `turbo-template-web-staging` |
| `ECS_TASK_DEFINITION_BACKEND_STAGING` | Staging backend task definition | `turbo-template-backend-staging` |

### Step 2: Create Staging Infrastructure

1. Go to `Actions` tab in your GitHub repository
2. Select `Infrastructure Setup` workflow
3. Click `Run workflow`
4. Select `staging` as the environment
5. Select `true` for creating VPC (or provide your own)
6. Click `Run workflow`

This will create:
- VPC, subnets, route table, and internet gateway
- Security groups for ALB and ECS
- ECR repositories for web and backend
- CloudWatch log groups
- Application Load Balancer
- ECS cluster
- ECS services for web and backend

**Copy the output values** and update the staging GitHub variables mentioned above.

### Step 3: Create Production Infrastructure

Repeat the same process for production:

1. Run `Infrastructure Setup` workflow
2. Select `production` as the environment
3. Copy the output values
4. Update the production GitHub variables

### Step 4: Configure GitHub Environments

Create GitHub environments for staging and production:

1. Go to `Settings` > `Environments`
2. Click `New environment`
3. Create `staging` environment
4. Create `production` environment
5. (Optional) Add environment protection rules or required reviewers

## Environment Configuration

### Staging Secrets

Add environment-specific secrets to your GitHub repository:

| Secret Name | Description | Example |
|-------------|-------------|----------|
| `DATABASE_URL` | Supabase connection string | `postgres://postgres.xxxxx:password@aws-0.pooler.supabase.com:5432/turbo-template` |
| `BETTER_AUTH_URL` | Better Auth backend URL | `https://staging.example.com/api/auth` |
| `BETTER_AUTH_SECRET` | Better Auth secret | `random-secret-key` |
| `AUTH_SECRET` | NextAuth/Authentication secret | `another-secret-key` |
| `NEXT_PUBLIC_BETTER_AUTH_URL` | Public auth URL (frontend) | `https://staging.example.com` |
| `BETTER_AUTH_TRUSTED_ORIGINS` | Comma-separated trusted origins | `https://staging.example.com,https://example.com` |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | `123456789.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | `GOCSPX-xxxx` |

**Important:** Replace `host.docker.internal` with actual Supabase hostname. `host.docker.internal` only works locally with Docker Desktop.

### Production Secrets

Add production-specific secrets using the same keys but with production values:

| Secret Name | Description | Example |
|-------------|-------------|----------|
| `DATABASE_URL` | Supabase production connection string | `postgres://postgres.xxxxx:prod-password@aws-0.pooler.supabase.com:5432/turbo-template` |
| `BETTER_AUTH_URL` | Better Auth production backend URL | `https://example.com/api/auth` |
| `BETTER_AUTH_SECRET` | Better Auth production secret | `production-secret-key` |
| `AUTH_SECRET` | NextAuth production secret | `production-auth-secret` |
| `NEXT_PUBLIC_BETTER_AUTH_URL` | Production public auth URL | `https://example.com` |
| `BETTER_AUTH_TRUSTED_ORIGINS` | Production trusted origins | `https://example.com` |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | `123456789.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | `GOCSPX-xxxx` |

### Secret Management Strategy

All environment variables and secrets are managed via GitHub Actions:

- **GitHub Secrets** for sensitive data (DATABASE_URL, BETTER_AUTH_SECRET, etc.)
- **GitHub Variables** for non-sensitive configuration (PROJECT_NAME, AWS_REGION, etc.)
- **No AWS Secrets Manager** is used, avoiding additional costs

Secrets are:

1. Defined in GitHub repository as Repository Secrets
2. Exported as environment variables in deployment workflows
3. Substituted into task definitions via `envsubst`
4. Passed to ECS containers as plain environment variables

This approach:
- Eliminates AWS Secrets Manager charges (~$0.40/secret/month)
- Simplifies secret management (one place: GitHub)
- Enables faster deployments (no extra API calls to Secrets Manager)
- Maintains security (GitHub secrets are encrypted and logged)

**Security Note:** GitHub Secrets are accessible to all repository collaborators with write access. This is acceptable for most teams but consider your security requirements.

## Deployment Workflow

### Local Development

```bash
# Create a feature branch
git checkout -b feature/new-feature
git push origin feature/new-feature

# Create a pull request to dev branch
# CI will run automatically on the PR
```

### Dev Branch

When you merge a feature branch to `dev`:
- CI workflow runs (lint, typecheck, test, build)
- No deployment occurs
- Changes are validated but not deployed

### Deploying to Staging

```bash
# Merge dev to staging
git checkout staging
git merge dev
git push origin staging
```

This triggers the [deploy-staging](.github/workflows/deploy-staging.yml) workflow automatically:
1. Builds Docker images for web and backend
2. Pushes images to staging ECR repositories
3. Updates staging task definitions with environment variables from GitHub Secrets
4. Deploys new task definitions to staging ECS services
5. Waits for services to stabilize

### Deploying to Production

```bash
# After testing on staging, merge to production
git checkout production
git merge staging
git push origin production
```

This triggers the [deploy-production](.github/workflows/deploy-production.yml) workflow automatically:
1. Builds Docker images for web and backend
2. Pushes images to production ECR repositories
3. Updates production task definitions with environment variables from GitHub Secrets
4. Deploys new task definitions to production ECS services
5. Waits for services to stabilize

## GitHub Actions Workflows

### 1. CI Workflow ([ci.yml](.github/workflows/ci.yml))

**Triggers:**
- Push to `dev`, `staging`, or `production` branches
- Pull requests (opened, synchronize, reopened)

**Jobs:**
- Typecheck: Runs TypeScript type checking
- Lint: Runs ESLint
- Build: Builds all packages
- Test: Runs tests

**Purpose:** Validates code quality without deploying.

### 2. Staging Deployment Workflow ([deploy-staging.yml](.github/workflows/deploy-staging.yml))

**Triggers:**
- Push to `staging` branch
- Manual workflow dispatch

**Environment:** `staging`

**Steps:**
1. Checkout code
2. Configure AWS credentials
3. Login to ECR
4. Set up Docker Buildx with caching
5. Build and push web image to staging ECR
6. Build and push backend image to staging ECR
7. Set environment variables from GitHub Secrets (DATABASE_URL, BETTER_AUTH_SECRET, etc.)
8. Update web task definition with environment variables
9. Deploy web service to staging ECS
10. Update backend task definition with environment variables
11. Deploy backend service to staging ECS
12. Display deployment summary

### 3. Production Deployment Workflow ([deploy-production.yml](.github/workflows/deploy-production.yml))

**Triggers:**
- Push to `production` branch
- Manual workflow dispatch

**Environment:** `production`

**Steps:** Same as staging, but for production resources.

### 4. Infrastructure Setup Workflow ([infrastructure.yml](.github/workflows/infrastructure.yml))

**Triggers:**
- Manual workflow dispatch

**Inputs:**
- `environment`: Target environment (staging/production)
- `create_vpc`: Whether to create a new VPC (default: true)

**Steps:**
1. Create VPC and networking (if enabled)
2. Create security groups
3. Create IAM roles
4. Create ECR repositories
5. Create CloudWatch log groups
6. Create Application Load Balancer
7. Create ECS cluster
8. Register task definitions
9. Create ECS services
10. Wait for services to stabilize

## Docker Configuration

### Turborepo Optimization

Both Dockerfiles use `turbo prune` to optimize builds for monorepo:

```dockerfile
# Example from apps/web/Dockerfile
FROM base AS prepare
RUN npm install -g turbo
COPY . .
RUN turbo prune @repo/web --docker
```

This ensures:
- Only necessary dependencies are copied
- Minimal layer cache invalidation
- Faster build times
- Smaller final images

### Image Caching

The deployment workflows use Docker Buildx with layer caching:
- Cache is stored in `/tmp/.buildx-cache`
- Cache is restored at the start of each run
- Cache is updated at the end of each run
- Significantly speeds up subsequent builds

## Health Checks

### Web Application

- **Endpoint:** `http://localhost:3001/`
- **Interval:** 30 seconds
- **Timeout:** 10 seconds
- **Retries:** 3
- **Start Period:** 40 seconds

### Backend Application

- **Endpoint:** `http://localhost:3000/health`
- **Interval:** 30 seconds
- **Timeout:** 10 seconds
- **Retries:** 3
- **Start Period:** 40 seconds

Ensure your applications expose these health check endpoints:
- Web: Root path (`/`)
- Backend: `/health` endpoint

## Monitoring

### CloudWatch Logs

Logs are automatically sent to CloudWatch:
- Staging: `/ecs/${PROJECT_NAME}-web-staging`, `/ecs/${PROJECT_NAME}-backend-staging`
- Production: `/ecs/${PROJECT_NAME}-web`, `/ecs/${PROJECT_NAME}-backend`

Log retention is set to 7 days by default.

### ALB Metrics

The Application Load Balancer provides metrics on:
- Request count
- Target response time
- HTTP 4xx errors
- HTTP 5xx errors
- Healthy/unhealthy host count

### ECS Metrics

ECS provides metrics on:
- CPU utilization
- Memory utilization
- Network in/out
- Task counts

## Branch Protection Rules

Configure branch protection for your workflow:

### Dev Branch
- Require pull request reviews
- Require status checks to pass before merging

### Staging Branch
- Require pull request reviews
- Require status checks to pass before merging to production
- Require up-to-date branch before merging

### Production Branch
- Require pull request reviews
- Require status checks to pass before merging
- Require up-to-date branch before merging
- Restrict pushes to maintainers only

## Troubleshooting

### Workflow Fails at AWS Authentication

**Problem:** `Error: Credentials could not be loaded`

**Solution:**
1. Verify `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` are set
2. Check credentials have appropriate IAM permissions
3. Ensure credentials are not expired

### Docker Build Fails

**Problem:** Build fails during `docker buildx build`

**Solution:**
1. Check Dockerfile syntax
2. Verify dependencies are available
3. Try building locally first: `docker build -f apps/web/Dockerfile .`

### ECS Deployment Fails

**Problem:** Service fails to stabilize

**Solution:**
1. Check ECS task logs in CloudWatch
2. Verify health check endpoints are accessible
3. Check security groups allow required traffic
4. Verify task definition has correct resource limits

### Environment Variables Not Found

**Problem:** Environment variables not available in container

**Solution:**
1. Verify GitHub Secrets are set correctly in repository settings
2. Check secret names match task definitions (case-sensitive)
3. Ensure secrets are exported in deployment workflows before envsubst
4. Verify environment variables use `${VAR_NAME}` syntax in task definitions

### Image Pull Errors

**Problem:** `Error: image not found`

**Solution:**
1. Verify ECR repositories exist
2. Check image tags match
3. Ensure images were pushed successfully
4. Verify `IMAGE_TAG` variable is set correctly

### Invalid Supabase Connection String

**Problem:** Application cannot connect to database using `host.docker.internal`

**Solution:**
1. Replace `host.docker.internal` with actual Supabase hostname from your Supabase dashboard
2. Update `DATABASE_URL` secret in GitHub with correct connection string
3. Redeploy application

Example of correct format:
```
postgres://postgres.xxxxx:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:5432/turbo-template
```

## Cost Optimization

### Staging Environment

Staging uses smaller resources to reduce costs:
- 0.25 vCPU instead of 0.5 vCPU
- 512 MB memory instead of 1024 MB
- Single task per service

**Estimated cost:** ~$20-30/month for staging

### Production Environment

Production uses larger resources for better performance:
- 0.5 vCPU
- 1024 MB memory
- Can scale to multiple tasks

**Estimated cost:** ~$40-60/month for production (before scaling)

### Additional Costs

- Application Load Balancer: ~$20/month
- CloudWatch Logs: ~$5-10/month
- NAT Gateway (if used): ~$30/month
- Data Transfer: Variable based on traffic

**Note:** No AWS Secrets Manager charges since using GitHub Secrets instead.

## Security Best Practices

1. **Use separate credentials:** Never use root account credentials
2. **Rotate secrets:** Regularly update AWS access keys and secrets
3. **Least privilege:** Grant minimum required permissions
4. **VPC isolation:** Keep staging and production in separate VPCs or subnets
5. **Enable logging:** Monitor all AWS API calls with CloudTrail
6. **Secure ALB:** Use HTTPS with ACM certificates for production
7. **Secrets management:** Use GitHub Secrets for sensitive data. All secrets are passed via GitHub Actions directly to ECS as environment variables.

## Rollback Procedures

### Quick Rollback

If a deployment breaks production:

```bash
# Revert to previous commit
git checkout production
git revert HEAD
git push origin production

# Or rollback to specific commit
git checkout <previous-sha>
git push origin production --force
```

### ECS Service Rollback

1. Go to ECS console
2. Select the service
3. Click "Update"
4. Select the previous task definition revision
5. Click "Update service"

## Support

For issues or questions:
1. Check CloudWatch logs for errors
2. Review GitHub Actions workflow logs
3. Check ECS events in AWS Console
4. Review this documentation for common issues

## Next Steps

After setup is complete:
1. Test staging deployment with a simple change
2. Verify staging environment is accessible via ALB DNS
3. Test production deployment after staging validation
4. Set up monitoring and alerting
5. Configure domain names with SSL certificates
6. Set up automated backups for databases
