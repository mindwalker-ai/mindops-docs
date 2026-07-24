---
title: Querying Logs
description: Use the MindOps log query builder to count by severity, group by attribute, and compute rates, with example queries and an API note.
---

The log query builder turns raw log streams into aggregated charts and tables.
Every query is three choices: **filter** what to include, **aggregate** how to
summarize, and **group by** how to split the result.

## Anatomy of a query

| Part | Question it answers |
|------|---------------------|
| Filter | Which logs? |
| Aggregate | What number? (`count`, `rate`, `avg`, `p99`) |
| Group by | Split by which dimension? |
| Time | Over what window and step? |

## Count by severity

Show error volume over time.

```text
filter:     service.name = checkout
aggregate:  count
group by:   severity_text
```

This produces one series per severity, making error spikes obvious against
`INFO` baseline.

## Group by attribute

Find which routes generate the most errors.

```text
filter:     severity_number >= 17    # ERROR and above
aggregate:  count
group by:   http.route
order by:   count desc
limit:      10
```

## Rate of logs

Convert raw counts into a per-second rate so the value is comparable across
time windows.

```text
filter:     service.name = payments AND severity_text = ERROR
aggregate:  rate
group by:   k8s.pod.name
```

## Numeric aggregations on attributes

If a log attribute is numeric, aggregate it directly.

```text
filter:     http.route = "/checkout"
aggregate:  p99(http.server.duration)
group by:   http.status_code
```

| Aggregation | Use |
|-------------|-----|
| `count` | Volume of matching records |
| `rate` | Records per second |
| `avg` / `sum` | Numeric attribute summaries |
| `p90` / `p95` / `p99` | Latency-style percentiles |

## From query to dashboard or alert

Any query can be pinned to a dashboard panel or wrapped in an alert threshold,
e.g. "alert when `count` of `ERROR` for `service.name = payments` exceeds 50 in
5 minutes."

:::tip
Always add a `service.name` filter first. It restricts the scan to one service
and keeps queries fast on large log volumes.
:::

## Logs API note

Every query you build in the UI maps to the MindOps query-range API, so you can
run the same aggregation programmatically against the OTLP-backed log store. Use
it to embed log metrics in external dashboards, CI checks, or scripts. The UI is
the quickest way to author a query before lifting it into code.

For interactive searching and saved views, see the
[Log Explorer](/mindops-docs/logs/log-explorer/).
