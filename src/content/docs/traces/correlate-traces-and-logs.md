---
title: Correlate Traces and Logs
description: Pivot between a span and the logs emitted during it using trace_id in MindOps, and ensure your application logs carry trace context.
---

Traces tell you *that* a request was slow or failed; logs often tell you *why*. In MindOps the bridge between them is the `trace_id` (and the per-span `span_id`). When both signals carry the same identifiers, you can jump in either direction with one click.

## The pivot

From a span detail panel in a trace, choose **View logs** to open the logs filtered to that span's `trace_id`. You see every log line written while that request was executing — including the stack trace behind an error. Conversely, a log line that carries a `trace_id` links back to its originating trace, so you can move from a noisy error log straight into the full request context.

```text
span  trace_id = 7b2e...d41   span_id = a19c...
  └─ logs where trace_id = 7b2e...d41
```

## Ensuring logs carry trace_id

Correlation only works if your logs are stamped with the active trace context. The OpenTelemetry SDKs make this straightforward.

### Use a context-aware logging path

The cleanest approach is to emit logs through the OpenTelemetry logs pipeline (or an appender/bridge for your language's logging library). The SDK automatically injects `trace_id`, `span_id`, and trace flags from the currently active span.

### Or inject the IDs into structured logs

If you keep your existing logger, pull the current span context and add the fields yourself:

```python
from opentelemetry import trace

span = trace.get_current_span()
ctx = span.get_span_context()
logger.info(
    "charge failed",
    extra={
        "trace_id": format(ctx.trace_id, "032x"),
        "span_id": format(ctx.span_id, "016x"),
    },
)
```

:::caution
Emit `trace_id` as the 32-character lowercase hex form and `span_id` as 16-character hex. Mismatched formats (for example, decimal vs hex) break the join even when the underlying value is correct.
:::

### Map the fields on ingestion

If your logs already contain trace identifiers under custom keys, map them to the standard `trace_id` / `span_id` fields with a transform/attributes processor in your Collector pipeline so MindOps can correlate them. See [Drop and Transform Spans](/traces/drop-spans/) for processor examples and the [Collector overview](/collection-agents/overview/).

:::tip
Log structured key-value data, not pre-formatted strings. Structured logs let MindOps index `trace_id` as a real field and make the pivot instant.
:::

Once correlation is in place, the workflow becomes: spot a failing span in the [Trace Explorer](/traces/trace-explorer/) → open the trace → jump to its logs → read the root cause.
