import { chromium } from 'playwright';

async function run() {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  const backendRequests = [];

  page.on('request', request => {
    if (request.url().includes('3000/api')) {
      backendRequests.push({
        method: request.method(),
        url: request.url(),
      });
    }
  });

  page.on('response', async response => {
    if (response.url().includes('3000/api')) {
      let bodySnippet = '';
      try {
        const text = await response.text();
        bodySnippet = text.substring(0, 100).replace(/\n/g, ' ');
      } catch (e) {
        bodySnippet = '<could not read body>';
      }
      console.log(`[NETWORK] ${response.request().method()} ${response.url()} - Status: ${response.status()} - Body: ${bodySnippet}`);
    }
  });

  console.log('--- Logging in as Analyst ---');
  await page.goto('http://localhost:5173/login');
  await page.fill('input[type="email"]', 'analyst@finsight.demo');
  await page.fill('input[type="password"]', 'Audit123!');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/analyst/dashboard');
  await page.waitForTimeout(1000);

  console.log('--- Navigating to Analyst Explore ---');
  await page.click('text=Explore Banks');
  await page.waitForURL('**/analyst/explore');
  await page.waitForTimeout(1000);

  console.log('--- Navigating to Analyst Peer Comparison ---');
  await page.click('text=Peer Analysis');
  await page.waitForURL('**/analyst/peer-comparison');
  await page.waitForTimeout(1000);
  
  console.log('--- Navigating to Analyst What-If ---');
  await page.click('text=What-If Scenarios');
  await page.waitForURL('**/analyst/what-if');
  await page.waitForTimeout(1000);

  // Submit what-if
  console.log('--- Submitting What-If ---');
  // Need to select bank, metric, enter value, and submit.
  // Wait for dropdowns
  try {
    const selects = await page.$$('select');
    if (selects.length >= 2) {
      await selects[0].selectOption({ index: 1 }); // select first bank
      await selects[1].selectOption('CAR'); // select metric
      await page.fill('input[type="number"]', '15.5');
      await page.click('button:has-text("Run Scenario")');
      await page.waitForTimeout(1500);
    }
  } catch (e) {
    console.log('Could not submit what-if form', e.message);
  }

  // Go to Bank Detail
  console.log('--- Navigating to Bank Detail ---');
  await page.goto('http://localhost:5173/analyst/explore');
  await page.waitForTimeout(1000);
  try {
    await page.click('a:has-text("View Details")'); // First bank
    await page.waitForTimeout(2000);
  } catch(e) {
     console.log('Could not click View Details', e.message);
  }

  // Now login as Admin
  console.log('--- Logging in as Admin ---');
  await page.goto('http://localhost:5173/login');
  await page.fill('input[type="email"]', 'admin@finsight.demo');
  await page.fill('input[type="password"]', 'Audit123!');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/admin/users');
  await page.waitForTimeout(1000);

  console.log('--- Navigating to Admin Portfolios ---');
  await page.click('text=Portfolios');
  await page.waitForURL('**/admin/portfolios');
  await page.waitForTimeout(1000);

  // Now login as CFO
  console.log('--- Logging in as CFO ---');
  await page.goto('http://localhost:5173/login');
  await page.fill('input[type="email"]', 'cfo@finsight.demo');
  await page.fill('input[type="password"]', 'Audit123!');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/cfo/dashboard');
  await page.waitForTimeout(1000);

  console.log('--- Navigating to CFO Approved History ---');
  await page.click('text=Approved History');
  await page.waitForURL('**/cfo/approved');
  await page.waitForTimeout(1000);

  await browser.close();
}

run().catch(console.error);
