---
title: Ship Java Logs to MindOps
description: Forward Java application logs to MindOps using the OpenTelemetry Logback or Log4j appender and the OTLP exporter.
---

Java applications can stream logs to MindOps through the OpenTelemetry log appenders for Logback and Log4j2. The appender hands each log event to the OpenTelemetry SDK, which batches and exports it over OTLP to MindOps.

## Add the dependencies

For Logback:

```xml
<dependency>
  <groupId>io.opentelemetry.instrumentation</groupId>
  <artifactId>opentelemetry-logback-appender-1.0</artifactId>
  <version>2.5.0-alpha</version>
</dependency>
```

For Log4j2, use `opentelemetry-log4j-appender-2.17` instead.

## Configure the Logback appender

Register the OpenTelemetry appender in `logback.xml`:

```xml
<configuration>
  <appender name="OTEL" class="io.opentelemetry.instrumentation.logback.appender.v1_0.OpenTelemetryAppender">
    <captureExperimentalAttributes>true</captureExperimentalAttributes>
    <captureMdcAttributes>*</captureMdcAttributes>
  </appender>

  <root level="INFO">
    <appender-ref ref="OTEL"/>
  </root>
</configuration>
```

## Point the SDK at MindOps

The simplest path is the OpenTelemetry Java agent, configured with environment variables that target the MindOps OTLP endpoint.

```bash
export OTEL_SERVICE_NAME="orders-service"
export OTEL_LOGS_EXPORTER="otlp"
export OTEL_EXPORTER_OTLP_ENDPOINT="http://localhost:4317"
export OTEL_EXPORTER_OTLP_PROTOCOL="grpc"

java -javaagent:/path/to/opentelemetry-javaagent.jar -jar orders-service.jar
```

Self-hosted MindOps requires no ingestion key, so no auth headers are needed.

| Deployment | `OTEL_EXPORTER_OTLP_ENDPOINT` |
|------------|-------------------------------|
| Local JVM  | `http://localhost:4317` |
| App in Docker Compose | `http://signoz-ingester:4317` |

:::note
If you bootstrap the SDK manually instead of the agent, call `OpenTelemetryAppender.install(openTelemetry)` once during startup so the appender is wired to your `OpenTelemetry` instance.
:::

## Verify in MindOps

Open `http://localhost:8080`, navigate to **Logs**, and filter on `service.name = orders-service`. Trigger an action in your app and confirm the log lines, along with any MDC attributes, land in the live view.
