---
title: Node.js Application Metrics
description: Build an OpenTelemetry MeterProvider with a PeriodicExportingMetricReader and OTLP exporter to send Node.js metrics to MindOps.
---

## Overview

The OpenTelemetry JavaScript SDK lets Node.js services define a `MeterProvider`, attach a `PeriodicExportingMetricReader`, and push counters and histograms to MindOps over OTLP. This guide covers a manual setup you can drop into any service.

## Install dependencies

```bash
npm install @opentelemetry/sdk-metrics \
  @opentelemetry/exporter-metrics-otlp-grpc \
  @opentelemetry/resources \
  @opentelemetry/semantic-conventions
```

## Configure the MeterProvider

```js
const { MeterProvider, PeriodicExportingMetricReader } = require('@opentelemetry/sdk-metrics');
const { OTLPMetricExporter } = require('@opentelemetry/exporter-metrics-otlp-grpc');
const { resourceFromAttributes } = require('@opentelemetry/resources');
const { ATTR_SERVICE_NAME } = require('@opentelemetry/semantic-conventions');

const exporter = new OTLPMetricExporter({
  url: 'http://localhost:4317',
});

const meterProvider = new MeterProvider({
  resource: resourceFromAttributes({
    [ATTR_SERVICE_NAME]: 'notifications-service',
  }),
  readers: [
    new PeriodicExportingMetricReader({
      exporter,
      exportIntervalMillis: 15000,
    }),
  ],
});
```

## Create a counter and histogram

```js
const meter = meterProvider.getMeter('notifications-service');

const sent = meter.createCounter('messages.sent', {
  description: 'Notifications dispatched',
});

const deliveryTime = meter.createHistogram('delivery.duration', {
  description: 'End-to-end delivery time',
  unit: 'ms',
});

sent.add(1, { channel: 'email' });
deliveryTime.record(120, { channel: 'email' });
```

Call `await meterProvider.shutdown()` during graceful shutdown to flush metrics.

## Environment configuration

```bash
export OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4317
export OTEL_SERVICE_NAME=notifications-service
export OTEL_METRICS_EXPORTER=otlp
```

MindOps is self-hosted, so no ingestion key is required.

## Verify in MindOps

Open `http://localhost:8080`, go to **Metrics**, and search for `messages.sent` or `delivery.duration` to confirm ingestion.
