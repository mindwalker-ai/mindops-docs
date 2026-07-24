---
title: Infrastructure Monitoring
description: Monitor hosts, containers, and cloud resources alongside your apps in MindOps.
---

MindOps collects infrastructure metrics through the OpenTelemetry Collector, so host and
container health live next to your application traces and logs — in one place.

## Host metrics

Enable the collector's `hostmetrics` receiver to gather CPU, memory, disk, filesystem,
network, and load:

```yaml
receivers:
  hostmetrics:
    collection_interval: 60s
    scrapers:
      cpu: {}
      memory: {}
      disk: {}
      filesystem: {}
      network: {}
      load: {}
```

:::tip[Docker deployments]
When the collector runs in a container, mount the host filesystem and set
`root_path: /hostfs` so it reports the host's metrics rather than the container's.
:::

## Containers and Kubernetes

Run the collector as an agent on each node (a DaemonSet on Kubernetes) to collect container
and pod metrics, then forward everything to your MindOps collector over OTLP.

## Cloud services

Pull metrics from managed cloud services (AWS, GCP, Azure) using the matching OpenTelemetry
receivers, and they appear in MindOps alongside everything else.

## Tie it together

Infrastructure metrics become panels on a [dashboard](/dashboards/overview/) and targets
for [alerts](/alerts/overview/) — for example, a disk-utilization alert so ClickHouse never
silently runs out of space.
