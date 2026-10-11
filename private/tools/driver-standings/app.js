/* Driver Standings Maker - tanpa build, langsung jalan di Netlify/Vercel */
const W = 1080, H = 1350;
const cv = document.getElementById('cv'), g = cv.getContext('2d');
const uid = () => Math.random().toString(36).slice(2, 8);
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const BUILTIN = ['MotoGP Display Bold', 'MotoGP Text Bold', 'MotoGP Text Regular', 'Arial Black', 'Impact', 'Arial', 'Georgia', 'Courier New', 'Trebuchet MS'];
const LAYER_TYPES = {
  dots: 'Titik halftone (sudut)', stripes: 'Garis miring', checker: 'Papan catur (finish)', kerb: 'Kerb merah-putih', carbon: 'Karbon',
  speed: 'Garis kecepatan', slash: 'Panel miring', ring: 'Cincin', grid: 'Kisi', chevron: 'Panah chevron', glow: 'Cahaya'
};

function contrast(hex) { const n = parseInt(hex.slice(1), 16), r = n >> 16, gc = (n >> 8) & 255, b = n & 255; return (r * 299 + gc * 587 + b * 114) / 1000 > 150 ? '#111111' : '#ffffff'; }
function shade(hex, f) { const n = parseInt(hex.slice(1), 16), c = k => Math.max(0, Math.min(255, Math.round(((n >> k) & 255) * (1 + f)))); return `rgb(${c(16)},${c(8)},${c(0)})`; }
function defaults() {
  const t = (name, c1, c2, c3) => ({ id: uid(), name, logo: null, logoScale: 100, c1, c2, c3 });
  const teams = [t('Alight', '#d90000', '#7a0000', '#ffffff'), t('Bull Storm', '#1b2a6b', '#0c1440', '#f5b700'),
    t('ZVA', '#2d4bd6', '#16206b', '#ffffff'), t('Nightrunners', '#1c1c1f', '#000000', '#ffffff'), t('Blue Star', '#55b6e8', '#2a7fb0', '#0b1b2b')];
  const d = (name, ti) => ({ id: uid(), name, photo: null, teamId: teams[ti].id });
  const drivers = [d('Fajar Prayata', 0), d('A. Pramana', 0), d('S. Alexandro', 1), d('V. Govan', 2), d('K. Zrill', 3),
    d('S. Rebon', 1), d('M. Verrel', 3), d('A. Ghani', 4), d('S. Reglia', 2), d('I. Reii', 3)];
  const pts = [37, 34, 27, 25, 22, 18, 18, 15, 0, 0], mv = [0, 0, 7, -1, 0, -2, -1, 9, -2, -2];
  return {
    ver: 4, title: 'SEASON 2 DRIVER\nSTANDINGS', lead: 'Points After The', event: 'DUBAI GP', nextLabel: 'NEXT STOP:', nextCountry: 'ITALY', flagEvent: { code: 'ae', img: null }, flagNext: { code: 'it', img: null }, triScale: 100, goldFirst: true,
    fontMap: { title: 'MotoGP Display Bold', lead: 'MotoGP Text Bold', event: 'MotoGP Text Bold', name: 'MotoGP Text Bold', points: 'MotoGP Text Bold', pos: 'MotoGP Text Bold', move: 'MotoGP Text Bold', footer: 'MotoGP Text Bold' },
    titleCfg: { x: 34, y: 168, size: 72, gap: 72, sx: 100, sy: 100, ls: 0 }, logos: [], nameScale: 100, previewSize: 1,
    bg: '#0b0b0e', accent: '#e10600',
    teams, drivers, rowCount: 10,
    rows: drivers.map((x, i) => ({ driverId: x.id, points: pts[i], move: mv[i] })),
    layers: [
      { id: uid(), type: 'glow', color: '#e10600', op: .30, x: 100, y: 0, size: 650, rot: 0 },
      { id: uid(), type: 'dots', color: '#e10600', op: .6, x: 100, y: 0, size: 560, rot: 90 },
      { id: uid(), type: 'speed', color: '#e10600', op: .22, x: 0, y: 60, size: 700, rot: -8 },
      { id: uid(), type: 'checker', color: '#ffffff', op: .06, x: 78, y: 96, size: 360, rot: 0 }
    ],
    fonts: []
  };
}

let S = defaults();
let tab = 'poster';
const imgs = new Map();
function img(src) {
  if (!src) return null;
  let i = imgs.get(src);
  if (!i) { i = new Image(); i.onload = draw; i.src = src; imgs.set(src, i); }
  return i.complete && i.naturalWidth ? i : null;
}

/* ---------- penyimpanan (IndexedDB) ---------- */
const DB = 'dsm1';
const idb = () => new Promise((ok, no) => { const r = indexedDB.open(DB, 1); r.onupgradeneeded = () => r.result.createObjectStore('k'); r.onsuccess = () => ok(r.result); r.onerror = no; });
function impMM() {
  let h; try { h = JSON.parse(localStorage.getItem('f1c-hub')); } catch (e) { }
  if (!h || !h.drivers || !h.drivers.length) { alert('No fRacing Legends data yet. Fill it in first from the main menu.'); return false; }
  const L = v => String(v).trim().toLowerCase(), dk = c => { const n = parseInt(c.slice(1), 16), f = k => Math.round(((n >> k) & 255) * .55).toString(16).padStart(2, '0'); return '#' + f(16) + f(8) + f(0); };
  const teams = h.teams.map(t => { const o = S.teams.find(x => L(x.name) == L(t.name)); return Object.assign(o ? { ...o } : { id: uid(), name: t.name, logo: null, logoScale: 100 }, { c1: t.col, c2: t.col2 || dk(t.col), c3: contrast(t.col) }); });
  const drivers = h.drivers.map(x => { const o = S.drivers.find(v => L(v.name) == L(x.name)), t = teams.find(v => L(v.name) == L(x.team)) || teams[0]; return { id: o ? o.id : uid(), name: x.name, photo: o ? o.photo : null, teamId: t.id }; });
  S.teams = teams; S.drivers = drivers; S.rows = h.drivers.map((x, i) => ({ driverId: drivers[i].id, points: x.pts, move: 0 }));
  S.rowCount = Math.min(+S.rowCount || 10, S.rows.length); return true;
}
let saveT;
async function flush() { try { const d = await idb(); d.transaction('k', 'readwrite').objectStore('k').put(S, 'state'); } catch (e) { } }
function save() { clearTimeout(saveT); saveT = setTimeout(flush, 400); }
document.addEventListener('visibilitychange', () => { if (document.hidden) { clearTimeout(saveT); flush(); } });
addEventListener('pagehide', () => { clearTimeout(saveT); flush(); });
function normState(v) {
  const df = defaults(), st = Object.assign(df, v);
  if ((v.ver || 0) < 2) { st.layers = defaults().layers; st.bg = df.bg; st.teams.forEach(t => { const m = df.teams.find(x => x.name === t.name); if (m) { t.c1 = m.c1; t.c2 = m.c2; t.c3 = m.c3; } else t.c3 = contrast(t.c1); }); }
  if ((v.ver || 0) < 3 && v.next) { const m = String(v.next).split(':'); st.nextLabel = m.length > 1 ? m[0].trim() + ':' : 'NEXT STOP:'; st.nextCountry = (m.length > 1 ? m.slice(1).join(':') : m[0]).trim(); }
  if ((v.ver || 0) < 4) {
    const ft = (v.fontTitle && v.fontTitle !== 'Arial Black') ? v.fontTitle : df.fontMap.title, fb = (v.fontBody && v.fontBody !== 'Arial Black') ? v.fontBody : df.fontMap.lead;
    st.fontMap = { title: ft, lead: fb, event: fb, name: fb, points: fb, pos: fb, move: fb, footer: fb };
    st.logos = [];
    if (v.logo) st.logos.push({ id: uid(), img: v.logo, x: 15, y: 5, size: 260 });
    if (v.logo2) st.logos.push({ id: uid(), img: v.logo2, x: 88, y: 6, size: 200 });
    delete st.logo; delete st.logo2; delete st.fontTitle; delete st.fontBody;
  }
  st.fontMap = Object.assign({}, df.fontMap, st.fontMap);
  st.titleCfg = Object.assign({}, df.titleCfg, st.titleCfg);
  st.teams.forEach(t => { if (t.logoScale == null) t.logoScale = 100; });
  st.ver = 4; return st;
}
async function load() {
  try { const d = await idb(); const v = await new Promise(ok => { const r = d.transaction('k').objectStore('k').get('state'); r.onsuccess = () => ok(r.result); r.onerror = () => ok(null); }); if (v) S = normState(v); } catch (e) { }
  for (const f of S.fonts) await regFont(f);
}
async function regFont(f) { try { const ff = new FontFace(f.name, f.data); await ff.load(); document.fonts.add(ff); } catch (e) { } }
const allFonts = () => [...BUILTIN, ...S.fonts.map(f => f.name)];

/* ---------- menggambar poster ---------- */
function rr(x, y, w, h, r) { g.beginPath(); g.roundRect(x, y, w, h, r); }
function fit(txt, maxW, size, font) { g.font = `${size}px "${font}"`; while (g.measureText(txt).width > maxW && size > 12) { size -= 1; g.font = `${size}px "${font}"`; } return size; }
function cover(im, x, y, w, h) { const r = Math.max(w / im.naturalWidth, h / im.naturalHeight), iw = im.naturalWidth * r, ih = im.naturalHeight * r; g.drawImage(im, x + (w - iw) / 2, y + (h - ih) / 2, iw, ih); }
function contain(im, x, y, w, h, ax = .5) { const r = Math.min(w / im.naturalWidth, h / im.naturalHeight), iw = im.naturalWidth * r, ih = im.naturalHeight * r; g.drawImage(im, x + (w - iw) * ax, y + (h - ih) / 2, iw, ih); }

const FLAGS = {
  id: { n: 'Indonesia', ar: 1.5, s: ['h', '#e70011', '#ffffff'] }, it: { n: 'Italia', ar: 1.5, s: ['v', '#009246', '#ffffff', '#ce2b37'] },
  ae: { n: 'Uni Emirat Arab', ar: 2, s: ['ae'] }, nl: { n: 'Belanda', ar: 1.5, s: ['h', '#ae1c28', '#ffffff', '#21468b'] },
  fr: { n: 'Prancis', ar: 1.5, s: ['v', '#0055a4', '#ffffff', '#ef4135'] }, de: { n: 'Jerman', ar: 1.667, s: ['h', '#000000', '#dd0000', '#ffce00'] },
  be: { n: 'Belgia', ar: 1.15, s: ['v', '#000000', '#fae042', '#ed2939'] }, es: { n: 'Spanyol', ar: 1.5, wt: [1, 2, 1], s: ['h', '#aa151b', '#f1bf00', '#aa151b'] },
  at: { n: 'Austria', ar: 1.5, s: ['h', '#ed2939', '#ffffff', '#ed2939'] }, hu: { n: 'Hungaria', ar: 2, s: ['h', '#ce2939', '#ffffff', '#477050'] },
  mc: { n: 'Monako', ar: 1.25, s: ['h', '#ce1126', '#ffffff'] }, pl: { n: 'Polandia', ar: 1.6, s: ['h', '#ffffff', '#dc143c'] },
  jp: { n: 'Jepang', ar: 1.5, s: ['jp'] }, ie: { n: 'Irlandia', ar: 2, s: ['v', '#169b62', '#ffffff', '#ff883e'] }
};
function FNT(k) { return (S.fontMap && S.fontMap[k]) || 'Arial'; }
function flagW(fl, h) {
  if (!fl || fl.code === 'none') return 0;
  if (fl.code === 'custom') { const im = img(fl.img); return im ? Math.round(h * Math.min(2.2, Math.max(1, im.naturalWidth / im.naturalHeight))) : 0; }
  return FLAGS[fl.code] ? Math.round(h * FLAGS[fl.code].ar) : 0;
}
function flagPaint(f, x, y, w, h) {
  const [k, ...c] = f.s;
  if (k === 'h' || k === 'v') { const wt = f.wt || c.map(() => 1), tot = wt.reduce((a, b) => a + b, 0); let o = 0; c.forEach((col, i) => { const part = wt[i] / tot; g.fillStyle = col; if (k === 'h') g.fillRect(x, y + o * h, w, part * h + 1); else g.fillRect(x + o * w, y, part * w + 1, h); o += part; }); }
  else if (k === 'jp') { g.fillStyle = '#ffffff'; g.fillRect(x, y, w, h); g.fillStyle = '#bc002d'; g.beginPath(); g.arc(x + w / 2, y + h / 2, h * .3, 0, 7); g.fill(); }
  else if (k === 'ae') { const hh = h / 3; ['#00732f', '#ffffff', '#000000'].forEach((col, i) => { g.fillStyle = col; g.fillRect(x, y + i * hh, w, hh + 1); }); g.fillStyle = '#ff0000'; g.fillRect(x, y, w * .26, h); }
}
function flagDraw(fl, x, y, w, h) {
  g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip();
  if (fl.code === 'custom') { const im = img(fl.img); if (im) cover(im, x, y, w, h); } else flagPaint(FLAGS[fl.code], x, y, w, h);
  g.restore();
  g.save(); g.strokeStyle = '#ffffff'; g.lineWidth = 2.5; g.strokeRect(x + 1.25, y + 1.25, w - 2.5, h - 2.5); g.restore();
}

function layer(l) {
  const s = l.size; g.save(); g.globalAlpha = l.op; g.fillStyle = g.strokeStyle = l.color;
  g.translate(l.x / 100 * W, l.y / 100 * H); g.rotate(l.rot * Math.PI / 180);
  switch (l.type) {
    case 'stripes': for (let i = -3; i < 4; i++) g.fillRect(i * s * .3, -s, s * .14, s * 2); break;
    case 'checker': { const c = s / 8; for (let a = 0; a < 8; a++) for (let b = 0; b < 4; b++) if ((a + b) % 2 === 0) g.fillRect(a * c - s / 2, b * c - s / 4, c, c); break; }
    case 'kerb': { const n = 14, w = s / n; for (let i = 0; i < n; i++) { g.fillStyle = i % 2 ? l.color : '#ffffff'; g.fillRect(i * w - s / 2, 0, w, s * .05); } break; }
    case 'carbon': { const c = 10; for (let a = 0; a < s / c; a++) for (let b = 0; b < s * .6 / c; b++) { g.globalAlpha = l.op * ((a + b) % 2 ? 1 : .35); g.fillRect(a * c - s / 2, b * c - s * .3, c - 1, c - 1); } break; }
    case 'speed': for (let i = 0; i < 16; i++) { const len = s * (.25 + ((i * 37) % 10) / 14), y = i * 46 - 350; g.fillRect(((i * 91) % 200) - 100, y, len, 3 + (i % 3) * 2); } break;
    case 'slash': g.beginPath(); g.moveTo(-s * .15, -s * .7); g.lineTo(s * .25, -s * .7); g.lineTo(s * .15, s * .7); g.lineTo(-s * .25, s * .7); g.closePath(); g.fill(); break;
    case 'ring': g.lineWidth = s * .07; g.beginPath(); g.arc(0, 0, s / 2, 0, 7); g.stroke(); g.lineWidth = s * .02; g.beginPath(); g.arc(0, 0, s * .36, 0, 7); g.stroke(); break;
    case 'grid': { g.lineWidth = 2; const c = s / 6; for (let i = -3; i <= 3; i++) { g.beginPath(); g.moveTo(i * c, -s / 2); g.lineTo(i * c, s / 2); g.moveTo(-s / 2, i * c); g.lineTo(s / 2, i * c); g.stroke(); } break; }
    case 'chevron': for (let i = 0; i < 4; i++) { const o = i * s * .22; g.beginPath(); g.moveTo(o, -s * .3); g.lineTo(o + s * .18, 0); g.lineTo(o, s * .3); g.lineTo(o + s * .08, s * .3); g.lineTo(o + s * .26, 0); g.lineTo(o + s * .08, -s * .3); g.closePath(); g.fill(); } break;
    case 'dots': { const N = 20, sp = s / N; for (let a = 0; a < N; a++) for (let b = 0; b < N; b++) { const k = 1 - (a + b) / (2 * N - 2), r = k * sp * .42; if (r > .6) { g.beginPath(); g.arc(a * sp, b * sp, r, 0, 7); g.fill(); } } break; }
    case 'glow': { const gr = g.createRadialGradient(0, 0, 0, 0, 0, s); gr.addColorStop(0, l.color); gr.addColorStop(1, 'transparent'); g.fillStyle = gr; g.fillRect(-s, -s, s * 2, s * 2); break; }
  }
  g.restore();
}

function draw() {
  g.clearRect(0, 0, W, H); g.fillStyle = S.bg; g.fillRect(0, 0, W, H);
  S.layers.forEach(layer);
  const vg = g.createLinearGradient(0, 0, 0, H); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.5)'); g.fillStyle = vg; g.fillRect(0, 0, W, H);
  g.textBaseline = 'alphabetic'; g.textAlign = 'left';

  // kepala poster
  if (!S.logos.length) { g.fillStyle = '#fff'; g.font = `italic 92px "${FNT('title')}"`; g.fillText('F1C', 34, 100); }
  S.logos.forEach(l => { const im = img(l.img); if (!im) return; const w = l.size, hh = w * im.naturalHeight / im.naturalWidth; g.drawImage(im, l.x / 100 * W - w / 2, l.y / 100 * H - hh / 2, w, hh); });
  { const tc = S.titleCfg, lines = S.title.split('\n').slice(0, 3).map(x => x.toUpperCase());
    g.save(); g.fillStyle = '#fff'; g.textAlign = 'left'; g.textBaseline = 'alphabetic';
    if ('letterSpacing' in g) g.letterSpacing = (tc.ls || 0) + 'px';
    g.font = `${tc.size}px "${FNT('title')}"`;
    lines.forEach((ln, i) => { g.save(); g.translate(tc.x, tc.y + i * tc.gap); g.scale(tc.sx / 100, tc.sy / 100); g.fillText(ln, 0, 0); g.restore(); });
    g.restore(); }
  g.textAlign = 'right';
  g.fillStyle = '#d8d8dc'; fit(S.lead.toUpperCase(), 330, 30, FNT('lead')); g.fillText(S.lead.toUpperCase(), 1046, 196);
  { const ev = S.event.toUpperCase(), sz = fit(ev, flagW(S.flagEvent, 32) ? 270 : 330, 46, FNT('event')), tw = g.measureText(ev).width, fh = sz * .78, fw = flagW(S.flagEvent, fh);
    g.fillStyle = '#fff'; g.textAlign = 'right'; g.fillText(ev, 1046, 241);
    if (fw) flagDraw(S.flagEvent, 1046 - tw - 16 - fw, 241 - sz * .35 - fh / 2, fw, fh); }

  // baris peringkat
  const RX = 120, TE = 708, MX = 712, MW = 152, PX = 868, PE = 1046;
  const n = Math.min(S.rowCount, S.rows.length), top = 262, pitch = Math.min(112, 1000 / n), h = pitch - 6;
  for (let i = 0; i < n; i++) {
    const r = S.rows[i], d = S.drivers.find(x => x.id === r.driverId);
    const t = (d && S.teams.find(x => x.id === d.teamId)) || { c1: '#333333', c2: '#222222', c3: '#ffffff', name: '' };
    const y = top + i * pitch, cy = y + h / 2, gold = S.goldFirst && i === 0;
    g.textBaseline = 'middle';
    // nomor posisi
    g.fillStyle = '#fff'; g.textAlign = 'center'; g.font = `${h * .5}px "${FNT('pos')}"`; g.fillText(String(i + 1), 77, cy + 2);
    // blok tim: logo + foto + nama
    g.fillStyle = t.c1; rr(RX, y, TE - RX, h, [14, 0, 0, 14]); g.fill();
    const logoW = h * 1.1, photoX = RX + logoW;
    const lgd = g.createLinearGradient(RX, 0, RX + logoW, 0); lgd.addColorStop(0, t.c2); lgd.addColorStop(1, t.c1);
    g.fillStyle = lgd; rr(RX, y, logoW + 1, h, [14, 0, 0, 14]); g.fill();
    const ph = d && img(d.photo);
    if (ph) { g.save(); g.beginPath(); g.rect(photoX, y, h, h); g.clip(); cover(ph, photoX, y, h, h); g.restore(); }
    const tl = img(t.logo);
    if (tl) { const sc = (t.logoScale || 100) / 100, bw = (logoW - 24) * sc, bh = (h - 24) * sc; g.save(); rr(RX, y, logoW, h, [14, 0, 0, 14]); g.clip(); contain(tl, RX + logoW / 2 - bw / 2, cy - bh / 2, bw, bh); g.restore(); }
    else { g.fillStyle = t.c3; g.textAlign = 'center'; g.font = `${h * .3}px "${FNT('name')}"`; g.fillText((t.name || '').slice(0, 3).toUpperCase(), RX + logoW / 2, cy + 2); }
    const nx = photoX + h + 22, nm = (d ? d.name : '-').toUpperCase();
    g.textAlign = 'left'; fit(nm, TE - 20 - nx, h * .5 * (S.nameScale || 100) / 100, FNT('name')); g.fillStyle = gold ? '#e6c76e' : t.c3; g.fillText(nm, nx, cy + 2);
    // kolom naik / turun
    g.fillStyle = '#14151c'; g.fillRect(MX, y, MW, h);
    const mcx = MX + MW / 2;
    if (r.move) {
      const up = r.move > 0, tri = h * .27 * (S.triScale || 100) / 100, th = tri * .86, gap = Math.max(5, tri * .25), label = String(Math.abs(r.move));
      g.font = `${h * .5}px "${FNT('move')}"`; const gw = tri + gap + g.measureText(label).width, sx = mcx - gw / 2;
      g.fillStyle = up ? '#1fc13a' : '#e10600'; g.beginPath();
      if (up) { g.moveTo(sx, cy + th / 2); g.lineTo(sx + tri, cy + th / 2); g.lineTo(sx + tri / 2, cy - th / 2); }
      else { g.moveTo(sx, cy - th / 2); g.lineTo(sx + tri, cy - th / 2); g.lineTo(sx + tri / 2, cy + th / 2); }
      g.closePath(); g.fill();
      g.fillStyle = '#fff'; g.textAlign = 'left'; g.fillText(label, sx + tri + gap, cy + 2);
    } else { g.fillStyle = '#fff'; g.fillRect(mcx - 14, cy - 4, 28, 8); }
    // kolom poin
    const pg2 = g.createLinearGradient(0, y, 0, y + h); pg2.addColorStop(0, S.accent); pg2.addColorStop(1, shade(S.accent, -.25));
    g.fillStyle = pg2; rr(PX, y, PE - PX, h, [0, 14, 14, 0]); g.fill();
    const pt = String(r.points).padStart(2, '0'); g.textAlign = 'center'; fit(pt, PE - PX - 24, h * .62, FNT('points'));
    g.fillStyle = gold ? '#f3d98b' : '#fff'; g.fillText(pt, (PX + PE) / 2, cy + 2);
  }
  { g.textBaseline = 'alphabetic'; g.textAlign = 'left'; const lb = (S.nextLabel || '').toUpperCase(), ct = (S.nextCountry || '').toUpperCase(), base = H - 38; let fs = 40, wl = 0, wc = 0, fw = 0;
    for (; fs > 16; fs--) { g.font = `${fs}px "${FNT('footer')}"`; wl = g.measureText(lb).width; wc = g.measureText(ct).width; fw = flagW(S.flagNext, fs * .78); if (wl + wc + (fw ? fw + 28 : 14) <= 1012) break; }
    g.fillStyle = '#fff'; g.fillText(lb, 34, base); let nx2 = 34 + wl + 14;
    if (fw) { flagDraw(S.flagNext, nx2, base - fs * .35 - fs * .39, fw, fs * .78); nx2 += fw + 14; }
    g.fillText(ct, nx2, base); }
}

/* ---------- pengaturan data ---------- */
function setPath(p, v) { const k = p.split('.'); let o = S; while (k.length > 1) o = o[k.shift()]; o[k[0]] = v; }
function resize(file, max = 400) {
  return new Promise(ok => { const fr = new FileReader(); fr.onload = () => { const im = new Image(); im.onload = () => { const r = Math.min(1, max / Math.max(im.width, im.height)), c = document.createElement('canvas'); c.width = im.width * r; c.height = im.height * r; c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); ok(c.toDataURL('image/png')); }; im.src = fr.result; }; fr.readAsDataURL(file); });
}
const fontOpts = cur => allFonts().map(f => `<option ${f === cur ? 'selected' : ''}>${esc(f)}</option>`).join('');
const teamOpts = cur => S.teams.map(t => `<option value="${t.id}" ${t.id === cur ? 'selected' : ''}>${esc(t.name)}</option>`).join('');
const drvOpts = cur => S.drivers.map(t => `<option value="${t.id}" ${t.id === cur ? 'selected' : ''}>${esc(t.name)}</option>`).join('');
const thumb = src => src ? `<img class="thumb" src="${src}">` : `<div class="thumb"></div>`;
const upl = (p, label) => `<label>${label}</label><input type="file" accept="image/*" data-img="${p}">`;
const txt = (p, label, v, ta) => `<label>${label}</label>${ta ? `<textarea rows="2" data-k="${p}">${esc(v)}</textarea>` : `<input type="text" data-k="${p}" value="${esc(v)}">`}`;
const num = (p, label, v, mn, mx, step = 1) => `<label>${label}</label><input type="number" data-k="${p}" data-n="1" value="${v}" ${mn !== undefined ? `min="${mn}"` : ''} ${mx !== undefined ? `max="${mx}"` : ''} step="${step}">`;
const col = (p, v) => `<input type="color" data-k="${p}" value="${v}">`;

const flagSel = (p, label, fl) => `<label>${label}</label><select data-k="${p}.code" data-rerender="1"><option value="none" ${fl.code === 'none' ? 'selected' : ''}>Tanpa bendera</option>${Object.entries(FLAGS).map(([k, v]) => `<option value="${k}" ${fl.code === k ? 'selected' : ''}>${v.n}</option>`).join('')}<option value="custom" ${fl.code === 'custom' ? 'selected' : ''}>Bendera kustom (unggah gambar)</option></select>${fl.code === 'custom' ? upl(p + '.img', 'Unggah gambar bendera') : ''}`;
const rng = (p, label, v, min, max, step = 1) => `<label>${label}: <span class="val">${v}</span></label><input type="range" min="${min}" max="${max}" step="${step}" data-k="${p}" data-n="1" value="${v}">`;
const fontPick = (k, label) => `<label>${label}</label><select data-k="fontMap.${k}">${fontOpts(S.fontMap[k])}</select>`;
const TABS = { poster: 'Poster', text: 'Teks', rows: 'Peringkat', bg: 'Latar', logo: 'Logo', drivers: 'Driver', teams: 'Tim', fonts: 'Font' };
function panelHTML() {
  if (tab === 'poster') return `<div class="card"><h3>Teks poster</h3>${txt('title', 'Judul (Enter = baris baru)', S.title, 1)}${txt('lead', 'Teks kecil kanan atas', S.lead)}${txt('event', 'Nama negara / GP (di bawah teks kecil)', S.event)}${txt('nextLabel', 'Teks bawah', S.nextLabel)}${txt('nextCountry', 'Negara tujuan berikutnya', S.nextCountry)}<label><input type="checkbox" data-k="goldFirst" ${S.goldFirst ? 'checked' : ''}> Juara 1 berwarna emas</label></div>
  <div class="card"><h3>Bendera</h3>${flagSel('flagEvent', 'Bendera di kiri nama negara / GP (kanan atas)', S.flagEvent)}${flagSel('flagNext', 'Bendera di kiri negara pada teks bawah', S.flagNext)}<p class="hint">Panjang bendera menyesuaikan bentuk gambar, garis tepi putih tipis.</p></div>
  <div class="card"><h3>Warna</h3>
  <div class="row"><div><label>Warna latar</label>${col('bg', S.bg)}</div><div><label>Warna aksen (kolom poin)</label>${col('accent', S.accent)}</div></div></div>
  <div class="card"><h3>Cadangan data</h3><div class="row"><button id="exp">Simpan file data</button><button id="imp">Buka file data</button><button id="impMM">Ambil dari fRacing Legends</button></div><input id="impf" type="file" accept=".json" hidden></div>`;
  if (tab === 'text') { const c = S.titleCfg; return `<div class="card"><h3>Judul poster</h3>${rng('titleCfg.x', 'Posisi kiri–kanan', c.x, -300, 1080)}${rng('titleCfg.y', 'Posisi atas–bawah', c.y, 20, 700)}${rng('titleCfg.size', 'Ukuran huruf', c.size, 20, 180)}${rng('titleCfg.gap', 'Jarak antar baris', c.gap, 10, 260)}${rng('titleCfg.sx', 'Lebar teks (%)', c.sx, 50, 220)}${rng('titleCfg.sy', 'Tinggi teks (%)', c.sy, 50, 220)}${rng('titleCfg.ls', 'Jarak antar huruf', c.ls, -5, 40, 0.5)}<button id="resetTitle" style="margin-top:10px">Kembalikan judul ke awal</button></div>
  <div class="card"><h3>Nama driver</h3>${rng('nameScale', 'Ukuran teks nama (%)', S.nameScale, 50, 140)}<p class="hint">Nama yang terlalu panjang otomatis mengecil sampai muat di dalam kotak tim.</p></div>
  <div class="card"><h3>Font tiap teks</h3>${fontPick('title', 'Judul')}${fontPick('lead', 'Teks kecil kanan atas')}${fontPick('event', 'Nama negara / GP')}${fontPick('name', 'Nama driver')}${fontPick('points', 'Angka poin')}${fontPick('pos', 'Nomor posisi')}${fontPick('move', 'Angka naik / turun')}${fontPick('footer', 'Teks bawah')}<p class="hint">Mau font sendiri? Unggah di tab Font.</p></div>`; }
  if (tab === 'logo') return `<button class="primary" id="addLogo" style="width:100%;margin-bottom:8px" ${S.logos.length >= 3 ? 'disabled' : ''}>+ Tambah logo (${S.logos.length}/3)</button><p class="hint">Maksimal 3 logo. Tiap logo bebas digeser dan diubah ukurannya.</p>` + S.logos.map((l, i) => `<div class="card"><div class="row">${thumb(l.img)}<b>Logo ${i + 1}</b><button class="del fit" data-del="logos.${i}">Hapus</button></div>${upl(`logos.${i}.img`, 'Gambar logo (PNG transparan paling bagus)')}${rng(`logos.${i}.size`, 'Ukuran (lebar)', l.size, 40, 900)}${rng(`logos.${i}.x`, 'Posisi kiri–kanan (%)', l.x, -10, 110, 0.5)}${rng(`logos.${i}.y`, 'Posisi atas–bawah (%)', l.y, -10, 110, 0.5)}</div>`).join('');
  if (tab === 'rows') return `<div class="card"><h3>Jumlah baris</h3><select data-k="rowCount" data-n="1">${[3, 4, 5, 6, 7, 8, 9, 10].map(n => `<option ${n === S.rowCount ? 'selected' : ''}>${n}</option>`).join('')}</select><label>Ukuran segitiga naik / turun</label><input type="range" min="50" max="160" data-k="triScale" data-n="1" value="${S.triScale}"><button id="sort" style="margin-top:8px;width:100%">Urutkan otomatis dari poin terbesar</button></div>` +
    S.rows.map((r, i) => `<div class="card"><h3>P${i + 1}</h3><label>Driver</label><select data-k="rows.${i}.driverId" data-cb="1">${drvOpts(r.driverId)}</select><div class="row"><div>${num(`rows.${i}.points`, 'Poin', r.points, 0)}</div><div>${num(`rows.${i}.move`, 'Naik (+) / turun (−)', r.move)}</div></div></div>`).join('');
  if (tab === 'bg') return `<div class="card"><h3>Tambah grafik latar</h3><div class="row"><select id="ltype">${Object.entries(LAYER_TYPES).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}</select><button class="primary fit" id="addL">Tambah</button></div></div>` +
    S.layers.map((l, i) => `<div class="card"><h3>${LAYER_TYPES[l.type]}</h3><div class="row"><div><label>Warna</label>${col(`layers.${i}.color`, l.color)}</div><button class="del fit" data-del="layers.${i}">Hapus</button></div>
    <label>Kejelasan</label><input type="range" min="0.02" max="1" step="0.01" data-k="layers.${i}.op" data-n="1" value="${l.op}">
    <label>Ukuran</label><input type="range" min="60" max="1400" data-k="layers.${i}.size" data-n="1" value="${l.size}">
    <label>Posisi kiri–kanan</label><input type="range" min="-20" max="120" data-k="layers.${i}.x" data-n="1" value="${l.x}">
    <label>Posisi atas–bawah</label><input type="range" min="-20" max="120" data-k="layers.${i}.y" data-n="1" value="${l.y}">
    <label>Putar</label><input type="range" min="-180" max="180" data-k="layers.${i}.rot" data-n="1" value="${l.rot}"></div>`).join('') || '<p class="hint">Belum ada grafik latar.</p>';
  if (tab === 'drivers') return `<button class="primary" id="addD" style="width:100%;margin-bottom:12px">+ Tambah driver</button>` + `<div data-flb>${fltBox('ds:drivers', 'Cari driver (nama atau tim)...')}` + S.drivers.map((d, i) => `<div class="card" data-fi><div class="row">${thumb(d.photo)}<div>${txt(`drivers.${i}.name`, 'Nama', d.name)}</div></div>${upl(`drivers.${i}.photo`, 'Foto driver (PNG transparan paling bagus)')}<label>Tim</label><select data-k="drivers.${i}.teamId" data-redraw="1" data-cb="1">${teamOpts(d.teamId)}</select><button class="del" data-del="drivers.${i}" style="margin-top:8px">Hapus driver</button></div>`).join('') + '</div>';
  if (tab === 'teams') return `<button class="primary" id="addT" style="width:100%;margin-bottom:12px">+ Tambah tim</button>` + `<div data-flb>${fltBox('ds:teams', 'Cari tim...')}` + S.teams.map((t, i) => `<div class="card" data-fi><div class="row">${thumb(t.logo)}<div>${txt(`teams.${i}.name`, 'Nama tim', t.name)}</div></div>${upl(`teams.${i}.logo`, 'Logo tim')}<label>Ukuran logo (100 = pas, di atas itu terpotong di kotak logo)</label><input type="range" min="20" max="400" data-k="teams.${i}.logoScale" data-n="1" value="${t.logoScale || 100}"><div class="row"><div><label>Warna 1 (latar baris tim)</label>${col(`teams.${i}.c1`, t.c1)}</div><div><label>Warna 2 (gradasi latar logo)</label>${col(`teams.${i}.c2`, t.c2)}</div><div><label>Warna 3 (warna nama driver)</label>${col(`teams.${i}.c3`, t.c3)}</div></div><button class="del" data-del="teams.${i}" style="margin-top:8px">Hapus tim</button></div>`).join('') + '</div>';
  if (tab === 'fonts') return `<div class="card"><h3>Tambah font (.ttf / .otf)</h3><input type="file" accept=".ttf,.otf,.woff,.woff2" id="fontf"><p class="hint">Setelah masuk, font muncul di daftar pilihan pada tab Teks.</p></div>` + S.fonts.map((f, i) => `<div class="card"><div class="row"><b>${esc(f.name)}</b><button class="del fit" data-del="fonts.${i}">Hapus</button></div></div>`).join('');
}

function applyPv() { const i = S.previewSize ?? 1; document.documentElement.style.setProperty('--pv', ['30vh', '42vh', '58vh'][i]); const b = document.getElementById('btnSize'); if (b) b.textContent = 'Pratinjau ' + ['Kecil', 'Sedang', 'Besar'][i]; }
function render() {
  applyPv();
  document.getElementById('tabs').innerHTML = Object.entries(TABS).map(([k, v]) => `<button class="${k === tab ? 'on' : ''}" data-tab="${k}">${v}</button>`).join('');
  document.getElementById('panel').innerHTML = panelHTML();
}

document.addEventListener('click', async e => {
  const b = e.target.closest('button'); if (!b) return;
  if (b.dataset.tab) { tab = b.dataset.tab; render(); return; }
  if (b.dataset.del) {
    const [k, i] = b.dataset.del.split('.'), id = S[k][i].id;
    if (!confirm('Hapus item ini?')) return;
    S[k].splice(i, 1);
    if (k === 'drivers') S.rows.forEach(r => { if (r.driverId === id) r.driverId = S.drivers[0]?.id; });
    if (k === 'teams') S.drivers.forEach(d => { if (d.teamId === id) d.teamId = S.teams[0]?.id; });
    save(); render(); draw(); return;
  }
  if (b.id === 'btnSize') { S.previewSize = ((S.previewSize ?? 1) + 1) % 3; applyPv(); save(); return; }
  if (b.id === 'btnDl') { cv.toBlob(bl => { const a = document.createElement('a'); a.href = URL.createObjectURL(bl); a.download = 'driver-standings.png'; a.click(); }); return; }
  if (b.id === 'addL') { S.layers.push({ id: uid(), type: document.getElementById('ltype').value, color: '#ffffff', op: .2, x: 50, y: 50, size: 400, rot: 0 }); }
  else if (b.id === 'addD') S.drivers.push({ id: uid(), name: 'Driver Baru', photo: null, teamId: S.teams[0]?.id });
  else if (b.id === 'addT') S.teams.push({ id: uid(), name: 'Tim Baru', logo: null, logoScale: 100, c1: '#333333', c2: '#666666', c3: '#e10600' });
  else if (b.id === 'addLogo') { if (S.logos.length < 3) { const dp = [[15, 5, 260], [88, 6, 200], [50, 95, 200]][S.logos.length]; S.logos.push({ id: uid(), img: null, x: dp[0], y: dp[1], size: dp[2] }); } }
  else if (b.id === 'resetTitle') S.titleCfg = defaults().titleCfg;
  else if (b.id === 'sort') S.rows.sort((a, c) => c.points - a.points);
  else if (b.id === 'exp') { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify({ ...S, fonts: [] })], { type: 'application/json' })); a.download = 'standings-data.json'; a.click(); return; }
  else if (b.id === 'imp') { document.getElementById('impf').click(); return; }
  else if (b.id === 'impMM') { if (!impMM()) return; }
  else return;
  save(); render(); draw();
});

document.addEventListener('input', e => {
  const t = e.target, p = t.dataset.k; if (!p) return;
  setPath(p, t.type === 'checkbox' ? t.checked : t.dataset.n ? parseFloat(t.value) || 0 : t.value);
  if (p === 'rowCount') S.rowCount = parseInt(t.value);
  if (t.type === 'range') { const sp = t.previousElementSibling && t.previousElementSibling.querySelector('.val'); if (sp) sp.textContent = t.value; }
  save(); draw();
});

document.addEventListener('change', async e => {
  const t = e.target;
  if (t.dataset.img && t.files[0]) { setPath(t.dataset.img, await resize(t.files[0], t.dataset.img.includes('photo') ? 500 : t.dataset.img.startsWith('logos') ? 900 : 400)); save(); render(); draw(); }
  if (t.id === 'fontf' && t.files[0]) {
    const f = t.files[0], data = await f.arrayBuffer(), name = f.name.replace(/\.[^.]+$/, '').replace(/[^\w ]/g, ' ').trim();
    const ff = { name, data }; await regFont(ff); S.fonts.push(ff); tab = 'text'; save(); render(); draw();
  }
  if (t.id === 'impf' && t.files[0]) { try { S = normState(JSON.parse(await t.files[0].text())); for (const f of S.fonts) await regFont(f); save(); render(); draw(); } catch (er) { alert('File data tidak bisa dibaca.'); } }
  if (t.dataset.redraw) draw();
  if (t.dataset.rerender) { render(); draw(); }
});

(async () => { try { await Promise.all(['MotoGP Display Bold', 'MotoGP Text Bold', 'MotoGP Text Regular'].map(f => document.fonts.load('20px "' + f + '"'))); } catch (e) { } await load(); render(); draw(); setTimeout(draw, 300); })();
