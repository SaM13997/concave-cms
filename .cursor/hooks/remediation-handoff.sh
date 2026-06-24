#!/usr/bin/env bash
# Injects next-batch context when a subagent completes during local remediation work.
# Cloud orchestrator uses the cron automation + ledger instead.
set -euo pipefail

input=$(cat)
subagent_type=$(echo "$input" | jq -r '.subagent_type // empty')
status=$(echo "$input" | jq -r '.status // empty')

ledger="plans/ux-ui-remediation-ledger.md"
manifest="plans/ux-ui-remediation-batches.md"

if [[ ! -f "$ledger" ]]; then
  exit 0
fi

# Only suggest follow-up on successful subagent completion
if [[ "$status" != "completed" && "$status" != "success" ]]; then
  exit 0
fi

# Find first pending batch (simple grep — orchestrator does full dep check)
next_batch=$(grep '| pending |' "$ledger" | head -1 | sed -n 's/.*| \([0-9]\+\.[0-9]\+\) |.*/\1/p')

if [[ -z "$next_batch" ]]; then
  exit 0
fi

batch_file=$(ls plans/batches/${next_batch}-*.md 2>/dev/null | head -1)

if [[ -z "$batch_file" ]]; then
  exit 0
fi

jq -n \
  --arg batch "$next_batch" \
  --arg file "$batch_file" \
  --arg manifest "$manifest" \
  --arg ledger "$ledger" \
  '{
    followup_message: (
      "Subagent finished. If this session is implementing UX/UI remediation, read \($ledger) and continue with batch \($batch): \($file). "
      + "Do not read the full remediation plan — batch file + \($manifest) deps only. "
      + "Update ledger when done."
    )
  }'

exit 0
