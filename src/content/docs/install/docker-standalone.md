---
title: Docker Standalone
description: Self-host the full MindOps stack on a single host using the foundryctl installer and a casting.yaml manifest.
---

This is the fastest way to run MindOps. On a single Docker host you bring up the collector, ClickHouse, Postgres, query service, and UI with one command.

## Prerequisites

- Docker Engine 20.10+ and Docker Compose v2.
- At least 4 GB RAM free and 2 CPU cores.
- A directory to hold your configuration and data volumes.

## 1. Create `casting.yaml`

MindOps is installed by `foundryctl`, which reads a declarative manifest. Create a file named `casting.yaml`:

```yaml
apiVersion: v1alpha1
kind: Installation
metadata:
  name: mindops
spec:
  flavor: compose      # use Docker Compose as the runtime
  mode: docker         # single-host Docker deployment
  ports:
    ui: 8080
    otlpGrpc: 4317
    otlpHttp: 4318
  storage:
    clickhouse:
      volume: ./data/clickhouse
    postgres:
      volume: ./data/postgres
```

The `flavor: compose` and `mode: docker` fields tell `foundryctl` to render a Compose project and run it locally.

## 2. Cast the installation

Run the installer against your manifest:

```bash
foundryctl cast --file casting.yaml
```

`foundryctl cast` pulls the images, renders the Compose files, and starts every component. The first run takes a minute or two while images download.

:::tip
Re-running `foundryctl cast` is safe and idempotent. It reconciles the running stack to match `casting.yaml`, so edit the manifest and cast again to apply changes.
:::

## 3. Open the UI and create an admin

Once the stack is healthy, open:

```text
http://localhost:8080
```

On first launch MindOps prompts you to create the **initial admin account**. This account owns the workspace and can invite other users. There is no default password to change.

## 4. Send telemetry

Self-hosted MindOps requires **no ingestion key**. Point any OpenTelemetry SDK at the collector:

```bash
export OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4317
export OTEL_SERVICE_NAME=checkout-service
```

For the HTTP transport use port `4318` instead:

```bash
export OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318
export OTEL_EXPORTER_OTLP_PROTOCOL=http/protobuf
```

Your service should appear in the UI within a few seconds.

## Lifecycle commands

The rendered Compose project lives in your working directory, so standard Compose commands manage it.

| Action | Command |
| --- | --- |
| Stop the stack | `docker compose down` |
| Start it again | `docker compose up -d` |
| Tail logs | `docker compose logs -f` |
| Check status | `docker compose ps` |

:::caution
`docker compose down` stops containers but keeps your named volumes. Adding `-v` (`docker compose down -v`) **deletes all telemetry data**. Only do that for a clean reset.
:::

## Uninstall

To remove MindOps, stop the stack and delete its volumes:

```bash
docker compose down -v
```

Then remove the `casting.yaml` file and the `./data` directory. See the [uninstall guide](/install/uninstall/) for full cleanup steps across deployment types.
