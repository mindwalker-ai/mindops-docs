---
title: Anomaly & Exceptions Alerts
description: Use anomaly alerts with an automatic baseline and deviation bands, and exceptions alerts for new or frequent exceptions - and learn when each one fits best.
---

Some problems do not respect a fixed threshold. Traffic that triples every morning, or a crash that has never been seen before, need alerts that adapt. MindOps offers two such types: anomaly alerts and exceptions alerts.

## Anomaly alerts

An anomaly alert compares a live metric against a baseline that MindOps learns from history, then fires when the value strays outside an allowed band.

### How the baseline works

MindOps studies the metric's recent behavior, including its daily and weekly rhythm, to predict an expected value for each moment. Instead of one flat line, you get a moving prediction that already accounts for the lunchtime rush or the quiet weekend.

### Deviation and sensitivity

You configure how far the live value may stray before it counts as anomalous, expressed as a number of deviations from the baseline. A tighter band catches subtle drift but pages more often; a wider band only reacts to dramatic swings.

| Setting | Effect |
|---------|--------|
| Deviation (z) | How many standard deviations define the edge of "normal" |
| Direction | Alert above, below, or on either side of the baseline |
| For duration | How long the deviation must persist before firing |
| Seasonality | The rhythm to learn (hourly, daily, weekly) |

```text
Anomaly rule: checkout request rate
  baseline: weekly seasonality
  deviation: 3
  direction: below baseline   # detect a traffic drop-off
  for: 10 minutes
  severity: warning
```

:::tip
Anomaly alerts are perfect for business metrics like sign-ups or orders, where a sudden drop matters more than any absolute number.
:::

### When to use anomaly alerts

- The metric is seasonal or bursty and a static threshold mis-fires.
- You care about relative change ("much higher than usual") not an exact value.
- You want one rule to cover a metric whose normal range drifts over time.

## Exceptions alerts

An exceptions alert watches the exceptions your instrumentation captures - the exception type, message, and stack trace recorded alongside traces.

### New exception

Fire the moment an exception type appears that has not been observed in a chosen lookback window. This surfaces fresh regressions right after a deploy, before users start complaining.

### Frequent exception

Fire when a known exception crosses a rate you define, for example more than 50 occurrences in 5 minutes. This separates a rare, tolerable glitch from a runaway failure.

```text
Exceptions rule: new exception
  scope: service = payments
  lookback: 24h
  severity: error

Exceptions rule: frequent exception
  scope: service = payments
  condition: count is above 50 in 5 minutes
  severity: critical
```

### When to use exceptions alerts

- You are deploying often and want early warning on brand-new crashes.
- A specific known error is acceptable in small doses but dangerous in volume.
- You want to alert on stack-trace-level failures without writing a log query.

## Choosing between them

Use an **anomaly** alert when the question is "is this number behaving unusually?" Use an **exceptions** alert when the question is "is the application throwing something new or throwing too much?" They complement each other well: anomaly for trends, exceptions for failures. For static limits, return to [metric, log & trace alerts](/alerts/metric-log-trace-alerts/).
