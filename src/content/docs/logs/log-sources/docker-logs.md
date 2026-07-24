---
title: Collect Docker Container Logs in MindOps
description: Use an OpenTelemetry Collector with the filelog receiver to collect Docker container logs and forward them to MindOps over OTLP.
---

Docker writes each container's stdout and stderr to JSON files on the host. An OpenTelemetry Collector running with the `filelog` receiver tails those files, parses the Docker log format, and exports the records to MindOps.

## Collector configuration

```yaml
receivers:
  filelog:
    include:
      - /var/lib/docker/containers/*/*-json.log
    operators:
      - type: json_parser
        timestamp:
          parse_from: attributes.time
          layout: '%Y-%m-%dT%H:%M:%S.%LZ'
      - type: move
        from: attributes.log
        to: body

processors:
  resourcedetection:
    detectors: [system]
  batch: {}

exporters:
  otlp/mindops:
    # Self-hosted MindOps needs NO ingestion key.
    endpoint: localhost:4317
    tls:
      insecure: true

service:
  pipelines:
    logs:
      receivers: [filelog]
      processors: [resourcedetection, batch]
      exporters: [otlp/mindops]
```

## Run the Collector

Mount the Docker log directory read-only so the Collector can tail it:

```bash
docker run -d --name otel-collector \
  -v /var/lib/docker/containers:/var/lib/docker/containers:ro \
  -v "$(pwd)/config.yaml:/etc/otelcol-contrib/config.yaml" \
  otel/opentelemetry-collector-contrib:latest
```

## Where the endpoint goes

The `otlp` exporter `endpoint` is the MindOps OTLP gRPC receiver.

| Deployment | endpoint |
|------------|----------|
| Collector on the host | `localhost:4317` |
| Collector in the same Docker Compose project | `signoz-ingester:4317` |

:::note
The contrib distribution of the Collector also ships a `docker_stats` receiver for metrics. For logs, the `filelog` receiver shown above is the reliable, low-overhead choice.
:::

## Verify in MindOps

Open `http://localhost:8080`, navigate to **Logs**, and confirm container output appears. Run `docker run --rm hello-world` and watch its lines land in the MindOps stream.
