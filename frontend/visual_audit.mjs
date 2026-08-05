import { chromium } from 'playwright';
import path from 'path';

const ARTIFACT_DIR = 'C:/Users/ADMIN/.gemini/antigravity-ide/brain/129ebb18-394f-420b-870c-3f1d0321e059';

async function run() {
  const browser = await chromium.launch({ headless: true });
  // Using 1440px width as requested for layout dead-gutter check
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  try {
    console.log('1. Logging in as CFO...');
    await page.goto('http://localhost:3000/login');
    await page.fill('input[type="email"]', 'cfo@finsight.demo');
    await page.fill('input[type="password"]', 'demo1234');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/cfo/dashboard', { timeout: 30000 });
    await page.waitForTimeout(2000);

    const cfoDashPath = path.join(ARTIFACT_DIR, 'cfo_dashboard.png');
    await page.screenshot({ path: cfoDashPath, fullPage: false });
    console.log(`✓ CFO Dashboard captured: ${cfoDashPath}`);

    console.log('2. Visiting CFO Account Page...');
    await page.goto('http://localhost:3000/account');
    await page.waitForTimeout(1500);
    const cfoAccountPath = path.join(ARTIFACT_DIR, 'cfo_account.png');
    await page.screenshot({ path: cfoAccountPath, fullPage: false });
    console.log(`✓ CFO Account page captured: ${cfoAccountPath}`);

    console.log('3. Switching to Analyst role...');
    await context.clearCookies();
    await page.goto('http://localhost:3000/login');
    await page.fill('input[type="email"]', 'analyst@finsight.demo');
    await page.fill('input[type="password"]', 'demo1234');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/analyst/dashboard', { timeout: 30000 });
    await page.waitForTimeout(2000);

    const analystDashPath = path.join(ARTIFACT_DIR, 'analyst_dashboard.png');
    await page.screenshot({ path: analystDashPath, fullPage: false });
    console.log(`✓ Analyst Dashboard captured: ${analystDashPath}`);

    console.log('3b. Visiting Analyst Bank Detail (HDFC Bank) page...');
    await page.goto('http://localhost:3000/analyst/bank/1');
    await page.waitForTimeout(2000);
    const bankDetailPath = path.join(ARTIFACT_DIR, 'bank_detail_1440.png');
    await page.screenshot({ path: bankDetailPath, fullPage: false });
    console.log(`✓ Bank Detail captured: ${bankDetailPath}`);

    console.log('4. Visiting Analyst Peer Comparison...');
    await page.goto('http://localhost:3000/analyst/peer-comparison');
    await page.waitForTimeout(2000);
    const peerCompPath = path.join(ARTIFACT_DIR, 'peer_comparison_1440.png');
    await page.screenshot({ path: peerCompPath, fullPage: false });
    console.log(`✓ Analyst Peer Comparison captured: ${peerCompPath}`);

    console.log('5. Visiting Analyst Account Page...');
    await page.goto('http://localhost:3000/account');
    await page.waitForTimeout(1500);
    const analystAccountPath = path.join(ARTIFACT_DIR, 'analyst_account.png');
    await page.screenshot({ path: analystAccountPath, fullPage: false });
    console.log(`✓ Analyst Account page captured: ${analystAccountPath}`);

    console.log('ALL VISUAL AUDIT SCREENSHOTS COMPLETED SUCCESSFULLY!');
  } catch (error) {
    console.error('Error during visual audit:', error);
  } finally {
    await browser.close();
  }
}

run();
