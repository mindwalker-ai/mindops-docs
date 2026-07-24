---
title: Monitoring AWS Lambda with MindOps
description: Use the OpenTelemetry Lambda layer to send traces, metrics, and logs from serverless functions to MindOps without a long-running agent.
---

Lambda functions are short-lived, so there is no host to run a Collector on. Instead you
attach an **OpenTelemetry Lambda layer** — an extension that runs in the execution
environment, auto-instruments your handler, and exports telemetry to MindOps over OTLP.

## Add the layer

Attach the OpenTelemetry layer for your runtime (Node.js, Python, Java, Go) to the
function, then set the wrapper and endpoint environment variables:

```bash
AWS_LAMBDA_EXEC_WRAPPER=/opt/otel-instrument
OTEL_EXPORTER_OTLP_ENDPOINT=http://mindops-collector:4318
OTEL_EXPORTER_OTLP_PROTOCOL=http/protobuf
OTEL_SERVICE_NAME=checkout-fn
OTEL_RESOURCE_ATTRIBUTES=deployment.environment=prod
```

The wrapper hooks the runtime before your handler loads, so most libraries (HTTP clients,
AWS SDK, databases) are traced with no code change.

## Collector extension vs direct export

Two shipping options, depending on tail latency tolerance:

| Option | How it works | Trade-off |
|--------|--------------|-----------|
| Direct OTLP | Layer exports straight to your Collector | Simplest; adds to invocation time |
| In-layer Collector | A mini Collector extension batches and flushes | Lower handler overhead; more config |

The in-layer Collector uses a `flush` on the extension's `SHUTDOWN`/`INVOKE` lifecycle so
spans are not lost when the environment freezes between invocations.

## Traces, metrics, and logs

- **Traces** — each invocation becomes a span; downstream calls nest beneath it, and the
  Lambda's cold-start time appears as a distinct span attribute.
- **Metrics** — invocation count, duration, and errors. For platform metrics like
  concurrency and throttles, pull `AWS/Lambda` from CloudWatch (see below).
- **Logs** — function logs flow through the layer with the active `trace_id`, so a log
  line links back to its invocation.

## Platform metrics from CloudWatch

For account-wide metrics the function cannot self-report, scrape CloudWatch with the
Collector running elsewhere:

```yaml
receivers:
  awscloudwatchmetrics:
    region: us-east-1
    metrics:
      named:
        - namespace: AWS/Lambda
          metric_name: Throttles
          period: 60s
          aws_aggregation: Sum
```

:::tip
Keep the layer's batch timeout short (a second or two). Long timeouts risk telemetry
being dropped when Lambda freezes the environment after the response is returned.
:::

:::note
Self-hosted MindOps needs no ingestion key, so the OTLP endpoint above carries no auth
header. Make sure the function's VPC/security groups can reach the Collector.
:::

For always-on compute, compare with [ECS](/aws-monitoring/ecs/) and
[EC2](/aws-monitoring/ec2/).
