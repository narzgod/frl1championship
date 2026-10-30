const L = require('./_lib');
const wa = v => { const d = String(v || '').replace(/[^\d+]/g, ''); const n = d.replace(/\D/g, ''); return n.length >= 8 && n.length <= 15 ? d : ''; };
const hex = v => /^#[0-9a-f]{6}$/i.test(String(v || '')) ? String(v).toLowerCase() : '';
const uid = () => Math.random().toString(36).slice(2, 8);
const t = (v, n) => String(v == null ? '' : v).replace(/\s+/g, ' ').trim().slice(0, n || 80);
module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ err: 'Method not allowed.' });
  if (!L.hasDb()) return res.status(503).json({ err: 'Database is not connected yet.' });
  try {
    const b = await L.body(req), s = L.norm(await L.getState() || {}), it = b.item || {}, now = Date.now();
    const fail = m => res.status(400).json({ err: m });
    if (b.kind === 'driver') {
      const name = t(it.name, 60), did = t(it.did, 4), w = wa(it.wa), k = name.split(' ').length;
      if (!name || k < 2 || k > 3) return fail('Name must be 2 to 3 words.');
      if (!/^\d{4}$/.test(did)) return fail('DID must be exactly 4 digits.');
      if (s.dr.some(x => x.did == did)) return fail('This DID is already taken.');
      if (!w) return fail('Enter a valid WhatsApp number.');
      s.dr.push({ did, name, wa: w, at: now }); L.linkPd(s); await L.putState(s); return res.status(200).json({ ok: true });
    }
    if (b.kind === 'team') {
      const e = s.ev.find(x => x.id == it.ev); if (!e) return fail('Event not found.');
      if (e.reg === false) return fail('Registration is closed.');
      const teams = s.tm.filter(x => x.ev == e.id);
      if (teams.length >= e.quota) return fail('Team slots are full.');
      const name = t(it.name), tp = t(it.tp), ow = t(it.ow), w1 = wa(it.tpw), w2 = wa(it.oww), c1 = hex(it.col), c2 = hex(it.col2);
      if (!name || !tp || !ow) return fail('Fill in team name, Team Principal and Team Owner.');
      if (!w1 || !w2) return fail('Enter valid WhatsApp numbers for Team Principal and Team Owner.');
      if (!c1 || !c2) return fail('Enter valid hex colors.');
      const d = Array.isArray(it.d) ? it.d.slice(0, 4).map(x => String(x || '')) : [];
      while (d.length < 4) d.push('');
      const pdIn = Array.isArray(it.pd) ? it.pd.slice(0, 4) : [], pd = [null, null, null, null], cnum = {};
      for (let i = 0; i < 4; i++) {
        const p = pdIn[i]; if (!p || d[i]) continue; const n = t(p.n, 60); if (!n) continue;
        const k = n.split(' ').length, w = wa(p.wa); if (k < 2 || k > 3) return fail('Driver name must be 2 to 3 words.');
        if (!w) return fail('Enter a valid WhatsApp number for every driver that is not licensed yet.');
        const m = s.dr.filter(x => L.nm(x.name) == L.nm(n)); if (m.length > 1) return fail('Several licensed drivers share the name ' + n + '. Pick the driver from the list.');
        if (m.length == 1) { d[i] = m[0].did; cnum[m[0].did] = String(p.num || '').trim(); } else pd[i] = { n, wa: w, num: String(p.num || '').trim() };
      }
      if (!(d[0] || pd[0]) || !(d[1] || pd[1])) return fail('Driver 1 and Driver 2 are required.');
      const f = d.filter(Boolean);
      if (new Set(f).size < f.length) return fail('A driver cannot be selected twice.');
      const pn = pd.filter(Boolean).map(p => L.nm(p.n)); if (new Set(pn).size < pn.length) return fail('A driver cannot be entered twice.');
      if (f.some(x => !s.dr.some(y => y.did == x))) return fail('Unknown driver selected.');
      if (f.some(x => teams.some(y => y.d.slice(0, 2).includes(x)))) return fail('Some drivers are already a regular driver in another team.');
      if (pd.slice(0, 2).some(p => p && teams.some(y => (y.pd || []).slice(0, 2).some(q => q && L.nm(q.n) == L.nm(p.n))))) return fail('A driver you entered is already a regular driver in another team.');
      if (teams.some(y => y.name.toLowerCase() == name.toLowerCase())) return fail('Team name is already taken.');
      const usedBy = dd => new Set(teams.flatMap(y => [...Object.entries(y.num || {}).filter(([k]) => k != dd).map(([k, v]) => v), ...(y.pd || []).filter(Boolean).map(p => p.num).filter(Boolean)])), mine = new Set(), num = {};
      for (const x of f) {
        const v = String((it.num && it.num[x]) || cnum[x] || '').trim();
        if (!/^\d{1,2}$/.test(v) || +v < 1) return fail('Race number (1-99) is required for every driver.');
        if (usedBy(x).has(String(+v)) || mine.has(String(+v))) return fail('Race number ' + (+v) + ' is already taken.');
        mine.add(String(+v)); num[x] = String(+v);
      }
      for (const p of pd) {
        if (!p) continue; const v = p.num;
        if (!/^\d{1,2}$/.test(v) || +v < 1) return fail('Race number (1-99) is required for every driver.');
        if (usedBy('').has(String(+v)) || mine.has(String(+v))) return fail('Race number ' + (+v) + ' is already taken.');
        mine.add(String(+v)); p.num = String(+v);
      }
      s.tm.push({ id: uid(), ev: e.id, name, soc: e.soc ? t(it.soc, 80) : '', tp, tpw: w1, ow, oww: w2, col: c1, col2: c2, d, num, ...(pd.some(Boolean) ? { pd } : {}), at: now });
      await L.putState(s); return res.status(200).json({ ok: true });
    }
    return fail('Bad request.');
  } catch (e) { return res.status(500).json({ err: 'Could not save. Try again.' }); }
};
