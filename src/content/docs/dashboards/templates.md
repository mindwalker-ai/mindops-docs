---
title: Dashboard Templates
description: Catalog of out-of-the-box MindOps dashboard templates for APM, host metrics, Kubernetes, PostgreSQL, MySQL, NGINX, Kafka, and more, plus how to import them.
---

MindOps ships a library of ready-made dashboard templates so you do not start from a blank grid. Each template is a JSON definition tuned to a common technology, using the metrics that OpenTelemetry receivers already collect.

## What templates give you

- Pre-built panels for the signals that matter for each system.
- Sensible variables (host, instance, database) wired into every panel.
- A starting point you can clone and customize for your own naming.

## Template catalog

| Template | Covers | Key panels |
|----------|--------|-----------|
| APM | Any instrumented service | Request rate, error rate, p50/p95/p99 latency, Apdex |
| Host Metrics | Servers and VMs | CPU, memory, disk, network, load |
| Kubernetes | Clusters and workloads | Pod CPU/memory, restarts, node capacity |
| PostgreSQL | Postgres databases | Connections, cache hit ratio, transactions, locks |
| MySQL | MySQL databases | QPS, threads, buffer pool, slow queries |
| NGINX | Web server / proxy | Requests, status codes, active connections |
| Kafka | Message brokers | Throughput, consumer lag, partitions, broker health |
| Redis | Caches | Hit rate, memory, connected clients, ops/sec |
| MongoDB | Document store | Operations, connections, replication lag |
| JVM | Java runtimes | Heap, GC pauses, threads, class loading |

:::note
A template only renders data once the matching OpenTelemetry receiver is collecting it. For example, the PostgreSQL template needs the Postgres receiver enabled in your collector pipeline.
:::

## How to import a template

There are two common paths.

### From the dashboard gallery

1. Open **Dashboards** and choose **New**.
2. Browse the template gallery and pick one.
3. Confirm to add it to your workspace.

### From JSON

If you have the template JSON (for example pulled from a shared repository), use **New then Import JSON** and paste it. See [Import and Share](/mindops-docs/dashboards/import-and-share/) for the full flow.

```text
Dashboards  ->  New  ->  Import JSON  ->  paste template JSON  ->  Import
```

## Customize after importing

Templates are a baseline, not a final answer. After importing:

- Rename panels and the dashboard for your team's conventions.
- Point variables at your actual hosts, services, or databases.
- Add panels for the specific behaviors you care about.
- Remove panels for signals you do not collect.

:::tip
Clone the template first, then edit the clone. That way you keep a clean copy to re-import if you want to start over.
:::

## Building your own

Once you outgrow the defaults, build bespoke dashboards with the [Query Builder](/mindops-docs/querying/query-builder/) and choose appropriate [Panel Types](/mindops-docs/dashboards/panel-types/). Use [Variables](/mindops-docs/dashboards/variables/) to keep them reusable, and commit the exported JSON to git so your custom templates are versioned alongside your code.
