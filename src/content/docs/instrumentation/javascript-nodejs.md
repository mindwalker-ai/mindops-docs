---
title: Instrument Node.js with OpenTelemetry
description: Auto-instrument an Express, Fastify, or plain Node.js service with the OpenTelemetry SDK and send traces to MindOps over OTLP gRPC.
---

Node.js instrumentation works by loading the OpenTelemetry SDK **before** your
application code. A small bootstrap file registers the tracer provider, an OTLP
exporter, and the auto-instrumentation set, then patches `http`, `express`,
`pg`, `ioredis`, and many other modules as they are required.

## Install the dependencies

```bash
npm install @opentelemetry/sdk-node \
  @opentelemetry/auto-instrumentations-node \
  @opentelemetry/exporter-trace-otlp-grpc
```

## Create the bootstrap file

Create `instrument.js` at the project root:

```js
const { NodeSDK } = require('@opentelemetry/sdk-node');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-grpc');

const sdk = new NodeSDK({
  traceExporter: new OTLPTraceExporter({
    url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4317',
  }),
  instrumentations: [getNodeAutoInstrumentations()],
});

sdk.start();

process.on('SIGTERM', () => {
  sdk.shutdown().finally(() => process.exit(0));
});
```

:::caution[Load order matters]
The SDK must initialize before any instrumented library is imported. Always use
`--require` (or an `import` at the very top of an ESM entrypoint) rather than
calling `sdk.start()` partway through `app.js`.
:::

## Configure with environment variables

| Variable | Example | Purpose |
| --- | --- | --- |
| `OTEL_SERVICE_NAME` | `web-api` | Name in the Services list |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | `http://localhost:4317` | OTLP gRPC receiver |
| `OTEL_RESOURCE_ATTRIBUTES` | `deployment.environment=staging` | Resource tags |

## Run your application

```bash
OTEL_SERVICE_NAME=web-api \
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4317 \
OTEL_RESOURCE_ATTRIBUTES=deployment.environment=staging \
node --require ./instrument.js app.js
```

To use HTTP transport on port `4318`, install
`@opentelemetry/exporter-trace-otlp-proto` and point the URL at
`http://localhost:4318/v1/traces`.

:::tip[No key for self-host]
A local MindOps backend ingests OTLP without authentication. You only add an
`Authorization` header when shipping to a managed collector.
:::

## Add a manual span

```js
const { trace } = require('@opentelemetry/api');

const tracer = trace.getTracer('checkout');

async function placeOrder(cart) {
  return tracer.startActiveSpan('place_order', async (span) => {
    span.setAttribute('cart.item_count', cart.items.length);
    try {
      await charge(cart);
      span.addEvent('payment_authorized');
    } catch (err) {
      span.recordException(err);
      span.setStatus({ code: 2, message: err.message }); // ERROR
      throw err;
    } finally {
      span.end();
    }
  });
}
```

## Verify in MindOps

Send some requests, then open `http://localhost:8080` and go to **Services**.
Your `web-api` service appears with request rate, error rate, and latency
percentiles computed automatically from the traces it emits.
