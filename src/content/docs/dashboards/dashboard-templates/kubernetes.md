---
title: Kubernetes Dashboard
description: Cluster, node, and pod metrics for Kubernetes using the OpenTelemetry kubeletstats and k8s_cluster receivers in MindOps.
---

# Kubernetes Dashboard

This template surfaces the health of a Kubernetes cluster across three levels:
the cluster as a whole, individual nodes, and the pods and containers running on
them. It is fed by the OpenTelemetry Collector's Kubernetes receivers.

## What it shows

- Cluster overview: node count, pod phases, and deployment readiness
- Node CPU and memory utilization against allocatable capacity
- Pod-level CPU, memory, and restart counts
- Container resource usage versus requests and limits
- Pending and failed pods, plus CrashLoopBackOff signals
- Network and filesystem usage per pod

## Prerequisites / data source

Deploy the OpenTelemetry Collector to the cluster (typically a DaemonSet for node
and pod stats plus a Deployment for cluster-wide state).

| Receiver | Provides |
|----------|----------|
| `kubeletstats` | Per-node, per-pod, per-container resource usage |
| `k8s_cluster` | Cluster object state: pods, nodes, deployments |
| `k8s_events` | Optional event stream for context |

```yaml
receivers:
  kubeletstats:
    collection_interval: 30s
    auth_type: serviceAccount
    endpoint: ${env:K8S_NODE_NAME}:10250
  k8s_cluster:
    collection_interval: 30s
```

The Collector's service account needs RBAC permission to read nodes, pods, and
the kubelet stats endpoint.

:::tip
Use the Downward API to inject `K8S_NODE_NAME` into each DaemonSet pod so the
kubeletstats receiver targets the correct node.
:::

## Import

1. In MindOps, go to **Dashboards** → **New** → **Import JSON**.
2. Upload the Kubernetes template JSON.
3. Filter by `k8s.namespace.name`, `k8s.node.name`, or `k8s.pod.name`.

:::note
If cluster-level panels are empty, confirm the `k8s_cluster` receiver is running
and its RBAC role can list cluster objects.
:::
