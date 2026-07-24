---
title: Using an External ClickHouse
description: How and why to point MindOps at an externally managed ClickHouse cluster, including DSN configuration, TLS, and operational trade-offs.
---

By default MindOps runs a bundled ClickHouse container. For larger or more demanding deployments you can point it at an externally managed ClickHouse instead, whether that is a self-operated cluster or a managed cloud offering.

## Why use an external ClickHouse

- **Scale and replication.** A multi-node cluster gives you sharding and replicas that a single bundled container cannot.
- **Separation of concerns.** The database team can own storage, backups, and tuning independently of the MindOps app lifecycle.
- **Managed operations.** A hosted ClickHouse offloads patching, snapshots, and failover.
- **Right-sizing.** Storage-heavy workloads often need dedicated disk and memory profiles that differ from the rest of the stack.

:::note
Externalizing ClickHouse changes nothing about how you ingest telemetry. The collector still listens on OTLP gRPC `:4317` and HTTP `:4318`, and self-hosted ingest still needs no ingestion key.
:::

## Configuration

MindOps reads its telemetry store connection from a DSN supplied through configuration or environment variables. Point it at your external host:

```bash
# Telemetry datastore (ClickHouse) connection
MINDOPS_TELEMETRYSTORE_PROVIDER=clickhouse
MINDOPS_TELEMETRYSTORE_CLICKHOUSE_DSN=tcp://clickhouse.internal:9000?username=mindops&password=REDACTED
```

Then disable the bundled ClickHouse service in your Compose file so two databases do not compete for the same role.

:::caution
The external ClickHouse must be reachable from both the MindOps server and the OpenTelemetry Collector. The collector writes telemetry directly to ClickHouse, so a network path that only the app can reach is not enough.
:::

## Enabling TLS

For any connection that leaves a trusted network, use a TLS-enabled secure port (commonly `9440`):

```bash
MINDOPS_TELEMETRYSTORE_CLICKHOUSE_DSN=tcp://clickhouse.internal:9440?username=mindops&password=REDACTED&secure=true
```

If your cluster uses a private certificate authority, make sure the CA bundle is trusted by the containers, or supply the appropriate `skip_verify`/CA parameters your driver accepts. Avoid disabling verification in production.

## Migration considerations

When moving from the bundled database to an external one:

1. **Create the schema.** Let MindOps start against the empty external instance so it can run its migrations and create the `signoz_traces`, `signoz_logs`, and `signoz_metrics` databases.
2. **Backfill if needed.** Historical data does not move automatically. Use ClickHouse-native backup/restore or `remote()`/`INSERT ... SELECT` to copy existing partitions if you must retain history.
3. **Cut over the collector.** Update the collector's ClickHouse exporter to the same external DSN.
4. **Validate.** Send a test trace and confirm it appears in the UI before retiring the old node.

:::tip
Keep credentials out of source control. Inject the DSN through your secret manager or an `.env` file that is git-ignored, and grant the MindOps user only the databases it needs.
:::

## Operational ownership

With an external store, retention is still configured in MindOps (see [Retention](/mindops-docs/manage/retention-period/)), but disk capacity, backups, and node health become the responsibility of whoever runs the cluster. Document clearly which team owns which layer.
