---
title: Instrument Python with OpenTelemetry
description: Auto-instrument a Python application with OpenTelemetry and ship traces, metrics, and logs to MindOps using opentelemetry-distro and opentelemetry-bootstrap.
---

MindOps reads standard OpenTelemetry data, so the fastest way to onboard a Python
service is the official `opentelemetry-distro`. It wires up a tracer provider, an
OTLP exporter, and dozens of library integrations without touching your code.

## Install the dependencies

```bash
pip install opentelemetry-distro opentelemetry-exporter-otlp
```

The `opentelemetry-bootstrap` command then scans your installed packages (Flask,
Django, FastAPI, requests, psycopg2, and more) and installs a matching
instrumentation for each one.

```bash
opentelemetry-bootstrap -a install
```

## Configure with environment variables

All exporter settings are driven by environment variables. For a self-hosted
MindOps instance, point the OTLP endpoint at the local Collector port.

| Variable | Example | Purpose |
| --- | --- | --- |
| `OTEL_SERVICE_NAME` | `cart-service` | Name shown in the Services list |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | `http://localhost:4317` | gRPC OTLP receiver |
| `OTEL_EXPORTER_OTLP_PROTOCOL` | `grpc` | Use `http/protobuf` for port `4318` |
| `OTEL_RESOURCE_ATTRIBUTES` | `deployment.environment=production` | Extra resource tags |

:::tip[No ingestion key needed]
A self-hosted MindOps deployment accepts OTLP traffic on `:4317` (gRPC) and
`:4318` (HTTP) directly. You do **not** configure an API key or header — only
managed cloud collectors require one.
:::

## Run your application

Wrap your normal start command with `opentelemetry-instrument`:

```bash
OTEL_SERVICE_NAME=cart-service \
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4317 \
OTEL_EXPORTER_OTLP_PROTOCOL=grpc \
OTEL_RESOURCE_ATTRIBUTES=deployment.environment=production \
opentelemetry-instrument python app.py
```

For HTTP transport instead of gRPC, switch the port and protocol:

```bash
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318 \
OTEL_EXPORTER_OTLP_PROTOCOL=http/protobuf \
opentelemetry-instrument python app.py
```

## Add a manual span

Auto-instrumentation covers framework boundaries; add manual spans for the
business logic you care about.

```python
from opentelemetry import trace

tracer = trace.get_tracer("checkout.workflow")

def place_order(cart):
    with tracer.start_as_current_span("place_order") as span:
        span.set_attribute("cart.item_count", len(cart.items))
        span.set_attribute("cart.total_cents", cart.total_cents)
        try:
            charge(cart)
            span.add_event("payment_authorized")
        except PaymentError as exc:
            span.record_exception(exc)
            span.set_status(trace.StatusCode.ERROR, str(exc))
            raise
```

These spans nest automatically inside the auto-instrumented request span, so the
full call tree appears as a single trace.

## Verify in MindOps

1. Generate some traffic against your service.
2. Open MindOps at `http://localhost:8080`.
3. Go to **Services** — your `OTEL_SERVICE_NAME` should appear within a minute,
   with request rate, error rate, and latency (p50/p90/p99) populated from the
   incoming traces.

:::note
If the service does not appear, confirm the process can reach `localhost:4317`
and that `opentelemetry-bootstrap -a install` completed without errors.
:::
