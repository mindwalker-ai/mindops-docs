---
title: RabbitMQ Dashboard
description: Monitor RabbitMQ queues, message rates, and consumer activity using the OpenTelemetry rabbitmq receiver in MindOps.
---

# RabbitMQ Dashboard

This template provides a queue-centric view of a RabbitMQ broker: message backlog,
publish and deliver rates, and consumer counts. It is populated by the
OpenTelemetry Collector's `rabbitmq` receiver, which reads the management HTTP API.

## What it shows

- Messages ready, unacknowledged, and total per queue
- Publish, deliver, and acknowledge rates
- Consumer count per queue
- Message redelivery and drop activity
- Queue depth trends over time

## Prerequisites / data source

Enable the RabbitMQ management plugin, then point the `rabbitmq` receiver at the
management API with a monitoring user.

```yaml
receivers:
  rabbitmq:
    endpoint: http://localhost:15672
    username: otel_monitor
    password: ${env:RABBITMQ_MONITOR_PASSWORD}
    collection_interval: 30s
```

| Requirement | Detail |
|-------------|--------|
| Plugin | `rabbitmq_management` enabled |
| Receiver | `rabbitmq` |
| User tag | `monitoring` tag on the API user |
| Reachability | Collector reaches the API on port `15672` |

:::caution
Enable the management plugin with `rabbitmq-plugins enable rabbitmq_management`
before configuring the receiver, or the API endpoint will not exist.
:::

## Import

1. In MindOps, open **Dashboards** → **New** → **Import JSON**.
2. Upload the RabbitMQ template JSON and save.
3. Filter by queue or virtual host using the dashboard variables.

:::tip
A steadily growing "messages ready" count with flat consumer counts means
producers are outpacing consumers. Use it as your primary backlog alarm.
:::
