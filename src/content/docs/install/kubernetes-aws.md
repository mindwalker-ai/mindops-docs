---
title: Kubernetes on AWS (EKS)
description: EKS-specific guidance for running MindOps, covering gp3 storage classes, LoadBalancer and ingress access, and node sizing.
---

This guide covers the AWS-specific pieces of a MindOps install on Amazon EKS. Follow the general [Kubernetes guide](/mindops-docs/install/kubernetes/) for the Helm workflow; the notes below adapt it to EKS.

## Prerequisites

- An EKS cluster (v1.26+) with managed node groups.
- The AWS EBS CSI driver installed (for persistent volumes).
- The AWS Load Balancer Controller installed (for ingress).
- `kubectl` and `helm` configured against the cluster.

## Storage: use gp3

Back ClickHouse and Postgres with gp3 EBS volumes. gp3 decouples IOPS and throughput from capacity, which suits ClickHouse's write-heavy workload. Define a `StorageClass`:

```yaml
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: mindops-gp3
provisioner: ebs.csi.aws.com
parameters:
  type: gp3
  iops: "6000"
  throughput: "250"
volumeBindingMode: WaitForFirstConsumer
allowVolumeExpansion: true
```

Reference it in your Helm values:

```yaml
clickhouse:
  persistence:
    storageClass: mindops-gp3
    size: 200Gi
```

:::tip
Set `volumeBindingMode: WaitForFirstConsumer` so EBS volumes are created in the same Availability Zone as the pod. This avoids cross-AZ scheduling failures for stateful pods.
:::

## Node sizing

ClickHouse is the resource driver. For a moderate production workload:

| Node group | Instance family | Purpose |
| --- | --- | --- |
| Storage tier | `m6i.xlarge` or larger | ClickHouse and Postgres pods. |
| General tier | `m6i.large` | Collector, query service, UI. |

Use a dedicated node group with a taint for stateful pods so noisy neighbors do not contend with ClickHouse:

```yaml
clickhouse:
  tolerations:
    - key: dedicated
      value: storage
      effect: NoSchedule
  nodeSelector:
    workload: storage
```

## Exposing the UI

### Internal Network Load Balancer

```yaml
frontend:
  service:
    type: LoadBalancer
    annotations:
      service.beta.kubernetes.io/aws-load-balancer-type: nlb
      service.beta.kubernetes.io/aws-load-balancer-scheme: internal
```

### Application Load Balancer via ingress

```yaml
frontend:
  ingress:
    enabled: true
    className: alb
    annotations:
      alb.ingress.kubernetes.io/scheme: internal
      alb.ingress.kubernetes.io/target-type: ip
```

:::caution
Keep the OTLP endpoints (`4317`/`4318`) on an **internal** load balancer or inside the VPC. They have no ingestion key on self-hosted MindOps, so they must never be exposed to the public internet.
:::

## Sending telemetry

In-cluster apps use the collector service name. For workloads outside the cluster but inside the VPC, use the internal load balancer DNS name with `OTEL_EXPORTER_OTLP_ENDPOINT`. No API key is needed.

For teardown, follow the [uninstall guide](/mindops-docs/install/uninstall/) and confirm EBS volumes and load balancers are removed to stop AWS charges.
