---
title: Exception Monitoring
description: Capture, group, and triage application exceptions in MindOps.
---

MindOps records **exceptions** as part of your traces, so every error is tied to the
request that produced it. Exceptions are grouped so you track *kinds* of problems rather
than drowning in individual events.

## Automatic capture

For several languages — Python, Java, Ruby, and JavaScript — common exceptions are recorded
automatically by the OpenTelemetry instrumentation. For other languages, record them on the
active span:

```python
from opentelemetry import trace

tracer = trace.get_tracer(__name__)
with tracer.start_as_current_span("operation") as span:
    try:
        risky_operation()
    except Exception as ex:
        span.record_exception(ex)
        span.set_status(trace.StatusCode.ERROR, str(ex))
        raise
```

## Grouping

Exceptions are grouped by **service**, **type**, and **message**. Grouping turns thousands
of raw errors into a handful of issues you can actually work through, each with a count and
a first/last-seen time.

:::tip[Watch your cardinality]
Exception messages that embed dynamic values (IDs, timestamps, URLs) create a new group per
value. Prefer grouping by service and type, and keep the variable detail in attributes.
:::

## Triage flow

1. Sort exception groups by frequency or recency.
2. Open a group to see affected services and a sample stack trace.
3. Jump to the **trace** that produced an occurrence to see the full request context.
4. Create an [alert](/alerts/overview/) so the next spike pages you automatically.
