---
title: Upgrading MindOps
description: How to safely upgrade a self-hosted MindOps deployment by pulling new images, recreating containers, with backups and rollback.
---

Upgrades on a self-hosted MindOps instance follow a pull-and-recreate model: fetch new container images, recreate the services, and let any schema migrations run on startup. Because telemetry data lives in volumes (ClickHouse and Postgres), the containers themselves are disposable.

## Before you start

:::caution
Always back up **before** upgrading. Migrations can alter schemas, and rolling back image versions does not undo a forward migration on its own.
:::

```bash
# Snapshot Postgres metadata (dashboards, alerts, users)
docker compose exec postgres pg_dump -U mindops mindops > mindops-meta.sql

# Snapshot the ClickHouse data volume (stop writes or use native backup)
docker compose exec clickhouse clickhouse-client \
  --query "BACKUP DATABASE signoz_traces TO Disk('backups','traces.zip')"
```

Record the current versions so you have a known-good target to return to:

```bash
docker compose images
```

## The upgrade procedure

1. **Check the changelog** for breaking changes between your version and the target.
2. **Pin the new version.** Update the image tags in your Compose file or `.env` rather than relying on `latest`.
3. **Pull the new images:**

   ```bash
   docker compose pull
   ```

4. **Recreate the services:**

   ```bash
   docker compose up -d --remove-orphans
   ```

   Containers are replaced with the new images; volumes are reattached, so your data persists.

5. **Watch migrations and startup logs:**

   ```bash
   docker compose logs -f mindops
   ```

## Verify version and health

After the stack settles, confirm everything is current and serving.

```bash
# Confirm running image tags
docker compose ps

# UI should respond
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8080
```

The version is also shown in the UI under the settings or about area. Send a test trace and confirm it lands in the explorer.

:::tip
Pin exact version tags in production. `latest` makes it impossible to reproduce a known-good state and turns every `pull` into an unplanned upgrade.
:::

## Rollback

If the new version misbehaves:

1. Set the image tags back to the previous known-good version.
2. Recreate the containers:

   ```bash
   docker compose up -d
   ```

3. If a migration ran and the old version cannot read the new schema, **restore from your pre-upgrade backups**:

   ```bash
   docker compose exec -T postgres psql -U mindops mindops < mindops-meta.sql
   ```

Restore ClickHouse and Postgres together so dashboards and the data they query stay consistent.

## Recommended cadence

- Apply patch releases promptly for fixes and security updates.
- Stage minor and major upgrades in a non-production copy first.
- Keep at least one prior backup retained until the new version has run cleanly for a few days.
