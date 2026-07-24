---
title: Uninstall
description: Tear down each MindOps deployment type, remove persistent volumes safely, and understand the data-loss caveats before you delete anything.
---

This page covers removing MindOps cleanly across every deployment type. The recurring theme: stopping the stack is reversible, but deleting volumes is permanent.

:::caution
All telemetry lives in ClickHouse and all platform metadata lives in Postgres. **Deleting their volumes erases your traces, metrics, logs, dashboards, and users with no recovery.** Back up anything you need before removing storage.
:::

## Before you uninstall

1. Export or back up dashboards and saved views you want to keep.
2. Snapshot or copy the ClickHouse volume if you may need historical data later.
3. Confirm no applications are still pointed at the collector, or expect export errors in their logs.

## Docker Standalone

Stop the stack while keeping data:

```bash
docker compose down
```

Remove the stack **and** its data:

```bash
docker compose down -v
```

Then delete the rendered project and data directory:

```bash
rm -rf ./data casting.yaml
```

The `-v` flag is what deletes named volumes. Omit it to preserve telemetry.

## Docker Swarm

Remove the stack and its overlay network:

```bash
docker stack rm mindops
docker network rm mindops-net
```

Swarm leaves pinned volumes on their storage nodes. Clean them up per node:

```bash
docker volume rm mindops_clickhouse mindops_postgres
```

## Linux (native)

Disable the service and uninstall through `foundryctl`:

```bash
sudo systemctl disable --now mindops
sudo foundryctl cast --file /etc/mindops/casting.yaml --uninstall
```

To remove data, drop the MindOps databases in ClickHouse and delete the config and state directories:

```bash
sudo rm -rf /etc/mindops /var/lib/mindops
```

If ClickHouse was installed only for MindOps, remove it separately.

## Kubernetes (including EKS and GKE)

Uninstall the Helm release:

```bash
helm uninstall mindops -n mindops
```

Helm intentionally **retains PersistentVolumeClaims** so data survives a reinstall. Delete them to reclaim storage:

```bash
kubectl delete pvc -n mindops --all
kubectl delete namespace mindops
```

| Cloud | Extra cleanup |
| --- | --- |
| EKS | Confirm EBS volumes and load balancers are deleted to stop charges. |
| GKE | Confirm persistent disks and load balancers are deleted to stop charges. |

## AWS ECS

1. Delete each ECS service (collector, ClickHouse, Postgres, query service, UI).
2. Deregister the task definitions.
3. Remove the load balancers and target groups.
4. Delete the EFS file system **only after** confirming the data is no longer needed.

## Verification checklist

- [ ] No MindOps containers, pods, or tasks running.
- [ ] Volumes or persistent disks removed (or deliberately kept).
- [ ] Load balancers and reserved IPs released.
- [ ] Applications no longer export to the old collector endpoint.

Reinstalling later is straightforward from the [installation overview](/install/overview/). If you kept your volumes, a fresh install can reattach to existing data.
