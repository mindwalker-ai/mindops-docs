---
title: LLM Observability with MindOps
description: Monitor GenAI and LLM applications using OpenTelemetry GenAI semantic conventions — capture model, tokens, latency, and cost in MindOps.
---

LLM applications fail in ways traditional services do not: a prompt balloons in token
count, a model call times out, or cost quietly creeps up per request. MindOps treats
these like any other telemetry by leaning on the **OpenTelemetry GenAI semantic
conventions**, a shared vocabulary for describing model calls as spans.

## What a model call looks like as a span

Each call to an LLM becomes a span with standardized attributes, so dashboards and
queries work the same regardless of provider:

| Attribute | Example | Why it matters |
|-----------|---------|----------------|
| `gen_ai.system` | `openai`, `anthropic` | Which provider served the call |
| `gen_ai.request.model` | `gpt-4o`, `claude-sonnet` | Model and version |
| `gen_ai.usage.input_tokens` | `1820` | Prompt size — drives cost |
| `gen_ai.usage.output_tokens` | `340` | Completion size |
| `gen_ai.request.temperature` | `0.2` | Sampling settings |
| span duration | `2.3s` | End-to-end model latency |

From these you derive the four numbers that define LLM health: **model**, **tokens**,
**latency**, and **cost**.

## Instrument your app

The model client libraries are instrumented with OpenTelemetry, so a few lines of setup
auto-capture every call. The pattern is the same across stacks:

```python
from opentelemetry.instrumentation.openai import OpenAIInstrumentor

OpenAIInstrumentor().instrument()
# existing OpenAI client calls are now traced as GenAI spans
```

Set the standard OTLP environment variables to ship to MindOps:

```bash
export OTEL_EXPORTER_OTLP_ENDPOINT="http://localhost:4318"
export OTEL_EXPORTER_OTLP_PROTOCOL="http/protobuf"
export OTEL_SERVICE_NAME="rag-assistant"
```

## Works across the ecosystem

Because the conventions are vendor-neutral, the same approach covers the common GenAI
stacks without bespoke integrations:

- **Model providers** — OpenAI, Anthropic, and other chat/completion APIs
- **Orchestration frameworks** — LangChain and LlamaIndex emit spans for chains, agents,
  retrievers, and tool calls
- **Vector and retrieval steps** — embedding and similarity-search calls show up as
  child spans in the same trace

A single RAG request then appears as one trace: retrieval → prompt assembly → model call
→ post-processing, with token counts and latency on each step.

## Cost and token tracking

Cost is `input_tokens × input_price + output_tokens × output_price`. Capture token counts
as span attributes, then build a MindOps dashboard that aggregates tokens per model and
multiplies by your per-token rate. Group by `gen_ai.request.model` to see which model
and which feature drive spend.

:::tip
Trace the whole request, not just the model call. When a chat endpoint is slow, the trace
shows whether time went to retrieval, the model, or your own glue code.
:::

:::caution
Prompts and completions can contain sensitive user data. Use a Collector processor to
redact or drop message-content attributes before they reach storage if your policy
requires it.
:::

:::note
Self-hosted MindOps needs no ingestion key — export straight to OTLP and open the traces
in the UI at `http://localhost:8080`. See the [Introduction](/mindops-docs/introduction/) for how the
three signals stay correlated.
:::
