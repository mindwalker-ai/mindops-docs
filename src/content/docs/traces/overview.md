---
title: Traces Overview
description: Explore distributed traces with flamegraphs and Gantt charts in MindOps.
---

A **trace** records the full journey of a single request across your services. Each trace
is made of **spans** — one span per unit of work (an HTTP handler, a DB query, a queue
publish) — linked by a shared `trace_id`.

## Visualizations

- **Flamegraph** — a stacked view that makes it obvious which span dominates the request.
- **Gantt chart** — a timeline of spans showing what ran sequentially vs in parallel.
- **Span details** — attributes, events, status, and any attached exception for each span.

## Finding the right traces

Use the trace explorer to filter and aggregate:

```text
Filter:   service.name = checkout AND duration > 800ms AND status = error
Group by: http.route
Order by: duration DESC
```

This surfaces the slowest failing requests on a specific service, grouped by endpoint.

## Traces ↔ logs ↔ exceptions

Because everything shares a `trace_id`:

- From a slow span you can jump to the **logs** emitted during that request.
- An **exception** thrown in a span is attached to it, so you see the error in context.

This correlation is what turns "the request was slow" into "the request was slow **because**
this query took 700 ms and then threw."

## Tips

- Set span status to `ERROR` on failures so error rate is accurate.
- Add meaningful span attributes (`db.system`, `http.route`, `messaging.system`) — they
  power filtering and grouping.
