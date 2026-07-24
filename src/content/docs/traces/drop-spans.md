---
title: Drop and Transform Spans
description: Control trace volume in the OpenTelemetry Collector with the filter and transform processors to drop health-check and noisy spans before they reach MindOps.
---

Not every span is worth storing. Health checks, readiness probes, static-asset requests, and chatty internal polling can dominate your trace volume while telling you nothing. The Collector's `filter` and `transform` processors let you drop or rewrite these spans before they reach MindOps — saving storage and keeping your data clean.

## Filter vs transform vs tail sampling

| Processor | Use it to |
|-----------|-----------|
| `filter` | Drop whole spans matching a condition |
| `transform` | Edit, redact, or selectively drop using OTTL |
| `tail_sampling` | Keep/drop *entire traces* based on latency or status |

For volume control by span *name or attribute*, reach for `filter`/`transform`. For latency- or error-aware decisions on whole traces, use [tail sampling](/mindops-docs/traces/tail-sampling/).

## Dropping health-check spans with `filter`

The `filter` processor uses OTTL conditions. Spans matching any condition are dropped.

```yaml
processors:
  filter/drop_noise:
    error_mode: ignore
    traces:
      span:
        - 'attributes["http.route"] == "/healthz"'
        - 'attributes["http.route"] == "/readyz"'
        - 'name == "GET /metrics"'
        - 'attributes["http.target"] == "/favicon.ico"'
```

## Dropping with `transform` (OTTL statements)

`transform` is more flexible — it can drop conditionally *and* rewrite attributes in the same pass:

```yaml
processors:
  transform/spans:
    error_mode: ignore
    trace_statements:
      - context: span
        statements:
          # drop synthetic uptime-monitor traffic
          - delete_key(attributes, "http.user_agent") where attributes["http.user_agent"] == "kube-probe/1.29"
          # redact a sensitive header before export
          - set(attributes["http.request.header.authorization"], "REDACTED")
```

:::tip
Use `transform` to scrub PII — auth tokens, emails, raw query strings — from span attributes before they ever leave your network. This is one of the core reasons to route traces through a Collector.
:::

## Wiring it into the pipeline

Order matters: drop noise early so downstream processors and the exporter do less work.

```yaml
service:
  pipelines:
    traces:
      receivers: [otlp]
      processors: [filter/drop_noise, transform/spans, batch]
      exporters: [otlp/mindops]
```

:::caution
Dropped spans are gone — they are never sent to MindOps and cannot be recovered. Test conditions against a copy of your pipeline (or a debug exporter) before rolling out, so you do not silently discard traffic you actually need.
:::

See the [Collector configuration anatomy](/mindops-docs/collection-agents/collector-configuration/) for how receivers, processors, and exporters fit together.
