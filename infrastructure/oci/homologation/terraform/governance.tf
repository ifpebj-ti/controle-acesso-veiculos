resource "oci_identity_compartment" "homologation" {
  compartment_id = var.compartment_ocid
  name           = local.compartment_name
  description    = "Isolated compartment for the vehicle access MVP homologation environment."
  enable_delete  = true
  freeform_tags  = var.freeform_tags
}

resource "oci_budget_budget" "homologation" {
  amount                 = var.monthly_budget_amount
  compartment_id         = var.tenancy_ocid
  reset_period           = "MONTHLY"
  processing_period_type = "MONTH"
  target_type            = "COMPARTMENT"
  targets                = [oci_identity_compartment.homologation.id]
  display_name           = "${var.resource_prefix}-monthly-budget"
  description            = "Monthly cost guardrail for the academic homologation environment."
  freeform_tags          = var.freeform_tags
}

resource "oci_budget_alert_rule" "homologation" {
  for_each = local.budget_alerts

  budget_id      = oci_budget_budget.homologation.id
  threshold      = each.value.threshold
  threshold_type = "PERCENTAGE"
  type           = each.value.type
  display_name   = "${var.resource_prefix}-${each.key}"
  description    = "Cost alert for the academic homologation environment."
  message        = "Review OCI consumption and follow the homologation cost runbook. Budgets do not stop resources automatically."
  recipients     = var.budget_alert_recipients
  freeform_tags  = var.freeform_tags
}

resource "oci_identity_dynamic_group" "application_instance_agent" {
  compartment_id = var.tenancy_ocid
  name           = replace("${var.resource_prefix}_instance_agent", "-", "_")
  description    = "Least-privilege identity for the homologation compute instance agent."
  matching_rule  = "instance.id = '${oci_core_instance.application.id}'"
}

resource "oci_identity_policy" "application_instance_agent" {
  compartment_id = var.tenancy_ocid
  name           = "${var.resource_prefix}-instance-agent-policy"
  description    = "Allows only the homologation instance to consume its Run Command executions."
  statements = [
    "Allow dynamic-group id ${oci_identity_dynamic_group.application_instance_agent.id} to use instance-agent-command-execution-family in compartment id ${oci_identity_compartment.homologation.id} where request.instance.id = target.instance.id"
  ]
}
