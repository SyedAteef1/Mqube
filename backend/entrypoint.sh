#!/bin/sh
# Starts the MQube API: migrate every database, create first-run records, then serve.
set -e
export PYTHONPATH=/app

if [ "${SKIP_MIGRATIONS:-false}" != "true" ]; then
    base="${DATABASE_URL%/*}"
    for db in tileflowsys ${COMPANY_DATABASES:-tileflow001}; do
        echo "Migrating database $db..."
        alembic -x db_url="$base/$db" upgrade head
    done
else
    echo "SKIP_MIGRATIONS=true, skipping migrations."
fi

echo "Creating first-run records (safe to repeat)..."
python -m app.db.seed_baseline_users

echo "Starting MQube API..."
exec gunicorn app.main:app \
    -k uvicorn.workers.UvicornWorker \
    -b 0.0.0.0:8000 \
    --workers "${GUNICORN_WORKERS:-2}" \
    --timeout 120 \
    --forwarded-allow-ips="*"
