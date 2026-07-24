---
title: Ship Fluentd Logs to MindOps
description: Forward logs collected by Fluentd to MindOps using the OpenTelemetry OTLP output plugin.
---

Fluentd is a mature log collector with a large plugin ecosystem. The `fluent-plugin-opentelemetry` output forwards buffered records to MindOps over OTLP/HTTP for storage in ClickHouse.

## Install the plugin

```bash
fluent-gem install fluent-plugin-opentelemetry
```

## Configure the OTLP output

Match your input sources to an `opentelemetry` output that targets the MindOps OTLP HTTP receiver.

```xml
<source>
  @type tail
  path /var/log/app/access.log
  tag app.access
  <parse>
    @type json
  </parse>
</source>

<match app.**>
  @type opentelemetry
  # Self-hosted MindOps needs NO ingestion key.
  endpoint http://localhost:4318
  logs_uri /v1/logs
  <buffer>
    flush_interval 5s
  </buffer>
</match>
```

## Where the endpoint goes

The `endpoint` is the base URL of the MindOps OTLP HTTP receiver; `logs_uri` is the logs path appended to it.

| Deployment | endpoint |
|------------|----------|
| Local install | `http://localhost:4318` |
| Fluentd in Docker Compose | `http://signoz-ingester:4318` |

## Stamp a service name

Add a `record_transformer` filter so MindOps groups records under a service:

```xml
<filter app.**>
  @type record_transformer
  <record>
    service.name web-frontend
  </record>
</filter>
```

:::note
Fluentd buffers records before sending. If MindOps is briefly unavailable, the buffer retries delivery rather than dropping logs.
:::

## Verify in MindOps

Open `http://localhost:8080`, navigate to **Logs**, and filter on `service.name = web-frontend`. Generate a request that writes to the tailed file and confirm Fluentd ships the record into MindOps.
