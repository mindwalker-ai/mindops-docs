---
title: Collector in Docker
description: Run the OpenTelemetry Collector as a Docker container, mount its config, tail container logs with filelog, and network it to MindOps.
---

Running the Collector as a Docker container is the quickest way to stand up a telemetry pipeline on a single host. You mount a config file, expose the OTLP ports, and point the exporter at MindOps.

## Run the container

```bash
docker run -d --name otel-collector \
  -v "$(pwd)/config.yaml:/etc/otelcol/config.yaml" \
  -v /var/lib/docker/containers:/var/lib/docker/containers:ro \
  -p 4317:4317 \
  -p 4318:4318 \
  otel/opentelemetry-collector-contrib:latest \
  --config /etc/otelcol/config.yaml
```

- The first `-v` mounts your configuration into the container.
- The second mounts the Docker log directory read-only so `filelog` can tail container logs.
- `-p 4317`/`-p 4318` expose the OTLP gRPC and HTTP receivers to apps on the host.

:::note
Use the `-contrib` image. It bundles extra receivers and processors — including `filelog` and `resourcedetection` — that the core image leaves out.
:::

## Configuration

```yaml
receivers:
  otlp:
    protocols:
      grpc: { endpoint: 0.0.0.0:4317 }
      http: { endpoint: 0.0.0.0:4318 }
  filelog:
    include:
      - /var/lib/docker/containers/*/*-json.log
    start_at: end

processors:
  resourcedetection:
    detectors: [env, system, docker]
  batch: {}

exporters:
  otlp/mindops:
    endpoint: mindops:4317
    tls: { insecure: true }

service:
  pipelines:
    traces:  { receivers: [otlp], processors: [resourcedetection, batch], exporters: [otlp/mindops] }
    metrics: { receivers: [otlp], processors: [resourcedetection, batch], exporters: [otlp/mindops] }
    logs:    { receivers: [filelog, otlp], processors: [resourcedetection, batch], exporters: [otlp/mindops] }
```

## Networking to MindOps

How the exporter `endpoint` resolves depends on how the containers are connected:

| Setup | `endpoint` value |
|-------|------------------|
| Same Docker Compose / user-defined network | Service name, e.g. `mindops:4317` |
| MindOps on the host, Collector in a container | `host.docker.internal:4317` |
| MindOps reachable over the LAN | Its hostname or IP, e.g. `10.0.0.12:4317` |

For Compose, put both on the same network so DNS resolves the service name:

```yaml
services:
  otel-collector:
    image: otel/opentelemetry-collector-contrib:latest
    command: ["--config=/etc/otelcol/config.yaml"]
    volumes:
      - ./config.yaml:/etc/otelcol/config.yaml
      - /var/lib/docker/containers:/var/lib/docker/containers:ro
    ports: ["4317:4317", "4318:4318"]
    networks: [observability]
networks:
  observability: {}
```

:::tip
Application containers should export to `http://otel-collector:4317`, not directly to MindOps. The Collector handles batching, retries, and enrichment on their behalf.
:::

A self-hosted MindOps OTLP endpoint requires no ingestion key. See [Collector Configuration](/mindops-docs/collection-agents/collector-configuration/) for full pipeline details.
