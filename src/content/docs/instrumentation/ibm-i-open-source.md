---
title: Java, Node.js & Python on IBM i
description: Monitor Java, Node.js, and Python apps that run on IBM i (PASE) with the standard OpenTelemetry SDKs. The IBM i collector adds the host.
---

This guide covers **Case 3** of the [COBOL & IBM i Overview](/mindops-docs/instrumentation/cobol-and-ibm-i/): an app written in Java, Node.js, or Python that runs on IBM i. After you complete it, the app appears in **Services**, linked to its IBM i system in **Infrastructure > Hosts**.

These apps need no MindOps-specific SDK. The official OpenTelemetry SDKs run on IBM i in PASE and send OTLP directly to MindOps. MINDOTEL is only for ILE programs in [COBOL, RPG, and CL](/mindops-docs/instrumentation/cobol-rpg-ibm-i/).

## How it works

```text
  IBM i (AS/400)                         MindOps server
┌──────────────────────────────┐        ┌──────────────────┐        ┌───────────────────┐
│ Your app (PASE)              │──────── (1) OTLP ─────────────────▶│ Services, Traces, │
│ + OpenTelemetry SDK          │        │                  │        │ Logs              │
│                              │        │                  │        │                   │
│ SQL services (CPU, disk, …)  │─ODBC──▶│ (2) IBM i        │─OTLP──▶│ Infrastructure >  │
│                              │        │     collector    │        │ Hosts             │
└──────────────────────────────┘        └──────────────────┘        └───────────────────┘
```

1. The app's OpenTelemetry SDK sends traces and metrics over OTLP/HTTP, as on any Linux server.
2. The [IBM i collector](/mindops-docs/infrastructure/ibm-i/) reports the system's CPU, disk, memory pools, jobs, and subsystems, because the OpenTelemetry `hostmetrics` receiver does not run on IBM i.

The app's `host.name` is set to the IBM i system name, so MindOps links the service to its host.

## Tested runtimes

These runtimes were tested on IBM i 7.5:

| Runtime | Result |
| --- | --- |
| Node.js 18 (Express) | ✅ Traces and metrics, including an app that reads Db2 for i |
| Python 3.13 (Flask) | ✅ Traces |
| Java 17 | ✅ Traces and metrics through the Java agent, with no code change |
| Next.js | ✅ A Next.js server is a Node.js app (Node.js 18.18 or later), so the Node.js setup applies. React runs in the browser: see [Frontend Monitoring](/mindops-docs/frontend-monitoring/overview/). |
| Go | ❌ Not supported. A Go 1.25 binary built for `aix/ppc64` stops at start-up in PASE with the error `memory allocated by OS … not in usable address space` ([golang/go#45017](https://golang.org/issue/45017)). Run Go services on Linux, and let them reach IBM i over the network. |
| PHP (Laravel) | ⚪ Not tested yet. PHP for IBM i comes from a vendor, such as Seiden PHP+ or ZendPHP, and is not in the IBM open-source repository. The OpenTelemetry PHP SDK is plain PHP and exports `http/protobuf`, so the [PHP setup](/mindops-docs/instrumentation/php/) should apply. Automatic instrumentation needs the `opentelemetry` C extension built for PASE. |

## Before you begin

- The [IBM i collector](/mindops-docs/infrastructure/ibm-i/) is running for this system, so the system appears in Infrastructure > Hosts.
- IBM i can reach MindOps on port 4318. If it cannot, see [Networking](#networking).
- The runtime is installed on IBM i. Node.js and Python come from the IBM i open-source package manager (`yum`, or **Open Source Package Management** in IBM i Access Client Solutions). Java is part of IBM i, in `/QOpenSys/QIBM/ProdData/JavaVM`.

In the examples on this page, replace these values:

| Placeholder | Replace with |
| --- | --- |
| `<mindops-host>` | The host name or IP address of your MindOps server |
| `customer-portal` | The name of your service |
| `PROD1` | The IBM i system name, as set in the collector's `MINDOPS_IBMI_SYSTEM` |
| `/app/portal` | The IFS directory of your app |

## Step 1: Configure the exporter

The same environment variables work for every runtime:

```bash
export OTEL_SERVICE_NAME=customer-portal
export OTEL_EXPORTER_OTLP_ENDPOINT=https://<mindops-host>:4318
export OTEL_EXPORTER_OTLP_PROTOCOL=http/protobuf
export OTEL_RESOURCE_ATTRIBUTES=host.name=PROD1,os.type=ibmi,deployment.environment=production
export OTEL_NODE_RESOURCE_DETECTORS=env,process   # Node.js only
```

- **Use `http/protobuf`, not gRPC.** The gRPC exporters need native modules that might not be built for PASE. The HTTP exporters are pure JavaScript or Python.
- **Set `host.name` to the IBM i system name.** It must match `MINDOPS_IBMI_SYSTEM` in the IBM i collector, so that MindOps links the service to its host.
- **For Node.js, also set `OTEL_NODE_RESOURCE_DETECTORS=env,process`.** By default, the Node.js SDK detects the TCP host name (for example `WWW.EXAMPLE.COM`) and the OS type (`os400`), and these override the values in `OTEL_RESOURCE_ATTRIBUTES`. The service then does not link to its IBM i host. This setting turns those detectors off, so your values apply.

## Step 2: Add OpenTelemetry to your app

Follow the instructions for your runtime.

### Node.js

1. Install the SDK in your app:

    ```bash
    npm install @opentelemetry/api @opentelemetry/sdk-node \
      @opentelemetry/exporter-trace-otlp-proto @opentelemetry/exporter-metrics-otlp-proto \
      @opentelemetry/sdk-metrics @opentelemetry/instrumentation-http @opentelemetry/instrumentation-express
    ```

2. Create `tracing.js`. The SDK reads the `OTEL_*` variables:

    ```javascript
    const { NodeSDK } = require('@opentelemetry/sdk-node');
    const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-proto');
    const { OTLPMetricExporter } = require('@opentelemetry/exporter-metrics-otlp-proto');
    const { PeriodicExportingMetricReader } = require('@opentelemetry/sdk-metrics');
    const { HttpInstrumentation } = require('@opentelemetry/instrumentation-http');
    const { ExpressInstrumentation } = require('@opentelemetry/instrumentation-express');

    new NodeSDK({
      traceExporter: new OTLPTraceExporter(),
      metricReader: new PeriodicExportingMetricReader({ exporter: new OTLPMetricExporter() }),
      instrumentations: [new HttpInstrumentation(), new ExpressInstrumentation()],
    }).start();
    ```

3. Load `tracing.js` before the app:

    ```bash
    node -r ./tracing.js app.js
    ```

### Python

1. Install the SDK in a virtual environment:

    ```bash
    python3 -m venv venv
    venv/bin/pip install opentelemetry-sdk opentelemetry-exporter-otlp-proto-http \
      opentelemetry-instrumentation-flask
    ```

2. Create `otel_setup.py`. The SDK reads the `OTEL_*` variables:

    ```python
    from opentelemetry import trace
    from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter
    from opentelemetry.sdk.resources import Resource
    from opentelemetry.sdk.trace import TracerProvider
    from opentelemetry.sdk.trace.export import BatchSpanProcessor

    provider = TracerProvider(resource=Resource.create())  # OTEL_SERVICE_NAME, OTEL_RESOURCE_ATTRIBUTES
    provider.add_span_processor(BatchSpanProcessor(OTLPSpanExporter()))  # OTEL_EXPORTER_OTLP_ENDPOINT
    trace.set_tracer_provider(provider)
    ```

3. Import `otel_setup` first in your app, then instrument your framework:

    ```python
    import otel_setup  # noqa: F401
    from flask import Flask
    from opentelemetry.instrumentation.flask import FlaskInstrumentor

    app = Flask(__name__)
    FlaskInstrumentor().instrument_app(app)
    ```

For other frameworks, such as Django or FastAPI, install the matching `opentelemetry-instrumentation-*` package. For more options, see [Python](/mindops-docs/instrumentation/python/).

### Java

Download `opentelemetry-javaagent.jar` and attach it to the JVM. You do not need to change the code:

```bash
java -javaagent:/opt/otel/opentelemetry-javaagent.jar -jar app.jar
```

The agent reads the same `OTEL_*` variables. For more options, see [Java](/mindops-docs/instrumentation/java/).

## Step 3: Trace Db2 for i calls

The IBM i database drivers, `idb-connector` for Node.js and `ibm_db` for Python, have no OpenTelemetry instrumentation. To show database time in the trace, wrap each statement in a client span:

```javascript
const { trace, SpanKind, SpanStatusCode } = require('@opentelemetry/api');
const { dbconn, dbstmt } = require('idb-connector');
const tracer = trace.getTracer('customer-portal');
const conn = new dbconn();
conn.conn('*LOCAL');

function query(operation, table, sql) {
  const attributes = { 'db.system.name': 'ibm.db2', 'db.operation.name': operation, 'db.collection.name': table };
  return tracer.startActiveSpan(`DB2 ${operation} ${table}`, { kind: SpanKind.CLIENT, attributes }, (span) =>
    new Promise((resolve, reject) => {
      const stmt = new dbstmt(conn);
      stmt.exec(sql, (rows, error) => {
        stmt.close();
        if (error) {
          span.recordException(error);
          span.setStatus({ code: SpanStatusCode.ERROR });
        }
        span.end();
        return error ? reject(error) : resolve(rows || []);
      });
    }));
}
```

:::caution
Do not put SQL text or parameter values in span attributes. They can contain customer data.
:::

## Step 4: Run the app in the background

1. Put the variables and the start command in a script, for example `/app/portal/start.sh`:

    ```bash
    #!/QOpenSys/usr/bin/sh
    export PATH=/QOpenSys/pkgs/bin:$PATH
    export OTEL_SERVICE_NAME=customer-portal
    export OTEL_EXPORTER_OTLP_ENDPOINT=https://<mindops-host>:4318
    export OTEL_EXPORTER_OTLP_PROTOCOL=http/protobuf
    export OTEL_RESOURCE_ATTRIBUTES=host.name=PROD1,os.type=ibmi,deployment.environment=production
    export OTEL_NODE_RESOURCE_DETECTORS=env,process
    cd /app/portal && exec node -r ./tracing.js app.js >> /app/portal/portal.log 2>&1
    ```

2. Make the script executable, and start it in the background from a PASE shell, for example over SSH:

    ```bash
    chmod +x /app/portal/start.sh
    nohup /app/portal/start.sh > /dev/null 2>&1 &
    ```

    The app keeps running after you log out. Its output goes to `/app/portal/portal.log`.

To start the app automatically when the system starts, submit the same script as a batch job from your startup program, for example `SBMJOB CMD(QSH CMD('/app/portal/start.sh')) JOB(PORTAL)`, or manage it with IBM's Service Commander (`sc`). Check that your batch subsystem has a routing entry for the job: without one, the job ends at once with end code 30 and message `CPC1117`.

## Verify the setup

1. Send a few requests to the app.
2. In MindOps, open **Services**. Your `OTEL_SERVICE_NAME` is listed, with its request rate, errors, and latency.
3. Open a trace. It shows the HTTP, framework, and Db2 client spans.
4. Open **Infrastructure > Hosts**. The IBM i system is listed, and the service is linked to it.

## Join a COBOL or RPG program to the trace

When your app calls an ILE program instrumented with [MINDOTEL](/mindops-docs/instrumentation/cobol-rpg-ibm-i/), pass the current W3C `traceparent` to the program as a 55-character parameter. The program passes it to `MOSPNBEG`, and MindOps shows one trace from the HTTP request down to the program's Db2 statements.

1. Define an SQL procedure over the program, so the app can call it with SQL. This example wraps the program `APPLIB/PAYMENT` from the [COBOL example](/mindops-docs/instrumentation/cobol-rpg-ibm-i/#example-a-cobol-transfer), which takes the `traceparent` as its only parameter:

    ```sql
    CREATE OR REPLACE PROCEDURE APPLIB.PAYMENT_SP (IN TP CHAR(55))
      LANGUAGE COBOLLE PARAMETER STYLE GENERAL EXTERNAL NAME 'APPLIB/PAYMENT';
    ```

    The parameters must match the program's `LINKAGE SECTION` in order, type, and length. With `PARAMETER STYLE GENERAL`, no parameter can be null, including output parameters: give each one an initial value.

2. In the app, start a client span around the call, and pass that span's `traceparent`. The program's spans then nest under the client span:

    ```javascript
    const { trace, context, propagation, SpanKind } = require('@opentelemetry/api');
    const tracer = trace.getTracer('customer-portal');

    function payment() {
      return tracer.startActiveSpan('CALL PAYMENT', { kind: SpanKind.CLIENT }, async (span) => {
        const carrier = {};
        propagation.inject(context.active(), carrier);
        const traceparent = carrier.traceparent; // "00-<trace id>-<span id>-01", 55 characters
        try {
          return await query('CALL', 'PAYMENT_SP', `CALL APPLIB.PAYMENT_SP('${traceparent}')`);
        } finally {
          span.end();
        }
      });
    }
    ```

    `query()` is the function from [Step 3](#step-3-trace-db2-for-i-calls). The `traceparent` holds only hexadecimal digits and dashes, so it is safe in the SQL text. Validate any other value before you put it there.

3. Make sure the program finds `MOTELQ`. With `idb-connector`, SQL statements run in a database server job (`QSQSRVR`) for the connection, not in the app's job, so the program runs there too. Set that job's library list on the same connection, once after you connect, for example:

    ```javascript
    const setup = new dbstmt(conn);
    setup.execSync("CALL QSYS2.QCMDEXC('CHGCURLIB CURLIB(MINDOTEL)')");
    setup.close();
    ```

    Also call `MOINIT` in the program. Otherwise its spans show under the service name `QSQSRVR`, the name of the server job.

For the program side, see [Joining traces across systems](/mindops-docs/instrumentation/cobol-rpg-ibm-i/#joining-traces-across-systems).

## Networking

IBM i must reach the MindOps OTLP endpoint on port 4318. If the IBM i network cannot reach MindOps directly, run an [OpenTelemetry Collector](/mindops-docs/collection-agents/overview/) on a Linux host that both can reach. Configure it to receive OTLP and forward it to MindOps, and set `OTEL_EXPORTER_OTLP_ENDPOINT` to that collector.

## Troubleshooting

| Symptom | Cause and fix |
| --- | --- |
| The service is not in Services. | IBM i cannot reach MindOps. From IBM i, run `curl -s -o /dev/null -w '%{http_code}\n' -X POST $OTEL_EXPORTER_OTLP_ENDPOINT/v1/traces`. Any HTTP status, such as `400` or `415`, means that MindOps is reachable. A timeout means that the network blocks it. |
| A submitted batch job ends at once, with end code 30. | The job log shows `CPC1117 Routing data does not match routing entry`: the batch subsystem does not run the job. Ask the IBM i administrator for a routing entry or job queue, or start the app from a PASE shell as shown in [Step 4](#step-4-run-the-app-in-the-background). |
| The app reports a gRPC or native module error. | Set `OTEL_EXPORTER_OTLP_PROTOCOL=http/protobuf`, and use the `-proto` (Node.js) or `-proto-http` (Python) exporters. |
| The service is not linked to the IBM i host. | `host.name` in `OTEL_RESOURCE_ATTRIBUTES` differs from `MINDOPS_IBMI_SYSTEM`: set both to the same value. For Node.js, if the spans show the TCP host name instead, set `OTEL_NODE_RESOURCE_DETECTORS=env,process`. |
| The program's spans show under the service `QSQSRVR`. | The program does not call `MOINIT`, so its service name is the job name. Call `MOINIT` at the start of the program. |
| Traces show no database time. | Wrap each statement in a client span, as shown in [Step 3: Trace Db2 for i calls](#step-3-trace-db2-for-i-calls). |

## Next steps

- Import the [IBM i Host dashboard](/mindops-docs/dashboards/dashboard-templates/ibm-i/).
- Set up [alerts](/mindops-docs/alerts/overview/) on the service's error rate and latency.
