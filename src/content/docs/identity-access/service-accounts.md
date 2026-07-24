---
title: Service Accounts and API Keys
description: Create and use API keys for programmatic access to MindOps, including the request header, scopes, and key rotation.
---

Service accounts give scripts, CI pipelines, and integrations a way to talk to MindOps without a human logging in. Instead of a password and an interactive session, a service account authenticates with an **API key** sent on every request.

## When to use a service account

- Automating dashboard or alert creation from infrastructure-as-code.
- Querying telemetry from a scheduled job or report generator.
- Wiring MindOps into a custom internal tool.
- Any access path where storing a person's password would be wrong.

:::note
Service accounts are for machines. For people, use [email invites](/mindops-docs/identity-access/invite-team-members/) or SSO so that access is tied to an individual who can be offboarded.
:::

## Creating an API key

You must be an **Admin** to manage API keys.

1. Sign in to MindOps at `http://localhost:8080`.
2. Open **Settings → API keys** (or the service accounts section).
3. Choose **Create key**.
4. Give it a descriptive **name** (for example `ci-dashboard-sync`).
5. Select a **role/scope** that matches the least privilege needed, see scopes below.
6. Optionally set an **expiry**.
7. Create the key and **copy it immediately**.

:::caution
The key is shown only once at creation time. MindOps stores a hash, not the raw value, so it cannot be retrieved later. If you lose it, revoke the key and create a new one.
:::

## Scopes

A key inherits a role, so it carries the same capabilities as that role from the [permission matrix](/mindops-docs/identity-access/roles-and-permissions/):

| Scope | Use for |
|-------|---------|
| Viewer | Read-only queries, exports, reporting |
| Editor | Creating or updating dashboards, alerts, pipelines |
| Admin | Full management automation (use rarely) |

Match the scope to the job. A reporting script should hold a Viewer key, not an Admin one.

## Using the key

Send the key on every request using the `MINDOPS-API-KEY` header:

```bash
curl -sS http://localhost:8080/api/v1/dashboards \
  -H "MINDOPS-API-KEY: <your-api-key>"
```

A scripted example:

```bash
export MINDOPS_API_KEY="<your-api-key>"

curl -sS http://localhost:8080/api/v1/dashboards \
  -H "MINDOPS-API-KEY: ${MINDOPS_API_KEY}"
```

:::tip
Inject the key from a secret manager or CI secret store, never commit it to source. Treat it like a password with the privileges of its assigned role.
:::

## Rotating and revoking

- **Rotate** on a schedule: create a new key, switch your automation to it, then revoke the old one.
- **Revoke** immediately if a key is exposed in logs, a repo, or a screenshot.
- **Set expiry** on keys you know are temporary so they clean themselves up.

Revoking a key takes effect at once; any caller still using it receives an authentication error on the next request.
