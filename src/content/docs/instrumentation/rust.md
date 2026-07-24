---
title: Instrument Rust with OpenTelemetry
description: Initialize the OpenTelemetry Rust SDK with the OTLP exporter, bridge it to the tracing crate, and send spans to MindOps.
---

Rust instrumentation pairs the `opentelemetry` SDK with the `opentelemetry-otlp`
exporter and bridges to the popular `tracing` crate so your existing `#[instrument]`
spans flow to MindOps without rewriting them.

## Add the dependencies

In `Cargo.toml`:

```toml
[dependencies]
opentelemetry = "0.27"
opentelemetry_sdk = { version = "0.27", features = ["rt-tokio"] }
opentelemetry-otlp = { version = "0.27", features = ["grpc-tonic"] }
tracing = "0.1"
tracing-subscriber = "0.3"
tracing-opentelemetry = "0.28"
tokio = { version = "1", features = ["full"] }
```

## Initialize the tracer

Build a tracer provider with the OTLP gRPC exporter, then register it as a
`tracing` layer:

```rust
use opentelemetry::trace::TracerProvider as _;
use opentelemetry::KeyValue;
use opentelemetry_otlp::WithExportConfig;
use opentelemetry_sdk::{trace::SdkTracerProvider, Resource};
use tracing_subscriber::prelude::*;

fn init_tracer() -> SdkTracerProvider {
    let exporter = opentelemetry_otlp::SpanExporter::builder()
        .with_tonic()
        .with_endpoint("http://localhost:4317")
        .build()
        .expect("failed to build OTLP exporter");

    let provider = SdkTracerProvider::builder()
        .with_batch_exporter(exporter)
        .with_resource(
            Resource::builder()
                .with_attribute(KeyValue::new("service.name", "pricing-engine"))
                .build(),
        )
        .build();

    let tracer = provider.tracer("pricing-engine");
    tracing_subscriber::registry()
        .with(tracing_opentelemetry::layer().with_tracer(tracer))
        .init();

    provider
}
```

## Wire it into main

```rust
#[tokio::main]
async fn main() {
    let provider = init_tracer();

    run_server().await;

    provider.shutdown().expect("clean shutdown flushes spans");
}
```

:::caution[Flush before exit]
The batch exporter buffers spans. Always call `provider.shutdown()` (or hold the
provider for the program's lifetime) so buffered spans reach MindOps before the
process ends.
:::

## Configure with environment variables

`opentelemetry-otlp` reads the standard variables, letting you override the
endpoint without recompiling:

| Variable | Example |
| --- | --- |
| `OTEL_SERVICE_NAME` | `pricing-engine` |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | `http://localhost:4317` |
| `OTEL_RESOURCE_ATTRIBUTES` | `deployment.environment=production` |

```bash
OTEL_SERVICE_NAME=pricing-engine \
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4317 \
OTEL_RESOURCE_ATTRIBUTES=deployment.environment=production \
cargo run --release
```

:::tip[No API key for self-host]
The `tonic` transport talks plaintext gRPC to `localhost:4317`. A self-hosted
MindOps Collector accepts it directly — no TLS certificate or token needed.
:::

## Emit spans through tracing

Once the bridge is set up, ordinary `tracing` instrumentation becomes OTLP spans:

```rust
use tracing::instrument;

#[instrument(fields(sku.count = skus.len()))]
async fn quote(skus: &[Sku]) -> Quote {
    tracing::info!("computing quote");
    compute(skus).await
}
```

## Verify in MindOps

Run the binary, generate some load, then open `http://localhost:8080` →
**Services**. `pricing-engine` appears with rate, error, and latency metrics
built from the exported spans.
