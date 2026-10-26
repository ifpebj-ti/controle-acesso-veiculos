output "homologation_compartment_id" {
  description = "Dedicated compartment OCID. Keep in restricted deployment records."
  value       = oci_identity_compartment.homologation.id
  sensitive   = true
}

output "instance_id" {
  description = "Compute instance OCID. Keep in restricted deployment records."
  value       = oci_core_instance.application.id
  sensitive   = true
}

output "load_balancer_public_ip" {
  description = "WAF-protected public endpoint for the approved DNS record. Do not publish in issues or logs."
  value       = oci_load_balancer_load_balancer.edge.ip_address_details[0].ip_address
  sensitive   = true
}

output "instance_private_ip" {
  description = "Private target address used by OCI Bastion."
  value       = oci_core_instance.application.private_ip
  sensitive   = true
}

output "bastion_id" {
  description = "OCI Bastion OCID used to create temporary sessions."
  value       = oci_bastion_bastion.homologation.id
  sensitive   = true
}

output "selected_image_id" {
  description = "Platform image selected during the first plan. Record it in restricted deployment evidence."
  value       = local.selected_image_id
  sensitive   = true
}

output "deployment_summary" {
  description = "Sanitized summary of the planned base."
  value = {
    region                          = var.region
    shape                           = var.instance_shape
    ocpus                           = var.instance_ocpus
    memory_gb                       = var.instance_memory_gb
    boot_volume_gb                  = var.boot_volume_size_gb
    public_ingress_tcp              = [443]
    application_vm_public_ip        = false
    load_balancer_minimum_bandwidth = var.load_balancer_minimum_bandwidth_mbps
    load_balancer_maximum_bandwidth = var.load_balancer_maximum_bandwidth_mbps
    waf_enabled                     = true
    waf_login_requests_per_minute   = var.waf_login_requests_per_minute
    ssh_public                      = false
    bastion_ttl                     = 1800
  }
}

output "observability_summary" {
  description = "Sanitized observability plan. Resource identifiers and ingestion credentials are intentionally omitted."
  value = {
    enabled                       = var.enable_observability
    log_retention_days            = var.observability_log_retention_days
    cpu_alarm_percent             = var.observability_cpu_alarm_threshold
    memory_alarm_percent          = var.observability_memory_alarm_threshold
    alert_subscription_configured = nonsensitive(var.observability_alert_endpoint != "")
    apm_free_tier                 = var.enable_observability
  }
}
