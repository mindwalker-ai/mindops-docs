---
title: COBOL on Linux & Windows
description: Monitor a COBOL application on a Linux or Windows server with the MINDOTEL SDK and the MO1 shipper, or with Enterprise Server's built-in OpenTelemetry.
---

This guide covers **Case 1** of the [COBOL & IBM i Overview](/mindops-docs/instrumentation/cobol-and-ibm-i/): a COBOL application on a Linux or Windows server. After you complete it, the program appears in **Services** and the server appears in **Infrastructure > Hosts**.

OpenTelemetry has no COBOL SDK. The route depends on the COBOL product that runs your application:

| COBOL product | Route |
| --- | --- |
| **GnuCOBOL** | Use the MINDOTEL SDK and the MO1 shipper, as described in this guide. |
| **Rocket (Micro Focus) Visual COBOL / Enterprise Server 10 or later** | Apps that run under Enterprise Server have built-in OpenTelemetry. Point its OTLP exporter at `http://<mindops-host>:4318`. Native apps outside Enterprise Server can use MINDOTEL, as described in this guide. |
| **ILE COBOL on IBM i** | See [COBOL & RPG on IBM i](/mindops-docs/instrumentation/cobol-rpg-ibm-i/). |

## How it works

```text
  Linux / Windows server                     MindOps
┌───────────────────────────────┐            ┌──────────────────────────┐
│ COBOL program (GnuCOBOL)      │            │                          │
│   │ (1) call MINDOTEL SDK     │            │                          │
│   ▼                           │            │                          │
│ Telemetry file (MOTELOUT)     │            │                          │
│   │ (2) tailed by             │            │                          │
│   ▼                           │            │                          │
│ MO1 shipper                   ├─ (3) OTLP ▶┤ Services, Traces,        │
│                               │            │ Logs                     │
│ OpenTelemetry Collector       ├─ (4) OTLP ▶┤ Infrastructure >         │
│ (hostmetrics)                 │            │ Hosts                    │
└───────────────────────────────┘            └──────────────────────────┘
```

1. Your COBOL program calls the MINDOTEL SDK. The SDK appends each record to the file named by the `MOTELOUT` environment variable. The program never waits on the network.
2. The MO1 shipper reads new lines from that file.
3. The shipper converts the records to OpenTelemetry and sends them to MindOps.
4. A standard OpenTelemetry Collector sends the server's host metrics.

The SDK calls are the same as on IBM i (`MOINIT`, `MOSPNBEG`, `MOSPNEND`, `MOLOG`, `MOMETRIC`, and others). Only the platform layer differs: on Linux and Windows, it appends records to a file instead of a data queue. For the full list of calls, see the [API reference](/mindops-docs/instrumentation/cobol-rpg-ibm-i/#api-reference).

## Before you begin

Make sure the server has the following:

| Requirement | Version | Used for |
| --- | --- | --- |
| GnuCOBOL (`cobc`) | 3.1 or later | Building the SDK and your program |
| Python | 3.11 or later | Running the MO1 shipper |
| OpenTelemetry Collector Contrib (`otelcol-contrib`) | Any recent release | Sending host metrics |
| The `ibmi` folder of the MindOps repository | Same version as your MindOps server | The SDK sources (`ibmi/sdk`) and the shipper (`ibmi/collector`) |
| Network access to MindOps on port 4318 | Not applicable | Sending OTLP over HTTP |

In the examples on this page, replace `<mindops-host>` with the host name or IP address of your MindOps server, and `/opt/mindops/ibmi` with the path where you copied the `ibmi` folder.

## Step 1: Add the SDK to your program

1. In your program, copy the SDK definitions into `WORKING-STORAGE` and call the SDK around the work you want to trace. This example, `payments.cbl`, traces one batch step as a server span:

    ```cobol
           IDENTIFICATION DIVISION.
           PROGRAM-ID. PAYMENTS.
           DATA DIVISION.
           WORKING-STORAGE SECTION.
           COPY MOTELAPI.
           01  WS-SPAN                   PIC S9(9) COMP-5.
           PROCEDURE DIVISION.
           MAIN-PARA.
               MOVE "cobol-payments" TO MOTEL-SERVICE
               MOVE "1.0.0" TO MOTEL-SERVICE-VERSION
               MOVE "prod" TO MOTEL-ENVIRONMENT
               CALL "MOINIT" USING MOTEL-SERVICE MOTEL-SERVICE-VERSION
                                   MOTEL-ENVIRONMENT MOTEL-RC
               MOVE "PAYMENT" TO MOTEL-NAME
               SET MOTEL-KIND-SERVER TO TRUE
               MOVE SPACES TO MOTEL-TRACEPARENT
               CALL "MOSPNBEG" USING MOTEL-NAME MOTEL-KIND
                                     MOTEL-TRACEPARENT WS-SPAN MOTEL-RC
          *    ... the payment ...
               MOVE "OK " TO MOTEL-OUTCOME
               MOVE SPACES TO MOTEL-ERR-CATEGORY MOTEL-ERR-CODE
               CALL "MOSPNEND" USING WS-SPAN MOTEL-OUTCOME
                                     MOTEL-ERR-CATEGORY MOTEL-ERR-CODE
                                     MOTEL-RC
               STOP RUN.
    ```

    The source is fixed format: code goes in columns 8 to 72, and the compiler ignores anything after column 72. Break long `CALL` statements over several lines, as in this example.

    For a longer example with Db2 spans and error handling, see the [COBOL example](/mindops-docs/instrumentation/cobol-rpg-ibm-i/#example-a-cobol-transfer).

2. Compile the SDK modules and your program:

    ```bash
    SDK=/opt/mindops/ibmi/sdk
    mkdir -p lib
    for src in $SDK/src/*.cbl $SDK/platform/gnucobol/*.cbl; do
      cobc -m -O2 -I $SDK/copy -o lib/$(basename ${src%.cbl}).so $src
    done
    cobc -x -O2 -I $SDK/copy -o payments payments.cbl
    ```

## Step 2: Run the program with a telemetry file

Set `MOTELOUT` to the file where the SDK appends records, and start the program:

```bash
export COB_LIBRARY_PATH=$PWD/lib
export MOTELOUT=/var/log/payments/telemetry.mo1
./payments
```

To turn telemetry off without rebuilding, set `MOTEL_ENABLED=0`. Every SDK call then returns `1` and writes nothing.

:::caution[Rotate the telemetry file]
The file grows with every record. Rotate it with `logrotate` and the `copytruncate` option. The shipper detects the truncation and continues from the start of the file.
:::

## Step 3: Run the MO1 shipper

The MO1 shipper is part of the IBM i collector package. It uses the same parser and data masking as the IBM i collector, and it does not need an ODBC driver.

1. Install the shipper in a virtual environment:

    ```bash
    python3 -m venv /opt/mindops/mo1-shipper
    /opt/mindops/mo1-shipper/bin/pip install /opt/mindops/ibmi/collector
    ```

2. Create a systemd service, so the shipper starts with the server:

    ```ini
    # /etc/systemd/system/mindops-mo1-shipper.service
    [Unit]
    Description=MindOps MO1 shipper (COBOL telemetry)
    After=network-online.target

    [Service]
    Environment=MINDOPS_OTLP_ENDPOINT=http://<mindops-host>:4318
    ExecStart=/opt/mindops/mo1-shipper/bin/python -m mindops_ibmi.mo1_ship /var/log/payments/telemetry.mo1
    Restart=always

    [Install]
    WantedBy=multi-user.target
    ```

3. Enable and start the service:

    ```bash
    sudo systemctl enable --now mindops-mo1-shipper
    ```

The shipper starts at the end of the file, so it does not resend old records. Run one shipper for each telemetry file. On Windows, run the same command as a Windows service, for example with NSSM.

The shipper reads these environment variables:

| Variable | Default | Description |
| --- | --- | --- |
| `MINDOPS_OTLP_ENDPOINT` | `http://127.0.0.1:4318` | The MindOps OTLP/HTTP endpoint. |
| `MINDOPS_HOST_NAME` | The server's host name | The `host.name` of the app's telemetry. Keep it equal to the host name that the OpenTelemetry Collector reports, so that MindOps links the service to its host. |

## Step 4: Send the server's host metrics

Install `otelcol-contrib` and save this configuration as `/etc/otelcol-contrib/config.yaml`. The `resourcedetection` processor sets `host.name` to the same value that the shipper uses.

```yaml
receivers:
  hostmetrics:
    collection_interval: 30s
    scrapers:
      cpu: {}
      load: {}
      memory: {}
      disk: {}
      filesystem: {}
      network: {}
      paging: {}
processors:
  resourcedetection:
    detectors: [system]
    system:
      hostname_sources: [os]
  batch: {}
exporters:
  otlphttp:
    endpoint: http://<mindops-host>:4318
service:
  pipelines:
    metrics:
      receivers: [hostmetrics]
      processors: [resourcedetection, batch]
      exporters: [otlphttp]
```

The Linux packages of `otelcol-contrib` install it as a systemd service. For more options, see [Host Metrics](/mindops-docs/infrastructure/hostmetrics/).

## Verify the setup

1. Run the program once.
2. In MindOps, open **Services**. Your `service.name` from `MOINIT` is listed. Open a trace to see its spans and logs.
3. Open **Infrastructure > Hosts**. The server is listed with CPU, memory, disk, and network metrics.

## Troubleshooting

| Symptom | Cause and fix |
| --- | --- |
| The telemetry file stays empty. | `MOTELOUT` is not set in the program's environment, the directory is not writable, or `MOTEL_ENABLED` is `0`. |
| The file grows, but the service is not in Services. | The shipper is not running, or it cannot reach MindOps. Check `systemctl status mindops-mo1-shipper`, then test the endpoint from the server: `curl -s -o /dev/null -w '%{http_code}\n' -X POST http://<mindops-host>:4318/v1/traces`. Any HTTP status means that MindOps is reachable. |
| The service is not linked to the host. | `MINDOPS_HOST_NAME` differs from the host name that the OpenTelemetry Collector reports. Set both to the same value. |
| The service disappears from Services. | Services lists a service only while it has requests in the selected time range. Widen the time range. |

## Limitations

- Timestamps come from `CURRENT-DATE`, which has a resolution of 10 ms. Spans shorter than 10 ms show as 0 ms.
- The span attribute `ibmi.job` holds a placeholder, because Linux and Windows have no IBM i job identity.
- This setup is verified on Ubuntu 24.04 with GnuCOBOL 3.1.2. On Windows, the MO1 shipper is verified (spans arrive with `os.type` `windows`), but building the SDK with GnuCOBOL for Windows is not tested yet.

## Next steps

- Learn the SDK calls in the [API reference](/mindops-docs/instrumentation/cobol-rpg-ibm-i/#api-reference).
- Pass a trace context into your program from a calling service. See [Joining traces across systems](/mindops-docs/instrumentation/cobol-rpg-ibm-i/#joining-traces-across-systems).
- Import the **IBM i Applications** dashboard. Despite its name, it shows every program instrumented with MINDOTEL, including programs on Linux and Windows. See [IBM i Dashboards](/mindops-docs/dashboards/dashboard-templates/ibm-i/).
- Import the alert rules `mindops-ibmi-app-errors` and `mindops-ibmi-sdk-drops`, which also cover MINDOTEL programs on Linux and Windows. See [IBM i alerts](/mindops-docs/infrastructure/ibm-i/#alerts).
