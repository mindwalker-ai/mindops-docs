---
title: Kubernetes on GCP (GKE)
description: GKE-specific guidance for running MindOps, covering balanced persistent-disk storage classes, regional clusters, and ingress.
---

This guide covers the Google Cloud specifics for installing MindOps on GKE. Use the general [Kubernetes guide](/install/kubernetes/) for the Helm workflow; the notes here adapt it to GKE.

## Prerequisites

- A GKE cluster (v1.26+), Standard or Autopilot.
- The GCE Persistent Disk CSI driver (enabled by default on GKE).
- `gcloud`, `kubectl`, and `helm` configured against the cluster.

## Storage: balanced persistent disks

Back ClickHouse and Postgres with SSD-backed balanced persistent disks. Define a `StorageClass`:

```yaml
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: mindops-balanced
provisioner: pd.csi.storage.gke.io
parameters:
  type: pd-balanced
volumeBindingMode: WaitForFirstConsumer
allowVolumeExpansion: true
```

Reference it in your Helm values:

```yaml
clickhouse:
  persistence:
    storageClass: mindops-balanced
    size: 200Gi
```

:::tip
Use `pd-ssd` instead of `pd-balanced` when ClickHouse query latency matters more than cost. `WaitForFirstConsumer` keeps the disk in the same zone as the pod.
:::

## Regional clusters and zonal storage

A **regional** GKE cluster spreads nodes across zones for control-plane and node resilience. Standard persistent disks are **zonal**, so a stateful pod is tied to the zone of its disk.

| Goal | Approach |
| --- | --- |
| Highest availability for stateless tiers | Regional cluster; collector, query service, and UI spread across zones. |
| Stable storage for ClickHouse/Postgres | Pin stateful pods to one zone, or use a regional persistent disk. |

```yaml
clickhouse:
  nodeSelector:
    topology.kubernetes.io/zone: us-central1-a
```

:::caution
Do not let a single-replica ClickHouse pod float across zones. If it reschedules to a zone without its disk, it cannot start. Pin the zone or use regional disks.
:::

## Exposing the UI

### Internal HTTP(S) load balancer via ingress

```yaml
frontend:
  ingress:
    enabled: true
    annotations:
      kubernetes.io/ingress.class: gce-internal
      kubernetes.io/ingress.regional-static-ip-name: mindops-ip
```

### Internal TCP/UDP load balancer

```yaml
frontend:
  service:
    type: LoadBalancer
    annotations:
      networking.gke.io/load-balancer-type: Internal
```

## Sending telemetry

In-cluster apps target the collector service directly. Keep the OTLP ports (`4317`/`4318`) internal to the VPC; self-hosted MindOps uses **no ingestion key**, so the endpoints must not be public.

```bash
export OTEL_EXPORTER_OTLP_ENDPOINT=http://mindops-otel-collector.mindops:4317
export OTEL_SERVICE_NAME=checkout-service
```

For teardown, follow the [uninstall guide](/install/uninstall/) and confirm persistent disks and load balancers are deleted to stop GCP charges.
