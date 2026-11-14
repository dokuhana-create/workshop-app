/* Mantis catch cup: a cup for moving a mantis while you clean, rearrange or check a moult.
   A sliding gate closes the mouth: it slides in through a slot in the rim and runs in a groove all the way round,
   so it can't fall out. A handle slides onto a dovetail on the side, so it comes off for cleaning and can be swapped
   for a longer one that reaches into the enclosure. No glue, no supports.
   Built with the Manifold library (lib/manifold), so every STL is closed. Units are millimetres, Z up.

   Use: const C = makeCatchCup(wasm, cleanup)                                                                      */

export const CUP_DEF = { len: 65, D: 85, H: 100, vents: true, handle: 'short', handleL: 70, gateFit: .3 };
export const PRESETS = [
  ['nymph', 'Small nymph', 15], ['orchidM', 'Orchid, adult male', 30], ['orchidF', 'Orchid, adult female', 65], ['deroF', 'Dead leaf, adult female', 90]
];
/* room to stand and turn: a little wider than the mantis is long, and deeper still */
export const sizeFor = len => ({ D: Math.round(Math.min(160, Math.max(45, len + 20)) / 5) * 5, H: Math.round(Math.min(200, Math.max(50, len * 1.3 + 15)) / 5) * 5 });

const num = (v, d) => { const n = parseFloat(v); return isFinite(n) ? n : d; };
export function deriveCup(o) {
  const p = { ...CUP_DEF, ...o };
  for (const k of ['len', 'D', 'H', 'handleL', 'gateFit']) p[k] = num(p[k], CUP_DEF[k]);
  p.D = Math.min(180, Math.max(35, p.D)); p.H = Math.min(220, Math.max(35, p.H));
  p.R = p.D / 2; p.wall = 2; p.floor = 2; p.foot = 2;
  p.gateT = 2; p.chan = p.gateT + .5;             /* slot height */
  p.Rg = p.R + 2.5;                               /* groove radius */
  p.Ro = p.R + p.wall + 3.5;                      /* collar outside */
  p.collarH = 12; p.top = p.foot + p.floor + p.H; /* rim height */
  p.chanZ = p.top - 5 - p.chan / 2;               /* slot bottom */
  return p;
}

export function makeCatchCup(W, cleanup) {
  const { Manifold: M, CrossSection: CS } = W;
  const SEG = 128;
  const cyl = (h, r, z = 0, seg = SEG, r2) => M.cylinder(h, r, r2 === undefined ? r : r2, seg).translate([0, 0, z]);
  const box = (x0, y0, z0, x1, y1, z1) => M.cube([x1 - x0, y1 - y0, z1 - z0]).translate([x0, y0, z0]);
  const holeGrid = (r, d, pitch) => { const o = []; for (let y = -r; y <= r; y += pitch * .866) { const row = Math.round((y + r) / (pitch * .866)); for (let x = -r + (row % 2) * pitch / 2; x <= r; x += pitch) if (Math.hypot(x, y) <= r - d / 2) o.push(CS.circle(d / 2, 12).translate([x, y])); } return o; };

  /* dovetail: neck at the cup side, wider head inside the block */
  const DT = { neck: 6, head: 10, deep: 4.5 };
  const dovetail = (c) => CS.ofPolygons([[[0, -DT.neck / 2 - c], [DT.deep + c, -DT.head / 2 - c], [DT.deep + c, DT.head / 2 + c], [0, DT.neck / 2 + c]]]);
  const HANDLE_T = 8, BLOCK = { w: 22, out: 10, h: 20 };

  function cup(p) {
    const Rw = p.R + p.wall;
    let m = M.union([
      cyl(p.top, Rw),                                          /* wall */
      cyl(p.collarH, p.Ro, p.top - p.collarH),                 /* collar round the mouth */
      cyl(3, Rw, p.top - p.collarH - 3, SEG, p.Ro)             /* 45° step under the collar */
    ]);
    /* hollow, floor and foot ring */
    m = m.subtract(cyl(p.H + 1, p.R, p.foot + p.floor));
    m = m.subtract(cyl(p.foot, Rw - 2.5, -.01));
    for (const a of [0, 90, 180, 270]) m = m.subtract(box(-2, -Rw - 1, -.01, 2, Rw + 1, p.foot - .5).rotate([0, 0, a + 45]));
    if (p.vents) m = m.subtract(M.extrude(CS.union(holeGrid(p.R - 3, 1.6, 4.2)), p.floor + 2).translate([0, 0, p.foot - 1]));
    /* the gate slot: open on the +x side, a groove all the way round the rest */
    const slot = CS.hull([CS.circle(p.Rg, SEG), CS.circle(p.Rg, SEG).translate([p.Ro + 40, 0])]);
    m = m.subtract(M.extrude(slot, p.chan).translate([0, 0, p.chanZ]));
    /* soft inside edge at the rim */
    m = m.subtract(cyl(1.2, p.R, p.top - 1.2, SEG, p.R + 1.2));
    /* handle block on the −x side, below the collar, with a dovetail slot open at the top */
    if (p.handle !== 'none') {
      const zb = Math.max(p.foot + 4, p.top - p.collarH - 3 - BLOCK.h - 2), x0 = -Rw - BLOCK.out;
      let b = box(x0, -BLOCK.w / 2, zb, -Rw + 2, BLOCK.w / 2, zb + BLOCK.h);
      b = b.subtract(cyl(BLOCK.h + 2, p.R + .5, zb - 1));
      const ch = M.extrude(dovetail(.2), HANDLE_T + .6).rotate([0, 0, 0]).translate([x0 - .01, 0, zb + BLOCK.h - HANDLE_T - .6 + .01]);
      m = m.add(b).subtract(ch);
    }
    return m;
  }
  function gate(p) {
    const r = p.Rg - p.gateFit, tab = p.Ro + 22;
    let s = CS.circle(r, SEG).add(CS.square([tab, 26]).translate([0, -13]));
    s = s.add(CS.circle(13, 48).translate([tab, 0]));
    if (p.vents) s = s.subtract(CS.union(holeGrid(p.R - 3, 1.6, 4.2)));
    s = s.subtract(CS.circle(4, 32).translate([tab + 2, 0]));   /* finger hole, also to hang it up */
    let m = M.extrude(s, p.gateT);
    /* grip ridges on the tab */
    for (let i = 0; i < 4; i++) m = m.add(M.cube([1.2, 18, .8]).translate([p.Ro + 4 + i * 3.5, -9, p.gateT]));
    return m;
  }
  function handle(p) {
    const L = Math.max(40, p.handleL);
    let s = CS.hull([CS.square([1, 16]).translate([-1, -8]), CS.circle(9, 48).translate([-L, 0])]);
    s = s.subtract(CS.circle(3.5, 32).translate([-L, 0]));
    const t = dovetail(0);
    let m = M.extrude(s, HANDLE_T).add(M.extrude(t, HANDLE_T));
    /* the tongue sits in the block, so the bar starts at the block face */
    return m;
  }

  function toTris(m) {
    const mesh = m.getMesh(), P = mesh.vertProperties, np = mesh.numProp, T = mesh.triVerts, out = new Float32Array(T.length * 3);
    for (let i = 0; i < T.length; i++) { const v = T[i] * np; out[i * 3] = P[v]; out[i * 3 + 1] = P[v + 1]; out[i * 3 + 2] = P[v + 2]; }
    return out;
  }
  const CACHE = new Map();
  function parts(p) {
    const key = JSON.stringify([p.D, p.H, p.vents, p.handle, p.handleL, p.gateFit]);
    if (CACHE.has(key)) return CACHE.get(key);
    let r;
    try {
      const c = cup(p), g = gate(p), out = { cup: c, gate: g };
      if (p.handle !== 'none') out.handle = handle(p);
      r = {};
      for (const k in out) { const m = out[k], bb = m.boundingBox(); r[k] = { tris: toTris(m), vol: m.volume(), size: [0, 1, 2].map(i => bb.max[i] - bb.min[i]) }; }
      /* where things sit when assembled, for the preview */
      const Rw = p.R + p.wall, zb = Math.max(p.foot + 4, p.top - p.collarH - 3 - BLOCK.h - 2);
      r.place = { gate: [0, 0, p.chanZ + .25], handle: [-Rw - BLOCK.out, 0, zb + BLOCK.h - HANDLE_T - .55] };
    } finally { if (cleanup) cleanup(); }
    if (CACHE.size > 30) CACHE.clear();
    CACHE.set(key, r); return r;
  }
  return { parts };
}
