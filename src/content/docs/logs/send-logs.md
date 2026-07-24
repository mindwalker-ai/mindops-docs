---
title: Send Logs to MindOps
description: The three supported ways to ship logs into MindOps over OpenTelemetry, with a decision guide for picking the right path.
---

MindOps stores logs in ClickHouse and ingests them over OTLP. There are three
practical ways to get your logs in. Pick the one that matches where your logs
live today.

## The three paths

### 1. OpenTelemetry SDK (from inside the app)

Your application emits log records directly through the OpenTelemetry logging
API/SDK and exports them over OTLP. This gives the richest data: log records
arrive already structured, with severity and attributes, and they carry the
active `trace_id`/`span_id` for automatic trace correlation.

```bash
export OTEL_EXPORTER_OTLP_ENDPOINT="http://localhost:4317"
export OTEL_EXPORTER_OTLP_PROTOCOL="grpc"
export OTEL_RESOURCE_ATTRIBUTES="service.name=checkout"
```

See [Application Logs](/mindops-docs/logs/application-logs/) for per-language setup.

### 2. Collector filelog receiver (from files on disk)

If your app writes logs to files (or stdout captured to files), run an
OpenTelemetry Collector with the `filelog` receiver. It tails files, parses
each line, and forwards over OTLP. Ideal for existing services you do not want
to re-instrument.

```yaml
receivers:
  filelog:
    include: [/var/log/app/*.log]
    operators:
      - type: json_parser
exporters:
  otlp:
    endpoint: localhost:4317
    tls:
      insecure: true
service:
  pipelines:
    logs:
      receivers: [filelog]
      exporters: [otlp]
```

### 3. Log agents (FluentBit, Vector, Logstash) → OTLP

If you already run a log shipper, keep it and point its OTLP output at MindOps.
FluentBit and Vector both speak OTLP natively, so you forward to the gRPC
endpoint on `:4317` or the HTTP endpoint on `:4318`.

```ini
[OUTPUT]
    Name        opentelemetry
    Match       *
    Host        localhost
    Port        4318
    Logs_uri    /v1/logs
```

## Decision guide

| Situation | Recommended path |
|-----------|------------------|
| New service you control | OTel SDK |
| Existing service, logs in files | Collector filelog receiver |
| Already running FluentBit/Vector | Agent → OTLP |
| Need trace ↔ log correlation | OTel SDK |
| Kubernetes container stdout | Collector or agent DaemonSet |

:::note
On a self-hosted MindOps deployment you do **not** need an ingestion key. Send
straight to OTLP `:4317` (gRPC) or `:4318` (HTTP). Authentication headers are
only required for managed/cloud setups.
:::

:::tip
You can mix paths. A common pattern is SDK logs for app code plus a filelog
receiver for third-party services that only write files.
:::

Once data is flowing, open the UI at `http://localhost:8080` and explore it in
the [Log Explorer](/mindops-docs/logs/log-explorer/).
