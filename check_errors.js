const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  page.on('console', msg => console.log(`CONSOLE: ${msg.text()}`));
  page.on('pageerror', error => console.log(`ERROR: ${error.message}`));
  page.on('requestfailed', request => console.log(`REQUEST FAILED: ${request.url()}`));

  await page.goto('http://localhost:8080');
  await page.waitForTimeout(3000);
  
  await browser.close();
})();