---
title: Linux (Native)
description: Install MindOps natively on a Linux VM using a systemd-managed service, a configuration directory, and a ClickHouse dependency.
---

When a container runtime is not available or not permitted, you can run MindOps directly on a Linux host. This guide uses systemd to supervise the services and a local ClickHouse for storage.

## Prerequisites

- A 64-bit Linux VM (Ubuntu 22.04, Debian 12, RHEL 9, or similar).
- `systemd` as the init system.
- Root or `sudo` access.
- At least 4 GB RAM and a dedicated data disk for ClickHouse.

## 1. Install the ClickHouse dependency

ClickHouse is the telemetry store and must be present before MindOps starts. Install it from the official package repository, then enable the server:

```bash
sudo systemctl enable --now clickhouse-server
sudo systemctl status clickhouse-server
```

Confirm it accepts connections on its native port `9000` before continuing.

:::note
MindOps also needs a Postgres instance for metadata. You can run a local Postgres or point MindOps at an existing managed database via the config file below.
:::

## 2. Install MindOps with foundryctl

Use `foundryctl` with the native mode so it installs binaries and unit files instead of containers:

```yaml
# /etc/mindops/casting.yaml
apiVersion: v1alpha1
kind: Installation
metadata:
  name: mindops
spec:
  flavor: binary
  mode: linux
  storage:
    clickhouse:
      dsn: tcp://127.0.0.1:9000
    postgres:
      dsn: postgres://mindops@127.0.0.1:5432/mindops
  ports:
    ui: 8080
    otlpGrpc: 4317
    otlpHttp: 4318
```

```bash
sudo foundryctl cast --file /etc/mindops/casting.yaml
```

## 3. Configuration directory

Native installs keep their configuration under `/etc/mindops/`:

| Path | Contents |
| --- | --- |
| `/etc/mindops/casting.yaml` | The installation manifest. |
| `/etc/mindops/collector.yaml` | OpenTelemetry Collector pipeline config. |
| `/var/lib/mindops/` | Working data and local state. |

## 4. Manage the systemd service

`foundryctl` installs a unit you control with standard systemd commands:

```bash
sudo systemctl enable --now mindops
sudo systemctl status mindops
sudo journalctl -u mindops -f      # tail logs
```

To apply config changes, edit the files under `/etc/mindops/` and restart:

```bash
sudo systemctl restart mindops
```

## 5. Access and send telemetry

Open the UI and create the first admin account:

```text
http://<vm-host>:8080
```

Point applications at the collector. **No ingestion key** is needed for self-hosted MindOps:

```bash
export OTEL_EXPORTER_OTLP_ENDPOINT=http://<vm-host>:4317
export OTEL_SERVICE_NAME=checkout-service
```

## Uninstall

```bash
sudo systemctl disable --now mindops
sudo foundryctl cast --file /etc/mindops/casting.yaml --uninstall
```

:::caution
Removing MindOps does not drop the ClickHouse database. To delete telemetry permanently, drop the MindOps databases in ClickHouse and remove `/var/lib/mindops/`. See the [uninstall guide](/install/uninstall/).
:::
