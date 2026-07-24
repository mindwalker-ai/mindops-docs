---
title: Panel Types
description: Choose the right MindOps panel visualization. When to use Time Series, Bar, Value, Table, Pie, Histogram, and List panels, with a short example each.
---

MindOps offers several panel visualizations. Picking the right one makes a dashboard readable at a glance. This page summarizes each type, when to reach for it, and a short example query.

## Time Series

The default for anything that changes over time: latency, throughput, CPU, error rate. Each series is a line plotted against the time axis.

```text
Data source: metrics
Metric: system_cpu_utilization
Aggregation: avg   Group by: host_name
```

:::tip
Use Time Series when the *shape over time* matters — trends, spikes, and seasonality.
:::

## Bar

A bar chart is good for comparing discrete buckets, especially counts grouped by a dimension over time.

```text
Data source: logs
Aggregation: count   Group by: severity_text
```

## Value / Number

A single big number for one current measurement — a KPI like current requests/sec, total errors, or uptime percentage. Often paired with a threshold color.

```text
Data source: traces
Aggregation: count   Filter: has_error = true
```

## Table

A table shows multiple dimensions and aggregates side by side. Ideal for top-N lists like the slowest endpoints or noisiest hosts.

```text
Data source: traces
Aggregation: p99(duration)   Group by: service_name, http_route
```

## Pie

A pie (or donut) shows proportional share of a whole at a point in time — for example the split of requests across services.

```text
Data source: traces
Aggregation: count   Group by: service_name
```

:::caution
Pie charts get unreadable past a handful of slices. If you have many categories, a Table or Bar usually communicates better.
:::

## Histogram

A histogram buckets values by frequency, revealing the *distribution* of a measurement such as request duration. Use it to spot bimodal latency or long tails.

```text
Data source: traces
Field: duration   Visualization: histogram
```

## List

The List panel renders raw records rather than aggregates — recent log lines or individual trace events matching a filter. Useful for an at-a-glance event feed embedded in a dashboard.

```text
Data source: logs
Filter: service_name = "checkout" AND severity_text = "ERROR"
Order by: timestamp desc
```

## Quick reference

| Panel | Best for | Aggregated? |
|-------|----------|-------------|
| Time Series | Trends over time | Yes |
| Bar | Comparing buckets | Yes |
| Value | Single KPI | Yes |
| Table | Top-N, multi-dimension | Yes |
| Pie | Proportional share | Yes |
| Histogram | Value distribution | Yes |
| List | Raw events / log feed | No |

For building the queries behind any of these, see the [Query Builder](/querying/query-builder/).
