---
title: Collector Configuration
description: The anatomy of an OpenTelemetry Collector config — receivers, processors, exporters, and pipelines — with a full example that exports to MindOps.
---

Every Collector is described by a single YAML file with four top-level sections: `receivers`, `processors`, `exporters`, and `service`. The first three *define* components; `service` *wires* them into pipelines. A component that is defined but not referenced in `service` does nothing.

## The four sections

| Section | Role |
|---------|------|
| `receivers` | How data gets **in** (OTLP, hostmetrics, filelog) |
| `processors` | How data is **shaped** in flight (batch, resourcedetection, memory_limiter) |
| `exporters` | Where data goes **out** (otlp to MindOps) |
| `service` | Assembles the above into `traces` / `metrics` / `logs` pipelines |

## Receivers

```yaml
receivers:
  otlp:                      # accept telemetry from your apps' SDKs
    protocols:
      grpc: { endpoint: 0.0.0.0:4317 }
      http: { endpoint: 0.0.0.0:4318 }
  hostmetrics:               # scrape the host machine
    collection_interval: 30s
    scrapers: { cpu: {}, memory: {}, disk: {}, network: {} }
  filelog:                   # tail log files into log records
    include: [/var/log/app/*.log]
    start_at: end
```

## Processors

Order in the pipeline is the order of execution. A good default ordering:

```yaml
processors:
  memory_limiter:            # FIRST — shed load before OOM
    check_interval: 1s
    limit_percentage: 80
    spike_limit_percentage: 25
  resourcedetection:         # add host.name, cloud, os metadata
    detectors: [env, system]
  batch:                     # LAST — group records for efficient export
    send_batch_size: 8192
    timeout: 5s
```

- **`memory_limiter`** guards the process; place it first so it can reject data under pressure.
- **`resourcedetection`** enriches records with environment metadata so MindOps can group by host and environment.
- **`batch`** improves throughput and should be the last processor before export.

## Exporters

```yaml
exporters:
  otlp/mindops:
    endpoint: mindops:4317
    tls:
      insecure: true         # in-network; enable TLS across boundaries
    retry_on_failure:
      enabled: true
    sending_queue:
      enabled: true
```

## Service: wiring the pipelines

```yaml
service:
  pipelines:
    traces:
      receivers: [otlp]
      processors: [memory_limiter, resourcedetection, batch]
      exporters: [otlp/mindops]
    metrics:
      receivers: [otlp, hostmetrics]
      processors: [memory_limiter, resourcedetection, batch]
      exporters: [otlp/mindops]
    logs:
      receivers: [otlp, filelog]
      processors: [memory_limiter, resourcedetection, batch]
      exporters: [otlp/mindops]
```

:::tip
Add a `debug` exporter to a pipeline temporarily to print records to the Collector's stdout while you validate a config — then remove it before production.
:::

:::note
The MindOps OTLP endpoint requires no ingestion key for self-hosted deployments — no auth header is needed in the exporter. The UI is reachable at `http://localhost:8080`.
:::

This same structure scales from a single [Docker container](/collection-agents/docker/) to a [Kubernetes gateway](/collection-agents/kubernetes/). For volume control, add a [filter processor](/traces/drop-spans/) or [tail sampling](/traces/tail-sampling/) to the traces pipeline.
