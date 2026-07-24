---
title: JVM Metrics Dashboard
description: Monitor JVM heap, garbage collection, threads, and class loading from OpenTelemetry runtime metrics in MindOps.
---

# JVM Metrics Dashboard

This template visualizes the runtime health of a Java application: heap and
non-heap memory, garbage collection behavior, thread counts, and class loading.
It is fed by the JVM runtime metrics the OpenTelemetry Java agent emits.

## What it shows

- Heap memory used, committed, and max, split by pool (eden, survivor, old)
- Non-heap memory usage (metaspace, code cache)
- Garbage collection count and pause duration by collector
- Live thread count and daemon threads
- Loaded and unloaded class counts
- CPU utilization of the JVM process

## Prerequisites / data source

Attach the OpenTelemetry Java agent to your application and configure it to export
metrics over OTLP to MindOps. The agent collects JVM runtime metrics automatically.

```bash
java -javaagent:/path/opentelemetry-javaagent.jar \
  -Dotel.service.name=orders-api \
  -Dotel.metrics.exporter=otlp \
  -Dotel.exporter.otlp.endpoint=http://collector:4317 \
  -jar app.jar
```

| Requirement | Detail |
|-------------|--------|
| Instrumentation | OpenTelemetry Java agent |
| Signal | Runtime metrics enabled |
| Export | OTLP to the Collector or directly to MindOps |

:::note
Metric names follow the OpenTelemetry semantic conventions (for example
`jvm.memory.used` and `jvm.gc.duration`). Older agent versions used different
names; align panels to your agent version if a panel is empty.
:::

## Import

1. Open **Dashboards** → **New** → **Import JSON** in MindOps.
2. Upload the JVM template JSON.
3. Scope panels with the `service.name` variable.

:::tip
Correlate long GC pauses with request latency in the APM dashboard to confirm
whether collection pauses are hurting user-facing performance.
:::
