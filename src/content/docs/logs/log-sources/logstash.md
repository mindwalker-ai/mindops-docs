---
title: Ship Logstash Logs to MindOps
description: Forward logs processed by Logstash to MindOps over OTLP using the http output plugin.
---

Logstash collects, transforms, and routes logs in the Elastic ecosystem. You can forward its events to MindOps by emitting OTLP-formatted JSON to the MindOps OTLP HTTP receiver with the built-in `http` output plugin.

## Pipeline configuration

The pipeline below reads JSON log lines, maps fields into the OTLP log record shape, and posts them to MindOps.

```ruby
input {
  file {
    path => "/var/log/app/service.log"
    codec => "json"
  }
}

filter {
  # Build the OTLP logRecords structure expected by MindOps.
  ruby {
    code => '
      event.set("[otlp][resourceLogs]", [{
        "resource" => { "attributes" => [
          { "key" => "service.name", "value" => { "stringValue" => "order-pipeline" } }
        ] },
        "scopeLogs" => [{ "logRecords" => [{
          "timeUnixNano" => (event.get("@timestamp").to_f * 1e9).to_i.to_s,
          "severityText" => (event.get("level") || "INFO"),
          "body" => { "stringValue" => event.get("message").to_s }
        }] }]
      }])
    '
  }
}

output {
  http {
    # Self-hosted MindOps needs NO ingestion key.
    url => "http://localhost:4318/v1/logs"
    http_method => "post"
    format => "json"
    mapping => { "resourceLogs" => "%{[otlp][resourceLogs]}" }
    headers => { "Content-Type" => "application/json" }
  }
}
```

## Where the endpoint goes

The `url` points at the MindOps OTLP HTTP logs receiver.

| Deployment | url |
|------------|-----|
| Local install | `http://localhost:4318/v1/logs` |
| Logstash in Docker Compose | `http://signoz-ingester:4318/v1/logs` |

:::tip
If your events are already well-structured, an OpenTelemetry Collector sitting between Logstash and MindOps can normalize them instead of hand-building the OTLP body in a `ruby` filter.
:::

## Verify in MindOps

Open `http://localhost:8080`, go to **Logs**, and filter on `service.name = order-pipeline`. Write a JSON line to the tailed file and confirm the record reaches the MindOps stream.
