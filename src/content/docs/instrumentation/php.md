---
title: Instrument PHP with OpenTelemetry
description: Auto-instrument PHP with the ext-opentelemetry extension and Composer packages, or wire up the SDK manually, then export traces to MindOps.
---

PHP supports two paths to OpenTelemetry. The zero-code route uses the
`opentelemetry` PECL extension plus Composer auto-instrumentation packages. The
manual route uses the pure-PHP SDK directly. Both feed traces into MindOps.

## Auto-instrumentation (extension + Composer)

### Install the extension and packages

The extension provides the hooks that the auto-instrumentation libraries attach
to:

```bash
pecl install opentelemetry
```

Then add the SDK, OTLP exporter, transport, and the instrumentations you need:

```bash
composer require \
  open-telemetry/sdk \
  open-telemetry/exporter-otlp \
  open-telemetry/opentelemetry-auto-pdo \
  php-http/guzzle7-adapter
```

### Configure with environment variables

Auto-instrumentation is driven entirely by env vars — no bootstrap code:

| Variable | Example |
| --- | --- |
| `OTEL_PHP_AUTOLOAD_ENABLED` | `true` |
| `OTEL_SERVICE_NAME` | `checkout-php` |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | `http://localhost:4317` |
| `OTEL_EXPORTER_OTLP_PROTOCOL` | `grpc` |
| `OTEL_RESOURCE_ATTRIBUTES` | `deployment.environment=production` |

```bash
export OTEL_PHP_AUTOLOAD_ENABLED=true
export OTEL_SERVICE_NAME=checkout-php
export OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4317
export OTEL_EXPORTER_OTLP_PROTOCOL=grpc
export OTEL_RESOURCE_ATTRIBUTES=deployment.environment=production
php -d extension=opentelemetry public/index.php
```

:::caution[Autoload flag is required]
Without `OTEL_PHP_AUTOLOAD_ENABLED=true`, the Composer auto-instrumentation
packages stay dormant and no spans are produced. It is the master switch.
:::

## Manual SDK alternative (pure PHP)

If you cannot install the PECL extension, build the tracer yourself with the
pure-PHP SDK:

```php
<?php
use OpenTelemetry\API\Globals;
use OpenTelemetry\Contrib\Otlp\SpanExporter;
use OpenTelemetry\SDK\Common\Export\Stream\StreamTransportFactory;
use OpenTelemetry\SDK\Trace\SpanProcessor\SimpleSpanProcessor;
use OpenTelemetry\SDK\Trace\TracerProvider;

$transport = (new \OpenTelemetry\Contrib\Grpc\GrpcTransportFactory())
    ->create('http://localhost:4317' . OpenTelemetry\Contrib\Otlp\OtlpUtil::method(
        \Opentelemetry\Proto\Collector\Trace\V1\TraceServiceClient::class));

$exporter = new SpanExporter($transport);
$tracerProvider = new TracerProvider(new SimpleSpanProcessor($exporter));

$tracer = $tracerProvider->getTracer('checkout.workflow');
$span = $tracer->spanBuilder('place_order')->startSpan();
$span->setAttribute('cart.item_count', 3);
$span->end();

$tracerProvider->shutdown();
```

:::tip[Self-hosted: no key needed]
Whichever path you choose, point the exporter at `localhost:4317` (gRPC) or
`localhost:4318` (HTTP). A self-hosted MindOps Collector ingests OTLP with no
authentication header.
:::

## Add a manual span (with auto-instrumentation active)

```php
$tracer = \OpenTelemetry\API\Globals::tracerProvider()->getTracer('checkout');
$span = $tracer->spanBuilder('settle_payment')->startSpan();
$scope = $span->activate();
try {
    settle_payment($order);
} finally {
    $scope->detach();
    $span->end();
}
```

## Verify in MindOps

Send traffic to your PHP app, then open `http://localhost:8080` → **Services**.
`checkout-php` appears with RED metrics derived automatically from the spans.
