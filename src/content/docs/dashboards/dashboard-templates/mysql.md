---
title: MySQL Dashboard
description: Track MySQL queries, connections, buffer pool, and InnoDB activity using the OpenTelemetry mysql receiver in MindOps.
---

# MySQL Dashboard

This template provides a working view of a MySQL or MariaDB server, covering query
throughput, connection usage, the InnoDB buffer pool, and lock behavior. It draws
on the OpenTelemetry Collector's `mysql` receiver.

## What it shows

- Queries and questions per second
- Connection count, aborted connects, and thread usage
- InnoDB buffer pool usage and read efficiency
- Row operations: reads, inserts, updates, deletes
- Table lock waits and row lock time
- Slow query count and handler statistics

## Prerequisites / data source

Configure the `mysql` receiver on a Collector with a read-only monitoring user.

```yaml
receivers:
  mysql:
    endpoint: localhost:3306
    username: otel_monitor
    password: ${env:MYSQL_MONITOR_PASSWORD}
    collection_interval: 30s
```

| Requirement | Detail |
|-------------|--------|
| Receiver | `mysql` |
| Grants | `SELECT`, `PROCESS`, and `REPLICATION CLIENT` |
| Reachability | Collector reaches the server on port `3306` |

:::note
Many panels rely on `performance_schema` and global status counters. Confirm the
Performance Schema is enabled if statement-level panels stay empty.
:::

## Import

1. Open **Dashboards** → **New** → **Import JSON** in the MindOps UI.
2. Upload the MySQL template JSON and save.
3. Filter by instance using the dashboard variable.

:::tip
A low buffer pool hit ratio combined with rising disk reads usually means the pool
is undersized for the working set.
:::
