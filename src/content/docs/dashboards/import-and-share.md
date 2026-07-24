---
title: Import and Share Dashboards
description: Import a MindOps dashboard from JSON, export and version it in git, and share boards across environments and teams.
---

MindOps dashboards are portable. Each one serializes to a JSON document you can import, export, version-control, and share. This makes it easy to move a board between environments or seed a new MindOps instance.

## Import a dashboard from JSON

1. Go to **Dashboards** in the MindOps UI.
2. Click **New** then choose **Import JSON**.
3. Paste the JSON, or upload a `.json` file.
4. Review the preview and click **Import**.

The dashboard appears immediately with all panels, variables, and layout intact.

:::caution
Imported panels reference metric, log, and trace attributes by name. If the target environment uses different attribute names (for example `service.name` vs `service_name`), update the queries after import.
:::

## Export a dashboard

Open a dashboard, go to its settings menu, and choose **Export JSON**. You get the full definition — panels, queries, variables, and grid positions — as a single file. This is also the safest way to back up a board before deleting or heavily editing it.

## Version dashboards in git

Treating dashboards as code keeps changes reviewable and reproducible.

```text
repo/
  dashboards/
    apm-checkout.json
    hostmetrics.json
    postgres.json
```

A typical workflow:

```bash
# export from the UI, then commit the change
git add dashboards/apm-checkout.json
git commit -m "dashboard: add p99 latency panel to checkout APM"
```

Because the file is plain JSON, pull requests show exactly which panels and queries changed.

:::tip
Keep variables generic (`{{env}}`, `{{service}}`) in the committed JSON so the same file imports cleanly into dev, staging, and prod.
:::

## Share within MindOps

- **Link sharing** — Copy the dashboard URL. The current time range and selected variable values are encoded in the URL, so a teammate opens exactly what you see.
- **Cloning** — Use **Clone** to give someone an editable starting copy without touching the original.

## Public sharing

For read-only access outside your team, MindOps supports sharing a dashboard via a generated link or by embedding it. Treat any public link as sensitive — it exposes operational data — and restrict it to trusted audiences.

:::danger
Never put credentials, customer identifiers, or other secrets into panel titles, descriptions, or hard-coded query filters. These travel with the exported JSON and any shared link.
:::

## Recommended flow

1. Build and refine the dashboard in the UI.
2. Export the JSON and commit it to git.
3. Import the committed JSON into other environments.
4. Adjust variables per environment rather than forking the file.

For organizing the boards you import, see [Manage Dashboards](/dashboards/manage-dashboards/) and the ready-made [Templates](/dashboards/templates/).
