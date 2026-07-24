---
title: Host Metrics
description: Collect CPU, memory, disk, filesystem, and network metrics from a host using the OpenTelemetry Collector hostmetrics receiver, with the Docker /hostfs root_path gotcha and an example config.
---

Host metrics tell you whether the machine underneath your services is healthy. The OpenTelemetry Collector ships a `hostmetrics` receiver that scrapes CPU, memory, disk, filesystem, and network counters directly from the operating system and forwards them to MindOps.

## What you get

The receiver is organized into scrapers. Enable only the ones you care about.

| Scraper | Sample metrics |
|---------|----------------|
| `cpu` | Utilization and time per core/state |
| `memory` | Used, free, cached, buffered bytes |
| `disk` | Read/write bytes and operations |
| `filesystem` | Used and available space per mount |
| `network` | Bytes, packets, errors, dropped per interface |
| `load` | 1m / 5m / 15m load averages |
| `paging` | Swap usage and page faults |

## Minimal configuration

Run the Collector on the host and point its OTLP exporter at your MindOps endpoint.

```yaml
receivers:
  hostmetrics:
    collection_interval: 30s
    scrapers:
      cpu:
      memory:
      disk:
      filesystem:
      network:
      load:

exporters:
  otlp:
    endpoint: localhost:4317
    tls:
      insecure: true   # plaintext on a trusted local network

service:
  pipelines:
    metrics:
      receivers: [hostmetrics]
      exporters: [otlp]
```

:::note
A self-hosted MindOps deployment needs no ingestion key. On the same host, send to `localhost:4317` (OTLP gRPC) or `localhost:4318` (OTLP HTTP).
:::

## The Docker /hostfs gotcha

When the Collector runs inside a container, it sees the container's filesystem, not the host's. Without extra steps you would measure the container, not the machine. The fix is to mount the host root read-only and tell the receiver where it lives with `root_path`.

```yaml
receivers:
  hostmetrics:
    root_path: /hostfs
    collection_interval: 30s
    scrapers:
      cpu:
      memory:
      filesystem:
      network:
```

```yaml
# docker-compose service for the Collector
services:
  otel-collector:
    image: otel/opentelemetry-collector-contrib:latest
    volumes:
      - /:/hostfs:ro
      - ./config.yaml:/etc/otelcol/config.yaml
    command: ["--config=/etc/otelcol/config.yaml"]
```

:::caution
Mount the host root at exactly the path you set in `root_path`. A mismatch makes the filesystem scraper report container paths or fail silently. `:ro` keeps the mount read-only.
:::

## Verifying ingestion

1. Start the Collector and watch its logs for scrape activity.
2. Open the MindOps UI at `http://localhost:8080` and browse the metrics explorer.
3. Search for `system.cpu.utilization` or `system.memory.usage`.
4. Build a quick dashboard panel to confirm data is arriving on schedule.

## Tips

- Keep `collection_interval` at 30s or 60s; tighter intervals add cardinality and cost.
- Add a `resourcedetection` processor so each series carries the host name automatically.
- Disable scrapers you do not query to keep the metric volume lean.

For container orchestration, see [Kubernetes metrics](/mindops-docs/infrastructure/kubernetes-metrics/).
