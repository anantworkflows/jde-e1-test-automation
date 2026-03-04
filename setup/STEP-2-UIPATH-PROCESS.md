# Step 2: UiPath Process Upload
## Two Options Available

### Option A: Via UiPath Studio (Recommended if available)

1. **Install UiPath Studio** (if not already installed)
   - Download from: https://www.uipath.com/product/studio

2. **Open Process:**
   - File → Open → Select `uipath-process/` folder
   - Review Main.xaml workflow
   - Click "Publish"

3. **Publish to Orchestrator:**
   - Publishing Options → Orchestrator Tenant Processes
   - Process Name: `JDE_Test_Automation`
   - Click Publish

### Option B: Via Orchestrator Web UI (No Studio Required)

1. **Prepare Package:**
   ```bash
   cd ~/.openclaw/workspace/test-automation/uipath-process
   zip -r JDE_Test_Automation.1.0.0.nupkg .
   ```

2. **Upload to Orchestrator:**
   - Go to: https://cloud.uipath.com/automationworkflows/DefaultTenant
   - Navigate to: Packages
   - Click "Upload Package"
   - Select: `JDE_Test_Automation.1.0.0.nupkg`

3. **Create Process:**
   - Go to: Processes
   - Click "Create Process"
   - Process Name: `JDE_Test_Automation`
   - Package: Select `JDE_Test_Automation`
   - Version: 1.0.0
   - Click Create

4. **Verify Process:**
   - Should appear in Processes list
   - Status: Active
   - Can manually trigger a test run

### Post-Upload Steps:

**Get Release Key:**
1. Go to: Orchestrator → Processes
2. Find: `JDE_Test_Automation`
3. Click on process
4. Copy: Release Key (looks like a GUID)
5. **Save this** - needed for Jira automation rule

**Update GitHub Repo:**
```bash
git add uipath-process/
git commit -m "UiPath process published"
git push
```