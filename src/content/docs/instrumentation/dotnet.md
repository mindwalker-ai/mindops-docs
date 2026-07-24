---
title: Instrument .NET with OpenTelemetry
description: Add OpenTelemetry to an ASP.NET Core application with AddOpenTelemetry and AddOtlpExporter, then ship traces to MindOps over OTLP.
---

The OpenTelemetry .NET libraries integrate directly with the generic host and
dependency injection. You register tracing on the service collection, add the
instrumentation packages you need, and configure the OTLP exporter — all in
`Program.cs`.

## Install the dependencies

```bash
dotnet add package OpenTelemetry.Extensions.Hosting
dotnet add package OpenTelemetry.Exporter.OpenTelemetryProtocol
dotnet add package OpenTelemetry.Instrumentation.AspNetCore
dotnet add package OpenTelemetry.Instrumentation.Http
```

## Register OpenTelemetry in Program.cs

```csharp
using OpenTelemetry.Resources;
using OpenTelemetry.Trace;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOpenTelemetry()
    .ConfigureResource(resource => resource
        .AddService(serviceName: "billing-api"))
    .WithTracing(tracing => tracing
        .AddAspNetCoreInstrumentation()
        .AddHttpClientInstrumentation()
        .AddOtlpExporter(options =>
        {
            options.Endpoint = new Uri("http://localhost:4317");
        }));

var app = builder.Build();
app.MapControllers();
app.Run();
```

The default OTLP protocol is gRPC, matching MindOps port `4317`. For HTTP on
`4318`, set `options.Protocol = OtlpExportProtocol.HttpProtobuf` and use
`http://localhost:4318`.

## Configure with environment variables

The exporter reads the standard OpenTelemetry variables, so you can keep secrets
and endpoints out of code:

| Variable | Example |
| --- | --- |
| `OTEL_SERVICE_NAME` | `billing-api` |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | `http://localhost:4317` |
| `OTEL_RESOURCE_ATTRIBUTES` | `deployment.environment=production` |

```bash
OTEL_SERVICE_NAME=billing-api \
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4317 \
OTEL_RESOURCE_ATTRIBUTES=deployment.environment=production \
dotnet run
```

:::tip[Self-hosted: no key required]
A local MindOps Collector accepts OTLP traffic without an `Authorization`
header. Leave the exporter's `Headers` option empty for self-host.
:::

## Add a manual span

Define an `ActivitySource`, register it with the tracer, and start activities:

```csharp
using System.Diagnostics;

public static class Telemetry
{
    public static readonly ActivitySource Source = new("Billing.Workflow");
}

// register the source
tracing.AddSource("Billing.Workflow");

// emit a span
using var activity = Telemetry.Source.StartActivity("settle_invoice");
activity?.SetTag("invoice.id", invoiceId);
activity?.SetTag("invoice.amount_cents", amountCents);
```

:::note[Activity == Span]
In .NET the framework's `Activity` type is the OpenTelemetry span. Any
`ActivitySource` you register with `AddSource` flows straight to MindOps.
:::

## Verify in MindOps

Run the app, exercise an endpoint, then open `http://localhost:8080` →
**Services**. `billing-api` shows request rate, error rate, and latency
percentiles derived automatically from the exported activities.
