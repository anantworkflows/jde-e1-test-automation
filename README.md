# JDE E1 Test Automation

[![Tests](https://github.com/anantworkflows/jde-e1-test-automation/actions/workflows/test.yml/badge.svg)](https://github.com/anantworkflows/jde-e1-test-automation/actions)

Multi-agent system for JD Edwards EnterpriseOne end-to-end test automation.

**Repository:** https://github.com/anantworkflows/jde-e1-test-automation

## Architecture

```
Requirement → Parser → TestGen → CodeGen → Executor → Reporter
     ↓           ↓         ↓          ↓          ↓          ↓
   [File]   [JSON]   [Scenarios]  [.spec.ts]  [Results]  [Jira]
```

## Quick Start

```bash
# Run full pipeline
cd test-automation
./orchestrator.sh samples/login-requirement.txt
```

## Stages

1. **Parser Agent** - Extracts requirements from Jira/URL/File
2. **Test Generator** - Creates Gherkin scenarios and test cases
3. **Code Generator** - Produces Playwright TypeScript tests
4. **Executor** - Runs tests and captures results
5. **Reporter** - Analyzes results, suggests bugs, updates Jira

## Directory Structure

```
test-automation/
├── orchestrator.sh          # Main controller
├── agents/
│   ├── run-agent.sh         # Agent launcher
│   ├── parser-agent.js      # Stage 1
│   ├── testgen-agent.js     # Stage 2
│   ├── codegen-agent.js     # Stage 3
│   ├── executor-agent.js    # Stage 4
│   └── reporter-agent.js    # Stage 5
├── pipeline/
│   ├── state.json           # Current run state
│   ├── state.template.json  # State template
│   └── runs/                # Run outputs
├── tests/                   # Generated test files
├── results/                 # Execution results
└── samples/                 # Example requirements
```

## Environment Variables

```bash
export JIRA_BASE_URL="https://your-domain.atlassian.net"
export JIRA_API_TOKEN="your-token"
export TEST_BASE_URL="http://localhost:3000"
```

## State File

Pipeline state tracked in `pipeline/state.json`:
```json
{
  "runId": "run-20260302-...",
  "status": "running|completed|failed",
  "stages": {
    "parse": {"status": "completed", "output": "..."},
    "generate": {"status": "completed", "output": "..."},
    ...
  }
}
```

## Manual Stage Execution

```bash
# Run individual stage
./agents/run-agent.sh parse samples/login.txt run-001
./agents/run-agent.sh generate pipeline/runs/run-001/output.json run-001
```
