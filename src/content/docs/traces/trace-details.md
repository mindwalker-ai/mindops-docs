---
title: Reading a Trace
description: Inspect a single distributed trace in MindOps with the flamegraph and Gantt views, span attributes, events, status, and jumps to correlated logs.
---

A trace is the full story of one request as it travels through your system. Each unit of work is a **span**, and spans link to a parent to form a tree. Opening a trace in MindOps gives you two visualizations of that tree plus the detailed metadata on every span.

## Flamegraph vs Gantt chart

Both views render the same spans, but they answer different questions.

| View | Reads as | Best for |
|------|----------|----------|
| **Flamegraph** | Width = duration, depth = call nesting | Seeing where time is *spent* and which calls dominate |
| **Gantt chart** | Horizontal bars on a shared timeline | Seeing *when* things ran, overlaps, and serial vs parallel work |

The flamegraph stacks child spans beneath their parent, so a wide bar near the bottom is a deep call eating most of the request budget. The Gantt view lays spans against absolute time, making it obvious when two downstream calls run sequentially that could have been concurrent.

:::tip
A long parent span with a small amount of child-span width underneath usually means time was lost *inside* the parent — serialization, lock contention, or local computation — not in a downstream dependency.
:::

## Span details

Click any span to open its detail panel:

### Attributes

Key-value tags describing the operation. Standard OpenTelemetry semantic attributes appear here — `http.method`, `http.route`, `db.statement`, `rpc.service`, `messaging.system` — alongside any custom attributes your code attached.

### Events

Time-stamped annotations *within* a span. A captured exception shows up as an event named `exception` carrying `exception.type`, `exception.message`, and `exception.stacktrace`. Events are how you see "what happened at 142ms into this span" without splitting it into more spans.

### Status

Every span carries a status code:

- `Unset` — no explicit status (treated as success)
- `Ok` — explicitly marked successful
- `Error` — the operation failed; these are what error filters in the [Trace Explorer](/mindops-docs/traces/trace-explorer/) match

```text
status.code    = ERROR
status.message = "connection reset by peer"
```

## Jumping to correlated logs

Distributed traces and logs share the same `trace_id`. From a span detail panel, use **View logs** to pivot straight to every log line emitted during that span's execution. This turns "the span errored" into "here is the exact log line and stack trace that explains why."

See [Correlate Traces and Logs](/mindops-docs/traces/correlate-traces-and-logs/) for how to ensure your logs carry the trace context that makes this jump possible.
