#!/usr/bin/env bash
# Install (or refresh) the systemd unit that reconciles the compose stack on
# every boot — see deploy/responsegrid.service for the why.
#
# Idempotent: safe to run on every deploy. Needs root (systemctl / writing to
# /etc/systemd/system). Run from anywhere; paths are resolved from this script.
#   sudo bash deploy/install-reconcile.sh
set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
UNIT=responsegrid.service

install -m 0644 "$DIR/$UNIT" "/etc/systemd/system/$UNIT"
systemctl daemon-reload
systemctl enable "$UNIT"

echo "Installed and enabled $UNIT (reconciles the stack on every boot)."
