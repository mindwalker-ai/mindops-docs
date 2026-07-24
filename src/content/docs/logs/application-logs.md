---
title: Application Logs
description: Emit logs from application code using OpenTelemetry, correlate them with traces, and follow per-language setup pointers.
---

Application logs are records emitted directly from your code. When you route
them through OpenTelemetry, MindOps receives structured records that already
carry severity, attributes, and — crucially — the active trace context.

## Why emit through OpenTelemetry

- Logs and traces share the same `trace_id` and `span_id`, so you can jump from
  a slow span to its exact log lines.
- Severity and attributes arrive as first-class fields, not regex guesses.
- One export pipeline (OTLP) for traces, metrics, and logs.

## Trace correlation

When a log is written inside an active span, the OpenTelemetry SDK injects the
span context into the record. MindOps indexes `trace_id` and `span_id`, letting
the UI link a trace to its logs and back.

```text
2026-06-26T10:14:02Z INFO  order placed
  trace_id=4bf92f3577b34da6a3ce929d0e0e4736
  span_id=00f067aa0ba902b7
  attributes: {order.id: "A-552", amount: 49.90}
```

In the Log Explorer, filter on a `trace_id` to pull every line tied to one
request.

## Per-language pointers

| Language | Approach |
|----------|----------|
| Python | Use the OTel logging handler/bridge; attach it to the stdlib `logging` root logger so existing `logger.info(...)` calls are exported. |
| Node.js | Bridge `pino` or `winston` through the OpenTelemetry logs exporter, or use the OTel `@opentelemetry/api-logs` API directly. |
| Java | The OpenTelemetry Java agent auto-instruments Logback/Log4j2 and forwards records with trace context, no code change. |
| Go | Emit via the `slog` bridge or the OTel logs SDK; manually attach span context where needed. |

### Node.js with pino

```js
import pino from 'pino';
import { OpenTelemetryTransportV3 } from '@opentelemetry/winston-transport';
// or pino-opentelemetry-transport
const logger = pino({
  level: 'info',
  transport: { target: 'pino-opentelemetry-transport' },
});
logger.info({ orderId: 'A-552' }, 'order placed');
```

### Common environment configuration

```bash
export OTEL_EXPORTER_OTLP_ENDPOINT="http://localhost:4318"
export OTEL_EXPORTER_OTLP_PROTOCOL="http/protobuf"
export OTEL_SERVICE_NAME="checkout"
export OTEL_LOGS_EXPORTER="otlp"
```

:::tip
Set `service.name` consistently across traces, metrics, and logs. MindOps
groups telemetry by this resource attribute, so a mismatch splits one service
into two in the UI.
:::

:::caution
If your runtime lacks a mature OTel logging bridge, fall back to writing
structured JSON to stdout and collecting it with the Collector filelog
receiver — see [Send Logs](/mindops-docs/logs/send-logs/).
:::

Once logs arrive, learn the record shape in
[Fields and Attributes](/mindops-docs/logs/fields-and-attributes/).
