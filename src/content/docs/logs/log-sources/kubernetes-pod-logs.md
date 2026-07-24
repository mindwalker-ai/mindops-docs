---
title: Collect Kubernetes Pod Logs in MindOps
description: Deploy an OpenTelemetry Collector DaemonSet with the filelog receiver to collect Kubernetes pod logs and forward them to MindOps.
---

In Kubernetes, the kubelet writes each pod's container output to files on every node under `/var/log/pods`. Running the OpenTelemetry Collector as a DaemonSet lets one Collector per node tail those files and forward the logs to MindOps.

## Collector configuration (ConfigMap)

```yaml
receivers:
  filelog:
    include:
      - /var/log/pods/*/*/*.log
    include_file_path: true
    operators:
      - type: container
        add_metadata_from_filepath: true

processors:
  k8sattributes: {}
  batch: {}

exporters:
  otlp/mindops:
    # Self-hosted MindOps needs NO ingestion key.
    endpoint: signoz-ingester:4317
    tls:
      insecure: true

service:
  pipelines:
    logs:
      receivers: [filelog]
      processors: [k8sattributes, batch]
      exporters: [otlp/mindops]
```

The `container` operator parses both CRI-O/containerd and Docker log formats, while `k8sattributes` enriches each record with pod, namespace, and deployment metadata.

## DaemonSet essentials

Mount the host log paths into every Collector pod so the `filelog` receiver can read them:

```yaml
volumes:
  - name: varlogpods
    hostPath:
      path: /var/log/pods
  - name: varlibdockercontainers
    hostPath:
      path: /var/lib/docker/containers
```

Mount both `volumeMounts` read-only inside the container spec.

## Where the endpoint goes

The `otlp` exporter `endpoint` is the MindOps OTLP gRPC receiver.

- MindOps running in the cluster: use its Service DNS name, e.g. `signoz-ingester:4317` (adjust namespace if needed, such as `signoz-ingester.platform.svc.cluster.local:4317`).
- MindOps outside the cluster: point at its reachable host and port `4317`.

:::tip
Use the official OpenTelemetry Helm chart's logs preset to generate this DaemonSet, then override the exporter to target MindOps.
:::

## Verify in MindOps

Open `http://localhost:8080`, go to **Logs**, and filter on a `k8s.namespace.name` or `k8s.pod.name` attribute. Logs from running pods should appear with their Kubernetes metadata attached.
