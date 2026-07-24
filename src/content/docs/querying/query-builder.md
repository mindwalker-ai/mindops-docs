---
title: Query Builder
description: The unified MindOps Query Builder - data source, aggregation, filters, group by, having, legend, and formulas - with a worked example across metrics, logs, and traces.
---

The Query Builder is the unified, no-syntax way to query metrics, logs, and traces in MindOps. You assemble a query from dropdowns, and MindOps compiles it to ClickHouse under the hood. This page walks through every part of the builder and ends with a worked example.

## Anatomy of a query

A builder query is made of these parts:

| Part | What it does |
|------|--------------|
| Data source | Choose metrics, logs, or traces |
| Aggregation | How to reduce many rows to a value (count, avg, p99, rate, ...) |
| Filters | Narrow which records are included |
| Group by | Split results into series by one or more attributes |
| Having | Filter on the aggregated result |
| Legend | Format series labels |

You can add several queries (`A`, `B`, `C`) and combine them with a formula.

## Data source

Pick the signal first. The available aggregations and attributes change to match:

- **Metrics** — choose a metric name, then an aggregation.
- **Logs** — count records, or aggregate a numeric attribute.
- **Traces** — count spans, or aggregate `duration` and other span fields.

## Aggregation

Aggregation reduces matching rows to a number per time bucket. Common choices are `count`, `sum`, `avg`, `min`, `max`, `rate`, and percentiles `p50`–`p99`. See [Aggregation and Grouping](/mindops-docs/querying/aggregation-grouping/) for the full list and semantics.

## Filters

Filters use the MindOps [search syntax](/mindops-docs/querying/search-syntax/) — for example `service_name = "checkout"` or `http_status_code >= 500`. Multiple filter rows combine with AND.

## Group by

Group-by splits the aggregate into one series per distinct value. Grouping traces by `service_name` gives one latency line per service. You can group by several attributes at once.

## Having

`Having` filters the *aggregated* output rather than raw rows. For example, keep only groups whose `count` exceeds 100. This is the aggregate-level equivalent of a filter.

## Legend and formulas

- **Legend** controls the series label, using `{{attribute}}` placeholders such as `{{service_name}}`.
- **Formulas** combine queries arithmetically. With query `A` = error count and `B` = total count, a formula `A / B * 100` yields an error-rate percentage.

```text
A: count   filter has_error = true
B: count
Formula: A / B * 100      legend: error rate %
```

## Worked example: error rate by service

Goal — show the HTTP 5xx error rate per service over time.

1. **Query A** (errors): data source `traces`, aggregation `count`, filter `http_status_code >= 500`, group by `service_name`.
2. **Query B** (total): data source `traces`, aggregation `count`, group by `service_name`.
3. **Formula**: `A / B * 100`, legend `{{service_name}}`.
4. Visualize as a Time Series panel.

The result is one line per service showing its error percentage, updating with the dashboard time range.

:::tip
Build each query so it stands on its own, then layer the formula. It is far easier to debug a wrong number when you can inspect `A` and `B` independently.
:::

:::note
When the Builder cannot express a query — for example a join between logs and traces — switch the panel to [ClickHouse SQL](/mindops-docs/querying/clickhouse-queries/).
:::
