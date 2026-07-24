---
title: Monitoring ECS with MindOps
description: Collect task metrics, traces, and logs from Amazon ECS (EC2 and Fargate) by running the OpenTelemetry Collector as a sidecar or daemon.
---

On Amazon ECS the Collector reads per-task CPU, memory, network, and storage from the
**ECS task metadata endpoint** using the `awsecscontainermetrics` receiver. How you
deploy it depends on the launch type.

## Deployment patterns

| Launch type | Pattern | Notes |
|-------------|---------|-------|
| EC2 | Daemon service (one Collector per host) | Watches all tasks on the node |
| EC2 | Sidecar container in the task | Isolated per task |
| Fargate | Sidecar container in the task | Required — no host access on Fargate |

Fargate gives you no node to run a daemon on, so the Collector ships **inside the task
definition** as an extra container alongside your app.

## Task metrics

```yaml
receivers:
  awsecscontainermetrics:
    collection_interval: 20s
processors:
  filter:
    metrics:
      include:
        match_type: regexp
        metric_names:
          - ecs\.task\..*
          - ecs\.container\..*
exporters:
  otlp:
    endpoint: mindops-collector:4317
    tls:
      insecure: true
service:
  pipelines:
    metrics:
      receivers: [awsecscontainermetrics]
      processors: [filter]
      exporters: [otlp]
```

The receiver reads from `${ECS_CONTAINER_METADATA_URI_V4}`, which ECS injects into every
container automatically — no IAM permissions required for task-level stats.

## Traces and logs

Run the **same Collector** with OTLP receivers so your instrumented app can send traces
and logs to `localhost:4317` (sidecar) or the daemon's address:

```yaml
receivers:
  otlp:
    protocols:
      grpc:
        endpoint: 0.0.0.0:4317
      http:
        endpoint: 0.0.0.0:4318
```

For container stdout, attach the ECS `awsfirelens` or `awslogs` driver and forward to the
Collector, or have the Collector read CloudWatch Logs with the `awscloudwatch` receiver.

:::tip[Sidecar resource sizing]
Give the Collector sidecar a small reservation (for example 0.1 vCPU / 128 MB) and add
the `resourcedetection` processor with the `ecs` detector so every signal is tagged with
the cluster, service, and task ARN.
:::

:::note
Self-hosted MindOps needs no ingestion key — the exporter points straight at OTLP. View
services in the UI at `http://localhost:8080`.
:::

For node-level Kubernetes instead of ECS, see [EKS](/mindops-docs/aws-monitoring/eks/).
