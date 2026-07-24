---
title: StatsD Metrics
description: Ingest StatsD metrics into MindOps using the OpenTelemetry Collector statsd receiver, with an example configuration.
---

If your applications already emit StatsD metrics, you can forward them to
MindOps without changing the app. Run an OpenTelemetry Collector with the
`statsd` receiver: it listens for StatsD packets, aggregates them, and exports
over OTLP.

## How it works

```text
[ app -> StatsD client ] --UDP 8125--> [ Collector: statsd receiver ]
                                              |
                                        [ otlp exporter ]
                                              |
                                              v
                                      [ MindOps :4317 ]
```

StatsD is a simple line protocol. The receiver translates each line into an
OpenTelemetry metric data point.

```text
orders.placed:1|c                 # counter
queue.depth:42|g                  # gauge
checkout.latency:48|ms            # timer → histogram
cache.hits:1|c|@0.1               # sampled counter
```

## Example Collector config

```yaml
receivers:
  statsd:
    endpoint: 0.0.0.0:8125
    aggregation_interval: 60s
    timer_histogram_mapping:
      - statsd_type: timing
        observer_type: histogram

processors:
  batch: {}

exporters:
  otlp:
    endpoint: localhost:4317
    tls:
      insecure: true

service:
  pipelines:
    metrics:
      receivers: [statsd]
      processors: [batch]
      exporters: [otlp]
```

## Metric type mapping

| StatsD type | Symbol | MindOps / OTel type |
|-------------|--------|---------------------|
| Counter | `c` | Sum (monotonic) |
| Gauge | `g` | Gauge |
| Timer / histogram | `ms` / `h` | Histogram |
| Set | `s` | Sum of unique values |

## Tags

If your StatsD clients emit tags (the DogStatsD-style `#key:value` extension),
the receiver can map them to metric attributes so you can group by them in the
UI.

```text
orders.placed:1|c|#region:eu,payment:card
```

:::caution
StatsD runs over UDP by default, so packets can be dropped under heavy load.
Point clients at a Collector running close to the application, and tune
`aggregation_interval` to balance freshness against volume.
:::

:::tip
The `aggregation_interval` controls how often the Collector flushes aggregated
metrics to MindOps. Match it to your dashboard resolution — 60s is a sensible
default.
:::

Once metrics land, build a panel in the
[Metrics Explorer](/mindops-docs/metrics/metrics-explorer/).
