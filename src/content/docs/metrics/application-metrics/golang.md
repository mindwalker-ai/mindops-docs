---
title: Go Application Metrics
description: Instrument Go services with the OpenTelemetry metrics SDK and export counters and histograms to MindOps over OTLP.
---

## Overview

The OpenTelemetry Go SDK gives you a programmatic metrics API: a `MeterProvider` wired to an OTLP exporter, plus meters that create counters and histograms. This guide sets up a minimal pipeline that streams to MindOps.

## Install dependencies

```bash
go get go.opentelemetry.io/otel \
  go.opentelemetry.io/otel/sdk/metric \
  go.opentelemetry.io/otel/exporters/otlp/otlpmetric/otlpmetricgrpc
```

## Configure the MeterProvider

```go
package main

import (
	"context"
	"time"

	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/exporters/otlp/otlpmetric/otlpmetricgrpc"
	"go.opentelemetry.io/otel/sdk/metric"
	"go.opentelemetry.io/otel/sdk/resource"
	semconv "go.opentelemetry.io/otel/semconv/v1.26.0"
)

func setupMeter(ctx context.Context) (*metric.MeterProvider, error) {
	exp, err := otlpmetricgrpc.New(ctx,
		otlpmetricgrpc.WithEndpoint("localhost:4317"),
		otlpmetricgrpc.WithInsecure(),
	)
	if err != nil {
		return nil, err
	}

	res, _ := resource.New(ctx,
		resource.WithAttributes(semconv.ServiceName("inventory-service")),
	)

	reader := metric.NewPeriodicReader(exp, metric.WithInterval(15*time.Second))
	mp := metric.NewMeterProvider(
		metric.WithReader(reader),
		metric.WithResource(res),
	)
	otel.SetMeterProvider(mp)
	return mp, nil
}
```

## Record a counter and histogram

```go
meter := otel.Meter("inventory-service")

reservations, _ := meter.Int64Counter("inventory.reservations",
	metric.WithDescription("Stock reservations created"))

queryTime, _ := meter.Float64Histogram("inventory.query.duration",
	metric.WithUnit("ms"),
	metric.WithDescription("Inventory query latency"))

reservations.Add(ctx, 1, metric.WithAttributes(attribute.String("sku", "A-12")))
queryTime.Record(ctx, 8.4, metric.WithAttributes(attribute.String("sku", "A-12")))
```

Call `mp.Shutdown(ctx)` on exit to flush pending data.

## Environment configuration

```bash
export OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4317
export OTEL_SERVICE_NAME=inventory-service
export OTEL_METRICS_EXPORTER=otlp
```

MindOps is self-hosted, so no ingestion key is needed.

## Verify in MindOps

Visit `http://localhost:8080`, open **Metrics**, and search for `inventory.reservations` or `inventory.query.duration` to confirm data is flowing.
