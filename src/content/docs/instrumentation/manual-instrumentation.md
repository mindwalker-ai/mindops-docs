---
title: Manual Instrumentation with OpenTelemetry
description: A language-agnostic guide to creating spans, attributes, events, and status manually so MindOps captures the business logic auto-instrumentation cannot see.
---

Auto-instrumentation captures framework boundaries — HTTP handlers, database
drivers, message consumers. It cannot see *why* a request was slow or *which*
business step failed. Manual instrumentation fills that gap with spans you place
by hand. MindOps stitches them into the same traces.

## When to instrument manually

- A meaningful unit of work has no library integration (a pricing calculation, a
  batch job step, a cache rebuild).
- You want richer context: customer tier, feature flag, queue depth, retry count.
- You need to mark a span as failed with a precise reason for error analytics.
- A single auto-span hides several sub-operations you want timed separately.

## The four building blocks

| Concept | What it captures |
| --- | --- |
| **Span** | A timed operation with a name, start, and end |
| **Attribute** | A key/value tag on a span (`order.id`, `cache.hit`) |
| **Event** | A timestamped log point within a span's lifetime |
| **Status** | `Ok` or `Error` with an optional description |

:::tip[Span naming]
Use low-cardinality, descriptive names like `reserve_inventory` — never embed
IDs in the span name. Put the IDs in attributes instead so MindOps can aggregate.
:::

## Node.js

```js
const { trace, SpanStatusCode } = require('@opentelemetry/api');
const tracer = trace.getTracer('orders');

async function reserveInventory(order) {
  return tracer.startActiveSpan('reserve_inventory', async (span) => {
    span.setAttribute('order.id', order.id);
    span.setAttribute('order.line_count', order.lines.length);
    try {
      const result = await reserve(order);
      span.addEvent('inventory_reserved', { warehouse: result.warehouse });
      return result;
    } catch (err) {
      span.recordException(err);
      span.setStatus({ code: SpanStatusCode.ERROR, message: err.message });
      throw err;
    } finally {
      span.end();
    }
  });
}
```

## Python

```python
from opentelemetry import trace

tracer = trace.get_tracer("orders")

def reserve_inventory(order):
    with tracer.start_as_current_span("reserve_inventory") as span:
        span.set_attribute("order.id", order.id)
        span.set_attribute("order.line_count", len(order.lines))
        try:
            result = reserve(order)
            span.add_event("inventory_reserved", {"warehouse": result.warehouse})
            return result
        except Exception as exc:
            span.record_exception(exc)
            span.set_status(trace.StatusCode.ERROR, str(exc))
            raise
```

## Go

```go
tracer := otel.Tracer("orders")

func reserveInventory(ctx context.Context, order Order) (Result, error) {
    ctx, span := tracer.Start(ctx, "reserve_inventory")
    defer span.End()

    span.SetAttributes(
        attribute.String("order.id", order.ID),
        attribute.Int("order.line_count", len(order.Lines)),
    )

    result, err := reserve(ctx, order)
    if err != nil {
        span.RecordError(err)
        span.SetStatus(codes.Error, err.Error())
        return Result{}, err
    }
    span.AddEvent("inventory_reserved",
        trace.WithAttributes(attribute.String("warehouse", result.Warehouse)))
    return result, nil
}
```

## Context propagation

Manual spans become children of the active span automatically when you reuse the
current context — `startActiveSpan` in Node, `start_as_current_span` in Python,
and passing `ctx` through in Go. Always thread the context so the parent/child
relationship survives and the trace stays connected.

:::caution[Always end your spans]
A span that never calls `end()` (or whose `with`/`defer` scope never closes)
will not export and can leak memory. Prefer scope-bound helpers over manual
start/end pairs wherever the language allows.
:::

## Verify in MindOps

After adding manual spans, generate traffic and open `http://localhost:8080`.
In **Services**, open the relevant service, then drill into a trace — your custom
spans appear nested under the auto-instrumented request span, with the attributes
and events you attached. Self-hosted MindOps needs no API key to receive them.
