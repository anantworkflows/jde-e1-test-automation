# GitHub Secrets Required

This automation framework requires the following secrets to be configured in GitHub:

## JDE Environment Secrets

| Secret | Description | Example |
|--------|-------------|---------|
| `JDE_BASE_URL` | JDE E1 demo URL | `https://demo.steltix.com/jde/E1Menu.maf` |
| `JDE_USER` | JDE demo username | `demo` |
| `JDE_PASS` | JDE demo password | `demo` |

## Jira Integration Secrets (Optional)

| Secret | Description |
|--------|-------------|
| `JIRA_API_TOKEN` | Atlassian API token for Jira updates |
| `JIRA_USER` | Jira user email |

## How to Add Secrets

1. Go to: https://github.com/anantworkflows/jde-e1-test-automation/settings/secrets/actions
2. Click "New repository secret"
3. Add each secret name and value
4. Click "Add secret"

## Security Notes

- Never commit secrets to the repository
- Use GitHub Secrets for all sensitive data
- Rotate tokens periodically
- Use repository-level secrets (not environment) for this setup