---
title: Frontend Monitoring Overview
description: Monitor real users in the browser with the OpenTelemetry web SDK - capture page loads, fetch/XHR spans, and JavaScript errors, then ship them to MindOps.
---

Backend telemetry tells you the server was fast; frontend monitoring tells you the user actually had a good experience. By instrumenting the browser with the OpenTelemetry web SDK, MindOps captures real user monitoring (RUM) data straight from the page and correlates it with your backend traces.

## What you can capture

| Signal | Examples |
|--------|----------|
| Page load spans | Document load, resource fetches, DOM timing |
| Fetch / XHR spans | Outgoing API calls with URL, status, duration |
| User interaction spans | Clicks and route changes (with the right instrumentation) |
| JavaScript errors | Uncaught exceptions and unhandled rejections |
| Core Web Vitals | LCP, INP, CLS and friends (sent as metrics) |

Because the browser propagates trace context on its requests, a slow page load can be followed all the way into the services that served it.

## How it works

The web SDK runs auto-instrumentation in the user's browser. Each tracked activity becomes a span, spans are batched, and the batch is exported over OTLP/HTTP to a Collector that forwards to MindOps.

```text
Browser (OTel web SDK)
   --> spans / logs over OTLP/HTTP (:4318)
       --> OpenTelemetry Collector
           --> MindOps (ClickHouse)
               --> UI at http://localhost:8080
```

:::note
Browsers speak HTTP, not gRPC, so frontend telemetry always uses the OTLP/HTTP endpoint on port `4318`. A self-hosted MindOps needs no ingestion key.
:::

## Minimal setup

Install the web packages and start a tracer provider that exports over OTLP/HTTP.

```js
import { WebTracerProvider } from '@opentelemetry/sdk-trace-web';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { getWebAutoInstrumentations } from '@opentelemetry/auto-instrumentations-web';

const provider = new WebTracerProvider();
provider.addSpanProcessor(
  new BatchSpanProcessor(
    new OTLPTraceExporter({ url: 'http://localhost:4318/v1/traces' })
  )
);
provider.register();

registerInstrumentations({ instrumentations: [getWebAutoInstrumentations()] });
```

:::caution
The OTLP/HTTP receiver must allow cross-origin requests from your site's origin, or the browser will block the export. See the CORS note in [Browser traces & logs](/frontend-monitoring/traces-and-logs/).
:::

## What to do next

- Send real user performance with [Core Web Vitals](/frontend-monitoring/web-vitals/).
- Forward browser traces and logs and handle CORS in [Browser traces & logs](/frontend-monitoring/traces-and-logs/).
- Set a meaningful `service.name` resource attribute so frontend telemetry is easy to find in the UI.

## Practical advice

- Sample aggressively in high-traffic apps; you rarely need every page load.
- Strip query strings or tokens from captured URLs to avoid leaking secrets.
- Keep the SDK bundle lean by importing only the instrumentations you use.
