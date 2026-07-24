---
title: Ship Node.js Pino Logs to MindOps
description: Forward Pino logs from a Node.js service to MindOps using the OpenTelemetry Pino instrumentation and OTLP log exporter.
---

Pino is a fast, low-overhead JSON logger for Node.js. With the OpenTelemetry Pino instrumentation, every log line is mirrored into an OTLP log record and shipped to MindOps without changing how you call the logger.

## Install the packages

```bash
npm install @opentelemetry/sdk-logs \
  @opentelemetry/api-logs \
  @opentelemetry/exporter-logs-otlp-http \
  @opentelemetry/instrumentation-pino \
  pino
```

## Initialize before requiring Pino

The instrumentation must be registered before `pino` is loaded so it can patch the module.

```js
const { LoggerProvider, BatchLogRecordProcessor } = require('@opentelemetry/sdk-logs');
const { OTLPLogExporter } = require('@opentelemetry/exporter-logs-otlp-http');
const { Resource } = require('@opentelemetry/resources');
const { logs } = require('@opentelemetry/api-logs');
const { PinoInstrumentation } = require('@opentelemetry/instrumentation-pino');
const { registerInstrumentations } = require('@opentelemetry/instrumentation');

const provider = new LoggerProvider({
  resource: new Resource({ 'service.name': 'search-api' }),
});

// Self-hosted MindOps needs NO ingestion key.
provider.addLogRecordProcessor(
  new BatchLogRecordProcessor(
    new OTLPLogExporter({ url: 'http://localhost:4318/v1/logs' })
  )
);
logs.setGlobalLoggerProvider(provider);

registerInstrumentations({ instrumentations: [new PinoInstrumentation()] });

// Require pino AFTER instrumentation is registered.
const pino = require('pino');
const logger = pino();

logger.info({ query: 'wireless mouse', hits: 37 }, 'search executed');
```

## Where the endpoint goes

Set the exporter `url` to the MindOps OTLP HTTP receiver.

| Deployment | Exporter URL |
|------------|--------------|
| Local install | `http://localhost:4318/v1/logs` |
| App in Docker Compose | `http://signoz-ingester:4318/v1/logs` |

:::note
The Pino instrumentation also injects active `trace_id` and `span_id` into log records, so if you also send traces to MindOps the logs and traces correlate automatically.
:::

## Verify in MindOps

Open `http://localhost:8080`, go to **Logs**, and filter on `service.name = search-api`. Confirm your Pino JSON fields (`query`, `hits`) show up as log attributes in the stream.
