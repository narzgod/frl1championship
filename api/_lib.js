/* Shared helpers for the database API (Upstash Redis REST, added from the Vercel Marketplace). */
const crypto = require('crypto');
const KEY = 'frl:state';
const URL_ = () => process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || '';
const TOK = () => process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || '';
const hasDb = () => !!(URL_() && TOK());
async function cmd(a) {
  const r = await fetch(URL_(), { method: 'POST', headers: { Authorization: 'Bearer ' + TOK(), 'Content-Type': 'application/json' }, body: JSON.stringify(a) });
  const j = await r.json(); if (!r.ok || j.error) throw new Error(j.error || 'db error'); return j.result;
}
async function getState() { const v = await cmd(['GET', KEY]); if (!v) return null; try { return JSON.parse(v); } catch (e) { return null; } }
async function putState(s) { await cmd(['SET', KEY, JSON.stringify(s)]); }
const secret = () => process.env.UNLOCK_CODE || '';
const eq = (a, b) => { const x = Buffer.from(String(a)), y = Buffer.from(String(b)); return x.length === y.length && crypto.timingSafeEqual(x, y); };
const token = () => crypto.createHmac('sha256', secret()).update('frl-owner-v1').digest('hex');
const cookieOf = (req, n) => { const m = (req.headers.cookie || '').split(';').map(s => s.trim()).find(s => s.startsWith(n + '=')); return m ? m.slice(n.length + 1) : ''; };
const authed = req => !!secret() && eq(cookieOf(req, 'frl_auth'), token());
async function body(req) {
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) return req.body;
  if (typeof req.body === 'string') { try { return JSON.parse(req.body); } catch (e) { return {}; } }
  const c = []; for await (const x of req) c.push(x); try { return JSON.parse(Buffer.concat(c).toString() || '{}'); } catch (e) { return {}; }
}
const norm = s => { s = s && typeof s === 'object' ? s : {}; ['ev', 'dr', 'tm', 'rc'].forEach(k => { if (!Array.isArray(s[k])) s[k] = []; }); return s; };
/* team CP / tyres / sponsor slots / package are all derived from an append-only ledger, so purchases made by teams are never lost when the admin saves */
const sum = t => { const u = (t && t.up) || {}, l = Array.isArray(u.led) ? u.led : [], o = { cp: 0, tires: 0, slots: 0, pk: '' };
  l.forEach(x => { o.cp += +x.cp || 0; if (x.k === 'tire') o.tires += +x.q || 0; if (x.k === 'slot') o.slots += +x.q || 0; if (x.k === 'pack') o.pk = x.ref || ''; }); return o; };
/* public view: no phone numbers, no team passwords, no ledger details */
const strip = s => { const o = JSON.parse(JSON.stringify(norm(s))); o.dr.forEach(d => delete d.wa);
  /* upgrades are locked: the public state only says whether the system is on. Everything else (engine, levels, wallet, sponsors, prices) is returned by /api/upgrade after the team password. */
  o.ev.forEach(e => { if (e.up) e.up = { on: !!e.up.on, v: e.up.v }; });
  o.tm.forEach(t => { delete t.tpw; delete t.oww; delete t.up; }); return o; };
module.exports = { hasDb, getState, putState, authed, body, norm, strip, sum, cmd, eq };
