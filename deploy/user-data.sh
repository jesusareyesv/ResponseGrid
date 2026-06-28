#!/usr/bin/env bash
# EC2 user-data — paste this when launching the instance (t3.micro/t3.small, Ubuntu 22.04/24.04).
# Installs Docker + Compose, adds swap (the t3.micro has only 1 GiB RAM), git, and
# a systemd unit that reconciles the compose stack on every boot.
# After it runs you SSH in and clone + deploy (see docs/deploy/aws-free-tier.md).
set -euxo pipefail

# ── 2 GB swap (essential on a 1 GiB instance running Node + Postgres + Redis) ──
if ! swapon --show | grep -q /swapfile; then
  fallocate -l 2G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

# ── Docker Engine + Compose plugin (official repo) ────────────────────────────
apt-get update -y
apt-get install -y ca-certificates curl git
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
chmod a+r /etc/apt/keyrings/docker.asc
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
  > /etc/apt/sources.list.d/docker.list
apt-get update -y
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Let the default user run docker without sudo.
usermod -aG docker ubuntu || true
systemctl enable --now docker

# ── Reconcile-on-boot unit ────────────────────────────────────────────────────
# The Docker daemon only re-applies per-container restart policies on start; it
# never re-runs `docker compose up`. The one-shot `migrate` service (restart: no)
# is then not restarted and `api` (which depends on it) stays down after an EC2
# stop/start. This oneshot unit runs `docker compose up -d` once per boot to
# reconcile the whole stack. Written inline because the repo isn't cloned yet;
# the deploy refreshes it from deploy/responsegrid.service (keep both in sync).
cat > /etc/systemd/system/responsegrid.service <<'UNIT'
[Unit]
Description=ResponseGrid stack (docker compose up -d) — reconcile on every boot
Requires=docker.service
After=docker.service network-online.target
Wants=network-online.target
ConditionPathExists=/opt/responsegrid/deploy/docker-compose.prod.yml
ConditionPathExists=/opt/responsegrid/deploy/.env

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/responsegrid
ExecStart=/usr/bin/docker compose -f deploy/docker-compose.prod.yml up -d
TimeoutStartSec=300

[Install]
WantedBy=multi-user.target
UNIT
systemctl daemon-reload
# enable only (not --now): the repo/.env don't exist yet, the ConditionPathExists
# guards make it a clean no-op until the first deploy, then it runs every boot.
systemctl enable responsegrid.service

echo "Provisioning done. SSH in and follow docs/deploy/aws-free-tier.md."
