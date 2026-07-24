---
title: Android & Kotlin
description: Instrument an Android app written in Kotlin with the OpenTelemetry Android SDK and export traces to MindOps through a gateway Collector over OTLP/HTTP.
---

The OpenTelemetry Android SDK adds observability to a Kotlin app with minimal code. It auto-instruments common signals - app startup, activity lifecycle, ANRs, crashes, and HTTP calls - and exports them over OTLP to MindOps through your gateway Collector.

## Add the dependencies

Add the OpenTelemetry Android artifacts to your module's Gradle build.

```kotlin
// app/build.gradle.kts
dependencies {
    implementation(platform("io.opentelemetry:opentelemetry-bom:1.+"))
    implementation("io.opentelemetry.android:android-agent:0.+")
    implementation("io.opentelemetry:opentelemetry-exporter-otlp")
}
```

## Initialize on app start

Configure the SDK once in your `Application` subclass so it is ready before the first screen renders.

```kotlin
import io.opentelemetry.android.OpenTelemetryRumBuilder
import io.opentelemetry.android.config.OtelRumConfig

class MindOpsApp : Application() {
    override fun onCreate() {
        super.onCreate()
        OpenTelemetryRumBuilder.create(this, OtelRumConfig())
            .setEndpoint("https://otel.example.com")   // gateway Collector
            .build()
    }
}
```

The endpoint is your public gateway Collector, which forwards to MindOps. Point it at the gateway's OTLP/HTTP base URL.

## Configure the OTLP exporter explicitly

If you assemble the tracer provider yourself, wire an OTLP/HTTP span exporter directly.

```kotlin
import io.opentelemetry.exporter.otlp.http.trace.OtlpHttpSpanExporter
import io.opentelemetry.sdk.trace.export.BatchSpanProcessor

val exporter = OtlpHttpSpanExporter.builder()
    .setEndpoint("https://otel.example.com/v1/traces")
    .build()

val processor = BatchSpanProcessor.builder(exporter).build()
```

:::note
Use OTLP/HTTP (`/v1/traces` on port `4318` at the gateway), not gRPC. HTTP behaves better across mobile carriers and proxies. The self-hosted MindOps backend needs no ingestion key, but reach it through the gateway, never directly.
:::

## Record a custom span

Wrap an important flow to measure it end to end.

```kotlin
val tracer = GlobalOpenTelemetry.getTracer("checkout")
val span = tracer.spanBuilder("submit-order").startSpan()
try {
    span.makeCurrent().use {
        submitOrder()
    }
} catch (e: Exception) {
    span.recordException(e)
    throw e
} finally {
    span.end()
}
```

## Set resource attributes

Tag every span with identifying attributes so you can filter in the MindOps UI.

```kotlin
import io.opentelemetry.sdk.resources.Resource
import io.opentelemetry.api.common.Attributes
import io.opentelemetry.semconv.ServiceAttributes

val resource = Resource.getDefault().merge(
    Resource.create(
        Attributes.builder()
            .put(ServiceAttributes.SERVICE_NAME, "android-storefront")
            .put("app.version", BuildConfig.VERSION_NAME)
            .build()
    )
)
```

## Verify

1. Run the app and exercise a few screens and network calls.
2. Confirm the gateway Collector receives `POST /v1/traces` requests.
3. In the MindOps UI at `http://localhost:8080`, filter the traces explorer by `service.name = android-storefront`.

## Tips

- Initialize once, in `Application.onCreate`, before other components start.
- Batch exports to conserve battery and data.
- Strip auth tokens and PII from span attributes and captured URLs.

See the [Mobile monitoring overview](/mobile-monitoring/overview/) for the gateway pattern.
