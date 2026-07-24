---
title: MongoDB Dashboard
description: Observe MongoDB operations, connections, cache, and memory with the OpenTelemetry mongodb receiver in MindOps.
---

# MongoDB Dashboard

This template tracks the health of a MongoDB deployment: operation throughput,
connection usage, the WiredTiger cache, and memory footprint. It is driven by the
OpenTelemetry Collector's `mongodb` receiver.

## What it shows

- Operations per second by type (query, insert, update, delete, getmore)
- Active and available connections
- WiredTiger cache usage and dirty bytes
- Document and index counts per database
- Resident and virtual memory usage
- Global lock and cursor activity

## Prerequisites / data source

Enable the `mongodb` receiver on a Collector with a user holding the
`clusterMonitor` role.

```yaml
receivers:
  mongodb:
    hosts:
      - endpoint: localhost:27017
    username: otel_monitor
    password: ${env:MONGODB_MONITOR_PASSWORD}
    collection_interval: 30s
    tls:
      insecure: true
```

| Requirement | Detail |
|-------------|--------|
| Receiver | `mongodb` |
| Role | `clusterMonitor` on the admin database |
| Reachability | Collector reaches each `mongod` on port `27017` |

:::note
For a replica set or sharded cluster, list each node under `hosts` so the receiver
can collect from every member.
:::

## Import

1. In MindOps, open **Dashboards** → **New** → **Import JSON**.
2. Upload the MongoDB template JSON.
3. Use the database variable to scope panels.

:::tip
Watch cache dirty bytes and eviction activity together. Sustained high dirty bytes
can indicate write pressure outpacing checkpointing.
:::
