---
title: Ship Vector Logs to MindOps
description: Forward logs collected by Vector to MindOps using the OpenTelemetry sink over OTLP/HTTP.
---

Vector is a high-throughput observability data pipeline. Its `opentelemetry` sink emits OTLP records that MindOps ingests directly, making Vector a fast way to centralize logs from many hosts.

## Configure a source and the OpenTelemetry sink

This `vector.yaml` tails files, tags them with a service name, and forwards to MindOps.

```yaml
sources:
  app_logs:
    type: file
    include:
      - /var/log/app/*.log

transforms:
  add_service:
    type: remap
    inputs: [app_logs]
    source: |
      .service.name = "edge-proxy"

sinks:
  mindops:
    type: opentelemetry
    inputs: [add_service]
    protocol:
      type: http
      # Self-hosted MindOps needs NO ingestion key.
      uri: http://localhost:4318/v1/logs
      encoding:
        codec: json
      framing:
        method: newline_delimited
```

## Where the endpoint goes

The sink `uri` targets the MindOps OTLP HTTP logs receiver.

| Deployment | uri |
|------------|-----|
| Local install | `http://localhost:4318/v1/logs` |
| Vector in Docker Compose | `http://signoz-ingester:4318/v1/logs` |

:::tip
Use the `remap` transform (VRL) to enrich records with attributes like `host`, `deployment.environment`, or a parsed log level before they reach MindOps. Clean attributes make filtering in the Logs view far easier.
:::

## Verify in MindOps

Open `http://localhost:8080`, go to **Logs**, and filter on `service.name = edge-proxy`. Append a line to a file under `/var/log/app/` and confirm Vector forwards it into the MindOps stream within a few seconds.
