---
title: Kafka Dashboard
description: Monitor Kafka consumer lag, throughput, and partition health using the OpenTelemetry kafkametrics receiver in MindOps.
---

# Kafka Dashboard

This template focuses on the signals that matter most for an Apache Kafka cluster:
consumer group lag, broker throughput, and partition distribution. It is powered
by the OpenTelemetry Collector's `kafkametrics` receiver.

## What it shows

- Consumer group lag per group and per partition
- Messages and bytes flowing through brokers
- Partition count and offset progression per topic
- Replica counts, in-sync replicas, and under-replicated partitions
- Current and committed offsets by consumer group

## Prerequisites / data source

Enable the `kafkametrics` receiver on a Collector that can connect to the broker
bootstrap servers. The receiver queries broker, topic, and consumer-group scrapers.

```yaml
receivers:
  kafkametrics:
    brokers:
      - localhost:9092
    protocol_version: 2.0.0
    scrapers:
      - brokers
      - topics
      - consumers
    collection_interval: 30s
```

| Requirement | Detail |
|-------------|--------|
| Receiver | `kafkametrics` |
| Scrapers | brokers, topics, consumers |
| Reachability | Collector reaches brokers on port `9092` |

:::tip
Consumer lag is the leading indicator of a struggling pipeline. Set the dashboard
to group lag by consumer group so a slow consumer stands out immediately.
:::

## Import

1. Open **Dashboards** → **New** → **Import JSON** in MindOps.
2. Upload the Kafka template JSON.
3. Filter by topic or consumer group using the dashboard variables.

:::note
The `consumers` scraper reads committed offsets from the cluster. If lag panels are
empty, confirm consumer groups are actually committing offsets.
:::
