---
title: Log Explorer
description: Search and filter logs in the MindOps Log Explorer using full-text and attribute filters, quick filters, and saved views.
---

The Log Explorer at `http://localhost:8080` is where you search, filter, and
read logs in real time. It combines a fast full-text search with structured
attribute filtering.

## Full-text vs attribute filters

**Full-text search** scans the log `body`. Use it when you do not know the
shape of the data — paste an error string and find every matching line.

```text
search: "connection reset by peer"
```

**Attribute filters** target indexed fields and key/value pairs. They are
faster and more precise because they match structured data rather than raw
text.

```text
service.name = checkout
severity_text = ERROR
http.status_code >= 500
```

| Filter style | Best for | Speed |
|--------------|----------|-------|
| Full-text body | Unknown/unstructured text | Slower |
| Attribute equals | Known key/value | Fast |
| Attribute range | Numeric thresholds | Fast |

## Quick filters

The left rail surfaces high-cardinality fields as one-click quick filters:
`service.name`, `severity_text`, `host.name`, and any indexed attribute. Tick a
value to add it to the active query; the result list and the volume histogram
update together.

## Views: list, table, and time series

- **List view** — chronological log lines for reading context.
- **Table view** — pick columns (e.g. `service.name`, `severity_text`,
  `trace_id`) for a dense, scannable grid.
- **Time series** — switch the panel to a chart to see log volume over time,
  useful for spotting error spikes.

## Building a quick query

In the query builder:

1. **Filter** — `service.name = checkout AND severity_text = ERROR`
2. **Aggregate** — `count`
3. **Group by** — `http.route`

This returns error counts per route so you can find the noisiest endpoint.

## Saving views

Once a filter set is useful, save it as a named view so the whole team reuses
it instead of rebuilding the query.

1. Build your filter and column layout.
2. Click **Save view** and give it a clear name, e.g. `Checkout 5xx errors`.
3. Reopen it any time from the views menu.

:::tip
Pin saved views for recurring investigations (auth failures, payment errors).
A good view encodes both the filter and the column set you want to read.
:::

:::note
Selecting a log line with a `trace_id` lets you jump straight to its
distributed trace, and back again. See
[Application Logs](/mindops-docs/logs/application-logs/) for how correlation is wired up.
:::

For query syntax and aggregations, see
[Querying Logs](/mindops-docs/logs/querying-logs/).
