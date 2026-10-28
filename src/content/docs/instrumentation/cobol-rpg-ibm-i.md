---
title: COBOL & RPG on IBM i
description: Instrument ILE COBOL, RPG, and CL programs on IBM i (AS/400) with the MINDOTEL SDK, and see their traces, logs, and metrics in MindOps.
---

This guide covers **Case 2** of the [COBOL & IBM i Overview](/mindops-docs/instrumentation/cobol-and-ibm-i/): COBOL, RPG, or CL programs that run on IBM i. After you complete it, each instrumented program appears in **Services**, with traces down to each Db2 statement.

## How it works

OpenTelemetry has no SDK for COBOL or RPG, and IBM i cannot run the OpenTelemetry Collector. **MINDOTEL** fills this gap. It is a small ILE service program that your programs call to record spans, logs, and metrics. Each call writes one record to a local data queue, `MOTELQ`. The [IBM i collector](/mindops-docs/infrastructure/ibm-i/) on the MindOps server reads the queue and sends the records to MindOps as OpenTelemetry.

MINDOTEL follows the OpenTelemetry data model, resource attributes, semantic attribute names, and W3C trace context. In MindOps, an IBM i program looks like any other service. It differs from an OpenTelemetry SDK in these ways:

| | OpenTelemetry SDK | MINDOTEL |
| --- | --- | --- |
| **Export** | The SDK sends OTLP over the network from inside the app. | The SDK writes a record to a local data queue. The IBM i collector exports it. |
| **Failure** | An exception or a blocked thread is possible. | A call never fails the program. It returns a status code, and a full or missing queue drops only the record. |
| **Call style** | Objects and exceptions | `CALL` with fixed-length parameters and a return code |
| **Instrumentation** | Automatic instrumentation is available. | Explicit calls only |
| **Configuration** | `OTEL_*` environment variables | The data area `MOTELCTL` (on or off) and the job's library list |
| **Attributes** | Any key | Allow-listed keys only, so that no account number or customer data can be sent |

## Before you begin

- IBM i 7.3 TR7, 7.4 TR1, or later, with the ILE COBOL or ILE RPG compiler.
- The [IBM i collector](/mindops-docs/infrastructure/ibm-i/) is running for this system. With the collector alone, the system already appears in Infrastructure > Hosts.
- An IBM i administrator can create a library (`CRTLIB`).
- The `ibmi/sdk` folder of the MindOps repository.

In the examples on this page, replace `APPLIB` with your application library, and `/home/mindops/ibmi/sdk` with the IFS path where you copy the SDK.

The integration has these steps:

| Step | Who | Task |
| --- | --- | --- |
| 1 | IBM i administrator | [Install the SDK](#step-1-install-the-sdk) once per system. |
| 2 | Developer | [Add SDK calls](#step-2-add-sdk-calls-to-your-program) to a program. |
| 3 | Developer | [Compile and bind](#step-3-compile-and-bind) the program to `MINDOTEL`. |
| 4 | Operations | [Run the program](#step-4-run-the-program) with `MINDOTEL` in the library list. |
| 5 | MindOps administrator | Import the [IBM i dashboards](/mindops-docs/dashboards/dashboard-templates/ibm-i/) and [alert rules](/mindops-docs/infrastructure/ibm-i/#alerts). |

## Step 1: Install the SDK

An IBM i administrator does this once per system.

1. Copy the `ibmi/sdk` folder to the IFS. The path must have 1 to 31 characters and no blanks, for example `/home/mindops/ibmi/sdk`.

2. Tag the sources as CCSID 819 (ASCII). ILE COBOL cannot open stream files tagged CCSID 1208. In a PASE or QShell session, run:

    ```bash
    find /home/mindops/ibmi/sdk -type f -exec setccsid 819 {} \;
    ```

3. On an IBM i command line, create the library, then compile and run the build program:

    ```text
    CRTLIB MINDOTEL
    CRTBNDCL PGM(MINDOTEL/MOTELBLD) SRCSTMF('/home/mindops/ibmi/sdk/build/MOTELBLD.clle')
    CALL MINDOTEL/MOTELBLD PARM('/home/mindops/ibmi/sdk' 'MINDOTEL')
    ```

`MOTELBLD` creates these objects in `MINDOTEL`:

- The service program `MINDOTEL`
- The data queue `MOTELQ`
- The data area `MOTELCTL`, set to `'1'` (telemetry on)

:::caution[Size the queue for your volume]
Each queue entry takes about 2,000 bytes, so the default 16 MB `MOTELQ` holds about **8,000 records**. At three records per transaction, that is about 2,700 transactions while the collector is stopped. For a busy system, create a larger queue before you run `MOTELBLD`, for example `CRTDTAQ DTAQ(MINDOTEL/MOTELQ) MAXLEN(2000) SIZE(*MAX2GB) AUTORCL(*YES)`. You cannot change the size of a data queue after you create it.
:::

## Step 2: Add SDK calls to your program

Include the SDK definitions, then call the SDK around the work you want to trace. The definitions are in `<sdk>/copy`: `MOTELAPI` for COBOL and `MOTELAPI.rpgleinc` for RPG.

A typical program does the following:

1. Calls `MOINIT` once, to set its service name, version, and environment.
2. Starts a server span with `MOSPNBEG` for each request or transaction.
3. Starts a client span around each Db2 statement or external call, and adds attributes with `MOSPNATR`.
4. Ends each span with `MOSPNEND`, with `OK` or `ERR`.

For all calls and parameters, see the [API reference](#api-reference).

### Example: a COBOL transfer

ILE COBOL source is fixed format: code goes in columns 8 to 72, and the compiler ignores anything after column 72. Break long `CALL` statements over several lines, as in this example.

```cobol
       WORKING-STORAGE SECTION.
       COPY MOTELAPI.
       01  WS-SPAN                   PIC S9(9) COMP-5.
       01  WS-DB                     PIC S9(9) COMP-5.
       LINKAGE SECTION.
       01  LK-TP                     PIC X(55).
       PROCEDURE DIVISION USING LK-TP.
       MAIN-PARA.
      *    Identity of this job's telemetry.
           MOVE "PAYMENT" TO MOTEL-SERVICE
           MOVE "1.4.0" TO MOTEL-SERVICE-VERSION
           MOVE "prod" TO MOTEL-ENVIRONMENT
           CALL "MOINIT" USING MOTEL-SERVICE MOTEL-SERVICE-VERSION
                               MOTEL-ENVIRONMENT MOTEL-RC
      *    A server span, joined to the caller's trace.
           MOVE "TRANSFER" TO MOTEL-NAME
           SET MOTEL-KIND-SERVER TO TRUE
           CALL "MOSPNBEG" USING MOTEL-NAME MOTEL-KIND LK-TP WS-SPAN
                                 MOTEL-RC
      *    A client span around the Db2 work (never the SQL text).
           MOVE "DB2 UPDATE ACCOUNTS" TO MOTEL-NAME
           SET MOTEL-KIND-CLIENT TO TRUE
           MOVE SPACES TO MOTEL-TRACEPARENT
           CALL "MOSPNBEG" USING MOTEL-NAME MOTEL-KIND
                                 MOTEL-TRACEPARENT WS-DB MOTEL-RC
           MOVE "db.system.name" TO MOTEL-KEY
           MOVE "ibm.db2" TO MOTEL-VALUE
           CALL "MOSPNATR" USING WS-DB MOTEL-KEY MOTEL-VALUE MOTEL-RC
      *    ... EXEC SQL UPDATE ... END-EXEC ...
           MOVE "OK " TO MOTEL-OUTCOME
           MOVE SPACES TO MOTEL-ERR-CATEGORY MOTEL-ERR-CODE
           CALL "MOSPNEND" USING WS-DB MOTEL-OUTCOME
                                 MOTEL-ERR-CATEGORY MOTEL-ERR-CODE
                                 MOTEL-RC
           CALL "MOSPNEND" USING WS-SPAN MOTEL-OUTCOME
                                 MOTEL-ERR-CATEGORY MOTEL-ERR-CODE
                                 MOTEL-RC
           GOBACK.
```

When an SQL statement fails, end its client span with outcome `ERR`, category `remote_execution`, and the message ID as the code, for example `SQL0913`. MindOps then shows the span as an error, with `ibmi.error.code` set.

### Example: RPG

```text
**free
/copy MOTELAPI.rpgleinc
dcl-s span int(10);
dcl-s rc int(10);
dcl-s tp char(55);

MOINIT('PAYMENT': '1.4.0': 'prod': rc);
MOSPNBEG('TRANSFER': 'S': *blanks: span: rc);
MOSPNATR(span: 'rpc.method': 'TRANSFER': rc);
MOTRCCTX(tp: rc);                    // pass tp to the program you call
callp PostTransfer(...: tp: ...);    // its MOSPNBEG(…: tp: …) joins this trace
MOSPNEND(span: 'OK': *blanks: *blanks: rc);
MOMETRIC('payment.transfers': 'C': 1: 'transaction.status': 'ok': rc);
```

## Step 3: Compile and bind

Compile the program to a module with the SDK's copy directory, then bind it to the `MINDOTEL` service program. Use the commands for your language.

ILE COBOL:

```text
CRTCBLMOD MODULE(APPLIB/PAYMENT) SRCSTMF('/home/app/PAYMENT.cbl')
          INCDIR('/home/mindops/ibmi/sdk/copy') LINKLIT(*PRC)
CRTPGM    PGM(APPLIB/PAYMENT) MODULE(APPLIB/PAYMENT)
          BNDSRVPGM(MINDOTEL/MINDOTEL) ACTGRP(*CALLER)
```

ILE COBOL with embedded SQL:

```text
CRTSQLCBLI OBJ(APPLIB/PAYMENT) SRCSTMF('/home/app/PAYMENT.sqlcbl') OBJTYPE(*MODULE)
           INCDIR('/home/mindops/ibmi/sdk/copy') COMPILEOPT('LINKLIT(*PRC)')
CRTPGM     PGM(APPLIB/PAYMENT) MODULE(APPLIB/PAYMENT) BNDSRVPGM(MINDOTEL/MINDOTEL)
```

ILE RPG:

```text
CRTRPGMOD MODULE(APPLIB/BANKAPI) SRCSTMF('/home/app/BANKAPI.rpgle')
          INCDIR('/home/mindops/ibmi/sdk/copy')
CRTPGM    PGM(APPLIB/BANKAPI) MODULE(APPLIB/BANKAPI) BNDSRVPGM(MINDOTEL/MINDOTEL)
```

:::note[Why `LINKLIT(*PRC)`]
`LINKLIT(*PRC)` makes `CALL "MOINIT"` a bound procedure call. Without it, ILE COBOL looks for a program object named `MOINIT` at run time. As an alternative, write each call as `CALL LINKAGE TYPE IS PROCEDURE "MOINIT"`.
:::

## Step 4: Run the program

Add `MINDOTEL` to the library list of the jobs that run instrumented programs, for example in the job description or the system value `QUSRLIBL`. Then run the program as usual.

## Verify the setup

1. Run an instrumented program.
2. Wait a few seconds for the next collector cycle.
3. In MindOps, open **Services** and find the program's `service.name`.
4. Open a trace. It shows the program's spans, the Db2 client spans, and their logs.

## Troubleshooting

| Symptom | Cause and fix |
| --- | --- |
| The compile fails with `LNC9003`. | The source is tagged CCSID 1208. Tag it as 819: `setccsid 819 <file>`. |
| The program stops with `MCH3401` (Cannot resolve to object MOINIT), followed by the inquiry message `LNR7200`. A batch job waits in `MSGW` until an operator answers. | The module was compiled without `LINKLIT(*PRC)`, so COBOL looks for a program object named `MOINIT`. Recompile with the option. This is the only SDK mistake that stops a program, so test every new build once. |
| The compile fails with `LNC1326` (`'MOTEL' not defined name`). | A statement goes past column 72, and the compiler ignores the rest of the line. Break the statement over several lines. |
| SDK calls return `1`. | Telemetry is turned off, or `MOTELQ` is full or not found. Check `DSPDTAARA MINDOTEL/MOTELCTL`, the queue depth in `QSYS2.DATA_QUEUE_INFO`, and the library list. |
| SDK calls return `2`. | The call is invalid, for example an attribute key that is not in the [allowed keys](#allowed-attributes-and-limits). |
| Records go to another queue. | `*LIBL` searches the current library first, so a `MOTELQ` in the current library takes precedence over `MINDOTEL/MOTELQ`. |
| Calls return `0`, but nothing arrives in MindOps. | The collector reads another queue. Check `MINDOPS_IBMI_DATA_QUEUE_LIBRARY`, and check that `/healthz` shows `records_drained` increasing. |
| Telemetry stopped for every new job. | `MOTELCTL` is set to `'0'`. Check it with `DSPDTAARA MINDOTEL/MOTELCTL`. |
| The service disappears from Services. | Services lists a service only while it has requests in the selected time range. Widen the time range. |

In all of these cases, the business transaction still completes. The SDK never fails a program.

## API reference

| Procedure | Parameters | Description |
| --- | --- | --- |
| `MOINIT` | service, version, environment, rc | Sets the telemetry identity of the job. Optional: without it, the job name is used. |
| `MOSPNBEG` | name, kind, traceparent, handle (output), rc | Starts a span. Kinds: `I` internal, `S` server, `C` client, `P` producer, `N` consumer. The parent is the given `traceparent` if there is one, otherwise the job's current span. |
| `MOSPNATR` | handle, key, value, rc | Adds an allowed attribute to a span. |
| `MOSPNEND` | handle, outcome (`OK` or `ERR`), error category, error code, rc | Ends a span. |
| `MOLOG` | severity, message, rc | Writes a log line with the current trace and span IDs. |
| `MOMETRIC` | name, type (`C` counter or `H` histogram), value, label key, label value, rc | Records a metric value. |
| `MOTRCCTX` | traceparent (output), rc | Returns the current trace context, to pass to a called program or service. |

Every call returns one of these codes in `rc`. A call never signals an exception.

| Code | Meaning |
| --- | --- |
| `0` | The record was written. |
| `1` | The record was not written, because the queue is full or unavailable, or because telemetry is turned off (`MOTELCTL` is `'0'`). |
| `2` | The call is invalid, for example because the attribute key is not allowed. |

## Allowed attributes and limits

To keep customer data out of telemetry, MINDOTEL accepts only these keys:

| Kind | Allowed keys |
| --- | --- |
| Span attributes | `ibmi.program`, `ibmi.operation`, `ibmi.library`, `db.system.name`, `db.operation.name`, `db.collection.name`, `rpc.system`, `rpc.service`, `rpc.method`, `peer.alias`, `transaction.type`, `transaction.status`, `customer.segment` |
| Metric labels | `ibmi.program`, `ibmi.operation`, `db.operation.name`, `rpc.method`, `transaction.type`, `transaction.status`, `customer.segment` |
| Error categories | `connection`, `authentication`, `timeout`, `protocol`, `remote_execution`, `other` |

There is no key for SQL text, program arguments, record contents, user IDs, account numbers, or customer IDs. Free text, such as log messages and span names, is sanitized by the SDK and masked again by the collector. Masking covers email addresses, card numbers, national IDs, phone numbers, and secrets.

The SDK has these limits:

- 32 open spans per job, and 16 attributes per span
- 1,024 characters per log message
- 2,000 bytes per record

## Joining traces across systems

A caller with a W3C `traceparent` passes it to the program as a 55-character parameter. The caller can be a Java or Node.js service that calls the program, or another IBM i program that got the context from `MOTRCCTX`. The program passes the value to `MOSPNBEG`. Its span then becomes a child of the caller's span, and MindOps shows one trace across both systems.

## Turning telemetry off

To turn telemetry off for new jobs, run:

```text
CHGDTAARA DTAARA(MINDOTEL/MOTELCTL) VALUE('0')
```

New jobs then record nothing, and every SDK call returns `1` immediately. You do not need to change or recompile any program. Jobs that are already running keep the setting they started with. To turn telemetry on again, set the value back to `'1'`.

## Performance overhead

Measured on IBM i 7.5, with 5 SDK calls and 3 records per transaction:

- With telemetry on: about 0.2 ms per record
- With telemetry off: less than 0.5 µs per transaction

These figures come from a busy shared system, so treat them as an upper bound. Measure on your own system before you roll out.

## Next steps

- Import the [IBM i dashboards](/mindops-docs/dashboards/dashboard-templates/ibm-i/).
- Set up the [IBM i alert rules](/mindops-docs/infrastructure/ibm-i/#alerts).
- Join a Java, Node.js, or Python service on IBM i to the same trace. See [Java, Node.js & Python on IBM i](/mindops-docs/instrumentation/ibm-i-open-source/#join-a-cobol-or-rpg-program-to-the-trace).
