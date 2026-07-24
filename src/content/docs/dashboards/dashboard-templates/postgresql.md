---
title: PostgreSQL Dashboard
description: Monitor PostgreSQL throughput, connections, locks, and cache hit ratio using the OpenTelemetry postgresql receiver in MindOps.
---

# PostgreSQL Dashboard

This template gives you an operational view of a PostgreSQL instance: query
throughput, connection saturation, lock activity, and cache efficiency. It is
populated by the OpenTelemetry Collector's `postgresql` receiver.

## What it shows

- Commits and rollbacks per second by database
- Active connections versus the configured maximum
- Rows fetched, inserted, updated, and deleted
- Index versus sequential scan ratio
- Block reads served from cache versus disk (cache hit ratio)
- Database size, deadlocks, and replication lag

## Prerequisites / data source

Enable the `postgresql` receiver on an OpenTelemetry Collector that can reach the
database. Use a monitoring role with the minimum required grants.

```yaml
receivers:
  postgresql:
    endpoint: localhost:5432
    username: otel_monitor
    password: ${env:POSTGRES_MONITOR_PASSWORD}
    databases:
      - app_production
    collection_interval: 30s
    tls:
      insecure: false
```

| Requirement | Detail |
|-------------|--------|
| Receiver | `postgresql` |
| Role | `pg_monitor` role membership recommended |
| Reachability | Collector must connect on port `5432` |

:::caution
Store the database password in an environment variable or secret, never inline in
the Collector config that gets committed.
:::

## Import

1. Go to **Dashboards** → **New** → **Import JSON** in MindOps.
2. Upload the PostgreSQL template JSON.
3. Select the target database via the dashboard variable.

:::tip
A falling cache hit ratio or rising sequential scans often signals a missing
index or memory pressure. Watch these alongside connection saturation.
:::
