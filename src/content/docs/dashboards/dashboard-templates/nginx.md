---
title: NGINX Dashboard
description: Track NGINX connections and request throughput via the stub_status module and the OpenTelemetry nginx receiver in MindOps.
---

# NGINX Dashboard

This template surfaces the core serving metrics of an NGINX web server: active
connections, accepted and handled connections, and total requests. It relies on
NGINX's `stub_status` endpoint scraped by the OpenTelemetry `nginx` receiver.

## What it shows

- Active connections, split into reading, writing, and waiting
- Accepted versus handled connections (dropped connection detection)
- Requests handled per second
- Connection acceptance rate over time

## Prerequisites / data source

First expose the `stub_status` endpoint in your NGINX config, then point the
`nginx` receiver at it.

```nginx
location /status {
    stub_status;
    allow 127.0.0.1;
    deny all;
}
```

```yaml
receivers:
  nginx:
    endpoint: "http://localhost:80/status"
    collection_interval: 30s
```

| Requirement | Detail |
|-------------|--------|
| NGINX module | `ngx_http_stub_status_module` enabled |
| Endpoint | `stub_status` location reachable by the Collector |
| Receiver | `nginx` |

:::caution
Restrict the `stub_status` location to trusted networks. It should not be exposed
publicly.
:::

## Import

1. In MindOps, go to **Dashboards** → **New** → **Import JSON**.
2. Upload the NGINX template JSON and save.
3. Filter by instance using the dashboard variable.

:::note
`stub_status` reports basic counters only. For per-route latency and status codes,
pair this with access-log ingestion or instrumented upstream services.
:::
