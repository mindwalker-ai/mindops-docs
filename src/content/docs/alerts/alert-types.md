---
title: Alert Types
description: Understand the alert types available in MindOps - metric, log, trace, anomaly, exceptions, and Apdex - and learn when to reach for each one.
---

MindOps lets you turn any signal flowing into ClickHouse into a proactive alert. Picking the right alert type keeps your rules accurate and your on-call rotation calm. This page walks through every type and the situations it fits best.

## The alert catalog

| Type | Evaluates | Typical use |
|------|-----------|-------------|
| Metric | Time series from metrics | SLOs, saturation, throughput, latency percentiles |
| Log | Counts or aggregations over logs | Error keyword spikes, audit events, missing heartbeats |
| Trace | Aggregations over spans | Endpoint error rate, p99 latency, slow dependencies |
| Anomaly | A metric vs. its learned baseline | Traffic that drifts from normal seasonal patterns |
| Exceptions | Captured application exceptions | New or surging crashes and stack traces |
| Apdex | A satisfaction score from latency | User-perceived performance of a service |

## Metric alerts

Metric alerts fire on numeric time series such as CPU usage, request rate, queue depth, or any custom gauge. Use them when you already emit a clean metric and want a static threshold, for example "memory above 85% for 5 minutes."

## Log alerts

Log alerts run an aggregation over your log stream and compare the result to a threshold. They shine when the symptom only appears in text: counting `level=error` lines, watching for a specific message, or alerting when an expected log stops arriving.

## Trace alerts

Trace alerts aggregate over spans, so they understand service, operation, and status. Reach for them to watch an endpoint's error percentage, its p95/p99 duration, or the latency of a downstream call. They are the most direct way to alert on distributed-tracing health.

## Anomaly alerts

Anomaly alerts learn what "normal" looks like for a metric and fire when the live value deviates beyond a configurable band. They are ideal for seasonal or spiky signals where a fixed threshold would either miss problems or page you constantly.

## Exceptions alerts

Exceptions alerts watch the exceptions captured by your instrumentation. Configure them to notify you when a brand-new exception type appears or when a known exception crosses a frequency threshold.

:::tip
Pair an exceptions alert for "new exception" with a trace alert for "error rate" to catch both novel failures and broad regressions.
:::

## Apdex alerts

Apdex condenses latency into a single satisfaction score between 0 and 1 using a target response time. An Apdex alert is the cleanest way to express "users are having a bad time" without juggling raw percentiles.

## Choosing quickly

- Need a hard limit on a number you already emit? **Metric.**
- The evidence lives in log text? **Log.**
- It is about an endpoint or span behavior? **Trace.**
- The metric is seasonal or bursty? **Anomaly.**
- You care about crashes and stack traces? **Exceptions.**
- You want a user-experience score? **Apdex.**

See [Building metric, log & trace alerts](/mindops-docs/alerts/metric-log-trace-alerts/) to assemble your first rule.
