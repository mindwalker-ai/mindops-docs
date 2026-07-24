---
title: Temporal Dashboard
description: Monitor Temporal workflow and activity metrics, task queue lag, and worker health using the Prometheus receiver in MindOps.
---

# Temporal Dashboard

This template visualizes the health of a Temporal deployment: workflow and
activity execution rates, task queue backlog, and worker capacity. It is built
from the metrics Temporal services and SDK workers expose in Prometheus format.

## What it shows

- Workflow start, completion, and failure rates
- Activity execution latency and failures
- Task queue schedule-to-start latency (backlog indicator)
- Sticky cache hit ratio for workflow workers
- Worker task slots available and in use
- Persistence latency for the Temporal cluster services

## Prerequisites / data source

Temporal exposes metrics in Prometheus format from both the cluster services and
the SDK workers. Scrape them with the OpenTelemetry Collector's `prometheus`
receiver and export to MindOps.

```yaml
receivers:
  prometheus:
    config:
      scrape_configs:
        - job_name: temporal-server
          scrape_interval: 30s
          static_configs:
            - targets: ['temporal:9090']
        - job_name: temporal-worker
          static_configs:
            - targets: ['worker:9091']
```

| Requirement | Detail |
|-------------|--------|
| Receiver | `prometheus` |
| Server metrics | Temporal services Prometheus endpoint |
| Worker metrics | SDK metrics handler exposed for scraping |

:::note
SDK workers only emit metrics when you configure a Prometheus metrics handler in
the client options. Without it, the worker-side panels stay empty.
:::

## Import

1. In MindOps, go to **Dashboards** → **New** → **Import JSON**.
2. Upload the Temporal template JSON and save.
3. Filter by namespace or task queue using the dashboard variables.

:::tip
Schedule-to-start latency is the clearest sign that workers cannot keep up. If it
climbs, add worker capacity or raise task slot limits.
:::
