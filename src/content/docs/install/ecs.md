---
title: AWS ECS
description: Run MindOps components on AWS ECS using task definitions, a service per component, and EFS-backed persistent storage for ClickHouse.
---

If your organization standardizes on Amazon ECS, you can run MindOps there without adopting Kubernetes. Each component becomes an ECS service backed by a task definition, with EFS providing durable storage for stateful containers.

## Prerequisites

- An ECS cluster (Fargate or EC2 launch type).
- A VPC with private subnets for the components.
- An EFS file system for ClickHouse and Postgres data.
- IAM roles for task execution and EFS access.

## Component-to-service mapping

Run one ECS service per MindOps component so each scales and restarts independently.

| Service | Stateful? | Notes |
| --- | --- | --- |
| OpenTelemetry Collector | No | Receives OTLP on `4317`/`4318`; scale horizontally. |
| ClickHouse | Yes | One task, EFS-backed; the heavy component. |
| Postgres | Yes | One task, EFS-backed; metadata store. |
| Query service | No | Stateless; scale for read throughput. |
| Web UI | No | Stateless; front the service with a load balancer on `8080`. |

## Persistent storage with EFS

ClickHouse and Postgres need data that survives task restarts. Mount EFS into their task definitions:

```json
{
  "family": "mindops-clickhouse",
  "volumes": [
    {
      "name": "clickhouse-data",
      "efsVolumeConfiguration": {
        "fileSystemId": "fs-0abc123",
        "transitEncryption": "ENABLED",
        "rootDirectory": "/mindops/clickhouse"
      }
    }
  ],
  "containerDefinitions": [
    {
      "name": "clickhouse",
      "mountPoints": [
        { "sourceVolume": "clickhouse-data", "containerPath": "/var/lib/clickhouse" }
      ]
    }
  ]
}
```

:::caution
EFS is networked storage. ClickHouse is I/O intensive, so validate throughput under load and use EFS **Elastic** or **Provisioned** throughput. For very high ingest volumes, consider an EC2 launch type with EBS instead.
:::

## Service discovery

Components address each other by name, so enable ECS Service Connect (or Cloud Map). The collector and query service must resolve the ClickHouse and Postgres endpoints. Reference them by their service discovery DNS names in each task's environment.

## Exposing the UI and collector

Place an internal Application Load Balancer in front of the UI service:

```text
Listener :8080  →  target group  →  mindops-ui tasks
```

For OTLP, use a Network Load Balancer routing `4317` and `4318` to the collector service.

:::caution
Keep both load balancers **internal**. Self-hosted MindOps uses **no ingestion key**, so the OTLP endpoints must stay within your VPC.
:::

## Sending telemetry

Application tasks in the same VPC export OTLP to the collector's internal endpoint. No API key is required:

```bash
export OTEL_EXPORTER_OTLP_ENDPOINT=http://otlp.mindops.internal:4317
export OTEL_SERVICE_NAME=checkout-service
```

## Tear down

Delete the ECS services and task definitions, then remove the EFS file system once you are certain the data is no longer needed. See the [uninstall guide](/install/uninstall/) for full cleanup.
