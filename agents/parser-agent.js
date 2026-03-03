// Parser Agent - Extracts requirements from Jira/URL/File
const fs = require('fs');
const path = require('path');

const inputFile = process.argv[2];
const outputFile = process.argv[3];
const runId = process.argv[4];

if (!inputFile || !outputFile || !runId) {
    console.error('Usage: node parser-agent.js <input_file> <output_file> <run_id>');
    process.exit(1);
}

async function parseRequirement(inputPath) {
    const content = fs.readFileSync(inputPath, 'utf8');
    const ext = path.extname(inputPath).toLowerCase();
    
    let parsed = {
        source: inputPath,
        type: null,
        title: null,
        description: null,
        acceptanceCriteria: [],
        url: null,
        raw: content
    };

    if (ext === '.json') {
        parsed.type = 'jira';
        try {
            const jira = JSON.parse(content);
            parsed.title = jira.title || jira.fields?.summary || 'Untitled';
            parsed.description = jira.description || jira.fields?.description || '';
            parsed.acceptanceCriteria = jira.acceptanceCriteria || extractAC(parsed.description);
            parsed.url = jira.source || jira.url || null;
        } catch {
            parsed.title = content.split('\n')[0];
            parsed.description = content;
        }
    } else {
        parsed.type = 'file';
        const lines = content.split('\n');
        parsed.title = lines[0] || 'Untitled Requirement';
        parsed.description = content;
        parsed.acceptanceCriteria = extractAC(content);
    }

    return parsed;
}

function extractAC(text) {
    const criteria = [];
    const lines = text.split('\n');
    let collecting = false;
    let current = '';
    
    for (const line of lines) {
        if (line.match(/Acceptance Criteria|AC[:\s]/i)) {
            collecting = true;
            continue;
        }
        if (collecting) {
            if (line.match(/^\s*[-*]\s+(.+)/)) {
                if (current) criteria.push(current.trim());
                current = line.replace(/^\s*[-*]\s+/, '');
            } else if (line.trim() && !line.match(/^[A-Z]/)) {
                current += ' ' + line.trim();
            } else if (line.trim() && line.match(/^[A-Z]/)) {
                if (current) criteria.push(current.trim());
                collecting = false;
            }
        }
    }
    if (current) criteria.push(current.trim());
    
    // Also look for Given/When/Then
    const gherkinMatches = text.match(/Given\s+.+?When\s+.+?Then\s+.+?(?=Given|$)/gis);
    if (gherkinMatches) criteria.push(...gherkinMatches);
    
    return criteria.length > 0 ? criteria : ['Verify main functionality works as expected'];
}

async function main() {
    console.log(`[${runId}] Parser Agent starting...`);
    
    try {
        const result = await parseRequirement(inputFile);
        fs.writeFileSync(outputFile, JSON.stringify(result, null, 2));
        console.log(`[${runId}] Parsed: ${result.title}`);
        console.log(`[${runId}] ACs found: ${result.acceptanceCriteria.length}`);
        console.log(`[${runId}] Output: ${outputFile}`);
        process.exit(0);
    } catch (err) {
        console.error(`[${runId}] Error: ${err.message}`);
        process.exit(1);
    }
}

main();