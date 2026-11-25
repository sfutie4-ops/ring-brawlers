// Frame-time benchmark for the built game. Run after `python3 build.py`:
//   node tests/perf-bench.cjs                 desktop 1920×1080, full speed
//   node tests/perf-bench.cjs --phone         Pixel 7 landscape with the CPU slowed 4× (a mid-range phone)
//   node tests/perf-bench.cjs --seconds=20 --profile      (also: --gpu  --breakdown  --nowarm  --seed=N)
//   --gpu draws through SwiftShader (an emulated GPU, much slower than a real one). There Chrome sometimes stops
//   presenting frames for 2-4 s in the middle of a fight, in old and new builds alike, so compare frame counts with care.
//   --nowarm skips the match warm-up (to see what it saves). --res=1.5 pins the render scale (to compare builds whose
//   "high" quality draws at different resolutions).
// Plays an AI-vs-AI match at fixed "high" quality and reports how long each frame's work takes
// (JS + canvas commands on the main thread). For a 144 Hz screen a frame has 6.9 ms in total, so the
// work should stay well under that with few spikes. Headless Chromium draws the canvas in software,
// so absolute numbers run higher than on a real GPU; compare runs against each other.
const http = require('http'), fs = require('fs'), path = require('path');
const { chromium, devices } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
const arg = (k, d) => { const a = process.argv.find(s => s.startsWith('--' + k)); return a ? (a.includes('=') ? a.split('=')[1] : true) : d; };
const PHONE = !!arg('phone'), SECONDS = +arg('seconds', 12), PROFILE = !!arg('profile'), THROTTLE = +arg('throttle', PHONE ? 4 : 1);
const TYPES = { '.html': 'text/html', '.webp': 'image/webp', '.png': 'image/png', '.ogg': 'audio/ogg', '.woff2': 'font/woff2' };

const serve = () => new Promise(r => { const s = http.createServer((q, res) => { const f = path.join(ROOT, decodeURIComponent(q.url.split('?')[0])); if (!f.startsWith(ROOT)) { res.writeHead(403); return res.end(); } fs.readFile(f, (e, d) => { if (e) { res.writeHead(404); return res.end(); } res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' }); res.end(d); }); }); s.listen(0, '127.0.0.1', () => r(s)); });
const stats = a => { if (!a.length) return 'no frames'; const s = [...a].sort((x, y) => x - y), q = p => s[Math.min(s.length - 1, Math.floor(p * s.length))]; const mean = a.reduce((x, y) => x + y, 0) / a.length;
  return `frames ${a.length} · mean ${mean.toFixed(2)} · p50 ${q(.5).toFixed(2)} · p95 ${q(.95).toFixed(2)} · p99 ${q(.99).toFixed(2)} · max ${s[s.length - 1].toFixed(1)} ms · over 6.9 ms: ${(100 * a.filter(x => x > 6.94).length / a.length).toFixed(1)}%`; };

(async () => {
  const server = await serve(), url = `http://127.0.0.1:${server.address().port}/index.html`;
  // --gpu: accelerated 2D canvas through SwiftShader, so rasterising happens off the main thread like on a real GPU
  const browser = await chromium.launch(arg('gpu') ? { args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-gpu-rasterization', '--enable-accelerated-2d-canvas'] } : {});
  const ctxOpts = PHONE ? devices['Pixel 7 landscape'] : { viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 };
  const context = await browser.newContext(ctxOpts), page = await context.newPage();
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  // seeded Math.random so every run plays the same fight (the simulation runs in fixed steps)
  await page.addInitScript(seed => { let x = seed >>> 0 || 1; Math.random = () => { x ^= x << 13; x >>>= 0; x ^= x >> 17; x ^= x << 5; x >>>= 0; return x / 4294967296; }; }, +arg('seed', 7));
  await page.addInitScript(() => { for (const [k, v] of [['rb_fanAck', '1'], ['rb_autoEnter', '1'], ['rb_quality', '"high"'], ['rb_sound', 'false']]) localStorage.setItem(k, v); });
  await page.goto(url);
  await page.waitForFunction(() => window.rbReady === true, null, { timeout: 180000 });
  const cdp = await context.newCDPSession(page);
  const pinRes = () => arg('res') ? page.evaluate(r => { resCap = r; fit(); }, +arg('res')) : null;
  await pinRes();
  if (THROTTLE > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: THROTTLE });
  // time the whole frame and its main parts
  await page.evaluate(() => {
    const T = window.__perf = { frame: [], step: 0, fx: 0, draw: 0, on: false, parts: [] };
    const ce = document.createElement.bind(document); T.canvases = 0; document.createElement = function (t) { if (t === 'canvas' && T.on) T.canvases++; return ce(t); };
    const wrap = (name, key) => { const f = window[name]; window[name] = function () { const t = performance.now(); const r = f.apply(this, arguments); if (T.on) T[key] += performance.now() - t; return r; }; };
    wrap('step', 'step'); wrap('fxUpdate', 'fx'); wrap('draw', 'draw');
    T.what = {}; const tag = () => { try { const p = ringDebug.state; return p.phase + (typeof cameraPrank !== 'undefined' && cameraPrank ? '+prank' : '') + (typeof sockCutaway !== 'undefined' && sockCutaway ? '+socks' : '') + (typeof superScreen !== 'undefined' && superScreen ? '+ultimate' : '') + (p.P1 && (p.P1.st === 'sp' || p.P2.st === 'sp') ? '+sp' : ''); } catch (e) { return '?'; } };
    const loop0 = window.loop; window.loop = function (n) { T.step = T.fx = T.draw = 0; const t = performance.now(); loop0(n); if (T.on) { T.frame.push(performance.now() - t); T.parts.push([T.step, T.fx, T.draw]); const k = tag(); T.what[k] = (T.what[k] || 0) + 1; } };
  });
  if (arg('breakdown')) await page.evaluate(() => {
    // inclusive time per drawing function (nested calls are counted in their parents too)
    const names = ['drawScene','drawMountainSky','drawCompleteStands','drawBfBack','drawEnvironmentFloor','drawReferee','drawUltimateBackdrop','drawMountain','drawTechnique','drawAnticCombatFX','drawUltimate','drawGoldShots','drawF','drawLighting','drawManaAura','drawSprite','drawBlockSpark','drawSockCat','drawSwoosh','drawFX','drawEnvironmentFX','drawParticles','drawBolts','drawPops','storyWorld','drawImpact','drawUltimateEdges','drawCrownVerse','drawBfOverlay','drawDanger','drawBanner','hud','drawPortraitCached','drawTimer','drawAnnounce','drawStoryCaption','drawSkillBar','drawKeyHint','drawCooldowns','drawUiFx','drawCrowdTexts','drawVS','drawProp','drawCinematicFighterFX','drawCombatPortrait','text','dtext','glow'];
    const B = window.__bd = {};
    for (const n of names) { const f = window[n]; if (typeof f !== 'function') continue; B[n] = 0; window[n] = function () { const t = performance.now(); try { return f.apply(this, arguments); } finally { if (__perf.on) B[n] += performance.now() - t; } }; }
  });
  const measure = async (label, ms) => {
    if (arg('breakdown')) await page.evaluate(() => { for (const k in __bd) __bd[k] = 0; });
    await page.evaluate(() => { __perf.frame = []; __perf.parts = []; __perf.what = {}; __perf.long = []; if (!__perf.obs) { try { __perf.obs = new PerformanceObserver(l => { for (const e of l.getEntries()) if (__perf.on) __perf.long.push(Math.round(e.duration)); }); __perf.obs.observe({ type: 'longtask', buffered: false }); } catch (e) {} } __perf.on = true; });
    await page.waitForTimeout(ms);
    const r = await page.evaluate(() => { __perf.on = false; const p = __perf.parts, avg = i => p.reduce((s, x) => s + x[i], 0) / Math.max(1, p.length); return { long: __perf.long, what: __perf.what, canvases: __perf.canvases, frame: __perf.frame, step: avg(0), fx: avg(1), draw: avg(2), rs: ringDebug.state.renderScale, cw: document.getElementById('g').width }; });
    if (arg('breakdown')) { const bd = await page.evaluate(() => __bd), n = r.frame.length || 1; console.log(`\n${label} drawing breakdown (ms per frame, inclusive):\n` + Object.entries(bd).filter(([, v]) => v / n > .02).sort((a, b) => b[1] - a[1]).map(([k, v]) => `  ${(v / n).toFixed(2).padStart(6)}  ${k}`).join('\n')); }
    console.log(`\n${label}  (canvas ${r.cw}px wide, render scale ${r.rs.toFixed(2)})\n  ${stats(r.frame)}\n  average per frame: simulation ${r.step.toFixed(2)} ms · effects ${r.fx.toFixed(2)} ms · drawing ${r.draw.toFixed(2)} ms · canvases created ${r.canvases}`);
    console.log('  long tasks (>50 ms) on the main thread: ' + ((r.long || []).length ? r.long.length + ', total ' + r.long.reduce((a, b) => a + b, 0) + ' ms' : 'none'));
    console.log('  frames by screen: ' + Object.entries(r.what || {}).map(([k, v]) => k + ' ' + v).join(' · '));
    await page.evaluate(() => { __perf.canvases = 0; });
    return r;
  };
  console.log(`FliptapWars perf bench — ${PHONE ? 'phone (Pixel 7 landscape)' : 'desktop 1920×1080'}, CPU ×${THROTTLE}`);
  await measure('MENU (idle)', 3000);
  // AI vs AI match on hard
  await page.evaluate(nowarm => { if (nowarm) window.queueMatchWarmup = () => {}; document.getElementById('difficulty').value = 'hard'; document.getElementById('rivalSelect').value = '12'; document.getElementById('go').click(); }, !!arg('nowarm'));
  await page.waitForFunction(() => ringDebug.state.phase === 'versus', null, { timeout: 30000 });
  // let the VS screen run its course (it holds until the match art is warmed up), as in real play
  await page.waitForFunction(() => ringDebug.state.phase === 'fight', null, { timeout: 30000 });
  console.log('\nwarm-up jobs still queued when the fight starts: ' + await page.evaluate(() => typeof warmQueue === 'undefined' ? 'n/a' : warmQueue.length + (warmPending ? ' (+ decoding)' : '')));
  await pinRes();
  await page.evaluate(() => { const s0 = window.step; window.step = function (dt) { if (phase === 'fight' && P1 && P2) ai(P1, P2, dt); return s0(dt); }; P1.mt = P2.mt = 100; });
  if (PROFILE) { await cdp.send('Profiler.enable'); await cdp.send('Profiler.setSamplingInterval', { interval: 200 }); await cdp.send('Profiler.start'); }
  const fight = await measure(`FIGHT (AI vs AI, ${SECONDS} s)`, SECONDS * 1000);
  if (PROFILE) {
    const { profile } = await cdp.send('Profiler.stop'), byId = {}, cnt = {}, self = {};
    for (const n of profile.nodes) byId[n.id] = n;
    for (const s of profile.samples) cnt[s] = (cnt[s] || 0) + 1;
    for (const id in cnt) { const n = byId[id], k = (n.callFrame.functionName || '(anonymous)') + (n.callFrame.lineNumber >= 0 && n.callFrame.url ? ':' + (n.callFrame.lineNumber + 1) : ''); self[k] = (self[k] || 0) + cnt[id]; }
    const total = profile.samples.length;
    console.log('\nTop self time during the fight:');
    for (const [k, v] of Object.entries(self).sort((a, b) => b[1] - a[1]).slice(0, 30)) console.log(`  ${(100 * v / total).toFixed(1).padStart(5)}%  ${k}`);
  }
  await page.evaluate(() => pauseGame(true));
  await measure('PAUSED', 2000);
  // identical frozen scene in every build: time 300 redraws, then read back one pixel so the GPU has to finish
  const scene = await page.evaluate(() => {
    const set = (f, x, st, t, mt) => Object.assign(f, { x, prevX: x, air: 0, prevAir: 0, st, t, mt, hp: 150, combo: 0, comboTime: 0, inv: 0 });
    set(P1, 420, 'punch', .09, 100); set(P2, 560, 'hit', .1, 40); shots.length = 0; effects.length = 0; parts.length = 0;
    const g = document.getElementById('g').getContext('2d');
    for (let i = 0; i < 30; i++) draw(); g.getImageData(0, 0, 1, 1);
    const t0 = performance.now(); for (let i = 0; i < 300; i++) draw(); g.getImageData(0, 0, 1, 1);
    return (performance.now() - t0) / 300;
  });
  console.log(`\nFROZEN SCENE: ${scene.toFixed(2)} ms of main-thread work per redraw`);
  // same frozen scene, game loop running normally: how many frames the browser actually presents in 5 s
  const fps = await page.evaluate(() => new Promise(done => { pauseGame(false); hitstop = 1e9; let n = 0; const t0 = performance.now();
    const tick = () => { n++; if (performance.now() - t0 < 5000) requestAnimationFrame(tick); else { hitstop = 0; done(n / ((performance.now() - t0) / 1000)); } }; requestAnimationFrame(tick); }));
  console.log(`STATIC SCENE THROUGHPUT: ${fps.toFixed(1)} frames/s presented`);
  console.log(errors.length ? '\nPage errors:\n  ' + errors.join('\n  ') : '\nNo page errors.');
  await browser.close(); server.close();
})();
