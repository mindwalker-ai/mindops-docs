---
title: Drop Noisy Logs
description: Reduce log volume and cost in MindOps by dropping low-value records at the pipeline or Collector level, filtered by attribute or severity.
---

Not every log line is worth storing. Health-check probes, debug chatter, and
chatty third-party libraries inflate storage and slow down search. Dropping them
early keeps MindOps fast and cheap without losing signal.

## Where to drop

| Location | Good for | Trade-off |
|----------|----------|-----------|
| Log pipeline (UI) | Service-specific rules, easy to edit | Runs after ingestion reaches MindOps |
| Collector / agent | Drop before it ever leaves the host | Config lives outside the UI |

Dropping at the Collector saves the most because the data never travels the
wire. Dropping in a pipeline is the easiest to manage and audit centrally.

## Drop by severity

The most common rule: keep `INFO` and above in production, discard `DEBUG`.

```text
filter: severity_number < 9    # drop everything below INFO
action: drop
```

## Drop by attribute

Discard records matching a known noisy pattern, like health checks.

```text
filter: http.route = "/healthz" OR http.route = "/readyz"
action: drop
```

## Collector-level filtering

In the Collector, the `filter` processor drops records that match an OTTL
condition before export.

```yaml
processors:
  filter/noise:
    logs:
      log_record:
        - 'severity_number < SEVERITY_NUMBER_INFO'
        - 'attributes["http.route"] == "/healthz"'
service:
  pipelines:
    logs:
      processors: [filter/noise]
      exporters: [otlp]
```

## Sampling instead of dropping

If you want to keep a representative sample of a high-volume but occasionally
useful log, sample rather than drop entirely — for example keep 1 in 20 of a
debug stream.

:::caution
Dropping is irreversible — discarded logs are never stored and cannot be
recovered. Never blanket-drop `ERROR`/`FATAL`, and confirm a route is truly
noise before filtering it out.
:::

:::tip
Watch ingestion volume by `service.name` in the
[Log Explorer](/logs/log-explorer/) before and after adding a drop rule to
confirm the reduction and that you did not lose important records.
:::

Drop steps are usually the **last** processors in a
[log pipeline](/logs/pipelines/), after parsing and redaction have run.
