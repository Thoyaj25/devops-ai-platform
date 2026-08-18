variable "aws_region" {
  description = "AWS region for MarketSphere infrastructure"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Project name used for AWS resource naming"
  type        = string
  default     = "marketsphere"
}

variable "environment" {
  description = "Deployment environment"
  type        = string
  default     = "dev"
}

variable "db_password" {
  description = "Master password for the MarketSphere PostgreSQL database"
  type        = string
  sensitive   = true
}
