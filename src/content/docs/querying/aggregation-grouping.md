---
title: Aggregation and Grouping
description: MindOps aggregation operators (count, sum, avg, min/max, p50-p99, rate) and group-by semantics, including the difference between time and space aggregation.
---

Aggregation is how MindOps turns many raw records into a few meaningful numbers. Understanding the operators and the two axes of aggregation — over time and across series — is the key to correct dashboards and alerts.

## Aggregation operators

| Operator | Meaning | Typical use |
|----------|---------|-------------|
| `count` | Number of matching records | Request volume, log counts |
| `sum` | Total of a numeric field | Bytes sent, total duration |
| `avg` | Arithmetic mean | Average response time |
| `min` / `max` | Smallest / largest value | Peak memory, lowest free disk |
| `p50` | Median | Typical latency |
| `p90` / `p95` / `p99` | Tail percentiles | Worst-case latency |
| `rate` | Per-second change | Throughput from a counter |

```text
Data source: traces
Aggregation: p99(duration)
Group by: http_route
```

:::tip
Averages hide tail pain. For latency, chart `p95` or `p99` alongside `avg` so a few slow requests do not disappear into the mean.
:::

## Two axes of aggregation

Every query aggregates along two independent axes.

### Time aggregation

Time aggregation reduces all data points *within one time bucket* to a single value. If the bucket is one minute and you choose `avg`, MindOps averages every sample in that minute into one point. The bucket width follows the panel's step/interval and the selected time range.

### Space aggregation

Space aggregation combines values *across series* at the same instant — collapsing many hosts, pods, or endpoints into one line. Group-by is the inverse: it keeps series separate instead of merging them.

```text
# Space-aggregate CPU across all hosts into one line
Aggregation: avg(system_cpu_utilization)
Group by: (none)

# Keep one line per host
Aggregation: avg(system_cpu_utilization)
Group by: host_name
```

:::note
Order matters conceptually: MindOps applies time aggregation within each bucket, then space aggregation across series. Choosing `sum` for space but `avg` for time can change the meaning of a panel.
:::

## Group-by semantics

Group-by produces one result series per distinct combination of the chosen attributes.

- Group by `service_name` -> one series per service.
- Group by `service_name, http_route` -> one series per service-and-route pair.

More group-by keys means more series. Too many keys produces a noisy chart and heavier queries.

:::caution
High-cardinality group-by (for example `user_id` or `trace_id`) can generate thousands of series and slow queries dramatically. Group by bounded attributes and use filters to narrow first.
:::

## Rate vs raw counters

Counters only ever increase, so their raw value is rarely useful. `rate` converts a counter into a per-second value over the time window, which is what you usually want for throughput:

```text
Aggregation: rate
Metric: http_server_requests_total
Group by: service_name
```

## Pairing with Having

After aggregating, use `Having` to drop uninteresting groups — for example, only show routes whose `count` is above a threshold. See the [Query Builder](/querying/query-builder/) for where `Having` fits in the flow.
