---
title: Architecture
description: How the MindOps components fit together, from the OpenTelemetry Collector and ClickHouse store to the Postgres metastore, query service, and web UI.
---

MindOps is a small set of cooperating components. Understanding how they connect makes installation, scaling, and troubleshooting far easier.

## Components

| Component | Role |
| --- | --- |
| **OpenTelemetry Collector (ingester)** | Receives OTLP on ports `4317`/`4318`, batches and processes signals, writes them to ClickHouse. |
| **ClickHouse (telemetry store)** | Columnar database holding all traces, metrics, and logs. The heavy, stateful component. |
| **Postgres (metastore)** | Stores platform metadata: users, dashboards, saved views, alert rules. |
| **Query service** | Translates UI queries into ClickHouse SQL and evaluates alert rules. |
| **Web UI** | The browser front end served at `http://localhost:8080`. |

## Data flow

Telemetry moves in one direction, from your applications into storage and out to the UI.

```text
 ┌──────────────┐   OTLP gRPC :4317        ┌────────────────────────┐
 │ Your apps /  │   OTLP HTTP :4318        │ OpenTelemetry Collector │
 │ OTel SDKs    │ ───────────────────────▶ │      (ingester)         │
 └──────────────┘                          └───────────┬────────────┘
                                                        │ batched writes
                                                        ▼
                                              ┌──────────────────┐
                                              │    ClickHouse    │
                                              │ (traces/metrics/ │
                                              │      logs)       │
                                              └─────────┬────────┘
                                                        │ SQL
                                  ┌─────────────┐       ▼
   reads metadata ──────────────▶│  Postgres   │  ┌───────────────┐
   (users, dashboards, alerts)   │ (metastore) │◀─│ Query service │
                                  └─────────────┘  └───────┬───────┘
                                                           │ HTTP/JSON
                                                           ▼
                                                   ┌───────────────┐
                                                   │    Web UI     │
                                                   │  :8080        │
                                                   └───────────────┘
```

## How a request flows through

1. An instrumented service exports OTLP to the collector on `4317` or `4318`.
2. The collector batches signals and writes them into ClickHouse tables.
3. A user opens the UI at `:8080` and runs a query.
4. The query service reads dashboard and view metadata from Postgres, then issues SQL to ClickHouse.
5. Results return to the UI for visualization.

:::note
The collector is the only inbound entry point for telemetry. Applications never talk to ClickHouse directly, which keeps the storage layer isolated and lets the collector handle batching and backpressure.
:::

## Stateful versus stateless

- **Stateful:** ClickHouse and Postgres hold data and require persistent volumes.
- **Stateless:** the collector, query service, and UI hold no durable state and can be restarted or scaled freely.

This split matters when you plan storage and high availability. ClickHouse is almost always the component that dictates CPU, memory, and disk needs.

:::tip
When sizing a deployment, start from your expected telemetry volume and work backward to ClickHouse resources. See [capacity planning](/mindops-docs/install/capacity-planning/) for concrete guidance.
:::

## Where to go next

- Choose a deployment target in the [installation overview](/mindops-docs/install/overview/).
- Or jump straight to [Docker standalone](/mindops-docs/install/docker-standalone/) for the fastest self-host path.
