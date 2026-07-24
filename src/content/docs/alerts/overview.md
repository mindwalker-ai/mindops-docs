---
title: Alerts Overview
description: Define threshold and anomaly alerts across every signal in MindOps.
---

Alerts watch your telemetry and notify you when something crosses a line you care about.
MindOps can alert on any signal — metrics, logs, traces, and exceptions.

## Alert types

- **Metric-based** — threshold on any metric (e.g. p99 latency > 800 ms).
- **Log-based** — counts or patterns in logs (e.g. > 50 `ERROR` logs in 5 min).
- **Trace-based** — latency or error-rate thresholds derived from traces.
- **Exceptions-based** — fire when a new or frequent exception appears.
- **Anomaly-based** — learn normal behavior and alert on deviations automatically.

## Anatomy of an alert

1. **Query** — what to measure (the same builder used in dashboards).
2. **Condition** — the threshold and evaluation window (e.g. *above 5% for 5 minutes*).
3. **Notification channel** — where to send it.

```text
Query:      error rate for service = checkout
Condition:  > 5% for 5m
Severity:   critical
Notify:     #oncall (Slack) + PagerDuty
```

## Notification channels

Route alerts to **Slack, PagerDuty, email, or a webhook**. Use routing policies to send
different severities to different channels, and set **maintenance windows** to silence
alerts during planned work.

## Good practices

- Alert on **symptoms** users feel (latency, error rate) before causes (CPU).
- Add a `for` duration so a brief spike does not page anyone.
- Keep a runbook link in the alert description.
