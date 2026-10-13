locals {
  compartment_name  = "${var.resource_prefix}-compartment"
  selected_ad       = var.availability_domain != "" ? var.availability_domain : data.oci_identity_availability_domains.available.availability_domains[0].name
  selected_image_id = var.instance_image_ocid != "" ? var.instance_image_ocid : data.oci_core_images.ubuntu.images[0].id

  budget_alerts = {
    forecast-50 = { type = "FORECAST", threshold = 50 }
    forecast-75 = { type = "FORECAST", threshold = 75 }
    forecast-90 = { type = "FORECAST", threshold = 90 }
    actual-75   = { type = "ACTUAL", threshold = 75 }
    actual-90   = { type = "ACTUAL", threshold = 90 }
    actual-100  = { type = "ACTUAL", threshold = 100 }
  }
}

data "oci_identity_availability_domains" "available" {
  compartment_id = var.tenancy_ocid
}

data "oci_core_images" "ubuntu" {
  compartment_id           = var.tenancy_ocid
  operating_system         = "Canonical Ubuntu"
  operating_system_version = "24.04"
  shape                    = var.instance_shape
  state                    = "AVAILABLE"
  sort_by                  = "TIMECREATED"
  sort_order               = "DESC"
}
