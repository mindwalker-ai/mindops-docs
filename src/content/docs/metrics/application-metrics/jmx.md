---
title: JMX Metrics
description: Scrape JVM and application MBeans into MindOps using the OpenTelemetry JMX metric gatherer or the Collector jmxreceiver.
---

## Overview

Java applications expose a wealth of runtime data through JMX MBeans. MindOps ingests these by converting MBean attributes into OpenTelemetry metrics, either with the standalone JMX Metric Gatherer or the Collector's `jmxreceiver`. Both ship OTLP to MindOps.

## Enable JMX on your application

Start your service with a JMX remote port:

```bash
java -Dcom.sun.management.jmxremote \
  -Dcom.sun.management.jmxremote.port=9010 \
  -Dcom.sun.management.jmxremote.ssl=false \
  -Dcom.sun.management.jmxremote.authenticate=false \
  -jar payments-service.jar
```

## Option 1: JMX Metric Gatherer

Download the gatherer jar from the OpenTelemetry releases, then run it against your JMX endpoint:

```bash
java -Dotel.jmx.service.url=service:jmx:rmi:///jndi/rmi://localhost:9010/jmxrmi \
  -Dotel.jmx.target.system=jvm \
  -Dotel.metrics.exporter=otlp \
  -Dotel.exporter.otlp.endpoint=http://localhost:4317 \
  -Dotel.service.name=payments-service \
  -jar opentelemetry-jmx-metrics.jar
```

The `jvm` target ships heap, thread, garbage collection, and class-loading metrics out of the box.

## Option 2: Collector jmxreceiver

If you run an OpenTelemetry Collector, configure the receiver instead:

```yaml
receivers:
  jmx:
    jar_path: /opt/otel/opentelemetry-jmx-metrics.jar
    endpoint: service:jmx:rmi:///jndi/rmi://localhost:9010/jmxrmi
    target_system: jvm
    collection_interval: 30s

exporters:
  otlp:
    endpoint: localhost:4317
    tls:
      insecure: true

service:
  pipelines:
    metrics:
      receivers: [jmx]
      exporters: [otlp]
```

## Custom MBeans

To capture your own MBeans, supply a Groovy script via `otel.jmx.groovy.script` and emit instruments from queried attributes. Point the gatherer at your application's domain (for example `com.example:type=Queue`).

## Environment configuration

```bash
export OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4317
export OTEL_SERVICE_NAME=payments-service
export OTEL_METRICS_EXPORTER=otlp
```

Self-hosted MindOps needs no ingestion key.

## Verify in MindOps

In the MindOps UI (`http://localhost:8080`), open **Metrics** and search for `jvm.memory.used` or `jvm.gc.collections.count`. Graphs populate after the first collection interval.
