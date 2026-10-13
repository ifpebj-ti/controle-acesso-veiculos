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

output "instance_public_ip" {
  description = "Public IP for the approved DNS record. Do not publish in issues or logs."
  value       = oci_core_instance.application.public_ip
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
    region             = var.region
    shape              = var.instance_shape
    ocpus              = var.instance_ocpus
    memory_gb          = var.instance_memory_gb
    boot_volume_gb     = var.boot_volume_size_gb
    public_ingress_tcp = [443]
    ssh_public         = false
    bastion_ttl        = 1800
  }
}
