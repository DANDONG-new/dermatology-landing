// Browser verification for this local landing page. No package installation required.
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const { pathToFileURL } = require('node:url');
const { createRequire } = require('node:module');
const root = path.resolve(__dirname, '..');
let playwright;
try { playwright = require('playwright'); }
catch {
  const bundled = path.join(process.env.USERPROFILE, '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/package.json');
  playwright = createRequire(bundled)('playwright');
}
const browserCandidates = [
  process.env.BROWSER_EXECUTABLE,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
];
const executablePath = browserCandidates.find(p => p && fs.existsSync(p));
const checks = [];
function pass(name) { checks.push(name); console.log(`PASS ${name}`); }
function dateText(day) {return `${day.getFullYear()}-${String(day.getMonth()+1).padStart(2,'0')}-${String(day.getDate()).padStart(2,'0')}`;}
function nextWeekday(weekday) {const day = new Date();day.setDate(day.getDate()+1);while(day.getDay()!==weekday)day.setDate(day.getDate()+1);return dateText(day);}

(async () => {
  fs.mkdirSync(path.join(root, 'qa'), {recursive:true});
  const browser = await playwright.chromium.launch({headless:true, ...(executablePath ? {executablePath} : {})});
  const context = await browser.newContext({viewport:{width:1440,height:1000},locale:'ko-KR',timezoneId:'Asia/Seoul',reducedMotion:'reduce'});
  const page = await context.newPage();
  const errors = [];
  const failedLocalAssets = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('requestfailed', request => {if(request.url().startsWith('file:'))failedLocalAssets.push(request.url());});
  try {
    await page.goto(pathToFileURL(path.join(root,'index.html')).href);
    await page.evaluate(() => document.fonts.ready);
    await page.locator('img').evaluateAll(images => { for (const image of images) image.loading = 'eager'; });
    await page.locator('img').evaluateAll(images => Promise.all(images.map(image => image.decode())));
    assert.match(await page.title(), /오브 피부과/);
    assert.equal(await page.locator('h1').count(),1);
    assert.equal(await page.locator('img').evaluateAll(images => images.every(image => image.complete && image.naturalWidth > 0)),true);
    pass('Page, title and all local image assets load');
    assert.deepEqual(await page.locator('a[href^="#"]').evaluateAll(links => links.filter(link => !document.getElementById(link.hash.slice(1))).map(link => link.hash)),[]);
    pass('All navigation anchors resolve');
    await page.screenshot({path:path.join(root,'qa/desktop.png'),fullPage:true});
    await page.screenshot({path:path.join(root,'qa/desktop-hero.png')});
    for (const width of [320,360,390,680,768,900,1024,1440,1920]) {
      await page.setViewportSize({width,height:900});
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),true,`horizontal overflow at ${width}px`);
    }
    pass('No horizontal overflow at 9 mobile, tablet and desktop widths');
    await page.setViewportSize({width:1440,height:1000});
    await page.getByRole('tab',{name:'색소 · 피부톤',exact:true}).click();
    assert.equal(await page.locator('[data-care]:visible').count(),1);
    assert.equal(await page.locator('[data-care="tone"]').isVisible(),true);
    await page.locator('#care').screenshot({path:path.join(root,'qa/program-filter.png')});
    await page.getByRole('tab',{name:'색소 · 피부톤',exact:true}).press('ArrowRight');
    assert.equal(await page.getByRole('tab',{name:'모공 · 피부결',exact:true}).getAttribute('aria-selected'),'true');
    await page.getByRole('tab',{name:'모공 · 피부결',exact:true}).press('Home');
    assert.equal(await page.locator('[data-care]:visible').count(),4);
    pass('Program filtering and keyboard tab navigation work');
    await page.locator('[data-detail="tone"]').click();
    assert.equal(await page.locator('#info-dialog').evaluate(d=>d.open),true);
    await page.locator('#info-book').click();
    assert.equal(await page.locator('#booking-dialog').evaluate(d=>d.open),true);
    assert.equal(await page.locator('[name="program"]').inputValue(),'tone');
    pass('Program details open and carry the selected program into booking');
    await page.locator('[name="name"]').fill('테스트 고객');
    await page.locator('[name="phone"]').fill('123');
    assert.equal(await page.locator('[name="phone"]').evaluate(el=>el.validity.patternMismatch),true);
    await page.locator('[name="phone"]').fill('010-0000-0000');
    await page.locator('[name="date"]').fill('2020-01-01');
    assert.equal(await page.locator('[name="date"]').evaluate(el=>el.checkValidity()),false);
    await page.locator('[name="date"]').fill(nextWeekday(0));
    assert.equal(await page.locator('[name="date"]').evaluate(el=>el.checkValidity()),false);
    assert.equal(await page.locator('[name="time"]').isDisabled(),true);
    pass('Invalid phone numbers, past dates and Sundays are rejected');
    await page.locator('[name="date"]').fill(nextWeekday(1));
    let options = await page.locator('[name="time"] option').allTextContents();
    assert.equal(options.includes('13:00'),false);
    assert.equal(options.includes('13:30'),false);
    assert.equal(options.includes('18:30'),true);
    assert.equal(options.includes('19:00'),false);
    await page.locator('[name="date"]').fill(nextWeekday(3));
    options = await page.locator('[name="time"] option').allTextContents();
    assert.equal(options.includes('19:30'),true);
    await page.locator('[name="date"]').fill(nextWeekday(6));
    options = await page.locator('[name="time"] option').allTextContents();
    assert.equal(options.includes('13:00'),true);
    assert.equal(options.includes('13:30'),true);
    assert.equal(options.includes('14:00'),false);
    pass('Lunch break, Wednesday evening and Saturday hours match the visible timetable');
    await page.locator('[name="time"]').selectOption('10:00');
    await page.locator('[name="acknowledge"]').check();
    const outgoing=[];
    const onRequest = request => outgoing.push(request.url());
    page.on('request', onRequest);
    await page.getByRole('button',{name:'상담 내용 확인하기'}).click();
    assert.equal(await page.locator('#booking-review').isVisible(),true);
    assert.match(await page.locator('#review-content').textContent(),/테스트 고객/);
    assert.match(await page.locator('#review-content').textContent(),/색소 · 피부톤/);
    assert.equal(outgoing.length,0);
    page.off('request',onRequest);
    await page.screenshot({path:path.join(root,'qa/booking.png')});
    await page.getByRole('button',{name:'내용 수정하기'}).click();
    assert.equal(await page.locator('[name="name"]').inputValue(),'테스트 고객');
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('#booking-dialog').evaluate(d=>d.open),false);
    await page.waitForFunction(() => document.querySelector('[name="name"]').value === '');
    assert.equal(await page.locator('[name="name"]').inputValue(),'');
    assert.equal(await page.locator('#review-content').textContent(),'');
    pass('Booking review, editing, Escape and data clearing work; submission makes no requests');
    await page.locator('.faq summary').first().click();
    assert.equal(await page.locator('.faq details').first().getAttribute('open'),'');
    await page.locator('[data-policy="privacy"]').click();
    assert.equal(await page.locator('#info-title').textContent(),'개인정보처리방침 안내');
    assert.equal(await page.locator('#info-book').isVisible(),false);
    await page.keyboard.press('Escape');
    pass('FAQ and footer information dialogs work');
    await page.setViewportSize({width:390,height:844});
    await page.evaluate(()=>scrollTo(0,0));
    await page.locator('.menu-toggle').click();
    assert.equal(await page.locator('.menu-toggle').getAttribute('aria-expanded'),'true');
    await page.locator('#mobile-nav a[href="#care"]').click();
    assert.equal(await page.locator('.menu-toggle').getAttribute('aria-expanded'),'false');
    assert.equal(await page.locator('#mobile-nav').evaluate(el=>el.inert),true);
    await page.locator('.mobile-book-bar button').click();
    assert.equal(await page.locator('#booking-dialog').evaluate(d=>d.open),true);
    await page.keyboard.press('Escape');
    await page.evaluate(()=>scrollTo(0,0));
    await page.evaluate(()=>document.activeElement.blur());
    await page.screenshot({path:path.join(root,'qa/mobile.png'),fullPage:true});
    await page.screenshot({path:path.join(root,'qa/mobile-hero.png')});
    pass('Mobile navigation and fixed booking action work');
    const offlinePage = await context.newPage();
    await offlinePage.route(/^https?:/, route => route.abort());
    await offlinePage.goto(pathToFileURL(path.join(root,'index.html')).href);
    await offlinePage.setViewportSize({width:390,height:844});
    await offlinePage.locator('img').evaluateAll(images => { for (const image of images) image.loading = 'eager'; });
    await offlinePage.locator('img').evaluateAll(images => Promise.all(images.map(image => image.decode())));
    assert.equal(await offlinePage.locator('img').evaluateAll(images => images.every(image => image.complete && image.naturalWidth > 0)),true);
    assert.equal(await offlinePage.evaluate(() => document.documentElement.scrollWidth <= innerWidth),true);
    await offlinePage.locator('.mobile-book-bar button').click();
    assert.equal(await offlinePage.locator('#booking-dialog').evaluate(d=>d.open),true);
    await offlinePage.close();
    pass('Page assets, font fallbacks and booking dialog also work without internet');
    assert.deepEqual(errors,[]);
    assert.deepEqual(failedLocalAssets,[]);
    pass('No JavaScript runtime errors or missing local assets');
    fs.writeFileSync(path.join(root,'qa/results.json'),JSON.stringify({testedAt:new Date().toISOString(),browser:await browser.version(),checks,errors,failedLocalAssets},null,2));
    console.log(`\n${checks.length} browser checks passed.`);
  } finally { await browser.close(); }
})().catch(error => {console.error(error);process.exitCode=1;});
