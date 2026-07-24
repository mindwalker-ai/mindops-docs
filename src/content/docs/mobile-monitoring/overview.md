---
title: Mobile Monitoring Overview
description: Bring mobile observability to MindOps with OpenTelemetry - supported platforms (Android, iOS, Flutter, React Native) and the gateway Collector pattern for shipping telemetry from devices.
---

Mobile apps run on networks you do not control, on devices you cannot SSH into. Observability closes that gap: by instrumenting the app with OpenTelemetry, MindOps receives traces, metrics, and logs from real devices and ties slow screens or crashes back to the backend calls behind them.

## Supported platforms

| Platform | SDK |
|----------|-----|
| Android (Kotlin/Java) | OpenTelemetry Android SDK |
| iOS (Swift) | OpenTelemetry Swift SDK |
| Flutter | OpenTelemetry Dart SDK |
| React Native | OpenTelemetry JS SDK |

Each SDK speaks OTLP, so the same MindOps backend ingests all of them without per-platform special cases.

## What you can capture

- App start and screen-load spans.
- Network request spans with URL, status, and duration.
- Crashes and unhandled exceptions.
- Custom spans and metrics for the flows you care about.

Because the device propagates trace context on its HTTP calls, a slow checkout on the phone can be followed straight into your services.

## The gateway Collector pattern

Mobile clients should not export directly to your internal MindOps instance. Devices are untrusted, networks are flaky, and you want a control point. Put a gateway OpenTelemetry Collector at the edge instead.

```text
Mobile app (OTel SDK)
   --> OTLP/HTTP over the public internet
       --> Gateway Collector (TLS, auth, rate limiting)
           --> MindOps (ClickHouse)
               --> UI at http://localhost:8080
```

The gateway terminates TLS, can authenticate or rate-limit clients, batches data, and strips anything sensitive before it reaches storage.

:::note
On a self-hosted MindOps the backend itself needs no ingestion key, but a public gateway should still front it with TLS and its own access controls, since the endpoint is reachable from devices in the wild.
:::

## Choosing the export protocol

Mobile SDKs use OTLP over HTTP (port `4318` on the Collector) far more often than gRPC, because HTTP is friendlier to mobile networks and proxies. Send to the gateway's public HTTPS URL, not to `localhost`.

```text
OTLP/HTTP traces  -> https://otel.example.com/v1/traces
OTLP/HTTP metrics -> https://otel.example.com/v1/metrics
OTLP/HTTP logs    -> https://otel.example.com/v1/logs
```

## Good practices

- Batch and compress exports to respect mobile data and battery.
- Sample traces; you do not need every session from a popular app.
- Buffer telemetry offline and flush when connectivity returns.
- Never put secrets, tokens, or PII in span or log attributes.

## Next steps

- [Android & Kotlin](/mobile-monitoring/android-kotlin/)
- [iOS & Swift](/mobile-monitoring/ios-swift/)
- [Flutter & React Native](/mobile-monitoring/flutter-react-native/)
