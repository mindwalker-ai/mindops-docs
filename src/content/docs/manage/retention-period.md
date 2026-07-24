---
title: Setting Retention Periods
description: Configure how long MindOps keeps traces, logs, and metrics from the UI, and understand the disk implications of each setting.
---

Retention controls how long MindOps keeps each kind of telemetry before deleting it. Because traces, logs, and metrics have very different volumes and value over time, MindOps lets you set retention independently for each signal.

## Default retention

Out of the box, MindOps retains **traces, logs, and metrics for 15 days**. This is a practical starting point: long enough to investigate most incidents, short enough to keep disk usage modest on a single-node deployment.

:::note
Retention is enforced by ClickHouse TTL rules. When data ages past the configured window, ClickHouse drops the corresponding partitions automatically during background merges.
:::

## Changing retention in the UI

1. Sign in to MindOps at `http://localhost:8080`.
2. Open **Settings → Retention** (administrator access required).
3. Set the retention window for each signal:
   - **Traces**
   - **Logs**
   - **Metrics**
4. Save. The new TTL is applied to the underlying tables.

You can set different values per signal. A common pattern is short trace retention with longer metric retention, since aggregated metrics cost far less per day than raw spans.

## Choosing values

| Signal | Typical range | Why |
|--------|---------------|-----|
| Traces | 7–15 days | High volume, most useful for recent debugging |
| Logs | 7–30 days | Volume varies widely with log level |
| Metrics | 30–90+ days | Cheap to store, valuable for long-term trends |

:::tip
Cut log noise at the source. Dropping debug-level logs in the collector before they reach ClickHouse is usually more effective than shortening retention after the fact.
:::

## Disk implications

Retention is the main lever you have over storage growth. Daily disk usage is roughly your ingest rate multiplied by your retention window, so doubling retention roughly doubles steady-state disk for that signal.

Before increasing any retention window:

1. Check current per-signal usage with the queries in the [ClickHouse guide](/mindops-docs/manage/clickhouse/).
2. Confirm you have headroom on the data volume.
3. Increase retention gradually and watch growth over a few days.

:::caution
Shortening retention deletes data older than the new window, and that deletion is permanent. If you need an audit trail or compliance archive, export or back up that data before reducing retention.
:::

## Applying changes

A retention change does not instantly purge data. ClickHouse removes expired partitions during its normal background merge cycle, so reclaimed space appears gradually rather than all at once. If you need space urgently, you can drop old partitions manually, but for routine operation the automatic TTL cleanup is sufficient.

For deployments using an [external ClickHouse](/mindops-docs/manage/external-clickhouse/), retention is still configured here in MindOps, but make sure the cluster has enough disk to honor the windows you set.
