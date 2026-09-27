const playwright = require('playwright');

(async () => {
  const browser = await playwright.chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 844, height: 390 },
    deviceScaleFactor: 1
  });
  
  const page = await context.newPage();
  
  console.log('Test 1: WITHOUT safe-area vars (baseline)');
  await page.goto('http://localhost:3000/admin/DEMO01/board', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: '/tmp/board-screenshots/01-landscape-no-safe-area.png', fullPage: false });
  console.log('✓ Screenshot saved: 01-landscape-no-safe-area.png');
  
  console.log('\nTest 2: WITH safe-area vars (simulated native chrome)');
  await page.evaluate(() => {
    document.documentElement.classList.add('casa-native-chrome');
    document.documentElement.style.setProperty('--lr-sal', '47px');
    document.documentElement.style.setProperty('--lr-sar', '47px');
    document.documentElement.style.setProperty('--lr-sab', '21px');
    document.documentElement.style.setProperty('--lr-sat', '0px');
  });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: '/tmp/board-screenshots/02-landscape-with-safe-areas.png', fullPage: false });
  console.log('✓ Screenshot saved: 02-landscape-with-safe-areas.png');
  
  // Inspect specific layout elements
  console.log('\n=== Layout Inspection ===');
  
  const leftRailInfo = await page.evaluate(() => {
    const leftRail = document.querySelector('[class*="left-rail"], [class*="LeftRail"], nav, aside');
    if (leftRail) {
      const rect = leftRail.getBoundingClientRect();
      const computed = window.getComputedStyle(leftRail);
      return {
        exists: true,
        left: rect.left,
        width: rect.width,
        paddingLeft: computed.paddingLeft,
        marginLeft: computed.marginLeft,
        className: leftRail.className
      };
    }
    return { exists: false };
  });
  console.log('Left Rail:', JSON.stringify(leftRailInfo, null, 2));
  
  const footerInfo = await page.evaluate(() => {
    const footer = document.querySelector('footer, [class*="footer"], [class*="Footer"]');
    const buttons = Array.from(document.querySelectorAll('button'));
    const avantiBtn = buttons.find(b => b.textContent.includes('AVANTI') || b.textContent.includes('Avanti'));
    return {
      footer: footer ? {
        bottom: footer.getBoundingClientRect().bottom,
        height: footer.offsetHeight,
        className: footer.className
      } : null,
      avanti: avantiBtn ? {
        bottom: avantiBtn.getBoundingClientRect().bottom,
        top: avantiBtn.getBoundingClientRect().top,
        text: avantiBtn.textContent.trim()
      } : null
    };
  });
  console.log('Footer Info:', JSON.stringify(footerInfo, null, 2));
  
  const cardsInfo = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('[class*="card"], [class*="Card"]'));
    return {
      count: cards.length,
      positions: cards.slice(0, 3).map(card => {
        const rect = card.getBoundingClientRect();
        const style = window.getComputedStyle(card);
        return {
          top: rect.top,
          left: rect.left,
          zIndex: style.zIndex,
          border: style.border
        };
      })
    };
  });
  console.log('Cards Info:', JSON.stringify(cardsInfo, null, 2));
  
  // Check for overlapping elements
  const overlapCheck = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('[class*="card"], [class*="Card"]'));
    let overlaps = [];
    for (let i = 0; i < cards.length - 1; i++) {
      const rect1 = cards[i].getBoundingClientRect();
      const rect2 = cards[i + 1].getBoundingClientRect();
      const overlapping = !(rect1.right < rect2.left || 
                           rect1.left > rect2.right || 
                           rect1.bottom < rect2.top || 
                           rect1.top > rect2.bottom);
      if (overlapping) {
        overlaps.push({ card1: i, card2: i + 1 });
      }
    }
    return { hasOverlaps: overlaps.length > 0, overlaps };
  });
  console.log('Overlap Check:', JSON.stringify(overlapCheck, null, 2));
  
  // Take a close-up of the left edge
  await page.screenshot({ 
    path: '/tmp/board-screenshots/03-left-edge-detail.png',
    clip: { x: 0, y: 0, width: 200, height: 390 }
  });
  console.log('✓ Screenshot saved: 03-left-edge-detail.png (left edge detail)');
  
  // Take a close-up of the bottom edge
  await page.screenshot({ 
    path: '/tmp/board-screenshots/04-bottom-edge-detail.png',
    clip: { x: 0, y: 290, width: 844, height: 100 }
  });
  console.log('✓ Screenshot saved: 04-bottom-edge-detail.png (bottom edge detail)');
  
  console.log('\n=== All tests complete ===');
  console.log('Screenshots saved in: /tmp/board-screenshots/');
  
  await page.waitForTimeout(2000);
  await browser.close();
})();
