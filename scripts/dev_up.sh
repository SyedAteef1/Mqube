#!/usr/bin/env bash
# Starts local Postgres, the FastAPI backend and the Vite frontend.
# Ctrl+C stops the backend and frontend; Postgres keeps running.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DATA="$HOME/tileflow-data"
PGBIN=/opt/homebrew/opt/postgresql@16/bin

if ! "$PGBIN/pg_isready" -q -h 127.0.0.1 -p 5432; then
  "$PGBIN/pg_ctl" -D "$DATA/pg" -o "-p 5432 -k /tmp -c listen_addresses=127.0.0.1" -l "$DATA/pg.log" -w start
fi

trap 'kill 0' EXIT
(cd "$ROOT/backend" && exec ../.venv/bin/python -m uvicorn app.main:app --port 8000 --reload) &
(cd "$ROOT" && exec npm run dev) &
wait
