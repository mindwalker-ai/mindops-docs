---
title: IBM i Dashboards
description: Two ready-made MindOps dashboards for IBM i (AS/400), one for the host and one for COBOL and RPG programs instrumented with MINDOTEL.
---

MindOps provides two dashboards for IBM i. They show the data sent by the [IBM i collector](/mindops-docs/infrastructure/ibm-i/) and the [MINDOTEL SDK](/mindops-docs/instrumentation/cobol-rpg-ibm-i/).

## IBM i Host

The **IBM i Host** dashboard (`deploy/mindops/dashboards/ibmi-host.json`) shows the health of the partition:

- CPU utilization, and CPU by subsystem and job type
- System ASP used, and utilization per ASP
- Active jobs, and job queues (worst first)
- Memory pool faults per second, the IBM i signal of memory pressure
- Critical subsystems (up or down)
- Collector connectivity and unavailable sources
- Utilization of the SDK data queue

## IBM i Applications

The **IBM i Applications** dashboard (`deploy/mindops/dashboards/ibmi-applications.json`) shows every program instrumented with MINDOTEL: COBOL, RPG, and CL programs on IBM i, and COBOL programs on Linux or Windows that use the MO1 shipper. It shows one series per `service.name`:

- Calls per minute, error rate, and p50, p95, and p99 latency per program
- Db2 call latency (p95) per operation
- Errors by operation, with the category (`error.type`), the IBM i message ID or SQLSTATE (`ibmi.error.code`), and an example trace
- Telemetry that programs dropped because the data queue was full or missing

## Requirements

| Dashboard | Requires |
| --- | --- |
| IBM i Host | The [IBM i collector](/mindops-docs/infrastructure/ibm-i/), running and connected. The dashboard shows one series per IBM i system, by `host.name` (the value of `MINDOPS_IBMI_SYSTEM`). |
| IBM i Applications | Programs instrumented with MINDOTEL, on [IBM i](/mindops-docs/instrumentation/cobol-rpg-ibm-i/) or on [Linux and Windows](/mindops-docs/instrumentation/cobol-linux-windows/). The dashboard selects their spans by the resource attribute `telemetry.sdk.name = mindops-ibmi-sdk`, which the collector and the MO1 shipper set. |

## Import the dashboards

1. In MindOps, open **Dashboards**.
2. Select **New** > **Import JSON**.
3. Upload `ibmi-host.json` or `ibmi-applications.json` from `deploy/mindops/dashboards/`, and save.

:::note
The IBM i system also appears in **Infrastructure > Hosts**, next to your Linux and Windows servers. The dashboards add views that the Hosts page does not have: subsystems, job queues, pool faults, and the SDK queue.
:::
