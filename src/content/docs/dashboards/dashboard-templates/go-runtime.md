---
title: Go Runtime Dashboard
description: Monitor goroutines, garbage collection, and memory stats from Go runtime metrics exported to MindOps.
---

# Go Runtime Dashboard

This template tracks the runtime internals of a Go service: goroutine counts,
garbage collection cycles, and memory allocation behavior from `runtime.MemStats`.
It is fed by the Go runtime instrumentation in the OpenTelemetry Go SDK.

## What it shows

- Live goroutine count
- Heap memory allocated, in use, and idle
- Garbage collection cycles and pause duration
- Memory allocation rate (bytes allocated per second)
- Next GC target and GC CPU fraction
- OS threads and memory obtained from the system

## Prerequisites / data source

Add the OpenTelemetry Go runtime instrumentation to your application and export
metrics over OTLP. The runtime package periodically reads `runtime.MemStats`.

```go
import "go.opentelemetry.io/contrib/instrumentation/runtime"

if err := runtime.Start(
    runtime.WithMinimumReadMemStatsInterval(time.Second),
); err != nil {
    log.Fatal(err)
}
```

| Requirement | Detail |
|-------------|--------|
| Instrumentation | `contrib/instrumentation/runtime` |
| Export | OTLP metrics to the Collector or MindOps |
| Attribute | `service.name` set on the meter provider |

:::note
Metric names use the `runtime.go.*` namespace (for example `runtime.go.goroutines`
and `runtime.go.gc.count`). Confirm your SDK version emits these names.
:::

## Import

1. In MindOps, open **Dashboards** → **New** → **Import JSON**.
2. Upload the Go runtime template JSON.
3. Filter by `service.name` using the dashboard variable.

:::tip
A goroutine count that climbs and never recedes is a classic leak signature. Watch
it next to heap-in-use to separate goroutine leaks from memory growth.
:::
