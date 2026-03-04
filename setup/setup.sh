#!/bin/bash
# Master Setup Script for Jira-UiPath Integration
# Usage: ./setup.sh [step]

set -e

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

function show_header() {
  echo ""
  echo "========================================="
  echo "Jira-UiPath Integration Setup"
  echo "========================================="
  echo ""
}

function check_prerequisites() {
  echo "Checking prerequisites..."
  
  if [ ! -f "$REPO_DIR/.env.uipath" ]; then
    echo "❌ UiPath credentials not found"
    echo "Run: ./uipath-api.sh test"
    exit 1
  fi
  
  if [ ! -d "$REPO_DIR/uipath-process" ]; then
    echo "❌ UiPath process files not found"
    exit 1
  fi
  
  echo "✅ Prerequisites met"
  echo ""
}

function step1_jira() {
  echo "Step 1: Jira Automation Rule"
  echo "----------------------------"
  echo ""
  echo "This step requires manual configuration due to SSO."
  echo ""
  echo "Instructions:"
  echo "1. Open: https://workflows.atlassian.net"
  echo "2. Go to: Project Settings → Automation"
  echo "3. Create new rule with:"
  echo "   - Trigger: Issue transitioned to 'In Progress'"
  echo "   - Condition: Label = 'automated'"
  echo "   - Action: Send web request to UiPath"
  echo ""
  echo "Full details: setup/STEP-1-JIRA-AUTOMATION.md"
  echo ""
  
  # Display webhook URL template
  source "$REPO_DIR/.env.uipath"
  echo "Webhook URL:"
  echo "https://cloud.uipath.com/ocr/organizations/${UIPATH_ACCOUNT_LOGICAL_NAME}/odata/Jobs/UiPath.Server.Configuration.OData.StartJobs"
  echo ""
  
  read -p "Press Enter when Step 1 is complete..."
}

function step2_uipath() {
  echo "Step 2: Upload UiPath Process"
  echo "-----------------------------"
  echo ""
  
  # Create package
  cd "$REPO_DIR/uipath-process"
  
  if [ -f "JDE_Test_Automation.1.0.0.nupkg" ]; then
    rm JDE_Test_Automation.1.0.0.nupkg
  fi
  
  echo "Creating package..."
  zip -r JDE_Test_Automation.1.0.0.nupkg . -x "*.nupkg" -x "*.zip"
  
  echo ""
  echo "✅ Package created: JDE_Test_Automation.1.0.0.nupkg"
  echo ""
  echo "Next steps:"
  echo "1. Go to: https://cloud.uipath.com/automationworkflows/DefaultTenant"
  echo "2. Navigate to: Packages → Upload Package"
  echo "3. Select: JDE_Test_Automation.1.0.0.nupkg"
  echo "4. Create Process from this package"
  echo ""
  echo "Full details: setup/STEP-2-UIPATH-PROCESS.md"
  echo ""
  
  read -p "Press Enter when Step 2 is complete..."
}

function step3_assets() {
  echo "Step 3: Configure Orchestrator Assets"
  echo "--------------------------------------"
  echo ""
  
  source "$REPO_DIR/.env.uipath"
  
  echo "Create these assets in UiPath Orchestrator:"
  echo ""
  echo "1. JIRA_BASE_URL"
  echo "   Type: Text"
  echo "   Value: ${JDE_BASE_URL:-https://workflows.atlassian.net}"
  echo ""
  echo "2. JIRA_USER"
  echo "   Type: Text"
  echo "   Value: anantworkflows@gmail.com"
  echo ""
  echo "3. JIRA_API_TOKEN"
  echo "   Type: Credential"
  echo "   Password: [From .env.uipath]"
  echo ""
  echo "4. GITHUB_REPO"
  echo "   Type: Text"
  echo "   Value: https://github.com/anantworkflows/jde-e1-test-automation"
  echo ""
  echo "Full details: setup/STEP-3-ORCHESTRATOR-ASSETS.md"
  echo ""
  
  read -p "Press Enter when Step 3 is complete..."
}

function verify_setup() {
  echo ""
  echo "Verifying Setup"
  echo "---------------"
  echo ""
  
  # Test UiPath API
  echo "Testing UiPath API connection..."
  "$REPO_DIR/uipath-api.sh" test
  
  echo ""
  echo "✅ Setup verification complete"
  echo ""
  echo "Next: Test the full integration"
  echo "1. Create Jira issue with label 'automated'"
  echo "2. Transition to 'In Progress'"
  echo "3. Watch automation run"
  echo ""
}

function full_setup() {
  show_header
  check_prerequisites
  step1_jira
  step2_uipath
  step3_assets
  verify_setup
}

# Main
case "${1:-full}" in
  1|jira)
    step1_jira
    ;;
  2|uipath|process)
    step2_uipath
    ;;
  3|assets)
    step3_assets
    ;;
  full|all)
    full_setup
    ;;
  help)
    echo "Jira-UiPath Integration Setup"
    echo ""
    echo "Usage:"
    echo "  ./setup.sh           - Run full setup"
    echo "  ./setup.sh 1         - Step 1: Jira Automation"
    echo "  ./setup.sh 2         - Step 2: UiPath Process"
    echo "  ./setup.sh 3         - Step 3: Orchestrator Assets"
    echo "  ./setup.sh help      - Show this help"
    echo ""
    ;;
  *)
    echo "Unknown command: $1"
    echo "Run: ./setup.sh help"
    exit 1
    ;;
esac