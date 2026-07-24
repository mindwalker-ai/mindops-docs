---
title: Redis Dashboard
description: Monitor Redis throughput, memory, hit ratio, and clients using the OpenTelemetry redis receiver in MindOps.
---

# Redis Dashboard

This template provides a focused view of a Redis instance: command throughput,
memory pressure, keyspace efficiency, and client connections. It is fed by the
OpenTelemetry Collector's `redis` receiver.

## What it shows

- Commands processed per second
- Keyspace hits versus misses (cache hit ratio)
- Used memory, peak memory, and fragmentation ratio
- Connected clients and blocked clients
- Evicted and expired keys
- Replication offset and connected replicas

## Prerequisites / data source

Enable the `redis` receiver on a Collector that can reach the instance. The
receiver issues the `INFO` command, so the user must be allowed to run it.

```yaml
receivers:
  redis:
    endpoint: localhost:6379
    password: ${env:REDIS_PASSWORD}
    collection_interval: 30s
```

| Requirement | Detail |
|-------------|--------|
| Receiver | `redis` |
| Command | `INFO` access on the instance |
| Reachability | Collector reaches Redis on port `6379` |

:::caution
Point one receiver at each node. A single `redis` receiver reads one endpoint, so
monitor primaries and replicas separately.
:::

## Import

1. Open **Dashboards** → **New** → **Import JSON** in MindOps.
2. Upload the Redis template JSON.
3. Select the instance via the dashboard variable.

:::tip
Rising evictions with a high memory fragmentation ratio usually points to
`maxmemory` pressure. Pair this dashboard with latency alerts for early warning.
:::
