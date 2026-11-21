// FliptapWars server: public rankings, comment wall, patrons board, private inbox (suggestions + donation claims).
// GET  /api/board              -> { scores, comments, patrons }
// GET  /api/board?inbox=1      -> admin only (X-Admin-Key)
// POST /api/board {type:'score'|'comment'|'suggestion'|'claim'|'approve'|'patron', ...}
// DELETE /api/board {id} | {all:true}   admin only
//
// Storage (Vercel Blob): every save writes a NEW versioned file (newest sorts first). Writes read the newest
// version through list(), which is not CDN cached, so players posting at the same time never overwrite each
// other with stale data. Public GET reads a mirror file through the CDN (may lag ~60 s, fine for viewing).
import { put, head, list, del } from '@vercel/blob';
import { createHmac, timingSafeEqual } from 'node:crypto';

const MAX_SCORES = 100, MAX_COMMENTS = 150, COOLDOWN_MS = 120000, MAX_SCORE = 2000000;
// cooldown per visitor: IPs are HMAC-hashed with a server secret, never stored raw
const ipKey = ip => createHmac('sha256', process.env.BLOB_READ_WRITE_TOKEN || 'x').update(ip).digest('hex').slice(0, 20);
let cache = null, cacheAt = 0, mirrorUrl = null, writes = 0;
function isAdmin(req) { const key = String(req.headers['x-admin-key'] || ''), want = process.env.ADMIN_KEY || ''; return !!want && key.length === want.length && timingSafeEqual(Buffer.from(key), Buffer.from(want)); }
const verName = prefix => prefix + String(9e15 - Date.now()).padStart(16, '0') + '.json';
async function readLatest(prefix, fallback) {
  const { blobs } = await list({ prefix, limit: 1 });
  if (!blobs.length) return fallback();
  const r = await fetch(blobs[0].url, { cache: 'no-store' });
  return r.ok ? await r.json() : fallback();
}
async function writeVersion(prefix, data) {
  await put(verName(prefix), JSON.stringify(data), { access: 'public', addRandomSuffix: true, contentType: 'application/json', cacheControlMaxAge: 31536000 });
  if (++writes % 5 === 0) { try { const { blobs } = await list({ prefix, limit: 20 }); if (blobs.length > 4) await del(blobs.slice(4).map(b => b.url)); } catch (e) {} }
}
const emptyBoard = () => ({ scores: [], comments: [], recent: {}, patrons: [] });
const emptyInbox = () => ({ suggestions: [], claims: [] });
function norm(d) { d.scores ||= []; d.comments ||= []; d.recent ||= {}; d.patrons ||= []; return d; }
async function load(fresh) {
  if (fresh) { cache = norm(await readLatest('fw/board/', emptyBoard)); cacheAt = Date.now(); return cache; }
  if (cache && Date.now() - cacheAt < 20000) return cache;
  try { if (!mirrorUrl) mirrorUrl = (await head('fw/public.json')).url; const r = await fetch(mirrorUrl); cache = norm(r.ok ? await r.json() : emptyBoard()); }
  catch (e) { cache = norm(await readLatest('fw/board/', emptyBoard)); }
  cacheAt = Date.now(); return cache;
}
async function save(d) {
  await writeVersion('fw/board/', d);
  const r = await put('fw/public.json', JSON.stringify({ scores: d.scores, comments: d.comments, patrons: d.patrons }), { access: 'public', addRandomSuffix: false, allowOverwrite: true, contentType: 'application/json', cacheControlMaxAge: 60 });
  mirrorUrl = r.url; cache = d; cacheAt = Date.now();
}
async function loadP() { const d = await readLatest('fw/inbox/', emptyInbox); d.suggestions ||= []; d.claims ||= []; return d; }
const saveP = d => writeVersion('fw/inbox/', d);

const BAD = ['putang ina','putangina','tangina','tang ina','gago','gaga','tanga','bobo','ulol','tarantado','punyeta','leche','pakyu','pakshet','kupal','hayop ka','fuck','shit','bitch','asshole','cunt','dick','pussy','nigger','nigga','faggot','retard','whore','slut'];
function clean(s, max) {
  s = String(s || '').replace(/[\u0000-\u001f\u007f<>]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
  s = s.replace(/\b(https?:\/\/|www\.)\S+/gi, '[link]');
  for (const w of BAD) s = s.replace(new RegExp(w.replace(/ /g, '\\s*'), 'gi'), m => m[0] + '*'.repeat(Math.max(1, m.length - 1)));
  return s;
}
function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Admin-Key');
}
async function body(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  let raw = ''; for await (const c of req) { raw += c; if (raw.length > 4000) break; }
  try { return JSON.parse(raw || '{}'); } catch { return {}; }
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method === 'GET') {
    const d = await load(false);
    res.setHeader('Cache-Control', 's-maxage=10, stale-while-revalidate=30');
    if (req.query && req.query.inbox) { if (!isAdmin(req)) return res.status(403).json({ error: 'forbidden' }); res.setHeader('Cache-Control', 'no-store'); return res.status(200).json(await loadP()); }
    return res.status(200).json({ scores: d.scores.slice(0, MAX_SCORES), comments: d.comments.slice(0, MAX_COMMENTS), patrons: d.patrons.slice(0, 50) });
  }
  if (req.method === 'DELETE') {
    if (!isAdmin(req)) return res.status(403).json({ error: 'forbidden' });
    const b = await body(req), d = await load(true);
    d.scores = d.scores.filter(x => x.id !== b.id); d.comments = d.comments.filter(x => x.id !== b.id); d.patrons = d.patrons.filter(x => x.id !== b.id);
    const p = await loadP(), n = p.suggestions.length + p.claims.length; p.suggestions = p.suggestions.filter(x => x.id !== b.id); p.claims = p.claims.filter(x => x.id !== b.id); if (p.suggestions.length + p.claims.length !== n) await saveP(p);
    if (b.all === true) { d.scores = []; d.comments = []; d.recent = {}; }
    await save(d); return res.status(200).json({ ok: true });
  }
  if (req.method !== 'POST') return res.status(405).json({ error: 'method' });

  const pre = await body(req);
  // ---- admin actions on donation claims / patrons ----
  if (['approve', 'patron'].includes(pre.type)) {
    if (!isAdmin(req)) return res.status(403).json({ error: 'forbidden' });
    const d = await load(true), p = await loadP();
    let name, amount, message;
    if (pre.type === 'approve') { const c = p.claims.find(x => x.id === pre.id); if (!c) return res.status(404).json({ error: 'claim' }); ({ name, amount, message } = c); p.claims = p.claims.filter(x => x.id !== pre.id); await saveP(p); }
    else { name = clean(pre.name, 16); amount = Math.round(Number(pre.amount)); message = clean(pre.message, 100); if (!name || !(amount > 0)) return res.status(400).json({ error: 'patron' }); }
    const ex = d.patrons.find(x => x.name.toLowerCase() === name.toLowerCase());
    if (ex) { ex.total += amount; ex.count += 1; if (message) ex.message = message; ex.at = Date.now(); }
    else d.patrons.push({ id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), name, total: amount, count: 1, message: message || '', at: Date.now() });
    d.patrons.sort((a, c) => c.total - a.total); await save(d); return res.status(200).json({ ok: true });
  }
  req.body = pre;
  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown', who = ipKey(ip);
  const b = await body(req);
  const name = clean(b.name, 16) || 'Anonymous';
  const comment = clean(b.comment, 140);
  const now = Date.now(), id = now.toString(36) + Math.random().toString(36).slice(2, 6);
  const d = await load(true);
  for (const k in d.recent) if (now - d.recent[k] > COOLDOWN_MS) delete d.recent[k];
  if (d.recent[who]) return res.status(429).json({ error: 'cooldown', wait: Math.ceil((COOLDOWN_MS - (now - d.recent[who])) / 1000) });

  if (b.type === 'score') {
    const score = Math.round(Number(b.score));
    if (!Number.isFinite(score) || score < 0 || score > MAX_SCORE) return res.status(400).json({ error: 'score' });
    const entry = { id, name, comment, score, fighter: clean(b.fighter, 12), stages: Math.max(0, Math.min(6, b.stages | 0)), retries: Math.max(0, Math.min(999, b.retries | 0)), time: Math.max(0, Math.min(36000, b.time | 0)), champ: !!b.champ, at: now };
    d.scores.push(entry); d.scores.sort((a, c) => c.score - a.score); d.scores = d.scores.slice(0, MAX_SCORES);
    if (comment) { d.comments.unshift({ id, name, comment, score, at: now }); d.comments = d.comments.slice(0, MAX_COMMENTS); }
    d.recent[who] = now; await save(d);
    return res.status(200).json({ ok: true, rank: d.scores.findIndex(s => s.id === id) + 1 });
  }
  if (b.type === 'suggestion' || b.type === 'claim') {
    const p = await loadP();
    if (b.type === 'suggestion') {
      const text = clean(b.text, 1000); if (text.length < 4) return res.status(400).json({ error: 'empty' });
      p.suggestions.unshift({ id, name, cat: clean(b.cat, 16), stars: Math.max(0, Math.min(5, b.stars | 0)), text, device: clean(b.device, 8), at: now }); p.suggestions = p.suggestions.slice(0, 500);
    } else {
      const amount = Math.round(Number(b.amount)); if (!(amount >= 1 && amount <= 100000)) return res.status(400).json({ error: 'amount' });
      p.claims.unshift({ id, name, amount, ref: clean(b.ref, 20).replace(/[^0-9A-Za-z]/g, ''), message: clean(b.message, 100), at: now }); p.claims = p.claims.slice(0, 300);
    }
    d.recent[who] = now; await saveP(p); await save(d);
    return res.status(200).json({ ok: true });
  }
  if (b.type === 'comment') {
    if (comment.length < 2) return res.status(400).json({ error: 'empty' });
    d.comments.unshift({ id, name, comment, at: now }); d.comments = d.comments.slice(0, MAX_COMMENTS);
    d.recent[who] = now; await save(d);
    return res.status(200).json({ ok: true });
  }
  return res.status(400).json({ error: 'type' });
}
