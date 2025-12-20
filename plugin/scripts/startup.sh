#!/bin/bash

input=$(cat)
session_id=$(echo "$input" | jq -r '.session_id')
cwd=$(pwd)

SERVER_URL="${AGENT_MANAGER_URL:-http://localhost:3000}"

response=$(curl -s -X POST "$SERVER_URL/api/register" \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "'"$session_id"'",
    "baseFolder": "'"$cwd"'"
  }' 2>/dev/null)

if echo "$response" | jq -e '.success' > /dev/null 2>&1; then
  agent_name=$(echo "$response" | jq -r '.agent.name')
  echo -n "{ \"hookSpecificOutput\": { \"hookEventName\": \"SessionStart\", \"additionalContext\": \""
  echo -n "Agent registered with crew as: $agent_name"
  echo -n "Your crew session ID is: $session_id"
  echo -n "Use this session ID when calling crew MCP tools (check-messages, send-message, etc.)"
  echo "\" } }"
else
  echo "⚠ Failed to register with crew"
fi

exit 0
