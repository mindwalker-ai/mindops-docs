---
title: Migrating from the Grafana Stack to MindOps
description: Consolidate Prometheus, Loki, and Tempo behind a single MindOps backend, with PromQL support and a phased cutover plan.
---

A typical Grafana setup runs four moving parts — **Prometheus** for metrics, **Loki** for
logs, **Tempo** for traces, and **Grafana** for visualization — each scaled and operated
separately. MindOps folds metrics, logs, and traces into **one backend on ClickHouse**,
so you maintain a single store instead of three.

## Concept mapping

| Grafana stack | MindOps |
|---------------|---------|
| Prometheus | Metrics (ClickHouse), PromQL supported |
| Loki | Logs |
| Tempo | Traces |
| Grafana | Built-in dashboards & explorers |
| Alertmanager | Alerts |
| Exporters / Promtail | OpenTelemetry Collector receivers |
| Multiple datastores | One ClickHouse backend |

## Consolidate the backends

Replace Promtail, Tempo's distributor, and bespoke exporters with a single Collector.
Existing Prometheus scrape jobs move into the Collector's `prometheus` receiver, so you
keep your targets and relabeling while changing only where the data lands.

```yaml
receivers:
  prometheus:
    config:
      scrape_configs:
        - job_name: app
          static_configs:
            - targets: [app:8080]
exporters:
  otlp:
    endpoint: mindops-collector:4317
    tls:
      insecure: true
service:
  pipelines:
    metrics:
      receivers: [prometheus]
      exporters: [otlp]
```

## Keep your queries

MindOps supports **PromQL**, so many existing Prometheus queries and alert expressions
carry over with little or no change. Tempo traces become native MindOps traces, and Loki
log queries become filters in the Log Explorer.

## Import dashboard ideas

Rather than importing Grafana JSON verbatim, rebuild the panels that earn their place.
Keep the same metric, grouping, and time window; drop the boards nobody opens. Each panel
maps to a MindOps dashboard widget driven by PromQL or the query builder.

## Phased plan

1. **Add the Collector** and dual-ship metrics to both Prometheus and MindOps.
2. **Recreate one team's dashboard** in MindOps and compare it against Grafana.
3. **Migrate logs** by pointing your log shippers' OTLP output at the Collector.
4. **Migrate traces** from Tempo by sending app spans to the Collector.
5. **Move Alertmanager rules** to MindOps alerts, then retire the separate stores.

:::tip
Lead with the consolidation win: instead of patching Prometheus, Loki, and Tempo
independently, you operate and back up one ClickHouse cluster.
:::

:::note
Self-hosted MindOps needs no ingestion key. Reuse your Prometheus scrape configs inside
the Collector to minimize rework. See the [Introduction](/introduction/) for the model.
:::

Other guides: [Datadog](/migration/from-datadog/),
[New Relic](/migration/from-new-relic/), [ELK](/migration/from-elk/).
