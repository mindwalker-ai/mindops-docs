---
title: Resetting the Admin Password
description: How to reset the administrator or root password on a self-hosted MindOps instance when access is lost.
---

If you have lost the password for an administrator account, or inherited a MindOps instance without working credentials, you can reset access directly against the metadata database. User accounts live in Postgres, so recovery happens there.

:::caution
This procedure requires shell access to the host running MindOps and direct access to the Postgres metadata database. Anyone who can do this effectively controls the instance, so restrict and audit who has it.
:::

## Before you begin

- Identify the email address of the account you need to recover.
- Confirm you can run commands against the MindOps stack (for example via `docker compose`).
- Take a quick Postgres backup so you can undo a mistake:

  ```bash
  docker compose exec postgres pg_dump -U mindops mindops > mindops-meta-before-reset.sql
  ```

## Option 1: Reset from the UI (preferred)

If **any** administrator account still works, the simplest path is to log in with it and reset the other user from the people management screen:

1. Sign in at `http://localhost:8080` as a working admin.
2. Open the user management area under settings.
3. Select the locked-out user and trigger a password reset or send a new invite.

This requires SMTP for email-based resets. See [Inviting team members](/mindops-docs/identity-access/invite-team-members/) for SMTP setup.

## Option 2: Reset via the database

Use this when no administrator login works at all.

1. Open a database shell:

   ```bash
   docker compose exec postgres psql -U mindops mindops
   ```

2. Find the account you want to recover:

   ```sql
   SELECT id, email, created_at FROM users ORDER BY created_at;
   ```

3. Apply a new password using the same hashing scheme MindOps expects. The exact column and hashing helper depend on your version, so prefer the supported reset path your release ships (often a CLI subcommand on the server container):

   ```bash
   docker compose exec mindops mindops users reset-password \
     --email you@example.com
   ```

   The command prompts for a new password and writes a correctly hashed value.

:::note
Always prefer a built-in reset command over hand-editing the hash column. Writing a raw value with the wrong algorithm or salt will silently lock the account further.
:::

## After resetting

1. Log in immediately and confirm access.
2. Rotate the password again from the UI so the final value never appears in shell history.
3. Clear your shell history if any plaintext password was typed:

   ```bash
   history -c
   ```

4. Delete the temporary backup once you have verified everything works.

## Preventing future lockouts

- Keep at least two administrator accounts so a single lost password is never fatal.
- Configure [SSO](/mindops-docs/identity-access/sso-oidc/) so account recovery flows through your identity provider.
- Store break-glass credentials in a shared secret manager, not in one person's head.
