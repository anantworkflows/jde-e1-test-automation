# UiPath-Jira Integration Guide

Complete workflow for triggering test automation from Jira and reporting results back.

## Architecture

```
Jira Issue (KAN-XX)
    ↓ Automation Rule / Webhook
UiPath Cloud Orchestrator
    ↓ Queue / Direct Trigger
Run Tests (Playwright on Mac or UiPath Robot)
    ↓ Results
Update Jira (Comments, Attachments, Status)
```

## Setup Steps

### 1. Jira Automation Rule (Recommended)

**Create Automation Rule in Jira:**

1. Go to: Project Settings → Automation → Create Rule
2. **Trigger:** Issue transitioned to "In Progress" OR Manual trigger
3. **Condition:** Issue type = "Test" OR Label = "automated"
4. **Action:** Send web request

**Webhook Configuration:**
```
URL: https://cloud.uipath.com/ocr/organizations/automationworkflows/odata/Jobs/UiPath.Server.Configuration.OData.StartJobs
Method: POST
Headers:
  Authorization: Bearer YOUR_UIPATH_TOKEN
  Content-Type: application/json
  X-UIPATH-OrganizationUnitId: 1

Body:
{
  "startInfo": {
    "ReleaseKey": "YOUR_PROCESS_RELEASE_KEY",
    "Strategy": "ModernJobsCount",
    "JobsCount": 1,
    "InputArguments": "{\"JiraIssueKey\":\"{{issue.key}}\",\"TestSuite\":\"{{issue.fields.summary}}\",\"JiraToken\":\"{{secrets.JIRA_TOKEN}}\"}"
  }
}
```

### 2. Alternative: Jira Webhook (Advanced)

**Configure Webhook in Jira:**
1. Settings → System → WebHooks
2. Create webhook:
   - URL: Your middleware endpoint (e.g., AWS Lambda, Azure Function)
   - Events: Issue updated, Issue transitioned
   - Filter: Project = KAN AND labels in (automated, xray)

**Middleware (Node.js example):**
```javascript
// This middleware receives Jira webhook and triggers UiPath
const express = require('express');
const axios = require('axios');

app.post('/jira-webhook', async (req, res) => {
  const { issue } = req.body;
  
  if (issue.fields.labels.includes('automated')) {
    await axios.post('https://cloud.uipath.com/.../StartJobs', {
      startInfo: {
        ReleaseKey: process.env.UIPATH_RELEASE_KEY,
        InputArguments: JSON.stringify({
          JiraIssueKey: issue.key,
          TestSuite: issue.fields.summary
        })
      }
    }, {
      headers: { Authorization: `Bearer ${process.env.UIPATH_TOKEN}` }
    });
  }
  
  res.sendStatus(200);
});
```

### 3. UiPath Process Configuration

**Assets to Create in UiPath Orchestrator:**

| Asset Name | Type | Value |
|------------|------|-------|
| JIRA_BASE_URL | Text | https://workflows.atlassian.net |
| JIRA_API_TOKEN | Credential | Your Atlassian API token |
| JIRA_USER | Text | anantworkflows@gmail.com |
| GITHUB_REPO | Text | https://github.com/anantworkflows/jde-e1-test-automation |

**Process Arguments:**
- `JiraIssueKey` (String) - Incoming from Jira
- `TestSuite` (String) - Test suite to run
- `JiraToken` (String) - Jira API token

### 4. Local Execution (Mac with Attended Robot)

**Option A: UiPath Attended Robot on Mac**
1. Install UiPath Robot on Mac (via Docker or VM)
2. Connect to Cloud Orchestrator
3. Process triggers robot to run tests locally

**Option B: Direct API Call (Simpler)**
```bash
# From Jira automation, call local API
curl -X POST http://localhost:5000/run-tests \
  -H "Content-Type: application/json" \
  -d '{"jira_issue":"KAN-20","test_suite":"supplier-ledger"}'
```

### 5. GitHub Actions Integration

**Trigger from Jira via GitHub API:**
```yaml
# In GitHub Actions workflow
curl -X POST \
  -H "Authorization: token $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  https://api.github.com/repos/anantworkflows/jde-e1-test-automation/actions/workflows/test.yml/dispatches \
  -d '{
    "ref": "main",
    "inputs": {
      "test_suite": "{{issue.fields.summary}}",
      "jira_issue": "{{issue.key}}"
    }
  }'
```

## Test Execution Flow

1. **Trigger:** User transitions Jira issue to "In Progress" OR clicks "Run Tests"
2. **UiPath Receives:** JiraIssueKey, TestSuite name
3. **UiPath Executes:** 
   - Updates Jira comment: "Test execution started..."
   - Runs Playwright tests via PowerShell
   - Captures screenshots and logs
4. **Results Posted:**
   - Comment with test summary (pass/fail counts)
   - Screenshots attached to Jira issue
   - Status transitioned (Done if pass, In Review if fail)

## File Structure

```
uipath-process/
├── Main.xaml                    # Main workflow
├── project.json                 # Process definition
├── JiraIntegration.xaml         # Jira API activities
├── TestRunner.xaml              # Playwright execution
└── ResultReporter.xaml          # Update Jira with results
```

## API Endpoints Used

**Jira:**
- `POST /rest/api/2/issue/{key}/comment` - Add comment
- `POST /rest/api/2/issue/{key}/attachments` - Upload files
- `POST /rest/api/2/issue/{key}/transitions` - Change status

**UiPath:**
- `POST /odata/Jobs/UiPath.Server.Configuration.OData.StartJobs` - Start job
- `GET /odata/Jobs` - Check job status

**GitHub:**
- `POST /repos/{owner}/{repo}/actions/workflows/{id}/dispatches` - Trigger workflow

## Testing the Integration

1. Create test issue in Jira (KAN project)
2. Add label: "automated"
3. Transition to "In Progress"
4. Verify:
   - UiPath job triggered
   - Tests executed
   - Results posted to Jira
   - Screenshots attached

## Troubleshooting

**Job not triggering:**
- Check webhook URL is correct
- Verify token has proper scopes
- Check Jira automation rule is enabled

**Tests not running:**
- Verify UiPath Robot has access to Mac
- Check node/npm is installed
- Review test-results folder permissions

**Results not updating:**
- Verify Jira API token is valid
- Check Jira permissions (create comment, attach files)
- Review UiPath logs for API errors

## Security Notes

- Store all tokens in UiPath Orchestrator Assets (encrypted)
- Never commit tokens to GitHub
- Use Jira secrets in automation rules
- Rotate tokens every 90 days