/* Costume armour: the jester. Harlequin pauldrons (a cap and two lames ending in points with little balls that
   carry jingle bells) and a harlequin half mask with upswept points. Two colours (base and raised harlequin
   diamonds for the CFS) or one colour with every other diamond pierced. Plates are sewn or laced on; bells hang
   on jump rings. Units: mm, Z up. Built with the Manifold library. */
import { surface, draw, alongEdge, makePiece, printPose, weld, ellipseFor, smooth } from './prints-filigree-lib.js?v=1';

const PIECES = [['pauldrons', 'Pauldrons'], ['mask', 'Half mask'], ['all', 'Both']];

export default {
  id: 'jester', title: 'Costume armour: jester',
  intro: 'Harlequin pauldrons with bell-tipped points and a half mask with upswept points, in two colours or pierced in one. Sew or lace them onto the costume; hang small jingle bells from the points.',
  defaults: { piece: 'pauldrons', mode: 'two', th: 2, relief: 1, arm: 340, sleeve: 6, headC: 550, ipd: 63, faceW: 135, maskH: 80, foam: 3, diamond: 26 },
  derive(o) {
    const p = { ...this.defaults, ...o };
    for (const k in this.defaults) if (typeof this.defaults[k] === 'number') p[k] = isFinite(+p[k]) ? +p[k] : this.defaults[k];
    return p;
  },
  sections: [
    { title: 'Piece', fields: [{ k: 'piece', type: 'seg', options: PIECES }] },
    { title: 'Finish', fields: [
      { k: 'mode', type: 'seg', options: [['two', 'Two colours (CFS)'], ['pierced', 'One colour, pierced']] },
      { k: 'diamond', type: 'num', label: 'Diamond width (mm)', min: 16, max: 40, step: 1 },
      { k: 'th', type: 'num', label: 'Plate thickness (mm)', min: 1.4, max: 3, step: .1 },
      { k: 'relief', type: 'num', label: 'Raised pattern height (mm)', min: .6, max: 2, step: .1 }],
      hint: 'Two colours: import the "-base" and "-filigree" files together as one object and give each part a filament (red and black, or teal and gold). One colour: every other diamond is cut out, like harlequin lace.' },
    { title: 'Shoulders', fields: [
      { k: 'arm', type: 'num', label: 'Upper arm round (armpit)', min: 200, max: 600, step: 1 },
      { k: 'sleeve', type: 'num', label: 'Room for the sleeve underneath (mm)', min: 0, max: 30, step: 1 }] },
    { title: 'Face', fields: [
      { k: 'headC', type: 'num', label: 'Head round, over the brow', min: 450, max: 700, step: 1 },
      { k: 'faceW', type: 'num', label: 'Temple to temple, across the front', min: 100, max: 180, step: 1 },
      { k: 'ipd', type: 'num', label: 'Between the pupils', min: 50, max: 75, step: 1 },
      { k: 'maskH', type: 'num', label: 'Mask height (cheek to brow)', min: 55, max: 120, step: 1 },
      { k: 'foam', type: 'num', label: 'Foam inside the mask (mm)', min: 0, max: 8, step: .5 }],
      hint: 'Pupil distance: an optician\'s prescription often lists it, or measure in a mirror with a ruler held under your eyes. Temple to temple: a tape measure laid across the forehead from one temple to the other.' }
  ],
  tips: [
    'PLA, 0.12–0.16 mm layers, 3 walls. Every piece prints standing up as exported, with a brim. The tops of the mask\'s eye holes are short bridges, which print fine without support.',
    'Pauldrons: lace or rivet the cap and the two lames onto two leather or webbing strips running down the outside of the arm, each lame overlapping the one below. Sew the cap to the shoulder of the doublet through the holes along its top edge.',
    'Bells: 10–15 mm jingle bells on 6 mm jump rings through the small holes in the balls at the points.',
    'Mask: line it with 3 mm craft foam, cut away round the eyes, and tie it with ribbon or elastic through the two holes at each side.',
    'Paint: the diamonds in two colours come out sharpest printed in two filaments; for one colour, prime, paint the raised diamonds, and add a gloss varnish.'
  ],
  build(W, p) {
    const M = W.Manifold, d = draw(W), { CS, circle, union, bez, stroke, leaf, poly } = d;
    const specs = [];
    const holesOf = (out, step = 7.5, inset = 3.4) => alongEdge(out, inset, step);
    const beads = (out, inset, step, r) => union(alongEdge(out, inset, step).map(([u, z]) => circle(u, z, r, 12)));
    const holesClear = (pts, windows) => pts.filter(([u, z]) => windows.isEmpty() || windows.offset(3.2, 'Round', 2, 24).intersect(circle(u, z, .5, 8)).area() <= 0);
    /* harlequin: diamonds tiling the plane, A and B alternating; returns the A diamonds, the B diamonds and the lattice lines */
    const harlequin = (box, dw, dh, x0 = 0, z0 = 0, lw = 1.3) => {
      const A = [], B = [], ln = [];
      const [u0, za, u1, zb] = box;
      for (let i = Math.floor((u0 - x0) / dw) - 1; i <= Math.ceil((u1 - x0) / dw) + 1; i++)
        for (let j = Math.floor((za - z0) / dh) - 1; j <= Math.ceil((zb - z0) / dh) + 1; j++) {
          A.push(d.diamond(x0 + i * dw, z0 + j * dh, dw, dh)); B.push(d.diamond(x0 + (i + .5) * dw, z0 + (j + .5) * dh, dw, dh));
        }
      const span = Math.max(u1 - u0, zb - za) * 2;
      for (let k = -40; k <= 40; k++) {
        const c = x0 + (k + .5) * dw;
        ln.push(stroke([[c - span, z0 - span * dh / dw], [c + span, z0 + span * dh / dw]], lw), stroke([[c - span, z0 + span * dh / dw], [c + span, z0 - span * dh / dw]], lw));
      }
      return { A: union(A).subtract(union(ln).offset(.1)), B: union(B), lines: union(ln) };
    };
    /* a point ending in a ball, hanging from (x, zTop) down to (x, zTop - len) */
    const bellPoint = (x, zTop, len, w, r = 5) => union([d.polyFix([[x - w / 2, zTop + 2], [x + w / 2, zTop + 2], [x + 1.6, zTop - len + r * .6], [x - 1.6, zTop - len + r * .6]]), circle(x, zTop - len, r, 32)]);

    /* ================= pauldrons ================= */
    if (p.piece === 'pauldrons' || p.piece === 'all') {
      const ra = p.arm / (2 * Math.PI) + p.sleeve + 16, capH = 95, CL = p.th + p.relief + 1.2;
      /* cap: a dome over the shoulder */
      const capS = surface({ ring: z => { const r = ra * (1 - .42 * smooth(capH * .45, capH + 10, z)); return { a: r, b: r }; }, tc: 90 });
      const Wc = z => capS.arcTo(108, Math.max(0, z)) * (1 - .1 * smooth(capH * .5, capH, z));
      const right = [[0, capH + 16]];
      /* the top edge: three jester points (one in the middle, one each side) */
      for (const q of bez([0, capH + 16], [8, capH + 4], [Wc(capH) * .3, capH + 2], [Wc(capH) * .48, capH + 14], 10)) right.push(q);
      for (const q of bez([Wc(capH) * .48, capH + 14], [Wc(capH) * .58, capH], [Wc(capH) * .9, capH], [Wc(capH - 6), capH - 6], 10)) right.push(q);
      for (let z = capH - 14; z >= 8; z -= 8) right.push([Wc(z), z]);
      for (const q of bez([Wc(8), 8], [Wc(0) * .7, -2], [Wc(0) * .3, 2], [0, 0], 12)) right.push(q);
      const capOut = d.polyFix([...right, ...right.slice(1, -1).reverse().map(([u, z]) => [-u, z])]).add(circle(0, capH + 16, 4.5, 24)).add(d.mirrorU(circle(Wc(capH) * .48, capH + 14, 4, 24)));
      const dw = p.diamond, dh = dw * 1.45;
      const hq = harlequin([-200, -20, 200, capH + 30], dw, dh, 0, capH * .45);
      const frame = capOut.subtract(capOut.offset(-6, 'Round', 2, 48));
      const inner = capOut.offset(-6, 'Round', 2, 48);
      let lines = union([hq.lines.intersect(inner), p.mode === 'pierced' ? null : hq.A.intersect(inner), beads(capOut, 3.4, 6, .8)]);
      const solids = p.mode === 'pierced' ? hq.B.intersect(inner).offset(-.6, 'Round', 2, 12) : null;
      specs.push({ name: 'pauldron-cap', what: 'Pauldron cap (one per shoulder)', surf: capS, outline: capOut, lines, solids, holes: holesOf(capOut, 8, 3.2), mirror: true, band: 6 });
      /* two lames, each a little wider, ending in bell points */
      [[1, 46, 4], [2, 50, 5]].forEach(([k, Lh, n]) => {
        const r0 = ra + k * CL;
        const S = surface({ ring: () => ({ a: r0, b: r0 }), tc: 90 });
        const Wl = S.arcTo(104 - k * 4, 0), top = Lh, ptLen = 26;
        const body = d.CS.square([2 * Wl, top - ptLen * .3]).translate([-Wl, ptLen * .3]);
        const pts = []; for (let i = 0; i < n; i++) pts.push(bellPoint(-Wl + (i + .5) * 2 * Wl / n, ptLen * .3 + 1, ptLen + 4, 2 * Wl / n * .9));
        const out = union([body, ...pts]).subtract(d.CS.square([400, 50]).translate([-200, top])).simplify(.05);
        const inner2 = body.offset(-5, 'Round', 2, 48);
        const hq2 = harlequin([-200, -40, 200, top + 10], dw, dh, (k % 2) * dw / 2, top * .5);
        const bellH = pts.map((_, i) => [-Wl + (i + .5) * 2 * Wl / n, ptLen * .3 + 1 - ptLen - 4]);
        const ln = union([hq2.lines.intersect(inner2), p.mode === 'pierced' ? null : hq2.A.intersect(inner2), beads(body, 3.4, 6, .8).intersect(body.offset(-2))]);
        const sol = p.mode === 'pierced' ? union([hq2.B.intersect(inner2).offset(-.6, 'Round', 2, 12), union(bellH.map(([u, z]) => circle(u, z, 5, 24)))]) : union(bellH.map(([u, z]) => circle(u, z, 5, 24)));
        const holes = holesOf(body.subtract(d.CS.square([400, 20]).translate([-200, -20])).intersect(body), 8, 3.2).filter(([u, z]) => z > ptLen * .3 + 4);
        specs.push({ name: `pauldron-lame-${k}`, what: `Pauldron lame ${k} (one per shoulder)`, surf: S, outline: out, lines: ln, solids: sol, holes: [...holes, ...bellH], holeD: 2.4, mirror: true, band: 5 });
      });
    }

    /* ================= half mask ================= */
    if (p.piece === 'mask' || p.piece === 'all') {
      const e = ellipseFor(p.headC * .97, Math.min(.92, (p.faceW / 2 + 10) / (p.headC / 2 / Math.PI * 1.1)));
      const H = p.maskH, eyeZ = H * .5;
      /* the face: an oval front, with the bridge of the nose standing out below the eyes */
      const nose = (u, z) => Math.max(0, 1 - Math.abs(u) / 15) ** 1.3 * Math.max(0, eyeZ - 4 - z) * .55;
      const S = surface({ ring: () => ({ a: e.a + p.foam, b: e.b + p.foam }), tc: 90, bulge: nose });
      const Wm = p.faceW / 2 + 6, ex = p.ipd / 2;
      /* the outline: cheeks, a dip over the nose, upswept points at the temples, three points on the brow */
      const right = [[0, H + 22]];
      for (const q of bez([0, H + 22], [6, H + 6], [14, H], [22, H + 2], 8)) right.push(q);
      for (const q of bez([22, H + 2], [30, H + 6], [34, H + 18], [38, H + 26], 8)) right.push(q);
      for (const q of bez([38, H + 26], [44, H + 8], [Wm * .8, H + 4], [Wm + 18, H + 22], 12)) right.push(q);
      for (const q of bez([Wm + 18, H + 22], [Wm + 4, H * .7], [Wm + 2, eyeZ - 6], [Wm - 6, H * .15], 12)) right.push(q);
      for (const q of bez([Wm - 6, H * .15], [ex + 10, -4], [ex - 6, 0], [12, eyeZ - 18], 12)) right.push(q);
      for (const q of bez([12, eyeZ - 18], [6, eyeZ - 12], [3, eyeZ - 10], [0, eyeZ - 10], 6)) right.push(q);
      let out = d.polyFix([...right, ...right.slice(1, -1).reverse().map(([u, z]) => [-u, z])]);
      out = out.add(circle(0, H + 22, 4.5, 24)).add(d.mirrorU(union([circle(38, H + 26, 4, 24), circle(Wm + 18, H + 22, 4.5, 24)]))).simplify(.05);
      /* almond eyes */
      const eye = s => leaf([s * (ex - 19), eyeZ - 1], [s * (ex + 17), eyeZ + 3], .5);
      const eyes = union([eye(1), eye(-1)]);
      const dw = p.diamond * .7, dh = dw * 1.45;
      const hq = harlequin([-120, -20, 120, H + 40], dw, dh, 0, eyeZ);
      const inner = out.offset(-4.5, 'Round', 2, 48).subtract(eyes.offset(3, 'Round', 2, 24));
      /* harlequin on the wearer's right half; the left half gets a painted-on tear, stars and a sweeping line */
      const halfR = d.CS.square([200, 300]).translate([-200, -50]);   /* u < 0 is the wearer's right */
      const lines = [hq.lines.intersect(inner).intersect(halfR), p.mode === 'pierced' ? null : hq.A.intersect(inner).intersect(halfR), beads(out, 3, 5.5, .75), eyes.offset(2.4, 'Round', 2, 24).subtract(eyes.offset(1.1, 'Round', 2, 24)).intersect(out)];
      lines.push(leaf([ex, eyeZ - 14], [ex + 2, eyeZ - 30], .55), d.star(ex + 14, eyeZ + 18, 5), d.star(ex - 8, eyeZ + 22, 3.5), d.star(ex + 26, eyeZ - 6, 3));
      lines.push(stroke(bez([4, H + 2], [20, H - 2], [Wm - 2, H + 8], [Wm + 12, H + 18]), 1.6, 1.1), stroke(bez([10, eyeZ - 16], [ex + 6, eyeZ - 22], [Wm - 8, eyeZ - 10], [Wm - 6, H * .3]), 1.4, 1));
      const solids = p.mode === 'pierced' ? union([hq.B.intersect(inner).intersect(halfR).offset(-.6, 'Round', 2, 12), inner.subtract(halfR)]) : null;
      /* ribbon holes at each side */
      const ribbon = [[Wm - 4, eyeZ + 6], [Wm - 4, eyeZ - 6], [-(Wm - 4), eyeZ + 6], [-(Wm - 4), eyeZ - 6]];
      const ballH = [[0, H + 22], [38, H + 26], [-38, H + 26], [Wm + 18, H + 22], [-(Wm + 18), H + 22]];
      specs.push({ name: 'mask', what: 'Half mask', surf: S, outline: out, lines: union(lines), windows: eyes, solids, holes: [...ribbon, ...ballH], holeD: 2.4, band: 4.5 });
    }

    /* ================= build and lay out ================= */
    const parts = [], asm = [], notes = [];
    let gx = 0;
    for (const sp of specs) {
      const bodies = makePiece(W, d, sp, p);
      const pose = printPose(W, bodies.map(b => b.m));
      for (const b of bodies) parts.push({ name: b.name, what: b.what, count: sp.mirror ? 2 : 1, m: weld(W, pose.place(b.m)) });
      if (Math.max(...pose.size) > 345) notes.push(`${sp.what} is larger than the 350 mm build volume.`);
      const bb = M.union(bodies.map(b => b.m)).boundingBox();
      for (const b of bodies) asm.push({ m: b.m.translate([gx - bb.min[0], 0, 0]), c: b.c });
      gx += bb.max[0] - bb.min[0] + 30;
    }
    if (p.mode === 'two') notes.push('Each piece is two files, "-base" and "-filigree", already lined up: import them together as one object.');
    const stats = [['Pieces', `${specs.reduce((a, s) => a + (s.mirror ? 2 : 1), 0)}`, p.mode === 'two' ? 'two colours' : 'one colour, pierced'], ['Diamonds', `${p.diamond} mm`, 'wide']];
    return { parts, asm, stats, notes, colors: { a: '--tray', c: '--lift' }, legend: [['--tray', 'Plate'], ['--lift', 'Harlequin']] };
  }
};
