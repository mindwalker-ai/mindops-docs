---
title: Database and External Calls
description: Read the Database Calls and External Calls views in MindOps to find slow queries and slow third-party dependencies, all derived from client spans.
---

When a service calls a database or another API, OpenTelemetry records a **client
span** describing that outbound work. MindOps groups those client spans into two
focused views — **Database Calls** and **External Calls** — so you can pinpoint
which dependency is dragging down a service without reading individual traces.

## Where the data comes from

Both views are built entirely from client spans that auto-instrumentation already
emits. No extra configuration is required.

| View | Driven by span attribute | Example value |
| --- | --- | --- |
| Database Calls | `db.system` | `postgresql`, `mysql`, `mongodb`, `redis` |
| External Calls | HTTP client attributes | `http.request.method`, `server.address` |

:::note[Client spans, not server spans]
These views ignore the inbound request span. They aggregate only the *outbound*
calls a service makes, which is exactly what you need to separate "my code is
slow" from "my dependency is slow".
:::

## Database Calls

The Database Calls tab on a service breaks down every query the service issues.
For each database operation MindOps shows:

- **Throughput** — calls per second to that database
- **Error rate** — share of failed queries
- **Latency** — p50/p90/p99 of query duration

This makes the classic culprits obvious. An endpoint that looks slow in the
Services view often turns out to be issuing a slow or repeated query — a textbook
N+1 pattern shows up as very high throughput against one query with modest
per-call latency.

:::tip[Find the slow query fast]
Sort the Database Calls table by p99 latency to surface the single worst query,
then click through to a representative trace to see the exact statement and its
parent operation.
:::

## External Calls

The External Calls tab aggregates outbound HTTP requests to other services and
third-party APIs, keyed by destination (`server.address`). For each target you
see the same throughput, error rate, and latency percentiles.

Use it to answer questions like:

- Which third-party API is timing out and inflating my p99?
- Is a downstream microservice returning errors that I am absorbing?
- Did latency to a payment provider jump after their last deploy?

## A typical investigation

1. In **Services**, notice a service with a degraded p99 or falling Apdex —
   see [The Services view](/mindops-docs/apm/services/).
2. Open that service and check **Database Calls** and **External Calls**.
3. Sort by p99 latency or by error rate to find the offending dependency.
4. Click into a trace to confirm the root cause — a slow `SELECT`, a retrying
   HTTP client, or a saturated connection pool.

:::caution[Watch error propagation]
A high error rate on an external call that does *not* raise your service's own
error rate usually means you are silently swallowing the failure. Treat that as a
signal to add explicit handling and a span status, not to ignore it.
:::

## Verify the views populate

These tables fill in as soon as instrumented client spans arrive. Send traffic
that hits a database or external API, then open `http://localhost:8080` →
**Services** → your service → **Database Calls** / **External Calls**. A
self-hosted MindOps instance receives this OTLP data on `:4317` and `:4318` with
no API key required.
