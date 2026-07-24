---
title: Ship Go slog Logs to MindOps
description: Forward Go standard-library slog logs to MindOps using the OpenTelemetry slog bridge and the OTLP log exporter.
---

`slog` is the structured logging package in the Go standard library. The OpenTelemetry `otelslog` bridge provides an `slog.Handler` that converts each record into an OTLP log record and exports it to MindOps.

## Install the packages

```bash
go get go.opentelemetry.io/contrib/bridges/otelslog
go get go.opentelemetry.io/otel/sdk/log
go get go.opentelemetry.io/otel/exporters/otlp/otlplog/otlploghttp
```

## Build an slog logger backed by OpenTelemetry

```go
package main

import (
	"context"
	"log/slog"

	"go.opentelemetry.io/contrib/bridges/otelslog"
	"go.opentelemetry.io/otel/exporters/otlp/otlplog/otlploghttp"
	"go.opentelemetry.io/otel/sdk/log"
	"go.opentelemetry.io/otel/sdk/resource"
	semconv "go.opentelemetry.io/otel/semconv/v1.26.0"
)

func main() {
	ctx := context.Background()

	// Self-hosted MindOps needs NO ingestion key.
	exporter, _ := otlploghttp.New(ctx,
		otlploghttp.WithEndpoint("localhost:4318"),
		otlploghttp.WithInsecure(),
	)

	res, _ := resource.New(ctx,
		resource.WithAttributes(semconv.ServiceName("notifier")),
	)
	provider := log.NewLoggerProvider(
		log.WithResource(res),
		log.WithProcessor(log.NewBatchProcessor(exporter)),
	)
	defer provider.Shutdown(ctx)

	logger := otelslog.NewLogger("notifier", otelslog.WithLoggerProvider(provider))

	logger.Info("email queued", slog.String("template", "welcome"), slog.Int("recipients", 3))
}
```

## Where the endpoint goes

`WithEndpoint` takes a `host:port` for the MindOps OTLP HTTP receiver.

| Deployment | Endpoint |
|------------|----------|
| Local install | `localhost:4318` |
| App in Docker Compose | `signoz-ingester:4318` |

:::note
Set the logger as the process default with `slog.SetDefault(logger)` so package-level `slog.Info` calls also flow to MindOps.
:::

## Verify in MindOps

Browse to `http://localhost:8080`, open **Logs**, and filter on `service.name = notifier`. Confirm the slog records, including attributes such as `template` and `recipients`, appear in the stream.
