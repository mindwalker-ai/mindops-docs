---
title: Collector on a VM
description: Run the OpenTelemetry Collector on a virtual machine under systemd, collect host metrics and log files, and export OTLP to MindOps.
---

On a plain virtual machine or bare-metal host, the Collector runs as a long-lived background service managed by `systemd`. It gathers the machine's own metrics, tails its log files, accepts OTLP from local apps, and ships everything to MindOps.

## Install and run under systemd

After installing the Collector package, it ships with a unit file. Drop your configuration at `/etc/otelcol/config.yaml` and manage the service:

```bash
sudo systemctl enable otelcol
sudo systemctl restart otelcol
sudo systemctl status otelcol
journalctl -u otelcol -f      # follow the Collector's own logs
```

## Configuration

This config combines three receivers — OTLP for app telemetry, `hostmetrics` for the machine, and `filelog` for log files — and exports to MindOps.

```yaml
receivers:
  otlp:
    protocols:
      grpc: { endpoint: 0.0.0.0:4317 }
      http: { endpoint: 0.0.0.0:4318 }

  hostmetrics:
    collection_interval: 30s
    scrapers:
      cpu: {}
      memory: {}
      load: {}
      disk: {}
      filesystem: {}
      network: {}

  filelog:
    include:
      - /var/log/myapp/*.log
    start_at: end

processors:
  resourcedetection:
    detectors: [env, system]
  memory_limiter:
    check_interval: 1s
    limit_percentage: 80
  batch: {}

exporters:
  otlp/mindops:
    endpoint: mindops.internal:4317
    tls:
      insecure: true

service:
  pipelines:
    metrics:
      receivers: [hostmetrics, otlp]
      processors: [memory_limiter, resourcedetection, batch]
      exporters: [otlp/mindops]
    logs:
      receivers: [filelog, otlp]
      processors: [memory_limiter, resourcedetection, batch]
      exporters: [otlp/mindops]
    traces:
      receivers: [otlp]
      processors: [memory_limiter, resourcedetection, batch]
      exporters: [otlp/mindops]
```

### What each piece does

| Component | Purpose |
|-----------|---------|
| `hostmetrics` | CPU, memory, disk, network, and load for the VM |
| `filelog` | Tails app log files and turns lines into log records |
| `resourcedetection` | Stamps records with `host.name` and OS metadata |
| `memory_limiter` | Protects the VM from OOM if the backend slows down |

:::tip
Set `start_at: end` on `filelog` so a Collector restart does not replay the entire log file. Use `start_at: beginning` only for an initial backfill.
:::

:::note
The MindOps OTLP endpoint needs no ingestion key for self-hosted instances. Use `tls.insecure: true` only on a trusted private network — enable TLS when crossing untrusted links.
:::

See [Collector Configuration](/mindops-docs/collection-agents/collector-configuration/) for a deeper look at each stage.
