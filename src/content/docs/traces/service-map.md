---
title: Service Map
description: Read the live service dependency graph that MindOps builds from spans, interpret node and edge metrics, and find latency and error bottlenecks.
---

The Service Map is a dependency graph that MindOps assembles automatically from your trace data. You do not configure it — every `client`/`server` span pair contributes an edge, and the picture updates as traffic flows.

## How the graph is built

When service A calls service B, A emits a `client` span and B emits a `server` span, both sharing the same trace. MindOps stitches these together and aggregates them over the selected time window to draw:

- **Nodes** — your services (and detected external dependencies such as databases, caches, and third-party APIs).
- **Edges** — a call relationship from one service to another, directed by the request flow.

## Reading nodes and edges

Each node and edge is colored and labeled by health metrics computed from the underlying spans:

| Element | Metric | What it tells you |
|---------|--------|-------------------|
| Node | Request rate | How much traffic the service is handling |
| Node | Error rate | Share of spans with `status = error` |
| Node | P99 latency | Tail latency for the service's server spans |
| Edge | Call latency | Time spent on that specific dependency call |
| Edge | Error rate | Share of failing calls on that hop |

Nodes and edges turn red as error rate climbs, giving you an at-a-glance heat map of where things are unhealthy.

:::note
An external dependency like `postgres` or a payment gateway shows up as a node even though it is not instrumented, because your `client` spans name it.
:::

## Finding bottlenecks

The map is built for answering "where is the problem actually coming from?"

1. **Start at the red.** A node glowing red with high error rate is your incident epicenter.
2. **Follow the edges inward.** Is the service failing on its own, or because a downstream edge is red? A healthy service feeding a red database edge means the database — not your code — is the root cause.
3. **Watch for latency amplification.** A single slow dependency deep in the graph can inflate latency for every service that fans out to it.

:::tip
High error rate on a *node* but green *edges* points at internal failures — bad deploys, unhandled exceptions, resource exhaustion. High error rate on an *edge* points at the connection or the callee.
:::

From any node or edge, drill into the matching spans in the [Trace Explorer](/mindops-docs/traces/trace-explorer/) to move from "this hop is slow" to the exact traces proving it.
