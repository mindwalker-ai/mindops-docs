---
title: Server Configuration
description: Key configuration file settings and environment variables for MindOps, including datastore DSNs, SMTP, Alertmanager, JWT secret, and external URL.
---

MindOps is configured through a combination of a server config file and environment variables. Environment variables are the most common way to run it under Docker, and they override file defaults. This page covers the settings you are most likely to change.

:::caution
Configuration includes secrets such as datastore passwords and the JWT signing key. Keep your `.env` file out of version control and inject secrets through your secret manager in production.
:::

## Datastore connections

MindOps uses two stores: Postgres for metadata (the SQL store) and ClickHouse for telemetry (the telemetry store).

```bash
# Metadata store (Postgres): dashboards, alerts, users
MINDOPS_SQLSTORE_PROVIDER=postgres
MINDOPS_SQLSTORE_POSTGRES_DSN=postgresql://mindops:REDACTED@postgres:5432/mindops

# Telemetry store (ClickHouse): traces, logs, metrics
MINDOPS_TELEMETRYSTORE_PROVIDER=clickhouse
MINDOPS_TELEMETRYSTORE_CLICKHOUSE_DSN=tcp://clickhouse:9000?username=mindops&password=REDACTED
```

To use a managed database instead of the bundled containers, point these DSNs elsewhere. See [Using an external ClickHouse](/mindops-docs/manage/external-clickhouse/) for the telemetry side.

## External URL

If users reach MindOps through a domain or reverse proxy rather than `localhost`, set the public base URL so generated links, invite emails, and SSO callbacks are correct:

```bash
MINDOPS_BASE_URL=https://observe.example.com
```

:::note
The external URL must match what your identity provider and email recipients actually use. A mismatch breaks SSO redirects and invite links even when everything else is correct.
:::

## JWT secret

Sessions are signed with a JWT secret. Set a strong, random value and keep it stable, rotating it invalidates existing sessions.

```bash
MINDOPS_JWT_SECRET=$(openssl rand -hex 32)
```

## SMTP for email

Email invites and password resets require an SMTP relay.

```bash
MINDOPS_SMTP_HOST=smtp.example.com
MINDOPS_SMTP_PORT=587
MINDOPS_SMTP_USERNAME=mindops@example.com
MINDOPS_SMTP_PASSWORD=REDACTED
MINDOPS_SMTP_FROM=observability@example.com
```

Without working SMTP, you cannot send [team invites](/mindops-docs/identity-access/invite-team-members/) and must add users another way.

## Alertmanager

MindOps routes alert notifications through an Alertmanager. The bundled stack includes one; point at an external Alertmanager if you already operate one:

```bash
MINDOPS_ALERTMANAGER_URL=http://alertmanager:9093
```

## Applying configuration

After editing environment variables or the config file, recreate the affected services so they pick up the changes:

```bash
docker compose up -d
```

:::tip
Keep a documented, version-controlled template (`.env.example`) listing every variable with placeholder values. It makes new environments reproducible and onboarding far easier.
:::

## Verifying

Check the server logs after a config change to confirm it started cleanly and connected to both datastores:

```bash
docker compose logs --tail=50 mindops
```

A successful start shows connections to Postgres and ClickHouse and the UI responding on port `8080`.
