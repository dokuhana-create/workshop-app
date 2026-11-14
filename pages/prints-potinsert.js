/* Pressure pot insert: a tiered, modular rack for a round resin pressure pot.
   Trays with a drip rim stack on spacer posts. Posts lock into the trays with a bayonet twist (push in, turn
   counter-clockwise seen from above), so there is no glue. A triangular frame hooks onto three lift posts on the
   top tray and carries the whole stack from its centre.
   Parts are solids made with the Manifold library (lib/manifold), so every STL is closed and manifold.
   Every part is modelled in its print orientation and prints without supports. Units are millimetres, Z up.

   Use: const PI = makePotInsert(wasm, cleanup)   (wasm = the set-up Manifold module, garbage-collected)        */

export const DEF = {
  potD: 290, potDepth: 330, wallGap: 7, bed: 350,
  floor: 4, rimH: 14, rimW: 2.4, ringOpen: 160, socketInset: 23,
  posts: '40, 60, 80, 100, 120', lifts: '40, 70, 100, 130', footH: 12,
  fit: .25, grooveFit: .3
};
/* the twist-lock is tuned as a set, so its sizes stay fixed */
export const J = {
  bossD: 28, bossH: 16, postD: 22, bore: 10, pegR: 8, pegL: 7.6, lugP: 1.6, lugH: 3, lugDeg: 36, twist: 30,
  padD: 34, padH: 3, neckD: 14, capD: 24, frameT: 9, lockDeg: 10, angles: [90, 210, 330], rimNotch: 60
};

const num = (v, d) => { const n = parseFloat(v); return isFinite(n) ? n : d; };
const list = s => String(s || '').split(/[^0-9.]+/).map(Number).filter(n => n > 0).map(n => Math.round(n));
const rad = d => d * Math.PI / 180;
const fmt2 = v => (Math.round(v * 100) / 100).toFixed(2);
const at = (r, deg) => [r * Math.cos(rad(deg)), r * Math.sin(rad(deg))];

export function derive(o) {
  const p = { ...DEF, ...o };
  for (const k in DEF) if (typeof DEF[k] === 'number') p[k] = num(p[k], DEF[k]);
  p.trayR = p.potD / 2 - p.wallGap;
  p.socketR = p.trayR - p.socketInset;
  p.postList = [...new Set(list(p.posts).filter(h => h >= J.bossH - p.floor + 8 && h <= 400))].sort((a, b) => a - b);
  p.liftList = [...new Set(list(p.lifts).filter(h => h >= 10 && h <= 400))].sort((a, b) => a - b);
  p.lowLugZ = 3; p.highLugZ = J.bossH - J.pegL + 1.6; p.sHigh = 0; p.sLow = J.twist;
  return p;
}

export function makePotInsert(W, cleanup) {
  const { Manifold: M, CrossSection: CS } = W;
  const SEGS = 64;
  const cyl = (h, r, z = 0, seg = SEGS, r2) => M.cylinder(h, r, r2 === undefined ? r : r2, seg).translate([0, 0, z]);
  const box = (x, y, z) => M.cube([x, y, z], true);
  const union = a => M.union(a);
  const revolveProfile = (pts, deg, start) => M.revolve(CS.ofPolygons([pts]), Math.max(4, Math.floor(SEGS * deg / 360) + 2), deg).rotate([0, 0, start]);
  const lugProfile = z0 => { const R = J.pegR, p = J.lugP, h = J.lugH; return [[R - 1, z0], [R, z0], [R + p, z0 + p], [R + p, z0 + h], [R - 1, z0 + h]]; };
  const lugs = z0 => union([0, 180].map(a => revolveProfile(lugProfile(z0), J.lugDeg, a - J.lugDeg / 2)));
  const sockets = p => J.angles.map(a => { const [x, y] = at(p.socketR, a); return { x, y, a }; });

  /* everything cut into one socket boss, boss at the origin, tray underside at z=0 */
  function socketCut(p, lite) {
    const R = J.pegR, c = p.grooveFit, half = J.lugDeg / 2 + 3, sweep = J.lugDeg + 6 + 2 * J.twist;
    const parts = [cyl(J.bossH + 2, R + p.fit, -1)];
    if (!lite) {
      for (const base of [0, 180]) {
        for (const [z0, s] of [[p.lowLugZ, p.sLow], [p.highLugZ, p.sHigh]]) {
          const g = CS.ofPolygons([lugProfile(z0)]).offset(c, 'Miter');
          parts.push(M.revolve(g, 41, sweep + 1.5).rotate([0, 0, base + s - half - 1.5])); /* starts a little before the slot, so no faces coincide */
        }
        parts.push(revolveProfile([[R - 1, -1], [R + J.lugP + c, -1], [R + J.lugP + c, p.lowLugZ + 1], [R - 1, p.lowLugZ + 1]], 2 * half, base + p.sLow - half));
        parts.push(revolveProfile([[R - 1, p.highLugZ + 1], [R + J.lugP + c, p.highLugZ + 1], [R + J.lugP + c, J.bossH + 1], [R - 1, J.bossH + 1]], 2 * half, base + p.sHigh - half));
      }
      parts.push(cyl(.8, R + p.fit + .8, -.01, SEGS, R + p.fit));
      parts.push(cyl(.8, R + p.fit, J.bossH - .79, SEGS, R + p.fit + .8));
      /* notches on the boss top: narrow = insert here, wide = ready for the next tray */
      for (const [ang, w] of [[p.sHigh, 1.4], [p.sHigh + J.twist, 2.4]]) parts.push(box(4, w, 1.6).translate([J.bossD / 2 - 1, 0, J.bossH]).rotate([0, 0, ang]));
    }
    return union(parts);
  }

  function tray(p, ring, lite) {
    const SEG = lite ? 96 : 192, R = p.trayR;
    const body = [cyl(p.floor, R, 0, SEG), cyl(p.rimH, R, 0, SEG).subtract(cyl(p.rimH + 2, R - p.rimW, -1, SEG))];
    for (const s of sockets(p)) body.push(cyl(J.bossH, J.bossD / 2, 0, lite ? 32 : SEGS).translate([s.x, s.y, 0]));
    let t = union(body);
    if (ring) {
      const ro = p.ringOpen / 2;
      t = t.subtract(cyl(p.floor + 2, ro, -1, SEG));
      t = t.add(cyl(Math.max(p.floor + 2, p.rimH - 4), ro + p.rimW, 0, SEG).subtract(cyl(p.rimH, ro, -1, SEG)));
    }
    const cut = socketCut(p, lite), cuts = [];
    for (const s of sockets(p)) cuts.push(cut.rotate([0, 0, s.a]).translate([s.x, s.y, 0]));
    /* finger notches in the rim, between the sockets, for lifting one tray on its own */
    for (const a of J.angles) { const b = a + J.rimNotch, [x, y] = at(R, b); cuts.push(box(40, 30, p.rimH).translate([0, 0, p.rimH / 2 + p.floor + 3]).rotate([0, 0, b - 90]).translate([x, y, 0])); }
    return t.subtract(union(cuts));
  }

  function peg(z0, len, top) {
    const R = J.pegR, pg = cyl(len, R, z0);
    return top ? pg.subtract(cyl(.7, R + 1, z0 + len - .7).subtract(cyl(.7, R, z0 + len - .7, SEGS, R - .7)))
               : pg.subtract(cyl(.7, R + 1, z0).subtract(cyl(.7, R - .7, z0, SEGS, R)));
  }
  const tick = () => box(2, 1.4, 10).translate([J.postD / 2, 0, J.pegL + 5]);

  function post(p, clear) {
    const L = J.pegL, B = clear - (J.bossH - p.floor);
    const m = union([peg(0, L, false), lugs(p.highLugZ - (J.bossH - L)), cyl(B, J.postD / 2, L), peg(L + B, L, true), lugs(L + B + p.lowLugZ)]);
    return m.subtract(union([cyl(L + B + L + 2, J.bore / 2, -1), tick(),
      cyl(1.2, J.postD / 2 + 1, L + B - 4).subtract(cyl(1.2, J.postD / 2 - .6, L + B - 4))]));
  }
  function foot(p) {
    const L = J.pegL, z = J.padH + p.footH;
    const m = union([cyl(J.padH, J.padD / 2), cyl(p.footH, J.postD / 2, J.padH), peg(z, L, true), lugs(z + p.lowLugZ)]);
    return m.subtract(union([cyl(z + L + 2, J.bore / 2, -1), box(J.padD + 2, 3, 2.2).translate([0, 0, 1]), box(3, J.padD + 2, 2.2).translate([0, 0, 1])]));
  }
  const neckL = () => J.frameT + 1.5, coneH = () => (J.capD - J.neckD) / 2, capH = h => h + neckL() + coneH() + 3;
  function liftPost(p, h) {
    const L = J.pegL, z = L + h, nl = neckL(), ch = coneH();
    const m = union([peg(0, L, false), lugs(p.highLugZ - (J.bossH - L)), cyl(h, J.postD / 2, L), cyl(nl, J.neckD / 2, z),
      cyl(ch, J.neckD / 2, z + nl, SEGS, J.capD / 2), cyl(3, J.capD / 2, z + nl + ch)]);
    return m.subtract(union([cyl(z - 2, J.bore / 2, -1), tick()]));
  }
  function frame(p) {
    const C = (r, x, y, n = SEGS) => CS.circle(r, n).translate([x, y]);
    const corners = [];
    for (const a of J.angles) for (const d of [0, J.lockDeg]) { const [x, y] = at(p.socketR, a + d); corners.push(C(22, x, y)); }
    const outline = CS.hull(corners);
    const wr = 80 * p.socketR / 115;
    const inner = CS.hull(J.angles.map(a => { const [x, y] = at(wr, a + J.lockDeg / 2); return C(1, x, y, 16); })).offset(16, 'Round');
    const hand = CS.hull([C(13, -35, 0), C(13, 35, 0)]);
    let shape = outline.subtract(inner).add(CS.square([200, 46], true).intersect(outline).subtract(hand)).subtract(hand);
    const holes = [];
    for (const a of J.angles) {
      const [hx, hy] = at(p.socketR, a + J.lockDeg); holes.push(C(J.capD / 2 + .75, hx, hy));
      for (let i = 0; i < 12; i++) {
        const [x0, y0] = at(p.socketR, a + J.lockDeg * i / 12), [x1, y1] = at(p.socketR, a + J.lockDeg * (i + 1) / 12);
        holes.push(CS.hull([C(J.neckD / 2 + .3, x0, y0), C(J.neckD / 2 + .3, x1, y1)]));
      }
    }
    shape = shape.subtract(CS.union(holes));
    const m = M.extrude(shape, J.frameT);
    /* small snap bumps so the frame can't turn loose while you carry it */
    const bumps = [];
    for (const a of J.angles) for (const s of [-1, 1]) { const [x, y] = at(p.socketR + s * (J.neckD / 2 + .3 + .55), a + 3.6); bumps.push(cyl(J.frameT, .9, 0, 24).translate([x, y, 0])); }
    return m.add(union(bumps));
  }

  /* fit test: a small square of tray with one socket, in three clearances, marked with 1, 2 or 3 holes */
  const FIT_STEP = .05;
  function testSocket(p, step) {
    const q = { ...p, fit: p.fit + step * FIT_STEP, grooveFit: p.grooveFit + step * FIT_STEP };
    const plate = M.extrude(CS.square([56, 56], true).offset(-6, 'Round').offset(6, 'Round'), p.floor);
    let m = plate.add(cyl(J.bossH, J.bossD / 2));
    const dots = step + 2, cuts = [socketCut(q, false)];
    for (let i = 0; i < dots; i++) cuts.push(cyl(p.floor + 2, 1.6, -1, 24).translate([-20 + i * 6, -20, 0]));
    return m.subtract(union(cuts));
  }

  function catalogue(p) {
    const c = [
      { id: 'tray', name: 'Tray', what: 'Full shelf with a drip rim', make: l => tray(p, false, l) },
      { id: 'tray-ring', name: 'Ring tray', what: `Open ${p.ringOpen} mm centre for tall moulds`, make: l => tray(p, true, l) },
      { id: 'foot', name: 'Foot', what: 'Under the lowest tray, keeps it off the pot floor', make: () => foot(p) }];
    for (const h of p.postList) c.push({ id: 'post-' + h, name: `Post ${h}`, what: `${h} mm of room for moulds between trays`, make: () => post(p, h), h });
    for (const h of p.liftList) c.push({ id: 'lift-post-' + h, name: `Lift post ${h}`, what: 'On the top tray, holds the lift frame', make: () => liftPost(p, h), h });
    c.push({ id: 'lift-frame', name: 'Lift frame', what: 'Carries the whole stack by the centre grip', make: () => frame(p) });
    c.push({ id: 'test-socket-1', name: 'Fit test socket, 1 hole', what: `Tighter: clearances ${fmt2(p.fit - FIT_STEP)} / ${fmt2(p.grooveFit - FIT_STEP)} mm`, make: () => testSocket(p, -1), test: true });
    c.push({ id: 'test-socket-2', name: 'Fit test socket, 2 holes', what: `As set: clearances ${fmt2(p.fit)} / ${fmt2(p.grooveFit)} mm`, make: () => testSocket(p, 0), test: true });
    c.push({ id: 'test-socket-3', name: 'Fit test socket, 3 holes', what: `Looser: clearances ${fmt2(p.fit + FIT_STEP)} / ${fmt2(p.grooveFit + FIT_STEP)} mm`, make: () => testSocket(p, 1), test: true });
    c.push({ id: 'test-post', name: 'Fit test post', what: 'Short post with both ends, to try in the test sockets', make: () => post(p, J.bossH - p.floor + 8), test: true });
    return c;
  }

  const CACHE = new Map();
  function toTris(m) {
    const mesh = m.getMesh(), P = mesh.vertProperties, np = mesh.numProp, T = mesh.triVerts, out = new Float32Array(T.length * 3);
    for (let i = 0; i < T.length; i++) { const v = T[i] * np; out[i * 3] = P[v]; out[i * 3 + 1] = P[v + 1]; out[i * 3 + 2] = P[v + 2]; }
    return out;
  }
  function part(p, id, lite) {
    const key = JSON.stringify([id, !!lite, p.potD, p.wallGap, p.floor, p.rimH, p.rimW, p.ringOpen, p.socketInset, p.footH, p.fit, p.grooveFit]);
    if (CACHE.has(key)) return CACHE.get(key);
    const it = catalogue(p).find(c => c.id === id); if (!it) return null;
    let r;
    try {
      const m = it.make(lite), bb = m.boundingBox(), st = m.status();
      r = { id, name: it.name, what: it.what, tris: toTris(m), vol: m.volume(), ok: st === 'NoError' || st === 0 || (st && st.value === 0),
        size: [0, 1, 2].map(i => bb.max[i] - bb.min[i]) };
    } finally { if (cleanup) cleanup(); }
    if (CACHE.size > 80) CACHE.clear();
    CACHE.set(key, r); return r;
  }

  /* levels: [{tray:'full'|'ring', post:height}] from the bottom up; the top level's post is not used */
  function stack(p, levels, lift) {
    const zs = []; let z = J.padH + p.footH;
    levels.forEach((L, i) => { zs.push(z); if (i < levels.length - 1) z += num(L.post, 60) + p.floor; });
    const zTop = zs[zs.length - 1] + J.bossH;
    let lh = lift === 'auto' || !lift ? null : num(lift, null);
    if (lh === null) { const ok = p.liftList.filter(h => p.potDepth - (zTop + capH(h)) >= 10); lh = ok.length ? ok[ok.length - 1] : p.liftList[0] || null; }
    const height = lh ? zTop + capH(lh) : zTop;
    const need = {}, add = (id, n) => { need[id] = (need[id] || 0) + n; };
    add('foot', 3);
    levels.forEach((L, i) => { add(L.tray === 'ring' ? 'tray-ring' : 'tray', 1); if (i < levels.length - 1) add('post-' + num(L.post, 60), 3); });
    if (lh) { add('lift-post-' + lh, 3); add('lift-frame', 1); }
    return { zs, zTop, lift: lh, height, room: p.potDepth - height, need };
  }
  function xform(tris, deg, dx, dy, dz) {
    const c = Math.cos(rad(deg)), s = Math.sin(rad(deg)), o = new Float32Array(tris.length);
    for (let i = 0; i < tris.length; i += 3) { const x = tris[i], y = tris[i + 1]; o[i] = x * c - y * s + dx; o[i + 1] = x * s + y * c + dy; o[i + 2] = tris[i + 2] + dz; }
    return o;
  }
  /* the stack placed in the pot, for the preview; posts are shown turned to their locked position */
  function assembly(p, levels, lift) {
    const st = stack(p, levels, lift), items = [], S = sockets(p), L = J.pegL, lock = 2 * J.twist;
    for (const s of S) items.push({ kind: 'foot', tris: xform(part(p, 'foot').tris, s.a + lock, s.x, s.y, 0) });
    levels.forEach((lv, i) => {
      const id = lv.tray === 'ring' ? 'tray-ring' : 'tray';
      items.push({ kind: 'tray', tris: xform(part(p, id, true).tris, 0, 0, 0, st.zs[i]) });
      if (i < levels.length - 1) { const pid = 'post-' + num(lv.post, 60); for (const s of S) items.push({ kind: 'post', tris: xform(part(p, pid).tris, s.a + lock, s.x, s.y, st.zs[i] + J.bossH - L) }); }
    });
    if (st.lift) {
      for (const s of S) items.push({ kind: 'lift', tris: xform(part(p, 'lift-post-' + st.lift).tris, s.a + lock, s.x, s.y, st.zTop - L) });
      items.push({ kind: 'frame', tris: xform(part(p, 'lift-frame').tris, 0, 0, 0, st.zTop + st.lift) });
    }
    return { st, items };
  }
  function potShell(p) {
    const R = p.potD / 2;
    try { return toTris(cyl(p.potDepth, R + 1.5, 0, 120).subtract(cyl(p.potDepth + 2, R, -1, 120))); }
    finally { if (cleanup) cleanup(); }
  }
  return { FIT_STEP, DEF, J, derive, catalogue, part, stack, assembly, potShell, sockets, xform };
}
