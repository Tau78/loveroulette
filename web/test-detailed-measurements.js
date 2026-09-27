const playwright = require('playwright');

(async () => {
  const browser = await playwright.chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 844, height: 390 },
    deviceScaleFactor: 1
  });
  
  const page = await context.newPage();
  await page.goto('http://localhost:3000/admin/DEMO01/board', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  
  // Test WITHOUT safe areas
  console.log('\n========== TEST 1: WITHOUT SAFE AREAS (BASELINE) ==========');
  const measBefore = await page.evaluate(() => {
    const rail = document.querySelector('.casa-board-rail');
    const foot = document.querySelector('.casa-board-foot');
    const html = document.documentElement;
    
    return {
      railLeft: rail ? rail.getBoundingClientRect().left : null,
      footBottom: foot ? foot.getBoundingClientRect().bottom : null,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      htmlClasses: html.className,
      safAreaVars: {
        sal: getComputedStyle(html).getPropertyValue('--lr-sal'),
        sar: getComputedStyle(html).getPropertyValue('--lr-sar'),
        sab: getComputedStyle(html).getPropertyValue('--lr-sab'),
        sat: getComputedStyle(html).getPropertyValue('--lr-sat')
      }
    };
  });
  console.log(JSON.stringify(measBefore, null, 2));
  
  // Test WITH safe areas
  console.log('\n========== TEST 2: WITH SAFE AREAS (SIMULATED NOTCH) ==========');
  await page.evaluate(() => {
    document.documentElement.classList.add('casa-native-chrome');
    document.documentElement.style.setProperty('--lr-sal', '47px');
    document.documentElement.style.setProperty('--lr-sar', '47px');
    document.documentElement.style.setProperty('--lr-sab', '21px');
    document.documentElement.style.setProperty('--lr-sat', '0px');
  });
  await page.waitForTimeout(500);
  
  const measAfter = await page.evaluate(() => {
    const rail = document.querySelector('.casa-board-rail');
    const foot = document.querySelector('.casa-board-foot');
    const html = document.documentElement;
    
    return {
      railLeft: rail ? rail.getBoundingClientRect().left : null,
      footBottom: foot ? foot.getBoundingClientRect().bottom : null,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      htmlClasses: html.className,
      safAreaVars: {
        sal: getComputedStyle(html).getPropertyValue('--lr-sal'),
        sar: getComputedStyle(html).getPropertyValue('--lr-sar'),
        sab: getComputedStyle(html).getPropertyValue('--lr-sab'),
        sat: getComputedStyle(html).getPropertyValue('--lr-sat')
      }
    };
  });
  console.log(JSON.stringify(measAfter, null, 2));
  
  console.log('\n========== COMPARISON ==========');
  console.log('Rail left shift:', measAfter.railLeft - measBefore.railLeft, 'px');
  console.log('Rail left position WITH safe areas:', measAfter.railLeft, 'px (should be ~47px)');
  console.log('Footer bottom WITH safe areas:', measAfter.footBottom, 'px (viewport is 390px, should be ~369px)');
  console.log('\n✅ Layout respects safe areas:', measAfter.railLeft >= 45 && measAfter.railLeft <= 50);
  
  await page.screenshot({ path: '/tmp/board-screenshots/05-final-with-safe-areas.png' });
  console.log('\n✓ Final screenshot saved: 05-final-with-safe-areas.png');
  
  await page.waitForTimeout(1000);
  await browser.close();
})();
