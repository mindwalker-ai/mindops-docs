---
title: Monitoring Amazon RDS with MindOps
description: Pull RDS metrics into MindOps with the CloudWatch receiver and Enhanced Monitoring for deeper OS-level visibility.
---

RDS is a managed service, so you cannot install a Collector on the database host. Instead
RDS publishes metrics to **CloudWatch**, and the OpenTelemetry Collector pulls them into
MindOps with the `awscloudwatchmetrics` receiver.

## Standard CloudWatch metrics

The `AWS/RDS` namespace reports the headline health metrics at one-minute resolution.
Scrape the ones that matter for capacity and latency:

```yaml
receivers:
  awscloudwatchmetrics:
    region: us-east-1
    polling_interval: 5m
    metrics:
      named:
        - namespace: AWS/RDS
          metric_name: CPUUtilization
          period: 300s
          aws_aggregation: Average
          dimensions:
            - name: DBInstanceIdentifier
              value: orders-prod
        - namespace: AWS/RDS
          metric_name: DatabaseConnections
          period: 300s
          aws_aggregation: Maximum
        - namespace: AWS/RDS
          metric_name: FreeableMemory
          period: 300s
          aws_aggregation: Average
exporters:
  otlp:
    endpoint: mindops-collector:4317
    tls:
      insecure: true
service:
  pipelines:
    metrics:
      receivers: [awscloudwatchmetrics]
      exporters: [otlp]
```

## Key metrics to watch

| Metric | Tells you |
|--------|-----------|
| `CPUUtilization` | Compute pressure on the instance |
| `DatabaseConnections` | How close you are to `max_connections` |
| `FreeableMemory` | Memory headroom before swapping |
| `FreeStorageSpace` | Disk runway before the volume fills |
| `ReadLatency` / `WriteLatency` | Storage-layer slowness |
| `ReplicaLag` | Read-replica staleness |

## Enhanced Monitoring

Standard CloudWatch metrics come from the hypervisor. **Enhanced Monitoring** adds
OS-level detail — per-process CPU, RDS-managed memory, and disk I/O — delivered to a
CloudWatch Logs group (`RDSOSMetrics`) as JSON, at intervals as low as one second. Pull
that group with the `awscloudwatch` logs receiver and parse it in a pipeline for
fine-grained dashboards.

```yaml
receivers:
  awscloudwatch:
    region: us-east-1
    logs:
      groups:
        named:
          /aws/rds/instance/orders-prod/RDSOSMetrics: {}
```

## IAM permissions

The Collector's role needs `cloudwatch:GetMetricData`, `cloudwatch:ListMetrics`, and for
Enhanced Monitoring `logs:GetLogEvents` plus `logs:FilterLogEvents`.

:::tip
Correlate RDS latency with your application by tracing database calls from the app side
with an OpenTelemetry SDK. A slow `WriteLatency` spike then lines up with the exact slow
spans in your traces.
:::

:::note
Self-hosted MindOps requires no ingestion key. Build a `FreeStorageSpace` alert so a
full volume never takes the database offline silently.
:::

See the [AWS overview](/mindops-docs/aws-monitoring/overview/) for the broader CloudWatch strategy.
