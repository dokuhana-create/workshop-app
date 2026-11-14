/* Filigree armour: decorative plates drawn flat and then wrapped onto a body-shaped surface.
   Every piece is described in "unrolled" coordinates: u = mm along the surface, sideways from the middle line
   (positive = towards larger angles), z = mm up the body. A 2D outline, ornament lines, open windows and sewing
   holes are drawn with Manifold CrossSections, extruded to the plate thickness, finely subdivided and then bent
   onto the surface with warp(), so straight lines in the drawing follow the curve of the arm, leg or chest.
   Two finishes: "two" makes a base plate and a raised filigree layer as two separate bodies for a two-colour print
   (load both files together in the slicer as one object with two parts); "pierced" makes one body where the
   background between the ornament is cut away (openwork) and the ornament stands up in relief.
   Units: mm. Built with the Manifold library. */

const rad = d => d * Math.PI / 180;
export const smooth = (e0, e1, x) => { const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0))); return t * t * (3 - 2 * t); };
export function ellipseFor(C, k) {
  const b = C / (Math.PI * (3 * (k + 1) - Math.sqrt((3 * k + 1) * (k + 3))));
  return { a: k * b, b };
}

/* ---------------- the surface ---------------- */
/* S: { ring(z) -> {a, b} (the inside surface), tc: angle of the middle line (deg, 90 = +Y), bulge(u, z) -> mm } */
export function surface(S) {
  const tc = S.tc ?? 90, cache = new Map();
  const table = z => {
    const key = Math.round(z * 2) / 2;
    let T = cache.get(key);
    if (!T) {
      const { a, b } = S.ring(key), N = 720, us = new Float64Array(N + 1);
      /* arc length from tc-180 to tc+180 in half-degree steps */
      let L = 0, px = a * Math.cos(rad(tc - 180)), py = b * Math.sin(rad(tc - 180));
      us[0] = 0;
      for (let i = 1; i <= N; i++) { const t = rad(tc - 180 + i * .5), x = a * Math.cos(t), y = b * Math.sin(t); L += Math.hypot(x - px, y - py); us[i] = L; px = x; py = y; }
      const mid = us[360]; for (let i = 0; i <= N; i++) us[i] -= mid;
      T = us; cache.set(key, T);
    }
    return T;
  };
  /* the angle (deg) that is u mm along the surface from the middle line at height z */
  const tOf = (u, z) => {
    const T = table(z); let lo = 0, hi = 720;
    if (u <= T[0]) return tc - 180; if (u >= T[720]) return tc + 180;
    while (hi - lo > 1) { const m = (lo + hi) >> 1; if (T[m] <= u) lo = m; else hi = m; }
    const f = (u - T[lo]) / (T[hi] - T[lo]);
    return tc - 180 + (lo + f) * .5;
  };
  /* half the arc covered by +-deg either side of the middle line at height z */
  const arcTo = (deg, z) => { const T = table(z); return T[Math.round(360 + deg * 2)]; };
  const point = (u, z, w) => {
    const t = rad(tOf(u, z)), { a, b } = S.ring(z), c = Math.cos(t), s = Math.sin(t);
    let nx = b * c, ny = a * s; const nl = Math.hypot(nx, ny); nx /= nl; ny /= nl;
    const off = w + (S.bulge ? S.bulge(u, z) : 0);
    return [a * c + nx * off, b * s + ny * off, z];
  };
  const normal = (u, z) => { const t = rad(tOf(u, z)), { a, b } = S.ring(z), c = Math.cos(t), s = Math.sin(t); let nx = b * c, ny = a * s; const nl = Math.hypot(nx, ny); return [nx / nl, ny / nl, 0]; };
  return { ...S, tOf, arcTo, point, normal };
}

/* bend a flat drawing onto the surface: cs in (u, z), from w0 to w1 outwards from the inside surface */
export function wrap(W, surf, cs, w0, w1, edge = 3) {
  if (cs.isEmpty()) return null;
  /* close up places where two parts of the drawing touch at a single point */
  cs = cs.offset(.05, 'Round', 2, 12).offset(-.05, 'Round', 2, 12).simplify(.02);
  const m = W.Manifold.extrude(cs, w1 - w0).translate([0, 0, w0]).refineToLength(edge);
  return m.warp(v => { const P = surf.point(v[0], v[1], v[2]); v[0] = P[0]; v[1] = P[1]; v[2] = P[2]; });
}

/* ---------------- drawing helpers (2D, in mm) ---------------- */
export function draw(W) {
  const CS = W.CrossSection;
  const circle = (x, y, r, n) => CS.circle(r, n || Math.max(16, Math.min(64, Math.round(r * 5)))).translate([x, y]);
  const poly = pts => CS.ofPolygons([pts.map(p => [p[0], p[1]])]);
  const polyFix = pts => { let a = 0; for (let i = 0; i < pts.length; i++) { const p = pts[i], q = pts[(i + 1) % pts.length]; a += p[0] * q[1] - q[0] * p[1]; } return poly(a < 0 ? pts.slice().reverse() : pts); };
  const union = list => { const L = list.filter(x => x && !x.isEmpty()); return L.length ? CS.union(L) : CS.square([.001, .001]).translate([1e4, 1e4]); };
  const empty = () => CS.square([.001, .001]).translate([1e4, 1e4]);
  /* cubic Bezier through 4 points */
  const bez = (p0, p1, p2, p3, n = 24) => { const out = []; for (let i = 0; i <= n; i++) { const t = i / n, s = 1 - t; out.push([s * s * s * p0[0] + 3 * s * s * t * p1[0] + 3 * s * t * t * p2[0] + t * t * t * p3[0], s * s * s * p0[1] + 3 * s * s * t * p1[1] + 3 * s * t * t * p2[1] + t * t * t * p3[1]]); } return out; };
  /* a line drawn with a round pen whose width goes from w0 to w1 along it (Mucha's tapering whiplash lines) */
  const stroke = (pts, w0, w1 = w0) => {
    const segs = [];
    for (let i = 1; i < pts.length; i++) {
      const ra = (w0 + (w1 - w0) * (i - 1) / (pts.length - 1)) / 2, rb = (w0 + (w1 - w0) * i / (pts.length - 1)) / 2;
      segs.push(CS.hull([circle(pts[i - 1][0], pts[i - 1][1], ra, 12), circle(pts[i][0], pts[i][1], rb, 12)]));
    }
    return union(segs);
  };
  /* a spiral that ends a vine: from point p, turning `turns` times, shrinking */
  const spiral = (cx, cy, r0, a0, turns, dir = 1, n = 40) => { const pts = []; for (let i = 0; i <= n; i++) { const f = i / n, a = a0 + dir * f * turns * 2 * Math.PI, r = r0 * (1 - .78 * f); pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]); } return pts; };
  /* a leaf: the overlap of two circles, from p to q, with fullness k (0..1) */
  const leaf = (p, q, k = .35) => {
    const dx = q[0] - p[0], dy = q[1] - p[1], L = Math.hypot(dx, dy), h = L * k / 2;
    const R = (L * L / 4 + h * h) / (2 * h), d = R - h, mx = (p[0] + q[0]) / 2, my = (p[1] + q[1]) / 2, nx = -dy / L, ny = dx / L;
    return circle(mx + nx * d, my + ny * d, R, 96).intersect(circle(mx - nx * d, my - ny * d, R, 96));
  };
  const ring = (x, y, r, w) => circle(x, y, r + w / 2).subtract(circle(x, y, r - w / 2));
  /* a halo as in Mucha's posters: rings, a ring of mosaic tiles and a ring of dots */
  const halo = (x, y, R, w = 1.4) => {
    const parts = [ring(x, y, R, w * 1.3), ring(x, y, R * .8, w)];
    const tiles = []; const n = Math.max(12, Math.round(R * .55));
    let mos = ring(x, y, R * .9, R * .07);
    for (let i = 0; i < n; i++) { const a = i / n * 2 * Math.PI; tiles.push(CS.square([R * .3, w * .7], true).translate([R * .9, 0]).rotate(a * 180 / Math.PI).translate([x, y])); }
    mos = mos.subtract(union(tiles));
    parts.push(mos);
    for (let i = 0; i < n; i++) { const a = (i + .5) / n * 2 * Math.PI; parts.push(circle(x + R * 1.1 * Math.cos(a), y + R * 1.1 * Math.sin(a), w * .65, 12)); }
    return union(parts);
  };
  /* a stylised flower (lily / poppy): petals as leaves round a centre */
  const flower = (x, y, r, petals = 6, rot = 0, open = .45) => {
    const P = [];
    for (let i = 0; i < petals; i++) { const a = rot + i / petals * 2 * Math.PI; P.push(leaf([x + r * .25 * Math.cos(a), y + r * .25 * Math.sin(a)], [x + r * Math.cos(a), y + r * Math.sin(a)], open)); }
    return union(P).subtract(circle(x, y, r * .3)).add(ring(x, y, r * .2, r * .08)).add(circle(x, y, r * .09));
  };
  /* the outline of a petal or leaf only (for filigree, not filled) */
  const leafLine = (p, q, k, w) => leaf(p, q, k).subtract(leaf(p, q, k).offset(-w, 'Round'));
  /* a crescent moon */
  const crescent = (x, y, r, rot = 0) => circle(0, 0, r).subtract(circle(r * .42, r * .18, r * .86)).rotate(rot).translate([x, y]);
  /* a four-point star */
  const star = (x, y, r, rot = 45) => union([leaf([-r, 0], [r, 0], .28), leaf([0, -r], [0, r], .28)]).rotate(rot).translate([x, y]);
  /* a diamond (rhombus) */
  const diamond = (x, y, w, h) => poly([[x, y - h / 2], [x + w / 2, y], [x, y + h / 2], [x - w / 2, y]]);
  const mirrorU = cs => cs.add(cs.mirror([1, 0]));
  return { CS, circle, poly, polyFix, union, empty, bez, stroke, spiral, leaf, ring, halo, flower, leafLine, crescent, star, diamond, mirrorU };
}

/* points every `step` mm along the boundary of a CrossSection, `inset` mm inside it (for sewing holes) */
export function alongEdge(cs, inset, step) {
  const pts = [];
  const pg = cs.offset(-inset, 'Round', 2, 48).simplify(.05).toPolygons();
  for (const P of pg) {
    let L = 0; for (let i = 0; i < P.length; i++) { const p = P[i], q = P[(i + 1) % P.length]; L += Math.hypot(q[0] - p[0], q[1] - p[1]); }
    if (L < step * 3) continue;
    const n = Math.round(L / step), d = L / n; let acc = 0, next = 0;
    for (let i = 0; i < P.length && pts.length < 2000; i++) {
      const p = P[i], q = P[(i + 1) % P.length], sl = Math.hypot(q[0] - p[0], q[1] - p[1]);
      while (next <= acc + sl && next < L - d / 2) { const f = (next - acc) / sl; pts.push([p[0] + (q[0] - p[0]) * f, p[1] + (q[1] - p[1]) * f]); next += d; }
      acc += sl;
    }
  }
  return pts;
}

/* make one piece.
   spec: { name, what, surf, outline, lines (ornament), solids (areas kept solid when pierced), windows (always open),
           holes (round sewing holes, list of [u, z]), holeD, rim (raised border width) }
   p: { mode: 'two' | 'pierced', th, relief } */
export function makePiece(W, d, spec, p) {
  const { CS } = d, th = p.th, h = p.relief, rimW = spec.rim ?? 1.8, holeD = spec.holeD ?? 1.8;
  const out = spec.outline;
  const holes = d.union((spec.holes || []).map(([u, z]) => d.circle(u, z, holeD / 2, 14)));
  const holeRings = d.union((spec.holes || []).map(([u, z]) => d.circle(u, z, holeD / 2 + 1.5, 18)));
  const windows = spec.windows || d.empty();
  const rim = out.subtract(out.offset(-rimW, 'Round', 2, 48));
  const lines = (spec.lines || d.empty()).intersect(out);
  const winRims = windows.offset(1.4, 'Round', 2, 48).subtract(windows).intersect(out);
  const bodies = [];
  if (p.mode === 'pierced') {
    /* openwork: keep the rim, the ornament, the solid panels and a ring round every hole; cut the rest away */
    /* openwork: keep a solid border band, the ornament, the solid panels and a ring round every hole; cut the rest away */
    const band = out.subtract(out.offset(-(spec.band ?? 7.6), 'Round', 2, 48));
    let plate = out.intersect(d.union([band, lines.offset(.25, 'Round', 2, 24), spec.solids || d.empty(), holeRings, winRims]));
    plate = plate.subtract(windows).subtract(holes);
    /* keep only the lace that hangs together: anything not joined to the main piece would fall out */
    const isl = plate.decompose(); isl.sort((x, y) => y.area() - x.area());
    plate = isl[0];
    const relief = d.union([rim, lines, winRims]).intersect(plate.offset(-.3, 'Round', 2, 24)).subtract(holes);
    const m = wrap(W, spec.surf, plate, 0, th);
    const r = relief.isEmpty() ? null : wrap(W, spec.surf, relief, th - .01, th + h);
    let one = r ? m.add(r) : m;
    /* anything not joined to the main piece after bending would fall out: drop it */
    const comps = one.decompose(); if (comps.length > 1) { comps.sort((x, y) => y.volume() - x.volume()); one = comps[0]; }
    bodies.push({ name: spec.name, what: spec.what, m: one, c: 'a' });
  } else {
    const base = out.subtract(windows).subtract(holes);
    const fil = d.union([rim, lines, winRims]).subtract(holes);
    const overWin = fil.intersect(windows);          /* ornament crossing a window goes all the way through */
    let mb = wrap(W, spec.surf, base, 0, th);
    let mf = wrap(W, spec.surf, fil, th, th + h);
    if (!overWin.isEmpty()) { const t = wrap(W, spec.surf, overWin, 0, th + h - .05); mf = mf ? mf.add(t) : t; }
    { const comps = mb.decompose(); if (comps.length > 1) { comps.sort((x, y) => y.volume() - x.volume()); mb = comps[0]; } }
    bodies.push({ name: spec.name + '-base', what: spec.what + ' (base colour)', m: mb, c: 'a' });
    if (mf) bodies.push({ name: spec.name + '-filigree', what: spec.what + ' (filigree colour)', m: mf, c: 'c' });
  }
  for (const b of bodies) b.m = weld(W, b.m.simplify(.04));
  return bodies;
}

/* lay a piece (or the parts of a two-colour piece, moved together) on the bed on whichever end has more to stand on */
export function printPose(W, ms) {
  const all = W.Manifold.union(ms.filter(Boolean));
  const bb = all.boundingBox();
  const footArea = m => { const sl = m.slice(m.boundingBox().min[2] + .3); return sl.area(); };
  const up = footArea(all), down = footArea(all.rotate([0, 180, 0]));
  const flip = down > up * 1.15;
  const tf = m => { let x = flip ? m.rotate([0, 180, 0]) : m; return x; };
  const all2 = tf(all), b2 = all2.boundingBox();
  return { flip, place: m => tf(m).translate([-(b2.min[0] + b2.max[0]) / 2, -(b2.min[1] + b2.max[1]) / 2, -b2.min[2]]), size: [b2.max[0] - b2.min[0], b2.max[1] - b2.min[1], b2.max[2] - b2.min[2]] };
}

/* booleans can leave two bits touching at a single point; weld each such point with a tiny cube so slicers see a clean solid */
export function weld(W, m) {
  for (let pass = 0; pass < 8; pass++) {
    const mesh = m.getMesh(), P = mesh.vertProperties, np = mesh.numProp, seen = new Set(), at = [];
    for (let v = 0; v < P.length / np; v++) { const k = P[v * np] + ',' + P[v * np + 1] + ',' + P[v * np + 2]; if (seen.has(k)) at.push([P[v * np], P[v * np + 1], P[v * np + 2]]); else seen.add(k); }
    if (!at.length) break;
    m = m.add(W.Manifold.union(at.map(q => W.Manifold.cube(.3 + pass * .12, true).rotate([pass * 17, pass * 29, pass * 11]).translate(q))));
  }
  const parts = m.decompose(), keep = parts.filter(c => Math.abs(c.volume()) > .05);
  return keep.length === parts.length ? m : W.Manifold.union(keep);
}
