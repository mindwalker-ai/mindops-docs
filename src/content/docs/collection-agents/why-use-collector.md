---
title: Why Use a Collector
description: The benefits of routing telemetry through an OpenTelemetry Collector before MindOps — batching, retries, redaction, sampling, fan-out, and decoupling.
---

You *can* point your application SDKs straight at the MindOps OTLP endpoint. For a quick test, do it. For anything beyond that, put an OpenTelemetry Collector in the middle. The Collector is a small, stateless service that pays for itself the moment you have more than one app or care about cost, privacy, or reliability.

## What you gain

### Batching

Without a Collector, every SDK opens connections and sends frequently. The Collector's `batch` processor coalesces records into larger, efficient payloads — fewer network round-trips and less load on the backend.

### Retries and buffering

Backends restart, networks blip. The Collector's `sending_queue` and `retry_on_failure` hold data and retry on transient failures, so a brief MindOps hiccup does not mean lost telemetry. Pushing this responsibility out of every app keeps your services simple.

### Redaction and PII scrubbing

This is often the deciding factor. The `transform` and `redaction` processors let you strip secrets, tokens, emails, and other sensitive fields from spans and logs **before they leave your network** — enforced in one central place instead of trusting every service to get it right.

```yaml
processors:
  transform/redact:
    trace_statements:
      - context: span
        statements:
          - set(attributes["http.request.header.authorization"], "REDACTED")
          - delete_key(attributes, "user.email")
```

### Sampling and volume control

Drop noisy [health-check spans](/traces/drop-spans/) or apply [tail-based sampling](/traces/tail-sampling/) to keep errors and slow traces while shedding routine ones. Tune cost once in the Collector rather than reconfiguring every SDK.

### Fan-out

A single exporter list can send the same data to multiple destinations — MindOps plus an archive, or a second environment for migration — without touching application code.

### Decoupling apps from the backend

Apps target a stable, local Collector endpoint. You can upgrade, move, or replace the backend, change auth, or re-route signals, all without redeploying a single service.

## Direct vs through a Collector

| Concern | Direct to backend | Through a Collector |
|---------|-------------------|---------------------|
| Batching | Per-app, limited | Centralized, efficient |
| Retries/buffering | Each SDK on its own | Handled once |
| PII redaction | Trust every service | Enforced centrally |
| Sampling | Scattered SDK config | One policy |
| Multiple destinations | Re-instrument apps | Add an exporter |
| Backend changes | Redeploy everything | Reconfigure Collector |

:::tip
Treat the Collector as infrastructure, like a load balancer for telemetry. Apps should know one endpoint — the Collector — and nothing about MindOps internals.
:::

:::note
For self-hosted MindOps, the Collector exports to the OTLP endpoint with no ingestion key. See the [Collector overview](/collection-agents/overview/) for agent vs gateway patterns and the [introduction](/introduction/) for the platform basics.
:::
