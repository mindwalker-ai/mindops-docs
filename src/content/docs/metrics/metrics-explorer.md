---
title: Metrics Explorer
description: Explore metrics in MindOps — pick a metric, choose an aggregation, group by attributes, set time aggregation, and build a panel.
---

The Metrics Explorer at `http://localhost:8080` is where you turn a stored
metric into a chart. Every panel is built from four choices: which metric, how
to aggregate across series, how to split, and how to aggregate over time.

## 1. Pick a metric

Start typing in the metric selector to search by name, e.g.
`http_server_duration` or `orders_total`. The explorer shows the metric's type
(sum, gauge, histogram) so you know which aggregations make sense.

## 2. Choose a space aggregation

Space (spatial) aggregation combines multiple series into one number at each
timestamp.

| Aggregation | Use for |
|-------------|---------|
| `sum` | Totals across instances (counters) |
| `avg` | Average of a gauge |
| `min` / `max` | Extremes |
| `count` | Number of series |
| `p90` / `p95` / `p99` | Percentiles from histograms |

## 3. Group by attributes

Split the result by one or more labels to compare slices side by side.

```text
metric:       http_server_duration
aggregate:    p99
group by:     service.name, http.route
```

This draws one line per service/route combination.

## 4. Set time aggregation

Time (temporal) aggregation decides how raw points within each step bucket are
reduced — `rate`, `sum`, `avg`, `max`. For a cumulative counter you almost
always want `rate` to get a per-second value.

```text
metric:       orders_total
time agg:     rate
space agg:    sum
group by:     region
```

## Building a panel

1. Select the metric.
2. Choose the time aggregation (e.g. `rate` for counters).
3. Choose the space aggregation (e.g. `sum`).
4. Add `group by` labels.
5. Apply filters to narrow scope, e.g. `deployment.environment = prod`.
6. Pick a visualization: time series, bar, or value.
7. **Save to dashboard** to keep it.

## Filtering

Add label filters to focus on what matters:

```text
filter: service.name = checkout AND http.status_code >= 500
```

:::tip
Watch label cardinality. Grouping by a high-cardinality label like `user.id`
produces thousands of series and a slow, unreadable chart. Group by bounded
dimensions such as `route`, `region`, or `status_code`.
:::

:::note
Percentile aggregations (`p99`) are only meaningful on **histogram** metrics.
On a gauge or sum, use `avg`/`max`/`sum` instead — see
[Types and Aggregation](/mindops-docs/metrics/types-and-aggregation/).
:::

For the full query model with formulas, see
[Querying Metrics](/mindops-docs/metrics/querying-metrics/).
