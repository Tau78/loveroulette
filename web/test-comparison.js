const playwright = require('playwright');

(async () => {
  const browser = await playwright.chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 844, height: 390 },
    deviceScaleFactor: 1
  });
  
  const page = await context.newPage();
  
  console.log('Opening board page to check for PIN gate...');
  const response = await page.goto('http://localhost:3000/admin/DEMO01/board', { waitUntil: 'load' });
  console.log('Response status:', response.status());
  
  await page.waitForTimeout(1000);
  
  // Check for PIN gate
  const pinGateCheck = await page.evaluate(() => {
    const pinInput = document.querySelector('input[type="password"], input[type="text"][placeholder*="PIN"], [class*="pin"]');
    const pinForm = document.querySelector('form[class*="pin"], [class*="auth"]');
    return {
      hasPinInput: !!pinInput,
      hasPinForm: !!pinForm,
      title: document.title,
      hasBoard: !!document.querySelector('.casa-board-rail, [class*="board"]')
    };
  });
  
  console.log('PIN Gate Check:', JSON.stringify(pinGateCheck, null, 2));
  
  if (pinGateCheck.hasPinInput || pinGateCheck.hasPinForm) {
    console.log('⚠️  PIN gate detected! Taking screenshot...');
    await page.screenshot({ path: '/tmp/board-screenshots/00-pin-gate.png' });
  } else if (!pinGateCheck.hasBoard) {
    console.log('⚠️  Board not found! Taking screenshot...');
    await page.screenshot({ path: '/tmp/board-screenshots/00-unexpected-page.png' });
  } else {
    console.log('✅ Board loaded successfully without PIN gate');
  }
  
  await page.waitForTimeout(1000);
  await browser.close();
})();
