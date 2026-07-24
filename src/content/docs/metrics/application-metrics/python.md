---
title: Python Application Metrics
description: Set up an OpenTelemetry MeterProvider with the OTLP metric exporter to stream Python counters and histograms into MindOps.
---

## Overview

OpenTelemetry Python provides a metrics API built around a `MeterProvider`, a `PeriodicExportingMetricReader`, and an OTLP exporter. This guide configures that pipeline so your Python service reports to MindOps.

## Install dependencies

```bash
pip install opentelemetry-api \
  opentelemetry-sdk \
  opentelemetry-exporter-otlp-proto-grpc
```

## Configure the MeterProvider

```python
from opentelemetry import metrics
from opentelemetry.sdk.metrics import MeterProvider
from opentelemetry.sdk.metrics.export import PeriodicExportingMetricReader
from opentelemetry.sdk.resources import Resource
from opentelemetry.exporter.otlp.proto.grpc.metric_exporter import OTLPMetricExporter

exporter = OTLPMetricExporter(endpoint="http://localhost:4317", insecure=True)
reader = PeriodicExportingMetricReader(exporter, export_interval_millis=15000)

provider = MeterProvider(
    resource=Resource.create({"service.name": "recommendation-service"}),
    metric_readers=[reader],
)
metrics.set_meter_provider(provider)
```

## Create a counter and histogram

```python
meter = metrics.get_meter("recommendation-service")

requests = meter.create_counter(
    "recommendations.served",
    description="Recommendation responses served",
)

scoring_time = meter.create_histogram(
    "scoring.duration",
    unit="ms",
    description="Model scoring latency",
)

requests.add(1, {"model": "v3"})
scoring_time.record(34.2, {"model": "v3"})
```

Call `provider.shutdown()` at exit to flush buffered metrics.

## Environment configuration

```bash
export OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4317
export OTEL_SERVICE_NAME=recommendation-service
export OTEL_METRICS_EXPORTER=otlp
```

Self-hosted MindOps does not require an ingestion key.

## Verify in MindOps

Open the MindOps UI at `http://localhost:8080`, navigate to **Metrics**, and search for `recommendations.served` or `scoring.duration`. New points show up after the first export interval.
