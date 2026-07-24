---
title: Ship Node.js Bunyan Logs to MindOps
description: Forward Bunyan logs from a Node.js service to MindOps using the OpenTelemetry Bunyan instrumentation and OTLP log exporter.
---

Bunyan is a JSON logging library for Node.js. The OpenTelemetry Bunyan instrumentation hooks into the logger and mirrors each record into an OTLP log record that is shipped to MindOps.

## Install the packages

```bash
npm install @opentelemetry/sdk-logs \
  @opentelemetry/api-logs \
  @opentelemetry/exporter-logs-otlp-http \
  @opentelemetry/instrumentation-bunyan \
  bunyan
```

## Register instrumentation before requiring Bunyan

```js
const { LoggerProvider, BatchLogRecordProcessor } = require('@opentelemetry/sdk-logs');
const { OTLPLogExporter } = require('@opentelemetry/exporter-logs-otlp-http');
const { Resource } = require('@opentelemetry/resources');
const { logs } = require('@opentelemetry/api-logs');
const { BunyanInstrumentation } = require('@opentelemetry/instrumentation-bunyan');
const { registerInstrumentations } = require('@opentelemetry/instrumentation');

const provider = new LoggerProvider({
  resource: new Resource({ 'service.name': 'webhook-receiver' }),
});

// Self-hosted MindOps needs NO ingestion key.
provider.addLogRecordProcessor(
  new BatchLogRecordProcessor(
    new OTLPLogExporter({ url: 'http://localhost:4318/v1/logs' })
  )
);
logs.setGlobalLoggerProvider(provider);

registerInstrumentations({ instrumentations: [new BunyanInstrumentation()] });

// Require bunyan AFTER instrumentation is registered.
const bunyan = require('bunyan');
const logger = bunyan.createLogger({ name: 'webhook-receiver' });

logger.info({ event: 'push', repo: 'core-api' }, 'webhook accepted');
```

## Where the endpoint goes

Set the exporter `url` to the MindOps OTLP HTTP receiver.

| Deployment | Exporter URL |
|------------|--------------|
| Local install | `http://localhost:4318/v1/logs` |
| App in Docker Compose | `http://signoz-ingester:4318/v1/logs` |

:::note
The Bunyan instrumentation keeps your existing streams intact, so records still print to stdout while a copy is forwarded to MindOps. It also injects `trace_id`/`span_id` for correlation when tracing is enabled.
:::

## Verify in MindOps

Open `http://localhost:8080`, go to **Logs**, and filter on `service.name = webhook-receiver`. Confirm your Bunyan records and their JSON fields (`event`, `repo`) appear in the live view.
