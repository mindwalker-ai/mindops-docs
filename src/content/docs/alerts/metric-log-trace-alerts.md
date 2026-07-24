---
title: Building Metric, Log & Trace Alerts
description: Step through the MindOps alert builder - define a query, set the condition with above/below thresholds and for-duration, choose severity, and study a worked error-rate example.
---

Metric, log, and trace alerts all share the same builder in MindOps. You define what to measure with a query, decide when it is bad with a condition, and label how urgent it is with a severity. This page covers each stage and finishes with a complete error-rate rule.

## 1. Define the query

The query stage produces the time series the alert watches. Use the visual query builder to pick a signal, an aggregation, and grouping:

- **Metric query** - choose a metric, an aggregation (avg, sum, p95), and optional `group by` labels.
- **Log query** - filter your logs, then aggregate with `count` or a numeric field.
- **Trace query** - filter spans by service or operation and aggregate count, error count, or duration percentiles.

Grouping matters: a `group by service.name` rule evaluates the condition per service and can alert on each one independently.

## 2. Set the condition

The condition turns the query result into a fire/clear decision.

| Field | Meaning |
|-------|---------|
| Threshold | The numeric boundary to compare against |
| Operator | `above`, `below`, `above or equal`, `below or equal` |
| Match type | At least once, all the time, on average, or total over the window |
| For duration | How long the condition must hold before firing |
| Evaluation window | The rolling time range each check looks back over |

The **for-duration** guard is what prevents flapping. Requiring "above 5% for 5 minutes" ignores a single noisy data point.

## 3. Choose severity and notifications

Assign a severity - `info`, `warning`, `error`, or `critical` - so routing policies can send each level to the right place. Then attach one or more notification channels and write a message template. Templates can interpolate label values, for example the offending `{{service.name}}`.

:::note
Severity is just a label until a routing policy acts on it. See [Planned maintenance & routing](/mindops-docs/alerts/planned-maintenance-and-routing/).
:::

## Worked example: HTTP error rate

Goal: page when any service serves more than 5% 5xx responses for 5 minutes.

```text
Query A (trace): count of spans
  filter: http.status_code >= 500
  group by: service.name

Query B (trace): count of spans (all requests)
  group by: service.name

Formula: (A / B) * 100      -> error rate percent

Condition:
  is above 5
  for the last 5 minutes
  match type: on average

Severity: critical
Channel:  oncall-slack, pagerduty-prod
```

When the formula stays above 5 for the full window, MindOps fires one alert per affected `service.name` and routes the critical severity to PagerDuty and Slack.

## Tips for reliable rules

- Start with a generous **for duration** and tighten it once you trust the signal.
- Prefer percentiles over averages for latency conditions.
- Use `group by` sparingly on high-cardinality labels to avoid alert storms.
- Test the underlying query in a dashboard first so you know it returns data.

For seasonal signals that defeat fixed thresholds, switch to an [anomaly alert](/mindops-docs/alerts/anomaly-and-exceptions-alerts/).
