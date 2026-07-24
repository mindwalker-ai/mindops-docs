---
title: Ruby Application Metrics
description: Configure the OpenTelemetry Ruby metrics SDK with an OTLP exporter to send counters and histograms to MindOps.
---

## Overview

The OpenTelemetry Ruby metrics SDK lets you register a `MeterProvider`, attach an OTLP metric exporter, and emit counters and histograms to MindOps. This guide sets up that pipeline for a plain Ruby service.

## Install gems

Add these to your `Gemfile`:

```ruby
gem "opentelemetry-metrics-sdk"
gem "opentelemetry-exporter-otlp-metrics"
```

Then install:

```bash
bundle install
```

## Configure the MeterProvider

```ruby
require "opentelemetry-metrics-sdk"
require "opentelemetry/exporter/otlp_metrics"

OpenTelemetry::SDK.configure do |c|
  c.service_name = "fulfillment-service"
end

exporter = OpenTelemetry::Exporter::OTLP::Metrics::MetricsExporter.new(
  endpoint: "http://localhost:4318/v1/metrics"
)

reader = OpenTelemetry::SDK::Metrics::Export::PeriodicMetricReader.new(
  exporter: exporter,
  export_interval_millis: 15000
)

OpenTelemetry.meter_provider.add_metric_reader(reader)
```

The OTLP metrics exporter for Ruby uses the HTTP endpoint on port `4318`.

## Create a counter and histogram

```ruby
meter = OpenTelemetry.meter_provider.meter("fulfillment-service")

shipments = meter.create_counter(
  "shipments.dispatched",
  description: "Shipments dispatched"
)

pack_time = meter.create_histogram(
  "pack.duration",
  unit: "ms",
  description: "Order packing time"
)

shipments.add(1, attributes: { "carrier" => "dhl" })
pack_time.record(58.3, attributes: { "carrier" => "dhl" })
```

Call `OpenTelemetry.meter_provider.shutdown` on exit to flush metrics.

## Environment configuration

```bash
export OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318
export OTEL_SERVICE_NAME=fulfillment-service
export OTEL_METRICS_EXPORTER=otlp
```

Self-hosted MindOps requires no ingestion key.

## Verify in MindOps

Open the MindOps UI at `http://localhost:8080`, navigate to **Metrics**, and search for `shipments.dispatched` or `pack.duration`. Data appears after the first export interval.
