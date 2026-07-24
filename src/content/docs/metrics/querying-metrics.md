---
title: Querying Metrics
description: The MindOps metrics query builder — rate, sum, avg, p99, group by, formulas across queries, and a note on the query-range API.
---

The metrics query builder composes a chart from a metric, a set of aggregations,
and optional filters and grouping. Multiple queries can be combined with
**formulas** to derive new signals like error rate or efficiency.

## Query anatomy

| Part | Choice |
|------|--------|
| Metric | Which measurement |
| Time aggregation | `rate`, `sum`, `avg`, `max` over each step |
| Space aggregation | `sum`, `avg`, `min`, `max`, `p90/p95/p99` across series |
| Filter | Label predicates |
| Group by | Split dimensions |

## Request rate from a counter

```text
metric:     http_requests_total
time agg:   rate
space agg:  sum
filter:     service.name = checkout
group by:   http.route
```

## Average gauge

```text
metric:     process_memory_bytes
time agg:   avg
space agg:  avg
group by:   k8s.pod.name
```

## p99 latency from a histogram

```text
metric:     http_server_duration
space agg:  p99
filter:     service.name = checkout
group by:   http.route
```

## Formulas across queries

Define two queries and combine them in a formula expression. A classic example
is error rate — errors divided by total.

```text
A = rate(http_requests_total{http.status_code >= 500})
B = rate(http_requests_total)
formula: A / B * 100        # error percentage
```

| Goal | Formula |
|------|---------|
| Error rate % | `A / B * 100` |
| Cache hit ratio | `hits / (hits + misses)` |
| Avg per request | `total_duration / request_count` |

## Common aggregation reference

| Aggregation | Works on | Result |
|-------------|----------|--------|
| `rate` | Cumulative counters | Per-second change |
| `sum` | Sums, delta metrics | Total |
| `avg` | Gauges | Mean value |
| `max` / `min` | Any | Extremes |
| `p90`/`p95`/`p99` | Histograms | Tail percentiles |

:::tip
Always `rate` a cumulative counter before summing or grouping — summing raw
cumulative values gives a meaningless climbing line. See
[Types and Aggregation](/mindops-docs/metrics/types-and-aggregation/).
:::

## query-range API note

Every chart you build maps onto the MindOps query-range API. You send the same
metric, aggregations, filters, group-by, and formulas as a JSON payload and get
back time series, so dashboards, alerts, and external tools all run the identical
query engine. Author a query visually in the
[Metrics Explorer](/mindops-docs/metrics/metrics-explorer/), then lift it into code or an
alert rule unchanged.
