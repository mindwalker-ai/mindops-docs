---
title: IBM i (AS/400)
description: Monitor IBM i (AS/400) systems in MindOps with the agentless IBM i collector, which reads IBM i over a read-only ODBC connection.
---

IBM i cannot run the OpenTelemetry Collector, so MindOps provides an **IBM i collector**. The collector runs on the MindOps server, not on IBM i. It connects to IBM i over ODBC with a read-only user profile, and converts what it reads to OpenTelemetry.

Set up one collector for each IBM i system you monitor. The collector does two things:

- It reports the system's health, so the system appears in **Infrastructure > Hosts**.
- It delivers the telemetry of COBOL and RPG programs that use the MINDOTEL SDK ([Case 2](/mindops-docs/instrumentation/cobol-rpg-ibm-i/)).

Java, Node.js, and Python apps on IBM i ([Case 3](/mindops-docs/instrumentation/ibm-i-open-source/)) send their own telemetry, and rely on the collector for the host. To choose your case, see the [COBOL & IBM i Overview](/mindops-docs/instrumentation/cobol-and-ibm-i/).

## How it works

```text
  IBM i (AS/400)                             MindOps server
┌───────────────────────────────┐            ┌──────────────────────────┐
│ COBOL / RPG / CL programs     │            │                          │
│   │ (1) call MINDOTEL SDK     │            │                          │
│   ▼                           │            │                          │
│ Data queue MOTELQ             ├─ (2) ODBC ▶┤ IBM i collector          │
│                               │            │ (container on the        │
│ SQL services (QSYS2):         │            │ MindOps server,          │
│ CPU, disk, memory, jobs,      ├─ (2) ODBC ▶┤ read-only ODBC user)     │
│ subsystems, messages          │            │                          │
└───────────────────────────────┘            └──────────────────────────┘
                                                          │ (3) OTLP
                                                          ▼
                                             ┌──────────────────────────┐
                                             │ MindOps: Hosts,          │
                                             │ Services, Traces,        │
                                             │ Logs, Dashboards,        │
                                             │ Alerts                   │
                                             └──────────────────────────┘
```

1. **Programs call the SDK (optional).** COBOL, RPG, and CL programs that use the [MINDOTEL SDK](/mindops-docs/instrumentation/cobol-rpg-ibm-i/) write each span, log, and metric to the local data queue `MOTELQ`. They never wait on the network.
2. **The collector reads IBM i.** In each cycle, it connects over ODBC (TLS on port 9471) and reads two sources:
   - The IBM i SQL services, for host metrics and operator messages
   - The data queue, for the SDK records
3. **The collector sends the data to MindOps** over OTLP.

For host metrics, you install nothing on IBM i. Only application telemetry needs the SDK and its data queue.

## What you get

| Area | Data |
| --- | --- |
| **Infrastructure > Hosts** | The IBM i system, listed under its system name, with CPU %, disk (one device per ASP), memory pools, load average, disk I/O, TCP connections, and packets |
| **Host metrics** | Partition CPU, ASP capacity and use, memory pools and page faults, total and active jobs, CPU and jobs per subsystem and job type, subsystem status, job queue depth, and temporary storage |
| **Logs** | QSYSOPR operator messages and the history log, as logs of the service `ibmi-<system>` |
| **Application telemetry** | Spans, logs, and metrics from programs that call the MINDOTEL SDK, under each program's service name |
| **Self-monitoring** | `mindops.ibmi.collector.up`, unavailable sources, and dropped and rejected records |

If the IBM i release does not offer a source, or the user is not authorized to read it, the collector reports the source as **unavailable**, never as 0. All other sources keep working.

## Before you begin

Prepare IBM i:

1. **Release:** IBM i 7.3 TR7, 7.4 TR1, or later, with a current Db2 PTF group.
2. **User profile:** create a read-only user profile for MindOps, for example:

    ```text
    CRTUSRPRF USRPRF(MINDOPS) PASSWORD(...) USRCLS(*USER) INLMNU(*SIGNOFF) LMTCPB(*YES)
    ```

3. **Authorities:** grant only read access:
   - `*USE` on the `QSYS2` SQL services that the collector reads
   - `*OBJOPR` and `*READ` on the data queue `MINDOTEL/MOTELQ`, if you use the SDK

   The user needs no authority that writes data. CPU data comes from `QSYS2.SYSTEM_STATUS`, which does not need `*JOBCTL`.
4. **Network:** allow ODBC connections from the MindOps server to IBM i on port 9471 (TLS), or 8471 without TLS. Start the database host server with `STRHOSTSVR *DATABASE`.
5. **Time zone:** check the system values `QTIMZON` and `QUTCOFFSET`. The SQL services return local time, and the collector converts it with the time zone that you configure.

:::tip[Run the collector close to IBM i]
The speed of draining the SDK queue depends on the round-trip time to IBM i. Across a WAN, it measured 180 to 210 ms per record, so a large backlog drains slowly. On the same LAN as IBM i, a backlog drains in seconds. A backlog never delays the host metrics: the collector pauses the drain when the next poll is due.
:::

## Set up the collector

The collector ships with MindOps as a container, defined in `deploy/mindops/ibmi.compose.yaml`. The image includes the IBM i Access ODBC driver.

1. Copy `ibmi/collector/.env.example` to `ibmi/collector/.env`, and set the values for your system:

    ```bash
    MINDOPS_IBMI_SYSTEM=PROD1
    MINDOPS_IBMI_ODBC_CONNECTION_STRING=DRIVER={IBM i Access ODBC Driver};SYSTEM=ibmi.example.com;UID=MINDOPS;SSL=1;
    MINDOPS_IBMI_ODBC_PASSWORD_FILE=/run/secrets/ibmi_password
    MINDOPS_IBMI_TIMEZONE=Asia/Jakarta
    MINDOPS_IBMI_CRITICAL_SUBSYSTEMS=QINTER,QBATCH,QSYSWRK,QUSRWRK
    ```

    Replace `PROD1` with the name to show in MindOps, and `ibmi.example.com` with the host name of your IBM i.

2. Start the collector:

    ```bash
    docker compose -f deploy/mindops/ibmi.compose.yaml up -d --build
    ```

    On a server installed with `start-server.sh`, the collector starts automatically when `ibmi/collector/.env` exists.

3. Check that the collector is connected:

    ```bash
    curl -s localhost:8095/readyz
    ```

    The command returns HTTP 200 and `"connectivity": "ok"` when IBM i answers.

4. In MindOps, open **Infrastructure > Hosts**. After the first poll (60 seconds), the system is listed under the name in `MINDOPS_IBMI_SYSTEM`.

:::caution[Keep the password out of the connection string]
Set the password with `MINDOPS_IBMI_ODBC_PASSWORD_FILE`, a mounted secret, or `MINDOPS_IBMI_ODBC_PASSWORD`. The collector never logs it.
:::

:::note[Restart policy]
The compose file runs the collector with `restart: unless-stopped` and a stop grace period of 90 seconds. If you run the collector in another way, such as with systemd or Kubernetes, keep both settings. The watchdog (`MINDOPS_IBMI_CYCLE_TIMEOUT_SECONDS`) relies on the restart, and the grace period lets the current cycle export the records that it already read from the queue.
:::

## Configuration reference

The collector reads these environment variables:

| Variable | Default | Description |
| --- | --- | --- |
| `MINDOPS_IBMI_SYSTEM` | `IBMI` | The system name. It is the `host.name` in Hosts, and system telemetry appears as the service `ibmi-<system>`. |
| `MINDOPS_IBMI_ODBC_CONNECTION_STRING` | None | The ODBC connection string, without the password. |
| `MINDOPS_IBMI_ODBC_PASSWORD` or `MINDOPS_IBMI_ODBC_PASSWORD_FILE` | None | The password of the read-only user, or a file that contains it. |
| `MINDOPS_IBMI_TIMEZONE` | `UTC` | The IBM i local time zone (`QTIMZON`). |
| `MINDOPS_IBMI_POLL_INTERVAL_SECONDS` | `60` | How often the collector reads system metrics. |
| `MINDOPS_IBMI_MESSAGE_INTERVAL_SECONDS` | `30` | How often the collector reads QSYSOPR and the history log. |
| `MINDOPS_IBMI_MESSAGES_LOOKBACK_MINUTES` | `15` | How far back the collector reads messages. After a longer stop, it skips older messages and logs a warning, so a message backlog never delays the system metrics. |
| `MINDOPS_IBMI_STATE_PATH` | `/var/lib/mindops-ibmi/state.json` | The file where the collector saves its message position, so that a restart neither resends nor skips messages. Keep it on a persistent volume. |
| `MINDOPS_IBMI_CRITICAL_SUBSYSTEMS` | `QINTER,QBATCH,QSYSWRK,QUSRWRK` | The subsystems that must be active. Each gets an up/down series. |
| `MINDOPS_IBMI_TOP_JOB_QUEUES` | `20` | The number of job queues reported, those with the most jobs first. |
| `MINDOPS_IBMI_DATA_QUEUE` and `MINDOPS_IBMI_DATA_QUEUE_LIBRARY` | `MOTELQ` and `MINDOTEL` | The SDK data queue. |
| `MINDOPS_IBMI_DRAIN_BATCH` | `500` | The maximum number of SDK records read in one cycle. |
| `MINDOPS_IBMI_DRAIN_CHUNK` | `50` | The number of SDK records read in one ODBC round trip. If a statement fails partway, up to this many records can be lost. `1` loses no records but is slower. |
| `MINDOPS_IBMI_DRAIN_IDLE_SECONDS` | `2.0` | How long the collector waits before it reads the queue again, when the queue is empty. |
| `MINDOPS_IBMI_CONNECT_TIMEOUT_SECONDS` | `10` | The ODBC login timeout. |
| `MINDOPS_IBMI_CYCLE_TIMEOUT_SECONDS` | `600` | The watchdog timeout. If one cycle takes longer, for example because IBM i stops answering during a query, the collector exits, and its restart policy starts it again with a new connection. |
| `MINDOPS_IBMI_PROBE_ENABLED` | `true` | Turns the read-only health probe (`SYSIBM.SYSDUMMY1`) on or off. |
| `MINDOPS_IBMI_OTLP_ENDPOINT` | `http://signoz-ingester:4318` | Where the collector sends OTLP. |
| `MINDOPS_IBMI_EXPORT_TIMEOUT_SECONDS` | `5.0` | The timeout of one OTLP request. A slow MindOps never stalls the collector: requests that time out are buffered and retried. |
| `MINDOPS_IBMI_EXPORT_BUFFER` | `100` | The number of OTLP requests kept while MindOps is unreachable. When the buffer is full, the oldest request is dropped and counted in `mindops.ibmi.collector.export_dropped`. |
| `MINDOPS_IBMI_HEALTH_PORT` | `8095` | The port of `/healthz` and `/readyz`. If you change it, change the port mapping in the compose file too. |
| `MINDOPS_IBMI_SIMULATE` | `false` | Replays a simulated IBM i, for demos without a real system. |

:::note[No query timeout]
The IBM i ODBC driver enforces a query timeout through the predictive query governor. The governor refuses a query whose *estimated* time exceeds the timeout (`SQL0666`), even if the query would finish in seconds. For this reason, the collector sets only a login timeout. If a call never returns, the watchdog restarts the collector, and the collector-down alert fires in the meantime.
:::

## How IBM i maps to the Hosts page

The Hosts page reads standard OpenTelemetry host metrics. The collector builds them from IBM i data:

| Hosts column or chart | IBM i source |
| --- | --- |
| CPU % | `QSYS2.SYSTEM_STATUS`: the percentage of the capacity that the partition can use (its virtual processors when uncapped, otherwise its entitlement) |
| Memory chart | One series per memory pool (`machine`, `base`, `spool`, `interact`, and others) |
| Load average | Computed by the collector as an exponential average of the jobs that are running or waiting for a processor. IBM i has no load average of its own. |
| Disk I/O and operations | `QSYS2.SYSDISKSTAT` counters, per ASP |
| Filesystem | ASP space used and free |
| Network connections, packets, and errors | `QSYS2.NETSTAT_INFO` (TCP) |

The **Memory %** column stays empty by design. IBM i assigns all main storage to pools, so there is no free memory, and a used percentage would always be close to 100%. Watch page faults on the [IBM i dashboards](/mindops-docs/dashboards/dashboard-templates/ibm-i/) instead. Network bytes, packet drops, and CPU wait have no IBM i source, so they also stay empty.

## Alerts

To import the IBM i alert rules (`deploy/mindops/alerts/mindops-ibmi-*.json`), run `deploy/mindops/alerts/import-alerts.sh`. The script imports every rule file.

| Rule | Fires when | Severity |
| --- | --- | --- |
| `mindops-ibmi-collector-down` | The collector cannot read IBM i, or sends nothing for 15 minutes. | critical |
| `mindops-ibmi-cpu` | Average CPU is above 85% or 95% for 15 minutes. | warning or critical |
| `mindops-ibmi-asp` | An ASP is more than 85% or 95% used. | warning or critical |
| `mindops-ibmi-subsystem-down` | A critical subsystem is not active for 5 minutes. | critical |
| `mindops-ibmi-telemetry-queue` | The SDK queue is more than 80% or 95% full. | warning or critical |
| `mindops-ibmi-sdk-drops` | Programs dropped telemetry records in the last 15 minutes. | warning |
| `mindops-ibmi-app-errors` | A program's error rate is above 5% or 20%, with at least 20 calls in 15 minutes. | warning or critical |

The last two rules cover every program instrumented with MINDOTEL, including COBOL programs on Linux and Windows.

The standard [anomaly alerts](/mindops-docs/alerts/anomaly-and-exceptions-alerts/) cover latency degradation of IBM i programs.

## Troubleshooting

The collector has two health endpoints:

- `GET localhost:8095/healthz` always answers while the collector runs. It shows `last_poll`, `last_error`, and `records_drained`.
- `GET localhost:8095/readyz` returns HTTP 200 only while IBM i answers.

When a cycle fails, `last_error` shows the cause:

| `last_error` | Cause | What to check |
| --- | --- | --- |
| `connection` | The network or the IBM i host servers | The firewall, port 9471 or 8471, and `STRHOSTSVR *DATABASE` |
| `authentication` | The user profile | An expired password, a disabled profile, or a lockout |
| `timeout` | IBM i is slow to answer | The IBM i CPU |
| `internal` | An unexpected error in the collector. The collector logs the error and continues. | The collector log |

For other symptoms, use this table:

| Symptom | Cause and fix |
| --- | --- |
| The system is missing from Hosts, or its charts have gaps. | Check `last_poll` in `/healthz`. If it is older than two poll intervals, a cycle is slow or stuck: check the collector log. A stuck cycle ends after `MINDOPS_IBMI_CYCLE_TIMEOUT_SECONDS`, and the collector restarts. |
| The log shows `… messages: 1 day, … behind, skipping to the last 0:15:00`. | The collector was stopped for longer than `MINDOPS_IBMI_MESSAGES_LOOKBACK_MINUTES`, so it skipped older messages. They are still on IBM i (`DSPLOG`). To keep more, increase the setting. |
| `records_drained` increases slowly while programs run. | The SDK queue has a backlog, and the link to IBM i is slow. Run the collector closer to IBM i, and size `MOTELQ` for the backlog. |
| `docker stop` takes up to a minute. | This is expected. The collector finishes its current cycle first, because ODBC calls cannot be interrupted. |
| The log reports a source as unavailable with `SQL0551` or `42501`. | The user is not authorized to that SQL service. Grant `*USE`. |
| The log reports a source as unavailable with `42704` or `42883`. | The SQL service does not exist on this release. Apply the latest Db2 PTF group. |

## Next steps

- Send telemetry from COBOL and RPG programs: [COBOL & RPG on IBM i](/mindops-docs/instrumentation/cobol-rpg-ibm-i/).
- Monitor Java, Node.js, and Python apps on IBM i: [Java, Node.js & Python on IBM i](/mindops-docs/instrumentation/ibm-i-open-source/).
- Import the [IBM i dashboards](/mindops-docs/dashboards/dashboard-templates/ibm-i/).
