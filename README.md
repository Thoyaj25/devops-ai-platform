# MarketSphere — Cloud-Native E-Commerce Platform

MarketSphere is a cloud-native e-commerce platform built to demonstrate modern **DevOps, Kubernetes, AWS, Terraform, Docker, PostgreSQL, Redis, and AI/RAG** engineering practices.

The project covers the complete application-to-cloud workflow:

```text
Application
    ↓
Docker
    ↓
Amazon ECR
    ↓
Terraform
    ↓
AWS VPC
    ↓
Amazon EKS
    ↓
Kubernetes
    ↓
Application + Worker + Redis
    ↓
PostgreSQL / Neon
```

An accompanying **AI Knowledge Assistant** demonstrates a Retrieval-Augmented Generation (RAG) service using Python.

---

## Architecture

```text
                         Developer
                             │
                             ▼
                         Git / GitHub
                             │
             ┌───────────────┴────────────────┐
             │                                │
             ▼                                ▼
       Next.js Application              AI Knowledge Assistant
             │                                │
             ▼                                ▼
           Docker                         Python / FastAPI
             │                                │
             ▼                                ▼
       Amazon ECR                         RAG Pipeline
             │
             ▼
        Amazon EKS
             │
     ┌───────┼────────┐
     │       │        │
     ▼       ▼        ▼
   App     Worker    Redis
     │       │
     └───────┤
             ▼
      PostgreSQL / Neon
```

---

## Technology Stack

### Application

* Next.js 16
* TypeScript
* Prisma ORM
* PostgreSQL
* Redis
* NextAuth

### Containerization

* Docker
* Docker Compose
* Multi-stage Docker builds

### AWS

* Amazon EKS
* Amazon ECR
* Amazon VPC
* IAM
* EC2-backed EKS Managed Node Groups

### Infrastructure as Code

* Terraform
* Terraform AWS VPC module
* Terraform AWS EKS module

### Kubernetes

* Deployments
* Services
* ConfigMaps / Secrets
* ServiceAccounts
* RBAC
* Horizontal Pod Autoscaler configuration
* Ingress configuration
* Kustomize

### AI

* Python
* FastAPI
* RAG architecture
* FAISS
* AWS Bedrock integration
* Pytest

### Reverse Proxy

* Nginx

---

# Project Structure

```text
marketsphere/
│
├── app/                         # Next.js application
├── prisma/                      # Prisma schema and migrations
├── public/                      # Static assets
├── scripts/                     # Operational scripts
├── worker/                      # Worker entry point
│
├── k8s/
│   ├── base/                    # Base Kubernetes manifests
│   └── overlays/
│       ├── local/               # Local configuration
│       └── aws/                 # AWS/EKS configuration
│
├── terraform/
│   ├── main.tf                  # VPC infrastructure
│   ├── eks.tf                   # EKS infrastructure
│   ├── provider.tf              # AWS provider
│   ├── variables.tf             # Terraform variables
│   ├── outputs.tf               # Terraform outputs
│   ├── versions.tf              # Terraform version
│   └── .terraform.lock.hcl     # Provider dependency lock file
│
├── ai-knowledge-assistant/
│   ├── app/                     # FastAPI/RAG application
│   ├── documents/               # Knowledge documents
│   ├── tests/                   # Python tests
│   ├── Dockerfile
│   └── requirements.txt
│
├── Dockerfile
├── Dockerfile.app
├── Dockerfile.worker
├── docker-compose.yml
├── nginx/
├── package.json
└── README.md
```

---

# Application Components

## 1. Next.js Application

The main MarketSphere application is built with Next.js and TypeScript.

It provides:

* Web application UI
* Authentication
* API routes
* Deployment management
* Project management
* Database integration
* Worker integration

Production build:

```bash
npm run build
```

---

## 2. PostgreSQL

PostgreSQL is used as the primary relational database.

Prisma manages:

* Database schema
* Migrations
* Database access

Migration validation:

```bash
npx prisma migrate status
```

The project currently contains:

```text
15 migrations
```

and the database schema was validated as up to date.

---

## 3. Redis

Redis provides an in-memory data store used by the application and worker components.

Kubernetes service:

```text
marketsphere-redis
```

Port:

```text
6379
```

---

## 4. Deployment Worker

MarketSphere includes a dedicated worker responsible for background deployment-related processing.

The worker:

* Runs independently from the web application
* Uses PostgreSQL
* Uses Redis
* Maintains worker heartbeat information
* Supports deployment job processing

The worker was successfully started and validated on EKS.

---

# Docker

MarketSphere uses separate Docker images for the application and worker.

```text
Dockerfile.app
Dockerfile.worker
```

The architecture separates:

```text
Web Application
       │
       ▼
marketsphere-app

Background Processing
       │
       ▼
marketsphere-worker
```

Docker Compose provides a local multi-service environment containing:

```text
PostgreSQL
Redis
Application
Worker
Nginx
```

Validate the Compose configuration:

```bash
docker compose config --quiet
```

---

# Amazon ECR

Container images are stored in Amazon Elastic Container Registry.

Repositories:

```text
marketsphere-app
marketsphere-worker
```

The EKS workloads were successfully configured to pull the images from ECR.

Example image format:

```text
<account>.dkr.ecr.<region>.amazonaws.com/marketsphere-app:<tag>
```

---

# Terraform Infrastructure

Terraform provisions the AWS infrastructure required by MarketSphere.

The configuration uses:

```text
Terraform
    │
    ├── VPC module
    │
    └── EKS module
```

### VPC

CIDR:

```text
10.20.0.0/16
```

The VPC configuration includes:

* Public subnets
* Private subnets
* DNS hostnames
* DNS support
* Kubernetes subnet tagging

### EKS

The EKS configuration uses:

```text
Kubernetes 1.33
```

and an EKS managed node group using:

```text
t3.small
```

Terraform validation:

```bash
terraform fmt -check -recursive
terraform validate
```

Both validations passed successfully.

> **Cost-control note:** The Terraform configuration describes the intended infrastructure architecture. The live AWS environment was intentionally scaled down after validation to avoid unnecessary AWS charges.

---

# Kubernetes

The application is deployed to Kubernetes using Kustomize.

Main namespace:

```text
marketsphere
```

Workloads:

```text
marketsphere-app
marketsphere-worker
marketsphere-redis
```

Services:

```text
marketsphere-app
marketsphere-redis
```

The AWS overlay can be rendered using:

```bash
kubectl kustomize k8s/overlays/aws
```

The Kubernetes manifests were successfully rendered and validated.

---

# Kubernetes Runtime Validation

During EKS testing, the following components successfully ran:

```text
marketsphere-app       Running
marketsphere-worker    Running
marketsphere-redis     Running
```

Internal service connectivity was verified with:

```bash
kubectl run marketsphere-test \
  -n marketsphere \
  --rm -it \
  --restart=Never \
  --image=curlimages/curl \
  -- curl -sS -I http://marketsphere-app
```

The application returned:

```text
HTTP/1.1 200 OK
```

This verified Kubernetes service discovery and application connectivity inside the cluster.

---

# AI Knowledge Assistant

The project also contains an independent Python-based AI Knowledge Assistant.

Architecture:

```text
User Query
    ↓
FastAPI
    ↓
Document Retrieval
    ↓
FAISS
    ↓
Relevant Context
    ↓
LLM / AWS Bedrock
    ↓
Generated Response
```

Technology:

* Python
* FastAPI
* FAISS
* AWS Bedrock
* Pytest

Run tests:

```bash
cd ai-knowledge-assistant

source .venv/bin/activate

pytest -q
```

Validation result:

```text
28 passed
```

---

# Testing and Validation

The project was validated across multiple layers.

### Python

```bash
pytest -q
```

Result:

```text
28 passed
```

### TypeScript

```bash
npm run typecheck
```

Result:

```text
Passed
```

### Production Build

```bash
npm run build
```

Result:

```text
Compiled successfully
Finished TypeScript
Generating static pages
Finalizing page optimization
```

### Prisma

```bash
npx prisma migrate status
```

Result:

```text
15 migrations found
Database schema is up to date
```

### Docker Compose

```bash
docker compose config --quiet
```

Result:

```text
Valid configuration
```

### Kubernetes

```bash
kubectl kustomize k8s/overlays/aws
```

Result:

```text
Successful rendering
```

### Terraform

```bash
terraform fmt -check -recursive
terraform validate
```

Result:

```text
Configuration is valid
```

### Git

The repository is maintained on GitHub with a clean working tree and synchronized `main` branch.

---

# Deployment Flow

The intended deployment workflow is:

```text
1. Develop application
       ↓
2. Run tests
       ↓
3. Build Next.js application
       ↓
4. Build Docker images
       ↓
5. Push images to Amazon ECR
       ↓
6. Provision AWS infrastructure with Terraform
       ↓
7. Configure EKS
       ↓
8. Deploy Kubernetes manifests
       ↓
9. Kubernetes schedules:
       ├── Application
       ├── Worker
       └── Redis
       ↓
10. Application connects to PostgreSQL
       ↓
11. Validate application health
```

---

# Local Development

## Prerequisites

Install:

* Node.js
* npm
* Docker
* Docker Compose
* PostgreSQL client/tools if required
* Terraform
* AWS CLI
* kubectl
* Python 3.14

---

## Install dependencies

```bash
npm install
```

---

## Configure environment

Copy the example environment file:

```bash
cp .env.example .env
```

Configure the required environment variables according to the deployment environment.

Do not commit `.env` files or credentials to Git.

---

## Run locally

```bash
npm run dev
```

Application:

```text
http://localhost:3000
```

---

# Docker Compose

Start the local service stack:

```bash
docker compose up -d
```

Check services:

```bash
docker compose ps
```

Stop services:

```bash
docker compose down
```

---

# Kubernetes Deployment

Render the AWS manifests:

```bash
kubectl kustomize k8s/overlays/aws
```

Apply them to a configured cluster:

```bash
kubectl apply -k k8s/overlays/aws
```

Check workloads:

```bash
kubectl get pods -n marketsphere
```

Check services:

```bash
kubectl get svc -n marketsphere
```

---

# AWS / EKS Operations

Check the cluster:

```bash
aws eks describe-cluster \
  --name marketsphere-dev-eks \
  --region us-east-1
```

Configure kubectl:

```bash
aws eks update-kubeconfig \
  --region us-east-1 \
  --name marketsphere-dev-eks
```

Check nodes:

```bash
kubectl get nodes
```

Check MarketSphere workloads:

```bash
kubectl get pods -n marketsphere
```

---

# Cost-Controlled AWS State

After completing the EKS runtime validation, the environment was intentionally reduced to minimize AWS costs.

Current cost-control approach:

```text
EKS control plane
       │
       ├── Cluster retained
       │
       └── Worker node capacity
               ↓
              0
```

MarketSphere deployments were scaled to zero after validation:

```text
marketsphere-app       0 replicas
marketsphere-worker    0 replicas
marketsphere-redis     0 replicas
```

The NAT Gateway was also removed.

This means the project is **not currently serving the application from EKS**. The EKS environment was validated first and then intentionally placed into a cost-controlled state.

> Do not run `terraform apply` against the current AWS environment without reviewing the plan first. The committed Terraform configuration describes infrastructure including a NAT Gateway and a one-node EKS managed node group, while the live environment was intentionally scaled down for cost control.

---

# Security Practices

The project follows several basic security practices:

* Secrets are supplied through environment variables/Kubernetes Secrets.
* `.env` files are excluded from Git.
* AWS credentials are not stored in source code.
* Container images are stored in ECR.
* Kubernetes worker access uses IAM permissions.
* Kubernetes workloads use dedicated service accounts where required.
* Terraform state and local Terraform directories are excluded from Git.

Never commit:

```text
.env
AWS access keys
AWS secret keys
database passwords
API keys
private keys
Kubernetes secret values
Terraform state containing sensitive data
```

---

# DevOps Skills Demonstrated

This project demonstrates practical experience with:

### Cloud

* AWS
* VPC
* EKS
* ECR
* IAM
* EC2

### Infrastructure as Code

* Terraform
* Modular infrastructure
* Terraform validation
* Infrastructure configuration management

### Containers

* Docker
* Multi-stage builds
* Docker Compose
* Amazon ECR

### Kubernetes

* EKS
* Deployments
* Services
* Secrets
* RBAC
* ServiceAccounts
* Kustomize
* HPA configuration
* Ingress configuration

### Application Operations

* Next.js
* TypeScript
* Prisma
* PostgreSQL
* Redis
* Background workers
* Nginx

### AI / GenAI

* RAG
* FAISS
* FastAPI
* AWS Bedrock
* Python
* Automated testing

### Troubleshooting

The project involved practical troubleshooting of:

* Docker networking
* PostgreSQL connectivity
* DNS IPv4/IPv6 resolution
* Prisma database connectivity
* Kubernetes scheduling
* EKS node groups
* ECR image pulling
* Kubernetes service connectivity
* HPA metrics availability
* Terraform state/configuration
* AWS resource and cost management

---

# Project Status

## Core implementation

```text
Application                 ✅ Complete
Database                    ✅ Validated
Redis                       ✅ Validated
Worker                      ✅ Validated
Docker                      ✅ Validated
Amazon ECR                  ✅ Validated
Kubernetes                  ✅ Validated
Amazon EKS                  ✅ Runtime validated
Terraform                   ✅ Validated
AI Knowledge Assistant     ✅ 28 tests passed
Git repository              ✅ Clean and synchronized
Documentation               ✅ Complete
```

## Current runtime state

```text
EKS Cluster                 🟢 Retained
EKS Worker Nodes            ⏸️ Scaled to 0
MarketSphere Pods           ⏸️ Scaled to 0
NAT Gateway                 ❌ Deleted
Public Application Endpoint ❌ Not currently active
```

The application was successfully deployed and tested on EKS before the environment was scaled down for AWS cost control.

---

# Future Enhancements

The following are possible future improvements but are **not required for the current project**:

* GitHub Actions CI/CD pipeline
* Prometheus and Grafana monitoring
* Metrics Server for Kubernetes HPA
* AWS Load Balancer Controller
* Public ALB endpoint
* HTTPS/TLS automation
* Centralized logging with Loki
* Argo CD GitOps deployment
* Production-grade secrets management
* Automated infrastructure deployment

These can be added later without changing the core architecture.

---

# Key Portfolio Statement

**MarketSphere is a cloud-native e-commerce platform demonstrating end-to-end DevOps implementation using Docker, Amazon ECR, Terraform, Kubernetes, Amazon EKS, PostgreSQL, Redis, and Python-based RAG/GenAI services. The infrastructure and workloads were deployed and validated on AWS, including successful Kubernetes application connectivity and background worker execution, followed by deliberate cost-controlled shutdown of runtime resources.**
