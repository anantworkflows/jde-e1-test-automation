#!/bin/bash
# UiPath Cloud API Integration Script
# Usage: ./uipath-api.sh <command> [args]

# Load credentials
if [ -f .env.uipath ]; then
  source .env.uipath
elif [ -f ~/.openclaw/workspace/test-automation/.env.uipath ]; then
  source ~/.openclaw/workspace/test-automation/.env.uipath
fi

# API Base URL
API_BASE="https://cloud.uipath.com/ocr/organizations/${UIPATH_ACCOUNT_LOGICAL_NAME}"
TOKEN="${UIPATH_TOKEN}"

# Functions
function get_folders() {
  curl -s -X GET \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "X-UIPATH-OrganizationUnitId: 1" \
    "${API_BASE}/odata/Folders" \
    | jq '.value[] | {Id, DisplayName}' 2>/dev/null || echo "Error fetching folders"
}

function get_processes() {
  curl -s -X GET \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "X-UIPATH-OrganizationUnitId: 1" \
    "${API_BASE}/odata/Releases" \
    | jq '.value[] | {Id, ProcessKey, ProcessVersion}' 2>/dev/null || echo "Error fetching processes"
}

function start_job() {
  local process_key=$1
  local input_args=${2:-{}}
  
  curl -s -X POST \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "Content-Type: application/json" \
    -H "X-UIPATH-OrganizationUnitId: 1" \
    "${API_BASE}/odata/Jobs/UiPath.Server.Configuration.OData.StartJobs" \
    -d "{
      \"startInfo\": {
        \"ReleaseKey\": \"${process_key}\",
        \"Strategy\": \"ModernJobsCount\",
        \"JobsCount\": 1,
        \"InputArguments\": ${input_args}
      }
    }" \
    | jq '.' 2>/dev/null || echo "Error starting job"
}

function get_jobs() {
  curl -s -X GET \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "X-UIPATH-OrganizationUnitId: 1" \
    "${API_BASE}/odata/Jobs?\$orderby=CreationTime desc&\$top=10" \
    | jq '.value[] | {Id, State, CreationTime, ReleaseName}' 2>/dev/null || echo "Error fetching jobs"
}

function test_connection() {
  echo "Testing UiPath Cloud connection..."
  echo "Account: ${UIPATH_ACCOUNT_LOGICAL_NAME}"
  echo "Tenant: ${UIPATH_TENANT_NAME}"
  echo ""
  
  response=$(curl -s -o /dev/null -w "%{http_code}" \
    -H "Authorization: Bearer ${TOKEN}" \
    "${API_BASE}/odata/Folders?\$top=1")
  
  if [ "$response" = "200" ]; then
    echo "✅ Connection successful!"
    echo ""
    echo "Available folders:"
    get_folders
  else
    echo "❌ Connection failed (HTTP ${response})"
    echo "Check your token and credentials"
  fi
}

# Main
 case "${1:-help}" in
  folders)
    get_folders
    ;;
  processes)
    get_processes
    ;;
  start)
    if [ -z "$2" ]; then
      echo "Usage: $0 start <process_key> [input_args]"
      exit 1
    fi
    start_job "$2" "${3:-{}}"
    ;;
  jobs)
    get_jobs
    ;;
  test)
    test_connection
    ;;
  help|*)
    echo "UiPath Cloud API Client"
    echo ""
    echo "Usage:"
    echo "  $0 test        - Test connection"
    echo "  $0 folders     - List folders"
    echo "  $0 processes   - List processes"
    echo "  $0 jobs        - List recent jobs"
    echo "  $0 start <key> [args] - Start a job"
    echo ""
    echo "Examples:"
    echo "  $0 test"
    echo "  $0 processes"
    echo "  $0 start MyProcess '{\"arg1\":\"value1\"}'"
    ;;
esac