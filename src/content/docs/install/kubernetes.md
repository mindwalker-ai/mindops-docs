---
title: Kubernetes
description: Install MindOps on any Kubernetes cluster with Helm, including namespaces, values overrides, and UI access via port-forward or ingress.
---

Kubernetes is the recommended target for production MindOps. Helm packages every component, persistent volumes back ClickHouse and Postgres, and the control plane handles rolling updates and self-healing.

## Prerequisites

- A Kubernetes cluster (v1.26+) with `kubectl` configured.
- Helm 3 installed.
- A default `StorageClass` that can provision persistent volumes.
- Enough headroom for ClickHouse: plan at least 4 GB RAM and durable disk.

## 1. Add the Helm repository

```bash
helm repo add mindops https://charts.mindops.example.com
helm repo update
```

## 2. Create a namespace

Keep MindOps isolated in its own namespace:

```bash
kubectl create namespace mindops
```

## 3. Install the chart

A minimal install uses chart defaults:

```bash
helm install mindops mindops/mindops --namespace mindops
```

For real environments, supply a `values.yaml` override:

```yaml
# values.yaml
clickhouse:
  persistence:
    size: 100Gi
    storageClass: standard
  resources:
    requests:
      cpu: "2"
      memory: 8Gi
otelCollector:
  replicaCount: 2
frontend:
  service:
    type: ClusterIP
```

```bash
helm install mindops mindops/mindops \
  --namespace mindops \
  --values values.yaml
```

:::tip
Pin a chart version with `--version` so upgrades are deliberate. Review changes with `helm diff upgrade` before applying them to production.
:::

## 4. Verify the rollout

```bash
kubectl get pods -n mindops
kubectl rollout status deploy/mindops-frontend -n mindops
```

Wait for the ClickHouse and Postgres pods to report `Running` and `Ready`.

## 5. Access the UI

### Quick check with port-forward

```bash
kubectl port-forward -n mindops svc/mindops-frontend 8080:8080
```

Then open `http://localhost:8080` and create the first admin account.

### Production access with ingress

For durable access, enable an ingress in your values:

```yaml
frontend:
  ingress:
    enabled: true
    className: nginx
    hosts:
      - host: mindops.internal.example.com
        paths:
          - path: /
            pathType: Prefix
```

## 6. Send telemetry

Inside the cluster, point apps at the collector service. **No ingestion key** is required:

```bash
export OTEL_EXPORTER_OTLP_ENDPOINT=http://mindops-otel-collector.mindops:4317
export OTEL_SERVICE_NAME=checkout-service
```

## Upgrades and uninstall

```bash
helm upgrade mindops mindops/mindops -n mindops -f values.yaml
helm uninstall mindops -n mindops
```

:::caution
`helm uninstall` may leave PersistentVolumeClaims behind to protect data. Delete them explicitly to reclaim storage. See the [uninstall guide](/mindops-docs/install/uninstall/).
:::

For managed clusters, continue with [AWS EKS](/mindops-docs/install/kubernetes-aws/) or [GCP GKE](/mindops-docs/install/kubernetes-gcp/).
