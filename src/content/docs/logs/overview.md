---
title: Logs Management
description: Ingest, search, and pipeline logs at scale in MindOps.
---

MindOps stores logs in **ClickHouse**, the same column store that powers traces and
metrics. That means fast filtering and aggregation over very high log volumes, and logs
that sit right next to the traces they belong to.

## Ways to send logs

1. **OpenTelemetry SDK** — emit logs directly from your application code.
2. **Collector file logs** — tail log files with the collector's `filelog` receiver.
3. **Agents** — forward from FluentBit or Logstash over OTLP.

## Searching logs

Query logs with the same builder used across MindOps:

```text
Filter:    service.name = api AND severity_text = ERROR AND body CONTAINS "timeout"
Aggregate: Count
Group by:  http.status_code
Every:     1m
```

## Log pipelines

Pipelines transform logs **as they are ingested**. Use them to:

- Parse unstructured messages into structured fields (e.g. extract `status` and `latency`).
- Add or rename attributes for consistency across services.
- Drop noisy logs you do not want to store.
- Redact PII (emails, tokens, card numbers) before anything is written to disk.

## Correlate with traces

If your logs carry a `trace_id` (most OpenTelemetry log setups add this automatically), you
can pivot from a log line straight to the trace that produced it — and back.

:::tip
Structured logs (key/value fields) are far more useful than free-text. Prefer emitting JSON
or using a pipeline to structure messages on the way in.
:::
