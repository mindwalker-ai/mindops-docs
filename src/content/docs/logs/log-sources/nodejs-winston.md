---
title: Ship Node.js Winston Logs to MindOps
description: Forward Winston logs from a Node.js service to MindOps using the OpenTelemetry Winston transport and OTLP log exporter.
---

Winston is one of the most widely used loggers in the Node.js ecosystem. The OpenTelemetry instrumentation for Winston attaches a transport that converts each log entry into an OTLP log record and sends it to MindOps.

## Install the packages

```bash
npm install @opentelemetry/sdk-logs \
  @opentelemetry/api-logs \
  @opentelemetry/exporter-logs-otlp-http \
  @opentelemetry/instrumentation-winston \
  winston
```

## Wire up the logger provider

Initialize the OpenTelemetry logs SDK before you create your Winston logger so the auto-instrumentation can hook the transport in.

```js
const { LoggerProvider, BatchLogRecordProcessor } = require('@opentelemetry/sdk-logs');
const { OTLPLogExporter } = require('@opentelemetry/exporter-logs-otlp-http');
const { Resource } = require('@opentelemetry/resources');
const { logs } = require('@opentelemetry/api-logs');
const { WinstonInstrumentation } = require('@opentelemetry/instrumentation-winston');
const { registerInstrumentations } = require('@opentelemetry/instrumentation');

const provider = new LoggerProvider({
  resource: new Resource({ 'service.name': 'cart-service' }),
});

// Self-hosted MindOps needs NO ingestion key.
provider.addLogRecordProcessor(
  new BatchLogRecordProcessor(
    new OTLPLogExporter({ url: 'http://localhost:4318/v1/logs' })
  )
);
logs.setGlobalLoggerProvider(provider);

registerInstrumentations({ instrumentations: [new WinstonInstrumentation()] });

const winston = require('winston');
const logger = winston.createLogger({
  transports: [new winston.transports.Console()],
});

logger.info('Item added to cart', { sku: 'TS-204', qty: 2 });
```

## Where the endpoint goes

The exporter `url` targets the MindOps OTLP HTTP receiver.

- Local install: `http://localhost:4318/v1/logs`.
- Service running inside Docker Compose with MindOps: `http://signoz-ingester:4318/v1/logs`.

:::tip
Keep the Console transport so logs still print to stdout. The OpenTelemetry transport is added automatically by the instrumentation alongside whatever transports you configure.
:::

## Verify in MindOps

Browse to `http://localhost:8080`, open **Logs**, and filter on `service.name = cart-service`. Each Winston `info`/`error` call should appear with its structured metadata (`sku`, `qty`) as searchable attributes.
