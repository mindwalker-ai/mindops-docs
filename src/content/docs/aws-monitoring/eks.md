---
title: Monitoring EKS with MindOps
description: Deploy the OpenTelemetry Collector as a DaemonSet on Amazon EKS to gather node, pod, and cluster metrics plus traces and logs for MindOps.
---

On Amazon EKS the standard pattern is a Collector **DaemonSet** — one pod per node —
that scrapes the kubelet for pod and container metrics, plus a small **Deployment** that
collects cluster-level state. Both export to MindOps over OTLP.

## DaemonSet: node and pod metrics

```yaml
receivers:
  kubeletstats:
    collection_interval: 30s
    auth_type: serviceAccount
    endpoint: ${env:K8S_NODE_NAME}:10250
    insecure_skip_verify: true
  hostmetrics:
    root_path: /hostfs
    scrapers:
      cpu: {}
      memory: {}
      filesystem: {}
processors:
  k8sattributes:
    auth_type: serviceAccount
    extract:
      metadata: [k8s.pod.name, k8s.namespace.name, k8s.deployment.name]
exporters:
  otlp:
    endpoint: mindops-collector:4317
    tls:
      insecure: true
service:
  pipelines:
    metrics:
      receivers: [kubeletstats, hostmetrics]
      processors: [k8sattributes]
      exporters: [otlp]
```

The `k8sattributes` processor enriches every span, metric, and log line with pod,
namespace, and workload names so you can group telemetry by deployment in the UI.

## Deployment: cluster metrics

Run a single-replica Collector with the `k8s_cluster` receiver to capture node
conditions, deployment replicas, and pod phase counts. Pair it with the
`k8sobjects` receiver if you also want Kubernetes events as logs.

## Traces and logs

Expose OTLP receivers (`:4317`/`:4318`) on the DaemonSet so instrumented pods send to the
node-local Collector via the Kubernetes downward API host IP. Add a `filelog` receiver
reading `/var/log/pods/**/*.log` for container stdout.

## EC2 nodes vs Fargate

| Concern | EC2 node groups | Fargate |
|---------|-----------------|---------|
| DaemonSet | Supported | Not supported (no host) |
| Host metrics | `hostmetrics` works | Unavailable |
| Collector placement | DaemonSet per node | **Sidecar** in the pod |
| Pod metrics | `kubeletstats` | Limited; use sidecar + SDK |

:::caution
EKS Fargate pods cannot host a DaemonSet because there is no shared node. Add a Collector
**sidecar container** to each pod spec and have the app send to `localhost:4317`.
:::

:::note
Self-hosted MindOps requires no ingestion key. Apply RBAC granting the Collector's
service account read access to nodes, pods, and the kubelet stats endpoint.
:::

See the [AWS overview](/mindops-docs/aws-monitoring/overview/) to combine this with CloudWatch pulls
for managed services in the same cluster.
