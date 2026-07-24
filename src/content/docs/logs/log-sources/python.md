---
title: Ship Python Logs to MindOps
description: Forward Python application logs to MindOps using the OpenTelemetry logging handler and the OTLP exporter over gRPC or HTTP.
---

This guide wires the standard Python `logging` module into MindOps through the OpenTelemetry SDK. Records emitted by your loggers are converted into OTLP log records and exported to the MindOps OTLP endpoint, where ClickHouse stores them for search.

## Install the packages

```bash
pip install opentelemetry-sdk \
  opentelemetry-exporter-otlp-proto-grpc \
  opentelemetry-api
```

## Configure the OpenTelemetry logging handler

The `LoggingHandler` bridges Python's `logging` records into the OpenTelemetry log pipeline. Attach it to the root logger so every module's output flows to MindOps.

```python
import logging
from opentelemetry._logs import set_logger_provider
from opentelemetry.sdk._logs import LoggerProvider, LoggingHandler
from opentelemetry.sdk._logs.export import BatchLogRecordProcessor
from opentelemetry.sdk.resources import Resource
from opentelemetry.exporter.otlp.proto.grpc._log_exporter import OTLPLogExporter

resource = Resource.create({"service.name": "billing-api"})
provider = LoggerProvider(resource=resource)
set_logger_provider(provider)

# Self-hosted MindOps needs NO ingestion key.
exporter = OTLPLogExporter(endpoint="localhost:4317", insecure=True)
provider.add_log_record_processor(BatchLogRecordProcessor(exporter))

handler = LoggingHandler(level=logging.NOTSET, logger_provider=provider)
logging.getLogger().addHandler(handler)
logging.getLogger().setLevel(logging.INFO)

log = logging.getLogger(__name__)
log.info("Checkout completed", extra={"order_id": "A-1187", "amount": 42.50})
```

## Where the endpoint goes

The `endpoint` argument points at the MindOps OTLP receiver.

- Local install: `localhost:4317` (gRPC) or `http://localhost:4318/v1/logs` (HTTP).
- App running inside Docker Compose alongside MindOps: use the service name, e.g. `signoz-ingester:4317`.

To use HTTP instead of gRPC, install `opentelemetry-exporter-otlp-proto-http` and import `OTLPLogExporter` from the `http._log_exporter` module, passing the full `/v1/logs` URL.

:::tip
Set `service.name` in the `Resource` so MindOps groups your logs under a meaningful service. Add `deployment.environment` to separate staging from production.
:::

## Verify in MindOps

1. Run your app so it emits a few log lines.
2. Open MindOps at `http://localhost:8080` and go to **Logs**.
3. Filter on `service.name = billing-api` and confirm your records, including the `order_id` and `amount` attributes, appear in the stream.
