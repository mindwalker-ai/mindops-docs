---
title: Hubungkan Aplikasi ke MindOps (Bahasa Indonesia)
description: Panduan langkah demi langkah mengirim trace, metrik, dan log ke instance MindOps POC di 192.168.111.171.
---

Panduan langkah demi langkah untuk mengirim trace, metrik, dan log dari aplikasi Anda ke instance MindOps di `192.168.111.171`. Tidak perlu akun apa pun di sisi aplikasi — cukup beberapa environment variable.

## Referensi cepat

| | |
|---|---|
| UI MindOps | `http://192.168.111.171:8080` |
| OTLP gRPC | `192.168.111.171:4317` |
| OTLP HTTP | `192.168.111.171:4318` |
| Mindy (asisten AI) | terbuka di dalam UI MindOps setelah login |

## 1. Sebelum mulai

Pastikan tiga hal ini sebelum menyentuh kode aplikasi:

- Host aplikasi Anda bisa menjangkau `192.168.111.171` di port `4317` dan `4318` — uji dengan `curl -v telnet://192.168.111.171:4317`.
- Anda sudah menentukan **nama layanan** (service name) untuk aplikasi ini (mis. `checkout-api`) — inilah nama yang akan tampil di UI MindOps, jadi buat yang mudah dikenali.
- Tidak ada agent atau SDK lain yang sudah mengirim telemetry ke tempat lain dan bisa bentrok — hapus dulu konfigurasi exporter lama jika ada.

> **Satu host Docker dengan MindOps?** Tidak perlu pakai IP sama sekali — gunakan alias jaringan container `signoz-ingester:4317`. Lebih cepat, dan tidak terganggu jika IP berubah.

## 2. Auto-instrument (tanpa ubah kode)

Pilih bahasa aplikasi Anda di bawah ini. Setiap contoh langsung mengirim trace secara otomatis — tidak perlu menulis kode span manual.

### Java (javaagent)

```bash
curl -L -O https://github.com/open-telemetry/opentelemetry-java-instrumentation/releases/latest/download/opentelemetry-javaagent.jar

OTEL_EXPORTER_OTLP_ENDPOINT=http://192.168.111.171:4317 \
OTEL_EXPORTER_OTLP_PROTOCOL=grpc \
OTEL_RESOURCE_ATTRIBUTES=service.name=checkout-api \
java -javaagent:opentelemetry-javaagent.jar -jar myapp.jar
```

### Python (opentelemetry-instrument)

```bash
pip install opentelemetry-distro opentelemetry-exporter-otlp
opentelemetry-bootstrap -a install

OTEL_EXPORTER_OTLP_ENDPOINT=http://192.168.111.171:4317 \
OTEL_EXPORTER_OTLP_PROTOCOL=grpc \
OTEL_RESOURCE_ATTRIBUTES=service.name=checkout-api \
opentelemetry-instrument python app.py
```

### Node.js (auto-instrumentations-node)

```bash
npm install --save @opentelemetry/api @opentelemetry/auto-instrumentations-node

OTEL_EXPORTER_OTLP_ENDPOINT=http://192.168.111.171:4317 \
OTEL_EXPORTER_OTLP_PROTOCOL=grpc \
OTEL_RESOURCE_ATTRIBUTES=service.name=checkout-api \
node --require @opentelemetry/auto-instrumentations-node/register app.js
```

### Go (eBPF auto-instrumentation)

```bash
OTEL_EXPORTER_OTLP_ENDPOINT=http://192.168.111.171:4317 \
OTEL_GO_AUTO_TARGET_EXE=/path/ke/binary-anda \
OTEL_SERVICE_NAME=checkout-api \
otel-go-instrumentation
```

Go tidak punya agent bytecode-weaving seperti Java — perintah ini menjalankan binary Anda melalui auto-instrumenter berbasis eBPF. Untuk kontrol span manual, gunakan Go SDK langsung.

### .NET (OpenTelemetry.AutoInstrumentation)

```bash
# Install bootstrap script resmi, lalu:
export OTEL_EXPORTER_OTLP_ENDPOINT=http://192.168.111.171:4317
export OTEL_SERVICE_NAME=checkout-api
export CORECLR_ENABLE_PROFILING=1
./MyApp
```

## 3. Aplikasi dalam container

Caranya sama, cukup sebagai environment variable di compose — tidak perlu instalasi agent terpisah jika base image sudah menyertakan SDK-nya, kalau belum, install di Dockerfile seperti contoh di atas.

```yaml
services:
  checkout-api:
    environment:
      - OTEL_EXPORTER_OTLP_ENDPOINT=http://192.168.111.171:4317
      - OTEL_EXPORTER_OTLP_PROTOCOL=grpc
      - OTEL_RESOURCE_ATTRIBUTES=service.name=checkout-api
```

## 4. Metrik host (opsional)

Untuk melihat CPU, memori, dan disk dari mesin tempat aplikasi Anda berjalan, install agent collector kecil di host tersebut:

```yaml
receivers:
  hostmetrics:
    collection_interval: 30s
    scrapers:
      cpu: {}
      memory: {}
      disk: {}
exporters:
  otlp:
    endpoint: 192.168.111.171:4317
    tls:
      insecure: true
service:
  pipelines:
    metrics:
      receivers: [hostmetrics]
      exporters: [otlp]
```

Jalankan dengan `otelcol-contrib --config otel-collector-config.yaml`.

## 5. Verifikasi berhasil

1. Jalankan (atau restart) aplikasi Anda dengan environment variable di atas.
2. Kirim beberapa request — apa saja yang benar-benar menjalankan alur kode aslinya.
3. Buka `http://192.168.111.171:8080` → **Services**. Nama layanan Anda akan muncul dalam waktu sekitar satu menit.
4. Klik masuk ke layanan tersebut, lalu ke salah satu trace, untuk memastikan span masuk dengan detail yang sesuai.

## 6. Pemecahan masalah

| Gejala | Kemungkinan penyebab | Solusi |
|---|---|---|
| Layanan tidak pernah muncul | Aplikasi tidak bisa menjangkau ingester | Jalankan uji `curl -v telnet://` dari Langkah 1 di host aplikasi sebenarnya, bukan di laptop Anda |
| Connection refused | Protokol/port tidak cocok — mis. protokol `grpc` diarahkan ke port `4318` | gRPC → `4317`, HTTP → `4318`. Samakan `OTEL_EXPORTER_OTLP_PROTOCOL` dengan port yang dipakai |
| Layanan muncul tapi tanpa trace | `OTEL_RESOURCE_ATTRIBUTES` diset setelah aplikasi sudah berjalan | Environment variable harus sudah ada *sebelum* proses dijalankan, bukan diset saat runtime |
| Timestamp di trace terlihat salah | Clock drift antara host aplikasi dan host MindOps | Sinkronkan kedua host ke NTP |

---

**MindOps** — Panduan Onboarding Pemantauan Aplikasi · Target instance: `192.168.111.171`
