---
title: Monitoring AWS with MindOps
description: Approaches for collecting metrics, traces, and logs from AWS services into MindOps using the OpenTelemetry Collector and CloudWatch.
---

AWS exposes telemetry in several shapes — host metrics on EC2, task metrics on ECS,
CloudWatch namespaces for managed services, and traces from your own code. MindOps
ingests all of it over OTLP, so the strategy is always the same: get the data into an
**OpenTelemetry Collector** and export it to MindOps.

## Two collection styles

### Run the Collector close to the workload

For compute you control (EC2, ECS, EKS), run the Collector next to the workload and use
receivers that read locally: `hostmetrics` for host stats, `awsecscontainermetrics` for
ECS tasks, `kubeletstats` for Kubernetes. This gives the freshest, highest-resolution
data and keeps egress inside your network.

### Pull from CloudWatch

For managed services you cannot run an agent on (RDS, SQS, ELB, DynamoDB, Lambda),
let AWS publish to CloudWatch and have the Collector pull it back out:

- `awscloudwatchmetrics` — scrape metric namespaces such as `AWS/RDS` or `AWS/SQS`
- `awscloudwatch` — pull CloudWatch Logs groups

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

## Which AWS receiver for what

| AWS surface | Receiver | Signal |
|-------------|----------|--------|
| EC2 host | `hostmetrics` | metrics, logs |
| ECS task | `awsecscontainermetrics` | metrics |
| EKS pod/node | `kubeletstats`, `k8s_cluster` | metrics |
| Managed service | `awscloudwatchmetrics` | metrics |
| CloudWatch Logs | `awscloudwatch` | logs |
| X-Ray segments | `awsxray` | traces |

## One-click vs manual

A managed cloud integration can wire IAM roles and Collector config for you in a few
clicks. On a self-hosted instance you assemble the same pieces by hand — an IAM policy
granting `cloudwatch:GetMetricData` and `logs:*`, plus the Collector config above. Both
land in the same place.

:::note
Self-hosted MindOps needs **no ingestion key**. Point the Collector's exporter at OTLP
`:4317` (gRPC) or `:4318` (HTTP). Then open the UI at `http://localhost:8080`.
:::

Per-service guides cover the details: [EC2](/aws-monitoring/ec2/),
[ECS](/aws-monitoring/ecs/), [EKS](/aws-monitoring/eks/),
[Lambda](/aws-monitoring/lambda/), and [RDS](/aws-monitoring/rds/).
