resource "oci_ons_notification_topic" "observability" {
  count = var.enable_observability ? 1 : 0

  compartment_id = oci_identity_compartment.homologation.id
  name           = "${var.resource_prefix}-observability-alerts"
  description    = "Operational alerts for the vehicle access homologation environment."
  freeform_tags  = var.freeform_tags
}

resource "oci_ons_subscription" "observability_email" {
  count = var.enable_observability && var.observability_alert_endpoint != "" ? 1 : 0

  compartment_id = oci_identity_compartment.homologation.id
  topic_id       = oci_ons_notification_topic.observability[0].id
  protocol       = "EMAIL"
  endpoint       = var.observability_alert_endpoint
  freeform_tags  = var.freeform_tags
}

resource "oci_monitoring_alarm" "application_cpu" {
  count = var.enable_observability ? 1 : 0

  compartment_id        = oci_identity_compartment.homologation.id
  metric_compartment_id = oci_identity_compartment.homologation.id
  destinations          = [oci_ons_notification_topic.observability[0].id]
  display_name          = "${var.resource_prefix}-high-cpu"
  namespace             = "oci_computeagent"
  query                 = "CpuUtilization[5m]{resourceId = \"${oci_core_instance.application.id}\"}.mean() > ${var.observability_cpu_alarm_threshold}"
  severity              = "WARNING"
  body                  = "Sustained CPU utilization exceeded the reviewed homologation threshold. Follow the observability runbook."
  is_enabled            = var.observability_alert_endpoint != ""
  pending_duration      = "PT5M"
  freeform_tags         = var.freeform_tags
}

resource "oci_monitoring_alarm" "application_memory" {
  count = var.enable_observability ? 1 : 0

  compartment_id        = oci_identity_compartment.homologation.id
  metric_compartment_id = oci_identity_compartment.homologation.id
  destinations          = [oci_ons_notification_topic.observability[0].id]
  display_name          = "${var.resource_prefix}-high-memory"
  namespace             = "oci_computeagent"
  query                 = "MemoryUtilization[5m]{resourceId = \"${oci_core_instance.application.id}\"}.mean() > ${var.observability_memory_alarm_threshold}"
  severity              = "WARNING"
  body                  = "Sustained memory utilization exceeded the reviewed homologation threshold. Follow the observability runbook."
  is_enabled            = var.observability_alert_endpoint != ""
  pending_duration      = "PT5M"
  freeform_tags         = var.freeform_tags
}

resource "oci_logging_log_group" "homologation" {
  count = var.enable_observability ? 1 : 0

  compartment_id = oci_identity_compartment.homologation.id
  display_name   = "${var.resource_prefix}-application-logs"
  description    = "Sanitized application and container logs for homologation."
  freeform_tags  = var.freeform_tags
}

resource "oci_logging_log" "containers" {
  count = var.enable_observability ? 1 : 0

  display_name       = "${var.resource_prefix}-container-stdout"
  log_group_id       = oci_logging_log_group.homologation[0].id
  log_type           = "CUSTOM"
  is_enabled         = true
  retention_duration = var.observability_log_retention_days
  freeform_tags      = var.freeform_tags
}

resource "oci_identity_dynamic_group" "observability_agent" {
  count = var.enable_observability ? 1 : 0

  compartment_id = var.tenancy_ocid
  name           = replace("${var.resource_prefix}_observability_agent", "-", "_")
  description    = "Least-privilege identity for log collection from the homologation instance."
  matching_rule  = "instance.id = '${oci_core_instance.application.id}'"
}

resource "oci_logging_unified_agent_configuration" "containers" {
  count = var.enable_observability ? 1 : 0

  compartment_id = oci_identity_compartment.homologation.id
  display_name   = "${var.resource_prefix}-container-log-collection"
  description    = "Collect Docker JSON stdout without reading historical files from their beginning."
  is_enabled     = true
  freeform_tags  = var.freeform_tags

  group_association {
    group_list = [oci_identity_dynamic_group.observability_agent[0].id]
  }

  service_configuration {
    configuration_type = "LOGGING"

    destination {
      log_object_id = oci_logging_log.containers[0].id
    }

    sources {
      name        = "docker-json-stdout"
      source_type = "LOG_TAIL"
      paths       = ["/var/lib/docker/containers/*/*.log"]

      advanced_options {
        is_read_from_head = false
      }

      parser {
        parser_type = "JSON"
      }
    }
  }
}

resource "oci_identity_policy" "observability_instance" {
  count = var.enable_observability ? 1 : 0

  compartment_id = var.tenancy_ocid
  name           = "${var.resource_prefix}-observability-instance-policy"
  description    = "Allows the homologation instance agent to send only its configured log content."
  statements = [
    "Allow dynamic-group id ${oci_identity_dynamic_group.observability_agent[0].id} to use log-content in compartment id ${oci_identity_compartment.homologation.id}"
  ]
}

resource "oci_apm_apm_domain" "homologation" {
  count = var.enable_observability ? 1 : 0

  compartment_id = oci_identity_compartment.homologation.id
  display_name   = "${var.resource_prefix}-apm"
  description    = "Free-tier APM domain for sanitized OpenTelemetry signals from homologation."
  is_free_tier   = true
  log_group_id   = oci_logging_log_group.homologation[0].id
  freeform_tags  = var.freeform_tags
}
