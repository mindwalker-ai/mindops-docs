---
title: .NET Application Metrics
description: Use the System.Diagnostics.Metrics Meter API with OpenTelemetry .NET to export counters and histograms to MindOps over OTLP.
---

## Overview

.NET ships a native metrics API through `System.Diagnostics.Metrics.Meter`. OpenTelemetry .NET subscribes to that API and forwards measurements to MindOps via the OTLP exporter. This guide wires both together.

## Install packages

```bash
dotnet add package OpenTelemetry.Extensions.Hosting
dotnet add package OpenTelemetry.Exporter.OpenTelemetryProtocol
```

## Define a Meter and instruments

```csharp
using System.Diagnostics.Metrics;

public static class Telemetry
{
    public static readonly Meter Meter = new("Billing.Service", "1.0.0");

    public static readonly Counter<long> InvoicesIssued =
        Meter.CreateCounter<long>("invoices.issued", "1", "Invoices issued");

    public static readonly Histogram<double> RenderTime =
        Meter.CreateHistogram<double>("invoice.render.duration", "ms", "Invoice render time");
}
```

Record measurements anywhere in your code:

```csharp
Telemetry.InvoicesIssued.Add(1, new KeyValuePair<string, object?>("plan", "pro"));
Telemetry.RenderTime.Record(12.5, new KeyValuePair<string, object?>("plan", "pro"));
```

## Register OpenTelemetry

```csharp
builder.Services.AddOpenTelemetry()
    .ConfigureResource(r => r.AddService("billing-service"))
    .WithMetrics(metrics => metrics
        .AddMeter("Billing.Service")
        .AddRuntimeInstrumentation()
        .AddOtlpExporter(o =>
        {
            o.Endpoint = new Uri("http://localhost:4317");
            o.Protocol = OpenTelemetry.Exporter.OtlpExportProtocol.Grpc;
        }));
```

Because MindOps is self-hosted, no ingestion key header is required.

## Environment configuration

```bash
export OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4317
export OTEL_SERVICE_NAME=billing-service
export OTEL_METRICS_EXPORTER=otlp
```

These variables override the in-code exporter settings when present.

## Verify in MindOps

Open the MindOps UI at `http://localhost:8080`, navigate to **Metrics**, and search for `invoices.issued` or `invoice.render.duration`. Data appears after the first export cycle.
