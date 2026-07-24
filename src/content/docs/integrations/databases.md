---
title: Monitoring Databases with MindOps
description: Collect MySQL, PostgreSQL, MongoDB, and Redis metrics with OpenTelemetry Collector receivers and surface them in MindOps.
---

Databases are usually the first place latency shows up under load. MindOps monitors them
through purpose-built Collector receivers that connect with a read-only user and pull the
engine's own statistics — no agent on the database host required.

## Create a read-only user

Each receiver needs credentials with permission to read server statistics. Grant the
minimum: `SELECT` on system views (PostgreSQL), `PROCESS`/`REPLICATION CLIENT` (MySQL),
the `clusterMonitor` role (MongoDB), or `INFO` access (Redis). Never reuse an application
account.

## Example: PostgreSQL and Redis

```yaml
receivers:
  postgresql:
    endpoint: db:5432
    username: ${env:PG_MONITOR_USER}
    password: ${env:PG_MONITOR_PASS}
    databases: [orders, billing]
    tls:
      insecure: true
    collection_interval: 30s
  redis:
    endpoint: cache:6379
    password: ${env:REDIS_PASS}
    collection_interval: 30s
exporters:
  otlp:
    endpoint: mindops-collector:4317
    tls:
      insecure: true
service:
  pipelines:
    metrics:
      receivers: [postgresql, redis]
      exporters: [otlp]
```

MySQL and MongoDB follow the same shape — swap in the `mysql` or `mongodb` receiver with
their endpoint and credentials.

## Key metrics by engine

| Engine | Receiver | Metrics that matter |
|--------|----------|---------------------|
| MySQL | `mysql` | buffer-pool usage, operations/s, slow queries, threads connected |
| PostgreSQL | `postgresql` | active connections, commits/rollbacks, cache hit ratio, deadlocks |
| MongoDB | `mongodb` | connections, ops/s by type, cache dirty bytes, replication lag |
| Redis | `redis` | memory used, hit/miss ratio, evicted keys, blocked clients |

## Reading the signals

- **Connection saturation** — connections approaching `max_connections` precedes refused
  queries. Alert before you hit the ceiling.
- **Cache efficiency** — a falling buffer-pool or Redis hit ratio means more disk reads
  and slower queries.
- **Replication lag** — a replica drifting behind risks serving stale reads or a slow
  failover.

:::tip
Combine these database metrics with traces from your application. When `postgresql`
connection counts spike, the trace view shows which endpoint opened the flood of queries.
:::

:::note
Self-hosted MindOps needs no ingestion key. Once metrics arrive, turn them into a
dashboard per database and add alerts for connection saturation and replication lag.
:::

See [Integrations Overview](/mindops-docs/integrations/overview/) to add more receivers to the same
Collector.
