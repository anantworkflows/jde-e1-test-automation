#!/bin/bash
# Orchestrator - Main pipeline controller with isolated outputs

set -e

REQUIREMENT_SOURCE=$1
PIPELINE_DIR="$(dirname "$0")/pipeline"
AGENTS_DIR="$(dirname "$0")/agents"
RUN_ID="run-$(date +%Y%m%d-%H%M%S)"
RUN_DIR="$PIPELINE_DIR/runs/$RUN_ID"

if [ -z "$REQUIREMENT_SOURCE" ]; then
    echo "Usage: ./orchestrator.sh <requirement_source>"
    exit 1
fi

if [ ! -f "$REQUIREMENT_SOURCE" ]; then
    echo "Error: Requirement source not found: $REQUIREMENT_SOURCE"
    exit 1
fi

mkdir -p "$RUN_DIR"

echo "========================================="
echo "Test Automation Pipeline"
echo "Run ID: $RUN_ID"
echo "Source: $REQUIREMENT_SOURCE"
echo "Output: $RUN_DIR"
echo "========================================="

# Initialize state
cat > "$RUN_DIR/state.json" << EOF
{
  "runId": "$RUN_ID",
  "status": "running",
  "source": "$REQUIREMENT_SOURCE",
  "createdAt": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "stages": {}
}
EOF

# Stage 1: Parse
echo ""
echo "[STAGE 1/5] Parsing requirement..."
node "$AGENTS_DIR/parser-agent.js" "$REQUIREMENT_SOURCE" "$RUN_DIR/1-parsed.json" "$RUN_ID"
if [ $? -eq 0 ]; then
    jq '.stages.parse = {status: "completed", output: "1-parsed.json"}' "$RUN_DIR/state.json" > "$RUN_DIR/state.tmp" && mv "$RUN_DIR/state.tmp" "$RUN_DIR/state.json"
    echo "✓ Parse complete"
else
    jq '.stages.parse = {status: "failed"} | .status = "failed"' "$RUN_DIR/state.json" > "$RUN_DIR/state.tmp" && mv "$RUN_DIR/state.tmp" "$RUN_DIR/state.json"
    echo "✗ Parse failed"; exit 1
fi

# Stage 2: Generate
echo ""
echo "[STAGE 2/5] Generating test scenarios..."
node "$AGENTS_DIR/testgen-agent.js" "$RUN_DIR/1-parsed.json" "$RUN_DIR/2-scenarios.json" "$RUN_ID"
if [ $? -eq 0 ]; then
    jq '.stages.generate = {status: "completed", output: "2-scenarios.json"}' "$RUN_DIR/state.json" > "$RUN_DIR/state.tmp" && mv "$RUN_DIR/state.tmp" "$RUN_DIR/state.json"
    echo "✓ Generation complete"
else
    jq '.stages.generate = {status: "failed"} | .status = "failed"' "$RUN_DIR/state.json" > "$RUN_DIR/state.tmp" && mv "$RUN_DIR/state.tmp" "$RUN_DIR/state.json"
    echo "✗ Generation failed"; exit 1
fi

# Stage 3: Codegen
echo ""
echo "[STAGE 3/5] Generating Playwright code..."
node "$AGENTS_DIR/codegen-agent.js" "$RUN_DIR/2-scenarios.json" "$RUN_DIR/3-codegen.json" "$RUN_ID"
if [ $? -eq 0 ]; then
    jq '.stages.codegen = {status: "completed", output: "3-codegen.json"}' "$RUN_DIR/state.json" > "$RUN_DIR/state.tmp" && mv "$RUN_DIR/state.tmp" "$RUN_DIR/state.json"
    echo "✓ Codegen complete"
else
    jq '.stages.codegen = {status: "failed"} | .status = "failed"' "$RUN_DIR/state.json" > "$RUN_DIR/state.tmp" && mv "$RUN_DIR/state.tmp" "$RUN_DIR/state.json"
    echo "✗ Codegen failed"; exit 1
fi

# Stage 4: Execute
echo ""
echo "[STAGE 4/5] Executing tests..."
node "$AGENTS_DIR/executor-agent.js" "$RUN_DIR/3-codegen.json" "$RUN_DIR/4-execution.json" "$RUN_ID"
EXEC_CODE=$?
if [ $EXEC_CODE -eq 0 ]; then
    jq '.stages.execute = {status: "completed", output: "4-execution.json"}' "$RUN_DIR/state.json" > "$RUN_DIR/state.tmp" && mv "$RUN_DIR/state.tmp" "$RUN_DIR/state.json"
    echo "✓ Execution complete"
    TEST_STATUS="passed"
else
    jq '.stages.execute = {status: "completed_with_failures", output: "4-execution.json"}' "$RUN_DIR/state.json" > "$RUN_DIR/state.tmp" && mv "$RUN_DIR/state.tmp" "$RUN_DIR/state.json"
    echo "⚠ Execution completed with failures"
    TEST_STATUS="failed"
fi

# Stage 5: Report
echo ""
echo "[STAGE 5/5] Reporting results..."
node "$AGENTS_DIR/reporter-agent.js" "$RUN_DIR/4-execution.json" "$RUN_DIR/5-report.json" "$RUN_ID"
if [ $? -eq 0 ]; then
    jq '.stages.report = {status: "completed", output: "5-report.json"}' "$RUN_DIR/state.json" > "$RUN_DIR/state.tmp" && mv "$RUN_DIR/state.tmp" "$RUN_DIR/state.json"
    echo "✓ Reporting complete"
else
    jq '.stages.report = {status: "failed"}' "$RUN_DIR/state.json" > "$RUN_DIR/state.tmp" && mv "$RUN_DIR/state.tmp" "$RUN_DIR/state.json"
    echo "⚠ Reporting had issues"
fi

# Finalize
jq --arg status "$TEST_STATUS" '.status = $status | .completedAt = "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"' "$RUN_DIR/state.json" > "$RUN_DIR/state.tmp" && mv "$RUN_DIR/state.tmp" "$RUN_DIR/state.json"

echo ""
echo "========================================="
echo "Pipeline Complete: $RUN_ID"
echo "Test Status: $TEST_STATUS"
echo "Results: $RUN_DIR/"
echo "========================================="

cat "$RUN_DIR/state.json"