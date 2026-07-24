---
title: Instrument Java with OpenTelemetry
description: Attach the OpenTelemetry Java agent to any JVM application and stream traces and metrics into MindOps with zero code changes, including Spring Boot.
---

The OpenTelemetry Java agent instruments your JVM at startup. It hooks into more
than a hundred libraries — servlet containers, JDBC, Kafka, gRPC, JDBC pools,
HTTP clients — and forwards everything to MindOps over OTLP. No recompilation
required.

## Download the agent

```bash
curl -L -O https://github.com/open-telemetry/opentelemetry-java-instrumentation/releases/latest/download/opentelemetry-javaagent.jar
```

Keep `opentelemetry-javaagent.jar` next to your build artifact or in a known
path. It is a single self-contained JAR.

## Attach it at launch

Pass the agent with `-javaagent` and configure the exporter through system
properties or environment variables.

```bash
java -javaagent:./opentelemetry-javaagent.jar \
  -Dotel.service.name=payments-api \
  -Dotel.exporter.otlp.endpoint=http://localhost:4317 \
  -Dotel.exporter.otlp.protocol=grpc \
  -Dotel.resource.attributes=deployment.environment=production \
  -jar target/payments-api.jar
```

## Configuration reference

Every system property has an equivalent environment variable.

| System property | Environment variable | Example |
| --- | --- | --- |
| `otel.service.name` | `OTEL_SERVICE_NAME` | `payments-api` |
| `otel.exporter.otlp.endpoint` | `OTEL_EXPORTER_OTLP_ENDPOINT` | `http://localhost:4317` |
| `otel.exporter.otlp.protocol` | `OTEL_EXPORTER_OTLP_PROTOCOL` | `grpc` |
| `otel.resource.attributes` | `OTEL_RESOURCE_ATTRIBUTES` | `deployment.environment=production` |

```bash
export OTEL_SERVICE_NAME=payments-api
export OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4317
export OTEL_RESOURCE_ATTRIBUTES=deployment.environment=production
java -javaagent:./opentelemetry-javaagent.jar -jar target/payments-api.jar
```

:::tip[Self-hosted needs no API key]
Because MindOps runs locally, the OTLP receiver on `:4317` accepts spans
directly. Skip the bearer-token header that managed backends require — just set
the endpoint.
:::

## Spring Boot note

For Spring Boot you do not change a single line of code. The agent detects the
embedded Tomcat/Netty server and Spring MVC controllers automatically. The one
thing to watch: pass `-javaagent` **before** `-jar` on the command line.

```bash
java -javaagent:./opentelemetry-javaagent.jar \
  -Dotel.service.name=order-service \
  -Dotel.exporter.otlp.endpoint=http://localhost:4317 \
  -jar build/libs/order-service-1.0.0.jar
```

If you prefer code-first configuration, the Spring Boot starter
(`io.opentelemetry.instrumentation:opentelemetry-spring-boot-starter`) reads the
same `otel.*` properties from `application.properties`.

## Add a manual span

Mix in custom spans by adding the API dependency and using the global tracer:

```java
import io.opentelemetry.api.GlobalOpenTelemetry;
import io.opentelemetry.api.trace.Span;
import io.opentelemetry.api.trace.Tracer;

Tracer tracer = GlobalOpenTelemetry.getTracer("order.workflow");
Span span = tracer.spanBuilder("settle_payment").startSpan();
try {
    span.setAttribute("order.id", orderId);
    settle(orderId);
} finally {
    span.end();
}
```

## Verify in MindOps

Open `http://localhost:8080`, navigate to **Services**, and look for
`payments-api`. RED metrics — request rate, error percentage, and latency
percentiles — are derived automatically from the agent's trace data, so the row
fills in once traffic flows.
