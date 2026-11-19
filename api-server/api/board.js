// FliptapWars public rankings + comment wall.
// GET  /api/board            -> { scores:[...], comments:[...] }
// POST /api/board {type:'score', name, comment, score, fighter, stages, retries, time}
// POST /api/board {type:'comment', name, comment}
// Storage: one JSON document in Vercel Blob. Fine for a small fan game.
import { put, head } from '@vercel/blob';
import { createHmac, timingSafeEqual } from 'node:crypto';

const DOC = 'fliptapwars/board.json';
const MAX_SCORES = 100, MAX_COMMENTS = 150, COOLDOWN_MS = 120000, MAX_SCORE = 2000000;
// cooldown per visitor: IPs are HMAC-hashed with a server secret, never stored raw
const ipKey = ip => createHmac('sha256', process.env.BLOB_READ_WRITE_TOKEN || 'x').update(ip).digest('hex').slice(0, 20);
let cache = null, cacheAt = 0, docUrl = null;

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
async function load(fresh) {
  if (!fresh && cache && Date.now() - cacheAt < 15000) return cache;
  try {
    if (!docUrl) docUrl = (await head(DOC)).url;
    const r = await fetch(docUrl + '?t=' + Date.now(), { cache: 'no-store' });
    cache = r.ok ? await r.json() : { scores: [], comments: [] };
  } catch (e) { cache = cache || { scores: [], comments: [] }; }
  cache.scores ||= []; cache.comments ||= []; cache.recent ||= {}; cacheAt = Date.now();
  return cache;
}
async function save(doc) {
  const r = await put(DOC, JSON.stringify(doc), { access: 'public', addRandomSuffix: false, allowOverwrite: true, contentType: 'application/json', cacheControlMaxAge: 60 });
  docUrl = r.url; cache = doc; cacheAt = Date.now();
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
    return res.status(200).json({ scores: d.scores.slice(0, MAX_SCORES), comments: d.comments.slice(0, MAX_COMMENTS) });
  }
  if (req.method === 'DELETE') {
    const key = String(req.headers['x-admin-key'] || ''), want = process.env.ADMIN_KEY || '';
    if (!want || key.length !== want.length || !timingSafeEqual(Buffer.from(key), Buffer.from(want))) return res.status(403).json({ error: 'forbidden' });
    const b = await body(req), d = await load(true);
    d.scores = d.scores.filter(x => x.id !== b.id); d.comments = d.comments.filter(x => x.id !== b.id);
    if (b.all === true) { d.scores = []; d.comments = []; d.recent = {}; }
    await save(d); return res.status(200).json({ ok: true });
  }
  if (req.method !== 'POST') return res.status(405).json({ error: 'method' });

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
  if (b.type === 'comment') {
    if (comment.length < 2) return res.status(400).json({ error: 'empty' });
    d.comments.unshift({ id, name, comment, at: now }); d.comments = d.comments.slice(0, MAX_COMMENTS);
    d.recent[who] = now; await save(d);
    return res.status(200).json({ ok: true });
  }
  return res.status(400).json({ error: 'type' });
}
