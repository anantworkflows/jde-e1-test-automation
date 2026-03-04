# Step 1: Jira Automation Rule Setup
## Manual Configuration Required

Due to SSO requirements, please complete this step manually:

### Instructions:

1. **Go to Jira:** https://workflows.atlassian.net
2. **Navigate to:** Project Settings → Automation → Create Rule
3. **Configure Rule:**

**Trigger:**
- Type: Issue transitioned
- From: To Do, Open, Backlog
- To: In Progress

**Condition (Optional but recommended):**
- Type: Issue fields condition
- Field: Labels
- Condition: Contains
- Value: automated

**Action: Send Web Request**
```
Name: Trigger UiPath Test Automation
URL: https://cloud.uipath.com/ocr/organizations/automationworkflows/odata/Jobs/UiPath.Server.Configuration.OData.StartJobs
Method: POST
Headers:
  Authorization: Bearer [TOKEN_FROM_ENV_UIPATH]
  Content-Type: application/json
  X-UIPATH-OrganizationUnitId: 1

Body:
{
  "startInfo": {
    "ReleaseKey": "YOUR_PROCESS_RELEASE_KEY",
    "Strategy": "ModernJobsCount",
    "JobsCount": 1,
    "InputArguments": "{\\\"JiraIssueKey\\\":\\\"{{issue.key}}\\\",\\\"TestSuite\\\":\\\"{{issue.fields.summary}}\\\",\\\"JiraToken\\\":\\\"{{secrets.JIRA_API_TOKEN}}\\\"}"
  }
}
```

**Action: Add Comment**
```
Comment:
🚀 *Test Automation Triggered*

UiPath job started for this issue.
*Test Suite:* {{issue.fields.summary}}
*Triggered:* {{now}}

Results will be posted automatically.
```

4. **Save Rule** with name: "Trigger Test Automation from Jira"

### Alternative: Import JSON
File: `jira-automation-rule.json` (included in repo)
- Go to Project Settings → Automation
- Click "Import" 
- Select the JSON file
- Update the webhook URL with your token

### To Get Release Key:
1. Upload process to UiPath Orchestrator (Step 2)
2. Go to Orchestrator → Processes
3. Find your process
4. Copy the Release Key
5. Update the Jira automation rule