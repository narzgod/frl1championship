const L = require('./_lib');
const digits = v => String(v || '').replace(/\D/g, '');
const t = (v, n) => String(v == null ? '' : v).replace(/\s+/g, ' ').trim().slice(0, n || 80);
const uid = () => Math.random().toString(36).slice(2, 8);
/* split of the declared CP between the two drivers: 50:50, or 70:30 with a focus driver */
const shares = (dids, m, f, total) => {
  const o = {};
  if (dids.length < 2) { dids.forEach(d => { o[d] = total; }); return o; }
  if (m === '70' && dids.includes(f)) { const a = Math.round(total * 0.7); dids.forEach(d => { o[d] = d === f ? a : total - a; }); }
  else { const h = Math.floor(total / 2); o[dids[0]] = total - h; o[dids[1]] = h; }
  return o;
};
const maxOf = (ty, i) => { const m = +((((ty || {}).d || [])[i]) || {}).m; return m >= 1 && m <= 8 ? m : 5; };
module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ err: 'Method not allowed.' });
  if (!L.hasDb()) return res.status(503).json({ err: 'Database is not connected yet.' });
  try {
    const b = await L.body(req), s = L.norm(await L.getState() || {});
    const fail = m => res.status(400).json({ err: m });
    const e = s.ev.find(x => x.id == b.ev);
    if (!e || !e.up || !e.up.on) return fail('Upgrades are not open for this event.');
    const tm = s.tm.find(x => x.id == b.team && x.ev == e.id);
    if (!tm) return fail('Team not found.');
    const w = digits(b.wa);
    if (w.length < 8 || (w !== digits(tm.tpw) && w !== digits(tm.oww))) return fail('That WhatsApp number does not match the Team Principal or Team Owner of this team.');
    tm.up = tm.up || { d: {}, r: [] }; tm.up.d = tm.up.d || {}; tm.up.r = tm.up.r || [];
    if (b.kind === 'list') {
      return res.status(200).json({ reps: tm.up.r.slice(-20).reverse().map(r => ({ id: r.id, at: r.at, total: r.total, m: r.m, f: r.f, sh: r.sh, items: r.items, note: r.note, st: r.st, why: r.why })) });
    }
    if (b.kind === 'submit') {
      const dids = tm.d.slice(0, 2).filter(Boolean);
      if (!dids.length || !dids.every(d => tm.up.d[d])) return fail('Upgrades are not set up for your team yet. Ask the admin.');
      if (tm.up.r.some(r => r.st === 'p')) return fail('You already have a report waiting for the admin. Please wait for the decision.');
      const total = Math.floor(+b.total);
      if (!(total >= 1 && total <= 1000000)) return fail('Enter the CP amount you want to spend.');
      let m = b.m === '70' ? '70' : '50', f = t(b.f, 8);
      if (tm.up.lk && tm.up.m) { m = tm.up.m; f = tm.up.f || ''; }
      if (m === '70' && !dids.includes(f)) return fail('Choose which driver gets the 70% focus.');
      const sh = shares(dids, m, f, total), items = {}; let n = 0;
      const name = d => (s.dr.find(x => x.did == d) || {}).name || d;
      for (const d of dids) {
        const ud = tm.up.d[d], it = (b.items && b.items[d]) || {}, o = { e: [0, 0, 0, 0], t: [0, 0, 0, 0] };
        for (const k of ['e', 't']) for (let i = 0; i < 4; i++) {
          if (!+((it[k] || [])[i])) continue;
          const ty = (e.up[k === 'e' ? 'en' : 'tb'] || []).find(x => x.id == ud[k === 'e' ? 'et' : 'tt']);
          if (!ty) return fail(name(d) + ' has no ' + (k === 'e' ? 'engine' : 'turbo') + ' type assigned yet.');
          if ((+((ud[k] || [])[i]) || 0) >= maxOf(ty, i)) return fail('A selected component of ' + name(d) + ' is already at its maximum level.');
          o[k][i] = 1; n++;
        }
        items[d] = o;
      }
      if (!n) return fail('Select at least one component to upgrade.');
      for (const d of dids) if ((+tm.up.d[d].cp || 0) < sh[d]) return fail(name(d) + ' needs ' + sh[d] + ' CP for this split but only has ' + (+tm.up.d[d].cp || 0) + ' CP.');
      tm.up.r.push({ id: uid(), at: Date.now(), total, m, f: m === '70' ? f : '', sh, items, note: t(b.note, 300), st: 'p' });
      await L.putState(s);
      return res.status(200).json({ ok: true });
    }
    return fail('Bad request.');
  } catch (err) { return res.status(500).json({ err: 'Could not save. Try again.' }); }
};
