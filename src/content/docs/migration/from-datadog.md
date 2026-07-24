---
title: Migrating from Datadog to MindOps
description: A concept-by-concept guide to moving APM, logs, metrics, monitors, and dashboards from Datadog to MindOps on OpenTelemetry.
---

Moving from Datadog to MindOps is mostly a swap of the ingestion layer: the Datadog Agent
and `ddtrace` SDKs give way to the **OpenTelemetry Collector** and OTel SDKs. Your data
model — services, traces, logs, metrics — carries over cleanly because both tools think
in the same signals.

## Concept mapping

| Datadog | MindOps |
|---------|---------|
| Datadog Agent | OpenTelemetry Collector |
| `ddtrace` / APM libraries | OpenTelemetry SDKs |
| APM & traces | Distributed tracing |
| Log Management | Logs (stored in ClickHouse) |
| Metrics / DogStatsD | OTLP metrics |
| Monitors | Alerts |
| Dashboards | Dashboards |
| `DD_API_KEY` | No ingestion key (self-hosted) |
| Tags | Resource & span attributes |

## Replace the agent

The Collector plays the same role the Datadog Agent did — receive, process, and forward —
but speaks OTLP instead of the Datadog protocol.

```yaml
receivers:
  otlp:
    protocols:
      grpc:
        endpoint: 0.0.0.0:4317
      http:
        endpoint: 0.0.0.0:4318
processors:
  batch: {}
exporters:
  otlp:
    endpoint: mindops-collector:4317
    tls:
      insecure: true
service:
  pipelines:
    traces:  { receivers: [otlp], processors: [batch], exporters: [otlp] }
    metrics: { receivers: [otlp], processors: [batch], exporters: [otlp] }
    logs:    { receivers: [otlp], processors: [batch], exporters: [otlp] }
```

Re-instrument apps by replacing `ddtrace` auto-instrumentation with the OpenTelemetry
equivalent for each language. Most map one to one; tags become OTel attributes.

## Monitors become alerts

Each Datadog monitor maps to a MindOps alert. Re-express the query against the same
underlying metric or trace data, set the same threshold, and route to the same channel
(Slack, PagerDuty, email, webhook).

## Phased plan

1. **Run side by side.** Deploy the Collector alongside the Datadog Agent and dual-ship
   so nothing goes dark during the move.
2. **Migrate one service.** Re-instrument a single non-critical service with OTel, confirm
   its traces, metrics, and logs land in MindOps.
3. **Rebuild key dashboards and monitors** for that service in MindOps.
4. **Expand service by service**, validating each before moving on.
5. **Cut over and decommission** the Datadog Agent once parity is confirmed.

:::tip
Keep Datadog running until you have rebuilt the dashboards and alerts that on-call
actually relies on. Migrate the noisiest, most-watched service first to build confidence.
:::

:::note
Self-hosted MindOps needs no ingestion key, so there is no per-host billing meter — the
cost model is your own infrastructure. See the [Introduction](/mindops-docs/introduction/) for the
architecture you are migrating onto.
:::

Other guides: [New Relic](/mindops-docs/migration/from-new-relic/),
[Grafana stack](/mindops-docs/migration/from-grafana/), [ELK](/mindops-docs/migration/from-elk/).
