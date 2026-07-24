---
title: Instrument Next.js with OpenTelemetry
description: Add server-side OpenTelemetry tracing to a Next.js app using the instrumentation.ts register hook and export spans to MindOps.
---

Next.js exposes a built-in `instrumentation` hook that runs once when the server
process boots — the natural place to initialize OpenTelemetry. This captures
route handlers, server actions, and `fetch` calls made on the server. MindOps
then renders the resulting traces in the Services view.

## Install the dependencies

The `@vercel/otel` package wraps the OpenTelemetry SDK with sensible Next.js
defaults.

```bash
npm install @vercel/otel @opentelemetry/api @opentelemetry/exporter-trace-otlp-http
```

## Enable the instrumentation hook

Modern Next.js (13.4+) loads `instrumentation.ts` automatically. On older
versions add the flag in `next.config.js`:

```js
// next.config.js
module.exports = {
  experimental: { instrumentationHook: true },
};
```

## Register the SDK

Create `instrumentation.ts` in the project root (or `src/`):

```ts
import { registerOTel } from '@vercel/otel';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';

export function register() {
  registerOTel({
    serviceName: process.env.OTEL_SERVICE_NAME ?? 'storefront-web',
    traceExporter: new OTLPTraceExporter({
      url: 'http://localhost:4318/v1/traces',
    }),
  });
}
```

:::note[Server runtime only]
Tracing initializes in the Node.js server runtime. Guard against the Edge runtime
if needed with `if (process.env.NEXT_RUNTIME === 'nodejs')`. Browser/client
components are not traced by this hook.
:::

## Configure with environment variables

| Variable | Example |
| --- | --- |
| `OTEL_SERVICE_NAME` | `storefront-web` |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | `http://localhost:4318` |
| `OTEL_RESOURCE_ATTRIBUTES` | `deployment.environment=production` |

`@vercel/otel` reads these standard variables, so the hardcoded URL above can be
dropped once the env var is set:

```bash
OTEL_SERVICE_NAME=storefront-web \
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318 \
OTEL_RESOURCE_ATTRIBUTES=deployment.environment=production \
npm run start
```

:::tip[Self-host requires no API key]
Point the HTTP exporter at the local MindOps OTLP endpoint on `:4318`. No
authentication header is needed for a self-hosted backend.
:::

## Add a manual span

Inside a route handler or server action, use the OpenTelemetry API:

```ts
import { trace } from '@opentelemetry/api';

export async function POST(req: Request) {
  const tracer = trace.getTracer('checkout');
  return tracer.startActiveSpan('create_order', async (span) => {
    try {
      const order = await persistOrder(await req.json());
      span.setAttribute('order.id', order.id);
      return Response.json(order);
    } finally {
      span.end();
    }
  });
}
```

## Verify in MindOps

Run a production build (`npm run build && npm run start`), hit a few routes, then
open `http://localhost:8080` → **Services**. The `storefront-web` service shows
up with RED metrics derived from the server-side spans.
