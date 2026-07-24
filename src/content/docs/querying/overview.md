---
title: Querying Overview
description: The three MindOps query modes - Query Builder, ClickHouse SQL, and PromQL - and when to use each for metrics, logs, and traces.
---

MindOps gives you three ways to ask questions of your telemetry. All three back the same surfaces — dashboard panels, alerts, and ad-hoc exploration — so you can pick whichever fits the task without leaving the platform.

## The three modes

| Mode | Strength | Works on |
|------|----------|----------|
| Query Builder | Fast, guided, no syntax to learn | Metrics, logs, traces |
| ClickHouse SQL | Full power of raw SQL | Metrics, logs, traces |
| PromQL | Familiar Prometheus expressions | Metrics |

Every panel and alert has a mode switcher, so you can start in the Builder and drop to SQL when you need more control.

## Query Builder

The [Query Builder](/mindops-docs/querying/query-builder/) is the default. You choose a data source, an aggregation, filters, and group-by dimensions from dropdowns. It is the quickest path for most questions and unifies metrics, logs, and traces under one interface.

Reach for the Builder when:

- You want results fast without writing syntax.
- The question maps to a single aggregation over one signal.
- You are exploring and iterating on filters interactively.

## ClickHouse SQL

MindOps stores all telemetry in ClickHouse, and the [ClickHouse query mode](/mindops-docs/querying/clickhouse-queries/) lets you write SQL directly against those tables. This unlocks joins, subqueries, window functions, and any aggregation ClickHouse supports.

Reach for ClickHouse SQL when:

- The Builder cannot express the shape you need (joins, nested logic).
- You want a custom column calculation or a rare aggregate function.
- You are reusing an existing SQL report.

```sql
SELECT toStartOfMinute(timestamp) AS t, count() AS errors
FROM logs
WHERE severity_text = 'ERROR'
GROUP BY t ORDER BY t
```

## PromQL

For metrics, MindOps also accepts [PromQL](/mindops-docs/querying/promql/), the Prometheus query language. If your team already writes PromQL, you can paste those expressions straight into a panel.

Reach for PromQL when:

- You are migrating dashboards or alerts that already use PromQL.
- The question is a classic rate/aggregation over a counter or gauge.

```promql
sum(rate(http_server_requests_total[5m])) by (service)
```

:::note
PromQL applies only to metrics. To query logs or traces, use the Query Builder or ClickHouse SQL.
:::

## Choosing a mode

A simple rule of thumb:

1. Start in the **Query Builder**.
2. If you hit its limits on metrics, try **PromQL**.
3. For anything the Builder cannot express on any signal, drop to **ClickHouse SQL**.

:::tip
You can mix modes across panels on the same dashboard. One panel can be a Builder query while another runs raw SQL — the dashboard renders them together.
:::

Next, learn the [Query Builder](/mindops-docs/querying/query-builder/) in depth, or jump to [search syntax](/mindops-docs/querying/search-syntax/) for how filters are written.
