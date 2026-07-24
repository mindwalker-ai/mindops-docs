---
title: Ship Go Logrus Logs to MindOps
description: Forward Logrus logs from a Go service to MindOps using the OpenTelemetry Logrus hook and the OTLP log exporter.
---

Logrus is a structured logger for Go. By attaching the OpenTelemetry Logrus hook, every entry is converted into an OTLP log record and exported to MindOps, where it is stored in ClickHouse for querying.

## Install the packages

```bash
go get go.opentelemetry.io/contrib/bridges/otellogrus
go get go.opentelemetry.io/otel/sdk/log
go get go.opentelemetry.io/otel/exporters/otlp/otlplog/otlploghttp
```

## Bootstrap the exporter and hook

```go
package main

import (
	"context"

	"github.com/sirupsen/logrus"
	"go.opentelemetry.io/contrib/bridges/otellogrus"
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
		resource.WithAttributes(semconv.ServiceName("payment-worker")),
	)
	provider := log.NewLoggerProvider(
		log.WithResource(res),
		log.WithProcessor(log.NewBatchProcessor(exporter)),
	)
	defer provider.Shutdown(ctx)

	logrus.AddHook(otellogrus.NewHook("payment-worker", otellogrus.WithLoggerProvider(provider)))

	logrus.WithField("invoice", "INV-9920").Info("payment captured")
}
```

## Where the endpoint goes

`WithEndpoint` takes a `host:port` (no scheme) for the MindOps OTLP HTTP receiver.

| Deployment | Endpoint |
|------------|----------|
| Local install | `localhost:4318` |
| App in Docker Compose | `signoz-ingester:4318` |

:::tip
Keep Logrus writing to stdout as well so the records remain visible locally. The hook runs in addition to your existing output formatter.
:::

## Verify in MindOps

Open `http://localhost:8080`, go to **Logs**, and filter on `service.name = payment-worker`. Each Logrus entry, including custom fields such as `invoice`, should appear as a searchable log record.
