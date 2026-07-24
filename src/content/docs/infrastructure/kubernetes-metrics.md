---
title: Kubernetes Metrics
description: Collect cluster, node, and pod metrics on Kubernetes using the OpenTelemetry Collector kubeletstats and k8s_cluster receivers, deployed as a DaemonSet, and the dashboards to view them.
---

Running on Kubernetes means watching three layers at once: the cluster as a whole, each node, and every pod. The OpenTelemetry Collector covers all three with two receivers - `kubeletstats` for node and pod resource usage, and `k8s_cluster` for cluster-level object state - and ships the result to MindOps.

## The two receivers

| Receiver | Scope | Sample metrics |
|----------|-------|----------------|
| `kubeletstats` | Node + pod + container | CPU, memory, filesystem, network per pod |
| `k8s_cluster` | Cluster objects | Pod phase, deployment replicas, node conditions |

`kubeletstats` talks to each node's kubelet, so it belongs on every node. `k8s_cluster` talks to the API server about whole-cluster state, so it runs once.

## Deployment shape

Use two workloads:

- A **DaemonSet** running the Collector with the `kubeletstats` receiver, so one instance scrapes the local kubelet on each node.
- A single-replica **Deployment** running the Collector with the `k8s_cluster` receiver for cluster object metrics.

### DaemonSet receiver config

```yaml
receivers:
  kubeletstats:
    collection_interval: 30s
    auth_type: serviceAccount
    endpoint: "https://${env:K8S_NODE_NAME}:10250"
    insecure_skip_verify: true
    metric_groups: [node, pod, container, volume]

processors:
  k8sattributes:        # enrich with pod, namespace, deployment labels
    auth_type: serviceAccount

exporters:
  otlp:
    endpoint: mindops-otel-collector:4317
    tls:
      insecure: true

service:
  pipelines:
    metrics:
      receivers: [kubeletstats]
      processors: [k8sattributes]
      exporters: [otlp]
```

The `K8S_NODE_NAME` env var comes from the downward API so each DaemonSet pod targets its own node.

### Cluster receiver config

```yaml
receivers:
  k8s_cluster:
    collection_interval: 30s
    auth_type: serviceAccount

service:
  pipelines:
    metrics:
      receivers: [k8s_cluster]
      exporters: [otlp]
```

:::note
Both Collectors need an RBAC ServiceAccount with permission to read nodes, pods, and the metrics endpoints. Bind a ClusterRole that grants `get`/`list`/`watch` on those resources.
:::

## Enrich and route

The `k8sattributes` processor attaches pod name, namespace, workload, and node labels to every metric. This is what lets you slice a dashboard by namespace or deployment later, so keep it in the pipeline.

:::tip
Point every node Collector at a single gateway Collector (a Deployment) rather than at MindOps directly. The gateway batches and applies consistent processing before export.
:::

## Dashboards to use

In the MindOps UI at `http://localhost:8080`, the Infrastructure section provides ready-made views:

- **Cluster overview** - node count, pod phase distribution, namespace resource totals.
- **Nodes** - per-node CPU, memory pressure, and disk usage.
- **Pods** - per-pod CPU and memory against requests and limits.

Use the cluster view for capacity planning, the node view to spot a hot machine, and the pod view to find the workload responsible.

## Tips

- Keep `collection_interval` at 30s to balance freshness and volume.
- Always run `k8s_cluster` with a single replica to avoid duplicate series.
- Drop high-cardinality container metrics you never query.

For plain virtual machines, see [Host metrics](/infrastructure/hostmetrics/).
