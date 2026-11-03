#!/bin/bash
# Repository   : TILEFLOWRetailNX
# 
# Founders
# 
# * Pushpa Devi Jawahar Mallah
#   * Founder & Chairperson
#   * Phone: +91 9324117007
# 
# * Syed Ateef
#   * Founder, Chief Executive Officer (CEO) & Chief Software Architect
# 
# 
# * Version    : 3.1.0
# * Created    : 2026-07-11
# * Modified   : 2026-07-11
# * License    : MIT Open Source License

echo "====================================================================="
echo "TILEFLOW Retail OS - Linux Docker Startup Launcher"
echo "====================================================================="

# 1. Check if docker is installed
if ! [ -x "$(command -v docker)" ]; then
  echo '[ERROR] docker command not found. Please install Docker first.' >&2
  exit 1
fi

# 2. Check if Docker daemon is running
if ! docker info >/dev/null 2>&1; then
  echo "[TILEFLOW] Docker daemon is not active. Attempting to start docker service..."
  sudo systemctl start docker
  
  # Wait for daemon
  while ! docker info >/dev/null 2>&1; do
    echo "Waiting for Docker daemon to start..."
    sleep 3
  done
fi

echo "[TILEFLOW] Docker daemon is active. Starting containers..."
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR"

docker compose up -d

echo "====================================================================="
echo "TILEFLOW Retail OS running in the background."
echo "API endpoint: http://localhost:3000"
echo "====================================================================="
