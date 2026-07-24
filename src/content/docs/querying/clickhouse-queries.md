---
title: ClickHouse Queries
description: Write raw ClickHouse SQL for MindOps panels and alerts. Learn the trace, log, and metric table shapes and see example queries.
---

MindOps stores every trace, log, and metric in ClickHouse. The ClickHouse query mode lets you write SQL directly against those tables when the Query Builder is not expressive enough — for joins, window functions, subqueries, or unusual aggregates.

## When to use raw SQL

Switch a panel or alert to ClickHouse mode when you need to:

- Join across signals or against a lookup.
- Use window functions or `arrayJoin`.
- Compute a column the Builder cannot express.
- Reuse an existing SQL report verbatim.

For simpler questions, the [Query Builder](/mindops-docs/querying/query-builder/) is faster and less error-prone.

## Required output shape

For a Time Series panel, your query must return a time column and one or more value columns. MindOps reads the time column to place points on the axis.

```sql
SELECT
  toStartOfInterval(timestamp, INTERVAL 1 MINUTE) AS ts,
  count() AS value
FROM logs
WHERE severity_text = 'ERROR'
GROUP BY ts
ORDER BY ts
```

:::tip
Use the time-bucketing functions `toStartOfMinute`, `toStartOfInterval`, or `toStartOfFiveMinute` so points align to clean intervals. Always `ORDER BY` the time column.
:::

## Table shapes

The exact column set depends on your collector configuration, but the signals share a common shape.

### Traces (spans)

| Column | Meaning |
|--------|---------|
| `timestamp` | Span start time |
| `trace_id`, `span_id` | Identifiers |
| `service_name` | Emitting service |
| `name` | Span / operation name |
| `duration_nano` | Span duration in nanoseconds |
| `status_code` | OK / ERROR |
| resource & span attributes | Key-value tags |

### Logs

| Column | Meaning |
|--------|---------|
| `timestamp` | Log time |
| `severity_text` | Level (INFO, ERROR, ...) |
| `body` | Log message |
| `trace_id` | Correlated trace, if any |
| attributes | Structured fields |

### Metrics

| Column | Meaning |
|--------|---------|
| `metric_name` | Metric identifier |
| `timestamp` | Sample time |
| `value` | Sample value |
| labels | Dimensions such as `host_name` |

## Example queries

Slowest operations by p99 latency:

```sql
SELECT service_name, name,
       quantile(0.99)(duration_nano) / 1e6 AS p99_ms
FROM traces
WHERE timestamp >= now() - INTERVAL 1 HOUR
GROUP BY service_name, name
ORDER BY p99_ms DESC
LIMIT 20
```

Error logs correlated with a trace:

```sql
SELECT timestamp, service_name, body
FROM logs
WHERE severity_text = 'ERROR' AND trace_id != ''
ORDER BY timestamp DESC
LIMIT 100
```

## Using SQL in alerts

The same SQL drives alerts: return a single value column and a time column, and set a threshold condition on the value. This is the most flexible way to alert on a bespoke calculation.

:::caution
Always constrain the time range with a `timestamp` predicate (or rely on the panel's injected range). Unbounded scans over large telemetry tables are slow and expensive.
:::

For metric-only queries with a Prometheus flavor, see [PromQL](/mindops-docs/querying/promql/).
