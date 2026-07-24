---
title: Core Concepts
description: The building blocks of MindOps — OpenTelemetry, the collector, signals, and services.
---

A few concepts show up everywhere in MindOps. Understanding them makes the rest of the
docs click into place.

## OpenTelemetry (OTel)

OpenTelemetry is the open standard MindOps is built on. It defines how applications produce
telemetry and a wire protocol (**OTLP**) for shipping it. Because MindOps speaks OTLP, any
OpenTelemetry-compatible source can send data to it — and you can move that data elsewhere
later without re-instrumenting.

## The Collector

The **OpenTelemetry Collector** is the front door for all data. It:

- **Receives** telemetry over OTLP (gRPC `4317`, HTTP `4318`)
- **Processes** it — batching, resource detection, redaction, sampling
- **Exports** it to ClickHouse for storage

## Signals

MindOps stores three kinds of signals:

- **Traces** — a tree of **spans** describing one request across services.
- **Metrics** — numeric time series (counters, gauges, histograms).
- **Logs** — structured or unstructured event records.

The signals are correlated: a span carries a `trace_id` that links it to the logs emitted
during that request, and exceptions are attached to the spans where they occurred.

## Services and resources

Every piece of telemetry carries **resource attributes** that describe where it came from —
most importantly `service.name`. MindOps groups data by service, so setting a clear,
stable service name is the single most important thing you can do when instrumenting.

## Attributes and cardinality

Spans, metrics, and logs carry **attributes** (key/value pairs). Keep variability in the
**values**, not the **keys**:

- ✅ `user.id = "8f3a…"` — a fixed key, many values
- ❌ a different key per user — unbounded keys explode cardinality and slow queries

## Retention

Self-hosted MindOps stores data in ClickHouse on your own disk. Set a retention period that
matches your disk budget, and monitor disk usage — when the disk fills, ingestion stops.
