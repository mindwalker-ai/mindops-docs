---
title: Log Pipelines
description: What log pipelines are in MindOps, how to parse, enrich, redact, and drop logs at ingestion, and how processor order works.
---

A log pipeline transforms log records as they arrive, before they are stored in
ClickHouse. Pipelines let you turn messy text into structured, queryable,
privacy-safe data without touching application code.

## What pipelines do

A pipeline is an ordered list of processors applied to logs that match a filter.
Common jobs:

- **Parse** — extract fields from JSON, Grok, or regex into attributes.
- **Enrich** — add or rename attributes, normalize severity, set timestamp.
- **Redact** — mask or remove sensitive values (emails, tokens, card numbers).
- **Drop** — discard noisy records to control volume.

## Creating a pipeline in the UI

1. Open `http://localhost:8080` and go to **Logs → Pipelines**.
2. Click **New Pipeline** and give it a name and description.
3. Set a **filter** that selects which logs it applies to, e.g.
   `service.name = checkout`.
4. Add processors in the order you want them to run.
5. Save and enable. Pipelines apply to incoming logs going forward.

## Processor order matters

Processors run top to bottom, and each one operates on the output of the one
before it. Order your steps so each processor has the fields it needs.

```text
1. JSON parser        → lifts body keys into attributes
2. Severity parser    → maps attribute "level" → severity_number
3. Timestamp parser   → maps attribute "ts" → timestamp
4. Trace parser       → extracts trace_id / span_id
5. Redact (regex)     → masks attributes.email
6. Drop (filter)      → discards DEBUG noise
```

If you place the severity parser before the JSON parser, the `level` field does
not exist yet and the step is a no-op.

| Step | Reads | Writes |
|------|-------|--------|
| JSON parser | `body` | attributes |
| Severity parser | `attributes.level` | `severity_number` |
| Timestamp parser | `attributes.ts` | `timestamp` |
| Trace parser | `attributes.trace_id` | `trace_id`, `span_id` |

## Example: structured app logs

Filter `service.name = checkout`, then:

1. Parse JSON body.
2. Map `attributes.level` to severity.
3. Extract `attributes.trace_id` into the record's `trace_id`.
4. Redact `attributes.user.email`.

The result: queryable severity, trace correlation, and no PII at rest.

:::caution
Pipelines change data permanently before storage. Test a filter on a small
service first, and confirm you are not dropping records you actually need.
:::

:::tip
Keep one focused pipeline per service or log shape rather than one giant
pipeline with many conditional branches — it is far easier to reason about
order and debug.
:::

For ready-made processor configs see [Parsing Guides](/mindops-docs/logs/parsing-guides/),
and for volume control see [Drop Logs](/mindops-docs/logs/drop-logs/).
