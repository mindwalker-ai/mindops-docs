---
title: Trace Explorer
description: Filter, aggregate, and group spans in the MindOps Trace Explorer to find slow or failing requests across your services.
---

The Trace Explorer is where you slice through the raw span data flowing into MindOps. Every span produced by an OpenTelemetry-instrumented service lands here, and the explorer lets you narrow billions of spans down to the handful that matter.

## Filtering spans

Filters are built from span attributes. Type an attribute key, pick an operator, and supply a value. Conditions combine with `AND`/`OR`.

A common starting filter isolates errors in one service that took longer than a threshold:

```text
service.name = checkout-api
AND duration >= 800ms
AND status = error
```

Useful built-in fields:

| Field | Meaning |
|-------|---------|
| `service.name` | The instrumented service that emitted the span |
| `name` | Span/operation name (e.g. `GET /cart`) |
| `duration` | Wall-clock time of the span |
| `status` | `ok`, `error`, or `unset` (maps to span status code) |
| `http.status_code` | HTTP response code captured on the span |
| `span.kind` | `server`, `client`, `producer`, `consumer`, `internal` |

Any custom attribute your code sets — `user.tier`, `tenant.id`, `db.system` — is also filterable.

:::tip
Filter on `span.kind = server` to look only at inbound request spans and avoid double-counting the matching `client` spans on the caller side.
:::

## Aggregating

Switch the explorer from raw spans to an aggregate to answer quantitative questions. Pick a function and, optionally, an attribute:

- `count()` — number of matching spans
- `p95(duration)`, `p99(duration)` — tail latency
- `avg(duration)`, `max(duration)` — central and worst-case timing
- `count() where status = error` — error volume

## Group by

Group by one or more attributes to break an aggregate into series. Grouping `p99(duration)` by `service.name` instantly surfaces which service owns your worst latency; grouping `count()` by `http.status_code` shows the shape of your error mix.

```text
Aggregate: p99(duration)
Group by:  service.name, http.route
```

## Views

The explorer offers two complementary views:

- **List view** — a flat, sortable table of individual spans. Best for inspecting specific requests; click any row to open the full [trace detail](/mindops-docs/traces/trace-details/).
- **Time-series view** — your aggregate plotted over the selected time range, one line per group. Best for spotting trends, spikes, and regressions.

:::note
Save a filter-plus-aggregate combination as a view so teammates open the explorer already scoped to the service they own.
:::

Once you have isolated an interesting span, open its trace to see the full request path, then pivot to [correlated logs](/mindops-docs/traces/correlate-traces-and-logs/) for the same `trace_id`.
