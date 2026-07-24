---
title: Log Parsing Guides
description: Practical parsing recipes for MindOps log pipelines — JSON, Grok, regex, timestamp, severity, and trace-id extraction with short configs.
---

These recipes are the building blocks of a [log pipeline](/logs/pipelines/).
Each shows a small processor config you can drop in and adapt. Processors run in
order, so place each recipe where its input field already exists.

## JSON

Parse a JSON `body` so its keys become attributes.

```yaml
- type: json_parser
  parse_from: body
  parse_to: attributes
```

Input `{"level":"error","msg":"db down","order_id":"A-7"}` yields attributes
`level`, `msg`, and `order_id`.

## Grok

Grok is named regex patterns, ideal for semi-structured access logs.

```yaml
- type: grok_parser
  parse_from: body
  pattern: '%{IP:client_ip} %{WORD:method} %{URIPATH:path} %{NUMBER:status:int}'
```

## Regex

When no Grok pattern fits, use named capture groups.

```yaml
- type: regex_parser
  parse_from: body
  regex: '^(?P<ts>\S+) (?P<level>\w+) (?P<message>.*)$'
```

## Timestamp

Promote a parsed field to the record `timestamp` so events sort correctly.

```yaml
- type: time_parser
  parse_from: attributes.ts
  layout_type: strptime
  layout: '%Y-%m-%dT%H:%M:%S.%LZ'
```

## Severity

Map a textual level onto `severity_number` for range queries.

```yaml
- type: severity_parser
  parse_from: attributes.level
  mapping:
    error: [error, err, fatal]
    warn:  [warn, warning]
    info:  [info]
    debug: [debug, trace]
```

## Trace ID and span ID

Lift correlation IDs out of attributes into first-class trace context so logs
link to traces.

```yaml
- type: trace_parser
  trace_id:
    parse_from: attributes.trace_id
  span_id:
    parse_from: attributes.span_id
```

## Recommended order

| Order | Recipe | Why |
|-------|--------|-----|
| 1 | JSON / Grok / Regex | Create attributes first |
| 2 | Timestamp | Needs the parsed time field |
| 3 | Severity | Needs the parsed level field |
| 4 | Trace ID | Needs parsed id fields |

:::tip
Test patterns against a few real sample lines before enabling a pipeline. A
mismatched regex silently leaves the field empty rather than erroring.
:::

:::caution
Grok and complex regex are more expensive than JSON parsing. If you control the
emitter, log JSON and use the cheap `json_parser`.
:::

To strip fields or discard records after parsing, see
[Drop Logs](/logs/drop-logs/).
