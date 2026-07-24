---
title: Monitoring Message Queues with MindOps
description: Track Kafka, RabbitMQ, and AWS SQS in MindOps using Collector receivers — consumer lag, throughput, and queue depth.
---

Queues are where latency hides. A healthy producer and a healthy consumer can still mean
trouble if messages pile up in between. MindOps watches the queue itself with dedicated
Collector receivers so you see **lag, throughput, and depth** directly.

## Apache Kafka

The `kafkametrics` receiver connects to the brokers and reports broker, topic, and
consumer-group metrics — including the all-important consumer lag.

```yaml
receivers:
  kafkametrics:
    brokers: [kafka-1:9092, kafka-2:9092]
    protocol_version: 2.8.0
    scrapers: [brokers, topics, consumers]
    collection_interval: 30s
```

Key signals: `kafka.consumer_group.lag` (messages a group is behind),
`kafka.topic.partitions`, and `kafka.partition.current_offset`. Rising lag with steady
production means consumers cannot keep up — scale them or investigate slow handlers.

## RabbitMQ

The `rabbitmq` receiver reads from the management plugin's HTTP API.

```yaml
receivers:
  rabbitmq:
    endpoint: http://rabbitmq:15672
    username: ${env:RABBITMQ_USER}
    password: ${env:RABBITMQ_PASS}
    collection_interval: 30s
```

Watch `rabbitmq.message.current` (ready vs unacknowledged), `rabbitmq.message.delivered`,
and `rabbitmq.consumer.count`. A growing ready count with few consumers is the RabbitMQ
equivalent of consumer lag.

## AWS SQS

SQS is managed, so pull its metrics from CloudWatch with `awscloudwatchmetrics`.

```yaml
receivers:
  awscloudwatchmetrics:
    region: us-east-1
    metrics:
      named:
        - namespace: AWS/SQS
          metric_name: ApproximateNumberOfMessagesVisible
          period: 60s
          aws_aggregation: Maximum
        - namespace: AWS/SQS
          metric_name: ApproximateAgeOfOldestMessage
          period: 60s
          aws_aggregation: Maximum
```

`ApproximateAgeOfOldestMessage` is your lag proxy — if the oldest message keeps aging,
consumers are falling behind or failing.

## What to chart and alert on

| Concern | Kafka | RabbitMQ | SQS |
|---------|-------|----------|-----|
| Backlog | consumer-group lag | ready messages | messages visible |
| Staleness | offset gap | oldest-ready age | oldest-message age |
| Throughput | messages in/out per sec | delivered/published | sent/received |
| Consumers | group members | consumer count | n/a |

:::tip
Pair queue metrics with traces. If you propagate trace context through message headers,
a single trace spans producer → queue → consumer, so a lag spike links to the exact slow
consumer span.
:::

:::note
Self-hosted MindOps needs no ingestion key. Route these receivers to OTLP `:4317` and
build a lag alert so a stuck consumer pages you before the backlog becomes an outage.
:::

See [Integrations Overview](/mindops-docs/integrations/overview/) for the general pattern.
