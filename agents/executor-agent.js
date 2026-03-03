// Executor Agent - Runs Playwright tests and captures results
const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

const inputFile = process.argv[2];
const outputFile = process.argv[3];
const runId = process.argv[4];

if (!inputFile || !outputFile || !runId) {
    console.error('Usage: node executor-agent.js <codegen_metadata_file> <output_file> <run_id>');
    process.exit(1);
}

function runTests(testFilePath, runDir) {
    const results = {
        passed: 0, failed: 0, skipped: 0, duration: 0, tests: [], rawOutput: '', error: null
    };
    
    if (!fs.existsSync(testFilePath)) {
        results.error = `Test file not found: ${testFilePath}`;
        return results;
    }
    
    // Use the global playwright from test-automation root
    const rootDir = path.resolve(runDir, '../../..');
    const outputDir = path.join(runDir, 'test-results');
    fs.mkdirSync(outputDir, { recursive: true });
    
    // Create playwright config in the run directory
    const configPath = path.join(runDir, 'playwright.config.js');
    fs.writeFileSync(configPath, `
module.exports = {
    testDir: '.',
    timeout: 60000,
    expect: { timeout: 10000 },
    use: {
        headless: true,
        screenshot: 'only-on-failure',
        trace: 'on-first-retry',
        viewport: { width: 1280, height: 720 }
    },
    reporter: [['json', { outputFile: '${outputDir}/results.json' }], ['line']]
};`);
    
    const cmd = `cd "${rootDir}" && npx playwright test "${testFilePath}" --config="${configPath}"`;
    const startTime = Date.now();
    
    try {
        const output = execSync(cmd, { encoding: 'utf8', timeout: 300000, shell: true });
        results.rawOutput = output;
        results.duration = Date.now() - startTime;
        
        // Parse results.json if exists
        const resultsPath = path.join(outputDir, 'results.json');
        if (fs.existsSync(resultsPath)) {
            const report = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
            results.passed = report.stats?.expected || 0;
            results.failed = report.stats?.unexpected || 0;
            results.skipped = report.stats?.skipped || 0;
            
            report.suites?.forEach(suite => {
                suite.specs?.forEach(spec => {
                    spec.tests?.forEach(test => {
                        results.tests.push({
                            name: spec.title,
                            status: test.results?.[0]?.status || 'unknown',
                            duration: test.results?.[0]?.duration || 0,
                            error: test.results?.[0]?.error?.message || null
                        });
                    });
                });
            });
        }
    } catch (execErr) {
        results.duration = Date.now() - startTime;
        results.rawOutput = execErr.stdout || execErr.stderr || execErr.message;
        
        // Still try to parse results
        const resultsPath = path.join(outputDir, 'results.json');
        if (fs.existsSync(resultsPath)) {
            try {
                const report = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
                results.passed = report.stats?.expected || 0;
                results.failed = report.stats?.unexpected || 0;
                results.skipped = report.stats?.skipped || 0;
            } catch {}
        }
        if (results.failed === 0) results.failed = 1;
    }
    
    return results;
}

async function main() {
    console.log(`[${runId}] Executor Agent starting...`);
    
    try {
        const metadata = JSON.parse(fs.readFileSync(inputFile, 'utf8'));
        const testFilePath = metadata.testFile;
        const runDir = path.dirname(testFilePath);
        
        console.log(`[${runId}] Running tests: ${testFilePath}`);
        const results = runTests(testFilePath, runDir);
        
        const output = {
            runId: runId,
            requirement: metadata.requirement,
            url: metadata.url,
            testFile: testFilePath,
            summary: {
                passed: results.passed,
                failed: results.failed,
                skipped: results.skipped,
                total: results.passed + results.failed + results.skipped,
                duration: results.duration
            },
            tests: results.tests,
            rawOutput: results.rawOutput,
            error: results.error,
            executedAt: new Date().toISOString()
        };
        
        fs.writeFileSync(outputFile, JSON.stringify(output, null, 2));
        
        console.log(`[${runId}] Tests completed: ${output.summary.passed} passed, ${output.summary.failed} failed`);
        console.log(`[${runId}] Duration: ${(output.summary.duration/1000).toFixed(1)}s`);
        console.log(`[${runId}] Output: ${outputFile}`);
        
        process.exit(results.failed > 0 ? 1 : 0);
    } catch (err) {
        console.error(`[${runId}] Error: ${err.message}`);
        fs.writeFileSync(outputFile, JSON.stringify({ error: err.message, runId }, null, 2));
        process.exit(1);
    }
}

main();