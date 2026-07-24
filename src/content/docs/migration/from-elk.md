---
title: Migrating from ELK to MindOps
description: Move log management from the Elastic stack to MindOps — ship logs over OpenTelemetry, replace Logstash with Collector pipelines, and query in the Log Explorer.
---

The ELK stack handles logs with **Beats/Logstash** for shipping, **Elasticsearch** for
storage, and **Kibana** for search. MindOps replaces all three with an
**OpenTelemetry Collector** feeding **ClickHouse**, queried through the Log Explorer — and
your logs end up correlated with traces and metrics in the same place.

## Concept mapping

| ELK / Elastic | MindOps |
|---------------|---------|
| Filebeat / Logstash | OpenTelemetry Collector (`filelog` receiver) |
| Logstash pipelines / Grok | Collector processors & log pipelines |
| Elasticsearch | ClickHouse |
| Kibana Discover | Log Explorer |
| Kibana dashboards | Dashboards |
| Index lifecycle management | Retention settings |
| Watcher / alerting | Alerts |

## Ship logs over OpenTelemetry

Point the Collector's `filelog` receiver at the files Filebeat used to read. It tails,
parses, and forwards over OTLP — no Beats agent required.

```yaml
receivers:
  filelog:
    include: [/var/log/app/*.log]
    operators:
      - type: json_parser
        timestamp:
          parse_from: attributes.ts
          layout: '%Y-%m-%dT%H:%M:%S.%fZ'
exporters:
  otlp:
    endpoint: mindops-collector:4317
    tls:
      insecure: true
service:
  pipelines:
    logs:
      receivers: [filelog]
      exporters: [otlp]
```

## Pipelines instead of Logstash

Logstash's filter chains and Grok patterns become **Collector operators** and **MindOps
log pipelines**. Parse JSON, extract fields with regex, rename keys, and drop noise — the
same transformations, expressed as a pipeline you manage in the UI rather than a Logstash
config file.

| Logstash | MindOps equivalent |
|----------|--------------------|
| `grok { ... }` | Regex / parse operator in a pipeline |
| `mutate { rename }` | Rename/move field in a pipeline |
| `date { ... }` | Timestamp parsing in the receiver |
| `drop { ... }` | Filter/drop step in a pipeline |

## Query in the Log Explorer

Kibana Discover queries become filters in the MindOps Log Explorer. Search by attribute,
aggregate by field, and pivot from a log line straight to the trace that produced it.

## Phased plan

1. **Run the Collector beside Filebeat**, dual-shipping a subset of logs.
2. **Rebuild parsing** for one log source as a pipeline and confirm fields match.
3. **Recreate the saved searches and dashboards** your team relies on.
4. **Migrate sources incrementally**, retiring Logstash configs as you go.
5. **Decommission Elasticsearch and Beats** once parity holds.

:::tip
Start with a high-value log source — one already tied to an incident workflow — so the
trace-to-log correlation pays off immediately.
:::

:::note
Self-hosted MindOps needs no ingestion key. Logs land over OTLP (`:4317`/`:4318`) next to
your traces. See the [Introduction](/introduction/) for the full picture.
:::

Other guides: [Datadog](/migration/from-datadog/),
[New Relic](/migration/from-new-relic/), [Grafana stack](/migration/from-grafana/).
