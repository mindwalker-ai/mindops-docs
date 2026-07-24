---
title: Collector on Kubernetes
description: Deploy the OpenTelemetry Collector on Kubernetes as a DaemonSet node agent plus a Deployment gateway, install with Helm, and forward telemetry to MindOps.
---

On Kubernetes the recommended shape is a two-tier Collector: a **DaemonSet** node agent that collects local signals on every node, and a **Deployment** gateway that aggregates them and exports to MindOps.

## The two tiers

| Tier | Workload | Responsibility |
|------|----------|----------------|
| Node agent | DaemonSet (one pod per node) | Receive app OTLP, scrape kubelet/host metrics, tail container logs, attach `k8s.*` metadata |
| Gateway | Deployment (scaled replicas) | Aggregate from agents, apply tail sampling/redaction, single egress to MindOps |

```text
node A: [pod][pod] ─▶ [agent]─┐
node B: [pod][pod] ─▶ [agent]─┼─▶ [gateway xN] ─▶ MindOps :4317
node C: [pod][pod] ─▶ [agent]─┘
```

## Install with Helm

The OpenTelemetry Collector Helm chart can deploy either mode via the `mode` value. Install the agent as a DaemonSet:

```bash
helm repo add open-telemetry https://open-telemetry.github.io/opentelemetry-helm-charts

helm install otel-agent open-telemetry/opentelemetry-collector \
  --set mode=daemonset \
  -f agent-values.yaml
```

Then the gateway as a Deployment:

```bash
helm install otel-gateway open-telemetry/opentelemetry-collector \
  --set mode=deployment \
  --set replicaCount=3 \
  -f gateway-values.yaml
```

## Agent config (forwards to the gateway)

```yaml
config:
  receivers:
    otlp:
      protocols:
        grpc: { endpoint: 0.0.0.0:4317 }
        http: { endpoint: 0.0.0.0:4318 }
  processors:
    k8sattributes: {}
    batch: {}
  exporters:
    otlp:
      endpoint: otel-gateway:4317
      tls: { insecure: true }
  service:
    pipelines:
      traces:  { receivers: [otlp], processors: [k8sattributes, batch], exporters: [otlp] }
      metrics: { receivers: [otlp], processors: [k8sattributes, batch], exporters: [otlp] }
      logs:    { receivers: [otlp], processors: [k8sattributes, batch], exporters: [otlp] }
```

The `k8sattributes` processor enriches every record with pod, namespace, and node metadata so MindOps can group telemetry by workload.

## Gateway config (exports to MindOps)

```yaml
config:
  exporters:
    otlp/mindops:
      endpoint: mindops-otel-collector.mindops.svc.cluster.local:4317
      tls: { insecure: true }
  service:
    pipelines:
      traces:  { receivers: [otlp], processors: [batch], exporters: [otlp/mindops] }
      metrics: { receivers: [otlp], processors: [batch], exporters: [otlp/mindops] }
      logs:    { receivers: [otlp], processors: [batch], exporters: [otlp/mindops] }
```

:::tip
Point your application SDKs at the node agent using the host IP and port `4317`, exposed via the Kubernetes downward API as `OTEL_EXPORTER_OTLP_ENDPOINT`. Apps talk to the agent on their own node — never directly to the gateway.
:::

:::note
A self-hosted MindOps endpoint needs no ingestion key. `tls.insecure: true` is fine for in-cluster traffic; enable TLS when the gateway exports across cluster or network boundaries.
:::

See [Collector Configuration](/collection-agents/collector-configuration/) for the full anatomy of these pipelines.
