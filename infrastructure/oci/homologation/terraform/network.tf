resource "oci_core_vcn" "homologation" {
  compartment_id = oci_identity_compartment.homologation.id
  cidr_blocks     = [var.vcn_cidr]
  display_name    = "${var.resource_prefix}-vcn"
  dns_label       = "cavhml"
  freeform_tags   = var.freeform_tags
}

resource "oci_core_internet_gateway" "homologation" {
  compartment_id = oci_identity_compartment.homologation.id
  vcn_id         = oci_core_vcn.homologation.id
  display_name   = "${var.resource_prefix}-internet-gateway"
  enabled        = true
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
  display_name               = "${var.resource_prefix}-public-subnet"
  dns_label                  = "app"
  route_table_id             = oci_core_route_table.public.id
  security_list_ids          = [oci_core_security_list.public.id]
  prohibit_public_ip_on_vnic = false
  freeform_tags              = var.freeform_tags
}

resource "oci_core_network_security_group" "application" {
  compartment_id = oci_identity_compartment.homologation.id
  vcn_id         = oci_core_vcn.homologation.id
  display_name   = "${var.resource_prefix}-application-nsg"
  freeform_tags  = var.freeform_tags
}

resource "oci_core_network_security_group_security_rule" "https" {
  network_security_group_id = oci_core_network_security_group.application.id
  direction                 = "INGRESS"
  protocol                  = "6"
  source                    = "0.0.0.0/0"
  source_type               = "CIDR_BLOCK"
  stateless                 = false
  description               = "Public HTTPS entry point."

  tcp_options {
    destination_port_range {
      min = 443
      max = 443
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
  compartment_id              = oci_identity_compartment.homologation.id
  target_subnet_id             = oci_core_subnet.public.id
  name                         = "${var.resource_prefix}-bastion"
  client_cidr_block_allow_list = [var.bastion_client_cidr]
  max_session_ttl_in_seconds   = 1800
  freeform_tags                = var.freeform_tags
}
