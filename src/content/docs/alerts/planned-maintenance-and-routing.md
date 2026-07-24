---
title: Planned Maintenance & Routing
description: Silence MindOps alerts during planned maintenance windows, and route alert severities to the right notification channels with routing policies.
---

Two features keep alert noise under control: planned maintenance windows that mute alerts during expected disruption, and routing policies that send each severity to the right team. Use them together so the right people are paged only when it matters.

## Planned maintenance windows

A maintenance window tells MindOps to suppress notifications for selected alerts during a defined time range. The rules still evaluate, but they stay quiet, so a deploy or database migration does not page the whole rotation.

### Creating a window

Go to **Alerts -> Planned Maintenance** and define:

| Field | Description |
|-------|-------------|
| Name | A label such as "Nightly DB migration" |
| Schedule | One-off window or a recurring cadence |
| Time zone | The zone the schedule is interpreted in |
| Affected alerts | All alerts, or a chosen subset |
| Duration | Start and end times of the silence |

```text
Window: Weekly cache rebuild
  recurrence: every Sunday 02:00-03:00
  timezone: UTC
  scope: alerts tagged "cache"
```

:::tip
Scope a window to specific alerts rather than silencing everything. A migration that only touches the database should not blind you to a frontend outage at the same time.
:::

### Recurring vs. one-off

Use a one-off window for a scheduled launch or incident drill. Use a recurring window for predictable routine work like nightly batch jobs, so you never forget to mute them.

## Routing policies

Routing decides which channel receives an alert based on its labels and severity. Without routing, every alert would hit every attached channel; with it, you can send `critical` to PagerDuty and `warning` to Slack.

### How routing matches

A routing policy is an ordered list of rules. Each rule has a matcher and a destination. The first matching rule wins, so order from most specific to most general.

| Match on | Example |
|----------|---------|
| Severity | `severity = critical` |
| Label | `service.name = payments` |
| Source | Alert type or group |

```text
Routing policy: production
  1. severity = critical            -> pagerduty-prod, oncall-slack
  2. service.name = payments        -> payments-team-slack
  3. severity = warning             -> alerts-slack
  4. default                        -> alerts-email
```

### Severity-to-channel pattern

A common, dependable setup:

- `critical` -> paging tool (PagerDuty or Opsgenie) plus a chat channel.
- `error` -> the owning team's chat channel.
- `warning` -> a low-urgency review channel.
- `info` -> email digest or no channel at all.

:::note
Routing reads the severity you set when [building the alert](/alerts/metric-log-trace-alerts/), so be deliberate about labeling each rule's urgency.
:::

## Putting it together

1. Define [notification channels](/alerts/notification-channels/) for each destination.
2. Build a routing policy mapping severity and labels to those channels.
3. Add maintenance windows for predictable disruptions.
4. Review fired alerts periodically and adjust thresholds, routes, and windows.

This combination ensures alerts reach the right people, stay quiet during planned work, and never drown your team in noise.
