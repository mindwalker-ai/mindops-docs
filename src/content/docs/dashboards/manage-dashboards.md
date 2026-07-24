---
title: Manage Dashboards
description: Create, edit, organize, and clone MindOps dashboards. Add panels, arrange layout, set the time range, and configure auto-refresh.
---

Dashboards in MindOps let you assemble panels backed by metrics, logs, and traces into a single view. This page covers the full lifecycle: creating a dashboard, adding panels, arranging layout, controlling time, and cloning.

## Create a dashboard

1. Open the MindOps UI at `http://localhost:8080` and go to **Dashboards**.
2. Click **New Dashboard**.
3. Give it a name and an optional description, then save.

Each dashboard belongs to your workspace and can be edited by any user with the right role.

:::tip
Use a descriptive name and tags (for example `team:payments`, `env:prod`) so dashboards stay findable as your catalog grows.
:::

## Add and configure panels

Inside an open dashboard, click **Add Panel** and choose a panel type (see [Panel Types](/mindops-docs/dashboards/panel-types/)). For each panel:

- Pick the **data source** — metrics, logs, or traces.
- Build the query in the [Query Builder](/mindops-docs/querying/query-builder/), or switch to ClickHouse / PromQL mode.
- Set a panel **title**, unit, and legend format.
- Save the panel to drop it onto the dashboard grid.

A single panel can hold multiple queries (`A`, `B`, `C`) plus formulas, so you can overlay related series.

## Arrange the layout

Panels sit on a drag-and-drop grid:

| Action | How |
|--------|-----|
| Move a panel | Drag from its title bar |
| Resize a panel | Drag the bottom-right corner |
| Edit a panel | Hover and click the pencil icon |
| Delete a panel | Hover and click the trash icon |

You can also add a **section/row** to group related panels and collapse them when not in use.

## Time range and refresh

The global time picker at the top right controls every panel on the dashboard.

- Choose a relative range (`Last 15 min`, `Last 1 hour`, `Last 7 days`) or an absolute window.
- Use **Auto-refresh** to re-run all queries on an interval (for example every 30s or 1m).
- Zoom into a spike by click-dragging across a time-series panel; all panels follow.

:::note
Auto-refresh keeps querying ClickHouse on every tick. For long ranges on busy dashboards, prefer a longer interval or refresh manually to reduce load.
:::

## Edit, clone, and delete

- **Edit** — Toggle edit mode to rearrange panels or change queries, then **Save**.
- **Clone** — Use **Clone Dashboard** to duplicate the whole board as a starting point, or clone a single panel from its menu.
- **Delete** — Remove a dashboard from its settings menu. This cannot be undone, so export the JSON first if you may need it again.

To move dashboards between environments or back them up, see [Import and Share](/mindops-docs/dashboards/import-and-share/).

## Good practices

- Keep one dashboard focused on a single service or concern rather than mixing everything.
- Put the most important signals (error rate, latency, saturation) in the top row.
- Use variables for reusable filters so one dashboard serves many hosts or services — see [Variables](/mindops-docs/dashboards/variables/).
