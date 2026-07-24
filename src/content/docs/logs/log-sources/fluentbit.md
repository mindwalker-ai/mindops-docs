---
title: Ship Fluent Bit Logs to MindOps
description: Forward logs collected by Fluent Bit to MindOps using the native opentelemetry output plugin over OTLP.
---

Fluent Bit is a lightweight log processor and forwarder. Its built-in `opentelemetry` output plugin emits records over OTLP/HTTP, which MindOps ingests directly. No extra collector is required between Fluent Bit and MindOps.

## Configure the OpenTelemetry output

Add an `opentelemetry` output that points at the MindOps OTLP HTTP receiver. This example tails a log file and forwards it.

```ini
[SERVICE]
    flush        1
    log_level    info

[INPUT]
    name         tail
    path         /var/log/app/*.log
    tag          app.logs

[OUTPUT]
    name             opentelemetry
    match            *
    host             localhost
    port             4318
    logs_uri         /v1/logs
    log_response_payload true
    tls              off
```

Self-hosted MindOps accepts the records without an ingestion key, so no `Authorization` header is needed.

## Where the endpoint goes

The `host` and `port` settings target the MindOps OTLP HTTP receiver, and `logs_uri` is the logs path.

| Deployment | host | port |
|------------|------|------|
| Local install | `localhost` | `4318` |
| Fluent Bit in Docker Compose | `signoz-ingester` | `4318` |

## Add resource attributes

Use a `record_modifier` filter to stamp a service name so MindOps can group the logs:

```ini
[FILTER]
    name     record_modifier
    match    *
    record   service.name checkout-gateway
```

:::tip
If you prefer YAML configuration, the same plugin is available under `outputs:` with `name: opentelemetry` and the matching `host`, `port`, and `logs_uri` keys.
:::

## Verify in MindOps

Open `http://localhost:8080`, go to **Logs**, and filter on `service.name = checkout-gateway`. Append a line to a file under `/var/log/app/` and confirm Fluent Bit forwards it into the MindOps stream.
