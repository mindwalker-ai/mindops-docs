---
title: Configuring OIDC SSO
description: Set up OpenID Connect single sign-on for MindOps with a generic provider such as Keycloak, including client ID and secret, issuer URL, and redirect URI.
---

OpenID Connect (OIDC) is a modern, OAuth 2.0-based way to bring single sign-on to MindOps. It works with any compliant provider, Keycloak, Auth0, Google, Microsoft Entra ID, and others. MindOps acts as the OIDC client (relying party); your provider issues identity tokens after the user authenticates.

:::note
You need the **Admin** role in MindOps and administrative access to your OIDC provider. The two systems exchange a client ID, a client secret, and an issuer URL.
:::

## What you will exchange

| Value | Direction | Notes |
|-------|-----------|-------|
| Redirect URI (callback) | MindOps → provider | Where the provider returns the user after login |
| Issuer URL | provider → MindOps | Base URL exposing the OIDC discovery document |
| Client ID | provider → MindOps | Public identifier for the MindOps client |
| Client secret | provider → MindOps | Confidential credential for the client |

## Step 1: Note the redirect URI

In MindOps, open **Settings → SSO → OIDC**. The **redirect URI** is derived from your external base URL (set it first, see [Server configuration](/manage/configuration/)). It typically looks like:

```text
https://observe.example.com/api/v1/complete/oidc
```

## Step 2: Register a client in your provider

Using Keycloak as the example:

1. In your realm, create a new **client** with the OpenID Connect protocol.
2. Set the client to **confidential** (it uses a client secret).
3. Add the MindOps **redirect URI** to the allowed/valid redirect URIs.
4. Save, then copy the generated **client ID** and **client secret**.

The provider's **issuer URL** is the realm base, for example:

```text
https://keycloak.example.com/realms/your-realm
```

MindOps reads `.../.well-known/openid-configuration` under that issuer to discover the authorization, token, and JWKS endpoints automatically.

## Step 3: Configure MindOps

Enter the values in the OIDC settings:

```text
Issuer URL:     https://keycloak.example.com/realms/your-realm
Client ID:      mindops
Client secret:  <copied from provider>
Scopes:         openid profile email
```

The `email` scope is required so MindOps can identify the user; `profile` supplies the display name.

## Step 4: Map roles

Configure your provider to include a groups or roles claim in the ID token, then map those values to MindOps roles:

```text
mindops-admins   → Admin
mindops-editors  → Editor
mindops-viewers  → Viewer
```

New users are provisioned on first login with the matching role. See [Roles and permissions](/identity-access/roles-and-permissions/). Give unmatched users a safe default such as Viewer.

## Step 5: Enable and test

1. Save the configuration and **enable** OIDC.
2. Test with a non-admin account in a private browser window.
3. Confirm the user lands in MindOps with the expected role.

:::tip
Keep one local Admin account that bypasses SSO. If the provider connection breaks, that account is how you regain access to fix the configuration.
:::

## Troubleshooting

- **`redirect_uri` mismatch:** the URI in MindOps must exactly match one registered in the provider, scheme, host, and path.
- **Discovery fails:** confirm the issuer URL is reachable from the MindOps server and serves the well-known document.
- **Logged in but no access:** the roles/groups claim is missing or maps to nothing.

Need SAML instead? See [SAML SSO](/identity-access/sso-saml/).
