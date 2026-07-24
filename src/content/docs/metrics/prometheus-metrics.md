---
title: Prometheus Metrics
description: Scrape Prometheus endpoints with the OpenTelemetry Collector prometheus receiver and forward them to MindOps.
---

Many services and exporters already expose a Prometheus `/metrics` endpoint. You
do not need to rewrite them — run an OpenTelemetry Collector with the
`prometheus` receiver to scrape those endpoints and forward the data to MindOps
over OTLP.

## How it works

```text
[ /metrics endpoint ] --scrape--> [ Collector: prometheus receiver ]
                                          |
                                    [ otlp exporter ]
                                          |
                                          v
                                  [ MindOps :4317 ]
```

The receiver speaks the Prometheus scrape protocol, so its `scrape_configs`
block is the same shape you already know from `prometheus.yml`.

## Example Collector config

```yaml
receivers:
  prometheus:
    config:
      scrape_configs:
        - job_name: 'api-service'
          scrape_interval: 30s
          static_configs:
            - targets: ['api:9090']
        - job_name: 'node-exporter'
          scrape_interval: 15s
          static_configs:
            - targets: ['node-exporter:9100']

processors:
  batch: {}
  resourcedetection:
    detectors: [env, system]

exporters:
  otlp:
    endpoint: localhost:4317
    tls:
      insecure: true

service:
  pipelines:
    metrics:
      receivers: [prometheus]
      processors: [resourcedetection, batch]
      exporters: [otlp]
```

## Service discovery

The receiver supports the standard Prometheus discovery mechanisms, so in
Kubernetes you can use `kubernetes_sd_configs` with relabeling instead of static
targets.

```yaml
scrape_configs:
  - job_name: 'k8s-pods'
    kubernetes_sd_configs:
      - role: pod
    relabel_configs:
      - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_scrape]
        action: keep
        regex: true
```

## Mapping to the metric model

| Prometheus type | MindOps / OTel type |
|-----------------|---------------------|
| Counter | Cumulative sum |
| Gauge | Gauge |
| Histogram | Histogram |
| Summary | Summary (quantiles preserved) |

:::tip
Add a `resourcedetection` processor so scraped metrics get a consistent
`service.name`/`host.name`. Otherwise they may be harder to group in the
[Metrics Explorer](/mindops-docs/metrics/metrics-explorer/).
:::

:::caution
Prometheus counters are cumulative. When querying in MindOps, apply a `rate`
function to turn them into per-second values — see
[Querying Metrics](/mindops-docs/metrics/querying-metrics/).
:::

For pushing measurements from app code instead of scraping, see
[Send Metrics](/mindops-docs/metrics/send-metrics/).
