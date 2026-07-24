---
title: Metric Types and Aggregation
description: Counters, gauges, and histograms in MindOps — temporality (delta vs cumulative), spatial vs temporal aggregation, and percentiles from histograms.
---

To query metrics correctly you need to know three things about each one: its
**type**, its **temporality**, and which **aggregations** are valid. Getting
these wrong produces charts that look fine but mean nothing.

## Metric types

| Type | Behaviour | Valid aggregations |
|------|-----------|--------------------|
| Counter (sum) | Monotonic, only increases | `rate`, `increase`, `sum` |
| UpDownCounter | Sum that can decrease | `sum`, `avg` |
| Gauge | Snapshot at a moment | `avg`, `min`, `max`, `last` |
| Histogram | Bucketed distribution | percentiles, `avg`, `count` |

## Temporality: delta vs cumulative

Temporality describes what each reported value represents.

- **Cumulative** — each point is the running total since the process started.
  Prometheus counters are cumulative. To read a rate, MindOps differences
  consecutive points.
- **Delta** — each point is the change since the previous report. The value is
  already the increment for that interval.

```text
Cumulative:  10, 18, 25, 31   (always growing)
Delta:        10,  8,  7,  6   (per-interval change)
```

:::caution
Applying `sum` directly to a cumulative counter double-counts and produces a
meaningless ever-rising line. Use `rate` or `increase` instead. Delta metrics
can be summed safely within their interval.
:::

## Spatial vs temporal aggregation

These are two independent axes, and most queries use both.

- **Spatial (space) aggregation** combines *across series* at one timestamp —
  e.g. summing `orders_total` over all pods into a single fleet-wide number.
- **Temporal (time) aggregation** combines *across time* within each step bucket
  — e.g. taking the `max` gauge value per minute.

```text
orders_total{pod=A}=5  ┐
orders_total{pod=B}=3  ├─ space: sum → 12
orders_total{pod=C}=4  ┘

minute bucket points: 12,14,11 ─ time: max → 14
```

## Percentiles from histograms

Histograms record values into buckets, which lets MindOps estimate quantiles at
query time without storing every raw sample.

```text
metric:    http_server_duration   (histogram)
space agg: p99
group by:  http.route
```

| Quantile | Meaning |
|----------|---------|
| p50 | Median — typical experience |
| p90 | 9 in 10 requests faster than this |
| p99 | Tail latency — worst 1% |

:::tip
Average latency hides tail pain. A p50 of 40 ms with a p99 of 2 s means most
users are fine but the slowest 1% are suffering. Chart p50, p90, and p99
together to see both.
:::

:::note
Percentiles are only valid on histogram metrics. If you only have a gauge, you
cannot recover percentiles after the fact — instrument with a histogram. See
[Send Metrics](/mindops-docs/metrics/send-metrics/).
:::

Apply these concepts in the
[Metrics query builder](/mindops-docs/metrics/querying-metrics/).
