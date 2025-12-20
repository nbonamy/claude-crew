#!/bin/bash

input=$(cat)
session_id=$(echo "$input" | jq -r '.session_id')
reason=$(echo "$input" | jq -r '.reason')

SERVER_URL="${AGENT_MANAGER_URL:-http://localhost:3000}"

response=$(curl -s -X POST "$SERVER_URL/api/unregister" \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "'"$session_id"'"
  }' 2>/dev/null)

if echo "$response" | jq -e '.success' > /dev/null 2>&1; then
  echo "✓ Agent unregistered from crew (reason: $reason)" >&2
else
  echo "⚠ Failed to unregister from crew" >&2
fi

exit 0
