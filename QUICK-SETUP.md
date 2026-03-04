# Quick Setup Guide: Jira → UiPath → Test Results

## Overview
Trigger test automation from Jira, run via UiPath, post results back to Jira with screenshots.

## Prerequisites
✅ UiPath Cloud account - https://cloud.uipath.com  
✅ Jira project (KAN) - https://workflows.atlassian.net  
✅ GitHub repo - https://github.com/anantworkflows/jde-e1-test-automation  
✅ API Tokens - UiPath and Jira  

---

## Step 1: Set Up Jira Automation (5 mins)

**In Jira:**
1. Project Settings → Automation → Create Rule
2. **Trigger:** Issue transitioned → To "In Progress"
3. **Condition:** Issue fields → Labels → Contains → `automated`
4. **Action:** Send web request

**Webhook Settings:**
```
URL: https://cloud.uipath.com/ocr/organizations/automationworkflows/odata/Jobs/UiPath.Server.Configuration.OData.StartJobs
Method: POST
Headers:
  Authorization: Bearer [YOUR_UIPATH_TOKEN]
  Content-Type: application/json
  X-UIPATH-OrganizationUnitId: 1
Body:
  {
    "startInfo": {
      "ReleaseKey": "[YOUR_PROCESS_KEY]",
      "Strategy": "ModernJobsCount",
      "JobsCount": 1,
      "InputArguments": "{\"JiraIssueKey\":\"{{issue.key}}\",\"TestSuite\":\"{{issue.fields.summary}}\"}"
    }
  }
```

**Alternative:** Import `jira-automation-rule.json` (Project Settings → Automation → Import)

---

## Step 2: Create UiPath Process (10 mins)

**Option A: Import Process (if you have Studio)**
1. Download `uipath-process/` folder from GitHub
2. Open in UiPath Studio
3. Publish to Orchestrator

**Option B: Create via Orchestrator (No Studio)**
1. Go to: https://cloud.uipath.com → Orchestrator → Processes
2. Click "Create Process"
3. Upload the process files from `uipath-process/`
4. Configure:
   - Process Name: `JDE_Test_Automation`
   - Main File: `Main.xaml`
   - Input Arguments: JiraIssueKey, TestSuite

---

## Step 3: Configure Assets in UiPath (3 mins)

**Orchestrator → Assets → Create:**

| Asset Name | Type | Value |
|------------|------|-------|
| JIRA_BASE_URL | Text | https://workflows.atlassian.net |
| JIRA_API_TOKEN | Credential | Your Atlassian token |
| JIRA_USER | Text | anantworkflows@gmail.com |
| GITHUB_REPO | Text | anantworkflows/jde-e1-test-automation |

---

## Step 4: Test the Integration (5 mins)

**Test Flow:**
1. Create Jira issue: "Test Supplier Ledger Inquiry"
2. Add label: `automated`
3. Transition to "In Progress"
4. Check:
   - ✅ Jira comment: "Test Automation Triggered"
   - ✅ UiPath job started
   - ✅ Tests execute on Mac
   - ✅ Results posted to Jira
   - ✅ Screenshots attached
   - ✅ Status updated (Done/Fail)

---

## File Structure

```
.github/workflows/
├── test.yml                    # GitHub Actions

uipath-process/
├── Main.xaml                   # Main workflow
├── project.json                # Process definition

├── jira-automation-rule.json   # Importable Jira rule
├── UIPATH-JIRA-INTEGRATION.md  # Full documentation
└── QUICK-SETUP.md              # This file
```

---

## Troubleshooting

**Job not starting?**
- Verify UiPath token is valid
- Check webhook URL is correct
- Ensure Jira issue has label "automated"

**Tests not running?**
- Verify Mac is on and accessible
- Check node/npm installed
- Review `~/.openclaw/workspace/test-automation/test-results/`

**Results not posting?**
- Check Jira API token permissions
- Verify Jira user can add comments/attachments
- Check UiPath job logs

---

## Next Steps

1. ✅ Complete Step 1-4 above
2. Customize test scenarios in `samples/`
3. Add more JDE modules
4. Set up scheduled runs
5. Add Slack/Teams notifications

---

## Support

**Documentation:**
- Full guide: `UIPATH-JIRA-INTEGRATION.md`
- API docs: `uipath-api.sh --help`

**Repository:** https://github.com/anantworkflows/jde-e1-test-automation