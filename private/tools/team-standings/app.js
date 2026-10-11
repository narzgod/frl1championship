/* Team Standings Maker - tanpa build, langsung jalan di Netlify/Vercel */
const W = 1080, H = 1350;
const cv = document.getElementById('cv'), g = cv.getContext('2d');
const uid = () => Math.random().toString(36).slice(2, 8);
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const BUILTIN = ['MotoGP Display Bold', 'MotoGP Text Bold', 'MotoGP Text Regular', 'Arial Black', 'Impact', 'Arial', 'Georgia', 'Courier New', 'Trebuchet MS'];
const LAYER_TYPES = {
  dots: 'Titik halftone (sudut)', stripes: 'Garis miring', checker: 'Papan catur (finish)', kerb: 'Kerb merah-putih', carbon: 'Karbon',
  speed: 'Garis kecepatan', track: 'Lintasan sirkuit', slash: 'Panel miring', ring: 'Cincin', grid: 'Kisi', chevron: 'Panah chevron', glow: 'Cahaya'
};

function contrast(hex) { const n = parseInt(hex.slice(1), 16), r = n >> 16, gc = (n >> 8) & 255, b = n & 255; return (r * 299 + gc * 587 + b * 114) / 1000 > 150 ? '#111111' : '#ffffff'; }
function shade(hex, f) { const n = parseInt(hex.slice(1), 16), c = k => Math.max(0, Math.min(255, Math.round(((n >> k) & 255) * (1 + f)))); return `rgb(${c(16)},${c(8)},${c(0)})`; }
const L = (type, color, op, x, y, size, rot) => ({ id: uid(), type, color, op, x, y, size, rot });
const THEMES = {
  gelap: ['Gelap sirkuit', '#101012', () => [L('track', '#ffffff', .08, 50, 48, 1500, -25), L('dots', '#ffffff', .22, 100, 0, 520, 90), L('speed', '#ffffff', .07, 0, 55, 700, -8)]],
  merah: ['Merah balap', '#120506', () => [L('glow', '#e10600', .35, 100, 0, 700, 0), L('dots', '#e10600', .55, 100, 0, 560, 90), L('speed', '#e10600', .2, 0, 60, 700, -8), L('checker', '#ffffff', .06, 78, 96, 360, 0)]],
  biru: ['Biru neon', '#050a18', () => [L('glow', '#2d6bff', .35, 0, 0, 800, 0), L('grid', '#4d8bff', .12, 50, 40, 1300, -15), L('chevron', '#4d8bff', .15, 6, 92, 260, 0)]],
  emas: ['Karbon emas', '#0c0c0c', () => [L('carbon', '#ffffff', .07, 50, 50, 1300, 0), L('glow', '#d6a93a', .25, 50, 0, 800, 0), L('kerb', '#d6a93a', .5, 50, 97, 1080, 0)]]
};
function defaults() {
  const t = (name, c1, c2, c3, pts, move) => ({ id: uid(), name, logo: null, logoScale: 100, lx: 0, ns: 100, c1, c2, c3, c4: c3, pts, move });
  return {
    ver: 1, title: 'SEASON 2 TEAM\nSTANDINGS', lead: 'Points After The', event: 'DUBAI GP', nextLabel: 'NEXT STOP:', nextCountry: 'ITALY',
    flagEvent: { code: 'ae', img: null }, flagNext: { code: 'it', img: null },
    fontMap: { title: 'MotoGP Display Bold', lead: 'MotoGP Text Bold', event: 'MotoGP Text Bold', name: 'MotoGP Text Bold', points: 'MotoGP Display Bold', move: 'MotoGP Display Bold', footer: 'MotoGP Text Bold' },
    titleCfg: { x: 39, y: 232, size: 66, gap: 57, sx: 100, sy: 100, ls: 0 }, logos: [],
    st: { rowStyle: 'v', radius: 30, gap: 0, mid: 'white', ptsBg: 'row', legend: true, goldFirst: false, nameScale: 100, ptsScale: 100, triScale: 100, logoSize: 100, rowH: 141, top: 322 },
    bg: THEMES.gelap[1], bgImg: null, bgImgOp: .35, autoGlow: true, previewSize: 1,
    teams: [t('Revline AVX', '#980000', '#5a0000', '#ffffff', 71, 0), t('Redbull Power', '#bebebe', '#8a8a8a', '#111111', 45, 1), t('Notorius', '#ffffff', '#c8c8c8', '#111111', 40, 1),
      t('Zeva Forge', '#0010c8', '#000a80', '#ffffff', 25, -2), t('Nova Motors.', '#fd5d0a', '#a03800', '#ffffff', 10, 1), t('Fourtyfour', '#444444', '#1f1f1f', '#ffffff', 0, 0)],
    layers: THEMES.gelap[2](), fonts: []
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
const DB = 'tsm1';
const idb = () => new Promise((ok, no) => { const r = indexedDB.open(DB, 1); r.onupgradeneeded = () => r.result.createObjectStore('k'); r.onsuccess = () => ok(r.result); r.onerror = no; });
function impMM() {
  let h; try { h = JSON.parse(localStorage.getItem('f1c-hub')); } catch (e) { }
  if (!h || !h.drivers || !h.drivers.length) { alert('No fRacing Legends data yet. Fill it in first from the main menu.'); return false; }
  const L = v => String(v).trim().toLowerCase(), dk = c => { const n = parseInt(c.slice(1), 16), f = k => Math.round(((n >> k) & 255) * .55).toString(16).padStart(2, '0'); return '#' + f(16) + f(8) + f(0); };
  S.teams = h.teams.map(t => { const o = S.teams.find(x => L(x.name) == L(t.name)); return Object.assign(o ? { ...o } : { id: uid(), name: t.name, logo: null, logoScale: 100, lx: 0, ns: 100 }, { c1: t.col, c2: t.col2 || dk(t.col), c3: contrast(t.col), c4: contrast(t.col), pts: t.pts, move: 0 }); });
  return true;
}
let saveT;
async function flush() { try { const d = await idb(); d.transaction('k', 'readwrite').objectStore('k').put(S, 'state'); } catch (e) { } }
function save() { clearTimeout(saveT); saveT = setTimeout(flush, 400); }
document.addEventListener('visibilitychange', () => { if (document.hidden) { clearTimeout(saveT); flush(); } });
addEventListener('pagehide', () => { clearTimeout(saveT); flush(); });
function normState(v) {
  const st = Object.assign(defaults(), v), d = defaults();
  st.st = Object.assign({}, d.st, v.st); st.fontMap = Object.assign({}, d.fontMap, v.fontMap); st.titleCfg = Object.assign({}, d.titleCfg, v.titleCfg);
  st.teams.forEach(t => { if (t.c4 == null) t.c4 = t.c3; if (t.ns == null) t.ns = 100; if (t.lx == null) t.lx = 0; if (t.logoScale == null) t.logoScale = 100; });
  return st;
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
    case 'track': g.lineJoin='round'; g.lineWidth=s*.035; g.beginPath(); g.moveTo(-s*.5,s*.1); g.bezierCurveTo(-s*.5,-s*.35,-s*.1,-s*.45,s*.05,-s*.2); g.bezierCurveTo(s*.2,0,s*.4,-s*.25,s*.5,-s*.05); g.bezierCurveTo(s*.6,s*.2,s*.2,s*.4,-s*.05,s*.3); g.bezierCurveTo(-s*.3,s*.2,-s*.2,s*.05,-s*.5,s*.1); g.closePath(); g.stroke(); g.scale(.9,.9); g.lineWidth=s*.008; g.stroke(); break;
    case 'glow': { const gr = g.createRadialGradient(0, 0, 0, 0, 0, s); gr.addColorStop(0, l.color); gr.addColorStop(1, 'transparent'); g.fillStyle = gr; g.fillRect(-s, -s, s * 2, s * 2); break; }
  }
  g.restore();
}

function glowAt(x, y, r, c, a) { const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, c); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.save(); g.globalAlpha = a; g.fillStyle = gr; g.fillRect(0, 0, W, H); g.restore(); }
function tri(cx, cy, s, up, c) { g.fillStyle = c; g.beginPath(); if (up) { g.moveTo(cx - s / 2, cy + s * .43); g.lineTo(cx + s / 2, cy + s * .43); g.lineTo(cx, cy - s * .43); } else { g.moveTo(cx - s / 2, cy - s * .43); g.lineTo(cx + s / 2, cy - s * .43); g.lineTo(cx, cy + s * .43); } g.closePath(); g.fill(); }
function draw() {
  g.clearRect(0, 0, W, H); g.fillStyle = S.bg; g.fillRect(0, 0, W, H);
  const bi = img(S.bgImg); if (bi) { g.save(); g.globalAlpha = S.bgImgOp; cover(bi, 0, 0, W, H); g.restore(); }
  if (S.autoGlow && S.teams[0]) { glowAt(80, 260, 820, S.teams[0].c1, .38); if (S.teams[1]) glowAt(1000, 1150, 760, S.teams[1].c1, .22); }
  S.layers.forEach(layer);
  const vg = g.createLinearGradient(0, 0, 0, H); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.5)'); g.fillStyle = vg; g.fillRect(0, 0, W, H);
  g.textBaseline = 'alphabetic'; g.textAlign = 'left';
  if (!S.logos.length) { g.fillStyle = '#fff'; g.font = `italic 92px "${FNT('title')}"`; g.fillText('F1C', 39, 150); }
  S.logos.forEach(l => { const im = img(l.img); if (!im) return; const w = l.size, hh = w * im.naturalHeight / im.naturalWidth; g.drawImage(im, l.x / 100 * W - w / 2, l.y / 100 * H - hh / 2, w, hh); });
  { const tc = S.titleCfg, lines = S.title.split('\n').slice(0, 3).map(x => x.toUpperCase());
    g.save(); g.fillStyle = '#fff'; g.textAlign = 'left';
    if ('letterSpacing' in g) g.letterSpacing = (tc.ls || 0) + 'px';
    g.font = `${tc.size}px "${FNT('title')}"`;
    lines.forEach((ln, i) => { g.save(); g.translate(tc.x, tc.y + i * tc.gap); g.scale(tc.sx / 100, tc.sy / 100); g.fillText(ln, 0, 0); g.restore(); });
    g.restore(); }
  g.textAlign = 'right'; g.fillStyle = '#e4e4e8'; fit(S.lead, 340, 34, FNT('lead')); g.fillText(S.lead, 1038, 248);
  { const ev = S.event.toUpperCase(), sz = fit(ev, flagW(S.flagEvent, 32) ? 270 : 340, 46, FNT('event')), tw = g.measureText(ev).width, fh = sz * .78, fw = flagW(S.flagEvent, fh);
    g.fillStyle = '#fff'; g.textAlign = 'right'; g.fillText(ev, 1038, 292);
    if (fw) flagDraw(S.flagEvent, 1038 - tw - 16 - fw, 292 - sz * .35 - fh / 2, fw, fh); }

  const st = S.st, n = Math.min(S.teams.length, 12);
  if (n) {
    const top = st.top, pitch = Math.min(st.rowH, (1190 - top) / n), gap = st.gap, h = pitch - gap, rad = st.radius;
    const X0 = 36, X1 = 1044, PW = 192, PX = X1 - PW, MW = 108, MX = PX - MW - 3, bot = top + (n - 1) * pitch + h, hasM = st.mid !== 'none';
    const T = S.teams.slice(0, n);
    T.forEach((t, i) => {
      const y = top + i * pitch, cy = y + h / 2, a = (gap > 0 || i === 0) ? rad : 0, b = (gap > 0 || i === n - 1) ? rad : 0, gold = st.goldFirst && i === 0;
      let f = t.c1;
      if (st.rowStyle !== 'flat') { f = st.rowStyle === 'h' ? g.createLinearGradient(X0, 0, X1, 0) : g.createLinearGradient(0, y, 0, y + h); f.addColorStop(0, t.c1); f.addColorStop(1, t.c2); }
      g.fillStyle = f; rr(X0, y, X1 - X0, h, [a, a, b, b]); g.fill();
      if (st.ptsBg !== 'row') { g.fillStyle = st.ptsBg === 'dark' ? 'rgba(0,0,0,.4)' : 'rgba(255,255,255,.2)'; rr(PX, y, PW, h, [0, a, b, 0]); g.fill(); }
      g.textBaseline = 'middle';
      const lbw = h, lx = X0 + 24 + lbw / 2, tl = img(t.logo), k = st.logoSize / 100 * t.logoScale / 100;
      if (tl) { const bw = lbw * k, bh = h * .72 * k, cw = 24 + lbw + 10; g.save(); rr(X0, y, cw, h, [a, 0, 0, b]); g.clip(); contain(tl, lx - bw / 2 + (t.lx || 0), cy - bh / 2, bw, bh); g.restore(); }
      else { g.fillStyle = t.c3; g.textAlign = 'center'; g.font = `${h * .34}px "${FNT('name')}"`; g.fillText((t.name || '').slice(0, 3).toUpperCase(), lx, cy + 2); }
      const nx = X0 + 24 + lbw + 22; g.textAlign = 'left';
      fit((t.name || '').toUpperCase(), (hasM ? MX : PX) - 18 - nx, h * .42 * t.ns / 100 * st.nameScale / 100, FNT('name')); g.fillStyle = gold ? '#e6c76e' : t.c3; g.fillText((t.name || '').toUpperCase(), nx, cy + 2);
      const pt = String(t.pts).padStart(2, '0'); g.textAlign = 'center'; fit(pt, PW - 30, h * .52 * st.ptsScale / 100, FNT('points')); g.fillStyle = gold ? '#f3d98b' : t.c4; g.fillText(pt, (PX + X1) / 2, cy + 2);
    });
    if (hasM) {
      const w = st.mid === 'white'; g.fillStyle = w ? '#ffffff' : st.mid === 'dark' ? '#14151c' : 'rgba(255,255,255,.16)'; g.fillRect(MX, top, MW, bot - top);
      g.fillStyle = w ? '#000' : 'rgba(255,255,255,.3)'; for (let i = 1; i < n; i++) g.fillRect(MX, top + i * pitch - gap / 2 - 1, MW, 2);
      if (w) { g.strokeStyle = '#000'; g.lineWidth = 3; g.strokeRect(MX, top, MW, bot - top); }
      const mc = w ? '#111111' : '#ffffff';
      T.forEach((t, i) => {
        const cy = top + i * pitch + h / 2, mcx = MX + MW / 2, fs = h * .42; g.textBaseline = 'middle'; g.textAlign = 'left'; g.font = `${fs}px "${FNT('move')}"`; g.fillStyle = mc;
        if (!t.move) { g.textAlign = 'center'; g.fillText('-', mcx, cy + 2); return; }
        const ts = h * .27 * st.triScale / 100, gp = Math.max(5, ts * .25), lb = String(Math.abs(t.move)), gw = ts + gp + g.measureText(lb).width, sx = mcx - gw / 2;
        tri(sx + ts / 2, cy, ts, t.move > 0, t.move > 0 ? '#1fc13a' : '#e10600'); g.fillStyle = mc; g.fillText(lb, sx + ts + gp, cy + 2);
      });
      if (st.legend) { tri(mcx0(MX, MW) - 20, bot + 36, 26, false, '#e10600'); tri(mcx0(MX, MW) + 20, bot + 36, 26, true, '#1fc13a'); }
    }
  }
  { g.textBaseline = 'alphabetic'; g.textAlign = 'left'; const lb = (S.nextLabel || '').toUpperCase(), ct = (S.nextCountry || '').toUpperCase(), base = H - 88; let fs = 40, wl = 0, wc = 0, fw = 0;
    for (; fs > 16; fs--) { g.font = `${fs}px "${FNT('footer')}"`; wl = g.measureText(lb).width; wc = g.measureText(ct).width; fw = flagW(S.flagNext, fs * .78); if (wl + wc + (fw ? fw + 28 : 14) <= 1000) break; }
    g.fillStyle = '#fff'; g.fillText(lb, 39, base); let nx2 = 39 + wl + 14;
    if (fw) { flagDraw(S.flagNext, nx2, base - fs * .35 - fs * .39, fw, fs * .78); nx2 += fw + 14; }
    g.fillText(ct, nx2, base); }
}
const mcx0 = (x, w) => x + w / 2;

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
const sel = (p, label, v, o) => `<label>${label}</label><select data-k="${p}">${Object.entries(o).map(([k, n]) => `<option value="${k}" ${k === v ? 'selected' : ''}>${n}</option>`).join('')}</select>`;
const chk = (p, label, v) => `<label><input type="checkbox" data-k="${p}" ${v ? 'checked' : ''}> ${label}</label>`;
const TABS = { poster: 'Poster', teams: 'Tim', style: 'Baris', text: 'Teks', bg: 'Latar', logo: 'Logo', fonts: 'Font' };
function panelHTML() {
  if (tab === 'poster') return `<div class="card"><h3>Teks poster</h3>${txt('title', 'Judul (Enter = baris baru)', S.title, 1)}${txt('lead', 'Teks kecil kanan atas', S.lead)}${txt('event', 'Nama GP (di bawah teks kecil)', S.event)}${txt('nextLabel', 'Teks bawah', S.nextLabel)}${txt('nextCountry', 'Negara tujuan berikutnya', S.nextCountry)}</div>
  <div class="card"><h3>Bendera</h3>${flagSel('flagEvent', 'Bendera di kiri nama GP', S.flagEvent)}${flagSel('flagNext', 'Bendera di kiri negara tujuan', S.flagNext)}</div>
  <div class="card"><h3>Cadangan data</h3><div class="row"><button id="exp">Simpan file data</button><button id="imp">Buka file data</button><button id="impMM">Ambil dari fRacing Legends</button></div><input id="impf" type="file" accept=".json" hidden></div>`;
  if (tab === 'teams') return `<div class="row"><button class="primary" id="addT">+ Tambah tim</button><button id="sort">Urutkan dari poin</button></div><p class="hint">Urutan kartu = urutan baris di poster (maksimal 12 tim).</p>` + `<div data-flb>${fltBox('ts:teams', 'Cari tim...')}` + S.teams.map((t, i) => `<div class="card" data-fi><div class="row">${thumb(t.logo)}<div>${txt(`teams.${i}.name`, `Posisi ${i + 1} · Nama tim`, t.name)}</div></div>
    <div class="row"><div>${num(`teams.${i}.pts`, 'Poin', t.pts, 0)}</div><div>${num(`teams.${i}.move`, 'Naik (+) / turun (−)', t.move)}</div></div>
    ${upl(`teams.${i}.logo`, 'Logo tim (PNG transparan paling bagus)')}${rng(`teams.${i}.logoScale`, 'Ukuran logo (%) · di atas 100 terpotong di kotak logo', t.logoScale, 20, 300)}${rng(`teams.${i}.lx`, 'Geser logo kiri–kanan', t.lx || 0, -150, 150)}${rng(`teams.${i}.ns`, 'Ukuran nama tim (%)', t.ns, 50, 140)}
    <div class="row"><div><label>Warna atas</label>${col(`teams.${i}.c1`, t.c1)}</div><div><label>Warna bawah</label>${col(`teams.${i}.c2`, t.c2)}</div><div><label>Nama</label>${col(`teams.${i}.c3`, t.c3)}</div><div><label>Poin</label>${col(`teams.${i}.c4`, t.c4)}</div></div>
    <div class="row" style="margin-top:10px"><button data-mv="${i}:-1">▲ Naik</button><button data-mv="${i}:1">▼ Turun</button><button class="del" data-del="teams.${i}">Hapus</button></div></div>`).join('') + '</div>';
  if (tab === 'style') { const s = S.st; return `<div class="card"><h3>Gaya baris tim</h3>${sel('st.rowStyle', 'Warna baris', s.rowStyle, { v: 'Gradasi atas–bawah', h: 'Gradasi kiri–kanan', flat: 'Warna rata' })}${sel('st.ptsBg', 'Latar kolom poin', s.ptsBg, { row: 'Sama dengan baris', dark: 'Gelap transparan', light: 'Terang transparan' })}${chk('st.goldFirst', 'Juara 1 berwarna emas', s.goldFirst)}
  ${rng('st.radius', 'Lengkung sudut', s.radius, 0, 60)}${rng('st.gap', 'Jarak antar baris', s.gap, 0, 24)}${rng('st.rowH', 'Tinggi baris (maks)', s.rowH, 70, 160)}${rng('st.top', 'Posisi baris dari atas', s.top, 260, 420)}</div>
  <div class="card"><h3>Kolom naik / turun</h3>${sel('st.mid', 'Gaya kolom', s.mid, { white: 'Putih (seperti preset)', dark: 'Gelap', glass: 'Kaca transparan', none: 'Sembunyikan' })}${chk('st.legend', 'Tampilkan panah keterangan di bawah', s.legend)}${rng('st.triScale', 'Ukuran segitiga (%)', s.triScale, 50, 160)}</div>
  <div class="card"><h3>Ukuran isi</h3>${rng('st.nameScale', 'Semua nama tim (%)', s.nameScale, 50, 140)}${rng('st.ptsScale', 'Semua angka poin (%)', s.ptsScale, 50, 140)}${rng('st.logoSize', 'Semua logo tim (%) · terpotong di kotak logo', s.logoSize, 50, 160)}</div>`; }
  if (tab === 'text') { const c = S.titleCfg; return `<div class="card"><h3>Judul poster</h3>${rng('titleCfg.x', 'Posisi kiri–kanan', c.x, -300, 1080)}${rng('titleCfg.y', 'Posisi atas–bawah', c.y, 20, 700)}${rng('titleCfg.size', 'Ukuran huruf', c.size, 20, 180)}${rng('titleCfg.gap', 'Jarak antar baris', c.gap, 10, 260)}${rng('titleCfg.sx', 'Lebar teks (%)', c.sx, 50, 220)}${rng('titleCfg.sy', 'Tinggi teks (%)', c.sy, 50, 220)}${rng('titleCfg.ls', 'Jarak antar huruf', c.ls, -5, 40, 0.5)}<button id="resetTitle" style="margin-top:10px">Kembalikan judul ke awal</button></div>
  <div class="card"><h3>Font tiap teks</h3>${fontPick('title', 'Judul')}${fontPick('lead', 'Teks kecil kanan atas')}${fontPick('event', 'Nama GP')}${fontPick('name', 'Nama tim')}${fontPick('points', 'Angka poin')}${fontPick('move', 'Angka naik / turun')}${fontPick('footer', 'Teks bawah')}<p class="hint">Mau font sendiri? Unggah file .ttf di tab Font.</p></div>`; }
  if (tab === 'logo') return `<button class="primary" id="addLogo" style="width:100%;margin-bottom:8px" ${S.logos.length >= 3 ? 'disabled' : ''}>+ Tambah logo (${S.logos.length}/3)</button><p class="hint">Maksimal 3 logo (misal logo liga di kiri atas dan logo komunitas di kanan atas).</p>` + S.logos.map((l, i) => `<div class="card"><div class="row">${thumb(l.img)}<b>Logo ${i + 1}</b><button class="del fit" data-del="logos.${i}">Hapus</button></div>${upl(`logos.${i}.img`, 'Gambar logo')}${rng(`logos.${i}.size`, 'Ukuran (lebar)', l.size, 40, 900)}${rng(`logos.${i}.x`, 'Posisi kiri–kanan (%)', l.x, -10, 110, 0.5)}${rng(`logos.${i}.y`, 'Posisi atas–bawah (%)', l.y, -10, 110, 0.5)}</div>`).join('');
  if (tab === 'bg') return `<div class="card"><h3>Tema latar siap pakai</h3><div class="row"><select id="theme">${Object.entries(THEMES).map(([k, v]) => `<option value="${k}">${v[0]}</option>`).join('')}</select><button class="primary fit" id="applyTheme">Pakai</button></div><p class="hint">Tema mengganti warna latar dan semua grafik di bawah.</p>
  <div class="row"><div><label>Warna latar</label>${col('bg', S.bg)}</div></div>${chk('autoGlow', 'Cahaya latar mengikuti warna tim juara 1 & 2', S.autoGlow)}</div>
  <div class="card"><h3>Gambar latar (opsional)</h3>${upl('bgImg', 'Unggah gambar')}${rng('bgImgOp', 'Kejelasan gambar', S.bgImgOp, 0.05, 1, 0.05)}<button id="rmBg" style="margin-top:8px">Hapus gambar latar</button></div>
  <div class="card"><h3>Tambah grafik latar</h3><div class="row"><select id="ltype">${Object.entries(LAYER_TYPES).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}</select><button class="primary fit" id="addL">Tambah</button></div></div>` +
    S.layers.map((l, i) => `<div class="card"><h3>${LAYER_TYPES[l.type]}</h3><div class="row"><div><label>Warna</label>${col(`layers.${i}.color`, l.color)}</div><button class="del fit" data-del="layers.${i}">Hapus</button></div>${rng(`layers.${i}.op`, 'Kejelasan', l.op, 0.02, 1, 0.01)}${rng(`layers.${i}.size`, 'Ukuran', l.size, 60, 1600)}${rng(`layers.${i}.x`, 'Posisi kiri–kanan', l.x, -20, 120)}${rng(`layers.${i}.y`, 'Posisi atas–bawah', l.y, -20, 120)}${rng(`layers.${i}.rot`, 'Putar', l.rot, -180, 180)}</div>`).join('');
  if (tab === 'fonts') return `<div class="card"><h3>Tambah font (.ttf / .otf)</h3><input type="file" accept=".ttf,.otf,.woff,.woff2" id="fontf"><p class="hint">Font bawaan: MotoGP Display Bold, MotoGP Text Bold, MotoGP Text Regular. Font yang kamu unggah muncul di daftar pilihan tab Teks.</p></div>` + S.fonts.map((f, i) => `<div class="card"><div class="row"><b>${esc(f.name)}</b><button class="del fit" data-del="fonts.${i}">Hapus</button></div></div>`).join('');
}

function applyPv() { const i = S.previewSize ?? 1; document.documentElement.style.setProperty('--pv', ['30vh', '42vh', '58vh'][i]); const b = document.getElementById('btnSize'); if (b) b.textContent = 'Pratinjau ' + ['Kecil', 'Sedang', 'Besar'][i]; }
function render() {
  applyPv();
  document.getElementById('tabs').innerHTML = Object.entries(TABS).map(([k, v]) => `<button class="${k === tab ? 'on' : ''}" data-tab="${k}">${v}</button>`).join('');
  document.getElementById('panel').innerHTML = panelHTML();
}

document.addEventListener('click', async e => {
  const b = e.target.closest('button'); if (!b) return;
  const d = b.dataset;
  if (d.tab) { tab = d.tab; render(); return; }
  if (d.mv) { const [i, s] = d.mv.split(':').map(Number), j = i + s; if (S.teams[j]) { [S.teams[i], S.teams[j]] = [S.teams[j], S.teams[i]]; save(); render(); draw(); } return; }
  if (d.del) { const [k, i] = d.del.split('.'); if (!confirm('Hapus item ini?')) return; S[k].splice(i, 1); save(); render(); draw(); return; }
  if (b.id === 'btnSize') { S.previewSize = ((S.previewSize ?? 1) + 1) % 3; applyPv(); save(); return; }
  if (b.id === 'btnDl') { cv.toBlob(bl => { const a = document.createElement('a'); a.href = URL.createObjectURL(bl); a.download = 'team-standings.png'; a.click(); }); return; }
  if (b.id === 'addL') S.layers.push({ id: uid(), type: document.getElementById('ltype').value, color: '#ffffff', op: .2, x: 50, y: 50, size: 400, rot: 0 });
  else if (b.id === 'addT') S.teams.push({ id: uid(), name: 'Tim Baru', logo: null, logoScale: 100, lx: 0, ns: 100, c1: '#444444', c2: '#1f1f1f', c3: '#ffffff', c4: '#ffffff', pts: 0, move: 0 });
  else if (b.id === 'addLogo') { if (S.logos.length < 3) { const dp = [[15, 8, 260], [90, 5, 200], [50, 95, 200]][S.logos.length]; S.logos.push({ id: uid(), img: null, x: dp[0], y: dp[1], size: dp[2] }); } }
  else if (b.id === 'resetTitle') S.titleCfg = defaults().titleCfg;
  else if (b.id === 'sort') S.teams.sort((a, c) => c.pts - a.pts);
  else if (b.id === 'applyTheme') { const th = THEMES[document.getElementById('theme').value]; S.bg = th[1]; S.layers = th[2](); }
  else if (b.id === 'rmBg') S.bgImg = null;
  else if (b.id === 'exp') { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify({ ...S, fonts: [] })], { type: 'application/json' })); a.download = 'team-standings-data.json'; a.click(); return; }
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
  if (t.dataset.img && t.files[0]) { setPath(t.dataset.img, await resize(t.files[0], t.dataset.img === 'bgImg' ? 1080 : t.dataset.img.includes('photo') ? 500 : t.dataset.img.startsWith('logos') ? 900 : 400)); save(); render(); draw(); }
  if (t.id === 'fontf' && t.files[0]) {
    const f = t.files[0], data = await f.arrayBuffer(), name = f.name.replace(/\.[^.]+$/, '').replace(/[^\w ]/g, ' ').trim();
    const ff = { name, data }; await regFont(ff); S.fonts.push(ff); tab = 'text'; save(); render(); draw();
  }
  if (t.id === 'impf' && t.files[0]) { try { S = normState(JSON.parse(await t.files[0].text())); for (const f of S.fonts) await regFont(f); save(); render(); draw(); } catch (er) { alert('File data tidak bisa dibaca.'); } }
  if (t.dataset.redraw) draw();
  if (t.dataset.rerender) { render(); draw(); }
});

(async () => { try { await Promise.all(['MotoGP Display Bold', 'MotoGP Text Bold', 'MotoGP Text Regular'].map(f => document.fonts.load('20px "' + f + '"'))); } catch (e) { } await load(); render(); draw(); setTimeout(draw, 300); })();
