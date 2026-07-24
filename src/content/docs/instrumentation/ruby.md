---
title: Instrument Ruby with OpenTelemetry
description: Auto-instrument a Ruby or Rails application with the OpenTelemetry SDK and opentelemetry-instrumentation-all, exporting traces to MindOps over OTLP.
---

The OpenTelemetry Ruby gems give you one-call auto-instrumentation. A single
configure block enables tracing for Rails, Sinatra, Rack, Net::HTTP, ActiveRecord,
Redis, and more, and ships the spans to MindOps via the OTLP exporter.

## Install the dependencies

Add the gems to your `Gemfile`:

```ruby
gem 'opentelemetry-sdk'
gem 'opentelemetry-exporter-otlp'
gem 'opentelemetry-instrumentation-all'
```

Then install:

```bash
bundle install
```

## Configure the SDK

Create an initializer (`config/initializers/opentelemetry.rb` in Rails, or load
it early in a plain Ruby app):

```ruby
require 'opentelemetry/sdk'
require 'opentelemetry/exporter/otlp'
require 'opentelemetry/instrumentation/all'

OpenTelemetry::SDK.configure do |c|
  c.service_name = 'reporting-service'
  c.use_all # enable every available instrumentation
end
```

`use_all` activates each instrumentation whose target library is present. To be
selective, call `c.use 'OpenTelemetry::Instrumentation::Rack'` for specific ones
instead.

## Configure with environment variables

The OTLP exporter defaults to gRPC. Point it at the local MindOps receiver:

| Variable | Example |
| --- | --- |
| `OTEL_SERVICE_NAME` | `reporting-service` |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | `http://localhost:4317` |
| `OTEL_RESOURCE_ATTRIBUTES` | `deployment.environment=production` |

```bash
OTEL_SERVICE_NAME=reporting-service \
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4317 \
OTEL_RESOURCE_ATTRIBUTES=deployment.environment=production \
bundle exec ruby app.rb
```

For a Rails server:

```bash
OTEL_SERVICE_NAME=reporting-service \
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4317 \
bundle exec rails server
```

:::tip[Self-host needs no API key]
Send OTLP straight to `localhost:4317` on a self-hosted MindOps instance. No
ingestion token or auth header is required — that is only for managed
collectors.
:::

## Add a manual span

```ruby
tracer = OpenTelemetry.tracer_provider.tracer('reporting.workflow')

tracer.in_span('generate_report') do |span|
  span.set_attribute('report.rows', rows.length)
  begin
    build_report(rows)
  rescue => e
    span.record_exception(e)
    span.status = OpenTelemetry::Trace::Status.error(e.message)
    raise
  end
end
```

## Verify in MindOps

Start the app, send a few requests, then open `http://localhost:8080` →
**Services**. The `reporting-service` entry appears with rate, error, and
latency metrics computed automatically from the trace stream.
