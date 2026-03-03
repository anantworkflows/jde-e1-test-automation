// Test Generator Agent - Creates test scenarios from requirements
const fs = require('fs');

const inputFile = process.argv[2];
const outputFile = process.argv[3];
const runId = process.argv[4];

if (!inputFile || !outputFile || !runId) {
    console.error('Usage: node testgen-agent.js <parsed_req_file> <output_file> <run_id>');
    process.exit(1);
}

function generateTestScenarios(requirement) {
    const scenarios = [];
    let idx = 0;
    
    // Generate from acceptance criteria
    if (requirement.acceptanceCriteria?.length > 0) {
        requirement.acceptanceCriteria.forEach((ac) => {
            if (ac.length > 10) {
                scenarios.push({
                    id: `${runId}-TC-${String(++idx).padStart(3, '0')}`,
                    title: ac.length > 80 ? ac.substring(0, 80) + '...' : ac,
                    priority: idx === 1 ? 'High' : 'Medium',
                    type: 'E2E',
                    gherkin: parseGherkin(ac),
                    steps: generateSteps(ac),
                    expectedResult: extractExpected(ac)
                });
            }
        });
    }
    
    // Add core E2E scenarios for JD Edwards
    if (requirement.url?.includes('jde') || requirement.title?.includes('JD Edwards')) {
        scenarios.push(
            {
                id: `${runId}-TC-${String(++idx).padStart(3, '0')}`,
                title: 'E2E: Complete login flow and access main menu',
                priority: 'Critical',
                type: 'E2E',
                steps: [
                    { action: 'Navigate to JDE demo URL', target: 'url', value: requirement.url || 'https://demo.steltix.com/jde/E1Menu.maf' },
                    { action: 'Wait for login form', target: 'form', selector: 'input[name="username"], input[name="j_username"], #User' },
                    { action: 'Enter username', target: 'username', selector: 'input[name="username"], input[name="j_username"], #User', value: 'demo' },
                    { action: 'Enter password', target: 'password', selector: 'input[name="password"], input[name="j_password"], #Password', value: 'demo123' },
                    { action: 'Click login button', target: 'login', selector: 'button[type="submit"], input[type="submit"], .loginButton' },
                    { action: 'Wait for E1Menu to load', target: 'menu', selector: '#E1Menu, .menuContainer, [class*="menu"]' },
                    { action: 'Verify main menu is visible', target: 'assertion' }
                ],
                expectedResult: 'User successfully logs in and E1Menu main page is displayed'
            },
            {
                id: `${runId}-TC-${String(++idx).padStart(3, '0')}`,
                title: 'E2E: Navigate to Address Book and search',
                priority: 'High',
                type: 'E2E',
                steps: [
                    { action: 'Login to JDE', target: 'login', prerequisite: true },
                    { action: 'Click on Address Book menu', target: 'menu', selector: 'text=Address Book, [title*="Address"], a:has-text("Address")' },
                    { action: 'Wait for Address Book page', target: 'page', selector: '.addressBook, [class*="address"]' },
                    { action: 'Enter search term in filter', target: 'filter', selector: 'input[placeholder*="search" i], input[name*="search"], .filterInput', value: 'test' },
                    { action: 'Click search button', target: 'search', selector: 'button:has-text("Search"), .searchButton' },
                    { action: 'Verify search results displayed', target: 'assertion', selector: '.results, [class*="result"], table tbody tr' }
                ],
                expectedResult: 'Address Book opens and search returns results'
            }
        );
    }
    
    // Add negative test
    scenarios.push({
        id: `${runId}-TC-${String(++idx).padStart(3, '0')}`,
        title: 'Negative: Invalid credentials show error',
        priority: 'Medium',
        type: 'Negative',
        steps: [
            { action: 'Navigate to JDE demo URL', target: 'url', value: requirement.url || 'https://demo.steltix.com/jde/E1Menu.maf' },
            { action: 'Enter invalid username', target: 'username', selector: 'input[name="username"], #User', value: 'invalid_user' },
            { action: 'Enter invalid password', target: 'password', selector: 'input[name="password"], #Password', value: 'wrongpass' },
            { action: 'Click login button', target: 'login', selector: 'button[type="submit"], .loginButton' },
            { action: 'Verify error message displayed', target: 'assertion', selector: '.error, [class*="error"], .alert, text=/invalid|error|failed/i' }
        ],
        expectedResult: 'Error message displayed, user remains on login page'
    });

    return {
        requirement: requirement.title,
        source: requirement.source,
        url: requirement.url,
        scenarios: scenarios,
        count: scenarios.length,
        generatedAt: new Date().toISOString()
    };
}

function parseGherkin(text) {
    const given = text.match(/Given\s+(.+?)(?=When|$)/is);
    const when = text.match(/When\s+(.+?)(?=Then|$)/is);
    const then = text.match(/Then\s+(.+?)(?=Given|When|$)/is);
    return { given: given?.[1]?.trim(), when: when?.[1]?.trim(), then: then?.[1]?.trim() };
}

function generateSteps(ac) {
    const gherkin = parseGherkin(ac);
    const steps = [];
    if (gherkin.given) steps.push({ action: gherkin.given, type: 'precondition' });
    if (gherkin.when) steps.push({ action: gherkin.when, type: 'action' });
    if (gherkin.then) steps.push({ action: gherkin.then, type: 'assertion' });
    return steps.length > 0 ? steps : [{ action: ac, type: 'general' }];
}

function extractExpected(ac) {
    const then = ac.match(/Then\s+(.+?)(?=Given|When|$)/is);
    return then ? then[1].trim() : 'Expected behavior occurs';
}

async function main() {
    console.log(`[${runId}] Test Generator Agent starting...`);
    
    try {
        const req = JSON.parse(fs.readFileSync(inputFile, 'utf8'));
        const result = generateTestScenarios(req);
        fs.writeFileSync(outputFile, JSON.stringify(result, null, 2));
        console.log(`[${runId}] Generated ${result.count} test scenarios`);
        console.log(`[${runId}] Output: ${outputFile}`);
        process.exit(0);
    } catch (err) {
        console.error(`[${runId}] Error: ${err.message}`);
        process.exit(1);
    }
}

main();