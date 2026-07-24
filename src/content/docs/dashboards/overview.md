---
title: Dashboards
description: Build custom dashboards from any signal in MindOps.
---

Dashboards let you compose panels — built from metrics, logs, or traces — into a single
view of a system, team, or service.

## Building a dashboard

1. Go to **Dashboards → New Dashboard**.
2. Add a panel and pick a signal type (metrics, logs, or traces).
3. Add filters (e.g. `service.name = api`).
4. Choose an aggregation (Count, Avg, P99, Rate, …).
5. Group by an attribute (e.g. `http.route`, `status_code`).
6. Pick a visualization — time series, bar, pie, value, or table.

## Panel tips

- Use `{{attributeName}}` in the legend to label series dynamically.
- Combine multiple queries with math functions to plot derived values (ratios, rates).
- Mix signal types on one dashboard — a latency time series next to a table of the slowest
  endpoints, for example.

## Variables

Add **template variables** (such as `service` or `environment`) so a single dashboard can
be re-used across many services by switching a dropdown instead of editing every panel.

## Importing and sharing

Dashboards are JSON under the hood, so you can export a dashboard, version it in git, and
import it into another MindOps instance.
