# Step 3: Configure UiPath Orchestrator Assets
## Required Assets

Navigate to: https://cloud.uipath.com/automationworkflows/DefaultTenant

### Create These Assets:

#### 1. JIRA_BASE_URL
- **Name:** `JIRA_BASE_URL`
- **Type:** Text
- **Value:** `https://workflows.atlassian.net`
- **Scope:** Global (or specific folder)

#### 2. JIRA_API_TOKEN
- **Name:** `JIRA_API_TOKEN`
- **Type:** Credential
- **Username:** (leave blank or use email)
- **Password:** `[YOUR_JIRA_API_TOKEN - Get from .env.uipath or create new at https://id.atlassian.com/manage-profile/security/api-tokens]`
- **Scope:** Global

#### 3. JIRA_USER
- **Name:** `JIRA_USER`
- **Type:** Text
- **Value:** `anantworkflows@gmail.com`
- **Scope:** Global

#### 4. GITHUB_REPO
- **Name:** `GITHUB_REPO`
- **Type:** Text
- **Value:** `https://github.com/anantworkflows/jde-e1-test-automation`
- **Scope:** Global

#### 5. UIPATH_TOKEN (Optional - for API calls within process)
- **Name:** `UIPATH_TOKEN`
- **Type:** Credential
- **Password:** `[YOUR_UIPATH_TOKEN - Get from .env.uipath]`
- **Scope:** Global

### Verification:

After creating all assets:
1. Go to: Assets page
2. Verify all 5 assets listed
3. Check no errors in asset values
4. Test by running process manually

### Security Notes:

- Assets are encrypted in UiPath Orchestrator
- Never share asset values in chat
- Rotate tokens every 90 days
- Use credential type for sensitive data