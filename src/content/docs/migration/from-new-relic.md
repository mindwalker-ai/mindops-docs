---
title: Migrating from New Relic to MindOps
description: Map New Relic APM, NRQL, dashboards, and alert conditions to MindOps and swap the New Relic agent for the OpenTelemetry Collector.
---

New Relic and MindOps both center on services, traces, and a single backend for all
signals — so the migration is mainly about replacing the **New Relic agent** with the
**OpenTelemetry Collector** and SDKs, then rebuilding dashboards and alerts.

## Concept mapping

| New Relic | MindOps |
|-----------|---------|
| APM / language agent | OpenTelemetry SDK |
| Infrastructure agent | OpenTelemetry Collector |
| Distributed tracing | Distributed tracing |
| Logs | Logs (ClickHouse) |
| Dimensional metrics | OTLP metrics |
| NRQL queries | Query builder over ClickHouse |
| Alert conditions / policies | Alerts |
| Dashboards | Dashboards |
| License / ingest key | No ingestion key (self-hosted) |

## Swap the agent for OpenTelemetry

New Relic's language agents auto-instrument your app; OpenTelemetry's SDKs do the same job
with a vendor-neutral format. Remove the NR agent and add the OTel SDK or auto-instrumentation
for each runtime, then export to a Collector.

```bash
# Point instrumented apps at the Collector instead of New Relic
export OTEL_EXPORTER_OTLP_ENDPOINT="http://collector:4318"
export OTEL_EXPORTER_OTLP_PROTOCOL="http/protobuf"
export OTEL_SERVICE_NAME="payments"
export OTEL_RESOURCE_ATTRIBUTES="deployment.environment=prod"
```

The Collector receives OTLP and forwards to MindOps — no New Relic license key in the
pipeline anywhere.

## Translate NRQL, dashboards, and alerts

- **NRQL → query builder.** Where you wrote NRQL, rebuild the equivalent aggregation in
  the MindOps query builder against the same metric, trace, or log data.
- **Dashboards.** Recreate the panels that matter; keep the same groupings and time
  windows so the views feel familiar to your team.
- **Alert conditions → alerts.** Each condition becomes a MindOps alert with the same
  threshold and notification target.

## Phased cutover

1. **Dual-ship.** Run the Collector beside the New Relic agent so both backends receive
   data during the transition.
2. **Pilot one service.** Re-instrument it with OTel and verify signal parity in MindOps.
3. **Rebuild that service's dashboards and alert conditions.**
4. **Roll outward** across services, validating each.
5. **Remove the New Relic agents and keys** once on-call trusts MindOps.

:::tip
Migrate a representative service end to end before touching the rest. Proving traces,
logs, metrics, and alerts all work for one service de-risks the whole program.
:::

:::note
Self-hosted MindOps needs no ingestion or license key — telemetry flows over plain OTLP
(`:4317`/`:4318`). See the [Introduction](/introduction/) for the target architecture.
:::

Other guides: [Datadog](/migration/from-datadog/),
[Grafana stack](/migration/from-grafana/), [ELK](/migration/from-elk/).
