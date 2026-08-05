import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const ARTIFACT_DIR = 'C:/Users/ADMIN/.gemini/antigravity-ide/brain/108c3905-aa18-44c7-b354-3f90e9aeff0f';

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();

  const results = {
    analystLogin: false,
    cfoLogin: false,
    adminLogin: false,
    only5Banks: true,
    noFictionalBanks: true,
    currencyINR: true,
    noUSD: true,
    errors: []
  };

  const validBanks = ['HDFC Bank', 'ICICI Bank', 'State Bank of India', 'Axis Bank', 'Kotak Mahindra Bank', 'HDFCBANK', 'ICICIBANK', 'SBIN', 'AXISBANK', 'KOTAKBANK'];
  const invalidTerms = ['Global Finance Corp', 'European Banking Group', 'TestBank', 'OtherBank', 'Dummy Bank'];

  function checkContent(text, pageName) {
    for (const term of invalidTerms) {
      if (text.includes(term)) {
        results.noFictionalBanks = false;
        results.errors.push(`Found invalid term "${term}" on ${pageName}`);
      }
    }
    // Check for $ followed by digits in visible text
    const match = text.match(/\$\s*\d[^\n]*/);
    if (match) {
      results.noUSD = false;
      results.errors.push(`Found dollar sign formatting on ${pageName}: "${match[0]}"`);
    }
  }

  try {
    // --- 1. ANALYST ROLE ---
    console.log('1. Testing Analyst Demo Login...');
    await page.goto('http://localhost:3000/login');
    await page.fill('input[type="email"]', 'analyst@finsight.demo');
    await page.fill('input[type="password"]', 'demo1234');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/analyst/dashboard', { timeout: 10000 });
    results.analystLogin = true;
    console.log('✓ Analyst logged in successfully.');
    await page.waitForTimeout(1500);

    let text = await page.innerText('body');
    checkContent(text, 'Analyst Dashboard');
    if (text.includes('₹') && text.includes('Cr')) {
      console.log('✓ Currency correctly displayed as ₹/Cr on Dashboard.');
    }

    console.log('2. Visiting Explore Banks page...');
    await page.goto('http://localhost:3000/analyst/explore');
    await page.waitForTimeout(2000);
    text = await page.innerText('body');
    checkContent(text, 'Explore Banks');
    
    const explorePath = path.join(ARTIFACT_DIR, 'explore_banks.png');
    await page.screenshot({ path: explorePath, fullPage: true });
    console.log(`✓ Saved Explore Banks screenshot to ${explorePath}`);

    console.log('3. Visiting Peer Comparison page...');
    await page.goto('http://localhost:3000/analyst/peer-comparison');
    await page.waitForTimeout(2000);
    text = await page.innerText('body');
    checkContent(text, 'Peer Comparison');

    const peerPath = path.join(ARTIFACT_DIR, 'peer_comparison.png');
    await page.screenshot({ path: peerPath, fullPage: true });
    console.log(`✓ Saved Peer Comparison screenshot to ${peerPath}`);

    console.log('4. Visiting What-If Scenarios page...');
    await page.goto('http://localhost:3000/analyst/what-if');
    await page.waitForTimeout(1500);
    text = await page.innerText('body');
    checkContent(text, 'What-If Scenarios');
    
    // Check select dropdown options
    const options = await page.$$eval('select option', opts => opts.map(o => o.textContent.trim()).filter(t => t && !t.includes('Select') && !t.includes('--')));
    console.log('What-If Dropdown options identified:', options);

    console.log('5. Visiting Bank Detail page (HDFC Bank)...');
    await page.goto('http://localhost:3000/analyst/bank/1');
    await page.waitForTimeout(1500);
    text = await page.innerText('body');
    checkContent(text, 'Bank Detail');

    // --- 2. CFO ROLE ---
    console.log('\n6. Testing CFO Demo Login...');
    await context.clearCookies();
    await page.goto('http://localhost:3000/login');
    await page.fill('input[type="email"]', 'cfo@finsight.demo');
    await page.fill('input[type="password"]', 'demo1234');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/cfo/dashboard', { timeout: 10000 });
    results.cfoLogin = true;
    console.log('✓ CFO logged in successfully.');
    await page.waitForTimeout(1500);
    text = await page.innerText('body');
    checkContent(text, 'CFO Dashboard');

    console.log('7. Visiting CFO Approved History...');
    await page.goto('http://localhost:3000/cfo/approved');
    await page.waitForTimeout(1500);
    text = await page.innerText('body');
    checkContent(text, 'CFO Approved History');

    // --- 3. ADMIN ROLE ---
    console.log('\n8. Testing Admin Demo Login...');
    await context.clearCookies();
    await page.goto('http://localhost:3000/login');
    await page.fill('input[type="email"]', 'admin@finsight.demo');
    await page.fill('input[type="password"]', 'demo1234');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/admin/users', { timeout: 10000 });
    results.adminLogin = true;
    console.log('✓ Admin logged in successfully.');
    await page.waitForTimeout(1500);
    text = await page.innerText('body');
    checkContent(text, 'Admin Users');

    console.log('9. Visiting Admin Portfolios...');
    await page.goto('http://localhost:3000/admin/portfolios');
    await page.waitForTimeout(1500);
    text = await page.innerText('body');
    checkContent(text, 'Admin Portfolios');

    console.log('\n=========================================');
    console.log('       END-TO-END AUDIT SUMMARY          ');
    console.log('=========================================');
    console.log(`[${results.analystLogin ? 'x' : ' '}] Analyst Demo Login`);
    console.log(`[${results.cfoLogin ? 'x' : ' '}] CFO Demo Login`);
    console.log(`[${results.adminLogin ? 'x' : ' '}] Admin Demo Login`);
    console.log(`[${results.noFictionalBanks ? 'x' : ' '}] Zero test/fictional bank references across UI`);
    console.log(`[${results.noUSD ? 'x' : ' '}] Zero USD ($) symbols in financial metrics`);
    console.log(`[${results.errors.length === 0 ? 'x' : ' '}] No UI Content Errors Found`);
    
    if (results.errors.length > 0) {
      console.log('\nErrors encountered:', results.errors);
    }

  } catch (err) {
    console.error('Error during E2E verification:', err);
  } finally {
    await browser.close();
  }
}

run();
