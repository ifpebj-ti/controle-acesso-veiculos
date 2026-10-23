variable "tenancy_ocid" {
  description = "Tenancy OCID supplied automatically by OCI Resource Manager."
  type        = string
  sensitive   = true
}

variable "compartment_ocid" {
  description = "Parent compartment in which the dedicated homologation compartment is created."
  type        = string
  sensitive   = true
}

variable "region" {
  description = "OCI region for the homologation environment."
  type        = string
  default     = "sa-saopaulo-1"
}

variable "resource_prefix" {
  description = "Non-confidential prefix for resource names."
  type        = string
  default     = "cav-hml"

  validation {
    condition     = can(regex("^[a-z][a-z0-9-]{2,20}$", var.resource_prefix))
    error_message = "resource_prefix must start with a letter and contain 3 to 21 lowercase letters, numbers or hyphens."
  }
}

variable "vcn_cidr" {
  description = "Private IPv4 range for the isolated homologation VCN."
  type        = string
  default     = "10.42.0.0/16"

  validation {
    condition     = can(cidrhost(var.vcn_cidr, 1))
    error_message = "vcn_cidr must be a valid IPv4 CIDR."
  }
}

variable "public_subnet_cidr" {
  description = "Public subnet used exclusively by the OCI Flexible Load Balancer."
  type        = string
  default     = "10.42.10.0/24"

  validation {
    condition     = can(cidrhost(var.public_subnet_cidr, 1))
    error_message = "public_subnet_cidr must be a valid IPv4 CIDR."
  }
}

variable "application_subnet_cidr" {
  description = "Private subnet used by the application VM and OCI Bastion target sessions."
  type        = string
  default     = "10.42.20.0/24"

  validation {
    condition     = can(cidrhost(var.application_subnet_cidr, 1))
    error_message = "application_subnet_cidr must be a valid IPv4 CIDR."
  }
}

variable "load_balancer_certificate_id" {
  description = "OCID of a reviewed OCI Certificates service certificate for the approved homologation hostname. Supply only through Resource Manager."
  type        = string
  sensitive   = true

  validation {
    condition     = can(regex("^ocid1\\.certificate\\.", var.load_balancer_certificate_id))
    error_message = "load_balancer_certificate_id must be an OCI Certificates service certificate OCID."
  }
}

variable "load_balancer_minimum_bandwidth_mbps" {
  description = "Guaranteed Flexible Load Balancer bandwidth. Keep at the reviewed pilot minimum."
  type        = number
  default     = 10

  validation {
    condition     = var.load_balancer_minimum_bandwidth_mbps >= 10 && var.load_balancer_minimum_bandwidth_mbps <= 100
    error_message = "The minimum Load Balancer bandwidth must be between 10 and 100 Mbps for this pilot."
  }
}

variable "load_balancer_maximum_bandwidth_mbps" {
  description = "Maximum Flexible Load Balancer bandwidth. A fixed 10 Mbps ceiling is the cost-controlled default."
  type        = number
  default     = 10

  validation {
    condition     = var.load_balancer_maximum_bandwidth_mbps >= 10 && var.load_balancer_maximum_bandwidth_mbps <= 100
    error_message = "The maximum Load Balancer bandwidth must be between 10 and 100 Mbps for this pilot."
  }
}

variable "waf_login_requests_per_minute" {
  description = "Edge request ceiling per source for authentication routes. The API keeps its own independent limits."
  type        = number
  default     = 30

  validation {
    condition     = var.waf_login_requests_per_minute >= 10 && var.waf_login_requests_per_minute <= 120
    error_message = "waf_login_requests_per_minute must be between 10 and 120."
  }
}

variable "availability_domain" {
  description = "Optional availability domain. Empty selects the first domain returned in the region."
  type        = string
  default     = ""
}

variable "instance_shape" {
  description = "Flexible compute shape. Arm is preferred for the economical pilot."
  type        = string
  default     = "VM.Standard.A1.Flex"

  validation {
    condition     = contains(["VM.Standard.A1.Flex", "VM.Standard.E4.Flex", "VM.Standard.E5.Flex"], var.instance_shape)
    error_message = "Use the reviewed Arm shape or one of the documented AMD64 fallbacks."
  }
}

variable "instance_ocpus" {
  description = "OCPUs allocated to the flexible VM."
  type        = number
  default     = 1

  validation {
    condition     = var.instance_ocpus >= 1 && var.instance_ocpus <= 4
    error_message = "instance_ocpus must be between 1 and 4 for this pilot."
  }
}

variable "instance_memory_gb" {
  description = "Memory allocated to the flexible VM in GiB."
  type        = number
  default     = 6

  validation {
    condition     = var.instance_memory_gb >= 4 && var.instance_memory_gb <= 24
    error_message = "instance_memory_gb must be between 4 and 24 GiB for this pilot."
  }
}

variable "boot_volume_size_gb" {
  description = "Boot volume size in GiB. OCI platform images require at least 50 GiB."
  type        = number
  default     = 50

  validation {
    condition     = var.boot_volume_size_gb >= 50 && var.boot_volume_size_gb <= 100
    error_message = "boot_volume_size_gb must be between 50 and 100 GiB."
  }
}

variable "instance_image_ocid" {
  description = "Optional reviewed image OCID. Empty selects the newest compatible Canonical Ubuntu 24.04 image during the first plan."
  type        = string
  default     = ""
  sensitive   = true
}

variable "bastion_client_cidr" {
  description = "Single approved operator source in CIDR notation, preferably a public /32."
  type        = string

  validation {
    condition     = can(cidrhost(var.bastion_client_cidr, 0)) && var.bastion_client_cidr != "0.0.0.0/0"
    error_message = "bastion_client_cidr must be a valid restricted CIDR and cannot be 0.0.0.0/0."
  }
}

variable "monthly_budget_amount" {
  description = "Monthly budget amount in the tenancy rate-card currency. Review before apply."
  type        = number
  default     = 25

  validation {
    condition     = var.monthly_budget_amount > 0 && var.monthly_budget_amount <= 200
    error_message = "monthly_budget_amount must be greater than zero and no more than 200 in the tenancy currency."
  }
}

variable "budget_alert_recipients" {
  description = "Approved comma-separated institutional email recipients for budget alerts. Enter only in Resource Manager."
  type        = string
  sensitive   = true

  validation {
    condition     = length(trimspace(var.budget_alert_recipients)) > 3 && can(regex("@", var.budget_alert_recipients))
    error_message = "Provide at least one approved email recipient."
  }
}

variable "freeform_tags" {
  description = "Non-confidential governance tags applied to supported resources."
  type        = map(string)
  default = {
    application = "controle-acesso-veiculos"
    environment = "homologation"
    managed-by  = "terraform"
    owner-role  = "software-engineering-course"
  }
}
