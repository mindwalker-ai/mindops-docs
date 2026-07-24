---
title: PromQL
description: Query MindOps metrics with PromQL. Example expressions, how it differs from the Query Builder, and when to choose it.
---

MindOps supports PromQL, the Prometheus query language, for metrics. If your team already writes PromQL or you are migrating Prometheus dashboards and alerts, you can paste those expressions directly into a MindOps panel or alert without rewriting them.

## When to use PromQL

PromQL is a good fit when:

- You are porting existing Prometheus dashboards or alert rules.
- The question is a classic rate or aggregation over a counter or gauge.
- You prefer the compact PromQL idiom for metric math.

:::note
PromQL works on **metrics only**. To query logs or traces, use the [Query Builder](/querying/query-builder/) or [ClickHouse SQL](/querying/clickhouse-queries/).
:::

## Example expressions

Per-second request rate by service:

```promql
sum(rate(http_server_requests_total[5m])) by (service_name)
```

95th-percentile latency from a histogram:

```promql
histogram_quantile(
  0.95,
  sum(rate(http_server_duration_bucket[5m])) by (le, service_name)
)
```

Average CPU utilization across hosts:

```promql
avg(system_cpu_utilization) by (host_name)
```

Error ratio as a percentage:

```promql
sum(rate(http_requests_total{status=~"5.."}[5m]))
/
sum(rate(http_requests_total[5m])) * 100
```

## Selectors and matchers

PromQL label matchers narrow a series set inside the curly braces:

| Matcher | Meaning |
|---------|---------|
| `label="value"` | Exact match |
| `label!="value"` | Not equal |
| `label=~"regex"` | Regex match |
| `label!~"regex"` | Regex non-match |

```promql
http_requests_total{service_name="checkout", status=~"5.."}
```

## How PromQL differs from the Query Builder

| Aspect | Query Builder | PromQL |
|--------|---------------|--------|
| Signals | Metrics, logs, traces | Metrics only |
| Style | Dropdown-driven | Expression text |
| Range vectors | Implicit interval | Explicit `[5m]` windows |
| Counters | `rate` aggregation | `rate()` / `increase()` |
| Learning curve | Low | Familiar to Prometheus users |

The Builder picks a step automatically from the panel range; in PromQL you state the lookback window yourself (the `[5m]` in `rate(...[5m])`). Choose a window that is a few times the metric's scrape interval.

:::tip
For counters, always wrap them in `rate()` or `increase()`. Charting a raw counter shows an ever-climbing line that resets on restart and tells you little.
:::

:::caution
Broad regex matchers like `service_name=~".*"` over high-cardinality labels can be slow. Match as specifically as possible and keep range windows reasonable.
:::

For an overview of all three query modes and how to choose, see [Querying Overview](/querying/overview/).
