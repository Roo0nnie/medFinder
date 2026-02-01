# GitHub Actions Configuration Guide

This guide explains how to configure GitHub Actions variables and secrets to deploy your Turborepo monorepo to AWS ECS.

## Overview

When you fork this template, you need to configure GitHub Actions with your AWS credentials and project-specific settings. This keeps sensitive data secure and makes the template reusable.

## Required Configuration

You need to configure two types of values in GitHub Actions:

1. **Variables** - Non-sensitive configuration (visible to collaborators)
2. **Secrets** - Sensitive data like API keys (private)

---

## Step 1: Add GitHub Actions Variables

These are configuration values that are not secrets.

### 1.1 Navigate to Settings

1. Go to your GitHub repository
2. Click **Settings** tab
3. Click **Secrets and variables** on the left sidebar
4. Click **Variables** tab
5. Click **New repository variable**

### 1.2 Required Variables

Add these variables one at a time:

| Variable Name | Description | Example Value |
|--------------|-------------|---------------|
| `PROJECT_NAME` | Your project name (used for resource naming) | `my-awesome-app` |
| `AWS_REGION` | AWS region where your resources are deployed | `ap-southeast-1` |
| `AWS_ACCOUNT_ID` | Your 12-digit AWS account ID | `123456789012` |

#### How to Find Your AWS Account ID

1. Login to [AWS Console](https://console.aws.amazon.com/)
2. Click your account name/number in the top right
3. Select **My Security Credentials**
4. Scroll down to **Account identifiers**
5. Your Account ID is the 12-digit number (e.g., `123456789012`)

#### AWS Regions

| Region Name | Code |
|-------------|-------|
| Philippines (Singapore) | `ap-southeast-1` |
| Philippines (Jakarta) | `ap-southeast-3` |
| US East (N. Virginia) | `us-east-1` |
| US West (Oregon) | `us-west-2` |
| Europe (London) | `eu-west-2` |

### 1.3 Optional Variables

These have automatic defaults based on `PROJECT_NAME`. Only set if you need custom names:

| Variable Name | Description | Default Value |
|--------------|-------------|---------------|
| `ECR_REPOSITORY_WEB` | ECR repository name for web app | `${PROJECT_NAME}-web` |
| `ECR_REPOSITORY_BACKEND` | ECR repository name for backend | `${PROJECT_NAME}-backend` |
| `ECS_CLUSTER` | ECS cluster name | `${PROJECT_NAME}-cluster` |
| `ECS_SERVICE_WEB` | ECS service name for web | `${PROJECT_NAME}-web-service` |
| `ECS_SERVICE_BACKEND` | ECS service name for backend | `${PROJECT_NAME}-backend-service` |
| `ECS_TASK_DEFINITION_WEB` | Task definition family for web | `${PROJECT_NAME}-web` |
| `ECS_TASK_DEFINITION_BACKEND` | Task definition family for backend | `${PROJECT_NAME}-backend` |

**Recommendation**: Skip optional variables to use default naming conventions.

---

## Step 2: Add GitHub Secrets

These are sensitive values that should never be visible in plain text.

### 2.1 Navigate to Secrets

1. Go to your GitHub repository
2. Click **Settings** tab
3. Click **Secrets and variables** on the left sidebar
4. Click **Secrets** tab
5. Click **New repository secret**

### 2.2 Required Secrets

Add these secrets one at a time:

| Secret Name | Description | Example Value |
|-------------|-------------|---------------|
| `AWS_ACCESS_KEY_ID` | AWS access key ID | `AKIAIOSFODNN7EXAMPLE` |
| `AWS_SECRET_ACCESS_KEY` | AWS secret access key | `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY` |

#### How to Create AWS Access Keys

1. Login to [AWS Console](https://console.aws.amazon.com/)
2. Search for **IAM**
3. Click **Users** on the left sidebar
4. Click **Create access key** (or select existing user)
5. Click the user name → **Security credentials** tab
6. Click **Create access key**
7. Choose **Application running outside AWS**
8. Click **Create access key**
9. **IMPORTANT**: Download the CSV file immediately (you can only download it once!)
10. Copy the values from the CSV file

**Security Note**: Never share these keys in GitHub issues, pull requests, or any public channel.

---

## Step 3: Verify Configuration

Before deploying, verify your configuration:

### 3.1 Check Variables

1. Go to Settings → Secrets and variables → Variables
2. Verify all required variables are present
3. Check values are correct

### 3.2 Check Secrets

1. Go to Settings → Secrets and variables → Secrets
2. Verify both AWS secrets are present
3. Make sure they're not visible (should show `***` instead of actual values)

---

## Step 4: Test Locally (Optional)

Before deploying, you can test locally with environment variables:

```bash
# On macOS/Linux
export PROJECT_NAME="my-awesome-app"
export AWS_REGION="ap-southeast-1"
export AWS_ACCOUNT_ID="123456789012"
./scripts/generate-config.sh

# Or run build script directly
AWS_ACCOUNT_ID=123456789012 PROJECT_NAME=my-awesome-app ./scripts/build-and-push.sh
```

On Windows PowerShell:

```powershell
$env:PROJECT_NAME = "my-awesome-app"
$env:AWS_REGION = "ap-southeast-1"
.\scripts\generate-config.ps1

# Or run build script
.\scripts\build-and-push.ps1 -AWS_ACCOUNT_ID "123456789012" -PROJECT_NAME "my-awesome-app"
```

---

## Step 5: Deploy

Once configured, deployment is automatic:

### Automatic Deployment

Push to `main` branch:
```bash
git add .
git commit -m "Update configuration"
git push origin main
```

This triggers the GitHub Actions workflow automatically.

### Manual Deployment

You can also trigger manually:
1. Go to **Actions** tab in your repository
2. Select **Deploy to AWS ECS** workflow
3. Click **Run workflow**
4. Select branch (usually `main`)
5. Click **Run workflow**

---

## Common Issues

### Issue: Workflow Fails with "variable not found"

**Solution**: Make sure you've set all required variables:
- `PROJECT_NAME`
- `AWS_REGION`
- `AWS_ACCOUNT_ID`

### Issue: AWS authentication fails

**Solution**: Verify secrets are correct:
1. Check `AWS_ACCESS_KEY_ID` starts with `AKIAI...`
2. Check `AWS_SECRET_ACCESS_KEY` is a long string (~40 characters)
3. Try generating new keys in AWS IAM

### Issue: GitHub Actions shows "vars.* not supported"

**Solution**: This happens on older GitHub repositories. The workflow is designed to use the newer `vars.*` syntax which requires GitHub Enterprise or updated repositories.

For older repos:
1. Update the workflow to use `env.*` instead
2. Pass variables explicitly through GitHub Actions

---

## Example: Complete Configuration

For a project called "my-ecommerce-app" in Philippines:

### Variables:
- `PROJECT_NAME`: `my-ecommerce-app`
- `AWS_REGION`: `ap-southeast-1`
- `AWS_ACCOUNT_ID`: `123456789012`
- (Optional variables skipped - using defaults)

### Secrets:
- `AWS_ACCESS_KEY_ID`: `AKIAIOSFODNN7EXAMPLE`
- `AWS_SECRET_ACCESS_KEY`: `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY`

### Resulting Resources:
- ECR repositories: `my-ecommerce-app-web`, `my-ecommerce-app-backend`
- ECS cluster: `my-ecommerce-app-cluster`
- ECS services: `my-ecommerce-app-web-service`, `my-ecommerce-app-backend-service`
- Task definitions: `my-ecommerce-app-web`, `my-ecommerce-app-backend`
- CloudWatch alarms: `my-ecommerce-app-web-cpu-high`, etc.

---

## Security Best Practices

1. **Never** commit secrets to git
2. **Always** use GitHub Secrets for sensitive data
3. **Regularly** rotate AWS access keys (recommended every 90 days)
4. **Grant** minimum required permissions to IAM user
5. **Monitor** AWS CloudTrail for suspicious activity
6. **Use** separate AWS accounts for dev/staging/prod

---

## Next Steps

After configuring GitHub Actions:

1. Follow [DEPLOYMENT.md](DEPLOYMENT.md) for complete deployment guide
2. Follow [aws/setup-guide.md](aws/setup-guide.md) for AWS infrastructure setup
3. Push to `main` branch to trigger deployment
4. Monitor deployment in Actions tab

---

## Need Help?

- Check [DEPLOYMENT.md](DEPLOYMENT.md) troubleshooting section
- Review [GitHub Actions documentation](https://docs.github.com/en/actions)
- Check AWS CloudWatch logs for deployment errors
