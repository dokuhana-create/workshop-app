/* Shared pieces for armour designs: curved shells that follow a body part, built from circumferences.
   A shell is a band of an ellipse that changes with height: at each height z it has semi-axes a, b (inside,
   already including padding), covers the angles from t0 to t1 (degrees, 90 = the front or top), and has a
   thickness that can vary to make an edge roll, a ridge or knuckle bumps. Shells are modelled standing up, so
   they print upright without supports. */

/* the semi-axes of an ellipse with circumference C and width/depth ratio k (Ramanujan's perimeter) */
export function ellipseFor(C, k) {
  const b = C / (Math.PI * (3 * (k + 1) - Math.sqrt((3 * k + 1) * (k + 3))));
  return { a: k * b, b };
}
export const smooth = (e0, e1, x) => { const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0))); return t * t * (3 - 2 * t); };
const rad = d => d * Math.PI / 180;

/* o: { L, nz, nu, ring(z) -> {a, b}, span(z) -> [t0, t1], th, extra(s, z, arcLen, t) -> mm (outside only),
        bulge(t, z) -> mm (pushes the whole plate outwards, e.g. a chest or a visor snout), closed } */
export function shell(W, o) {
  const nz = o.nz || Math.max(8, Math.round(o.L / 3)), nu = o.nu || 72, C = !!o.closed, cols = C ? nu : nu + 1;
  const V = [], idx = (side, i, k) => ((side * (nz + 1) + k) * cols + (C ? i % nu : i));
  const arc = (z, t0, t1) => { const { a, b } = o.ring(z); let L = 0, px = a * Math.cos(rad(t0)), py = b * Math.sin(rad(t0)); for (let j = 1; j <= 24; j++) { const t = rad(t0 + (t1 - t0) * j / 24), x = a * Math.cos(t), y = b * Math.sin(t); L += Math.hypot(x - px, y - py); px = x; py = y; } return L; };
  for (const side of [0, 1]) for (let k = 0; k <= nz; k++) {
    const z = o.L * k / nz, { a, b } = o.ring(z), [t0, t1] = o.span(z), al = arc(z, t0, t1);
    for (let i = 0; i < cols; i++) {
      const s = i / nu, t = rad(t0 + (t1 - t0) * s), c = Math.cos(t), sn = Math.sin(t);
      let nx = b * c, ny = a * sn; const nl = Math.hypot(nx, ny); nx /= nl; ny /= nl;
      const tdeg = t0 + (t1 - t0) * s, bu = o.bulge ? o.bulge(tdeg, z) : 0;
      const off = bu + (side ? o.th + (o.extra ? o.extra(s, z, al, tdeg) : 0) : 0);
      V.push(a * c + nx * off, b * sn + ny * off, z);
    }
  }
  const T = [], q = (A, B, C, D) => T.push(A, B, C, A, C, D);
  for (let k = 0; k < nz; k++) for (let i = 0; i < nu; i++) {
    q(idx(1, i, k), idx(1, i + 1, k), idx(1, i + 1, k + 1), idx(1, i, k + 1));       /* outside */
    q(idx(0, i, k), idx(0, i, k + 1), idx(0, i + 1, k + 1), idx(0, i + 1, k));       /* inside */
  }
  for (let i = 0; i < nu; i++) {
    q(idx(0, i, 0), idx(0, i + 1, 0), idx(1, i + 1, 0), idx(1, i, 0));               /* bottom */
    q(idx(0, i, nz), idx(1, i, nz), idx(1, i + 1, nz), idx(0, i + 1, nz));           /* top */
  }
  if (!C) for (let k = 0; k < nz; k++) {
    q(idx(0, 0, k), idx(1, 0, k), idx(1, 0, k + 1), idx(0, 0, k + 1));               /* start edge */
    q(idx(0, nu, k), idx(0, nu, k + 1), idx(1, nu, k + 1), idx(1, nu, k));           /* end edge */
  }
  /* make sure it faces outwards */
  let vol = 0;
  for (let j = 0; j < T.length; j += 3) { const [A, B, C] = [T[j], T[j + 1], T[j + 2]].map(x => [V[3 * x], V[3 * x + 1], V[3 * x + 2]]); vol += A[0] * (B[1] * C[2] - B[2] * C[1]) - A[1] * (B[0] * C[2] - B[2] * C[0]) + A[2] * (B[0] * C[1] - B[1] * C[0]); }
  if (vol < 0) for (let j = 0; j < T.length; j += 3) { const x = T[j + 1]; T[j + 1] = T[j + 2]; T[j + 2] = x; }
  const mesh = new W.Mesh({ numProp: 3, vertProperties: new Float32Array(V), triVerts: new Uint32Array(T) });
  return W.Manifold.ofMesh(mesh);
}

/* a point and frame on the shell's inside surface: position, outward normal, tangent (towards larger angles) */
export function frame(o, t, z) {
  const { a, b } = o.ring(z), r = rad(t), c = Math.cos(r), s = Math.sin(r);
  let nx = b * c, ny = a * s; const nl = Math.hypot(nx, ny); nx /= nl; ny /= nl;
  const bu = o.bulge ? o.bulge(t, z) : 0;
  return { p: [a * c + nx * bu, b * s + ny * bu, z], n: [nx, ny, 0], tg: [-ny, nx, 0], r: Math.hypot(a * c, b * s) + bu };
}
/* a box centred at p, with its sides along u, v, w (unit vectors) */
export function boxAt(W, size, p, u, v, w) {
  return W.Manifold.cube(size, true).transform([...u, 0, ...v, 0, ...w, 0, ...p, 1]);
}
/* a cylinder from point A to point B */
export function rod(W, A, B, r, seg = 24) {
  const d = [B[0] - A[0], B[1] - A[1], B[2] - A[2]], L = Math.hypot(...d), w = d.map(x => x / L);
  const u0 = Math.abs(w[2]) < .9 ? [0, 0, 1] : [1, 0, 0];
  let u = [u0[1] * w[2] - u0[2] * w[1], u0[2] * w[0] - u0[0] * w[2], u0[0] * w[1] - u0[1] * w[0]]; const ul = Math.hypot(...u); u = u.map(x => x / ul);
  const v = [w[1] * u[2] - w[2] * u[1], w[2] * u[0] - w[0] * u[2], w[0] * u[1] - w[1] * u[0]];
  return W.Manifold.cylinder(L, r, r, seg).transform([...u, 0, ...v, 0, ...w, 0, ...A, 1]);
}
/* a raised rim along the edges (bead) and a ridge down the middle, as extra thickness */
export function trims({ bead = 0, beadW = 4, ridge = 0, ridgeW = 9, L }) {
  return (s, z, al) => {
    const ds = Math.min(s, 1 - s) * al, dz = Math.min(z, L - z), d = Math.min(ds, dz);
    let e = 0;
    if (bead) e += bead * Math.max(0, 1 - d / beadW) ** 1.5;
    if (ridge) { const q = ((s - .5) * al) / (ridgeW / 2); e += ridge * Math.exp(-q * q); }
    return e;
  };
}
/* holes through the shell at angle t and height z (sewing holes, strap slots) */
export function holeAt(W, o, t, z, w, h, depth = 30) {
  const f = frame(o, t, z);
  return boxAt(W, [w, depth, h], f.p, f.tg, f.n, [0, 0, 1]);
}
export function roundHole(W, o, t, z, d) {
  const f = frame(o, t, z), A = f.p.map((x, i) => x - f.n[i] * 8), B = f.p.map((x, i) => x + f.n[i] * 12);
  return rod(W, A, B, d / 2, 12);
}
/* the angle that is `mm` along the inside surface from angle t at height z (positive = towards larger angles) */
export function angleAlong(o, t, z, mm) { return t + (mm / frame(o, t, z).r) * 180 / Math.PI; }
