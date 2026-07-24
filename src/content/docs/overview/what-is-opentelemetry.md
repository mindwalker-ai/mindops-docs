---
title: What is OpenTelemetry?
description: A practical explanation of OpenTelemetry signals, the OTLP protocol, SDKs versus the Collector, and how MindOps uses it as its native data foundation.
---

OpenTelemetry (often shortened to OTel) is an open standard for generating, collecting, and exporting telemetry data. It is a vendor-neutral project under the Cloud Native Computing Foundation, and it defines both the data model and the wire protocol that MindOps speaks natively.

## The three signals

OpenTelemetry standardizes three signal types, which map directly onto the pillars MindOps stores.

- **Traces** describe the path of a request across services as a tree of spans.
- **Metrics** are numeric measurements aggregated over time, such as counters and histograms.
- **Logs** are timestamped records of discrete events, ideally correlated with traces.

A single instrumented request can produce all three at once, tied together by shared context.

## OTLP: the wire protocol

OTLP (OpenTelemetry Protocol) is how instrumented apps and collectors transmit data. It runs over two transports:

| Transport | Default port | Notes |
| --- | --- | --- |
| gRPC | `4317` | Efficient binary streaming, common for SDKs. |
| HTTP/protobuf | `4318` | Firewall-friendly, easy to use from browsers and curl. |

MindOps accepts OTLP on both ports out of the box. A minimal exporter configuration looks like this:

```bash
export OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4317
export OTEL_SERVICE_NAME=checkout-service
```

:::note
For self-hosted MindOps you do not set any API key or authentication header. The endpoint above is all an SDK needs.
:::

## SDKs versus the Collector

There are two layers in an OpenTelemetry pipeline, and it helps to keep them distinct.

### SDKs (in your application)

Language SDKs live inside your service. They create spans, record metrics, capture logs, and export them over OTLP. Many frameworks also have **auto-instrumentation** that wires up HTTP, database, and messaging spans without code changes.

### The Collector (a standalone process)

The OpenTelemetry Collector is a separate binary that receives, processes, and forwards telemetry. It is organized as pipelines of **receivers**, **processors**, and **exporters**:

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
  clickhouse:
    endpoint: tcp://clickhouse:9000
service:
  pipelines:
    traces:
      receivers: [otlp]
      processors: [batch]
      exporters: [clickhouse]
```

## Why vendor-neutral matters

Because instrumentation follows an open standard, you are never locked into one backend. The same SDK output can flow to MindOps today and somewhere else tomorrow with only an endpoint change. Your application code stays clean and portable.

## How MindOps uses OpenTelemetry

MindOps ships an OpenTelemetry Collector as its ingestion layer. Your apps export OTLP to that collector, which batches and writes signals into ClickHouse. The MindOps UI then queries that store. Nothing proprietary touches your code.

Continue with the [core concepts](/overview/core-concepts/) to learn the data model in detail.
