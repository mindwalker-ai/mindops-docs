---
title: Log Fields and Attributes
description: Understand the MindOps log record model — body, severity, resource vs log attributes, indexed fields, and JSON bodies.
---

Every log in MindOps follows the OpenTelemetry log data model. Knowing which
part of the record holds your data makes filtering and parsing predictable.

## The log record model

| Field | Meaning |
|-------|---------|
| `timestamp` | When the event occurred |
| `observed_timestamp` | When the collector/agent saw it |
| `body` | The raw message (string or structured map) |
| `severity_text` | Human label: `INFO`, `WARN`, `ERROR` |
| `severity_number` | Numeric severity 1–24 for range queries |
| `trace_id` / `span_id` | Trace correlation context |
| `resource attributes` | Who produced the log |
| `log attributes` | Details about this specific event |

## Resource vs log attributes

The distinction matters for both querying and cost.

- **Resource attributes** describe the source and are the same for every record
  from that source: `service.name`, `host.name`, `k8s.pod.name`,
  `deployment.environment`. Set them once via `OTEL_RESOURCE_ATTRIBUTES`.
- **Log attributes** vary per event: `http.status_code`, `user.id`,
  `order.amount`, `db.statement`.

```text
resource:  { service.name: checkout, deployment.environment: prod }
attributes:{ http.method: POST, http.status_code: 503, order.id: A-552 }
body:      "upstream timeout calling payments"
```

## Severity

`severity_number` maps text labels onto a numeric scale, so you can write range
filters instead of long OR lists.

```text
severity_number >= 17   # WARN and above (WARN=13..., ERROR=17, FATAL=21)
```

| Text | Number range |
|------|--------------|
| TRACE | 1–4 |
| DEBUG | 5–8 |
| INFO | 9–12 |
| WARN | 13–16 |
| ERROR | 17–20 |
| FATAL | 21–24 |

## Indexed fields

MindOps indexes core fields and selected attributes in ClickHouse so filters
return quickly. `timestamp`, `severity_number`, `trace_id`, `service.name`, and
the body are indexed by default. High-value custom attributes can be promoted to
indexed fields so dashboards and alerts on them stay fast.

:::tip
Filtering on an indexed attribute (e.g. `service.name`) is far cheaper than
full-text scanning the `body`. Push frequently-queried values into attributes,
not into free-form text.
:::

## JSON log bodies

If your `body` is JSON, parse it at ingestion so its keys become queryable
attributes instead of an opaque string.

```json
{ "level": "error", "msg": "payment failed", "order_id": "A-552", "amount": 49.9 }
```

A JSON parser in a log pipeline lifts `level`, `msg`, `order_id`, and `amount`
into attributes you can filter and group by.

:::note
Parsing JSON bodies, mapping `level` to severity, and extracting `trace_id` are
all handled by [Log Pipelines](/mindops-docs/logs/pipelines/) and the recipes in
[Parsing Guides](/mindops-docs/logs/parsing-guides/).
:::
