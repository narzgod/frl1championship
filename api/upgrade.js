const L = require('./_lib');
const t = (v, n) => String(v == null ? '' : v).replace(/\s+/g, ' ').trim().slice(0, n || 80);
const uid = () => Math.random().toString(36).slice(2, 8) + Math.random().toString(36).slice(2, 6);
/* upgrade price: base per level, multiplied by how much the component matters (Piston > ECU > Transmission > Camshaft, Turbo > Intercooler > Air Filter > Pipe) */
const BASE = [250, 300, 450, 700, 900], MUL = [1.5, 1.25, 1, 0.8];
const lvIdx = lv => Math.min(Math.max(lv, 1), 5) - 1;
const costOf = (e, k, i, lv) => { const row = (((e.up || {}).cc || {})[k] || [])[i], v = row && +row[lvIdx(lv)]; return row && row.length && v >= 0 ? v : Math.round(BASE[lvIdx(lv)] * MUL[i] / 10) * 10; };
const maxOf = (set, k, i) => { const m = +((((set || {})[k === 'e' ? 'd' : 'td'] || [])[i]) || {}).m; return m >= 1 && m <= 8 ? m : 5; };
/* split of the report budget between the two main drivers: 50:50, or 70:30 with a focus driver */
const shares = (dids, m, f, total) => { const o = {}; if (dids.length < 2) { dids.forEach(d => { o[d] = total; }); return o; } if (m === '70' && dids.includes(f)) { const a = Math.round(total * 0.7); dids.forEach(d => { o[d] = d === f ? a : total - a; }); } else { const h = Math.floor(total / 2); o[dids[0]] = total - h; o[dids[1]] = h; } return o; };
const entry = (k, cp, extra) => Object.assign({ id: uid(), at: Date.now(), k, cp }, extra || {});
const THROTTLE = 8, WINDOW = 600;
module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ err: 'Method not allowed.' });
  if (!L.hasDb()) return res.status(503).json({ err: 'Database is not connected yet.' });
  try {
    const b = await L.body(req), s = L.norm(await L.getState() || {});
    const fail = (m, c) => res.status(c || 400).json({ err: m });
    const e = s.ev.find(x => x.id == b.ev);
    if (!e || !e.up || !e.up.on) return fail('Upgrades are not open for this event.');
    const tm = s.tm.find(x => x.id == b.team && x.ev == e.id);
    if (!tm) return fail('Team not found.');
    /* team password (set by the admin) - protects against other teams sabotaging this team */
    const fk = 'frl:pwf:' + tm.id;
    if (!tm.up || !tm.up.pw) return fail('The admin has not set a password for your team yet.');
    if ((+(await L.cmd(['GET', fk])) || 0) >= THROTTLE) return fail('Too many wrong passwords. Try again in 10 minutes.', 429);
    if (!L.eq(String(b.pw || ''), String(tm.up.pw))) { await L.cmd(['INCR', fk]); await L.cmd(['EXPIRE', fk, WINDOW]); return fail('Wrong team password.', 401); }
    await L.cmd(['DEL', fk]);
    tm.up.d = tm.up.d || {}; tm.up.r = tm.up.r || []; tm.up.led = tm.up.led || [];
    const sm = L.sum(tm);
    if (b.kind === 'info') {
      return res.status(200).json({ cfg: e.up, tu: { et: tm.up.et || '', d: tm.up.d, sp: tm.up.sp || [], lk: !!tm.up.lk, m: tm.up.m || '', f: tm.up.f || '' }, sum: sm, reps: tm.up.r.slice(-20).reverse().map(r => ({ id: r.id, at: r.at, cost: r.cost, m: r.m, f: r.f, bud: r.bud, sh: r.sh, dc: r.dc, items: r.items, note: r.note, st: r.st, why: r.why })), led: tm.up.led.slice(-30).reverse().map(x => ({ at: x.at, k: x.k, cp: x.cp, q: x.q, note: x.note })) });
    }
    if (b.kind === 'buy') {
      let cp = 0, ent = null;
      if (b.what === 'tire') { const q = Math.floor(+b.qty); if (!(q >= 1 && q <= 20)) return fail('Choose 1 to 20 tyres.'); cp = q * (+e.up.tireCp || 2000); ent = entry('tire', -cp, { q }); }
      else if (b.what === 'slot') { const q = 1; cp = q * (+e.up.slotCp || 1000); ent = entry('slot', -cp, { q }); }
      else if (b.what === 'pack') {
        const pk = (e.up.pk || []).find(x => x.id == b.id);
        if (!pk) return fail('Package not found.');
        if (sm.pk) return fail('Your team already bought a package. Only one package per team.');
        cp = +pk.cp || 0; ent = entry('pack', -cp, { ref: pk.id, hp: pk.hp });
      } else return fail('Bad request.');
      if (sm.cp < cp) return fail('Not enough team CP. Needs ' + cp + ' CP, team has ' + sm.cp + ' CP.');
      tm.up.led.push(ent); await L.putState(s);
      return res.status(200).json({ ok: true, sum: L.sum(tm) });
    }
    if (b.kind === 'submit') {
      const dids = tm.d.slice(0, 2).filter(Boolean);
      const set = (e.up.en || []).find(x => x.id == tm.up.et);
      if (!set || !dids.length || !dids.every(d => tm.up.d[d])) return fail('Upgrades are not set up for your team yet. Ask the admin.');
      if (sm.pk) return fail('Your team bought an HP package, so car upgrades are closed.');
      if (tm.up.r.some(r => r.st === 'p')) return fail('You already have a report waiting for the admin. Please wait for the decision.');
      const items = {}, dc = {}; let n = 0, cost = 0;
      const name = d => (s.dr.find(x => x.did == d) || {}).name || d;
      for (const d of dids) {
        const ud = tm.up.d[d], it = (b.items && b.items[d]) || {}, o = { e: [0, 0, 0, 0], t: [0, 0, 0, 0] };
        for (const k of ['e', 't']) for (let i = 0; i < 4; i++) {
          if (!+((it[k] || [])[i])) continue;
          const lv = +((ud[k] || [])[i]) || 0;
          if (lv >= maxOf(set, k, i)) return fail('A selected component of ' + name(d) + ' is already at its maximum level.');
          const c1 = costOf(e, k, i, lv + 1); o[k][i] = 1; n++; cost += c1; dc[d] = (dc[d] || 0) + c1;
        }
        items[d] = o;
      }
      if (!n) return fail('Select at least one component to upgrade.');
      if (sm.cp < cost) return fail('Not enough team CP. This report costs ' + cost + ' CP, team has ' + sm.cp + ' CP.');
      /* split: the admin can lock the team's choice; otherwise the team chooses in each report */
      let m = b.m === '70' ? '70' : '50', f = t(b.f, 8);
      if (tm.up.lk && tm.up.m) { m = tm.up.m === '70' ? '70' : '50'; f = tm.up.f || ''; }
      if (m === '70' && !dids.includes(f)) return fail('Choose which driver gets the 70% focus.');
      const bud = Math.floor(+b.budget);
      if (!(bud >= cost)) return fail('Your CP budget must cover the total cost (' + cost + ' CP).');
      const sh = shares(dids, m, f, bud);
      for (const d of dids) if ((dc[d] || 0) > sh[d]) return fail(name(d) + ' needs ' + (dc[d] || 0) + ' CP but gets only ' + sh[d] + ' CP from this split. Raise the budget, change the split or move upgrades to the other driver.');
      tm.up.r.push({ id: uid(), at: Date.now(), cost, m, f: m === '70' ? f : '', bud, sh, dc, items, note: t(b.note, 300), st: 'p' });
      await L.putState(s);
      return res.status(200).json({ ok: true, cost });
    }
    return fail('Bad request.');
  } catch (err) { return res.status(500).json({ err: 'Could not save. Try again.' }); }
};
