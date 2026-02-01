# AWS ECS Setup Guide

This guide provides step-by-step instructions for setting up AWS infrastructure to deploy your Turborepo monorepo.

## Important: Naming Convention

All AWS resources use the `${PROJECT_NAME}` prefix for naming. This guide uses `turbo-template` as an example - replace this with your actual project name from GitHub Actions configuration.

**Example**: If your `PROJECT_NAME` is `my-ecommerce-app`, all resources will be named:
- ECR repositories: `my-ecommerce-app-web`, `my-ecommerce-app-backend`
- ECS cluster: `my-ecommerce-app-cluster`
- ECS services: `my-ecommerce-app-web-service`, `my-ecommerce-app-backend-service`
- Task definitions: `my-ecommerce-app-web`, `my-ecommerce-app-backend`
- CloudWatch alarms: `my-ecommerce-app-web-cpu-high`, etc.

**Tip**: Configure GitHub Actions variables before following this guide. See [CONFIGURE_GITHUB.md](../CONFIGURE_GITHUB.md) for step-by-step instructions.

## Prerequisites

- AWS Account with Administrator access
- AWS CLI installed and configured
- Docker installed locally
- Supabase PostgreSQL connection string ready

## Phase 1: Create VPC and Networking

### 1.1 Create VPC

1. Navigate to VPC Dashboard in AWS Console
2. Click "Create VPC"
3. Settings:
   - Name tag: `${PROJECT_NAME}-vpc` (e.g., `turbo-template-vpc`)
   - IPv4 CIDR block: `10.0.0.0/16`
   - IPv6 CIDR block: No IPv6 CIDR block
   - Tenancy: Default
4. Click "Create VPC"

**Note**: Replace `${PROJECT_NAME}` with your actual project name from GitHub Actions.

### 1.2 Create Subnets

**Public Subnets:**
1. Navigate to Subnets → Create subnet
2. Create first public subnet:
   - VPC: Select `${PROJECT_NAME}-vpc`
   - Subnet name: `${PROJECT_NAME}-public-subnet-1a`
   - Availability Zone: `ap-southeast-1a` (or your preferred AZ)
   - IPv4 CIDR block: `10.0.1.0/24`
3. Create second public subnet:
   - Name: `${PROJECT_NAME}-public-subnet-1b`
   - AZ: `ap-southeast-1b`
   - CIDR: `10.0.2.0/24`

**Private Subnets:**
1. Create first private subnet:
   - Name: `${PROJECT_NAME}-private-subnet-1a`
   - AZ: `ap-southeast-1a`
   - CIDR: `10.0.3.0/24`
2. Create second private subnet:
   - Name: `${PROJECT_NAME}-private-subnet-1b`
   - AZ: `ap-southeast-1b`
   - CIDR: `10.0.4.0/24`

### 1.3 Create Internet Gateway

1. Navigate to Internet Gateways → Create internet gateway
2. Name: `${PROJECT_NAME}-igw`
3. Attach to VPC: Select `${PROJECT_NAME}-vpc`
4. Click "Create internet gateway"

### 1.4 Create NAT Gateway

1. Navigate to NAT Gateways → Create NAT gateway
2. Settings:
   - Name: `${PROJECT_NAME}-nat-gw`
   - Subnet: Select `${PROJECT_NAME}-public-subnet-1a`
   - Elastic IP allocation: Allocate elastic IP
3. Click "Create NAT gateway" (Note: NAT Gateway incurs hourly charges)

### 1.5 Create Route Tables

**Public Route Table:**
1. Navigate to Route Tables → Create route table
2. Settings:
   - Name: `${PROJECT_NAME}-public-rt`
   - VPC: `${PROJECT_NAME}-vpc`
3. Edit routes → Add route:
   - Destination: `0.0.0.0/0`
   - Target: Internet Gateway → `${PROJECT_NAME}-igw`
4. Edit subnet associations:
   - Associate `${PROJECT_NAME}-public-subnet-1a`
   - Associate `${PROJECT_NAME}-public-subnet-1b`

**Private Route Table:**
1. Create route table:
   - Name: `${PROJECT_NAME}-private-rt`
   - VPC: `${PROJECT_NAME}-vpc`
2. Edit routes → Add route:
   - Destination: `0.0.0.0/0`
   - Target: NAT Gateway → `${PROJECT_NAME}-nat-gw`
3. Edit subnet associations:
   - Associate `${PROJECT_NAME}-private-subnet-1a`
   - Associate `${PROJECT_NAME}-private-subnet-1b`

### 1.6 Create Security Groups

**ALB Security Group:**
1. Navigate to Security Groups → Create security group
2. Settings:
   - Name: `${PROJECT_NAME}-alb-sg`
   - Description: Security group for Application Load Balancer
   - VPC: `${PROJECT_NAME}-vpc`
3. Inbound rules:
   - Type: HTTP, Port: 80, Source: `0.0.0.0/0`
   - Type: HTTPS, Port: 443, Source: `0.0.0.0/0`
4. Outbound rules: All traffic (default)

**ECS Web Security Group:**
1. Create security group:
   - Name: `${PROJECT_NAME}-web-sg`
   - Description: Security group for web ECS tasks
   - VPC: `${PROJECT_NAME}-vpc`
2. Inbound rules:
   - Type: Custom TCP, Port: 3001, Source: `${PROJECT_NAME}-alb-sg`
3. Outbound rules: All traffic (default)

**ECS Backend Security Group:**
1. Create security group:
   - Name: `${PROJECT_NAME}-backend-sg`
   - Description: Security group for backend ECS tasks
   - VPC: `${PROJECT_NAME}-vpc`
2. Inbound rules:
   - Type: Custom TCP, Port: 3000, Source: `${PROJECT_NAME}-alb-sg`
3. Outbound rules: All traffic (default)

---

## Phase 2: Create ECR Repositories

### 2.1 Create Web Repository

**Using AWS Console:**
1. Navigate to Elastic Container Registry (ECR)
2. Click "Create repository"
3. Settings:
   - Repository name: `turbo-template-web`
   - Visibility settings: Private
   - Image tag mutability: Mutable
   - Image scan settings on push: Disabled (optional, enable for security)
4. Click "Create repository"

**Using AWS CLI:**
```bash
aws ecr create-repository \
  --repository-name turbo-template-web \
  --region us-east-1
```

### 2.2 Create Backend Repository

**Using AWS Console:**
1. Click "Create repository" again
2. Settings:
   - Repository name: `turbo-template-backend`
   - Visibility settings: Private
   - Image tag mutability: Mutable
3. Click "Create repository"

**Using AWS CLI:**
```bash
aws ecr create-repository \
  --repository-name turbo-template-backend \
  --region us-east-1
```

### 2.3 Note Repository URIs

After creating repositories, note down the repository URIs:
- `<ACCOUNT-ID>.dkr.ecr.<REGION>.amazonaws.com/turbo-template-web`
- `<ACCOUNT-ID>.dkr.ecr.<REGION>.amazonaws.com/turbo-template-backend`

---

## Phase 3: Create ECS Cluster

### 3.1 Create ECS Cluster

1. Navigate to Amazon ECS → Clusters
2. Click "Create cluster"
3. Select "AWS Fargate (serverless)"
4. Cluster name: `turbo-template-cluster`
5. Cluster configuration:
   - Create VPC: No (use existing)
   - Infrastructure: Create new
6. Networking:
   - VPC: `turbo-template-vpc`
   - Subnets: Select all public subnets
   - Security group: Create new or use existing
   - Public IP: Enabled
7. Monitoring:
   - Enable Container Insights: Yes (recommended)
8. Click "Create"

---

## Phase 4: Create Application Load Balancer

### 4.1 Create ALB

1. Navigate to EC2 → Load Balancers
2. Click "Create load balancer"
3. Select "Application Load Balancer"
4. Basic configuration:
   - Name: `turbo-template-alb`
   - Scheme: internet-facing
   - IP address type: IPv4
5. Network mapping:
   - VPC: `turbo-template-vpc`
   - Mappings: Select all public subnets
6. Security groups:
   - Select `turbo-template-alb-sg`
7. Listeners and routing:
   - Create HTTP listener on port 80
   - Click "Create target group" later
8. Click "Create load balancer"

### 4.2 Create Target Groups

**Web Target Group:**
1. Navigate to Target Groups → Create target group
2. Settings:
   - Target type: IP addresses (for Fargate)
   - Target group name: `tg-web`
   - Protocol: HTTP
   - Port: 3001
   - VPC: `turbo-template-vpc`
3. Health checks:
   - Health check path: `/`
   - Healthy threshold: 2
   - Unhealthy threshold: 2
   - Timeout: 5 seconds
   - Interval: 30 seconds
4. Click "Create target group"

**Backend Target Group:**
1. Create another target group:
   - Target type: IP addresses
   - Target group name: `tg-backend`
   - Protocol: HTTP
   - Port: 3000
   - VPC: `turbo-template-vpc`
2. Health checks:
   - Health check path: `/health`
   - Same thresholds and intervals as web
3. Click "Create target group"

### 4.3 Configure ALB Listeners

**Update ALB HTTP Listener:**
1. Navigate to Load Balancers → Select `turbo-template-alb`
2. Go to Listeners tab → HTTP:80
3. Click "Edit rules"
4. Add rules:
   - Rule 1: Path pattern `/api/*` → Forward to `tg-backend`
   - Rule 2: Default (no path pattern) → Forward to `tg-web`
5. Click "Save changes"

**Add HTTPS Listener (Optional but recommended):**
1. Go to Listeners tab → Add listener
2. Protocol: HTTPS, Port: 443
3. Default action: Forward to `tg-web`
4. For SSL certificate:
   - Select ACM certificate (see Phase 7)
5. Add rules similar to HTTP listener

---

## Phase 5: Create IAM Roles

### 5.1 Create ECS Task Execution Role

1. Navigate to IAM → Roles → Create role
2. Trusted entity:
   - AWS service: Elastic Container Service
   - Use case: Elastic Container Service Task
3. Permissions:
   - Attach policy: `AmazonECSTaskExecutionRolePolicy`
4. Role name: `ecsTaskExecutionRole`
5. Create role

### 5.2 Add Additional Permissions to Task Execution Role

1. Select the `ecsTaskExecutionRole`
2. Click "Add permissions" → "Attach policies"
3. Add inline policy for Secrets Manager:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue",
        "secretsmanager:DescribeSecret"
      ],
      "Resource": [
        "arn:aws:secretsmanager:<REGION>:<ACCOUNT-ID>:secret:turbo-template/web/env*",
        "arn:aws:secretsmanager:<REGION>:<ACCOUNT-ID>:secret:turbo-template/backend/env*"
      ]
    }
  ]
}
```

4. Name the policy: `ecs-task-secrets-access`

---

## Phase 6: Create ECS Services

### 6.1 Register Task Definitions

**Register Web Task Definition:**
1. Navigate to ECS → Task definitions
2. Click "Create new task definition"
3. Select "Fargate"
4. Scroll down and upload the JSON file:
   - File: `aws/ecs/task-definition-web.json`
5. Update placeholders:
   - Replace `<ACCOUNT-ID>` with your AWS account ID
   - Replace `<REGION>` with your AWS region (e.g., `us-east-1`)
6. Click "Create"

**Register Backend Task Definition:**
1. Create another task definition
2. Upload: `aws/ecs/task-definition-backend.json`
3. Update placeholders
4. Click "Create"

### 6.2 Create Web Service

1. Navigate to ECS Clusters → `turbo-template-cluster`
2. Click "Create" → "Service"
3. Configure service:
   - Application type: Task
   - Task definition: `turbo-template-web`
   - Service name: `web-service`
   - Desired tasks: 2
4. Networking:
   - VPC: `turbo-template-vpc`
   - Subnets: Select all public subnets
   - Security group: `turbo-template-web-sg`
   - Public IP: Enabled
5. Load balancing:
   - Load balancer type: Application Load Balancer
   - Load balancer name: `turbo-template-alb`
   - Container to load balance: `web`
   - Container port: 3001
   - Target group: `tg-web`
6. Click "Create service"

### 6.3 Create Backend Service

1. Create another service:
   - Task definition: `turbo-template-backend`
   - Service name: `backend-service`
   - Desired tasks: 2
2. Networking:
   - Same VPC and subnets
   - Security group: `turbo-template-backend-sg`
3. Load balancing:
   - Load balancer: `turbo-template-alb`
   - Container: `backend`
   - Container port: 3000
   - Target group: `tg-backend`
4. Click "Create service"

---

## Phase 7: SSL/TLS Certificate (Optional)

### 7.1 Create ACM Certificate

1. Navigate to AWS Certificate Manager (ACM)
2. Click "Request a certificate"
3. Request a public certificate
4. Domain names:
   - Add your domain (e.g., `yourdomain.com`)
   - Add additional names (e.g., `www.yourdomain.com`, `api.yourdomain.com`)
5. Validation method: DNS validation
6. Click "Request"

### 7.2 Validate Domain

1. After request, click on the certificate
2. Expand "Domain validation"
3. Create CNAME records in your DNS provider:
   - Name: The value shown in "Name"
   - Value: The value shown in "Value"
4. Wait for validation status to change to "Issued"

### 7.3 Add Certificate to ALB HTTPS Listener

1. Navigate to Load Balancers → `turbo-template-alb`
2. Go to Listeners tab
3. Edit HTTPS:443 listener
4. Under "Secure listener settings", select your ACM certificate
5. Save changes

---

## Phase 8: Environment Variables Management

### 8.1 Store Secrets in AWS Secrets Manager

**Web App Secrets:**
1. Navigate to Secrets Manager → Store a new secret
2. Secret type: Other type of secret
3. Secret name: `turbo-template/web/env`
4. Key/value pairs:
   - `DATABASE_URL`: Your Supabase connection string
   - `NEXT_PUBLIC_BETTER_AUTH_URL`: Your auth URL
   - `BETTER_AUTH_SECRET`: Your auth secret
   - `AUTH_SECRET`: Your auth secret
   - `BETTER_AUTH_TRUSTED_ORIGINS`: Comma-separated origins
5. Next → Configure secret:
   - Secret name: `turbo-template/web/env`
   - Description: Environment variables for web app
6. Next → Configure rotation:
   - Disable automatic rotation (optional)
7. Click "Store"

**Backend App Secrets:**
1. Store another secret:
   - Secret name: `turbo-template/backend/env`
   - Key/value pairs:
     - `DATABASE_URL`: Your Supabase connection string
     - `BETTER_AUTH_URL`: Your auth URL
     - `GOOGLE_CLIENT_ID`: Your Google OAuth client ID
     - `GOOGLE_CLIENT_SECRET`: Your Google OAuth secret
2. Follow same steps as web

---

## Next Steps

After completing AWS infrastructure setup:

1. Build and push Docker images to ECR (see `scripts/build-and-push.sh`)
2. Update task definitions with actual ECR URIs
3. Deploy ECS services
4. Configure DNS (Route 53 or your DNS provider)
5. Set up monitoring and alarms (CloudWatch)
6. (Optional) Set up CI/CD pipeline

---

## Troubleshooting

### Common Issues

1. **Tasks not starting**: Check security groups allow traffic
2. **Health checks failing**: Verify health check endpoints exist
3. **Database connection issues**: Ensure VPC has egress to internet
4. **Load balancer not routing**: Check target group health status

### Useful Commands

```bash
# Check ECS service status
aws ecs describe-services --cluster turbo-template-cluster --services web-service backend-service

# View task logs
aws logs tail /ecs/turbo-template-web --follow
aws logs tail /ecs/turbo-template-backend --follow

# List ECR images
aws ecr describe-images --repository-name turbo-template-web

# Force new deployment
aws ecs update-service --cluster turbo-template-cluster --service web-service --force-new-deployment
```
