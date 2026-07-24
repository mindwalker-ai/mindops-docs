---
title: Self-Host with Docker
description: Run a full MindOps instance locally with Docker.
---

MindOps runs as a small stack of containers: the MindOps app + UI, an OpenTelemetry
collector for ingestion, ClickHouse for telemetry storage, and Postgres for metadata.

## Prerequisites

- Docker and Docker Compose installed and running
- ~4 GB of free memory and a few GB of disk

## Install

MindOps installs through a single CLI that generates the Compose stack and starts it.

```bash
# 1. Install the installer
curl -fsSL https://get.mindops.local/install.sh | bash

# 2. Describe the deployment
cat > casting.yaml <<'YAML'
apiVersion: v1alpha1
kind: Installation
metadata:
  name: mindops
spec:
  deployment:
    flavor: compose
    mode: docker
YAML

# 3. Deploy
mindops cast -f casting.yaml
```

This validates Docker, generates the Compose files, pulls the images, and starts the
containers.

## Access the UI

Open **[http://localhost:8080](http://localhost:8080)** and create your admin account on
first launch.

## Send data to MindOps

Point your OpenTelemetry SDK or collector at the ingestion endpoints exposed by the stack:

| Protocol | Endpoint |
| --- | --- |
| OTLP/gRPC | `localhost:4317` |
| OTLP/HTTP | `localhost:4318` |

:::tip
If traces are not arriving and you are behind a corporate firewall, switch from gRPC
(`4317`) to OTLP/HTTP (`4318`) — outbound gRPC is frequently blocked.
:::

## Manage the stack

```bash
# from your deployment directory
docker compose down      # stop
docker compose up -d     # start
```

## Stop and remove

```bash
docker compose down -v   # stop and delete data volumes
```

:::caution
`-v` deletes the ClickHouse and Postgres volumes — all stored telemetry and settings are
removed.
:::

Next: **[Send Your First Data](/mindops-docs/get-started/send-data/)**.
