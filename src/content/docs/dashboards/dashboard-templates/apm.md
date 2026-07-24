---
title: APM Dashboard
description: Out-of-the-box RED metrics (Rate, Errors, Duration) per service, derived from OpenTelemetry spans in MindOps.
---

# APM Dashboard

The APM template gives you a service-level health view built from the RED method
(Rate, Errors, Duration). MindOps computes these signals from the distributed
traces your applications emit, so any instrumented service shows up automatically.

## What it shows

- Request rate (throughput) per service, in requests per second
- Error rate and error percentage by service and operation
- Latency distribution: p50, p95, and p99 duration
- Top endpoints / operations ranked by traffic and by error count
- Apdex-style breakdown of slow versus healthy calls

## Prerequisites / data source

This dashboard reads from span data, not a metrics receiver. You need traces
flowing into MindOps first.

| Requirement | Detail |
|-------------|--------|
| Instrumentation | OpenTelemetry SDK or auto-instrumentation in your app |
| Collector | OTLP receiver (`otlp` over gRPC `4317` or HTTP `4318`) |
| Attributes | `service.name` set on every resource |

The Collector pipeline must export traces to MindOps. RED metrics are generated
from the span stream, so spans must carry duration, status codes, and a service
name.

:::tip
Set `service.name` consistently across deployments. The APM dashboard groups
every panel by this attribute, so inconsistent names fragment your data.
:::

## Import

1. In the MindOps UI at `http://localhost:8080`, open **Dashboards**.
2. Choose **New** → **Import JSON**.
3. Paste or upload the APM template JSON, then confirm.
4. Pick the service from the dashboard variable at the top.

:::note
If panels read "No data", confirm traces are arriving under **Traces** and that
the selected time range covers recent activity.
:::

## Variables

| Variable | Purpose |
|----------|---------|
| `service.name` | Filter every panel to one service |
| `operation` | Drill into a single endpoint or RPC method |
| `deployment.environment` | Separate prod, staging, and dev |
