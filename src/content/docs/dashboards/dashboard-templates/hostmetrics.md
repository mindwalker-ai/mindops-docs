---
title: Host Metrics Dashboard
description: Monitor CPU, memory, disk, filesystem, and network for any host using the OpenTelemetry hostmetrics receiver in MindOps.
---

# Host Metrics Dashboard

This template tracks the core vitals of a physical or virtual machine: CPU,
memory, disk I/O, filesystem usage, and network throughput. It pairs with the
OpenTelemetry `hostmetrics` receiver, which scrapes the operating system on a
fixed interval.

## What it shows

- CPU utilization broken down by state (user, system, idle, iowait)
- Memory used, available, cached, and buffered
- Disk read/write throughput and operations per second
- Filesystem usage percentage per mount point
- Network bytes sent and received, plus error and drop counters
- System load average over 1, 5, and 15 minutes

## Prerequisites / data source

Run an OpenTelemetry Collector on each host with the `hostmetrics` receiver
enabled and exporting to MindOps over OTLP.

```yaml
receivers:
  hostmetrics:
    collection_interval: 30s
    scrapers:
      cpu:
      memory:
      disk:
      filesystem:
      network:
      load:
```

| Requirement | Detail |
|-------------|--------|
| Receiver | `hostmetrics` |
| Scrapers | cpu, memory, disk, filesystem, network, load |
| Attribute | `host.name` to distinguish machines |

:::caution
Inside containers the receiver may only see the container's view. Mount the host
`/proc` and `/sys` and set `root_path` so it reports the underlying machine.
:::

## Import

1. Open **Dashboards** in the MindOps UI.
2. Select **New** → **Import JSON**.
3. Upload the host metrics template JSON and save.
4. Use the `host.name` variable to switch between machines.

:::note
Group panels by `host.name` to compare a fleet, or pin a single host for a focused
view during an incident.
:::
