// Backorder Processing Agent - Creates detailed test scenarios for JDE Backorder Release
const fs = require('fs');

const inputFile = process.argv[2];
const outputFile = process.argv[3];
const runId = process.argv[4];

if (!inputFile || !outputFile || !runId) {
    console.error('Usage: node backorder-agent.js <parsed_req_file> <output_file> <run_id>');
    process.exit(1);
}

function generateBackorderScenarios(requirement) {
    const scenarios = [];
    
    // Scenario 1: Navigate to Backorder Release
    scenarios.push({
        id: `${runId}-TC-001`,
        title: 'Navigate to Backorder Release form',
        priority: 'High',
        type: 'E2E',
        steps: [
            { action: 'Navigate to JDE E1 login page', target: 'url', value: 'https://demo.steltix.com/jde/E1Menu.maf' },
            { action: 'Enter username', target: 'username', selector: '#User', value: 'demo' },
            { action: 'Enter password', target: 'password', selector: '#Password', value: 'demo' },
            { action: 'Click Sign In button', target: 'login', selector: 'input[type="submit"][value="Sign In"]' },
            { action: 'Wait for E1Menu to load', target: 'wait', selector: '#mainContainer, .menuContainer', timeout: 15000 },
            { action: 'Click Sales Order Management menu', target: 'menu', selector: 'text=Sales Order Management, [title*="Sales"]' },
            { action: 'Click Daily Order Processing submenu', target: 'submenu', selector: 'text=Daily Order Processing' },
            { action: 'Click Backorder Release', target: 'menuItem', selector: 'text=Backorder Release, a:has-text("Backorder")' },
            { action: 'Wait for Backorder Release form P42117', target: 'wait', selector: '#P42117, [data-form="P42117"], form:has-text("Backorder")', timeout: 10000 },
            { action: 'Verify form title contains Backorder Release', target: 'assertion', selector: 'text=/Backorder Release/i' }
        ],
        expectedResult: 'Backorder Release form P42117 is displayed with search fields'
    });
    
    // Scenario 2: Search backorders by customer
    scenarios.push({
        id: `${runId}-TC-002`,
        title: 'Search backorders by customer number',
        priority: 'High',
        type: 'E2E',
        steps: [
            { action: 'Navigate to Backorder Release form', prerequisite: true },
            { action: 'Enter customer number in Search field', target: 'input', selector: 'input[name*="customer"], input[placeholder*="Customer"], #C', value: '4242' },
            { action: 'Click Find button', target: 'button', selector: 'button:has-text("Find"), input[value="Find"], .findButton' },
            { action: 'Wait for grid to load', target: 'wait', selector: 'table, .dataGrid, tbody tr', timeout: 10000 },
            { action: 'Verify backorder rows displayed', target: 'assertion', selector: 'table tbody tr, .gridRow' }
        ],
        expectedResult: 'Backorder lines for customer 4242 are displayed in the grid'
    });
    
    // Scenario 3: Select and release backorder
    scenarios.push({
        id: `${runId}-TC-003`,
        title: 'Select backorder lines and release',
        priority: 'Critical',
        type: 'E2E',
        steps: [
            { action: 'Search backorders by customer 4242', prerequisite: true },
            { action: 'Select first backorder row checkbox', target: 'checkbox', selector: 'table tbody tr:first-child input[type="checkbox"], .rowCheckbox:first' },
            { action: 'Click Row menu', target: 'menu', selector: 'button:has-text("Row"), .rowMenu, [title="Row"]' },
            { action: 'Click Release option', target: 'menuItem', selector: 'text=Release, [role="menuitem"]:has-text("Release")' },
            { action: 'Wait for release confirmation', target: 'wait', selector: '.confirmation, .successMessage, text=/released|success/i', timeout: 5000 },
            { action: 'Verify status changed to Released', target: 'assertion', selector: 'text=Released, .status:has-text("Released")' }
        ],
        expectedResult: 'Backorder status changes to Released and confirmation message displayed'
    });
    
    // Scenario 4: Verify inventory allocation
    scenarios.push({
        id: `${runId}-TC-004`,
        title: 'Verify inventory allocation updated after release',
        priority: 'Medium',
        type: 'E2E',
        steps: [
            { action: 'Release backorder for item 1001', prerequisite: true },
            { action: 'Navigate to Item Availability', target: 'menu', selector: 'text=Item Availability, a:has-text("Availability")' },
            { action: 'Enter item number 1001', target: 'input', selector: 'input[name*="item"], #ITM', value: '1001' },
            { action: 'Select branch plant 30', target: 'input', selector: 'input[name*="branch"], #MCU', value: '30' },
            { action: 'Click Find', target: 'button', selector: 'button:has-text("Find"), .findButton' },
            { action: 'Verify allocated quantity updated', target: 'assertion', selector: '.allocated, [data-field="allocated"]' }
        ],
        expectedResult: 'Inventory allocation reflects the released backorder quantity'
    });
    
    // Negative test: Release without selection
    scenarios.push({
        id: `${runId}-TC-005`,
        title: 'Negative: Attempt release without selecting rows',
        priority: 'Medium',
        type: 'Negative',
        steps: [
            { action: 'Navigate to Backorder Release form', prerequisite: true },
            { action: 'Click Row menu without selecting any rows', target: 'menu', selector: 'button:has-text("Row"), .rowMenu' },
            { action: 'Click Release option', target: 'menuItem', selector: 'text=Release' },
            { action: 'Verify error message displayed', target: 'assertion', selector: '.error, .alert, text=/select|required|error/i' }
        ],
        expectedResult: 'Error message prompts user to select at least one row'
    });

    return {
        requirement: requirement.title,
        source: requirement.source,
        url: requirement.url,
        module: requirement.module,
        formId: requirement.formId,
        scenarios: scenarios,
        count: scenarios.length,
        generatedAt: new Date().toISOString()
    };
}

async function main() {
    console.log(`[${runId}] Backorder Agent starting...`);
    
    try {
        const req = JSON.parse(fs.readFileSync(inputFile, 'utf8'));
        const result = generateBackorderScenarios(req);
        
        fs.writeFileSync(outputFile, JSON.stringify(result, null, 2));
        console.log(`[${runId}] Generated ${result.count} backorder test scenarios`);
        console.log(`[${runId}] Output: ${outputFile}`);
        process.exit(0);
    } catch (err) {
        console.error(`[${runId}] Error: ${err.message}`);
        process.exit(1);
    }
}

main();