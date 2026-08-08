const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('CONSOLE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));
  
  await page.goto('http://localhost:8081/login', { waitUntil: 'networkidle0' });
  await page.type('input[type="email"]', 'analyst@finsight.demo');
  await page.type('input[type="password"]', 'analyst123');
  await page.click('button[type="submit"]');
  
  await page.waitForNavigation({ waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 2000)); // wait for dashboard to render/crash
  
  await browser.close();
})();
