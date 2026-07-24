---
title: Browser Traces & Logs
description: Send browser traces and logs to MindOps over OTLP/HTTP with the OpenTelemetry web SDK, including the CORS configuration the OTLP HTTP receiver needs.
---

Once the web SDK is running, the browser can emit both traces (spans for page loads and API calls) and logs (console-style records and structured events). Both travel to MindOps over OTLP/HTTP. This page covers wiring up each signal and the one piece of server configuration that browsers always require: CORS.

## Sending traces

Traces capture the timeline of a page: the document load, resource fetches, and outgoing `fetch`/XHR calls. Export them over OTLP/HTTP to the `:4318` endpoint.

```js
import { WebTracerProvider } from '@opentelemetry/sdk-trace-web';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { resourceFromAttributes } from '@opentelemetry/resources';

const provider = new WebTracerProvider({
  resource: resourceFromAttributes({ 'service.name': 'web-storefront' }),
});
provider.addSpanProcessor(
  new BatchSpanProcessor(
    new OTLPTraceExporter({ url: 'http://localhost:4318/v1/traces' })
  )
);
provider.register();
```

## Sending logs

The logs SDK lets you forward structured log records from the browser to the same backend, so a frontend error sits next to the trace that produced it.

```js
import { LoggerProvider, BatchLogRecordProcessor } from '@opentelemetry/sdk-logs';
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-http';

const logs = new LoggerProvider();
logs.addLogRecordProcessor(
  new BatchLogRecordProcessor(
    new OTLPLogExporter({ url: 'http://localhost:4318/v1/logs' })
  )
);

const logger = logs.getLogger('web-storefront');
logger.emit({
  severityText: 'ERROR',
  body: 'Checkout failed',
  attributes: { 'order.id': '4821', route: location.pathname },
});
```

:::tip
Capture `window.onerror` and `unhandledrejection` and emit them as ERROR log records. That single step surfaces most client-side crashes in MindOps.
:::

## The CORS requirement

A browser will not POST telemetry to an origin different from the page unless that endpoint answers a CORS preflight. Your OTLP/HTTP receiver - usually an OpenTelemetry Collector in front of MindOps - must allow your site's origin.

```yaml
receivers:
  otlp:
    protocols:
      http:
        endpoint: 0.0.0.0:4318
        cors:
          allowed_origins:
            - "https://app.example.com"
            - "http://localhost:5173"
          allowed_headers:
            - "*"
```

:::caution
Without `cors.allowed_origins`, the browser silently blocks the export and you will see no data. Check the browser network tab for a failed preflight (`OPTIONS`) request when telemetry does not arrive. Avoid a wildcard origin in production; list the exact sites you trust.
:::

## Verifying

1. Open your app and trigger a navigation and an API call.
2. In the browser network tab, confirm `POST /v1/traces` and `/v1/logs` return `200`.
3. In the MindOps UI at `http://localhost:8080`, open the traces explorer and filter by your `service.name`.
4. Check the logs explorer for the records you emitted.

## Tips

- Set a clear `service.name` so frontend signals are easy to isolate.
- Batch exports (the default) to avoid a request per span.
- Scrub sensitive values from URLs and log bodies before they leave the browser.

For the SDK setup basics, see the [Frontend monitoring overview](/frontend-monitoring/overview/).
