output "resource_group_name" {
  description = "Name of the Azure resource group"
  value       = azurerm_resource_group.main.name
}

output "container_registry_name" {
  description = "Name of the Azure Container Registry"
  value       = azurerm_container_registry.acr.name
}

output "container_registry_login_server" {
  description = "Login server URL for ACR"
  value       = azurerm_container_registry.acr.login_server
}

output "key_vault_name" {
  description = "Name of the Azure Key Vault"
  value       = azurerm_key_vault.kv.name
}

output "key_vault_uri" {
  description = "URI of the Key Vault"
  value       = azurerm_key_vault.kv.vault_uri
}

output "container_instance_fqdn" {
  description = "Fully qualified domain name of the container instance"
  value       = azurerm_container_group.app.fqdn
}

output "container_instance_ip" {
  description = "Public IP address of the container instance"
  value       = azurerm_container_group.app.ip_address
}

output "app_url" {
  description = "Application URL"
  value       = "http://${azurerm_container_group.app.fqdn}:${var.container_port}"
}

output "health_check_url" {
  description = "Health check endpoint URL"
  value       = "http://${azurerm_container_group.app.fqdn}:${var.container_port}/health"
}

output "deployment_summary" {
  description = "Summary of deployed resources"
  value = {
    resource_group = azurerm_resource_group.main.name
    location       = azurerm_resource_group.main.location
    acr_server     = azurerm_container_registry.acr.login_server
    key_vault      = azurerm_key_vault.kv.name
    app_url        = "http://${azurerm_container_group.app.fqdn}:${var.container_port}"
  }
}