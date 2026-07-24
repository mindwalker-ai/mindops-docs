---
title: Monitoring EC2 with MindOps
description: Run the OpenTelemetry Collector on an EC2 instance to ship host metrics and server/application logs to MindOps.
---

EC2 is a host you fully control, so the cleanest approach is to run an **OpenTelemetry
Collector** directly on the instance. It reads CPU, memory, disk, and network locally,
tails your log files, and forwards everything to MindOps over OTLP.

## Install the Collector

Download the `otelcol-contrib` binary (or run it as a container) on the instance and
register it as a `systemd` service so it survives reboots. The contrib distribution
includes the AWS and host receivers you need.

## Host metrics

```yaml
receivers:
  hostmetrics:
    collection_interval: 30s
    scrapers:
      cpu: {}
      memory: {}
      disk: {}
      filesystem: {}
      network: {}
      load: {}
      paging: {}
```

Add the `resourcedetection` processor so each metric is tagged with the instance ID,
type, and region — handy when one MindOps instance watches a whole fleet.

```yaml
processors:
  resourcedetection:
    detectors: [env, ec2]
    ec2:
      tags: [Name, environment]
```

## Application and server logs

Point the `filelog` receiver at your app and system logs. It tails new lines, parses
them, and attaches them to the same resource as the metrics.

```yaml
receivers:
  filelog:
    include:
      - /var/log/app/*.log
      - /var/log/nginx/access.log
    operators:
      - type: json_parser
```

## Wire the pipelines

```yaml
exporters:
  otlp:
    endpoint: mindops-collector:4317
    tls:
      insecure: true
service:
  pipelines:
    metrics:
      receivers: [hostmetrics]
      processors: [resourcedetection]
      exporters: [otlp]
    logs:
      receivers: [filelog]
      processors: [resourcedetection]
      exporters: [otlp]
```

:::tip
If your service is instrumented with an OpenTelemetry SDK, point its OTLP exporter at
the **same local Collector** (`localhost:4317`). Traces, metrics, and logs then share
the EC2 resource attributes automatically.
:::

:::note
No ingestion key is needed for self-hosted MindOps. Once data flows, find the instance
under Infrastructure and build a CPU or disk alert so a full disk never surprises you.
:::

See the [AWS overview](/aws-monitoring/overview/) for the CloudWatch-pull alternative
when you cannot run an agent on the box.
