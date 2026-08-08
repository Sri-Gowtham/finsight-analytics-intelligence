const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  page.on('response', async r => {
    if (r.url().includes('/api/auth/login')) {
      const text = await r.text();
      console.log('Browser Response:', r.status(), text.substring(0,200));
    }
  });
  await page.goto('http://localhost:8081/login');
  await page.fill('input[type="email"]', 'admin@finsight.demo');
  await page.fill('input[type="password"]', 'demo1234');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2000);
  await browser.close();
})();
