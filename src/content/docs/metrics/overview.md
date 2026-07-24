---
title: Metrics
description: Store and query application and infrastructure metrics in MindOps.
---

Metrics are numeric **time series** — values sampled over time, such as p99 latency,
requests per second, queue depth, or CPU usage. MindOps stores metrics from both your
applications (via OpenTelemetry) and your infrastructure (via the host metrics receiver).

## Metric types

- **Counter** — a value that only goes up (e.g. total requests).
- **Gauge** — a value that goes up and down (e.g. memory in use).
- **Histogram** — a distribution, used to compute percentiles (p50/p90/p99).

## Querying metrics

Build queries with filters, aggregations, and grouping:

```text
Metric:    http.server.duration
Filter:    service.name = api
Aggregate: P99
Group by:  http.route
Every:     1m
```

Use legend formats like `{{http.route}}` to label each series dynamically, and combine
multiple queries with math (sum, ratio, rate) to build derived signals such as error rate.

## Where metrics come from

- **Application metrics** — emitted by your OpenTelemetry SDK.
- **Infrastructure metrics** — CPU, memory, disk, and network from the collector's
  `hostmetrics` receiver. See [Infrastructure Monitoring](/infrastructure/overview/).

## From metrics to dashboards

Any metric query can become a panel. Group related panels into a
[dashboard](/dashboards/overview/) to get a single view of a system's health.
