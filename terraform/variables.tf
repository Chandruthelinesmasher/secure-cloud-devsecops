variable "project_name" {
  description = "Project name used for resource naming"
  type        = string
  default     = "securecloud"
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "dev"
}

variable "location" {
  description = "Azure region for resources"
  type        = string
  default     = "eastus"
}

variable "allowed_ip_addresses" {
  description = "List of allowed IP addresses for NSG"
  type        = list(string)
  default     = ["0.0.0.0/0"]
}

variable "container_port" {
  description = "Container port"
  type        = number
  default     = 3000
}

variable "container_cpu" {
  description = "CPU allocation for container"
  type        = string
  default     = "0.5"
}

variable "container_memory" {
  description = "Memory allocation for container (GB)"
  type        = string
  default     = "1.0"
}

variable "tags" {
  description = "Common tags for all resources"
  type        = map(string)
  default = {
    Project     = "SecureCloud"
    ManagedBy   = "Terraform"
    Environment = "Development"
  }
}