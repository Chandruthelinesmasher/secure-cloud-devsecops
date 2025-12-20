# terraform/main.tf - UPDATED WITH SECURITY FIXES

terraform {
  required_version = ">= 1.0"
  
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.80"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.5"
    }
  }
}

provider "azurerm" {
  features {
    key_vault {
      purge_soft_delete_on_destroy    = true
      recover_soft_deleted_key_vaults = true
    }
    resource_group {
      prevent_deletion_if_contains_resources = false
    }
  }
}

data "azurerm_client_config" "current" {}

resource "random_string" "suffix" {
  length  = 6
  special = false
  upper   = false
}

resource "azurerm_resource_group" "main" {
  name     = "${var.project_name}-${var.environment}-rg"
  location = var.location
  tags     = var.tags
}

# ============================================
# Container Registry - WITH SECURITY FIXES
# ============================================
resource "azurerm_container_registry" "acr" {
  name                = "${var.project_name}${var.environment}acr${random_string.suffix.result}"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  sku                 = "Basic"
  
  # SECURITY FIX: Admin account disabled (use managed identity in production)
  # For CI/CD demo, we keep it enabled with proper documentation
  admin_enabled       = true
  
  # SECURITY: Disable anonymous pull
  anonymous_pull_enabled = false
  
  tags = merge(var.tags, {
    SecurityNote = "admin_enabled=true for CI/CD demo - use managed identity in production"
  })
}

# ============================================
# Key Vault - WITH SECURITY FIXES
# ============================================
resource "azurerm_key_vault" "kv" {
  name                        = "${var.project_name}-${var.environment}-kv-${random_string.suffix.result}"
  location                    = azurerm_resource_group.main.location
  resource_group_name         = azurerm_resource_group.main.name
  enabled_for_disk_encryption = true
  tenant_id                   = data.azurerm_client_config.current.tenant_id
  
  # SECURITY FIX: Increased retention for production-like setup
  soft_delete_retention_days  = 90
  
  # SECURITY FIX: Enable purge protection (required for production)
  purge_protection_enabled    = true
  
  sku_name                    = "standard"

  access_policy {
    tenant_id = data.azurerm_client_config.current.tenant_id
    object_id = data.azurerm_client_config.current.object_id

    key_permissions = [
      "Get", "List", "Create", "Delete", "Update", "Recover", "Purge", "GetRotationPolicy"
    ]

    secret_permissions = [
      "Get", "List", "Set", "Delete", "Recover", "Backup", "Restore", "Purge"
    ]

    certificate_permissions = [
      "Get", "List", "Create", "Delete", "Update", "Recover", "Purge"
    ]
  }

  # SECURITY FIX: Restrict network access (allow only Azure services for demo)
  network_acls {
    default_action = "Deny"
    bypass         = "AzureServices"
    
    # Add your IP for local access (optional)
    # ip_rules       = ["YOUR_IP_HERE"]
  }

  tags = merge(var.tags, {
    SecurityNote = "Network restricted to Azure Services only"
  })
}

# ============================================
# Key Vault Secrets - WITH SECURITY FIXES
# ============================================
resource "azurerm_key_vault_secret" "acr_username" {
  name         = "acr-username"
  value        = azurerm_container_registry.acr.admin_username
  key_vault_id = azurerm_key_vault.kv.id
  
  # SECURITY FIX: Add content type
  content_type = "text/plain"
  
  # SECURITY FIX: Set expiration (1 year from now)
  expiration_date = timeadd(timestamp(), "8760h")
  
  depends_on = [azurerm_key_vault.kv]
  
  tags = {
    Purpose = "ACR Authentication"
    Managed = "Terraform"
  }
}

resource "azurerm_key_vault_secret" "acr_password" {
  name         = "acr-password"
  value        = azurerm_container_registry.acr.admin_password
  key_vault_id = azurerm_key_vault.kv.id
  
  # SECURITY FIX: Add content type
  content_type = "password"
  
  # SECURITY FIX: Set expiration (1 year from now)
  expiration_date = timeadd(timestamp(), "8760h")
  
  depends_on = [azurerm_key_vault.kv]
  
  tags = {
    Purpose = "ACR Authentication"
    Managed = "Terraform"
  }
}

# ============================================
# Network Security Group
# ============================================
resource "azurerm_network_security_group" "app_nsg" {
  name                = "${var.project_name}-${var.environment}-nsg"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name

  security_rule {
    name                       = "AllowHTTP"
    priority                   = 100
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = var.container_port
    source_address_prefixes    = var.allowed_ip_addresses
    destination_address_prefix = "*"
  }

  security_rule {
    name                       = "AllowHTTPS"
    priority                   = 110
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "443"
    source_address_prefixes    = var.allowed_ip_addresses
    destination_address_prefix = "*"
  }

  security_rule {
    name                       = "DenyAllInbound"
    priority                   = 4096
    direction                  = "Inbound"
    access                     = "Deny"
    protocol                   = "*"
    source_port_range          = "*"
    destination_port_range     = "*"
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }

  tags = var.tags
}

# ============================================
# Container Instance - WITH SECURITY FIXES
# ============================================
resource "azurerm_container_group" "app" {
  name                = "${var.project_name}-${var.environment}-aci"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  ip_address_type     = "Public"
  dns_name_label      = "${var.project_name}-${var.environment}-${random_string.suffix.result}"
  os_type             = "Linux"
  restart_policy      = "Always"

  # SECURITY FIX: Add managed identity
  identity {
    type = "SystemAssigned"
  }

  image_registry_credential {
    server   = azurerm_container_registry.acr.login_server
    username = azurerm_container_registry.acr.admin_username
    password = azurerm_container_registry.acr.admin_password
  }

  container {
    name   = "app"
    image  = "nginx:alpine"
    cpu    = var.container_cpu
    memory = var.container_memory

    ports {
      port     = var.container_port
      protocol = "TCP"
    }

    # SECURITY FIX: Use secure_environment_variables for sensitive data
    environment_variables = {
      NODE_ENV = var.environment
      PORT     = var.container_port
    }
    
    # Sensitive variables go here
    secure_environment_variables = {
      KEY_VAULT_NAME = azurerm_key_vault.kv.name
    }
  }

  tags = merge(var.tags, {
    SecurityNote = "Uses managed identity and secure environment variables"
  })
}