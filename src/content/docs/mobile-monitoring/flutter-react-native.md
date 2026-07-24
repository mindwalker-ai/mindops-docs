---
title: Flutter & React Native
description: Instrument Flutter and React Native apps with OpenTelemetry and export traces to MindOps through a gateway Collector over OTLP/HTTP.
---

Cross-platform frameworks each have an OpenTelemetry path to MindOps. Flutter uses the OpenTelemetry Dart SDK; React Native uses the OpenTelemetry JS SDK. Both export over OTLP/HTTP to your gateway Collector, which forwards to MindOps.

## Flutter

### Add the dependency

```yaml
# pubspec.yaml
dependencies:
  opentelemetry: ^0.18.0
```

### Initialize and export

Configure a tracer provider with an OTLP/HTTP exporter pointed at your gateway, then register it before the app builds its first screen.

```dart
import 'package:opentelemetry/api.dart' as otel;
import 'package:opentelemetry/sdk.dart' as sdk;

void initTelemetry() {
  final exporter = sdk.CollectorExporter(
    Uri.parse('https://otel.example.com/v1/traces'),
  );

  final provider = sdk.TracerProviderBase(
    processors: [sdk.BatchSpanProcessor(exporter)],
    resource: sdk.Resource([
      otel.Attribute.fromString('service.name', 'flutter-storefront'),
    ]),
  );

  otel.registerGlobalTracerProvider(provider);
}
```

### Record a span

```dart
final tracer = otel.globalTracerProvider.getTracer('checkout');
final span = tracer.startSpan('submit-order');
try {
  await submitOrder();
} catch (e, st) {
  span.recordException(e, stackTrace: st);
} finally {
  span.end();
}
```

## React Native

### Install the packages

```bash
npm install @opentelemetry/sdk-trace-web \
  @opentelemetry/exporter-trace-otlp-http \
  @opentelemetry/resources
```

### Initialize and export

```js
import { WebTracerProvider } from '@opentelemetry/sdk-trace-web';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { resourceFromAttributes } from '@opentelemetry/resources';

const provider = new WebTracerProvider({
  resource: resourceFromAttributes({ 'service.name': 'rn-storefront' }),
});
provider.addSpanProcessor(
  new BatchSpanProcessor(
    new OTLPTraceExporter({ url: 'https://otel.example.com/v1/traces' })
  )
);
provider.register();
```

### Record a span

```js
import { trace } from '@opentelemetry/api';

const tracer = trace.getTracer('checkout');
const span = tracer.startSpan('submit-order');
try {
  await submitOrder();
} catch (err) {
  span.recordException(err);
} finally {
  span.end();
}
```

:::note
Both frameworks export over OTLP/HTTP (`/v1/traces`, port `4318` at the gateway), not gRPC. Send to the gateway Collector's public HTTPS URL, never directly to the backend. A self-hosted MindOps needs no ingestion key.
:::

## Verify

1. Run the app and trigger a few traced flows and network calls.
2. Confirm the gateway Collector receives `POST /v1/traces`.
3. In the MindOps UI at `http://localhost:8080`, filter traces by your `service.name`.

## Tips

- Set a distinct `service.name` per app so signals stay separated.
- Batch exports to save battery and mobile data.
- Keep tokens and PII out of span attributes and URLs.

See the [Mobile monitoring overview](/mindops-docs/mobile-monitoring/overview/) for the gateway pattern.
