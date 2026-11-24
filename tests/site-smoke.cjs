// Browser smoke test for the built game (index.html + a/). Run after `python3 build.py`:
//   node tests/site-smoke.cjs
// Serves the repo over HTTP, then in headless Chromium:
//   desktop: boot, click every fighter card, start a match, fight, K.O., reach the result screen
//   phone:   boot in landscape touch mode, start a match, open the pause menu
// Any page error (uncaught exception) fails the test. Needs the `playwright` package and Chromium.
const http = require('http'), fs = require('fs'), path = require('path');
const { chromium, devices } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
const TYPES = { '.html': 'text/html', '.webp': 'image/webp', '.png': 'image/png', '.ogg': 'audio/ogg', '.mp3': 'audio/mpeg', '.woff2': 'font/woff2' };

function serve() {
  return new Promise(resolve => {
    const server = http.createServer((req, res) => {
      const file = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
      if (!file.startsWith(ROOT)) { res.writeHead(403); res.end(); return; }
      fs.readFile(file, (err, data) => {
        if (err) { res.writeHead(404); res.end(); return; }
        res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
        res.end(data);
      });
    });
    server.listen(0, '127.0.0.1', () => resolve(server));
  });
}

async function open(browser, url, options, errors, label) {
  const context = await browser.newContext(options);
  const page = await context.newPage();
  page.on('pageerror', e => errors.push(`${label}: ${e.message}`));
  // skip the fan notice and the tap-to-enter loader
  await page.addInitScript(() => { localStorage.setItem('rb_fanAck', '1'); localStorage.setItem('rb_autoEnter', '1'); });
  await page.goto(url);
  await page.waitForFunction(() => window.rbReady === true, null, { timeout: 180000 });
  return { context, page };
}

(async () => {
  const server = await serve();
  const url = `http://127.0.0.1:${server.address().port}/index.html`;
  const browser = await chromium.launch();
  const errors = [];
  const step = msg => console.log('  ✓ ' + msg);
  try {
    // ---------- desktop ----------
    const { context, page } = await open(browser, url, { viewport: { width: 1280, height: 720 } }, errors, 'desktop');
    step('desktop: game loaded');
    const cards = await page.evaluate(() => document.querySelectorAll('#cards .card').length);
    if (cards < 14) throw new Error(`expected 14 fighter cards, found ${cards}`);
    for (let i = 0; i < cards; i++) { await page.evaluate(n => document.querySelectorAll('#cards .card')[n].click(), i); await page.waitForTimeout(120); }
    step(`desktop: clicked all ${cards} fighter cards`);
    await page.evaluate(() => { document.querySelectorAll('#cards .card')[0].click(); document.getElementById('rivalSelect').value = '1'; document.getElementById('go').click(); });
    await page.waitForFunction(() => ringDebug.state.phase === 'versus', null, { timeout: 30000 });
    await page.keyboard.press('Enter');
    await page.waitForFunction(() => ringDebug.state.phase === 'fight', null, { timeout: 30000 });
    step('desktop: match started');
    for (const key of ['j', 'k', 'j', 'k', 'l', 'j']) { await page.keyboard.press(key); await page.waitForTimeout(200); }
    await page.evaluate(() => { ringDebug.state.P2.hp = 0; });
    // the post-match skits can be skipped; keep pressing skip until the result card shows
    for (let i = 0; i < 120; i++) {
      const phase = await page.evaluate(() => ringDebug.state.phase);
      if (phase === 'end') break;
      if (phase === 'antic') await page.evaluate(() => document.getElementById('skipScene').click());
      await page.waitForTimeout(250);
    }
    const end = await page.evaluate(() => [ringDebug.state.phase, getComputedStyle(document.getElementById('result')).display]);
    if (end[0] !== 'end' || end[1] === 'none') throw new Error(`result screen not reached (phase ${end[0]})`);
    step('desktop: K.O. and result screen');
    await context.close();

    // ---------- phone (landscape, touch) ----------
    const phone = await open(browser, url, devices['Pixel 7 landscape'], errors, 'phone');
    step('phone: game loaded');
    await phone.page.evaluate(() => document.getElementById('go').click());
    await phone.page.waitForFunction(() => ringDebug.state.phase === 'versus', null, { timeout: 30000 });
    await phone.page.mouse.click(400, 200);
    await phone.page.waitForFunction(() => ringDebug.state.phase === 'fight', null, { timeout: 30000 });
    await phone.page.evaluate(() => pauseGame(true));
    await phone.page.waitForTimeout(300);
    step('phone: match started and pause menu opened');
    await phone.context.close();
  } catch (e) {
    errors.push('test: ' + e.message);
  } finally {
    await browser.close();
    server.close();
  }
  if (errors.length) {
    console.error('\nSMOKE TEST FAILED\n' + errors.map(e => '  ✗ ' + e).join('\n'));
    process.exit(1);
  }
  console.log('\nSmoke test passed.');
})();
