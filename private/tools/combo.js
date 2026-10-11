/* Type-ahead search for the poster editors.
   1) <select data-cb> becomes a text box: type part of a name, tap the result.
   2) <input data-flt="key"> filters the cards (items marked data-fi) in the same container.
   Works with the editors' existing handlers: the original select stays in the page (hidden) and gets input/change events. */
(function () {
  var css = document.createElement('style');
  css.textContent = '.cbx{position:relative;display:block;width:100%}.cbx .cbi{width:100%;box-sizing:border-box;padding:12px 40px 12px 12px;margin:0;border-radius:10px;border:1px solid #3a4052;background:#171a22;color:#fff;font:inherit;font-size:16px}.cbx .cbi:focus{outline:2px solid #e10600;outline-offset:0}.cbx .cbc{position:absolute;right:4px;top:4px;width:36px;height:36px;border:0;border-radius:8px;background:none;color:#8b93a7;font-size:18px;cursor:pointer;padding:0;margin:0}.cbx .cbl{position:absolute;left:0;right:0;top:calc(100% + 4px);z-index:60;max-height:240px;overflow-y:auto;background:#1b1e27;border:1px solid #3a4052;border-radius:10px;box-shadow:0 12px 30px #000a;display:none;-webkit-overflow-scrolling:touch}.cbx.open .cbl{display:block}.cbl div{padding:12px 14px;font-size:15px;color:#f2f4f8;border-bottom:1px solid #262a36;cursor:pointer}.cbl div:last-child{border-bottom:0}.cbl div.on,.cbl div:active{background:#e10600;color:#fff}.cbl div.cur{font-weight:700}.cbl div.em{color:#8b93a7;cursor:default}.cbl mark{background:none;color:#ffd24d;font-weight:700}.cbl div.on mark{color:#fff;text-decoration:underline}.fltb{display:block;width:100%;box-sizing:border-box;padding:12px;margin:0 0 12px;border-radius:10px;border:1px solid #3a4052;background:#171a22;color:#fff;font:inherit;font-size:16px}.fltb:focus{outline:2px solid #e10600}.fltn{color:#8b93a7;font-size:13px;margin:-6px 0 10px}';
  document.head.appendChild(css);
  var Q = window.__flt = window.__flt || {};
  function norm(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function fire(sel) { ['input', 'change'].forEach(function (t) { sel.dispatchEvent(new Event(t, { bubbles: true })); }); }
  function enhance(sel) {
    if (sel.__cb) return; sel.__cb = 1;
    var w = document.createElement('div'); w.className = 'cbx';
    var inp = document.createElement('input'); inp.type = 'text'; inp.className = 'cbi'; inp.autocomplete = 'off'; inp.setAttribute('autocapitalize', 'off'); inp.spellcheck = false; inp.placeholder = 'Ketik untuk mencari...'; inp.setAttribute('enterkeyhint', 'done');
    var x = document.createElement('button'); x.type = 'button'; x.className = 'cbc'; x.textContent = '×'; x.setAttribute('aria-label', 'Kosongkan');
    var list = document.createElement('div'); list.className = 'cbl';
    w.appendChild(inp); w.appendChild(x); w.appendChild(list);
    sel.parentNode.insertBefore(w, sel); sel.style.display = 'none';
    var hi = -1, shown = [];
    var curText = function () { var o = sel.options[sel.selectedIndex]; return o && o.value !== '' ? o.text : ''; };
    var items = function () { return Array.prototype.map.call(sel.options, function (o) { return { v: o.value, t: o.text, n: norm(o.text) }; }); };
    function render(q) {
      var words = norm(q).split(/\s+/).filter(Boolean);
      shown = items().filter(function (o) { return words.every(function (w) { return o.n.indexOf(w) > -1; }); });
      if (!q) { var e = shown.filter(function (o) { return o.v === ''; }); shown = e.concat(shown.filter(function (o) { return o.v !== ''; })); } else shown = shown.filter(function (o) { return o.v !== ''; });
      hi = shown.length && q ? 0 : -1;
      list.innerHTML = shown.length ? shown.map(function (o, i) {
        var t = esc(o.t);
        if (words.length) { words.forEach(function (wd) { var k = norm(o.t).indexOf(wd); if (k > -1 && o.t.length === norm(o.t).length) { var s = o.t; t = esc(s.slice(0, k)) + '<mark>' + esc(s.slice(k, k + wd.length)) + '</mark>' + esc(s.slice(k + wd.length)); } }); }
        return '<div data-i="' + i + '" class="' + (i === hi ? 'on ' : '') + (o.v === sel.value ? 'cur' : '') + '">' + t + '</div>';
      }).join('') : '<div class="em">Tidak ditemukan</div>';
    }
    function open() { render(''); w.classList.add('open'); }
    function close() { w.classList.remove('open'); inp.value = curText(); }
    function pick(i) { var o = shown[i]; if (!o) return; sel.value = o.v; inp.value = curText(); w.classList.remove('open'); inp.blur(); fire(sel); }
    function mark() { Array.prototype.forEach.call(list.children, function (c, i) { c.classList.toggle('on', i === hi); }); var c = list.children[hi]; if (c && c.scrollIntoView) c.scrollIntoView({ block: 'nearest' }); }
    inp.value = curText();
    inp.addEventListener('focus', function () { inp.select(); open(); });
    inp.addEventListener('input', function () { w.classList.add('open'); render(inp.value); });
    inp.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown') { e.preventDefault(); hi = Math.min(shown.length - 1, hi + 1); mark(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); hi = Math.max(0, hi - 1); mark(); }
      else if (e.key === 'Enter') { e.preventDefault(); pick(hi > -1 ? hi : 0); }
      else if (e.key === 'Escape') { close(); inp.blur(); }
    });
    inp.addEventListener('blur', function () { setTimeout(close, 150); });
    list.addEventListener('pointerdown', function (e) { e.preventDefault(); });
    list.addEventListener('click', function (e) { var d = e.target.closest('[data-i]'); if (d) pick(+d.dataset.i); });
    x.addEventListener('click', function () { var has = sel.querySelector('option[value=""]'); if (has) { sel.value = ''; inp.value = ''; fire(sel); } else { inp.value = ''; inp.focus(); } });
  }
  function textOf(el) {
    var t = [];
    el.querySelectorAll('b,h3,.nm').forEach(function (b) { t.push(b.textContent); });
    el.querySelectorAll('input:not([type=range]):not([type=color]):not([type=file]):not([type=checkbox]),textarea').forEach(function (i) { if (!i.classList.contains('cbi')) t.push(i.value); });
    el.querySelectorAll('select').forEach(function (s) { var o = s.options[s.selectedIndex]; if (o) t.push(o.text); });
    return norm(t.join(' '));
  }
  function applyFlt(inp) {
    var box = inp.closest('[data-flb]') || inp.parentNode, key = inp.dataset.flt, words = norm(Q[key] || '').split(/\s+/).filter(Boolean), n = 0, tot = 0;
    box.querySelectorAll('[data-fi]').forEach(function (it) { tot++; var s = textOf(it), ok = words.every(function (w) { return s.indexOf(w) > -1; }); it.style.display = ok ? '' : 'none'; if (ok) n++; });
    var note = box.querySelector('.fltn'); if (note) { var m = words.length ? (n ? n + ' dari ' + tot + ' ditampilkan' : 'Tidak ada yang cocok') : ''; if (note.textContent !== m) note.textContent = m; var d = words.length ? '' : 'none'; if (note.style.display !== d) note.style.display = d; }
  }
  function scan() {
    document.querySelectorAll('select[data-cb]').forEach(enhance);
    document.querySelectorAll('input[data-flt]').forEach(function (i) { if (!i.__f) { i.__f = 1; i.value = Q[i.dataset.flt] || ''; } applyFlt(i); });
  }
  document.addEventListener('input', function (e) { var t = e.target; if (t && t.dataset && t.dataset.flt) { Q[t.dataset.flt] = t.value; applyFlt(t); } });
  var sched = 0; new MutationObserver(function () { if (sched) return; sched = requestAnimationFrame(function () { sched = 0; scan(); }); }).observe(document.documentElement, { childList: true, subtree: true });
  if (document.readyState !== 'loading') scan(); else document.addEventListener('DOMContentLoaded', scan);
  window.fltBox = function (key, ph) { return '<input class="fltb" type="search" data-flt="' + key + '" placeholder="' + (ph || 'Cari...') + '" autocomplete="off" autocapitalize="off" spellcheck="false"><div class="fltn" style="display:none"></div>'; };
})();
