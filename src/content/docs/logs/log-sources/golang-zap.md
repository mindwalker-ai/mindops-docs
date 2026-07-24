---
title: Ship Go Zap Logs to MindOps
description: Forward Uber Zap logs from a Go service to MindOps using the OpenTelemetry Zap core bridge and the OTLP log exporter.
---

Zap is a high-performance structured logger from Uber. The OpenTelemetry `otelzap` bridge wraps a Zap core so each log entry becomes an OTLP log record that is exported to MindOps.

## Install the packages

```bash
go get go.opentelemetry.io/contrib/bridges/otelzap
go get go.opentelemetry.io/otel/sdk/log
go get go.opentelemetry.io/otel/exporters/otlp/otlplog/otlploghttp
```

## Wire the bridge into a Zap logger

```go
package main

import (
	"context"

	"go.opentelemetry.io/contrib/bridges/otelzap"
	"go.opentelemetry.io/otel/exporters/otlp/otlplog/otlploghttp"
	"go.opentelemetry.io/otel/sdk/log"
	"go.opentelemetry.io/otel/sdk/resource"
	semconv "go.opentelemetry.io/otel/semconv/v1.26.0"
	"go.uber.org/zap"
)

func main() {
	ctx := context.Background()

	// Self-hosted MindOps needs NO ingestion key.
	exporter, _ := otlploghttp.New(ctx,
		otlploghttp.WithEndpoint("localhost:4318"),
		otlploghttp.WithInsecure(),
	)

	res, _ := resource.New(ctx,
		resource.WithAttributes(semconv.ServiceName("inventory-api")),
	)
	provider := log.NewLoggerProvider(
		log.WithResource(res),
		log.WithProcessor(log.NewBatchProcessor(exporter)),
	)
	defer provider.Shutdown(ctx)

	logger := zap.New(otelzap.NewCore("inventory-api", otelzap.WithLoggerProvider(provider)))
	defer logger.Sync()

	logger.Info("stock reserved", zap.String("sku", "BK-1102"), zap.Int("qty", 5))
}
```

## Where the endpoint goes

`WithEndpoint` accepts a `host:port` value pointing at the MindOps OTLP HTTP receiver.

| Deployment | Endpoint |
|------------|----------|
| Local install | `localhost:4318` |
| App in Docker Compose | `signoz-ingester:4318` |

:::note
Use `zapcore.NewTee` to combine the OpenTelemetry core with a console core if you also want logs printed to stdout.
:::

## Verify in MindOps

Visit `http://localhost:8080`, open **Logs**, and filter on `service.name = inventory-api`. Confirm your Zap entries appear with their structured fields (`sku`, `qty`) attached as attributes.
