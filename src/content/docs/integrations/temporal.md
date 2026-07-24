---
title: Monitoring Temporal with MindOps
description: Observe Temporal workflows in MindOps — scrape server/cloud Prometheus metrics and add OpenTelemetry tracing from Go and TypeScript SDKs.
---

Temporal is a durable workflow engine, and it surfaces health on two levels: the
**platform** (server or Temporal Cloud) and your **workers** (the code running workflows
and activities). MindOps covers both — platform metrics over Prometheus scraping and
worker behavior over OpenTelemetry tracing.

## Platform metrics

Temporal exposes a Prometheus-format metrics endpoint. Scrape it with the Collector's
`prometheus` receiver and forward to MindOps.

```yaml
receivers:
  prometheus:
    config:
      scrape_configs:
        - job_name: temporal
          scrape_interval: 30s
          static_configs:
            - targets: [temporal-server:9090]
exporters:
  otlp:
    endpoint: mindops-collector:4317
    tls:
      insecure: true
service:
  pipelines:
    metrics:
      receivers: [prometheus]
      exporters: [otlp]
```

For **Temporal Cloud**, enable the metrics endpoint in account settings, then scrape it
with the provided client certificate using the receiver's `tls` block.

Watch `temporal_workflow_completed`, `temporal_workflow_failed`,
`temporal_schedule_to_start_latency` (a task-queue backlog signal), and
`temporal_sticky_cache_hit`.

## Worker and SDK tracing

The Temporal SDKs ship OpenTelemetry interceptors so each workflow and activity becomes a
span, correlated end to end across the workflow's lifetime.

```typescript
// TypeScript worker
import { OpenTelemetryActivityInboundInterceptor } from '@temporalio/interceptors-opentelemetry';

const worker = await Worker.create({
  interceptors: {
    activityInbound: [(ctx) => new OpenTelemetryActivityInboundInterceptor(ctx)],
  },
  // ...task queue, workflows
});
```

In Go, register the `opentelemetry` interceptor on the client and worker options; both
emit spans for `StartWorkflow`, `ExecuteActivity`, and signals.

```go
// Go client
tracingInterceptor, _ := opentelemetry.NewTracingInterceptor(opentelemetry.TracerOptions{})
c, _ := client.Dial(client.Options{
    Interceptors: []interceptor.ClientInterceptor{tracingInterceptor},
})
```

Point the SDK's OTLP exporter at MindOps via the standard environment variables.

## What you get

| View | Source | Answers |
|------|--------|---------|
| Workflow throughput & failures | platform metrics | Is the cluster healthy? |
| Task-queue backlog | `schedule_to_start_latency` | Do I need more workers? |
| Per-workflow timeline | SDK traces | Which activity is slow or retrying? |

:::tip
Schedule-to-start latency rising while workers are idle usually means too few worker
slots or a poll bottleneck — chart it next to your worker count.
:::

:::note
Self-hosted MindOps needs no ingestion key. Combine the metrics dashboard with traces so
a failure spike links straight to the workflow execution that caused it.
:::

See [Integrations Overview](/mindops-docs/integrations/overview/) for the general Collector pattern.
