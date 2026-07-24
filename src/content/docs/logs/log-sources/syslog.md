---
title: Collect Syslog in MindOps
description: Use an OpenTelemetry Collector with the syslog receiver to ingest RFC 5424 or RFC 3164 syslog and forward it to MindOps over OTLP.
---

Many network devices, hosts, and legacy services emit syslog. An OpenTelemetry Collector with the `syslog` receiver listens for those messages, parses them, and forwards the records to MindOps for storage in ClickHouse.

## Collector configuration

This Collector listens for RFC 5424 syslog over TCP on port 54526 and exports to MindOps.

```yaml
receivers:
  syslog:
    tcp:
      listen_address: 0.0.0.0:54526
    protocol: rfc5424

processors:
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
      receivers: [syslog]
      processors: [batch]
      exporters: [otlp/mindops]
```

For older devices, set `protocol: rfc3164` and add a `location` if timestamps lack a year/zone. Use the `udp` block instead of `tcp` when sources send over UDP.

## Point your sources at the Collector

Configure rsyslog (or the device) to forward to the Collector's listen address:

```text
# /etc/rsyslog.d/90-mindops.conf
*.* @@collector-host:54526
```

The `@@` prefix selects TCP; a single `@` uses UDP.

## Where the endpoint goes

The `otlp` exporter `endpoint` is the MindOps OTLP gRPC receiver.

| Deployment | endpoint |
|------------|----------|
| Collector on the host | `localhost:4317` |
| Collector in Docker Compose | `signoz-ingester:4317` |

:::note
Keep the syslog listener port (54526 here) distinct from the OTLP ports 4317/4318. The syslog receiver is the ingress for devices; the OTLP exporter is the egress to MindOps.
:::

## Verify in MindOps

Open `http://localhost:8080`, go to **Logs**, and send a test message with `logger -n collector-host -P 54526 -T "hello mindops"`. Confirm the parsed syslog record, including its facility and severity, appears in the stream.
