---
title: Trace Funnels
description: Define multi-step funnels across services in MindOps to measure conversion, drop-off, and inter-step latency from your trace data.
---

A trace funnel measures how requests progress through an ordered sequence of operations that may span several services. Where the [Service Map](/mindops-docs/traces/service-map/) shows structure, a funnel shows *flow* — how many requests that reached step 1 also reached step 2, and how long the journey took.

## When to use a funnel

Use funnels for any multi-step path where drop-off matters:

- Checkout: `cart → payment → order-confirmed`
- Signup: `landing → register → verify-email → activated`
- Ingest pipeline: `received → validated → enriched → persisted`

Each step is identified by a span — typically a `service.name` plus an operation `name` — and the steps are ordered.

## Defining the steps

A funnel is a list of step definitions evaluated against each trace:

```text
Step 1  service.name = web        name = POST /checkout
Step 2  service.name = payments   name = charge.authorize
Step 3  service.name = orders     name = order.create
```

A trace "completes" a step when it contains a span matching that step's criteria, and the steps occur in order within the same trace.

## Metrics a funnel reports

| Metric | Meaning |
|--------|---------|
| Conversion rate | Share of traces entering the funnel that reach the final step |
| Step conversion | Share advancing from one specific step to the next |
| Drop-off | Where traces fall out — the inverse of step conversion |
| Inter-step latency | Time elapsed between two consecutive steps |
| Error contribution | How many drop-offs coincide with `status = error` spans |

:::tip
Watch inter-step latency, not just conversion. A funnel can convert at 99% while a single hop quietly adds two seconds of delay between steps.
:::

## Interpreting results

1. **Largest drop-off first.** The step pair with the worst conversion is where users or requests are being lost.
2. **Correlate drop-off with errors.** If drop-off at `payment → order` lines up with a spike in `status = error`, the failure is technical, not behavioral.
3. **Compare over time.** A conversion dip after a deploy is a regression signal worth alerting on.

:::note
Funnels are derived from the same spans as everything else in MindOps — no extra instrumentation is required beyond the spans your services already emit over OTLP.
:::

From any funnel step you can jump into the matching traces in the [Trace Explorer](/mindops-docs/traces/trace-explorer/) to inspect exactly why requests dropped out.
