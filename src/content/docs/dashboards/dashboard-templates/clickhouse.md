---
title: ClickHouse Dashboard
description: Monitor ClickHouse query throughput, memory, merges, and inserts using the OpenTelemetry clickhouse receiver in MindOps.
---

# ClickHouse Dashboard

This template tracks the performance of a ClickHouse server: query rates, memory
usage, background merges, and insert throughput. Since MindOps itself stores
telemetry in ClickHouse, this dashboard is also useful for keeping an eye on your
own observability backend.

## What it shows

- Queries per second and currently running queries
- Memory used by the server and by active queries
- Background merge activity and parts per table
- Inserted rows and bytes per second
- Failed queries and rejected inserts
- Replication queue size and delay (for replicated tables)

## Prerequisites / data source

Use the OpenTelemetry Collector's `clickhouse` receiver, which reads from the
server's system tables with a read-only monitoring user.

```yaml
receivers:
  clickhouse:
    endpoint: tcp://localhost:9000
    username: otel_monitor
    password: ${env:CLICKHOUSE_MONITOR_PASSWORD}
    collection_interval: 30s
```

| Requirement | Detail |
|-------------|--------|
| Receiver | `clickhouse` |
| Access | `SELECT` on `system.*` tables |
| Reachability | Collector reaches the native port `9000` |

:::caution
When monitoring the same ClickHouse cluster that backs MindOps, scope the
monitoring user tightly so it cannot interfere with ingestion workloads.
:::

## Import

1. Open **Dashboards** → **New** → **Import JSON** in the MindOps UI.
2. Upload the ClickHouse template JSON and save.
3. Filter by instance or table using the dashboard variables.

:::tip
Rising "parts per table" with frequent merges usually signals too many small
inserts. Batch inserts to reduce merge pressure.
:::
