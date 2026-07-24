---
title: Core Concepts
description: The essential observability concepts in MindOps, covering services, resource attributes, spans and traces, metric types, log records, cardinality, and retention.
---

This page defines the vocabulary you will see throughout MindOps. Each concept comes straight from the OpenTelemetry data model.

## Services and `service.name`

A **service** is a named unit of your system that emits telemetry, such as `checkout-service` or `payments-api`. The identity comes from the `service.name` resource attribute, which you set with an environment variable:

```bash
export OTEL_SERVICE_NAME=checkout-service
```

MindOps groups traces, metrics, and logs by `service.name`. If two processes share a name they appear as one service, so keep names stable and unique per logical component.

## Resource attributes

A **resource** describes the entity producing telemetry. Resource attributes are key/value pairs attached to every signal from that process.

| Attribute | Example | Purpose |
| --- | --- | --- |
| `service.name` | `checkout-service` | Primary grouping key. |
| `service.version` | `2.3.1` | Compare releases. |
| `deployment.environment` | `production` | Separate prod from staging. |
| `host.name` | `node-07` | Locate the emitting host. |

Set several at once with the resource attributes variable:

```bash
export OTEL_RESOURCE_ATTRIBUTES=service.version=2.3.1,deployment.environment=production
```

## Spans and traces

A **span** represents a single operation: an HTTP handler, a database query, a function call. Each span has a name, a start and end time, a status, and attributes.

A **trace** is the full tree of spans for one request. Spans link to a parent via context propagation, so a trace shows how a request fanned out across services.

```text
trace: POST /checkout            [1200ms]
├─ span: auth.verify             [40ms]
├─ span: cart.load               [120ms]
└─ span: db.query orders         [900ms]   ← the bottleneck
```

## Metric types

Metrics are numeric measurements aggregated over time. OpenTelemetry defines a few core instrument types.

| Type | Behaviour | Example |
| --- | --- | --- |
| **Counter** | Monotonically increases | total requests served |
| **Gauge** | Goes up and down | current memory in use |
| **Histogram** | Buckets a distribution | request latency p50/p95/p99 |

## Log records

A **log record** is a timestamped event with a severity, a body, and attributes. When a log is emitted inside an active span, OpenTelemetry attaches the trace and span IDs. MindOps uses those IDs to let you jump from a log line straight to its trace.

## Attributes and cardinality

**Attributes** add dimensions you can filter and group by, such as `http.status_code` or `customer.tier`. They are powerful but come with a cost called **cardinality**: the number of unique value combinations.

:::caution
Avoid putting unbounded values like user IDs, full URLs, or session tokens into **metric** attributes. High cardinality multiplies time series and inflates storage. Unbounded identifiers belong on spans and logs, not metric labels.
:::

## Retention

**Retention** controls how long each signal stays queryable before MindOps deletes it. Because ClickHouse holds the data, retention is enforced with time-to-live rules per signal.

- Set traces, metrics, and logs to different windows based on value and volume.
- Shorter retention lowers disk usage; longer retention aids historical investigation.
- Plan retention together with disk capacity, covered in [capacity planning](/mindops-docs/install/capacity-planning/).

Next, see how these signals flow through the system in the [architecture overview](/mindops-docs/overview/architecture/).
