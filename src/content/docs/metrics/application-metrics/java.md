---
title: Java Application Metrics
description: Emit OpenTelemetry metrics from Java services to MindOps using the auto-instrumentation agent and manually defined meters over OTLP.
---

## Overview

MindOps collects application metrics from Java services through OpenTelemetry. You can rely on the zero-code Java agent for runtime and library metrics, then layer in custom meters for business-specific measurements. Both paths export over OTLP to your MindOps collector.

## Option 1: The OpenTelemetry Java agent

The agent captures JVM, HTTP, and database metrics with no code changes.

```bash
curl -L -o opentelemetry-javaagent.jar \
  https://github.com/open-telemetry/opentelemetry-java-instrumentation/releases/latest/download/opentelemetry-javaagent.jar
```

Attach it when you launch your application:

```bash
java -javaagent:./opentelemetry-javaagent.jar \
  -Dotel.service.name=checkout-service \
  -Dotel.exporter.otlp.endpoint=http://localhost:4317 \
  -Dotel.exporter.otlp.protocol=grpc \
  -Dotel.metrics.exporter=otlp \
  -jar target/checkout-service.jar
```

Because MindOps is self-hosted, no ingestion key is required.

## Option 2: Manual meters

Add the SDK dependencies (Gradle shown):

```groovy
implementation platform("io.opentelemetry:opentelemetry-bom:1.45.0")
implementation "io.opentelemetry:opentelemetry-api"
implementation "io.opentelemetry:opentelemetry-sdk"
implementation "io.opentelemetry:opentelemetry-exporter-otlp"
```

Set up a `Meter` and instruments:

```java
OpenTelemetry otel = GlobalOpenTelemetry.get();
Meter meter = otel.getMeter("checkout-service");

LongCounter orders = meter.counterBuilder("orders.placed")
    .setDescription("Number of orders placed")
    .setUnit("1")
    .build();

DoubleHistogram latency = meter.histogramBuilder("checkout.duration")
    .setDescription("Checkout request duration")
    .setUnit("ms")
    .build();

orders.add(1, Attributes.of(AttributeKey.stringKey("region"), "eu"));
latency.record(42.7, Attributes.of(AttributeKey.stringKey("region"), "eu"));
```

## Environment configuration

```bash
export OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4317
export OTEL_SERVICE_NAME=checkout-service
export OTEL_METRICS_EXPORTER=otlp
```

## Verify in MindOps

Open the MindOps UI at `http://localhost:8080`, go to **Metrics**, and search for `orders.placed` or `checkout.duration`. New data points appear within the export interval (60s by default).
