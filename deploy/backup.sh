#!/bin/sh
# Daily compressed dump of every MQube database; keeps KEEP_DAYS days.
set -eu
while true; do
    stamp=$(date +%Y-%m-%d_%H%M)
    for db in tileflowsys tileflow001; do
        pg_dump --format=custom "$db" > "/backups/${db}_${stamp}.dump.tmp" \
            && mv "/backups/${db}_${stamp}.dump.tmp" "/backups/${db}_${stamp}.dump" \
            && echo "backup ok: ${db}_${stamp}.dump" \
            || echo "BACKUP FAILED: $db" >&2
    done
    find /backups -name '*.dump' -mtime +"${KEEP_DAYS:-14}" -delete
    sleep 86400
done
