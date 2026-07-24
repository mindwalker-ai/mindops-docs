---
title: iOS & Swift
description: Instrument an iOS app written in Swift with the OpenTelemetry Swift SDK and export traces to MindOps through a gateway Collector over OTLP/HTTP.
---

The OpenTelemetry Swift SDK brings traces, metrics, and logs to iOS apps. It can instrument `URLSession` calls automatically and lets you record custom spans for the flows that matter. Telemetry exports over OTLP to MindOps through your gateway Collector.

## Add the package

Add the Swift SDK with Swift Package Manager. In Xcode, choose **File -> Add Packages** and point it at the OpenTelemetry Swift repository, then add the OTLP HTTP exporter product to your app target.

```swift
// Package.swift dependency
.package(url: "https://github.com/open-telemetry/opentelemetry-swift", from: "1.0.0")
```

## Initialize the tracer provider

Set up the SDK early in the app lifecycle, for example in your `App` struct or `AppDelegate`.

```swift
import OpenTelemetryApi
import OpenTelemetrySdk
import OpenTelemetryProtocolExporterHttp
import OpenTelemetryProtocolExporterCommon

func startTelemetry() {
    let endpoint = URL(string: "https://otel.example.com/v1/traces")!
    let exporter = OtlpHttpTraceExporter(endpoint: endpoint)

    let resource = Resource(attributes: [
        "service.name": AttributeValue.string("ios-storefront"),
        "app.version": AttributeValue.string(
            Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "unknown"
        ),
    ])

    let provider = TracerProviderBuilder()
        .add(spanProcessor: BatchSpanProcessor(spanExporter: exporter))
        .with(resource: resource)
        .build()

    OpenTelemetry.registerTracerProvider(tracerProvider: provider)
}
```

:::note
Use the OTLP/HTTP exporter targeting `/v1/traces` on your gateway Collector (port `4318`), not gRPC. HTTP is the most reliable choice on mobile networks. A self-hosted MindOps backend needs no ingestion key; reach it through the gateway.
:::

## Record a custom span

Measure an important user flow with a manual span.

```swift
let tracer = OpenTelemetry.instance.tracerProvider
    .get(instrumentationName: "checkout", instrumentationVersion: "1.0")

let span = tracer.spanBuilder(spanName: "submit-order").startSpan()
defer { span.end() }
do {
    try submitOrder()
} catch {
    span.recordException(error)
    span.status = .error(description: "order failed")
}
```

## Instrument network calls

The `URLSession` instrumentation creates a span for each HTTP request automatically, capturing method, URL, status, and duration. Enable it once so all outgoing calls are traced without per-call code, and trace context propagates to your backend.

## Verify

1. Build and run the app, then exercise screens and network requests.
2. Confirm the gateway Collector logs incoming `POST /v1/traces` calls.
3. In the MindOps UI at `http://localhost:8080`, filter the traces explorer by `service.name = ios-storefront`.

## Tips

- Initialize telemetry before the first network call so early activity is captured.
- Use `BatchSpanProcessor` to limit radio wakeups and battery drain.
- Remove tokens and personal data from span attributes and URLs.
- Buffer spans while offline and flush when connectivity returns.

See the [Mobile monitoring overview](/mindops-docs/mobile-monitoring/overview/) for the gateway Collector pattern.
