---
title: Tail-Based Sampling
description: Use the OpenTelemetry Collector tail_sampling processor to keep error and slow traces while dropping routine ones before they reach MindOps.
---

At scale, storing every trace is wasteful — the overwhelming majority are fast, successful, and indistinguishable. **Tail-based sampling** lets the Collector wait until a trace is complete, then decide whether to keep it based on what actually happened: keep the errors and the slow ones, drop the boring rest.

## Head vs tail sampling

| | Decision made | Sees full trace? | Can keep all errors? |
|---|---|---|---|
| Head sampling | At trace start, in the SDK | No | No |
| Tail sampling | After spans arrive, in the Collector | Yes | Yes |

Head sampling is cheap but blind — it cannot know a request will fail. Tail sampling buffers spans, waits for the trace to finish, and applies policies with full knowledge of latency and status.

## The `tail_sampling` processor

The processor groups spans by `trace_id`, holds them for a decision window, then evaluates an ordered list of policies. If any policy says *keep*, the whole trace is exported.

```yaml
processors:
  tail_sampling:
    decision_wait: 10s
    num_traces: 50000
    expected_new_traces_per_sec: 1000
    policies:
      - name: keep-errors
        type: status_code
        status_code:
          status_codes: [ERROR]
      - name: keep-slow
        type: latency
        latency:
          threshold_ms: 800
      - name: sample-the-rest
        type: probabilistic
        probabilistic:
          sampling_percentage: 5
```

This config keeps 100% of error traces, 100% of traces slower than 800ms, and a 5% sample of everything else.

Wire it into a traces pipeline that exports to MindOps:

```yaml
service:
  pipelines:
    traces:
      receivers: [otlp]
      processors: [tail_sampling, batch]
      exporters: [otlp/mindops]
```

:::caution
Tail sampling requires that **all spans of a trace reach the same Collector instance**. In a horizontally scaled gateway, put a trace-ID-aware load balancer (the `loadbalancing` exporter) in front so spans from one trace are not split across replicas — otherwise decisions are made on partial traces.
:::

:::note
`decision_wait` is the trade-off knob: too short and you decide before slow spans arrive; too long and you buffer more in memory. Set it comfortably above your slowest expected trace.
:::

## Tips

- Order policies from most specific to least; the first *keep* wins.
- Add a `string_attribute` policy to always retain traces for a critical tenant or route.
- To simply discard noise without latency-based logic, prefer the lighter [span dropping](/mindops-docs/traces/drop-spans/) approach instead.
