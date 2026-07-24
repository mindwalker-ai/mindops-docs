---
title: Installation Overview
description: Compare the MindOps deployment options, review prerequisites, and decide which self-host path fits your environment.
---

MindOps runs entirely on your own infrastructure. This page helps you pick a deployment target and confirm prerequisites before you start.

## Deployment options

| Option | Best for | Effort | Scales to |
| --- | --- | --- | --- |
| [Docker Standalone](/mindops-docs/install/docker-standalone/) | Local trials, demos, small single-node setups | Lowest | One host |
| [Docker Swarm](/mindops-docs/install/docker-swarm/) | Small clusters wanting simple multi-node | Low | A few nodes |
| [Linux (native)](/mindops-docs/install/linux/) | VMs without a container runtime | Medium | One host |
| [Kubernetes](/mindops-docs/install/kubernetes/) | Production, HA, autoscaling | Higher | Many nodes |
| [AWS ECS](/mindops-docs/install/ecs/) | AWS shops standardized on ECS | Medium | Many tasks |

For cloud-managed Kubernetes, see the [AWS EKS](/mindops-docs/install/kubernetes-aws/) and [GCP GKE](/mindops-docs/install/kubernetes-gcp/) guides.

## Which should I pick?

- **Just trying MindOps?** Start with Docker Standalone. It runs the whole stack with one command.
- **Running production workloads?** Use Kubernetes for rolling updates, self-healing, and horizontal scaling.
- **Already on AWS ECS or Docker Swarm?** Use the matching guide to fit your existing orchestration.
- **No container runtime allowed?** Use the native Linux install.

:::tip
You can begin on Docker Standalone and migrate later. Because telemetry lives in ClickHouse and apps emit standard OTLP, only the collector endpoint changes when you move.
:::

## Prerequisites

### All deployments

- 64-bit Linux, macOS, or Windows host.
- At least **4 GB RAM** free for the stack (8 GB+ recommended for real workloads).
- At least 2 CPU cores.
- Persistent disk for ClickHouse; size it to your retention window.

### Container deployments (Docker, Swarm)

- Docker Engine 20.10 or newer.
- Docker Compose v2 (`docker compose`, not the legacy `docker-compose`).

### Kubernetes deployments

- A working cluster (v1.26+) and `kubectl` access.
- Helm 3 installed.
- A default `StorageClass` for persistent volumes.

## Network ports

| Port | Protocol | Purpose |
| --- | --- | --- |
| `8080` | HTTP | Web UI |
| `4317` | gRPC | OTLP telemetry ingestion |
| `4318` | HTTP | OTLP telemetry ingestion |

:::note
Self-hosted MindOps needs **no ingestion key**. Applications send OTLP straight to ports `4317`/`4318` without an auth header.
:::

## After you install

1. Open the UI at `http://localhost:8080` and create the first admin account.
2. Point a service at the collector with `OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4317`.
3. Watch your service appear in the services list.

Ready to begin? The fastest path is [Docker Standalone](/mindops-docs/install/docker-standalone/).
