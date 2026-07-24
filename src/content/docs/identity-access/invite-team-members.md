---
title: Inviting Team Members
description: How to invite users to MindOps by email and assign them a role, including the SMTP requirement for sending invitations.
---

The most common way to add people to MindOps is to invite them by email. An administrator sends an invitation, the recipient follows a link to set their password, and they join the organization with the role you chose.

## Prerequisite: SMTP

:::caution
Email invitations require a working SMTP relay. If MindOps cannot send mail, invites are created but never delivered. Configure SMTP first, see [Server configuration](/mindops-docs/manage/configuration/) for the relevant environment variables.
:::

A quick way to confirm SMTP is wired up: send one invite to an address you control and verify the message arrives.

## Sending an invitation

You must be an **Admin** to invite users.

1. Sign in to MindOps at `http://localhost:8080`.
2. Open the user management area under settings (often **Settings → Members** or **Users**).
3. Choose **Invite member**.
4. Enter the recipient's **email address**.
5. Select the **role** to assign: Viewer, Editor, or Admin. See [Roles and permissions](/mindops-docs/identity-access/roles-and-permissions/) for what each can do.
6. Send the invite.

The recipient receives an email with a link to accept. After they set a password, they appear in your members list with the assigned role.

## Inviting several people

You can invite multiple addresses in one pass. Assign roles deliberately rather than giving everyone the same level:

| Who | Suggested role |
|-----|----------------|
| Engineers who debug services | Viewer or Editor |
| Dashboard and alert owners | Editor |
| Platform / observability owners | Admin |

:::tip
Default invitations to **Viewer**. It is faster to promote someone who asks for more than to discover later that too many people had Admin.
:::

## Managing pending and existing invites

From the members screen an Admin can:

- See who has a **pending** invite that has not been accepted yet.
- **Resend** an invitation if the original email was missed or expired.
- **Revoke** a pending invite to cancel access before it is accepted.
- **Change the role** of an existing member at any time.
- **Remove** a member who no longer needs access.

## If you cannot use email

When SMTP is not available, or you are bootstrapping the very first account, you have two alternatives:

- Configure [SAML](/mindops-docs/identity-access/sso-saml/) or [OIDC](/mindops-docs/identity-access/sso-oidc/) SSO so users sign in through your identity provider and are provisioned on first login.
- For automation rather than people, create a [service account](/mindops-docs/identity-access/service-accounts/) with an API key.

## Troubleshooting

- **Invite never arrives:** check spam, then verify SMTP credentials and the `MINDOPS_SMTP_*` settings.
- **Accept link is broken:** confirm the external base URL is set correctly so links point at the real host. See [Server configuration](/mindops-docs/manage/configuration/).
- **User cannot do something:** check their role against the [permission matrix](/mindops-docs/identity-access/roles-and-permissions/).
