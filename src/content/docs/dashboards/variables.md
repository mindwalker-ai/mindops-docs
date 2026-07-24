---
title: Dashboard Variables
description: Use MindOps template variables (query, custom, textbox) to build dynamic dashboards. Reference variables in panel queries with the double-brace syntax.
---

Template variables turn a static dashboard into a reusable one. Instead of hard-coding a host or service in every panel, you define a variable once and select its value from a dropdown at the top of the dashboard.

## Variable types

MindOps supports three kinds of variables.

| Type | Source of values | Use when |
|------|------------------|----------|
| Query | A live query against your data | Values change over time (hosts, services, pods) |
| Custom | A fixed comma-separated list you type | A small, stable set of choices |
| Textbox | Free-form text the viewer enters | Ad-hoc filtering on arbitrary values |

### Query variable

A query variable populates its dropdown from ClickHouse, so it always reflects what is actually reporting. For example, list every host currently sending metrics:

```sql
SELECT DISTINCT host_name FROM metrics WHERE ...
```

### Custom variable

Type the allowed values directly, separated by commas:

```text
prod, staging, dev
```

### Textbox variable

A textbox renders an input field. Whatever the viewer types is substituted into panel queries — handy for filtering by a user ID or order number.

## Using variables in panels

Reference a variable in any query with the double-brace syntax `{{variable_name}}`. In the Query Builder filter row:

```text
host_name = {{host}}
environment = {{env}}
```

In a ClickHouse query the same substitution applies:

```sql
SELECT toStartOfMinute(timestamp) AS t, avg(value) AS cpu
FROM metrics
WHERE metric_name = 'system_cpu_utilization'
  AND host_name = '{{host}}'
GROUP BY t ORDER BY t
```

:::note
When a variable is rendered inside a string literal in raw SQL, wrap it in quotes (`'{{host}}'`). In the Query Builder, MindOps handles quoting for you.
:::

## Multi-value and "All"

Query and custom variables can allow **multi-select** and an **All** option. With multi-select enabled, use the `IN` operator so a panel responds to every chosen value:

```text
service_name IN {{services}}
```

## Chaining variables

Variables can depend on each other. A `pod` variable can filter on the currently selected `namespace`:

```sql
SELECT DISTINCT pod_name FROM metrics
WHERE namespace = '{{namespace}}'
```

When the viewer changes `namespace`, the `pod` dropdown re-queries automatically.

:::tip
Order matters — define the parent variable (`namespace`) before the dependent one (`pod`) so the dependency resolves correctly.
:::

## Building dynamic dashboards

A common pattern:

1. Add a query variable `service` listing all services.
2. Add a dependent variable `endpoint` filtered by `{{service}}`.
3. Reference both in every panel's filters.

One dashboard now works for any service without duplication. To package and reuse such a dashboard across environments, see [Import and Share](/mindops-docs/dashboards/import-and-share/).
