resource "oci_core_vcn" "homologation" {
  compartment_id = oci_identity_compartment.homologation.id
  cidr_blocks    = [var.vcn_cidr]
  display_name   = "${var.resource_prefix}-vcn"
  dns_label      = "cavhml"
  freeform_tags  = var.freeform_tags

  lifecycle {
    precondition {
      condition     = var.application_subnet_cidr != var.public_subnet_cidr
      error_message = "application_subnet_cidr must be different from public_subnet_cidr."
    }
  }
}

resource "oci_core_internet_gateway" "homologation" {
  compartment_id = oci_identity_compartment.homologation.id
  vcn_id         = oci_core_vcn.homologation.id
  display_name   = "${var.resource_prefix}-internet-gateway"
  enabled        = true
  freeform_tags  = var.freeform_tags
}

resource "oci_core_nat_gateway" "application" {
  compartment_id = oci_identity_compartment.homologation.id
  vcn_id         = oci_core_vcn.homologation.id
  display_name   = "${var.resource_prefix}-application-nat"
  freeform_tags  = var.freeform_tags
}

resource "oci_core_route_table" "public" {
  compartment_id = oci_identity_compartment.homologation.id
  vcn_id         = oci_core_vcn.homologation.id
  display_name   = "${var.resource_prefix}-public-routes"
  freeform_tags  = var.freeform_tags

  route_rules {
    destination       = "0.0.0.0/0"
    destination_type  = "CIDR_BLOCK"
    network_entity_id = oci_core_internet_gateway.homologation.id
    description       = "Controlled internet egress and public HTTPS return traffic."
  }
}

resource "oci_core_route_table" "application" {
  compartment_id = oci_identity_compartment.homologation.id
  vcn_id         = oci_core_vcn.homologation.id
  display_name   = "${var.resource_prefix}-application-routes"
  freeform_tags  = var.freeform_tags

  route_rules {
    destination       = "0.0.0.0/0"
    destination_type  = "CIDR_BLOCK"
    network_entity_id = oci_core_nat_gateway.application.id
    description       = "Outbound-only updates, image pulls and telemetry for the private application VM."
  }
}

resource "oci_core_security_list" "public" {
  compartment_id = oci_identity_compartment.homologation.id
  vcn_id         = oci_core_vcn.homologation.id
  display_name   = "${var.resource_prefix}-subnet-baseline"
  freeform_tags  = var.freeform_tags

  egress_security_rules {
    destination = "0.0.0.0/0"
    protocol    = "all"
    stateless   = false
    description = "Required outbound access for updates, GHCR and certificate issuance."
  }
}

resource "oci_core_subnet" "public" {
  compartment_id             = oci_identity_compartment.homologation.id
  vcn_id                     = oci_core_vcn.homologation.id
  cidr_block                 = var.public_subnet_cidr
  display_name               = "${var.resource_prefix}-load-balancer-subnet"
  dns_label                  = "edge"
  route_table_id             = oci_core_route_table.public.id
  security_list_ids          = [oci_core_security_list.public.id]
  prohibit_public_ip_on_vnic = false
  freeform_tags              = var.freeform_tags
}

resource "oci_core_subnet" "application" {
  compartment_id             = oci_identity_compartment.homologation.id
  vcn_id                     = oci_core_vcn.homologation.id
  cidr_block                 = var.application_subnet_cidr
  display_name               = "${var.resource_prefix}-application-subnet"
  dns_label                  = "application"
  route_table_id             = oci_core_route_table.application.id
  security_list_ids          = [oci_core_security_list.public.id]
  prohibit_public_ip_on_vnic = true
  freeform_tags              = var.freeform_tags
}

resource "oci_core_network_security_group" "load_balancer" {
  compartment_id = oci_identity_compartment.homologation.id
  vcn_id         = oci_core_vcn.homologation.id
  display_name   = "${var.resource_prefix}-load-balancer-nsg"
  freeform_tags  = var.freeform_tags
}

resource "oci_core_network_security_group" "application" {
  compartment_id = oci_identity_compartment.homologation.id
  vcn_id         = oci_core_vcn.homologation.id
  display_name   = "${var.resource_prefix}-application-nsg"
  freeform_tags  = var.freeform_tags
}

resource "oci_core_network_security_group_security_rule" "load_balancer_https" {
  network_security_group_id = oci_core_network_security_group.load_balancer.id
  direction                 = "INGRESS"
  protocol                  = "6"
  source                    = "0.0.0.0/0"
  source_type               = "CIDR_BLOCK"
  stateless                 = false
  description               = "The WAF-protected Flexible Load Balancer is the only public application entry point."

  tcp_options {
    destination_port_range {
      min = 443
      max = 443
    }
  }
}

resource "oci_core_network_security_group_security_rule" "load_balancer_to_application" {
  network_security_group_id = oci_core_network_security_group.load_balancer.id
  direction                 = "EGRESS"
  protocol                  = "6"
  destination               = oci_core_network_security_group.application.id
  destination_type          = "NETWORK_SECURITY_GROUP"
  stateless                 = false
  description               = "Forward inspected HTTP traffic only to the application edge port."

  tcp_options {
    destination_port_range {
      min = 8088
      max = 8088
    }
  }
}

resource "oci_core_network_security_group_security_rule" "application_from_load_balancer" {
  network_security_group_id = oci_core_network_security_group.application.id
  direction                 = "INGRESS"
  protocol                  = "6"
  source                    = oci_core_network_security_group.load_balancer.id
  source_type               = "NETWORK_SECURITY_GROUP"
  stateless                 = false
  description               = "Accept application traffic only from the OCI Flexible Load Balancer."

  tcp_options {
    destination_port_range {
      min = 8088
      max = 8088
    }
  }
}

resource "oci_core_network_security_group_security_rule" "bastion_ssh" {
  network_security_group_id = oci_core_network_security_group.application.id
  direction                 = "INGRESS"
  protocol                  = "6"
  source                    = var.vcn_cidr
  source_type               = "CIDR_BLOCK"
  stateless                 = false
  description               = "SSH reachable only from the VCN for temporary OCI Bastion sessions."

  tcp_options {
    destination_port_range {
      min = 22
      max = 22
    }
  }
}

resource "oci_core_network_security_group_security_rule" "egress" {
  network_security_group_id = oci_core_network_security_group.application.id
  direction                 = "EGRESS"
  protocol                  = "all"
  destination               = "0.0.0.0/0"
  destination_type          = "CIDR_BLOCK"
  stateless                 = false
  description               = "Outbound updates, image pulls, telemetry and certificate issuance."
}

resource "oci_bastion_bastion" "homologation" {
  bastion_type                 = "STANDARD"
  compartment_id               = oci_identity_compartment.homologation.id
  target_subnet_id             = oci_core_subnet.application.id
  name                         = "${var.resource_prefix}-bastion"
  client_cidr_block_allow_list = [var.bastion_client_cidr]
  max_session_ttl_in_seconds   = 1800
  freeform_tags                = var.freeform_tags
}
