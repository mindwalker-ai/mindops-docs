---
title: Integrations Overview
description: What MindOps integrations are — Collector receivers plus ready-made dashboards for common databases, queues, web servers, and cloud services.
---

An **integration** is a packaged way to monitor a specific technology with MindOps. Each
one combines two things:

1. A **Collector receiver** that knows how to read that technology's metrics, logs, or
   traces.
2. A set of **dashboards and alert ideas** built around the metrics that technology
   exposes, so you are not staring at a blank canvas.

Because everything flows through the OpenTelemetry Collector, integrations are just
configuration — there is no proprietary agent to install per technology.

## Categories

| Category | Examples | Typical receiver |
|----------|----------|------------------|
| Databases | MySQL, PostgreSQL, MongoDB, Redis | `mysql`, `postgresql`, `mongodb`, `redis` |
| Message queues | Kafka, RabbitMQ, AWS SQS | `kafkametrics`, `rabbitmq`, `awscloudwatchmetrics` |
| Web servers | Nginx, Apache, HAProxy | `nginx`, `apache`, `haproxy` |
| Cloud services | RDS, SQS, Lambda, ELB | `awscloudwatchmetrics` |
| Runtimes & workflow | JVM, Temporal | `jmx`, `prometheus` |

## How to add an integration

The shape is always the same: enable a receiver, point it at the target, and route it to
an OTLP exporter.

```yaml
receivers:
  redis:
    endpoint: cache:6379
    collection_interval: 30s
exporters:
  otlp:
    endpoint: mindops-collector:4317
    tls:
      insecure: true
service:
  pipelines:
    metrics:
      receivers: [redis]
      exporters: [otlp]
```

1. **Pick the receiver** for your technology from the table above.
2. **Grant access** — a read-only user, a metrics endpoint, or an IAM policy.
3. **Add the receiver** to your Collector config and include it in a pipeline.
4. **Build the dashboard** in MindOps from the metrics that now arrive.

## Where to go next

- [Databases](/integrations/databases/) — MySQL, PostgreSQL, MongoDB, Redis
- [Messaging queues](/integrations/messaging-queues/) — Kafka, RabbitMQ, SQS
- [Temporal](/integrations/temporal/) — workflow engine metrics and SDK tracing

:::note
Self-hosted MindOps needs no ingestion key. Integrations reuse the same OTLP endpoints
(`:4317` gRPC, `:4318` HTTP) as the rest of your telemetry, so they land next to your
application traces and logs.
:::

:::tip
Run one Collector per host or cluster and add receivers to it as you adopt more
technologies, rather than spinning up a separate Collector for each integration.
:::
