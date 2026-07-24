---
title: Send Your First Data
description: Instrument an application with OpenTelemetry and send telemetry to MindOps.
---

MindOps ingests data over OTLP. The quickest way to see something is to instrument an app
with an OpenTelemetry SDK and point it at your MindOps collector.

## Set the environment

Every OpenTelemetry SDK reads the same standard variables:

```bash
export OTEL_EXPORTER_OTLP_ENDPOINT="http://localhost:4317"
export OTEL_SERVICE_NAME="my-service"
export OTEL_RESOURCE_ATTRIBUTES="deployment.environment=dev"
```

:::danger[Always set a service name]
If `OTEL_SERVICE_NAME` is not set, all telemetry arrives as `unknown_service` and is
impossible to tell apart. Set it before you deploy.
:::

## Node.js example

```bash
npm install @opentelemetry/api \
  @opentelemetry/sdk-node \
  @opentelemetry/auto-instrumentations-node \
  @opentelemetry/exporter-trace-otlp-grpc
```

```javascript
// instrument.js — load BEFORE your app code
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
```

```bash
node --require ./instrument.js app.js
```

:::tip[Load the SDK first]
The SDK must be initialized **before** any other import (DB drivers, HTTP clients,
frameworks). Loading it with `--require ./instrument.js` guarantees this.
:::

## Verify

Send some traffic to your app, then open MindOps:

- **Services** — your service appears with latency and error-rate charts.
- **Traces** — individual requests show up with their spans.

If nothing arrives, add a `debug` exporter to your collector to confirm telemetry is being
produced, and double-check the endpoint and port.

## Supported languages

MindOps works with any OpenTelemetry SDK — Java, Python, Go, .NET, Ruby, PHP, Rust,
Node.js, plus mobile and frontend instrumentation.
