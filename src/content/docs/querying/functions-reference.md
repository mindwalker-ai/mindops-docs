---
title: Functions Reference
description: MindOps extended-analysis functions - EWMA smoothing, time shift, cutoff min/max, and math functions (log, exp, sqrt) - how to chain them and when to use each.
---

Beyond aggregation, MindOps offers a set of post-processing functions that transform a query's result series before it is plotted. They run *after* aggregation and group-by, reshaping each series for smoothing, comparison, clipping, or scaling.

## Where functions apply

A function takes the series produced by your [Query Builder](/mindops-docs/querying/query-builder/) query and returns a new series. You add them as a function step on the query, and you can stack several — they apply in order, top to bottom.

## Smoothing functions

### EWMA (exponentially weighted moving average)

EWMA smooths a noisy series by weighting recent points more heavily than older ones, controlled by a smoothing factor (alpha). Use it to reveal a trend hidden under spiky data.

```text
Query: rate(http_server_requests_total)
Function: EWMA(alpha = 0.3)
```

:::tip
A lower alpha smooths harder (slower to react); a higher alpha tracks the raw signal more closely. Start around 0.2–0.4 and tune to taste.
:::

## Comparison functions

### Time shift

Time shift moves a series backward in time so you can overlay it on the current one — perfect for week-over-week or day-over-day comparisons.

```text
Query A: rate(http_server_requests_total)         # this week
Query B: rate(http_server_requests_total)
Function on B: timeShift(1w)                       # last week, overlaid
```

## Clipping functions

### Cutoff min / cutoff max

These clamp a series to a floor or ceiling, dropping or capping values outside a band. Useful to ignore noise below a threshold or to cap outliers that distort the axis.

| Function | Effect |
|----------|--------|
| `cutOffMin(n)` | Remove/clamp values below `n` |
| `cutOffMax(n)` | Remove/clamp values above `n` |

```text
Query: system_disk_io
Function: cutOffMin(0)        # ignore negative noise
```

## Math functions

Apply an element-wise transform to every point.

| Function | Use |
|----------|-----|
| `log` | Compress a wide dynamic range onto a readable scale |
| `exp` | Inverse of log |
| `sqrt` | Soften large values while keeping order |

```text
Query: bytes_sent_total
Function: log
```

:::note
Math functions change the meaning of the axis. Label the panel clearly (for example "log(bytes)") so viewers do not misread absolute values.
:::

## Chaining functions

Functions compose. Each one consumes the previous output, so order matters:

```text
Query: rate(http_server_requests_total)
1. cutOffMin(0)     # drop negative noise first
2. EWMA(0.3)        # then smooth the cleaned series
```

Smoothing after clipping gives a cleaner trend than smoothing first and clipping the already-blended values.

:::caution
Heavy smoothing and clipping can hide real incidents — a clamped or EWMA'd series may mask a brief spike. Use these for trend dashboards, but alert on the raw, unsmoothed query.
:::

For the aggregation step that produces the series these functions transform, see [Aggregation and Grouping](/mindops-docs/querying/aggregation-grouping/).
