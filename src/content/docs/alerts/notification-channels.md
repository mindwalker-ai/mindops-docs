---
title: Notification Channels
description: Configure where MindOps sends alerts - Slack, Email (with SMTP), PagerDuty, Opsgenie, Microsoft Teams, and generic webhooks - with a field reference for each.
---

A notification channel is the destination an alert delivers to. MindOps supports the common incident tools plus a generic webhook for everything else. Define channels once, then attach them to any number of alert rules.

## Where to manage channels

Open **Settings -> Alert Channels** to add, edit, test, or remove a channel. Each channel has a name, a type, and type-specific delivery fields. Use the **Test** button after saving to confirm credentials are valid before you rely on it.

## Supported channels

| Channel | Best for | Key requirement |
|---------|----------|-----------------|
| Slack | Team chat notifications | Incoming webhook URL |
| Email | Lightweight or audit alerts | A configured SMTP server |
| PagerDuty | On-call paging | Integration/routing key |
| Opsgenie | On-call paging | API key + region |
| Microsoft Teams | Team chat notifications | Incoming webhook URL |
| Webhook | Custom integrations | Endpoint URL |

## Field reference

### Slack

| Field | Description |
|-------|-------------|
| Webhook URL | Slack incoming webhook for the target channel |
| Channel | Optional channel override |
| Title / Description | Message template with label interpolation |

### Email

Email requires a working SMTP server configured in the MindOps deployment. Until SMTP is set, the email channel cannot deliver.

| Field | Description |
|-------|-------------|
| To | One or more recipient addresses |
| SMTP host / port | Mail server address (set at the deployment level) |
| From address | Sender identity used by the server |

:::caution
If email tests fail, verify the SMTP host, port, and credentials in your MindOps configuration first - most email problems are SMTP problems, not channel problems.
:::

### PagerDuty

| Field | Description |
|-------|-------------|
| Routing key | The integration key from a PagerDuty service |
| Severity mapping | Maps MindOps severity to PagerDuty urgency |

### Opsgenie

| Field | Description |
|-------|-------------|
| API key | Opsgenie integration API key |
| Region | `us` or `eu` instance |
| Priority | Default priority for created alerts |

### Microsoft Teams

| Field | Description |
|-------|-------------|
| Webhook URL | Teams incoming webhook for the channel |
| Title / Text | Adaptive message template |

### Generic webhook

The webhook channel posts a JSON payload to any HTTPS endpoint, letting you wire MindOps into custom automation.

| Field | Description |
|-------|-------------|
| URL | Endpoint that receives the POST |
| HTTP headers | Optional auth or content headers |
| Username / Password | Optional basic-auth credentials |

```json
{
  "status": "firing",
  "alertname": "High error rate",
  "severity": "critical",
  "labels": { "service.name": "payments" },
  "startsAt": "2026-06-26T10:15:00Z"
}
```

## Good practices

- Create separate channels per severity so paging and chat do not mix.
- Always run **Test** after editing credentials.
- Store webhook secrets in your deployment's secret manager, never in plain templates.

Once channels exist, decide which severity goes where in [Planned maintenance & routing](/alerts/planned-maintenance-and-routing/).
