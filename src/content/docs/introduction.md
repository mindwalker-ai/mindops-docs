---
title: Introduction
description: What MindOps is, what it does, and how it is built on OpenTelemetry and ClickHouse.
---

**MindOps** is an open observability platform that brings your **traces, metrics, and
logs** together in a single pane of glass. Instead of stitching together separate tools
for each signal, you run one backend that ingests, stores, and correlates all of your
telemetry — so you can find and fix issues in production quickly.

MindOps is built natively on **OpenTelemetry**, the open standard for instrumentation.
Your applications emit data using vendor-neutral SDKs and collectors, which means you are
never locked into a proprietary agent or format.

## What you can do with MindOps

- **Application Performance Monitoring (APM)** — Out-of-the-box service dashboards for
  latency (p50/p90/p99), error rate, request throughput, and Apdex, derived automatically
  from your traces.
- **Distributed tracing** — Visualize a single request as it flows across microservices
  using flamegraphs and Gantt charts, and pinpoint the exact span where time is spent.
- **Logs management** — Ingest high-volume logs into a column store built for scale, with
  fast filtering, aggregations, and pipelines for parsing and enrichment.
- **Metrics & dashboards** — Store time-series metrics from your applications and
  infrastructure, and compose custom dashboards with multiple visualization types.
- **Alerts** — Define threshold and anomaly-based alerts across every signal and route
  them to Slack, PagerDuty, email, or a webhook.
- **Exception monitoring** — Automatically capture and group application exceptions, tied
  back to the trace that produced them.

## How MindOps is built

MindOps uses **OpenTelemetry** as its only ingestion layer. All telemetry flows through an
**OpenTelemetry Collector**, which receives data over OTLP (gRPC on port `4317`, HTTP on
`4318`), batches and enriches it, and writes it to **ClickHouse** — a high-performance
columnar database that powers fast queries over traces, logs, and metrics at scale.

```text
  Your apps ──(OTLP)──▶  OpenTelemetry Collector ──▶  ClickHouse  ──▶  MindOps UI
   traces                  receive · batch ·              columnar        dashboards
   metrics                 enrich · export               storage         traces · logs
   logs                                                                   alerts
```

Because everything is OpenTelemetry under the hood, the three signals stay correlated:
traces link to the logs emitted during them, and exceptions are embedded directly in spans.

## The three pillars

| Pillar | What it answers | Where to look |
| --- | --- | --- |
| **Traces** | *Where* is a request slow or failing? | [Distributed Tracing](/mindops-docs/traces/overview/) |
| **Metrics** | *How* is the system behaving over time? | [Metrics](/mindops-docs/metrics/overview/) |
| **Logs** | *Why* did something happen? | [Logs](/mindops-docs/logs/overview/) |

## Next steps

1. **[Self-host MindOps with Docker](/mindops-docs/get-started/install-docker/)** — get a full instance
   running locally in minutes.
2. **[Send your first data](/mindops-docs/get-started/send-data/)** — point an application at MindOps
   and watch telemetry arrive.
3. **[Learn the core concepts](/mindops-docs/get-started/concepts/)** — OTLP, the collector, services,
   and signals.
