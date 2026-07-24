---
title: Core Web Vitals
description: Capture Core Web Vitals - LCP, INP, CLS, FCP, and TTFB - in the browser and send them as OpenTelemetry metrics to MindOps for real user performance dashboards.
---

Core Web Vitals are Google's user-centric performance metrics. They measure how fast a page feels, how responsive it is, and how stable the layout stays. Capturing them per real user and sending them to MindOps turns vague "the site feels slow" reports into hard numbers you can chart and alert on.

## The metrics

| Metric | Measures | Good threshold |
|--------|----------|----------------|
| LCP | Largest Contentful Paint - load speed | < 2.5s |
| INP | Interaction to Next Paint - responsiveness | < 200ms |
| CLS | Cumulative Layout Shift - visual stability | < 0.1 |
| FCP | First Contentful Paint - first render | < 1.8s |
| TTFB | Time to First Byte - server response | < 0.8s |

LCP, INP, and CLS are the three official Core Web Vitals; FCP and TTFB are useful supporting diagnostics.

## Collecting them

The simplest path is the `web-vitals` library, which reports each metric as it becomes available, plus an OTLP metrics exporter to forward the values.

```js
import { onLCP, onINP, onCLS, onFCP, onTTFB } from 'web-vitals';
import { metrics } from '@opentelemetry/api';
import { MeterProvider } from '@opentelemetry/sdk-metrics';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';

const reader = new PeriodicExportingMetricReader({
  exporter: new OTLPMetricExporter({ url: 'http://localhost:4318/v1/metrics' }),
  exportIntervalMillis: 15000,
});
const provider = new MeterProvider({ readers: [reader] });
metrics.setGlobalMeterProvider(provider);

const meter = metrics.getMeter('web-vitals');
const report = (name) => meter.createHistogram(`web_vitals.${name}`);

const send = (metric) =>
  report(metric.name.toLowerCase()).record(metric.value, {
    rating: metric.rating,           // good | needs-improvement | poor
    page: location.pathname,
  });

onLCP(send); onINP(send); onCLS(send);
onFCP(send); onTTFB(send);
```

:::note
Record each vital as a histogram so MindOps can show distributions and percentiles, not just averages. A p75 LCP reflects real user experience far better than a mean.
:::

## Why send them as metrics

Vitals are numeric measurements that you want to aggregate across thousands of sessions. Modeling them as metrics, tagged with attributes like `page` and device type, lets you:

- Chart p75 LCP per route over time.
- Compare desktop versus mobile responsiveness.
- Alert when CLS or INP regresses after a release.

:::tip
Tag each measurement with the `rating` field from the web-vitals library. You can then chart the share of "poor" experiences, which maps directly to Google's pass/fail bands.
:::

## Building the dashboard

In the MindOps UI at `http://localhost:8080`, create a dashboard with:

- A p75 time series per vital, grouped by `page`.
- A stacked panel of good / needs-improvement / poor counts from the `rating` attribute.
- A table of the worst routes by p75 LCP and INP.

Then attach a [metric alert](/alerts/metric-log-trace-alerts/) so a Web Vitals regression pages you before users complain.

## Tips

- CLS and INP finalize late, so report them on page hide, not on load.
- Always tag the route; site-wide averages hide the slow pages that matter.
- Keep a sensible export interval (10-30s) to limit request overhead.
