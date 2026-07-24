---
title: Operating Self-Hosted MindOps
description: A day-2 operations guide covering upgrades, ClickHouse, retention, configuration, and user management for a self-hosted MindOps deployment.
---

Running MindOps yourself means you own the full telemetry pipeline: the collector that ingests OTLP, ClickHouse where traces, metrics, and logs live, Postgres for application metadata, and the MindOps server and UI. This page is the map for keeping that stack healthy after the first successful install.

## What you are operating

| Component | Role | Notes |
|-----------|------|-------|
| OpenTelemetry Collector | Receives OTLP on gRPC `:4317` and HTTP `:4318` | No ingestion key needed when self-hosted |
| ClickHouse | Columnar store for traces, logs, metrics | The largest disk consumer |
| Postgres | Dashboards, alerts, users, saved views | Small but must be backed up |
| MindOps server + UI | Query API and web app at `http://localhost:8080` | Stateless; safe to recreate |

:::note
The installer `foundryctl` provisions all of these together with Docker. Treat the Compose/stack definition it generates as the source of truth for your environment.
:::

## Day-2 checklist

Work through these areas regularly rather than only when something breaks.

### Upgrades

Pull new images and recreate containers on a cadence that matches your risk tolerance. Always snapshot ClickHouse and Postgres first. See [Upgrading MindOps](/mindops-docs/manage/upgrade/) for the full procedure and rollback steps.

### Storage and retention

Disk is the resource most likely to surprise you. Set sane [retention periods](/mindops-docs/manage/retention-period/) per signal and watch ClickHouse volume growth. The [ClickHouse operations guide](/mindops-docs/manage/clickhouse/) explains where data lives and how to grow the volume.

### Configuration

Server behavior, datastore DSNs, SMTP, and the external URL are all driven by config and environment variables. Review [Configuration](/mindops-docs/manage/configuration/) before changing anything in production, and keep your config under version control.

### Users and access

Provision people through roles, not shared logins. The [Identity and Access overview](/mindops-docs/identity-access/overview/) describes the RBAC model; invite teammates only after SMTP is configured.

## A healthy-instance routine

```bash
# Are all containers up and healthy?
docker compose ps

# Tail the MindOps server for errors
docker compose logs --tail=100 mindops

# Confirm the collector is accepting OTLP
curl -s http://localhost:13133/   # collector health extension
```

:::tip
Send a synthetic trace from a test service after every upgrade. If it appears in the UI within a minute, your ingest path, ClickHouse writes, and query layer are all working end to end.
:::

## When to scale out

A single-node Docker deployment comfortably handles small-to-medium workloads. Consider moving ClickHouse to a [dedicated or externally managed cluster](/mindops-docs/manage/external-clickhouse/) when ingest volume saturates local disk I/O, when you need replication, or when retention requirements outgrow one machine.

## Backups in one line

- **ClickHouse**: snapshot the data volume or use native backups before upgrades.
- **Postgres**: regular `pg_dump` of the metadata database protects dashboards and alerts.
- **Config**: keep your `.env` and server config in a private repo.

Treat all three as a set. Restoring ClickHouse without its matching metadata leaves dangling dashboards.
