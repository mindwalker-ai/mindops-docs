---
title: What is MindOps?
description: An overview of MindOps, the self-hosted, OpenTelemetry-native observability platform that unifies traces, metrics, and logs in a single pane of glass.
---

MindOps is a self-hosted, open observability platform that brings your traces, metrics, and logs together in one place. It is built on [OpenTelemetry](/mindops-docs/overview/what-is-opentelemetry/) from the ground up and stores telemetry in ClickHouse, with Postgres holding platform metadata. You run it on your own infrastructure with Docker, and the web UI is served at `http://localhost:8080`.

## The single pane of glass

Modern systems emit a flood of signals from dozens of services. When those signals live in separate tools, debugging means jumping between tabs and losing context. MindOps solves this by correlating everything in one workspace:

- Jump from a slow trace directly to the logs emitted during that request.
- Pivot from a spiking metric to the exact services responsible for it.
- Keep one mental model instead of stitching together three vendors.

## The three pillars

MindOps treats observability as three complementary signal types.

| Pillar | Answers | Example |
| --- | --- | --- |
| **Traces** | *Where* did time go in a request? | A checkout request took 1.2s; 900ms was a database call. |
| **Metrics** | *How much* and *how often*? | p99 latency, request rate, error percentage, CPU usage. |
| **Logs** | *What* happened in detail? | A stack trace, a payment failure reason, an audit entry. |

Each pillar is useful alone, but the real value is correlating them. MindOps links spans, metric exemplars, and log records by shared resource attributes such as `service.name`.

## Who it is for

- **Platform and SRE teams** who want full ownership of their telemetry pipeline and data.
- **Backend and application engineers** debugging latency, errors, and regressions.
- **Privacy- or compliance-sensitive organizations** that need data to stay inside their own network.

## Why teams choose MindOps

### OpenTelemetry-native

MindOps does not invent a proprietary agent or wire format. You instrument with standard OpenTelemetry SDKs and ship data over OTLP. If you already emit OpenTelemetry, you are ready to send it to MindOps today.

### No vendor lock-in

Because instrumentation is vendor-neutral, your application code has no MindOps-specific dependencies. Point your exporter somewhere else and your apps keep working unchanged. Your data lives in ClickHouse, a database you can query directly.

### Self-hosted and cost-predictable

Run MindOps on a laptop, a single VM, or a Kubernetes cluster. There is no per-host or per-gigabyte billing surprise, and telemetry never leaves your environment.

:::tip
Self-hosted MindOps requires **no ingestion key**. Send OTLP straight to the collector on `localhost:4317` (gRPC) or `localhost:4318` (HTTP) with no authentication header.
:::

## Next steps

- Learn the [core concepts](/mindops-docs/overview/core-concepts/) behind services, spans, and attributes.
- Understand the [architecture](/mindops-docs/overview/architecture/) that powers ingestion and storage.
- Get hands-on with the [installation overview](/mindops-docs/install/overview/).
