---
title: Instrument Go with OpenTelemetry
description: Wire up the OpenTelemetry Go SDK by hand, configure the OTLP gRPC exporter, and stream Go service traces to MindOps.
---

Go has no runtime agent, so instrumentation is explicit and lives in code. You
construct a tracer provider, register an OTLP exporter, and wrap your handlers
with the contrib middleware. The payoff is full control and zero magic.

## Install the dependencies

```bash
go get go.opentelemetry.io/otel \
  go.opentelemetry.io/otel/sdk \
  go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracegrpc \
  go.opentelemetry.io/contrib/instrumentation/net/http/otelhttp
```

## Initialize the tracer provider

Create a small bootstrap function that returns a shutdown handle:

```go
package main

import (
	"context"

	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracegrpc"
	"go.opentelemetry.io/otel/sdk/resource"
	sdktrace "go.opentelemetry.io/otel/sdk/trace"
	semconv "go.opentelemetry.io/otel/semconv/v1.26.0"
)

func initTracer(ctx context.Context) (func(context.Context) error, error) {
	exporter, err := otlptracegrpc.New(ctx,
		otlptracegrpc.WithEndpoint("localhost:4317"),
		otlptracegrpc.WithInsecure(),
	)
	if err != nil {
		return nil, err
	}

	res, _ := resource.New(ctx,
		resource.WithAttributes(semconv.ServiceName("inventory-service")),
	)

	tp := sdktrace.NewTracerProvider(
		sdktrace.WithBatcher(exporter),
		sdktrace.WithResource(res),
	)
	otel.SetTracerProvider(tp)
	return tp.Shutdown, nil
}
```

:::note[Insecure is correct here]
`WithInsecure()` disables TLS for the local plaintext OTLP port. That is exactly
what a self-hosted MindOps Collector listens for on `localhost:4317` — no
certificate or API key is involved.
:::

## Wrap your HTTP handlers

`otelhttp` produces a server span per request and propagates context:

```go
func main() {
	ctx := context.Background()
	shutdown, err := initTracer(ctx)
	if err != nil {
		panic(err)
	}
	defer shutdown(ctx)

	mux := http.NewServeMux()
	mux.Handle("/orders", otelhttp.NewHandler(http.HandlerFunc(ordersHandler), "orders"))
	http.ListenAndServe(":8000", mux)
}
```

## Configure with environment variables

The OTLP exporter also honors standard env vars, so you can override the
hardcoded endpoint without recompiling:

| Variable | Example |
| --- | --- |
| `OTEL_SERVICE_NAME` | `inventory-service` |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | `http://localhost:4317` |
| `OTEL_RESOURCE_ATTRIBUTES` | `deployment.environment=production` |

```bash
OTEL_SERVICE_NAME=inventory-service \
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4317 \
OTEL_RESOURCE_ATTRIBUTES=deployment.environment=production \
go run .
```

## Add a manual span

```go
tracer := otel.Tracer("inventory.workflow")
ctx, span := tracer.Start(ctx, "reserve_stock")
span.SetAttributes(attribute.Int("sku.count", len(skus)))
defer span.End()
```

## Verify in MindOps

Start the service, send requests, then open `http://localhost:8080` →
**Services**. `inventory-service` appears with RED metrics (rate, errors,
duration percentiles) computed from the spans you just exported.
