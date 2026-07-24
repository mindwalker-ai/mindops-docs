---
title: Docker Swarm
description: Deploy the MindOps stack across a Docker Swarm cluster with an overlay network and placement-aware storage.
---

Docker Swarm gives you simple multi-node orchestration without the complexity of Kubernetes. It is a good fit when you already run Swarm and want MindOps spread across a handful of nodes.

## Prerequisites

- A Swarm cluster (`docker swarm init` on the manager, workers joined).
- Docker Engine 20.10+ on every node.
- A persistent storage strategy for ClickHouse and Postgres (see below).

## 1. Create an overlay network

Swarm services communicate over an overlay network. Create one that the stack will attach to:

```bash
docker network create --driver overlay --attachable mindops-net
```

## 2. Prepare the stack file

Generate a Swarm-compatible stack with `foundryctl` by setting the mode to `swarm` in `casting.yaml`:

```yaml
apiVersion: v1alpha1
kind: Installation
metadata:
  name: mindops
spec:
  flavor: compose
  mode: swarm
  network: mindops-net
  ports:
    ui: 8080
    otlpGrpc: 4317
    otlpHttp: 4318
```

```bash
foundryctl cast --file casting.yaml --render-only > mindops-stack.yaml
```

`--render-only` writes the stack file instead of running it, so you can deploy it with native Swarm tooling.

## 3. Deploy the stack

```bash
docker stack deploy -c mindops-stack.yaml mindops
```

Check rollout status:

```bash
docker stack services mindops
docker service ps mindops_clickhouse
```

## Placement and storage

ClickHouse and Postgres are stateful, so pin them to nodes with durable storage.

```yaml
deploy:
  placement:
    constraints:
      - node.labels.storage == ssd
  replicas: 1
```

:::caution
Stateful services like ClickHouse and Postgres should run with **one replica** pinned to a node whose volume persists. Swarm can reschedule a task to another node, and without shared or pinned storage that means data loss. Label your storage nodes and constrain placement accordingly.
:::

## Scaling caveats

| Component | Scalable in Swarm? | Notes |
| --- | --- | --- |
| Collector | Yes | Stateless; add replicas behind the ingress to absorb load. |
| Query service | Yes | Stateless; replicate for read throughput. |
| Web UI | Yes | Stateless. |
| ClickHouse | Carefully | Single-node by default; clustering is an advanced topic. |
| Postgres | No (single) | Run one instance with reliable storage and backups. |

## Accessing the UI

Swarm publishes ports on the routing mesh, so the UI is reachable on `:8080` of any node:

```text
http://<any-swarm-node>:8080
```

Send OTLP to ports `4317`/`4318` on the same nodes. As with all self-hosted installs, **no ingestion key** is required.

## Tear down

```bash
docker stack rm mindops
docker network rm mindops-net
```

Removing the stack does not delete pinned volumes; clean those up on the storage nodes. See the [uninstall guide](/mindops-docs/install/uninstall/) for details.
