resource "oci_core_instance" "application" {
  availability_domain  = local.selected_ad
  compartment_id       = oci_identity_compartment.homologation.id
  display_name         = "${var.resource_prefix}-application"
  shape                = var.instance_shape
  freeform_tags        = var.freeform_tags
  preserve_boot_volume = false

  shape_config {
    ocpus         = var.instance_ocpus
    memory_in_gbs = var.instance_memory_gb
  }

  source_details {
    source_type             = "image"
    source_id               = local.selected_image_id
    boot_volume_size_in_gbs = var.boot_volume_size_gb
    boot_volume_vpus_per_gb = 10
  }

  create_vnic_details {
    subnet_id                 = oci_core_subnet.application.id
    nsg_ids                   = [oci_core_network_security_group.application.id]
    assign_public_ip          = false
    assign_private_dns_record = true
    hostname_label            = "app"
    display_name              = "${var.resource_prefix}-primary-vnic"
    freeform_tags             = var.freeform_tags
  }

  agent_config {
    are_all_plugins_disabled = false
    is_management_disabled   = false
    is_monitoring_disabled   = false

    plugins_config {
      name          = "Bastion"
      desired_state = "ENABLED"
    }

    plugins_config {
      name          = "Compute Instance Monitoring"
      desired_state = "ENABLED"
    }

    plugins_config {
      name          = "Custom Logs Monitoring"
      desired_state = "ENABLED"
    }
  }

  availability_config {
    recovery_action = "RESTORE_INSTANCE"
  }

  instance_options {
    are_legacy_imds_endpoints_disabled = true
  }

  launch_options {
    is_pv_encryption_in_transit_enabled = true
    network_type                        = "PARAVIRTUALIZED"
  }

  metadata = {
    user_data = base64encode(templatefile("${path.module}/cloud-init.yaml.tftpl", {
      vcn_cidr                  = var.vcn_cidr
      load_balancer_subnet_cidr = var.public_subnet_cidr
    }))
  }

  lifecycle {
    ignore_changes = [source_details[0].source_id]

    precondition {
      condition     = length(data.oci_core_images.ubuntu.images) > 0 || var.instance_image_ocid != ""
      error_message = "No compatible Ubuntu 24.04 image was found. Supply a reviewed instance_image_ocid."
    }
  }
}
