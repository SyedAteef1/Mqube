#!/usr/bin/env bash
# MQube on a local (in-shop) server: one script, no domain, no cloud.
# Run from the deploy folder:   sudo bash local/install-linux.sh
# Staff then open  http://<server-ip>  from any computer on the shop network.
# DRY_RUN=1 writes the settings file and prints the commands without starting anything.
set -euo pipefail
cd "$(dirname "$0")/.."                                   # -> deploy/
ENV_FILE=.env.production
COMPOSE=(docker compose -f docker-compose.prod.yml --env-file "$ENV_FILE")

say() { printf '\n== %s\n' "$*"; }
need() { command -v "$1" >/dev/null 2>&1; }
secret() { openssl rand -hex 32; }

if [ "${DRY_RUN:-0}" != "1" ]; then
  if ! need docker; then
    say "Installing Docker (needs internet once)"
    curl -fsSL https://get.docker.com | sh
  fi
  systemctl enable --now docker >/dev/null 2>&1 || true   # start Docker, and again on every boot
fi
need openssl || { echo "openssl is required"; exit 1; }

if [ -f "$ENV_FILE" ]; then
  say "$ENV_FILE already exists; keeping its passwords and secrets"
else
  say "First-time settings"
  while :; do
    read -rsp "Choose the owner (admin) password, at least 12 characters: " p1; echo
    read -rsp "Type it again: " p2; echo
    [ "$p1" = "$p2" ] && [ ${#p1} -ge 12 ] && break
    echo "Passwords differ or are shorter than 12 characters. Try again."
  done
  read -rp "Owner email (optional): " email
  read -rp "Backup folder, e.g. an external drive [./backups]: " bdir
  umask 077
  cat > "$ENV_FILE" <<CONF
# MQube local server settings. Generated $(date +%F). Keep this file private.
DOMAIN=:80
POSTGRES_PASSWORD=$(secret)
JWT_SECRET_KEY=$(secret)
INTERNAL_SERVICE_KEY=$(secret)
SGIP_VAULT_MASTER_KEY=$(secret)
MQUBE_ADMIN_PASSWORD=$p1
MQUBE_ADMIN_EMAIL=$email
BACKUP_DIR=${bdir:-./backups}
BACKUP_KEEP_DAYS=30
GUNICORN_WORKERS=2
CONF
  echo "Saved $ENV_FILE (readable only by this user)."
fi

IP=$( (hostname -I 2>/dev/null || ipconfig getifaddr en0 2>/dev/null || echo "<server-ip>") | awk '{print $1}')

if [ "${DRY_RUN:-0}" = "1" ]; then
  say "DRY RUN: would now run: ${COMPOSE[*]} up -d --build"
  echo "Then open http://$IP"
  exit 0
fi

say "Building and starting MQube (first time takes 5-10 minutes)"
"${COMPOSE[@]}" up -d --build

say "Waiting for the API"
for i in $(seq 1 60); do
  if "${COMPOSE[@]}" ps api | grep -q healthy; then break; fi; sleep 5
done
"${COMPOSE[@]}" ps

if need ufw && ufw status | grep -q active; then ufw allow 80/tcp >/dev/null && echo "Firewall: port 80 opened"; fi

say "Online access for the hosted MQube website"
echo "  1) Tailscale Funnel  - free, no domain needed (recommended)"
echo "  2) Cloudflare Tunnel - needs a domain added to Cloudflare"
echo "  3) Skip              - shop network only"
read -rp "Choose 1, 2 or 3 [1]: " ra
ONLINE_URL=""
case "${ra:-1}" in
  1)
    need tailscale || curl -fsSL https://tailscale.com/install.sh | sh
    echo "Sign in to Tailscale with the link below (first time only)."
    tailscale up
    echo "If asked, open the link shown to allow Funnel for this server."
    tailscale funnel --bg 80
    ONLINE_URL=$(tailscale funnel status 2>/dev/null | grep -oE 'https://[^ ]+' | head -1 | sed 's#/$##')
    ;;
  2)
    read -rp "Paste the tunnel token from Cloudflare Zero Trust > Networks > Tunnels: " tok
    grep -q '^TUNNEL_TOKEN=' "$ENV_FILE" || printf 'TUNNEL_TOKEN=%s\nCOMPOSE_PROFILES=tunnel\n' "$tok" >> "$ENV_FILE"
    "${COMPOSE[@]}" --profile tunnel up -d tunnel
    read -rp "The public hostname you gave the tunnel (e.g. https://api.yourshop.in): " ONLINE_URL
    ;;
  *) echo "Skipped. MQube is available on the shop network only." ;;
esac
if [ -n "$ONLINE_URL" ]; then
  echo "$ONLINE_URL" > ONLINE_ADDRESS.txt
  if curl -fsS "$ONLINE_URL/health" >/dev/null 2>&1; then echo "Checked: $ONLINE_URL/health answers."; else echo "Warning: $ONLINE_URL/health did not answer yet. Wait a minute and try it in a browser."; fi
  say "SEND THIS ADDRESS to the person who manages the MQube website"
  echo "    $ONLINE_URL"
  echo "(also saved in deploy/ONLINE_ADDRESS.txt)"
fi

say "MQube is running"
echo "Open  http://$IP  on any computer in the shop and sign in as  admin"
echo "Give this server a fixed address in the router (DHCP reservation) so the address never changes."
