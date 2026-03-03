#!/bin/bash
# Test Automation Pipeline - Agent Launcher
# Usage: ./run-agent.sh <stage> <input_file> <run_id>

STAGE=$1
INPUT_FILE=$2
RUN_ID=$3

if [ -z "$STAGE" ] || [ -z "$INPUT_FILE" ] || [ -z "$RUN_ID" ]; then
    echo "Usage: ./run-agent.sh <stage> <input_file> <run_id>"
    echo "Stages: parse | generate | codegen | execute | report"
    exit 1
fi

AGENT_DIR="$(dirname "$0")/../agents"
OUTPUT_DIR="$(dirname "$0")/../pipeline/runs/${RUN_ID}"
mkdir -p "$OUTPUT_DIR"

echo "[${RUN_ID}] Starting agent: ${STAGE}"
echo "[${RUN_ID}] Input: ${INPUT_FILE}"

# Update state: running
STATE_FILE="$(dirname "$0")/../pipeline/state.json"
jq --arg stage "$STAGE" --arg run_id "$RUN_ID" \
   '.stages[$stage].status = "running" | .stages[$stage].agent = $run_id' \
   "$STATE_FILE" > "${STATE_FILE}.tmp" && mv "${STATE_FILE}.tmp" "$STATE_FILE"

# Execute stage-specific agent
case $STAGE in
    parse)
        node "${AGENT_DIR}/parser-agent.js" "$INPUT_FILE" "$OUTPUT_DIR/output.json" "$RUN_ID"
        ;;
    generate)
        node "${AGENT_DIR}/testgen-agent.js" "$INPUT_FILE" "$OUTPUT_DIR/output.json" "$RUN_ID"
        ;;
    codegen)
        node "${AGENT_DIR}/codegen-agent.js" "$INPUT_FILE" "$OUTPUT_DIR/output.json" "$RUN_ID"
        ;;
    execute)
        node "${AGENT_DIR}/executor-agent.js" "$INPUT_FILE" "$OUTPUT_DIR/output.json" "$RUN_ID"
        ;;
    report)
        node "${AGENT_DIR}/reporter-agent.js" "$INPUT_FILE" "$OUTPUT_DIR/output.json" "$RUN_ID"
        ;;
    *)
        echo "Unknown stage: $STAGE"
        exit 1
        ;;
esac

EXIT_CODE=$?

if [ $EXIT_CODE -eq 0 ]; then
    jq --arg stage "$STAGE" --arg output "$OUTPUT_DIR/output.json" \
       '.stages[$stage].status = "completed" | .stages[$stage].output = $output' \
       "$STATE_FILE" > "${STATE_FILE}.tmp" && mv "${STATE_FILE}.tmp" "$STATE_FILE"
    echo "[${RUN_ID}] Agent ${STAGE} completed"
else
    jq --arg stage "$STAGE" '.stages[$stage].status = "failed"' \
       "$STATE_FILE" > "${STATE_FILE}.tmp" && mv "${STATE_FILE}.tmp" "$STATE_FILE"
    echo "[${RUN_ID}] Agent ${STAGE} failed"
    exit 1
fi