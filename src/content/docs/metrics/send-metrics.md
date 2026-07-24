---
title: Send Metrics to MindOps
description: Emit application metrics with OpenTelemetry SDKs — counters, gauges, and histograms — configure export, and follow per-language pointers.
---

Application metrics are numeric measurements your code emits over time: requests
served, queue depth, request latency. MindOps ingests them over OTLP and stores
them in ClickHouse, ready to chart and alert on.

## Instrument types

Pick the instrument that matches what you are measuring.

| Instrument | Measures | Example |
|------------|----------|---------|
| Counter | Monotonic total that only goes up | `orders_total` |
| UpDownCounter | Value that rises and falls | `queue_depth` |
| Gauge | Point-in-time snapshot | `temperature_celsius` |
| Histogram | Distribution of values | `http_server_duration_ms` |

## A minimal counter

```python
from opentelemetry import metrics

meter = metrics.get_meter("checkout")
orders = meter.create_counter("orders_total", unit="1",
                              description="Orders placed")

orders.add(1, {"payment.method": "card", "region": "eu"})
```

The key/value map is the metric's **attributes** (labels). Keep label
cardinality bounded — every unique combination is a separate series.

## A histogram for latency

```python
latency = meter.create_histogram("http_server_duration",
                                 unit="ms")
latency.record(48.2, {"http.route": "/checkout",
                      "http.status_code": 200})
```

Histograms let MindOps compute percentiles (p90/p95/p99) at query time.

## Export configuration

Point the SDK at the MindOps OTLP endpoint via environment variables.

```bash
export OTEL_EXPORTER_OTLP_ENDPOINT="http://localhost:4317"
export OTEL_EXPORTER_OTLP_PROTOCOL="grpc"
export OTEL_SERVICE_NAME="checkout"
export OTEL_METRICS_EXPORTER="otlp"
export OTEL_METRIC_EXPORT_INTERVAL="60000"   # ms between pushes
```

:::note
Self-hosted MindOps needs **no** ingestion key — export straight to `:4317`
(gRPC) or `:4318` (HTTP). Keys are only used by managed deployments.
:::

## Per-language pointers

| Language | Approach |
|----------|----------|
| Python | `opentelemetry-sdk` + OTLP metric exporter; use `create_counter`/`create_histogram`. |
| Node.js | `@opentelemetry/sdk-metrics` with the OTLP metric exporter and a periodic reader. |
| Java | The OpenTelemetry Java agent auto-collects JVM and HTTP metrics; add custom meters via the API. |
| Go | `go.opentelemetry.io/otel/metric` with the OTLP exporter and a periodic reader. |

:::tip
Auto-instrumentation usually emits rich HTTP, runtime, and database metrics for
free. Add custom counters and histograms only for business-specific signals.
:::

## Choosing histogram vs gauge

Use a **histogram** when you care about the distribution and percentiles (e.g.
latency). Use a **gauge** for an instantaneous reading where averaging across
time would be misleading (e.g. current connections).

Once metrics arrive, explore them in the
[Metrics Explorer](/metrics/metrics-explorer/) and read about
[types and aggregation](/metrics/types-and-aggregation/).
