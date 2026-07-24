---
title: Operating ClickHouse
description: Where MindOps telemetry data lives in ClickHouse, how to grow the persistent volume, connect with clickhouse-client, and run basic health queries.
---

ClickHouse is the analytical database behind MindOps. Every span, log line, and metric sample is written here, which makes it both the heart of the platform and the component that consumes the most disk. This page covers the operational basics.

## Where the data lives

MindOps organizes telemetry into separate ClickHouse databases by signal:

| Database | Holds |
|----------|-------|
| `signoz_traces` | Distributed trace spans and indexes |
| `signoz_logs` | Structured and raw log records |
| `signoz_metrics` | Time-series metric samples |
| `signoz_metadata` | Internal bookkeeping for the above |

On disk, ClickHouse stores everything under its data directory (typically `/var/lib/clickhouse` inside the container), which is mapped to a Docker volume so data survives container recreation.

:::note
The database names retain their upstream `signoz_*` prefixes internally. This is an implementation detail of the storage engine and does not change how you use MindOps.
:::

## Connecting with clickhouse-client

Open a SQL shell inside the running container:

```bash
docker compose exec clickhouse clickhouse-client
```

Then explore:

```sql
SHOW DATABASES;
USE signoz_traces;
SHOW TABLES;
```

## Basic health queries

Check how much disk each signal is using:

```sql
SELECT
    database,
    formatReadableSize(sum(bytes_on_disk)) AS size,
    sum(rows) AS rows
FROM system.parts
WHERE active AND database LIKE 'signoz_%'
GROUP BY database
ORDER BY sum(bytes_on_disk) DESC;
```

Confirm recent ingest is flowing:

```sql
SELECT max(timestamp) AS latest_span
FROM signoz_traces.distributed_signoz_index_v3;
```

Spot any tables that have stopped merging or are growing oddly:

```sql
SELECT table, count() AS parts
FROM system.parts
WHERE active AND database LIKE 'signoz_%'
GROUP BY table
ORDER BY parts DESC;
```

:::tip
A steadily rising part count on a single table can indicate merges falling behind. Check `system.merges` and CPU headroom before assuming a data problem.
:::

## Growing the persistent volume

When ClickHouse approaches its disk limit, expand the underlying storage rather than deleting data ad hoc.

1. **Reduce retention first.** Often the cheapest fix is lowering [retention periods](/manage/retention-period/) so old data is dropped.
2. **Expand the volume.** If you use a host bind mount, grow the host filesystem (or move it to a larger disk). For a managed volume, resize it in your cloud provider, then restart ClickHouse.
3. **Verify free space inside the container:**

   ```bash
   docker compose exec clickhouse df -h /var/lib/clickhouse
   ```

:::caution
Never delete files under the ClickHouse data directory by hand to reclaim space. Use `ALTER TABLE ... DROP PARTITION`, TTL settings, or retention configuration so the engine stays consistent.
:::

## When one node is not enough

If a single node can no longer keep up with ingest or retention demands, point MindOps at a [dedicated or externally managed ClickHouse cluster](/manage/external-clickhouse/) that supports replication and sharding.
