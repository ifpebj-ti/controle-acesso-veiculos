data "oci_waf_protection_capabilities" "xss" {
  compartment_id    = oci_identity_compartment.homologation.id
  key               = "9410000"
  is_latest_version = [true]
  type              = "REQUEST_PROTECTION_CAPABILITY"
}

data "oci_waf_protection_capabilities" "sql_injection" {
  compartment_id    = oci_identity_compartment.homologation.id
  key               = "9420000"
  is_latest_version = [true]
  type              = "REQUEST_PROTECTION_CAPABILITY"
}

resource "oci_load_balancer_load_balancer" "edge" {
  compartment_id             = oci_identity_compartment.homologation.id
  display_name               = "${var.resource_prefix}-edge"
  shape                      = "flexible"
  subnet_ids                 = [oci_core_subnet.public.id]
  is_private                 = false
  network_security_group_ids = [oci_core_network_security_group.load_balancer.id]
  freeform_tags              = var.freeform_tags

  shape_details {
    minimum_bandwidth_in_mbps = var.load_balancer_minimum_bandwidth_mbps
    maximum_bandwidth_in_mbps = var.load_balancer_maximum_bandwidth_mbps
  }

  lifecycle {
    precondition {
      condition     = var.load_balancer_maximum_bandwidth_mbps >= var.load_balancer_minimum_bandwidth_mbps
      error_message = "The maximum Load Balancer bandwidth must be at least the minimum bandwidth."
    }
  }
}

resource "oci_load_balancer_backend_set" "application" {
  load_balancer_id = oci_load_balancer_load_balancer.edge.id
  name             = "application"
  policy           = "ROUND_ROBIN"

  health_checker {
    protocol          = "HTTP"
    port              = 8088
    url_path          = "/"
    return_code       = 200
    retries           = 3
    timeout_in_millis = 3000
    interval_ms       = 10000
  }
}

resource "oci_load_balancer_backend" "application" {
  load_balancer_id = oci_load_balancer_load_balancer.edge.id
  backendset_name  = oci_load_balancer_backend_set.application.name
  ip_address       = oci_core_instance.application.private_ip
  port             = 8088
  backup           = false
  drain            = false
  offline          = false
  weight           = 1
}

resource "oci_load_balancer_listener" "https" {
  load_balancer_id         = oci_load_balancer_load_balancer.edge.id
  name                     = "https"
  default_backend_set_name = oci_load_balancer_backend_set.application.name
  port                     = 443
  protocol                 = "HTTP"

  connection_configuration {
    idle_timeout_in_seconds = 60
  }

  ssl_configuration {
    certificate_ids         = [var.load_balancer_certificate_id]
    protocols               = ["TLSv1.2", "TLSv1.3"]
    verify_peer_certificate = false
  }
}

resource "oci_waf_web_app_firewall_policy" "homologation" {
  compartment_id = oci_identity_compartment.homologation.id
  display_name   = "${var.resource_prefix}-policy"
  freeform_tags  = var.freeform_tags

  actions {
    name = "allow"
    type = "ALLOW"
  }

  actions {
    name = "block-protection"
    type = "RETURN_HTTP_RESPONSE"
    code = 403

    body {
      type = "STATIC_TEXT"
      text = "Request blocked by the application security policy."
    }
  }

  actions {
    name = "block-rate-limit"
    type = "RETURN_HTTP_RESPONSE"
    code = 429

    body {
      type = "STATIC_TEXT"
      text = "Too many requests. Try again later."
    }
  }

  request_access_control {
    default_action_name = "allow"
  }

  request_protection {
    body_inspection_size_limit_in_bytes             = 1048576
    body_inspection_size_limit_exceeded_action_name = "block-protection"

    rules {
      name                       = "owasp-injection-baseline"
      type                       = "PROTECTION"
      action_name                = "block-protection"
      is_body_inspection_enabled = true

      protection_capabilities {
        key     = "9410000"
        version = data.oci_waf_protection_capabilities.xss.protection_capability_collection[0].items[0].version
      }

      protection_capabilities {
        key     = "9420000"
        version = data.oci_waf_protection_capabilities.sql_injection.protection_capability_collection[0].items[0].version
      }
    }
  }

  request_rate_limiting {
    rules {
      name               = "authentication-per-source"
      type               = "REQUEST_RATE_LIMITING"
      action_name        = "block-rate-limit"
      condition          = "i_starts_with(http.request.url.path, '/api/auth/')"
      condition_language = "JMESPATH"

      configurations {
        period_in_seconds          = 60
        requests_limit             = var.waf_login_requests_per_minute
        action_duration_in_seconds = 300
      }
    }
  }

  lifecycle {
    precondition {
      condition = (
        length(data.oci_waf_protection_capabilities.xss.protection_capability_collection[0].items) == 1 &&
        length(data.oci_waf_protection_capabilities.sql_injection.protection_capability_collection[0].items) == 1
      )
      error_message = "The latest OCI WAF XSS and SQL injection collaborative capabilities must be available in the selected region."
    }
  }
}

resource "oci_waf_web_app_firewall" "homologation" {
  compartment_id             = oci_identity_compartment.homologation.id
  backend_type               = "LOAD_BALANCER"
  load_balancer_id           = oci_load_balancer_load_balancer.edge.id
  web_app_firewall_policy_id = oci_waf_web_app_firewall_policy.homologation.id
  display_name               = "${var.resource_prefix}-firewall"
  freeform_tags              = var.freeform_tags
}

resource "oci_logging_log_group" "security" {
  compartment_id = oci_identity_compartment.homologation.id
  display_name   = "${var.resource_prefix}-security"
  description    = "Short-retention security logs for homologation tuning and incident review."
  freeform_tags  = var.freeform_tags
}

resource "oci_logging_log" "waf" {
  display_name       = "${var.resource_prefix}-waf"
  log_group_id       = oci_logging_log_group.security.id
  log_type           = "SERVICE"
  is_enabled         = true
  retention_duration = 30
  freeform_tags      = var.freeform_tags

  configuration {
    source {
      category    = "all"
      resource    = oci_waf_web_app_firewall.homologation.id
      service     = "waf"
      source_type = "OCISERVICE"
    }
  }
}
