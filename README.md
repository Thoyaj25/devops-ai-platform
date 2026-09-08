# MarketSphere — Cloud-Native DevOps Control Plane

MarketSphere is a cloud-native platform designed to demonstrate modern **DevOps, cloud infrastructure, containerization, Kubernetes, CI/CD, database, caching, and AI/RAG engineering practices**.

The project provides an end-to-end workflow for managing projects, pipelines, deployments, environments, background deployment jobs, and operational state through a Next.js-based DevOps control plane.

A companion **AI Knowledge Assistant** demonstrates a Python-based Retrieval-Augmented Generation (RAG) architecture using FAISS and AWS Bedrock.

---

## Table of Contents

* [Overview](#overview)
* [Architecture](#architecture)
* [Technology Stack](#technology-stack)
* [Core Components](#core-components)
* [Project Structure](#project-structure)
* [Application](#application)
* [Authentication and Authorization](#authentication-and-authorization)
* [Database](#database)
* [Redis](#redis)
* [Deployment Worker](#deployment-worker)
* [Pipelines](#pipelines)
* [Deployment Jobs](#deployment-jobs)
* [Docker](#docker)
* [Amazon ECR](#amazon-ecr)
* [Kubernetes](#kubernetes)
* [Terraform](#terraform)
* [AWS Infrastructure](#aws-infrastructure)
* [AI Knowledge Assistant](#ai-knowledge-assistant)
* [Local Development](#local-development)
* [Testing and Validation](#testing-and-validation)
* [Production Validation](#production-validation)
* [Current Infrastructure State](#current-infrastructure-state)
* [Security](#security)
* [Troubleshooting](#troubleshooting)
* [DevOps Skills Demonstrated](#devops-skills-demonstrated)
* [Project Status](#project-status)
* [Future Enhancements](#future-enhancements)
* [Portfolio Summary](#portfolio-summary)

---

# Overview

MarketSphere demonstrates how a modern application can be developed, containerized, validated, and deployed using cloud-native DevOps practices.

The primary application uses:

* Next.js
* TypeScript
* Prisma
* PostgreSQL
* Redis
* Docker
* Kubernetes
* Terraform
* AWS

The platform includes functionality for:

* Project management
* Environment management
* Pipeline management
* Deployment management
* Background deployment jobs
* Worker processing
* Authentication
* Role-based authorization
* Audit logging
* Operational health checks
* Queue/deployment metrics

The project was also deployed and runtime-tested on Amazon EKS during development. After successful validation, the AWS runtime infrastructure was reduced/removed to control costs.

---

# Architecture

## Application Architecture

```text
                         Developer
                            |
                            v
                       Git / GitHub
                            |
                            v
                    MarketSphere Platform
                            |
              +-------------+-------------+
              |                           |
              v                           v
        Next.js Web App             Background Worker
              |                           |
              |                           |
              +-------------+-------------+
                            |
                +-----------+-----------+
                |                       |
                v                       v
           PostgreSQL                Redis
                |
                v
        Application Data
```

---

## Cloud Deployment Architecture

The AWS deployment architecture used during runtime validation was:

```text
                    Developer
                        |
                        v
                   Git / GitHub
                        |
                        v
                 Docker Images
                        |
                        v
                   Amazon ECR
                        |
                        v
                 Amazon EKS
                        |
             +----------+----------+
             |          |          |
             v          v          v
          App        Worker      Redis
             |          |
             +----------+
                  |
                  v
             PostgreSQL
```

The EKS environment was successfully used for runtime validation and Kubernetes connectivity testing.

The AWS runtime environment was subsequently reduced/removed as part of cost control.

---

# Technology Stack

## Application

* Next.js 16
* TypeScript
* Prisma ORM
* PostgreSQL 16
* Redis
* NextAuth
* Node.js

## Containerization

* Docker
* Docker Compose
* Multi-stage Docker builds
* Separate application and worker images

## AWS

* Amazon EKS
* Amazon ECR
* Amazon VPC
* IAM
* EC2-backed EKS Managed Node Groups

## Infrastructure as Code

* Terraform
* Terraform AWS VPC module
* Terraform AWS EKS module

## Kubernetes

* Kubernetes Deployments
* Services
* ConfigMaps
* Secrets
* ServiceAccounts
* RBAC
* Kustomize
* HPA configuration
* Ingress configuration

## AI / GenAI

* Python
* FastAPI
* RAG
* FAISS
* AWS Bedrock
* Pytest

## Reverse Proxy

* Nginx

---

# Core Components

MarketSphere consists of several major application components:

```text
MarketSphere
|
+-- Web Application
|
+-- REST API
|
+-- Authentication
|
+-- Project Management
|
+-- Environment Management
|
+-- Pipeline Management
|
+-- Deployment Management
|
+-- Deployment Job Processing
|
+-- Background Worker
|
+-- PostgreSQL
|
+-- Redis
|
+-- Kubernetes Infrastructure
|
+-- Terraform Infrastructure
|
+-- AI Knowledge Assistant
```

---

# Project Structure

The repository is organized approximately as follows:

```text
marketsphere/
|
+-- src/
|   |
|   +-- app/
|   |   |
|   |   +-- api/
|   |   +-- dashboard/
|   |   +-- projects/
|   |   +-- login/
|   |   +-- ...
|   |
|   +-- components/
|   +-- services/
|   |   |
|   |   +-- pipeline/
|   |   +-- metrics/
|   |   +-- deployment/
|   |   +-- ...
|   |
|   +-- lib/
|   +-- types/
|
+-- prisma/
|   +-- schema.prisma
|   +-- migrations/
|
+-- public/
|
+-- scripts/
|
+-- worker/
|
+-- k8s/
|   |
|   +-- base/
|   |
|   +-- overlays/
|       |
|       +-- local/
|       +-- aws/
|
+-- terraform/
|   |
|   +-- main.tf
|   +-- eks.tf
|   +-- provider.tf
|   +-- variables.tf
|   +-- outputs.tf
|   +-- versions.tf
|   +-- ...
|
+-- ai-knowledge-assistant/
|   |
|   +-- app/
|   +-- documents/
|   +-- tests/
|   +-- Dockerfile
|   +-- requirements.txt
|
+-- nginx/
|
+-- Dockerfile
+-- Dockerfile.app
+-- Dockerfile.worker
+-- docker-compose.yml
+-- package.json
+-- README.md
```

---

# Application

The main MarketSphere application is built using **Next.js and TypeScript**.

The application provides:

* Web UI
* Authentication
* API routes
* Project management
* Environment management
* Pipeline management
* Deployment management
* Deployment job tracking
* Worker integration
* Database integration
* Operational health endpoints

The production application is deployed through Vercel.

The production deployment was validated with:

```bash
curl -s -o /dev/null -w "%{http_code}\n" <production-endpoint>
```

The application returned HTTP 200 for the public application endpoints.

---

# Authentication and Authorization

MarketSphere implements authenticated access to protected application resources.

Authentication is handled through **NextAuth**.

Protected resources include APIs such as:

```text
/api/projects
/api/pipelines
/api/dashboard/overview
```

Unauthenticated requests are rejected with:

```text
HTTP 401 Unauthorized
```

Protected dashboard routes redirect unauthenticated users to the login page.

The platform also includes role/permission checks for protected operations such as pipeline creation and deployment-related actions.

---

# Database

PostgreSQL is the primary relational database.

Prisma is used for:

* Schema management
* Database access
* Migrations
* Type-safe queries

Check migration status:

```bash
npx prisma migrate status
```

The database schema was validated as up to date during project testing.

The project contains multiple Prisma migrations covering the application's evolving data model.

Important entities include concepts such as:

```text
User
Project
Environment
Pipeline
Deployment
DeploymentJob
AuditLog
```

The exact schema should always be treated as the source of truth in:

```text
prisma/schema.prisma
```

---

# Redis

Redis provides in-memory data storage for application and background-worker functionality.

The Kubernetes service used during EKS validation was:

```text
marketsphere-redis
```

Default Redis port:

```text
6379
```

Redis was successfully deployed and validated as part of the Kubernetes runtime environment.

---

# Deployment Worker

MarketSphere includes a dedicated background worker for deployment-related processing.

The worker runs independently from the web application.

Responsibilities include:

* Processing deployment jobs
* Maintaining worker state/heartbeat information
* Communicating with PostgreSQL
* Communicating with Redis
* Processing background tasks
* Handling deployment job states

The deployment worker was successfully executed and validated during the EKS runtime testing phase.

The project also includes logic to prevent deployment operations when the worker is offline.

---

# Pipelines

MarketSphere includes pipeline management functionality.

The backend provides authenticated pipeline APIs for:

* Listing pipelines
* Retrieving pipeline information
* Creating pipelines
* Validating project access
* Applying role-based permissions
* Recording audit information

Pipeline information includes fields such as:

```text
Name
Provider
Repository
Project
Branch
Build Command
Deploy Command
```

Project-level pipeline functionality is implemented through the project management interface.

The top-level dashboard Pipelines page is currently a lightweight placeholder and should not be considered a fully featured standalone pipeline management console.

---

# Deployment Jobs

Deployment processing is represented using deployment job states.

The job lifecycle includes states such as:

```text
PENDING
    |
    v
RUNNING
    |
    +---------> FAILED
    |
    +---------> COMPLETED

Cancellation flow:

RUNNING
    |
    v
CANCEL_REQUESTED
    |
    v
CANCELLED
```

This allows the platform to track the lifecycle of background deployment operations.

Queue metrics are also available through the application service layer.

Tracked states include:

```text
Pending
Running
Completed
Failed
```

---

# Docker

MarketSphere uses separate Docker images for the web application and worker.

```text
Dockerfile.app
Dockerfile.worker
```

The architecture separates:

```text
Web Application
       |
       v
marketsphere-app

Background Processing
       |
       v
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

Start the local stack:

```bash
docker compose up -d
```

Check running services:

```bash
docker compose ps
```

Stop the stack:

```bash
docker compose down
```

---

# Amazon ECR

During the AWS deployment phase, container images were stored in Amazon Elastic Container Registry.

The intended repositories are:

```text
marketsphere-app
marketsphere-worker
```

Typical ECR image format:

```text
<account-id>.dkr.ecr.<region>.amazonaws.com/marketsphere-app:<tag>
```

The EKS workloads successfully pulled the required images from ECR during runtime validation.

---

# Kubernetes

MarketSphere contains Kubernetes manifests organized using Kustomize.

Primary namespace:

```text
marketsphere
```

Main workloads:

```text
marketsphere-app
marketsphere-worker
marketsphere-redis
```

Main services:

```text
marketsphere-app
marketsphere-redis
```

The manifests include Kubernetes resources for:

* Deployments
* Services
* ConfigMaps
* Secrets
* ServiceAccounts
* RBAC
* HPA configuration
* Ingress configuration

---

## Render Kubernetes Manifests

Render the AWS overlay:

```bash
kubectl kustomize k8s/overlays/aws
```

This validates that the Kustomize configuration can be rendered successfully.

---

## Apply Kubernetes Manifests

Only apply the manifests when a valid Kubernetes cluster is intentionally available:

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

Check deployments:

```bash
kubectl get deployments -n marketsphere
```

---

# Kubernetes Runtime Validation

During the AWS/EKS validation phase, the following workloads successfully reached a running state:

```text
marketsphere-app
marketsphere-worker
marketsphere-redis
```

Internal Kubernetes service connectivity was also tested.

Example:

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

This validated:

* Kubernetes scheduling
* Pod startup
* Service discovery
* Internal networking
* Application availability inside the cluster

These results describe the **historical EKS runtime validation phase**, not the current live AWS state.

---

# Terraform

Terraform is used to define the AWS infrastructure architecture.

The Terraform configuration uses:

```text
Terraform
    |
    +-- VPC
    |
    +-- EKS
    |
    +-- Managed Node Group
```

Terraform modules include:

```text
terraform-aws-modules/vpc/aws
terraform-aws-modules/eks/aws
```

The configured Kubernetes version during EKS implementation was:

```text
1.33
```

The configured EKS managed node group used:

```text
t3.small
```

---

## Terraform Validation

Format Terraform files:

```bash
terraform fmt -check -recursive
```

Validate configuration:

```bash
terraform validate
```

Initialize providers and modules:

```bash
terraform init
```

Review infrastructure changes:

```bash
terraform plan
```

Apply infrastructure only after carefully reviewing the plan:

```bash
terraform apply
```

> **Important:** Do not run `terraform apply` merely to reproduce the historical EKS environment. Review the current Terraform state and plan first, particularly because AWS cost control is an explicit project requirement.

---

# AWS Infrastructure

The AWS architecture used during development included:

## VPC

Configured VPC CIDR:

```text
10.20.0.0/16
```

The VPC configuration included:

* Subnets
* Internet Gateway
* DNS support
* DNS hostnames
* Kubernetes subnet tagging

The VPC was successfully provisioned and validated.

---

## EKS

The project previously deployed:

```text
marketsphere-dev-eks
```

in:

```text
us-east-1
```

The EKS environment was used to validate:

* Managed node groups
* Kubernetes scheduling
* ECR image pulling
* Application deployment
* Worker execution
* Redis
* Kubernetes services
* Internal networking

The cluster and workloads were subsequently removed/reduced as part of AWS cost control.

---

# Current AWS Infrastructure State

The current AWS state must be distinguished from the historical EKS validation environment.

The latest verification of the EKS cluster returned:

```text
ResourceNotFoundException
No cluster found for name: marketsphere-dev-eks
```

Therefore:

```text
EKS Cluster                 Not currently present
EKS Worker Nodes            Not currently running
MarketSphere EKS Pods       Not currently running
EKS Runtime                 Previously validated
```

The later Terraform state contained VPC-related resources, including:

```text
VPC
Internet Gateway
Public Subnets
```

The project should therefore **not** describe the current environment as an active EKS deployment.

This distinction is important for both technical accuracy and AWS cost management.

---

# AI Knowledge Assistant

The repository also contains a companion Python-based AI Knowledge Assistant.

It demonstrates a Retrieval-Augmented Generation architecture.

Architecture:

```text
User Query
     |
     v
FastAPI
     |
     v
Document Retrieval
     |
     v
FAISS
     |
     v
Relevant Context
     |
     v
LLM / AWS Bedrock
     |
     v
Generated Response
```

Technology:

* Python
* FastAPI
* FAISS
* AWS Bedrock
* Pytest

Run the tests:

```bash
cd ai-knowledge-assistant

source .venv/bin/activate

pytest -q
```

Validation result:

```text
28 passed
```

The AI Knowledge Assistant is documented as a companion component and is separate from the main MarketSphere web application's production runtime.

---

# Local Development

## Prerequisites

Install the following tools as required by the component being worked on:

* Node.js
* npm
* Docker
* Docker Compose
* Python
* Terraform
* AWS CLI
* kubectl

---

## Install Application Dependencies

```bash
npm install
```

---

## Environment Configuration

Create the local environment file:

```bash
cp .env.example .env
```

Configure the required variables for the local environment.

Typical configuration areas include:

```text
DATABASE_URL
NEXTAUTH_SECRET
NEXTAUTH_URL
ADMIN_USER
ADMIN_PASS
NEXT_PUBLIC_*
```

The exact required variables should be taken from:

```text
.env.example
```

Never commit real credentials or secrets.

---

## Run the Application

```bash
npm run dev
```

The development server normally runs on:

```text
http://localhost:3000
```

---

# Prisma Commands

Generate the Prisma client:

```bash
npx prisma generate
```

Check migration status:

```bash
npx prisma migrate status
```

Create a development migration when schema changes are intentionally made:

```bash
npx prisma migrate dev
```

> Do not create migrations or modify the database schema unless a schema change is intentionally required.

---

# Production Validation

The production application was validated using HTTP smoke tests.

Example:

```bash
curl -I <production-endpoint>
```

Expected:

```text
HTTP 200
```

Health endpoint:

```bash
curl -i <production-endpoint>/api/health
```

Expected response:

```json
{
  "status": "ok",
  "service": "marketsphere-app"
}
```

Protected APIs should reject unauthenticated requests.

Example:

```bash
curl -i <production-endpoint>/api/projects
```

Expected:

```text
HTTP 401
```

Similarly:

```bash
curl -i <production-endpoint>/api/pipelines
```

Expected:

```text
HTTP 401
```

Dashboard routes should redirect unauthenticated users to the login page.

---

# Testing and Validation

MarketSphere was validated at multiple layers.

## Application Linting

```bash
npm run lint
```

Result:

```text
Passed
```

---

## TypeScript

```bash
npm run typecheck
```

Result:

```text
Passed
```

---

## Production Build

```bash
npm run build
```

The production build completed successfully, including:

```text
Compilation
TypeScript validation
Static page generation
Page optimization
```

---

## Prisma

```bash
npx prisma migrate status
```

The database migration state was validated as up to date during project testing.

---

## Docker Compose

```bash
docker compose config --quiet
```

Result:

```text
Valid configuration
```

---

## Kubernetes

```bash
kubectl kustomize k8s/overlays/aws
```

Result:

```text
Successful rendering
```

---

## Terraform

```bash
terraform fmt -check -recursive
terraform validate
```

Result:

```text
Configuration is valid
```

---

## AI Knowledge Assistant

```bash
cd ai-knowledge-assistant
source .venv/bin/activate
pytest -q
```

Result:

```text
28 passed
```

---

## Git

The repository was validated with a clean working tree and synchronized `main` branch during the final project validation.

---

# Monitoring and Observability

The application contains operational metrics functionality, including deployment-job queue metrics.

The service layer tracks values such as:

```text
Pending
Running
Completed
Failed
```

However, the current dashboard monitoring page is intentionally lightweight and is not a complete Prometheus/Grafana observability platform.

The project does **not** currently claim a full production Prometheus/Grafana implementation.

Potential future observability components include:

```text
Prometheus
Grafana
Loki
Metrics Server
CloudWatch
```

---

# Dashboard Scope

The current dashboard contains the core application areas required for the platform.

## Implemented / Functional

* Authentication
* Dashboard routing
* Project management
* Project details
* Environment management
* Deployment history
* Pipeline management at project level
* Deployment forms
* Deployment job processing
* API authentication
* Health checks
* Queue metrics service

## Lightweight / Placeholder Areas

The following top-level dashboard pages are currently placeholders:

```text
Pipelines
Monitoring
Settings
```

They should not be represented as fully implemented enterprise-grade consoles.

The underlying backend capabilities should be treated separately from the current dashboard presentation layer.

---

# Security Practices

The project follows basic security practices including:

* Environment-based secret configuration
* Authentication for protected APIs
* Role-based authorization
* Project access validation
* Audit logging
* Kubernetes Secrets where required
* Dedicated service accounts where required
* IAM-based AWS access
* No hard-coded AWS credentials
* Git exclusion of local secrets
* Terraform state protection

Never commit:

```text
.env
AWS access keys
AWS secret keys
Database passwords
API keys
Private keys
Kubernetes secret values
Sensitive Terraform state
```

---

# Troubleshooting

The project involved troubleshooting several real-world DevOps issues.

## Docker

Investigated:

* Container startup failures
* Service dependencies
* Docker networking
* Port conflicts
* Multi-container communication

Useful commands:

```bash
docker compose ps
docker compose logs
docker compose config
```

---

## PostgreSQL

Investigated:

* Database connectivity
* Prisma connection errors
* Environment configuration
* IPv4/IPv6 connectivity issues

Useful command:

```bash
npx prisma migrate status
```

---

## Kubernetes

Investigated:

* Pod scheduling
* Pod startup
* Service discovery
* Container image pulling
* ECR authentication
* Worker execution
* Redis connectivity
* HPA metrics availability
* Deployment behavior

Useful commands:

```bash
kubectl get pods -A
kubectl get nodes
kubectl describe pod <pod-name> -n marketsphere
kubectl logs <pod-name> -n marketsphere
kubectl get events -n marketsphere
```

---

## Terraform

Investigated:

* Provider initialization
* Module dependencies
* Terraform state
* EKS configuration
* VPC configuration
* Infrastructure validation
* AWS resource lifecycle

Useful commands:

```bash
terraform init
terraform fmt -check -recursive
terraform validate
terraform plan
terraform state list
```

---

## AWS Cost Management

AWS infrastructure was deliberately reduced after successful runtime validation.

Before performing any infrastructure change:

```bash
terraform plan
```

Review:

* EKS resources
* EC2 resources
* NAT Gateway resources
* Load Balancers
* EBS volumes
* Public IP addresses
* Other billable resources

Do not recreate infrastructure solely for demonstration purposes when it is not required.

---

# DevOps Skills Demonstrated

## Cloud

* AWS
* VPC
* EKS
* ECR
* IAM
* EC2

## Infrastructure as Code

* Terraform
* Terraform modules
* Infrastructure validation
* Terraform state management
* AWS resource lifecycle management

## Containers

* Docker
* Multi-stage builds
* Docker Compose
* Amazon ECR

## Kubernetes

* EKS
* Deployments
* Services
* ConfigMaps
* Secrets
* RBAC
* ServiceAccounts
* Kustomize
* HPA configuration
* Ingress configuration

## Application Operations

* Next.js
* TypeScript
* Prisma
* PostgreSQL
* Redis
* Background workers
* Nginx

## CI/CD and Source Control

* Git
* GitHub
* Deployment workflows
* Vercel deployments
* Container image workflows

## AI / GenAI

* Retrieval-Augmented Generation
* FAISS
* FastAPI
* AWS Bedrock
* Python
* Pytest

## Troubleshooting

Practical troubleshooting covered:

* Docker networking
* PostgreSQL connectivity
* DNS resolution
* IPv4/IPv6 connectivity
* Prisma database connectivity
* Kubernetes scheduling
* EKS node groups
* ECR image pulling
* Kubernetes service connectivity
* HPA metrics
* Terraform state
* AWS infrastructure lifecycle
* AWS cost control

---

# Project Status

## Core Application

```text
Next.js Application       ✅ Validated
Authentication            ✅ Validated
Project Management        ✅ Implemented
Environment Management    ✅ Implemented
Pipeline Backend          ✅ Implemented
Deployment Management     ✅ Implemented
Deployment Worker         ✅ Validated
PostgreSQL                ✅ Validated
Redis                     ✅ Validated
Docker                    ✅ Validated
Terraform                 ✅ Validated
Kubernetes Manifests      ✅ Validated
EKS Runtime               ✅ Historically Validated
AI Knowledge Assistant    ✅ 28 Tests Passed
Production Application    ✅ HTTP Smoke Tested
Git Repository            ✅ Clean / Synchronized
```

## Current AWS Runtime

```text
EKS Cluster               ❌ Not currently present
EKS Worker Nodes          ❌ Not currently running
MarketSphere EKS Pods     ❌ Not currently running
EKS Runtime Validation    ✅ Completed previously
VPC Resources             ⚠️ Verify current AWS state
```

The EKS environment was deployed and runtime-tested successfully before being removed/reduced for cost-control purposes.

---

# Cost-Control Policy

MarketSphere was intentionally developed with AWS cost awareness.

The project follows these principles:

1. Do not provision additional EKS nodes unnecessarily.
2. Do not recreate the EKS environment solely for demonstration.
3. Review Terraform plans before applying infrastructure.
4. Remove or avoid unnecessary NAT Gateway, Load Balancer, EC2, and EBS resources.
5. Validate infrastructure locally where possible.
6. Use existing resources rather than creating duplicate infrastructure.
7. Keep AWS runtime resources disabled when they are not required.

This approach allows the project to demonstrate real AWS/Kubernetes experience without unnecessarily increasing cloud costs.

---

# Future Enhancements

The following features are possible future improvements and are **not required for the current project**:

* Full GitHub Actions CI/CD pipeline
* Prometheus integration
* Grafana dashboards
* Loki centralized logging
* Kubernetes Metrics Server
* Production HPA metrics
* AWS Load Balancer Controller
* Public AWS ALB
* HTTPS/TLS automation
* Argo CD GitOps
* AWS Secrets Manager integration
* Automated Terraform deployment
* Advanced pipeline execution UI
* Full monitoring dashboard
* Advanced platform settings UI

These should be treated as future development rather than existing production capabilities.

---

# Recommended Deployment Workflow

The complete intended workflow is:

```text
Developer
    |
    v
Git / GitHub
    |
    v
Application Development
    |
    v
Lint + Typecheck + Tests
    |
    v
Production Build
    |
    v
Docker Build
    |
    v
Amazon ECR
    |
    v
Terraform
    |
    v
AWS Infrastructure
    |
    v
Amazon EKS
    |
    +----------------------+
    |          |           |
    v          v           v
   App       Worker      Redis
    |          |
    +----------+
         |
         v
    PostgreSQL
         |
         v
Application Validation
```

For the current cost-controlled state, the AWS/EKS portion of this workflow is retained as the documented deployment architecture and historical validation path rather than an always-running production environment.

---

# Portfolio Summary

**MarketSphere is a cloud-native DevOps control plane demonstrating end-to-end application and infrastructure engineering using Next.js, TypeScript, PostgreSQL, Redis, Docker, Terraform, Kubernetes, Amazon ECR, and Amazon EKS.**

The project includes:

* Containerized application and worker services
* PostgreSQL persistence
* Redis-backed application infrastructure
* Authentication and authorization
* Project and environment management
* Pipeline management
* Deployment job processing
* Kubernetes manifests using Kustomize
* Terraform-based AWS infrastructure
* Amazon ECR container image workflows
* EKS runtime deployment and validation
* Operational health and queue metrics
* A companion Python RAG/GenAI knowledge assistant using FAISS and AWS Bedrock
* Automated testing and multi-layer validation
* Practical AWS cost-control and infrastructure lifecycle management

The AWS/EKS environment was **successfully deployed and runtime-tested**, including application, worker, Redis, ECR image pulling, Kubernetes service connectivity, and application health validation. After validation, the AWS runtime was deliberately reduced/removed to avoid unnecessary cloud expenditure.

This project demonstrates practical DevOps capabilities across:

```text
Development
    ↓
Source Control
    ↓
Testing
    ↓
Containerization
    ↓
Infrastructure as Code
    ↓
Cloud Infrastructure
    ↓
Kubernetes
    ↓
Application Deployment
    ↓
Operations
    ↓
Troubleshooting
    ↓
Cost Management
```

---

## Final Status

```text
MarketSphere
|
+-- Application              ✅
+-- Authentication           ✅
+-- PostgreSQL               ✅
+-- Redis                    ✅
+-- Worker                   ✅
+-- Docker                   ✅
+-- ECR                      ✅
+-- Kubernetes               ✅
+-- Terraform                ✅
+-- EKS Runtime Validation   ✅
+-- Production Validation    ✅
+-- AI/RAG Assistant         ✅
+-- Automated Testing        ✅
+-- Documentation            ✅
|
+-- Current AWS Runtime      Cost-Controlled / Not Active
```

**MarketSphere is complete as a portfolio-grade DevOps project, with AWS/EKS runtime validation completed and the current cloud runtime intentionally kept inactive for cost control.**
