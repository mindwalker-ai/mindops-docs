---
title: Configuring SAML SSO
description: Set up SAML single sign-on for MindOps with a generic identity provider such as Okta, Entra ID, or JumpCloud, including ACS URL, entity ID, and attribute mapping.
---

SAML single sign-on lets your team authenticate to MindOps through your existing identity provider (IdP) instead of separate passwords. MindOps acts as the service provider (SP); your IdP, Okta, Microsoft Entra ID, JumpCloud, or any SAML 2.0 provider, handles login and sends back a signed assertion.

:::note
Configuring SSO requires the **Admin** role and access to your identity provider's admin console. Have both open while you work; the two sides exchange values.
:::

## What you will exchange

| Value | Direction | Notes |
|-------|-----------|-------|
| ACS (Assertion Consumer Service) URL | SP → IdP | Where the IdP posts the SAML response |
| Entity ID (SP) | SP → IdP | Unique identifier for MindOps as a service provider |
| IdP metadata / certificate | IdP → SP | Signing certificate and SSO endpoint |
| Attribute statements | IdP → SP | Email, name, and group/role claims |

## Step 1: Gather the SP values from MindOps

In MindOps, open **Settings → SSO → SAML** and note the **ACS URL** and **Entity ID**. They are derived from your external base URL, so make sure that is set correctly first (see [Server configuration](/mindops-docs/manage/configuration/)). They typically look like:

```text
ACS URL:    https://observe.example.com/api/v1/complete/saml
Entity ID:  https://observe.example.com
```

## Step 2: Create the application in your IdP

1. In your IdP, create a new **SAML 2.0** application.
2. Paste the **ACS URL** (sometimes called *Reply URL* or *SSO URL*).
3. Paste the **Entity ID** (sometimes called *Audience URI* or *SP Entity ID*).
4. Set the **Name ID** format to the user's email address.

## Step 3: Map attributes

MindOps needs at least the user's email. Map these claims in the IdP:

| MindOps expects | Map from |
|-----------------|----------|
| `email` | User email / `user.email` |
| `name` | Display name |
| `groups` (optional) | Group membership, for role mapping |

## Step 4: Map groups to roles

To assign MindOps roles automatically, send a `groups` attribute and map each group to a role in the MindOps SAML settings:

```text
mindops-admins   → Admin
mindops-editors  → Editor
mindops-viewers  → Viewer
```

Users land in MindOps with the role matching their IdP group. See [Roles and permissions](/mindops-docs/identity-access/roles-and-permissions/) for what each grants. If no group matches, assign a safe default such as Viewer.

## Step 5: Finish in MindOps

1. Copy the IdP's **SSO URL** and **signing certificate** (or metadata XML) into the MindOps SAML configuration.
2. Save and **enable** SAML.
3. Test with a non-admin account in a private browser window before rolling it out.

:::tip
Keep one local Admin account that does not depend on SSO. If the IdP connection breaks, that break-glass login is how you get back in to fix it.
:::

## Troubleshooting

- **Assertion fails to validate:** the signing certificate in MindOps does not match the IdP's current certificate.
- **Redirect loops or wrong host:** the external base URL does not match the ACS URL registered in the IdP.
- **User logs in but has no access:** the `groups` claim is missing or no group maps to a role.

Prefer a different protocol? See [OIDC SSO](/mindops-docs/identity-access/sso-oidc/).
