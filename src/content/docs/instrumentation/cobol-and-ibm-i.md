---
title: COBOL & IBM i Overview
description: Choose how to monitor a COBOL application or an IBM i (AS/400) system in MindOps, for both the app (APM) and its server.
---

OpenTelemetry has no COBOL SDK, and IBM i (AS/400) cannot run the OpenTelemetry Collector. MindOps covers both gaps. How you integrate depends on two things: the language of your app, and the system it runs on.

This page helps you find your case and the guide to follow. In every case, the result in MindOps is the same: the app appears in **Services** with its traces, logs, and metrics, and its server appears in **Infrastructure > Hosts**.

## Find your case

| | Case 1 | Case 2 | Case 3 |
| --- | --- | --- | --- |
| **Your app** | COBOL | COBOL, RPG, or CL (ILE) | Java, Node.js (Express, Next.js), or Python |
| **Runs on** | A Linux or Windows server | IBM i | IBM i, in PASE |
| **App telemetry** | MINDOTEL SDK, written to a file and sent by the MO1 shipper | MINDOTEL SDK, written to a data queue and sent by the IBM i collector | The standard OpenTelemetry SDK, sent directly by the app |
| **Server metrics** | OpenTelemetry Collector (`hostmetrics`) on the server | IBM i collector, over ODBC | IBM i collector, over ODBC |
| **Code change** | Yes: SDK calls in the program | Yes: SDK calls in the program | Java: none. Node.js and Python: a small setup file |
| **Installed on the app server** | SDK modules, MO1 shipper, and OpenTelemetry Collector | SDK service program only | OpenTelemetry packages in the app |
| **Installed on the MindOps server** | Nothing | IBM i collector | IBM i collector |
| **Guide** | [COBOL on Linux & Windows](/mindops-docs/instrumentation/cobol-linux-windows/) | [COBOL & RPG on IBM i](/mindops-docs/instrumentation/cobol-rpg-ibm-i/) | [Java, Node.js & Python on IBM i](/mindops-docs/instrumentation/ibm-i-open-source/) |

Cases 2 and 3 also need the [IBM i collector](/mindops-docs/infrastructure/ibm-i/), which puts the IBM i system in Infrastructure > Hosts.

:::tip[Not listed?]
- **Go** does not run on IBM i. Run the Go service on Linux, let it reach IBM i over the network, and [instrument it as any Go service](/mindops-docs/instrumentation/golang/).
- **PHP and Laravel** on IBM i need a vendor PHP, such as Seiden PHP+ or ZendPHP. This setup is not tested yet. See the [runtime test results](/mindops-docs/instrumentation/ibm-i-open-source/#tested-runtimes).
- **Rocket (Micro Focus) Enterprise Server** has OpenTelemetry built in. Point its exporter at MindOps, as described in [COBOL on Linux & Windows](/mindops-docs/instrumentation/cobol-linux-windows/).
- **An IBM i with no instrumented app** needs only the [IBM i collector](/mindops-docs/infrastructure/ibm-i/). You get the host, its subsystems, jobs, and operator messages without changing any program.
:::

## How the data flows

### Case 1: COBOL on a Linux or Windows server

```text
  Linux / Windows server                                       MindOps
┌──────────────────────────────────────────────────┐        ┌───────────────────┐
│ COBOL program ─(SDK)─▶ telemetry file ─▶ MO1     │─OTLP──▶│ Services, Traces, │
│                                          shipper │        │ Logs              │
│ OpenTelemetry Collector (hostmetrics)            │─OTLP──▶│ Hosts             │
└──────────────────────────────────────────────────┘        └───────────────────┘
```

The server is an ordinary server, so the standard OpenTelemetry Collector reports its metrics. Only the COBOL program needs MINDOTEL.

### Case 2: COBOL, RPG, or CL on IBM i

```text
  IBM i (AS/400)                         MindOps server
┌──────────────────────────────┐        ┌──────────────────┐        ┌───────────────────┐
│ COBOL / RPG ─(SDK)─▶ MOTELQ  │─ODBC──▶│ IBM i collector  │─OTLP──▶│ Services, Traces, │
│ SQL services (CPU, disk, …)  │─ODBC──▶│ (read-only user) │        │ Logs, Hosts       │
└──────────────────────────────┘        └──────────────────┘        └───────────────────┘
```

No agent runs on IBM i. Programs write records to a local data queue and never wait on the network. The collector on the MindOps server reads the queue and the system data over one read-only ODBC connection.

### Case 3: A modern app on IBM i

```text
  IBM i (AS/400)                         MindOps server
┌──────────────────────────────┐        ┌──────────────────┐        ┌───────────────────┐
│ Node.js / Python / Java app  │─────────────── OTLP ──────────────▶│ Services, Traces, │
│ + OpenTelemetry SDK          │        │                  │        │ Logs              │
│ SQL services (CPU, disk, …)  │─ODBC──▶│ IBM i collector  │─OTLP──▶│ Hosts             │
└──────────────────────────────┘        └──────────────────┘        └───────────────────┘
```

The app sends OTLP itself, as it would on Linux. The IBM i collector adds the host. Setting the app's `host.name` to the IBM i system name links the two in MindOps.

## Roles

| Role | Case 1 | Case 2 | Case 3 |
| --- | --- | --- | --- |
| **App developer** | Adds SDK calls and builds with the SDK modules | Adds SDK calls, compiles, and binds to `MINDOTEL` | Adds the OpenTelemetry SDK and sets the `OTEL_*` variables |
| **Server or IBM i admin** | Runs the MO1 shipper and the OpenTelemetry Collector as services | Builds the SDK once, creates a read-only user profile, and opens ODBC port 9471 | As in Case 2, and lets IBM i reach MindOps on port 4318 |
| **MindOps admin** | None | Starts the IBM i collector and imports dashboards and alerts | As in Case 2 |

## One trace across cases

The cases combine. When a Node.js portal on IBM i (Case 3) calls a COBOL program (Case 2), MindOps can show both in one trace. The portal passes its W3C `traceparent` to the program as a parameter, and the program passes it to `MOSPNBEG`. For details, see [Joining traces across systems](/mindops-docs/instrumentation/cobol-rpg-ibm-i/#joining-traces-across-systems).

## What you see in MindOps

| Where | Case 1 | Case 2 | Case 3 |
| --- | --- | --- | --- |
| **Services** | The COBOL program, by its `service.name` | Each instrumented program | The app |
| **Traces** | Program spans | Program spans, down to each Db2 statement | HTTP and framework spans, plus the Db2 spans you add |
| **Logs** | `MOLOG` lines, linked to traces | `MOLOG` lines, operator messages, and the history log | App logs |
| **Infrastructure > Hosts** | The Linux or Windows server | The IBM i system | The IBM i system |
| **Dashboards** | [IBM i Applications](/mindops-docs/dashboards/dashboard-templates/ibm-i/) (all MINDOTEL programs) and the standard host views | [IBM i Host and IBM i Applications](/mindops-docs/dashboards/dashboard-templates/ibm-i/) | IBM i Host and the standard APM views |
| **Alerts** | The MINDOTEL program rules (`mindops-ibmi-app-errors`, `mindops-ibmi-sdk-drops`) and standard rules | All [IBM i alert rules](/mindops-docs/infrastructure/ibm-i/#alerts) | IBM i host rules and standard APM rules |

## Tested environments

The three cases were verified together in one MindOps instance:

| Case | Environment | Result |
| --- | --- | --- |
| 1 | GnuCOBOL 3.1.2 on Ubuntu 24.04, and the MO1 shipper on Windows 11 | The program in Services, and the server in Hosts |
| 2 | ILE RPG and ILE COBOL with embedded SQL on IBM i 7.5 | Traces down to each Db2 statement, and the IBM i in Hosts |
| 3 | Node.js 18 (Express) and Python 3.13 (Flask) on IBM i 7.5, reading Db2 for i | The app in Services, linked to its IBM i host. One trace from a Node.js request into a COBOL program |

The code examples in these guides were compiled and run as printed, on these systems.

## Terms used in these guides

| Term | Meaning |
| --- | --- |
| **ILE** | Integrated Language Environment, the IBM i runtime for COBOL, RPG, and CL programs |
| **PASE** | Portable Application Solutions Environment, the AIX-compatible runtime on IBM i where Java, Node.js, and Python run |
| **Library list** (`*LIBL`) | The ordered list of libraries a job searches to find objects, like `PATH` on Linux |
| **Data queue** | An IBM i object that holds messages between programs. MINDOTEL writes to the data queue `MOTELQ` |
| **ASP** | Auxiliary storage pool, a group of IBM i disk units. MindOps reports each ASP as a disk |
| **QSYSOPR** | The system operator message queue |
| **Db2 for i** | The database built into IBM i |
| **OTLP** | OpenTelemetry Protocol, the format MindOps receives on port 4318 (HTTP) |
| **MINDOTEL** | The MindOps telemetry SDK for COBOL, RPG, and CL |
