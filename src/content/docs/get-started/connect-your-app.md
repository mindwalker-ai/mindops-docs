---
title: Connect Your App to MindOps
description: Step-by-step guide to sending traces, metrics, and logs from your application to the MindOps POC instance at 192.168.111.171.
---

A step-by-step guide to sending traces, metrics, and logs from your application to the MindOps instance at `192.168.111.171`. No account on the target app is required — just a few environment variables.

## Quick reference

| | |
|---|---|
| MindOps UI | `http://192.168.111.171:8080` |
| OTLP gRPC | `192.168.111.171:4317` |
| OTLP HTTP | `192.168.111.171:4318` |
| Mindy (AI assistant) | opens inside the MindOps UI after login |

## 1. Before you start

Confirm three things before touching any app code:

- Your app's host can reach `192.168.111.171` on ports `4317` and `4318` — test with `curl -v telnet://192.168.111.171:4317`.
- You've picked a **service name** for the app (e.g. `checkout-api`) — this is how it will appear in the MindOps UI, so make it recognizable.
- No agent or SDK is already sending telemetry elsewhere that would conflict — remove any old exporter config first.

> **Same Docker host as MindOps?** Skip the IP entirely and use the container network alias `signoz-ingester:4317` instead — faster, and survives an IP change.

## 2. Auto-instrument (no code changes)

Pick your language below. Each snippet ships traces automatically — no manual span code required.

### Java (javaagent)

```bash
curl -L -O https://github.com/open-telemetry/opentelemetry-java-instrumentation/releases/latest/download/opentelemetry-javaagent.jar

OTEL_EXPORTER_OTLP_ENDPOINT=http://192.168.111.171:4317 \
OTEL_EXPORTER_OTLP_PROTOCOL=grpc \
OTEL_RESOURCE_ATTRIBUTES=service.name=checkout-api \
java -javaagent:opentelemetry-javaagent.jar -jar myapp.jar
```

### Python (opentelemetry-instrument)

```bash
pip install opentelemetry-distro opentelemetry-exporter-otlp
opentelemetry-bootstrap -a install

OTEL_EXPORTER_OTLP_ENDPOINT=http://192.168.111.171:4317 \
OTEL_EXPORTER_OTLP_PROTOCOL=grpc \
OTEL_RESOURCE_ATTRIBUTES=service.name=checkout-api \
opentelemetry-instrument python app.py
```

### Node.js (auto-instrumentations-node)

```bash
npm install --save @opentelemetry/api @opentelemetry/auto-instrumentations-node

OTEL_EXPORTER_OTLP_ENDPOINT=http://192.168.111.171:4317 \
OTEL_EXPORTER_OTLP_PROTOCOL=grpc \
OTEL_RESOURCE_ATTRIBUTES=service.name=checkout-api \
node --require @opentelemetry/auto-instrumentations-node/register app.js
```

### Go (eBPF auto-instrumentation)

```bash
OTEL_EXPORTER_OTLP_ENDPOINT=http://192.168.111.171:4317 \
OTEL_GO_AUTO_TARGET_EXE=/path/to/your/binary \
OTEL_SERVICE_NAME=checkout-api \
otel-go-instrumentation
```

Go has no bytecode-weaving agent like Java — this runs your binary under an eBPF-based auto-instrumenter instead. For manual span control, use the Go SDK directly.

### .NET (OpenTelemetry.AutoInstrumentation)

```bash
# Install the official bootstrap script, then:
export OTEL_EXPORTER_OTLP_ENDPOINT=http://192.168.111.171:4317
export OTEL_SERVICE_NAME=checkout-api
export CORECLR_ENABLE_PROFILING=1
./MyApp
```

## 3. Containerized apps

Same idea, just as compose environment variables — no agent install step needed if your base image already includes the SDK, otherwise install it in the Dockerfile as above.

```yaml
services:
  checkout-api:
    environment:
      - OTEL_EXPORTER_OTLP_ENDPOINT=http://192.168.111.171:4317
      - OTEL_EXPORTER_OTLP_PROTOCOL=grpc
      - OTEL_RESOURCE_ATTRIBUTES=service.name=checkout-api
```

## 4. Host metrics (optional)

To also see CPU, memory, and disk for the machine your app runs on, install a small collector agent on that host:

```yaml
receivers:
  hostmetrics:
    collection_interval: 30s
    scrapers:
      cpu: {}
      memory: {}
      disk: {}
exporters:
  otlp:
    endpoint: 192.168.111.171:4317
    tls:
      insecure: true
service:
  pipelines:
    metrics:
      receivers: [hostmetrics]
      exporters: [otlp]
```

Run with `otelcol-contrib --config otel-collector-config.yaml`.

## 5. Verify it's working

1. Start (or restart) your app with the environment variables above.
2. Send it a few requests — anything that exercises a real code path.
3. Open `http://192.168.111.171:8080` → **Services**. Your service name should appear within about a minute.
4. Click into it, then into a trace, to confirm spans are landing with the detail you expect.

## 6. Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Service never appears | App can't reach the ingester | Run the `curl -v telnet://` test from Step 1 on the app's actual host, not your laptop |
| Connection refused | Protocol/port mismatch — e.g. `grpc` protocol pointed at port `4318` | gRPC → `4317`, HTTP → `4318`. Match `OTEL_EXPORTER_OTLP_PROTOCOL` to the port |
| Service appears but with no traces | `OTEL_RESOURCE_ATTRIBUTES` set after the app already started | Env vars must be present *before* the process launches, not set at runtime |
| Timestamps look wrong in traces | Clock drift between the app host and the MindOps host | Sync both hosts to NTP |

---

**MindOps** — Application Monitoring Onboarding · Target instance: `192.168.111.171`
