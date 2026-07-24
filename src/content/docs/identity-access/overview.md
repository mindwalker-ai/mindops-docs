---
title: Identity and Access Overview
description: An overview of the role-based access control model in MindOps, covering users, roles, permissions, and organization scoping.
---

MindOps controls who can see and change what through role-based access control (RBAC). Instead of granting capabilities to individuals one by one, you assign each person a role, and the role carries a defined set of permissions. This keeps access predictable and easy to audit as your team grows.

## The building blocks

| Concept | What it is |
|---------|-----------|
| **User** | An individual account, identified by email, that signs in to MindOps |
| **Role** | A named bundle of permissions (Admin, Editor, Viewer) assigned to a user |
| **Permission** | The right to perform a specific action, granted through a role |
| **Organization** | The top-level tenant boundary that scopes users and data |

## Organization scoping

Everything in MindOps lives inside an **organization**. Users, dashboards, alerts, saved views, and telemetry are all scoped to it. A user belongs to the organization and sees only resources within it. For most self-hosted deployments there is a single organization that represents your whole company.

:::note
Organization scoping is the outer boundary; roles operate *within* it. A Viewer in your organization can read that organization's data but never another tenant's.
:::

## Roles at a glance

MindOps ships three built-in roles:

- **Admin** — full control, including users, settings, and configuration.
- **Editor** — can create and modify observability resources but not manage users.
- **Viewer** — read-only access to dashboards, traces, logs, and metrics.

The complete capability breakdown lives in [Roles and permissions](/identity-access/roles-and-permissions/).

## How users get access

There are several ways to provision people, depending on how your organization is set up:

1. **Email invites** — an admin invites a user and assigns a role. Requires SMTP. See [Inviting team members](/identity-access/invite-team-members/).
2. **Single sign-on** — users authenticate through your identity provider via [SAML](/identity-access/sso-saml/) or [OIDC](/identity-access/sso-oidc/), with roles mapped from IdP attributes.
3. **Service accounts** — non-human identities for automation, authenticated with API keys rather than passwords. See [Service accounts](/identity-access/service-accounts/).

## Principle of least privilege

:::tip
Default new users to **Viewer** and promote only when a concrete need arises. Reserve **Admin** for the small group that actually manages the platform, and prefer SSO group mappings over hand-assigning roles so access stays in sync with your directory.
:::

## Where to go next

- Understand exactly what each role can do: [Roles and permissions](/identity-access/roles-and-permissions/)
- Add your teammates: [Invite team members](/identity-access/invite-team-members/)
- Automate access for scripts and pipelines: [Service accounts](/identity-access/service-accounts/)
- Centralize authentication: [SAML SSO](/identity-access/sso-saml/) or [OIDC SSO](/identity-access/sso-oidc/)
