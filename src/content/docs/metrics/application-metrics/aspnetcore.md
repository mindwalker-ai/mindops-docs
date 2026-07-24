---
title: ASP.NET Core Metrics
description: Export built-in ASP.NET Core meters plus custom instruments to MindOps using OpenTelemetry and the OTLP exporter.
---

## Overview

Modern ASP.NET Core emits rich metrics natively through the `Microsoft.AspNetCore.Hosting`, `Microsoft.AspNetCore.Server.Kestrel`, and `System.Net.Http` meters. OpenTelemetry subscribes to these and ships them to MindOps. You can also add your own meters for domain measurements.

## Install packages

```bash
dotnet add package OpenTelemetry.Extensions.Hosting
dotnet add package OpenTelemetry.Instrumentation.AspNetCore
dotnet add package OpenTelemetry.Exporter.OpenTelemetryProtocol
```

## Register OpenTelemetry metrics

```csharp
var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOpenTelemetry()
    .ConfigureResource(r => r.AddService("storefront-api"))
    .WithMetrics(metrics => metrics
        .AddAspNetCoreInstrumentation()
        .AddMeter("Microsoft.AspNetCore.Hosting")
        .AddMeter("Microsoft.AspNetCore.Server.Kestrel")
        .AddMeter("Storefront.Api")
        .AddOtlpExporter(o =>
        {
            o.Endpoint = new Uri("http://localhost:4317");
        }));

var app = builder.Build();
```

The built-in meters surface request duration, active requests, and connection counts without extra code.

## Add a custom meter

```csharp
using System.Diagnostics.Metrics;

public static class StoreMetrics
{
    public static readonly Meter Meter = new("Storefront.Api");

    public static readonly Counter<long> CartsCreated =
        Meter.CreateCounter<long>("carts.created", "1", "Shopping carts created");

    public static readonly Histogram<double> SearchLatency =
        Meter.CreateHistogram<double>("search.latency", "ms", "Catalog search latency");
}

// In a controller or service:
StoreMetrics.CartsCreated.Add(1);
StoreMetrics.SearchLatency.Record(23.1);
```

Self-hosted MindOps requires no ingestion key.

## Environment configuration

```bash
export OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4317
export OTEL_SERVICE_NAME=storefront-api
export OTEL_METRICS_EXPORTER=otlp
```

## Verify in MindOps

In the MindOps UI (`http://localhost:8080`), open **Metrics** and look for `http.server.request.duration`, `carts.created`, or `search.latency`. They populate after the first export interval.
