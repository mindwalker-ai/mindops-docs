---
title: Collector Overview
description: What the OpenTelemetry Collector is, the agent and gateway deployment patterns, and why every signal should flow through it before reaching MindOps.
---

The OpenTelemetry Collector is a vendor-neutral pipeline that receives telemetry, processes it, and exports it onward. In a MindOps deployment it sits between your applications and the backend: your services speak OTLP to a Collector, the Collector does the cleanup and batching, and it forwards everything to MindOps.

## What the Collector does

A Collector is built from three stages joined into pipelines:

- **Receivers** accept incoming data (OTLP from your apps, host metrics, log files).
- **Processors** transform it in flight (batching, memory limiting, attribute scrubbing, sampling).
- **Exporters** send it to a destination — here, the MindOps OTLP endpoint.

Because it is signal-agnostic, one Collector can carry traces, metrics, and logs through parallel pipelines.

## Agent vs gateway patterns

There are two complementary ways to deploy the Collector. Most production setups use both together.

| Pattern | Runs as | Role |
|---------|---------|------|
| **Agent** | One per host/node (sidecar or DaemonSet) | Collects local signals close to the source — app OTLP, host metrics, local log files |
| **Gateway** | A central, scaled-out service | Aggregates from many agents, applies fleet-wide policy, exports to MindOps |

```text
[ app ] ─┐
[ app ] ─┼─▶ [ agent collector (per node) ] ─▶ [ gateway collector ] ─▶ MindOps
[ app ] ─┘
```

The **agent** keeps collection cheap and reliable by staying local. The **gateway** is where you centralize concerns that should be consistent across the fleet: tail sampling, redaction, and a single egress point to the backend.

:::note
Small deployments can run a single agent that exports straight to MindOps. Add a gateway when you need fleet-wide sampling, a single egress point, or want to shield apps from backend details.
:::

## Why route everything through the Collector

Pointing apps directly at the backend works, but a Collector buys you a lot:

- **Decoupling** — apps target a stable local endpoint; you can change or upgrade the backend without redeploying every service.
- **Batching and retries** — efficient, resilient export instead of per-request chattiness from each app.
- **Redaction and enrichment** — strip PII and add resource attributes (`k8s.pod.name`, `host.name`, environment) centrally.
- **Sampling and filtering** — control volume in one place rather than across dozens of SDK configs.

See [Why Use a Collector](/mindops-docs/collection-agents/why-use-collector/) for the full rationale, and [Collector Configuration](/mindops-docs/collection-agents/collector-configuration/) for a complete example. For MindOps itself, review the [introduction](/mindops-docs/introduction/).

## Connecting to MindOps

MindOps exposes OTLP over gRPC on `:4317` and HTTP on `:4318`. A self-hosted instance needs **no ingestion key** — your Collector exports straight to the OTLP endpoint with no auth header required.
