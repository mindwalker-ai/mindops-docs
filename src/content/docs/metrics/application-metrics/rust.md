---
title: Rust Application Metrics
description: Instrument Rust services with the opentelemetry and opentelemetry-otlp crates to export counters and histograms to MindOps.
---

## Overview

The OpenTelemetry Rust crates expose a metrics API backed by a `SdkMeterProvider` and an OTLP exporter. This guide builds a minimal pipeline so a Rust service reports counters and histograms to MindOps.

## Add dependencies

```toml
[dependencies]
opentelemetry = { version = "0.27", features = ["metrics"] }
opentelemetry_sdk = { version = "0.27", features = ["metrics", "rt-tokio"] }
opentelemetry-otlp = { version = "0.27", features = ["grpc-tonic", "metrics"] }
tokio = { version = "1", features = ["full"] }
```

## Configure the MeterProvider

```rust
use opentelemetry::{global, KeyValue};
use opentelemetry_sdk::{metrics::SdkMeterProvider, Resource};
use opentelemetry_otlp::WithExportConfig;

fn init_metrics() -> SdkMeterProvider {
    let exporter = opentelemetry_otlp::MetricExporter::builder()
        .with_tonic()
        .with_endpoint("http://localhost:4317")
        .build()
        .expect("failed to build OTLP exporter");

    let provider = SdkMeterProvider::builder()
        .with_periodic_exporter(exporter)
        .with_resource(Resource::new(vec![
            KeyValue::new("service.name", "ledger-service"),
        ]))
        .build();

    global::set_meter_provider(provider.clone());
    provider
}
```

## Record a counter and histogram

```rust
let meter = global::meter("ledger-service");

let postings = meter
    .u64_counter("ledger.postings")
    .with_description("Ledger postings recorded")
    .build();

let commit_time = meter
    .f64_histogram("commit.duration")
    .with_unit("ms")
    .with_description("Transaction commit latency")
    .build();

postings.add(1, &[KeyValue::new("account", "AR")]);
commit_time.record(7.8, &[KeyValue::new("account", "AR")]);
```

Call `provider.shutdown()` before exit so pending metrics flush.

## Environment configuration

```bash
export OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4317
export OTEL_SERVICE_NAME=ledger-service
export OTEL_METRICS_EXPORTER=otlp
```

MindOps is self-hosted, so no ingestion key is needed.

## Verify in MindOps

Open `http://localhost:8080`, go to **Metrics**, and search for `ledger.postings` or `commit.duration` to confirm the data is arriving.
