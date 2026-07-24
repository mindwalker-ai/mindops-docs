---
title: The Services View
description: Read RED metrics, Apdex, and the service map in MindOps. Filter by environment and drill into any service — all derived automatically from trace data.
---

The **Services** view is the front door to application performance monitoring in
MindOps. Every service that sends traces appears here automatically — there is no
separate metrics pipeline to configure. MindOps computes the headline numbers
from the spans themselves.

## RED metrics

For each service, MindOps surfaces the three RED signals that summarize health at
a glance.

| Signal | Meaning | How it is computed |
| --- | --- | --- |
| **Rate** | Throughput | Requests per second from server spans |
| **Errors** | Failure ratio | Percentage of spans with an error status |
| **Duration** | Latency | p50, p90, and p99 of span duration |

The latency percentiles matter more than an average. A healthy p50 with a p99 in
the seconds tells you a tail of slow requests is hurting some users even when the
typical request is fast.

:::tip[Read percentiles, not averages]
Averages hide outliers. Watch p99 to catch the slow tail, and compare p50 vs p99
to gauge how consistent a service is.
:::

## Apdex

Apdex condenses latency into a single satisfaction score between 0 and 1, based
on a target threshold *T* you define per service.

- **Satisfied**: requests faster than *T*
- **Tolerating**: requests between *T* and 4×*T*
- **Frustrated**: requests slower than 4×*T*

The score is `(satisfied + tolerating/2) / total`. A score near 1.0 means almost
everyone is happy; a falling score is an early warning that latency is degrading
before errors spike.

## Filtering by environment

Services typically run in several environments. If your instrumentation sets the
`deployment.environment` resource attribute (via `OTEL_RESOURCE_ATTRIBUTES`),
MindOps lets you filter the entire view to one environment.

```bash
OTEL_RESOURCE_ATTRIBUTES=deployment.environment=production
```

With that set, you can isolate `production` from `staging` so a noisy test
environment never skews your production error rate.

## The service map

The service map renders the call graph between your instrumented services. Each
node is a service; each edge is a real request path observed in trace data.
Edges are colored by error rate and weighted by throughput, so a failing
downstream dependency stands out immediately. Because the map is built from
distributed trace context, it stays accurate without any manual topology config.

## Drilling into a service

Click a service to open its detail view, where you can:

1. See RED metrics over your selected time range.
2. Break down latency and errors by **endpoint** to find the worst operation.
3. Jump from any spike straight into the **traces** that produced it.
4. Open the **Database Calls** and **External Calls** tabs to inspect downstream
   dependencies — see [Database and external calls](/apm/database-and-external-calls/).

:::note[Everything is trace-derived]
You never push RED metrics or Apdex directly. Instrument your service to emit
traces — see the language guides under [Introduction](/introduction/) — and
MindOps derives the Services view from them.
:::

## Verify your service appears

After instrumenting an application, send some traffic and open
`http://localhost:8080` → **Services**. Your `OTEL_SERVICE_NAME` should list
within a minute. A self-hosted MindOps instance ingests OTLP on `:4317` and
`:4318` with no API key, so as long as the process can reach those ports, the
service populates on its own.
