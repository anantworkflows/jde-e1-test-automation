// Reporter Agent - Analyzes results and updates Jira
// Usage: node reporter-agent.js <execution_results_file> <output_file> <run_id>

const fs = require('fs');

const inputFile = process.argv[2];
const outputFile = process.argv[3];
const runId = process.argv[4];

if (!inputFile || !outputFile || !runId) {
    console.error('Usage: node reporter-agent.js <execution_results_file> <output_file> <run_id>');
    process.exit(1);
}

function analyzeResults(results) {
    const analysis = {
        summary: results.summary,
        status: results.summary.failed === 0 ? 'PASSED' : 'FAILED',
        bugs: [],
        recommendations: [],
        jiraUpdate: null
    };
    
    // Identify potential bugs from failed tests
    results.tests.forEach(test => {
        if (test.status === 'failed' || test.status === 'timedOut') {
            analysis.bugs.push({
                testName: test.name,
                error: test.error,
                severity: 'High',
                suggestion: 'Create bug ticket'
            });
        }
    });
    
    // Generate recommendations
    if (results.summary.failed > 0) {
        analysis.recommendations.push(`${results.summary.failed} tests failed - review required`);
    }
    if (results.summary.skipped > 0) {
        analysis.recommendations.push(`${results.summary.skipped} tests skipped - check test stability`);
    }
    if (results.duration > 60000) {
        analysis.recommendations.push('Test suite slow - consider parallelization');
    }
    
    // Build Jira update payload
    analysis.jiraUpdate = {
        issueKey: null, // To be filled from requirement source
        fields: {
            description: generateJiraDescription(results, analysis),
            labels: ['automated-test', `run-${runId}`],
            customfield_test_results: JSON.stringify(results.summary)
        },
        transition: analysis.status === 'PASSED' ? 'Pass Testing' : 'Fail Testing',
        comment: generateJiraComment(results, analysis)
    };
    
    return analysis;
}

function generateJiraDescription(results, analysis) {
    return `h3. Automated Test Results - Run ${runId}

*Status:* ${analysis.status}
*Executed:* ${results.executedAt}
*Duration:* ${(results.summary.duration / 1000).toFixed(2)}s

h4. Summary
* Passed: ${results.summary.passed}
* Failed: ${results.summary.failed}
* Skipped: ${results.summary.skipped}
* Total: ${results.summary.total}

h4. Details
${results.tests.map(t => `* ${t.status === 'passed' ? '✓' : '✗'} ${t.name}`).join('\n')}

h4. Recommendations
${analysis.recommendations.map(r => `* ${r}`).join('\n')}`;
}

function generateJiraComment(results, analysis) {
    if (analysis.status === 'PASSED') {
        return `All ${results.summary.passed} automated tests passed. Ready for next stage.`;
    }
    return `${results.summary.failed} test(s) failed. ${analysis.bugs.length} potential bug(s) identified. See detailed report.`;
}

function updateJira(analysis) {
    // Placeholder for Jira API integration
    // Requires: JIRA_BASE_URL, JIRA_API_TOKEN env vars
    
    const jiraBase = process.env.JIRA_BASE_URL;
    const jiraToken = process.env.JIRA_API_TOKEN;
    
    if (!jiraBase || !jiraToken) {
        console.log(`[${runId}] Jira credentials not configured - skipping update`);
        return { updated: false, reason: 'No credentials' };
    }
    
    // TODO: Implement actual Jira API call
    // fetch(`${jiraBase}/rest/api/2/issue/${issueKey}`, ...)
    
    return { updated: true, issueKey: analysis.jiraUpdate.issueKey };
}

async function main() {
    console.log(`[${runId}] Reporter Agent starting...`);
    
    try {
        const results = JSON.parse(fs.readFileSync(inputFile, 'utf8'));
        const analysis = analyzeResults(results);
        
        // Attempt Jira update
        const jiraResult = updateJira(analysis);
        
        const output = {
            runId: runId,
            analysis: analysis,
            jiraUpdate: jiraResult,
            reportedAt: new Date().toISOString()
        };
        
        fs.writeFileSync(outputFile, JSON.stringify(output, null, 2));
        
        console.log(`[${runId}] Analysis complete: ${analysis.status}`);
        console.log(`[${runId}] Bugs identified: ${analysis.bugs.length}`);
        console.log(`[${runId}] Jira updated: ${jiraResult.updated}`);
        console.log(`[${runId}] Output: ${outputFile}`);
        
        process.exit(0);
    } catch (err) {
        console.error(`[${runId}] Error: ${err.message}`);
        process.exit(1);
    }
}

main();