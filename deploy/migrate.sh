#!/bin/sh
# Idempotent migration runner. Applies each apps/api/drizzle/*.sql once,
# tracked in a _migrations table, in filename order (0001, 0002, …).
# Safe to re-run on every `docker compose up`.
set -e

export PGPASSWORD="$POSTGRES_PASSWORD"
PSQL="psql -h postgres -U $POSTGRES_USER -d $POSTGRES_DB -v ON_ERROR_STOP=1"

# Wait for Postgres (compose healthcheck already gates us, this is a belt-and-braces retry).
i=0
until $PSQL -c 'SELECT 1' >/dev/null 2>&1; do
  i=$((i + 1))
  [ "$i" -gt 30 ] && echo "postgres not reachable" && exit 1
  sleep 1
done

$PSQL -c "CREATE TABLE IF NOT EXISTS _migrations (name text PRIMARY KEY, applied_at timestamptz DEFAULT now());"

for f in /migrations/*.sql; do
  [ -e "$f" ] || continue
  name=$(basename "$f")
  applied=$($PSQL -tAc "SELECT 1 FROM _migrations WHERE name = '$name'")
  if [ "$applied" = "1" ]; then
    echo "skip   $name"
    continue
  fi
  echo "apply  $name"
  $PSQL -f "$f"
  $PSQL -c "INSERT INTO _migrations (name) VALUES ('$name');"
done

echo "migrations up to date"
