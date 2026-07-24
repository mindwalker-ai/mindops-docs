---
title: Ship Go Zerolog Logs to MindOps
description: Forward Zerolog logs from a Go service to MindOps using an OpenTelemetry writer and the OTLP log exporter.
---

Zerolog is a zero-allocation JSON logger for Go. By routing Zerolog through an OpenTelemetry-aware writer, each log line is turned into an OTLP log record and exported to MindOps for storage in ClickHouse.

## Install the packages

```bash
go get github.com/rs/zerolog
go get go.opentelemetry.io/contrib/bridges/otelzerolog
go get go.opentelemetry.io/otel/sdk/log
go get go.opentelemetry.io/otel/exporters/otlp/otlplog/otlploghttp
```

## Attach the OpenTelemetry writer

```go
package main

import (
	"context"
	"os"

	"github.com/rs/zerolog"
	"go.opentelemetry.io/contrib/bridges/otelzerolog"
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
		resource.WithAttributes(semconv.ServiceName("auth-service")),
	)
	provider := log.NewLoggerProvider(
		log.WithResource(res),
		log.WithProcessor(log.NewBatchProcessor(exporter)),
	)
	defer provider.Shutdown(ctx)

	otelWriter := otelzerolog.NewWriter("auth-service", otelzerolog.WithLoggerProvider(provider))
	logger := zerolog.New(zerolog.MultiLevelWriter(os.Stdout, otelWriter)).With().Timestamp().Logger()

	logger.Info().Str("user_id", "u-7781").Msg("login succeeded")
}
```

## Where the endpoint goes

`WithEndpoint` is a `host:port` for the MindOps OTLP HTTP receiver.

| Deployment | Endpoint |
|------------|----------|
| Local install | `localhost:4318` |
| App in Docker Compose | `signoz-ingester:4318` |

:::tip
`zerolog.MultiLevelWriter` lets logs reach stdout and MindOps at once, so you keep local visibility while shipping to the platform.
:::

## Verify in MindOps

Open `http://localhost:8080`, navigate to **Logs**, and filter on `service.name = auth-service`. Trigger a log event and confirm the entry, with fields like `user_id`, appears in the live stream.
