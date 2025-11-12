#!/usr/bin/env bash
ADMIN="dartlens_admin_2025_secret_key"
BASE="http://localhost:4000/api/admin/ingest"

for cc in $(grep -E '^[0-9]{8}$' corp_codes.txt); do
  for y in 2022 2023 2024; do
    for r in 11011 11012 11013 11014; do
      curl -s -X POST "${BASE}?year=${y}&reprt_code=${r}&fs_div=CFS&corp_code=${cc}" \
        -H "X-Admin-Token: ${ADMIN}" >/dev/null
    done
  done
done
echo "done"