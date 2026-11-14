/* Runs a design module on the 3D Prints page: builds its settings from the module's list of fields, shows the
   assembled preview or any part as printed, the numbers, the parts to print, and downloads a zip of STL files
   with a README. A design module exports { id, title, intro, defaults, derive(o), sections, tips, build(W, p) };
   build returns { parts:[{name, what, count, m}], asm:[{m, c}], colors, legend, stats:[[k,v,s]], notes:[] }.
   Uses the page's render, stl, zipStore and cssColor. */

const fmt = (n, d = 0) => Number(n).toLocaleString('en', { minimumFractionDigits: d, maximumFractionDigits: d });
const el = (tag, attrs = {}, ...kids) => { const e = document.createElement(tag); for (const k in attrs) { if (k === 'class') e.className = attrs[k]; else if (k === 'text') e.textContent = attrs[k]; else e.setAttribute(k, attrs[k]); } e.append(...kids); return e; };

export function mountDesign(D, ctx) {
  const { state, persist, bed } = ctx;
  const S = (state.designs = state.designs || {})[D.id] = Object.assign({}, D.defaults, (state.designs || {})[D.id] || {});
  const id = s => `${D.id}-${s}`;

  /* ---- markup ---- */
  const tabBtn = el('button', { type: 'button', role: 'tab', id: id('tab'), 'aria-controls': id('view'), 'aria-selected': 'false', text: D.title });
  ctx.tabs.append(tabBtn);
  const inputs = el('div', { class: 'inputs' });
  const view = el('div', { class: 'grid', id: id('view'), role: 'tabpanel', 'aria-labelledby': id('tab'), hidden: '' }, inputs);
  ctx.wrap.append(view);
  if (D.intro) inputs.append(el('p', { class: 'hint', style: 'margin:0', text: D.intro }));
  const ctrls = [];
  D.sections.forEach((sec, si) => {
    const h = el('h2', { id: id('h' + si), text: sec.title }), box = el('section', { 'aria-labelledby': id('h' + si) }, h);
    let fields = null;
    for (const fd of sec.fields) {
      if (fd.type === 'preset' || fd.type === 'seg') {
        const g = el('div', { class: 'seg', role: 'group', 'aria-label': fd.label || sec.title, style: 'margin-bottom:12px' });
        box.append(g); ctrls.push({ fd, g, sec });
      } else {
        if (!fields) { fields = el('div', { class: 'fields' }); box.append(fields); }
        const inp = el('input', fd.type === 'text' ? { type: 'text', autocomplete: 'off' } : { type: 'number', min: fd.min ?? '', max: fd.max ?? '', step: fd.step ?? 'any' });
        const lab = el('label', { class: 'f' }, fd.label, inp);
        fields.append(lab); ctrls.push({ fd, inp, lab, sec });
        inp.addEventListener('input', () => {
          const v = fd.type === 'text' ? inp.value : parseFloat(inp.value); if (fd.type !== 'text' && !isFinite(v)) return;
          S[fd.k] = v;
          if (sec.onChange && sec.onChange[fd.k]) { Object.assign(S, sec.onChange[fd.k](v)); sync(true); }
          changed();
        });
      }
    }
    if (sec.hint) box.append(el('p', { class: 'hint', text: sec.hint }));
    inputs.append(box);
  });
  if (D.tips) { const ul = el('ul', { class: 'tips' }); for (const t of D.tips) ul.append(el('li', { text: t })); inputs.append(el('section', {}, el('h2', { text: 'Print and put together' }), ul)); }

  const show = el('select'), cv = el('canvas', { width: 800, height: 600, role: 'img', 'aria-label': `3D preview of the ${D.title.toLowerCase()}` });
  const legend = el('div', { class: 'legend' }), stats = el('div', { class: 'stats' }), need = el('div', { class: 'need' });
  const note = el('div', { class: 'note', hidden: '' }), dl = el('button', { class: 'btn solid', type: 'button', text: 'Download STL files' }), msg = el('span', { class: 'msg', role: 'status' });
  view.append(el('aside', { class: 'result', 'aria-label': `${D.title} result` }, el('div', { class: 'fields' }, el('label', { class: 'f' }, 'Show', show)), cv, legend, stats, need, note, dl, msg));

  /* ---- state <-> controls ---- */
  const P = () => D.derive(S);
  function sync(valuesToo) {
    const p = P();
    for (const c of ctrls) {
      const vis = !c.fd.show || c.fd.show(p);
      if (c.g) {
        c.g.hidden = !vis; c.g.textContent = '';
        for (const [v, l] of c.fd.options) {
          const preset = c.fd.type === 'preset', on = preset ? Object.entries(l).every(([k, x]) => String(S[k]) === String(x)) : String(S[c.fd.k]) === String(v);
          const label = preset ? v : l;
          const b = el('button', { type: 'button', 'aria-pressed': String(on), text: label });
          b.onclick = () => { if (preset) { Object.assign(S, l); for (const k in l) if (c.sec.onChange && c.sec.onChange[k]) Object.assign(S, c.sec.onChange[k](l[k])); } else { S[c.fd.k] = v; if (c.sec.onChange && c.sec.onChange[c.fd.k]) Object.assign(S, c.sec.onChange[c.fd.k](v)); } sync(true); changed(); };
          c.g.append(b);
        }
      } else {
        c.lab.hidden = !vis;
        if (valuesToo || c.inp.value === '') c.inp.value = S[c.fd.k];
      }
    }
  }

  /* ---- build, with a small cache ---- */
  const cache = new Map();
  const toTris = m => { const mesh = m.getMesh(), Pv = mesh.vertProperties, np = mesh.numProp, T = mesh.triVerts, o = new Float32Array(T.length * 3); for (let i = 0; i < T.length; i++) { const v = T[i] * np; o[i * 3] = Pv[v]; o[i * 3 + 1] = Pv[v + 1]; o[i * 3 + 2] = Pv[v + 2]; } return o; };
  function result() {
    const p = P(), key = JSON.stringify(p);
    if (cache.has(key)) return cache.get(key);
    let r;
    try {
      const b = D.build(ctx.W, p);
      r = { ...b, p, parts: b.parts.map(pt => {
        const bb = pt.m.boundingBox(), m = pt.m.translate([-(bb.min[0] + bb.max[0]) / 2, -(bb.min[1] + bb.max[1]) / 2, -bb.min[2]]);
        return { ...pt, m: undefined, tris: toTris(m), vol: m.volume(), size: [0, 1, 2].map(i => bb.max[i] - bb.min[i]) };
      }), asm: b.asm.map(a => ({ c: a.c, tris: toTris(a.m) })) };
    } finally { ctx.cleanup(); }
    if (cache.size > 20) cache.clear();
    cache.set(key, r); return r;
  }

  function draw() {
    let r;
    try { r = result(); } catch (e) { console.error(e); note.hidden = false; note.textContent = 'These sizes don\'t work together. Try values closer to the defaults.'; return; }
    const pairs = [['asm', 'Put together'], ...r.parts.map(pt => [pt.name, `${pt.what} (as printed)`])];
    const cur = S._show || 'asm'; show.textContent = '';
    for (const [v, l] of pairs) show.append(el('option', { value: v, text: l }));
    show.value = pairs.some(x => x[0] === cur) ? cur : 'asm';
    const col = k => ctx.cssColor(`var(${(r.colors || {})[k] || '--tray'})`);
    let items;
    if (show.value === 'asm') items = r.asm.map(a => ({ tris: a.tris, color: col(a.c) }));
    else { const pt = r.parts.find(x => x.name === show.value); items = [{ tris: pt.tris, color: ctx.cssColor('var(--post)') }]; }
    ctx.render(cv, items);
    legend.textContent = '';
    for (const [c, t] of (show.value === 'asm' ? r.legend || [] : [])) { const i = el('i', { class: 'dot' }); i.style.background = `var(${c})`; legend.append(el('span', {}, i, t)); }
    const g = r.parts.reduce((a, pt) => a + pt.vol / 1000 * 1.24 * pt.count, 0);
    stats.innerHTML = '';
    for (const [k, v, s] of [...r.stats, ['Filament', g >= 1000 ? `${fmt(g / 1000, 2)} kg` : `${fmt(g)} g`, 'PLA, solid']].slice(0, 6))
      stats.append(el('div', { class: 'stat' }, el('div', { class: 'k', text: k }), el('div', { class: 'v', text: v }), el('div', { class: 's', text: s || '' })));
    need.innerHTML = '';
    need.append(el('div', {}, el('b', { text: 'To print' }), el('span')));
    for (const pt of r.parts) need.append(el('div', {}, el('span', { text: `${pt.what} · ${pt.size.map(v => fmt(v)).join(' × ')} mm` }), el('span', { text: `× ${pt.count}` })));
    const w = [...(r.notes || [])];
    const big = Math.max(...r.parts.map(pt => Math.max(pt.size[0], pt.size[1])));
    if (big > bed()) w.push(`A part is ${fmt(big)} mm long, bigger than your ${fmt(bed())} mm bed.`);
    note.hidden = !w.length; note.textContent = w.join(' ');
  }
  show.onchange = () => { S._show = show.value; persist(); draw(); };

  let t = null;
  function changed() { persist(); clearTimeout(t); t = setTimeout(() => { if (!view.hidden) draw(); }, 150); }

  dl.onclick = async () => {
    msg.textContent = 'Building the files…'; await new Promise(r => setTimeout(r, 30));
    try {
      const r = result(), files = r.parts.map(pt => ({ name: `${D.id}-${pt.name}.stl`, data: ctx.stl(pt.tris) }));
      const L = [D.title.toUpperCase(), 'Made in Workshop > 3D Prints.', '', 'SETTINGS'];
      for (const sec of D.sections) for (const fd of sec.fields) if (fd.k && fd.type !== 'preset' && (!fd.show || fd.show(r.p))) { const o = fd.options && fd.options.find(x => String(x[0]) === String(S[fd.k])); L.push(`  ${fd.label || sec.title}: ${o ? o[1] : S[fd.k]}`); }
      L.push('', 'PRINT');
      for (const pt of r.parts) L.push(`  ${pt.count} × ${D.id}-${pt.name}.stl   ${pt.what}`);
      if (D.tips) { L.push('', 'NOTES'); for (const tp of D.tips) L.push('  ' + tp); }
      files.push({ name: 'README.txt', data: new TextEncoder().encode(L.join('\r\n')) });
      const d = window.claude ? await window.claude.use('downloads') : null;
      if (!d) { msg.textContent = 'Downloads aren’t available in this view.'; return; }
      await d.save({ filename: `${D.id}.zip`, data: ctx.zipStore(files) });
      msg.textContent = 'Saved. Unzip it and open the STL files in your slicer. The README lists how many of each to print.';
    } catch (e) { console.error(e); msg.textContent = e && e.code === 'declined' ? 'Download cancelled.' : e && e.code === 'tap_again' ? 'Tap the button again to save.' : 'That did not save. Try again.'; }
  };

  sync(true);
  return { key: D.id, tab: tabBtn, view, draw };
}
