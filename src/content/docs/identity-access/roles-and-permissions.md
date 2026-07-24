---
title: Roles and Permissions
description: The built-in MindOps roles (Admin, Editor, Viewer), what each can do, and a permission matrix for common actions.
---

MindOps groups capabilities into three built-in roles. Each user is assigned exactly one role within the organization, and that role determines which actions they can perform. Understanding the boundaries between roles is the key to giving people the access they need and nothing more.

## The three roles

### Admin

Admins have full control over the organization. In addition to everything Editors and Viewers can do, they manage users, roles, integrations, SSO, retention, and other platform settings. Treat Admin as a privileged role and grant it sparingly.

### Editor

Editors build and maintain observability content. They can create and edit dashboards, alerts, saved views, and pipelines, and they have full read access to telemetry. They cannot manage other users or change organization-wide settings.

### Viewer

Viewers have read-only access. They can explore traces, logs, and metrics, open dashboards, and view alert state, but they cannot change anything. This is the right default for stakeholders who consume observability data without owning it.

## Permission matrix

| Capability | Viewer | Editor | Admin |
|------------|:------:|:------:|:-----:|
| View traces, logs, metrics | Yes | Yes | Yes |
| Open and use dashboards | Yes | Yes | Yes |
| View alerts and their state | Yes | Yes | Yes |
| Create / edit dashboards | No | Yes | Yes |
| Create / edit alert rules | No | Yes | Yes |
| Configure ingestion pipelines | No | Yes | Yes |
| Manage saved views | No | Yes | Yes |
| Invite or remove users | No | No | Yes |
| Assign or change roles | No | No | Yes |
| Configure SSO / SAML / OIDC | No | No | Yes |
| Change retention settings | No | No | Yes |
| Manage service accounts / API keys | No | No | Yes |
| Edit organization settings | No | No | Yes |

:::note
Permissions are additive up the chain: an Editor can do everything a Viewer can, and an Admin can do everything an Editor can, plus the management capabilities listed above.
:::

## Choosing the right role

- **Give Viewer** to anyone who needs to read data: developers checking on a service, managers watching dashboards, on-call responders who only investigate.
- **Give Editor** to people who own dashboards, alerts, or the ingest configuration for their team.
- **Give Admin** only to the platform owners who manage users, settings, and access.

:::tip
When using [SAML](/mindops-docs/identity-access/sso-saml/) or [OIDC](/mindops-docs/identity-access/sso-oidc/) SSO, map identity-provider groups to these roles so access reflects your directory automatically. A user who leaves a group loses the matching role on their next sign-in.
:::

## Changing a user's role

An Admin can change any user's role from the user management screen under settings. The change takes effect on the user's next session. Demoting a user never deletes their content; dashboards and alerts they created remain owned by the organization.

For how roles are assigned when adding people, see [Inviting team members](/mindops-docs/identity-access/invite-team-members/).
