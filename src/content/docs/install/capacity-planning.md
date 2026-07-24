---
title: Capacity Planning
description: Size CPU, memory, and disk for MindOps based on telemetry volume, with ClickHouse as the dominant component and retention as the main disk driver.
---

MindOps capacity planning is mostly ClickHouse capacity planning. The collector and query service are stateless and cheap to scale; the storage layer is what you size carefully. This page gives starting points and the levers that matter.

## What drives resource usage

| Resource | Primary driver |
| --- | --- |
| **Disk** | Ingest volume multiplied by retention window. |
| **CPU** | Query concurrency and ingest rate. |
| **Memory** | ClickHouse working set and query complexity. |

ClickHouse dominates all three. Plan it first, then add modest headroom for the other components.

## Estimating disk

Disk is the most predictable dimension. Estimate it from daily ingest and retention:

```text
disk ≈ daily_ingest_GB × retention_days × (1 / compression) + overhead
```

ClickHouse compresses telemetry well, often 8–12x, so columnar storage is far smaller than raw OTLP. A rough planning model:

| Signal | Typical compressed cost | Notes |
| --- | --- | --- |
| Spans | Highest volume in most systems | Sampling reduces this directly. |
| Logs | High, varies wildly | Verbose apps dominate disk. |
| Metrics | Lowest per point | Cardinality, not volume, is the risk. |

:::tip
Set per-signal retention. Keep traces and logs short (for example 7–15 days) and metrics longer (30–90 days), since metrics are cheap to store and valuable for trend analysis.
:::

## Sizing tiers

These are conservative starting points for a single-node ClickHouse. Adjust after observing real usage.

| Tier | Approx. ingest | ClickHouse CPU | ClickHouse RAM | Disk (15-day) |
| --- | --- | --- | --- | --- |
| Trial / dev | < 5 GB/day | 2 cores | 4 GB | 50 GB |
| Small prod | 20–50 GB/day | 4 cores | 16 GB | 500 GB |
| Medium prod | 100–300 GB/day | 8+ cores | 32–64 GB | 2–5 TB |

The collector and query service typically need 1–2 cores and 1–2 GB each per replica.

## Levers to control cost

### Sampling

Reduce trace volume at the source with head or tail sampling in the collector. Sampling is the single most effective way to cut span storage.

### Cardinality control

High-cardinality metric attributes explode the number of time series. Drop or aggregate unbounded labels (user IDs, full URLs) before they reach ClickHouse.

:::caution
A single unbounded metric label can multiply your time-series count by thousands and overwhelm memory. Audit metric attributes before scaling ingest. See [core concepts](/mindops-docs/overview/core-concepts/) on cardinality.
:::

### Retention

Shortening retention reclaims disk immediately as old partitions drop. It is the fastest lever when disk runs low.

## Scaling tips

- **Scale the collector horizontally** behind a load balancer when ingest rises; it is stateless.
- **Give ClickHouse fast disks** (SSD/NVMe). I/O is usually the bottleneck before CPU.
- **Watch ClickHouse memory** during heavy queries; raise RAM before adding CPU.
- **Separate stateful nodes** from stateless ones so query spikes do not starve ingest.

## Monitoring the monitor

Track ClickHouse disk usage, ingest lag, and query latency over time. When disk trends toward your ceiling, either shorten retention, add sampling, or grow the volume. Plan capacity reviews alongside the [architecture](/mindops-docs/overview/architecture/) you deployed.
