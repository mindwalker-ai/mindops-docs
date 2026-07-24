---
title: Instrumentation Overview
description: Instrument your applications with OpenTelemetry to power MindOps APM.
---

Application Performance Monitoring in MindOps is driven entirely by **traces**. Once a
service is instrumented with OpenTelemetry, MindOps automatically derives its latency,
error rate, and throughput — no separate APM agent required.

## What APM gives you

- **Service list** — every service that sends data, ranked by latency and error rate.
- **RED metrics** — Rate, Errors, Duration (p50/p90/p99) per service and per endpoint.
- **Apdex** — a single satisfaction score per service.
- **Service map** — a live dependency graph showing how services call each other.

## Instrumenting a service

1. Add the OpenTelemetry SDK and auto-instrumentation for your language.
2. Set `OTEL_SERVICE_NAME` and `OTEL_EXPORTER_OTLP_ENDPOINT`.
3. Initialize the SDK **before** the rest of your app loads.

See **[Send Your First Data](/get-started/send-data/)** for a runnable Node.js example.

## Auto vs manual instrumentation

- **Auto-instrumentation** covers popular frameworks, HTTP clients, and database drivers
  with zero code changes — start here.
- **Manual spans** let you wrap business-critical operations you care about:

```javascript
const { trace } = require('@opentelemetry/api');
const tracer = trace.getTracer('checkout');

await tracer.startActiveSpan('charge-card', async (span) => {
  try {
    await chargeCard(order);
  } finally {
    span.end();
  }
});
```

## Good practices

- Use a **stable** `service.name` — it is how MindOps groups everything.
- Add `deployment.environment` (e.g. `prod`, `staging`) so you can filter by environment.
- Keep high-cardinality data in attribute **values**, not keys.
