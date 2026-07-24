---
title: Instrument Elixir with OpenTelemetry
description: Add OpenTelemetry to an Elixir or Phoenix application with the opentelemetry and opentelemetry_exporter Hex packages and ship traces to MindOps.
---

Elixir instrumentation builds on Erlang's `:telemetry` events. The
`opentelemetry` and `opentelemetry_exporter` packages capture those events as
spans and forward them to MindOps over OTLP. Phoenix and Ecto have dedicated
bridge packages that hook the framework's telemetry handlers.

## Add the dependencies

In `mix.exs`:

```elixir
defp deps do
  [
    {:opentelemetry, "~> 1.5"},
    {:opentelemetry_exporter, "~> 1.8"},
    {:opentelemetry_phoenix, "~> 2.0"},
    {:opentelemetry_ecto, "~> 1.2"}
  ]
end
```

Fetch them:

```bash
mix deps.get
```

## Configure the exporter

In `config/runtime.exs`, point the OTLP exporter at the local MindOps endpoint:

```elixir
import Config

config :opentelemetry,
  resource: %{service: %{name: "notifications-service"}}

config :opentelemetry, :processors,
  otel_batch_processor: %{
    exporter: {
      :opentelemetry_exporter,
      %{endpoints: ["http://localhost:4317"]}
    }
  }
```

## Attach the framework bridges

Call the setup functions when your application starts, in `application.ex`:

```elixir
def start(_type, _args) do
  OpentelemetryPhoenix.setup(adapter: :bandit)
  OpentelemetryEcto.setup([:my_app, :repo])

  children = [
    MyAppWeb.Endpoint,
    MyApp.Repo
  ]

  Supervisor.start_link(children, strategy: :one_for_one, name: MyApp.Supervisor)
end
```

:::note[Phoenix note]
`OpentelemetryPhoenix.setup/1` subscribes to the router's `:telemetry` events,
so every controller action becomes a server span automatically. Pair it with
`OpentelemetryEcto.setup/1` to capture database query spans as child spans.
:::

## Configure with environment variables

The exporter also honors the standard OpenTelemetry variables:

| Variable | Example |
| --- | --- |
| `OTEL_SERVICE_NAME` | `notifications-service` |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | `http://localhost:4317` |
| `OTEL_RESOURCE_ATTRIBUTES` | `deployment.environment=production` |

```bash
OTEL_SERVICE_NAME=notifications-service \
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4317 \
OTEL_RESOURCE_ATTRIBUTES=deployment.environment=production \
mix phx.server
```

:::tip[Self-host: no key required]
A self-hosted MindOps Collector accepts OTLP on `localhost:4317` without any
authentication header. No ingestion key is configured for local deployments.
:::

## Add a manual span

```elixir
require OpenTelemetry.Tracer, as: Tracer

Tracer.with_span "send_digest" do
  Tracer.set_attribute("recipient.count", length(recipients))
  send_digest(recipients)
end
```

## Verify in MindOps

Boot the app, generate a few requests, then open `http://localhost:8080` →
**Services**. `notifications-service` appears with request rate, error rate, and
latency percentiles derived from the trace data.
