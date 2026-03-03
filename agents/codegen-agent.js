// Code Generator Agent - Creates Playwright code from test scenarios
const fs = require('fs');
const path = require('path');

const inputFile = process.argv[2];
const outputFile = process.argv[3];
const runId = process.argv[4];

if (!inputFile || !outputFile || !runId) {
    console.error('Usage: node codegen-agent.js <scenarios_file> <output_file> <run_id>');
    process.exit(1);
}

function generatePlaywrightTest(scenario) {
    const testName = scenario.title.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 60);
    
    let code = `\ntest('${testName}', async ({ page }) => {\n`;
    
    scenario.steps.forEach((step) => {
        code += convertStepToCode(step);
    });
    
    code += `});\n`;
    return code;
}

function convertStepToCode(step) {
    let code = `\n  // ${step.action}\n`;
    const action = step.action.toLowerCase();
    
    if (action.includes('navigate') || action.includes('goto') || step.target === 'url') {
        const url = step.value || 'https://demo.steltix.com/jde/E1Menu.maf';
        code += `  await page.goto('${url}');\n`;
        code += `  console.log('Navigated to JDE demo');\n`;
    }
    else if (action.includes('wait') && step.selector) {
        code += `  await page.waitForSelector('${step.selector}', { timeout: 15000 });\n`;
    }
    else if ((action.includes('enter') || action.includes('fill')) && step.target === 'username') {
        const value = step.value || 'demo';
        // More specific selector for JDE
        code += `  await page.locator('#User, input[name="j_username"], input[name="username"]').first().fill('${value}');\n`;
    }
    else if ((action.includes('enter') || action.includes('fill')) && step.target === 'password') {
        const value = step.value || 'demo123';
        code += `  await page.locator('#Password, input[name="j_password"], input[name="password"]').first().fill('${value}');\n`;
    }
    else if ((action.includes('enter') || action.includes('fill')) && step.selector) {
        const value = step.value || 'test';
        code += `  await page.locator('${step.selector}').first().fill('${value}');\n`;
    }
    else if (action.includes('click') && step.target === 'login') {
        // Use input[type="submit"] specifically to avoid td elements with class loginButton
        code += `  await page.locator('input[type="submit"][value="Sign In"]').first().click();\n`;
    }
    else if (action.includes('click') && step.target === 'search') {
        code += `  await page.locator('${step.selector || "button"}').first().click();\n`;
    }
    else if (action.includes('click') && step.selector) {
        code += `  await page.locator('${step.selector}').first().click();\n`;
    }
    else if (action.includes('verify') || action.includes('assert') || step.target === 'assertion') {
        const selector = step.selector || 'body';
        if (selector.includes('text=')) {
            code += `  await expect(page.locator('${selector}')).toBeVisible();\n`;
        } else {
            code += `  await expect(page.locator('${selector}').first()).toBeVisible();\n`;
        }
    }
    else if (step.prerequisite) {
        code += `  // Prerequisites handled in beforeEach or previous steps\n`;
    }
    else {
        code += `  // TODO: ${step.action}\n`;
    }
    
    return code;
}

function generateTestFile(testData) {
    const baseUrl = testData.url || process.env.JDE_BASE_URL || 'https://demo.steltix.com/jde/E1Menu.maf';
    const demoUser = process.env.JDE_USER || 'demo';
    const demoPass = process.env.JDE_PASS || 'demo';
    
    let file = `// Auto-generated Playwright tests for JD Edwards\n`;
    file += `// Run ID: ${runId}\n`;
    file += `// Generated: ${new Date().toISOString()}\n`;
    file += `// Target: ${baseUrl}\n\n`;
    file += `import { test, expect } from '@playwright/test';\n\n`;
    file += `const BASE_URL = '${baseUrl}';\n`;
    file += `const DEMO_USER = '${demoUser}';\n`;
    file += `const DEMO_PASS = '${demoPass}';\n\n`;
    file += `test.describe('${testData.requirement}', () => {\n`;
    file += `  test.setTimeout(90000);\n\n`;
    
    testData.scenarios.forEach(scenario => {
        file += generatePlaywrightTest(scenario);
    });
    
    file += `});\n`;
    return file;
}

async function main() {
    console.log(`[${runId}] Code Generator Agent starting...`);
    
    try {
        const data = JSON.parse(fs.readFileSync(inputFile, 'utf8'));
        
        const testFile = generateTestFile(data);
        const testFilePath = outputFile.replace('.json', '.spec.ts');
        fs.writeFileSync(testFilePath, testFile);
        
        const metadata = {
            runId: runId,
            requirement: data.requirement,
            url: data.url,
            scenarios: data.scenarios.map(s => ({ id: s.id, title: s.title })),
            testFile: testFilePath,
            generatedAt: new Date().toISOString()
        };
        fs.writeFileSync(outputFile, JSON.stringify(metadata, null, 2));
        
        console.log(`[${runId}] Generated Playwright tests: ${testFilePath}`);
        console.log(`[${runId}] Scenarios: ${data.scenarios.length}`);
        console.log(`[${runId}] Output: ${outputFile}`);
        process.exit(0);
    } catch (err) {
        console.error(`[${runId}] Error: ${err.message}`);
        process.exit(1);
    }
}

main();