/* Costume armour: the necromancer. Decorative, asymmetric, sewn onto the costume.
   Art Nouveau filigree in the manner of Mucha (halos, whiplash lines, lilies, leaves, beaded edges), with
   Victorian and gothic-lolita touches (lace-like beading, lancet arches, crescent moons).
   Left arm: full gauntlet (cuff, hand, knuckles, jointed fingers with pointed tips), short bracer, couter, rerebrace.
   Right arm: a hand ornament over the back of the hand and a long bracer.
   Right leg: cuisse, poleyn, greave. Upper chest: a breastplate.
   Every plate is front-only, full of open space, and has a row of small holes round the edge to sew it on.
   Finish: two colours (base and raised filigree as two bodies for the CFS) or one colour with the background
   pierced away. Units: mm, Z up. Built with the Manifold library. */
import { surface, wrap, draw, alongEdge, makePiece, printPose, weld, ellipseFor, smooth } from './prints-filigree-lib.js?v=1';

const r1 = v => Math.round(v * 10) / 10;
const PIECES = [['breast', 'Breastplate'], ['gauntletL', 'Full gauntlet (left)'], ['handR', 'Hand ornament (right)'], ['bracerL', 'Bracer (left)'], ['bracerR', 'Bracer (right)'],
  ['couter', 'Couter (left)'], ['rerebrace', 'Rerebrace (left)'], ['cuisse', 'Cuisse (right)'], ['poleyn', 'Poleyn (right)'], ['greave', 'Greave (right)'], ['all', 'Everything']];

export default {
  id: 'necro', title: 'Costume armour: necromancer',
  intro: 'Filigree armour in the spirit of Mucha, Victorian vampires, elven and gothic-lolita costume: light, open and asymmetric, made to be sewn onto the costume. Left arm and right leg armoured; the breastplate covers the upper chest.',
  defaults: { piece: 'breast', mode: 'two', motif: 'moon', th: 2, relief: 1, lining: 2, pad: 2,
    chest: 990, breastH: 170, wrist: 160, forearm: 250, forearmL: 250, handC: 200, knuckle: 80, middle: 95, fingerC: 70,
    arm: 340, aboveElbow: 250, armL: 325, elbow: 300, thigh: 610, aboveKnee: 420, thighL: 430, knee: 450, ankle: 210, calf: 370, shinL: 320 },
  derive(o) {
    const p = { ...this.defaults, ...o };
    for (const k in this.defaults) if (typeof this.defaults[k] === 'number') p[k] = isFinite(+p[k]) ? +p[k] : this.defaults[k];
    p.room = p.lining + p.pad;
    return p;
  },
  sections: [
    { title: 'Piece', fields: [{ k: 'piece', type: 'seg', options: PIECES }] },
    { title: 'Finish', fields: [
      { k: 'mode', type: 'seg', options: [['two', 'Two colours (CFS)'], ['pierced', 'One colour, pierced']] },
      { k: 'motif', type: 'seg', options: [['moon', 'Crescent moon'], ['lily', 'Lily'], ['rose', 'Rose']] }],
      hint: 'Two colours: each plate comes as a base file and a filigree file. Load both at once in Creality Print, answer "yes" to loading them as one object with several parts, and give each part its own filament (for example black and silk gold). One colour: the background between the ornament is cut away, so the plate is lace-like; paint the raised lines afterwards.' },
    { title: 'Plates', fields: [
      { k: 'th', type: 'num', label: 'Plate thickness (mm)', min: 1.4, max: 3, step: .1 },
      { k: 'relief', type: 'num', label: 'Filigree height (mm)', min: .6, max: 2, step: .1 },
      { k: 'lining', type: 'seg', options: [[0, 'No lining'], [2, '2 mm felt or foam'], [3, '3 mm foam']] },
      { k: 'pad', type: 'num', label: 'Clothing underneath (mm)', min: 0, max: 10, step: .5 }],
      hint: 'The plates are sewn onto the costume through the small holes round their edges, so they need only a thin felt backing. Sand the back edges smooth.' },
    { title: 'Measurements (mm, over bare skin)', fields: [
      { k: 'chest', type: 'num', label: 'Chest under the arms', min: 600, max: 1600, step: 1 },
      { k: 'breastH', type: 'num', label: 'Breastplate height, from collarbone down', min: 110, max: 260, step: 1 },
      { k: 'wrist', type: 'num', label: 'Wrist round', min: 120, max: 240, step: 1 },
      { k: 'forearm', type: 'num', label: 'Forearm round, thickest', min: 180, max: 400, step: 1 },
      { k: 'forearmL', type: 'num', label: 'Wrist to elbow', min: 180, max: 330, step: 1 },
      { k: 'handC', type: 'num', label: 'Hand round, over the knuckles', min: 150, max: 280, step: 1 },
      { k: 'knuckle', type: 'num', label: 'Wrist to the middle knuckle', min: 60, max: 120, step: 1 },
      { k: 'middle', type: 'num', label: 'Middle finger length', min: 60, max: 120, step: 1 },
      { k: 'fingerC', type: 'num', label: 'Middle finger round', min: 45, max: 95, step: 1 },
      { k: 'arm', type: 'num', label: 'Upper arm round (armpit)', min: 200, max: 600, step: 1 },
      { k: 'aboveElbow', type: 'num', label: 'Upper arm round above the elbow', min: 150, max: 500, step: 1 },
      { k: 'armL', type: 'num', label: 'Upper arm length', min: 200, max: 450, step: 1 },
      { k: 'elbow', type: 'num', label: 'Elbow round, bent', min: 180, max: 500, step: 1 },
      { k: 'thigh', type: 'num', label: 'Thigh round at the top', min: 350, max: 900, step: 1 },
      { k: 'aboveKnee', type: 'num', label: 'Thigh round above the knee', min: 250, max: 700, step: 1 },
      { k: 'thighL', type: 'num', label: 'Hip bone to knee', min: 300, max: 650, step: 1 },
      { k: 'knee', type: 'num', label: 'Knee round, bent', min: 280, max: 700, step: 1 },
      { k: 'ankle', type: 'num', label: 'Ankle round', min: 150, max: 350, step: 1 },
      { k: 'calf', type: 'num', label: 'Calf round', min: 250, max: 600, step: 1 },
      { k: 'shinL', type: 'num', label: 'Ankle to knee', min: 220, max: 480, step: 1 }],
      hint: 'Filled in from your earlier measurements. Wrist to elbow and hand round are estimates: measure them before printing the arm pieces.' }
  ],
  tips: [
    'PLA (silk PLA looks lovely for the filigree), 0.12–0.16 mm layers, 3 walls, 100 % infill: the plates are thin, so they are all wall anyway. Each piece prints standing up as exported, with a brim. No supports.',
    'Two colours: select a base file and its filigree file together, import them, and say yes when Creality Print asks to load them as one object. Give the base and the filigree each a filament in the object list. Put the prime tower well away from the tall pieces.',
    'Sewing on: back each plate with felt or thin foam cut 2 mm smaller, then stitch through the edge holes into the garment with strong thread (upholstery or waxed linen). A curved needle helps. Small pieces such as the finger plates sew onto a thin, close-fitting glove.',
    'The full gauntlet: cuff, back of the hand and knuckle plate on the glove; the finger plates on the backs of the glove fingers, leaving a 2 mm gap at each joint so the fingers bend.',
    'Finish: a dark wash rubbed into the filigree and wiped off the raised lines makes the ornament stand out, as do pearl-coloured or gold-leaf highlights on the halos.'
  ],
  build(W, p) {
    const M = W.Manifold, d = draw(W), { CS, circle, union, bez, stroke, spiral, leaf, halo, flower, crescent, star, mirrorU } = d;
    const R = p.room, specs = [];
    const holesOf = (out, step = 7.5, inset = 3.6) => alongEdge(out, inset, step);
    const beads = (out, inset, step, r) => union(alongEdge(out, inset, step).map(([u, z]) => circle(u, z, r, 12)));
    const sym = right => { const L = right.slice(1, -1).reverse().map(([u, z]) => [-u, z]); return d.polyFix([...right, ...L]); };
    const join = (...curves) => { const out = []; for (const c of curves) for (const q of c) { const l = out[out.length - 1]; if (!l || Math.hypot(l[0] - q[0], l[1] - q[1]) > .05) out.push(q); } return out; };
    /* the centre motif inside a halo */
    const motif = (x, y, r) => {
      if (p.motif === 'lily') return flower(x, y, r * .82, 6, Math.PI / 2, .42);
      if (p.motif === 'rose') return union([flower(x, y, r * .85, 5, Math.PI / 2, .6), flower(x, y, r * .52, 5, Math.PI / 2 + Math.PI / 5, .6)]);
      return union([crescent(x, y, r * .62, -25), star(x + r * .42, y + r * .38, r * .2), star(x + r * .52, y - r * .2, r * .13), star(x + r * .1, y - r * .55, r * .1)]);
    };
    /* a whiplash vine ending in a spiral, with leaves along it */
    const vine = (pts, w0, w1, sp, leaves = []) => {
      const L = [stroke(pts, w0, w1)];
      if (sp) { const e = pts[pts.length - 1]; L.push(stroke(spiral(e[0] - sp.r * Math.cos(sp.a), e[1] - sp.r * Math.sin(sp.a), sp.r, sp.a, sp.turns ?? 1.3, sp.dir ?? 1), w1, w1 * .7)); }
      for (const [i, len, side, k] of leaves) {
        const a = pts[Math.min(pts.length - 2, i)], b = pts[Math.min(pts.length - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1;
        const nx = -dy / l * side, ny = dx / l * side, tx = dx / l, ty = dy / l;
        L.push(leaf(a, [a[0] + (nx * .8 + tx * .6) * len, a[1] + (ny * .8 + ty * .6) * len], k ?? .4));
      }
      return union(L);
    };

    /* a double border: the rim, a row of beads, then a fine inner line */
    const frameLines = (out, gap = 6.5) => { const o = out.offset(-gap, 'Round', 2, 48); return union([o.subtract(o.offset(-1.1, 'Round', 2, 48)), beads(out, gap * .55, 5.5, .8)]); };
    /* sun rays round a halo, as behind Mucha's heads */
    const rays = (x, y, R, n = 18) => { const L = []; for (let i = 0; i < n; i++) { const a = (i + .5) / n * 2 * Math.PI, r0 = R * 1.22, r1 = R * (i % 2 ? 1.5 : 1.75); L.push(stroke([[x + r0 * Math.cos(a), y + r0 * Math.sin(a)], [x + r1 * Math.cos(a), y + r1 * Math.sin(a)]], 1.3, .9)); } return union(L); };
    /* lace: a row of eyelets just inside a stretch of edge (windows), with little four-point stars between */
    const lace = (out, keep, inset = 10, step = 11, r = 2.6) => {
      const pts = alongEdge(out, inset, step).filter(keep), win = [], deco = [];
      pts.forEach((q, i) => { win.push(circle(q[0], q[1], r, 20)); const n = pts[i + 1]; if (n && Math.hypot(n[0] - q[0], n[1] - q[1]) < step * 1.6) deco.push(star((q[0] + n[0]) / 2, (q[1] + n[1]) / 2, r * .75)); });
      return { win: union(win), deco: union(deco), pts };
    };
    /* drop sewing holes that would land in or next to a window */
    const holesClear = (pts, windows) => pts.filter(([u, z]) => windows.isEmpty() || !windows.offset(3.2, 'Round', 2, 24).decompose().some(c => c.intersect(circle(u, z, .5, 8)).area() > 0));

    /* ================= breastplate: the upper chest ================= */
    if (want('breast')) {
      const H = p.breastH;
      const ring = z => { const u = Math.max(-.2, z / H), e = ellipseFor(p.chest * (1 - .07 * u), 1.3 + .25 * u); return { a: e.a + R, b: e.b + R }; };
      const surf = surface({ ring, tc: 90 });
      const U = Math.min(165, surf.arcTo(80, H * .5));
      /* the plate: shoulders that curl outwards, a deep round neckline, a scalloped lace hem and a pendant drop */
      const right = join(
        [[0, H]], bez([0, H], [U * .4, H], [U * .7, H + 2], [U * .86, H - 4]),
        bez([U * .86, H - 4], [U * 1.02, H - 12], [U * .9, H * .7], [U, H * .55]),
        bez([U, H * .55], [U * 1.04, H * .45], [U * .98, H * .36], [U * .9, H * .32]),
        bez([U * .9, H * .32], [U * .6, H * .26], [U * .3, H * .3], [0, H * .14]));
      const hemPts = bez([U * .86, H * .34], [U * .6, H * .24], [U * .3, H * .3], [16, H * .16], 8);
      const nR = Math.min(84, U * .52), nC = H + 30;
      let out = sym(right).add(mirrorU(union(hemPts.map(q => circle(q[0], q[1] - 2, 10.5, 40)))))
        .add(circle(0, H * .1, 14, 48)).add(leaf([0, H * .1], [0, -16], .55)).subtract(circle(0, nC, nR, 96));
      out = out.simplify(.05);
      const hy = H * .43, hr = Math.min(30, H * .17);
      const lines = [frameLines(out), halo(0, hy, hr, 1.5), motif(0, hy, hr * .72), rays(0, hy, hr, 20)];
      /* a mosaic band following the neckline */
      lines.push(d.ring(0, nC, nR + 7, 1.2), d.ring(0, nC, nR + 17, 1.2));
      { const t = []; for (let k = -9; k <= 9; k++) { const a = -Math.PI / 2 + k * .085; t.push(circle(nR * 0 + (nR + 12) * Math.cos(a), nC + (nR + 12) * Math.sin(a), 1.6, 12)); } lines.push(union(t).intersect(out)); }
      for (const s of [1, -1]) {
        /* vines from the halo up along the neckline to the shoulders, and out to the sides */
        lines.push(vine(bez([s * hr * 1.1, hy + 8], [s * 52, hy + 30], [s * (nR + 8), H - 30], [s * (U * .74), H - 18]), 2.4, 1.3, { r: 8, a: s > 0 ? Math.PI : 0, dir: -s, turns: 1.4 }, [[5, 11, -s], [11, 10, s], [17, 8, -s]]));
        lines.push(vine(bez([s * hr * 1.05, hy - 8], [s * 66, hy - 22], [s * (U * .78), hy - 6], [s * (U * .9), hy + 30]), 2.2, 1.2, { r: 7, a: -Math.PI / 2, dir: s, turns: 1.2 }, [[7, 10, s], [14, 9, -s]]));
        lines.push(flower(s * (U * .7), H * .62, 12, 6, Math.PI / 2, .45));
        lines.push(stroke(bez([s * (U * .7), H * .62 - 12], [s * (U * .72), H * .5], [s * (U * .6), H * .45], [s * (U * .5), H * .4]), 1.4, 1));
      }
      lines.push(flower(0, H * .1, 8, 5, -Math.PI / 2, .5));
      /* lancet windows at the sides, a row of lace eyelets along the hem */
      const arch = (x, y, w, h) => union([circle(x - w * .3, y, w * .8, 48).intersect(circle(x + w * .3, y, w * .8, 48)).intersect(d.CS.square([w, h], true).translate([x, y + h * .2]))]);
      const L = lace(out, ([u, z]) => z < H * .34 && Math.abs(u) > 18 && Math.abs(u) < U * .85, 9, 10.5, 2.3);
      const lancet = (x, y, w, h) => circle(x - w * .35, y + h - w * .9, w * .85, 40).intersect(circle(x + w * .35, y + h - w * .9, w * .85, 40)).add(d.CS.square([w, h - w * .9]).translate([x - w / 2, y])).intersect(d.CS.square([w, h]).translate([x - w / 2, y]));
      const windows = union([mirrorU(union([lancet(hr + 20, hy - 22, 10, 30), lancet(hr + 36, hy - 18, 10, 34), lancet(hr + 52, hy - 12, 10, 30), circle(U * .74, H * .82, 4.5, 32)])), L.win]);
      lines.push(L.deco);
      specs.push({ name: 'breastplate', what: 'Breastplate', surf, outline: out, lines: union(lines), windows, solids: circle(0, hy, hr * .8), holes: holesClear(holesOf(out), windows) });
    }

    /* ================= forearm bracers (front half) ================= */
    const forearmSurf = (z0 = 0) => {
      const L = p.forearmL;
      const circ = z => { const u = (z + z0) / L; return u <= .8 ? p.wrist + (p.forearm - p.wrist) * smooth(0, .8, u) : p.forearm * (1 - .04 * smooth(.8, 1, u)); };
      return surface({ ring: z => { const e = ellipseFor(circ(z), 1.4 - .2 * smooth(0, .6, (z + z0) / L)); return { a: e.a + R, b: e.b + R }; }, tc: 90 });
    };
    const bracer = (tag, label, z0, z1, wristPoint) => {
      const surf = forearmSurf(0), Lb = z1 - z0;
      const U = z => surf.arcTo(62, Math.max(z0, z)) * .95;
      const right = [[0, z1 + 18]];
      /* a lancet arch at the elbow end */
      for (const q of bez([0, z1 + 18], [U(z1) * .35, z1 + 14], [U(z1) * .9, z1 + 2], [U(z1), z1 - 14], 16)) right.push(q);
      for (let z = z1 - 18; z >= z0 + 22; z -= 8) right.push([U(z) * (1 - .06 * Math.sin(Math.PI * (z - z0) / Lb)), z]);
      if (wristPoint) for (const q of bez([U(z0 + 22), z0 + 22], [U(z0), z0 + 4], [22, z0 - 10], [0, z0 - wristPoint], 16)) right.push(q);
      else for (const q of bez([U(z0 + 22), z0 + 22], [U(z0) * .8, z0 + 2], [U(z0) * .3, z0 + 12], [0, z0], 16)) right.push(q);
      const out = sym(right);
      const hy = z1 - 30, hr = Math.min(20, U(hy) * .45);
      const lines = [halo(0, hy, hr, 1.3), motif(0, hy, hr * .72), frameLines(out, 6), rays(0, hy, hr, 14)];
      const Lc = lace(out, ([u, z]) => z > z1 - 6, 8.5, 9.5, 2.1); lines.push(Lc.deco);
      /* Mucha's hair-like strands running down the arm */
      for (const s of [1, -1]) {
        lines.push(vine(bez([s * hr * .9, hy - 8], [s * U(hy) * .7, hy - Lb * .3], [s * -U(z0 + 40) * .1, z0 + Lb * .35], [s * U(z0 + 30) * .55, z0 + 20]), 2, 1.1, { r: 6, a: s > 0 ? Math.PI : 0, dir: s }, [[7, 9, s], [15, 8, -s]]));
        lines.push(stroke(bez([s * hr * .5, hy - hr - 1], [s * 4, hy - Lb * .35], [s * U(z0 + 50) * .45, z0 + Lb * .3], [s * 6, z0 + (wristPoint ? -wristPoint * .5 : 14)]), 1.6, 1.1));
      }
      if (wristPoint) lines.push(flower(0, z0 - wristPoint * .35, 7, 5, -Math.PI / 2, .5));
      const windows = union([mirrorU(union([leaf([U(z0 + Lb * .5) * .5, z0 + Lb * .7], [U(z0 + Lb * .3) * .55, z0 + Lb * .28], .35)])), Lc.win]);
      specs.push({ name: tag, what: label, surf, outline: out, lines: union(lines), windows, solids: circle(0, hy, hr * .8), holes: holesClear(holesOf(out, 7, 3.4), windows) });
    };
    if (want('bracerR')) bracer('bracer-right', 'Bracer, right arm (long, over the wrist)', 6, p.forearmL - 30, 34);
    if (want('bracerL')) bracer('bracer-left', 'Bracer, left arm (above the gauntlet cuff)', 85, p.forearmL - 30, 0);

    /* ================= hands ================= */
    const handSurf = () => surface({ ring: z => { const C = p.wrist + (p.handC - p.wrist) * smooth(0, p.knuckle * .7, z), e = ellipseFor(C, 1.9 + .6 * smooth(0, p.knuckle * .6, z)); return { a: e.a + 2, b: e.b + 2 }; }, tc: 90 });
    const handPlate = (tag, label, ext) => {
      const surf = handSurf(), K = p.knuckle, Uw = 26, Uk = Math.min(40, surf.arcTo(55, K) * .9);
      const right = [[0, K + 6 + ext]];
      if (ext) { for (const q of bez([0, K + 6 + ext], [5, K + ext], [7, K + 14], [9, K + 4], 12)) right.push(q); for (const q of bez([9, K + 4], [16, K - 4], [Uk, K + 6], [Uk, K - 6], 12)) right.push(q); }
      else for (const q of bez([0, K + 6], [12, K - 6], [Uk * .7, K + 8], [Uk, K - 4], 16)) right.push(q);
      for (const q of bez([Uk, K - 4], [Uk * 1.02, K * .5], [Uw + 6, 18], [Uw, 4], 14)) right.push(q);
      for (const q of bez([Uw, 4], [Uw * .6, 0], [10, 8], [0, -4], 12)) right.push(q);
      const out = sym(right);
      const hy = K * .55, hr = 15;
      const lines = [halo(0, hy, hr, 1.2), motif(0, hy, hr * .72), frameLines(out, 5.5), rays(0, hy, hr, 12)];
      for (const s of [1, -1]) lines.push(vine(bez([s * hr * .95, hy - 4], [s * Uw, hy - 16], [s * (Uw - 4), 14], [s * 10, 8]), 1.8, 1.1, { r: 4.5, a: s > 0 ? Math.PI / 2 : Math.PI / 2, dir: -s }));
      for (const s of [1, -1]) lines.push(vine(bez([s * hr * .7, hy + hr * .7], [s * 14, K - 6], [s * (Uk - 8), K - 4], [s * (Uk - 6), K - 14]), 1.6, 1.1, { r: 4, a: s > 0 ? Math.PI : 0, dir: s }));
      if (ext) { for (let i = 0; i < 4; i++) lines.push(circle(0, K + 8 + i * (ext - 6) / 3.6, 1.6 - i * .18, 14)); lines.push(leaf([0, K + ext - 8], [0, K + ext + 3], .5)); }
      const holes = holesOf(out, 6.5, 3.2);
      if (ext) holes.push([-3.2, K + ext - 2], [3.2, K + ext - 2]);   /* a loop of elastic or a ring sewn here holds the point on the finger */
      specs.push({ name: tag, what: label, surf, outline: out, lines: union(lines), windows: mirrorU(leaf([7, K * .9], [Uk * .78, K * .78], .4)), solids: circle(0, hy, hr * .8), holes });
    };
    if (want('handR')) handPlate('hand-right', 'Hand ornament, right (back of the hand, point down the middle finger)', Math.round(p.middle * .38));
    if (want('gauntletL')) {
      handPlate('gauntlet-hand', 'Full gauntlet: back of the hand', 0);
      /* cuff: a Victorian bell flaring up the forearm */
      const cL = 105, cuffS = surface({ ring: z => { const C = p.wrist + 10 + (p.wrist * 1.75 - p.wrist - 10) * (z / cL) ** 1.4, e = ellipseFor(C, 1.35); return { a: e.a + R, b: e.b + R }; }, tc: 90 });
      const U = z => cuffS.arcTo(80, z) * .95;
      const right = [[0, cL + 16]];
      for (const q of bez([0, cL + 16], [U(cL) * .25, cL + 4], [U(cL) * .55, cL + 16], [U(cL) * .78, cL + 2], 12)) right.push(q);
      for (const q of bez([U(cL) * .78, cL + 2], [U(cL) * .9, cL + 12], [U(cL), cL + 8], [U(cL), cL - 6], 10)) right.push(q);
      for (let z = cL - 14; z >= 10; z -= 8) right.push([U(z), z]);
      for (const q of bez([U(10), 10], [U(0) * .8, 0], [U(0) * .3, 6], [0, 0], 12)) right.push(q);
      const out = sym(right);
      const hy = cL * .58, hr = 17;
      const lines = [halo(0, hy, hr, 1.3), motif(0, hy, hr * .72), frameLines(out, 6), rays(0, hy, hr, 14)];
      const Lc = lace(out, ([u, z]) => z > cL - 8, 8.5, 9.5, 2.1); lines.push(Lc.deco);
      for (const s of [1, -1]) {
        lines.push(vine(bez([s * hr, hy + 4], [s * 40, cL - 6], [s * U(cL) * .6, cL - 10], [s * U(cL) * .75, hy + 6]), 2, 1.2, { r: 6, a: s > 0 ? Math.PI : 0, dir: -s }, [[8, 9, s]]));
        lines.push(vine(bez([s * hr * .8, hy - 12], [s * 30, 14], [s * U(20) * .7, 18], [s * U(30) * .82, 40]), 1.8, 1.1, { r: 5, a: s > 0 ? Math.PI : 0, dir: s }));
        lines.push(flower(s * U(hy) * .78, hy - 6, 8, 5, Math.PI / 2, .5));
      }
      specs.push({ name: 'gauntlet-cuff', what: 'Full gauntlet: cuff', surf: cuffS, outline: out, lines: union(lines), windows: union([mirrorU(leaf([U(hy) * .5, hy - hr - 4], [U(20) * .55, 20], .38)), Lc.win]), solids: circle(0, hy, hr * .8), holes: holesClear(holesOf(out, 7, 3.4), Lc.win) });
      /* knuckle plate */
      { const K = p.knuckle, kS = surface({ ring: z => { const e = ellipseFor(p.handC + 6, 2.5); return { a: e.a + 2, b: e.b + 2 }; }, tc: 90 }), Uk = Math.min(46, kS.arcTo(60, 0) * .9);
        const right = join(bez([0, 22], [14, 26], [Uk - 10, 26], [Uk, 18], 14), bez([Uk, 18], [Uk + 3, 10], [Uk, 2], [Uk - 6, 0], 8), bez([Uk - 6, 0], [Uk * .6, 4], [12, 0], [0, 4], 12));
        const out = sym(right), lines = [beads(out, 4.5, 5, .7)];
        for (const k of [-1.5, -.5, .5, 1.5]) { const u = k * Uk * .42; lines.push(d.ring(u, 12, 5, 1.1), circle(u, 12, 1.6, 14)); }
        specs.push({ name: 'gauntlet-knuckles', what: 'Full gauntlet: knuckle plate', surf: kS, outline: out, lines: union(lines), solids: union([-1.5, -.5, .5, 1.5].map(k => circle(k * Uk * .42, 12, 4.6))), holes: holesOf(out, 6, 2.8) }); }
      /* fingers: three plates each, the tips pointed; thumb two */
      const F = [['index', .93, .97], ['middle', 1, 1], ['ring', .96, .94], ['little', .77, .8], ['thumb', .66, 1.07]];
      for (const [fn, lf, cf] of F) {
        const L = p.middle * lf, C = p.fingerC * cf, segs = fn === 'thumb' ? [.55, .45] : [.45, .3, .25];
        const fS = surface({ ring: () => { const r = C / (2 * Math.PI) + 1.8; return { a: r * 1.08, b: r }; }, tc: 90 });
        const U = fS.arcTo(62, 0);
        segs.forEach((f, i) => {
          const len = L * f - 2.5, tip = i === segs.length - 1;
          const right = tip ? join([[0, len + 9]], bez([0, len + 9], [U * .3, len + 2], [U, len * .7], [U, len * .35], 10), [[U, 0]], [[0, 0]])
                            : join([[0, len + 2]], bez([0, len + 2], [U * .5, len + 3], [U, len], [U, len - 3], 6), [[U, 3]], bez([U, 3], [U, 0], [U * .5, -1], [0, 0], 6));
          const out = sym(right);
          const lines = [stroke([[0, 3], [0, len - 3]], 1.2, 1.2), d.ring(0, len * .5, Math.min(3, U * .35), 1), circle(0, len * .5, 1, 12)];
          const hl = [[-U + 2.4, 3.5], [U - 2.4, 3.5], [-U + 2.4, len - 3.5], [U - 2.4, len - 3.5]];
          specs.push({ name: `finger-${fn}-${i + 1}`, what: `Full gauntlet: ${fn} ${['base', 'middle', 'tip'][fn === 'thumb' && i === 1 ? 2 : i]} plate`, surf: fS, outline: out, lines: union(lines), holes: hl, holeD: 1.4, rim: 1.2, small: true });
        });
      }
    }

    /* ================= couter and poleyn: cops with a side wing ================= */
    const cop = (tag, label, C, L, wingSide) => {
      const r0 = C / (2 * Math.PI) + R;
      const surf = surface({ ring: z => { const r = r0 * (1 + .16 * Math.sin(Math.PI * Math.min(L, Math.max(0, z)) / L)); return { a: r, b: r }; }, tc: 90 });
      const U = surf.arcTo(55, L / 2), Wg = surf.arcTo(118, L / 2);
      const pts = [];
      /* the cop: a pointed oval; the wing: a ginkgo-leaf fan on the outer side, a favourite Art Nouveau motif */
      for (let i = 0; i <= 40; i++) { const a = i / 40 * 2 * Math.PI; pts.push([U * Math.cos(a) * (1 - .12 * Math.cos(2 * a)), L / 2 + (L / 2 - 2) * Math.sin(a)]); }
      const fanA = 58, cx = wingSide * U * .7, cy = L / 2, fr = Math.min(Wg - U * .7, (L / 2 - 5) / Math.sin(fanA * Math.PI / 180));
      const fanPts = [[cx, cy]];
      for (let i = 0; i <= 48; i++) { const a = (-fanA + 2 * fanA * i / 48) * Math.PI / 180, r = fr * (1 - .08 * Math.abs(Math.sin(3 * Math.PI * i / 48))) * (1 - .25 * Math.max(0, 1 - Math.abs(i - 24) / 4)); fanPts.push([cx + wingSide * r * Math.cos(a), cy + r * Math.sin(a)]); }
      let out = d.polyFix(pts).add(d.polyFix(fanPts)).simplify(.05);
      const hr2 = Math.min(18, U * .42);
      const lines = [halo(0, L / 2, hr2, 1.3), motif(0, L / 2, hr2 * .72), frameLines(out, 6)];
      const veins = [], win = [];
      for (let k = -4; k <= 4; k++) { const a = k / 4 * (fanA - 8) * Math.PI / 180, r0 = U * .32, r1 = fr * .86; veins.push(stroke([[cx + wingSide * r0 * Math.cos(a), cy + r0 * Math.sin(a)], [cx + wingSide * r1 * Math.cos(a), cy + r1 * Math.sin(a)]], 1.5, 1));
        if (k < 4) { const a2 = (k + .5) / 4 * (fanA - 8) * Math.PI / 180; win.push(leaf([cx + wingSide * fr * .42 * Math.cos(a2), cy + fr * .42 * Math.sin(a2)], [cx + wingSide * fr * .8 * Math.cos(a2), cy + fr * .8 * Math.sin(a2)], .32)); } }
      lines.push(union(veins), d.ring(cx, cy, U * .3, 1.2));
      for (const s of [1, -1]) lines.push(vine(bez([s * 6, L / 2 + hr2 + 2], [s * 14, L - 10], [s * U * .55, L - 12], [s * U * .7, L * .62]), 1.6, 1.1, { r: 4, a: s > 0 ? Math.PI : 0, dir: -s }));
      const windows = union(win);
      specs.push({ name: tag, what: label, surf, outline: out, lines: union(lines), windows, solids: circle(0, L / 2, hr2 * .8), holes: holesClear(holesOf(out, 7, 3.4), windows) });
    };
    if (want('couter')) cop('couter', 'Couter, left elbow', p.elbow, 96, 1);
    if (want('poleyn')) cop('poleyn', 'Poleyn, right knee', p.knee, 120, -1);

    /* ================= long front plates: rerebrace, cuisse, greave ================= */
    const longPlate = (tag, label, c0, c1, L, k0, k1, span, opt = {}) => {
      const circ = z => c0 + (c1 - c0) * smooth(0, opt.peak ?? 1, z / L) * (opt.peak ? 1 - .05 * smooth(opt.peak, 1, z / L) : 1);
      const surf = surface({ ring: z => { const zz = Math.min(L + 30, Math.max(-30, z)), e = ellipseFor(circ(Math.max(0, Math.min(L, zz))), k0 + (k1 - k0) * Math.max(0, Math.min(1, zz / L))); return { a: e.a + R, b: e.b + R }; }, tc: 90 });
      const U = z => surf.arcTo(span, Math.max(0, Math.min(L, z))) * .95;
      const top = opt.topPoint ?? 30, bot = opt.botPoint ?? 18;
      const right = [[0, L + top]];
      for (const q of bez([0, L + top], [U(L) * .3, L + top * .7], [U(L) * .85, L + 6], [U(L), L - 14], 16)) right.push(q);
      for (let z = L - 22; z >= 26; z -= 10) right.push([U(z), z]);
      for (const q of bez([U(26), 26], [U(0) * .95, 6], [U(0) * .35, 4], [0, -bot], 16)) right.push(q);
      const out = sym(right);
      const hy = L - Math.min(60, L * .2), hr = Math.min(32, U(hy) * .4);
      const lines = [halo(0, hy, hr, 1.5), motif(0, hy, hr * .72), frameLines(out, 7), rays(0, hy, hr, 20)];
      const Lc = lace(out, ([u, z]) => z < 14 && Math.abs(u) > 12, 9, 10.5, 2.3); lines.push(Lc.deco);
      for (const s of [1, -1]) {
        lines.push(vine(bez([s * hr * 1.05, hy + 4], [s * U(L) * .7, L - 4], [s * U(L) * .85, hy - 10], [s * U(hy) * .78, hy - hr - 6]), 2.2, 1.2, { r: 7, a: s > 0 ? Math.PI / 2 : Math.PI / 2, dir: s }, [[6, 10, s]]));
        /* long hair-like strands down the plate */
        lines.push(vine(bez([s * hr * .7, hy - hr * .75], [s * U(L * .55) * .75, L * .55], [s * -U(L * .3) * .15, L * .3], [s * U(30) * .6, 34]), 2.2, 1.2, { r: 8, a: s > 0 ? Math.PI : 0, dir: s, turns: 1.5 }, [[5, 12, s], [12, 10, -s], [18, 9, s]]));
        lines.push(stroke(bez([s * hr * .35, hy - hr - 1], [s * 6, L * .55], [s * U(L * .4) * .4, L * .25], [s * 8, 0]), 1.6, 1.1));
        lines.push(flower(s * U(L * .5) * .72, L * .48, 10, 5, Math.PI / 2, .5));
      }
      lines.push(flower(0, 10, 9, 6, Math.PI / 2, .45));
      const windows = mirrorU(union([leaf([U(L * .7) * .45, L * .74], [U(L * .62) * .7, L * .55], .34), leaf([U(L * .35) * .3, L * .36], [U(L * .25) * .55, L * .14], .36)]));
      const win2 = union([windows, Lc.win]);
      specs.push({ name: tag, what: label, surf, outline: out, lines: union(lines), windows: win2, solids: circle(0, hy, hr * .8), holes: holesClear(holesOf(out, 8, 3.6), win2) });
    };
    if (want('rerebrace')) longPlate('rerebrace', 'Rerebrace, left upper arm', p.aboveElbow, p.arm, Math.round(p.armL * .66), 1.05, 1.05, 60, { topPoint: 22, botPoint: 22 });
    if (want('cuisse')) longPlate('cuisse', 'Cuisse, right thigh', p.aboveKnee, p.thigh, Math.min(280, p.thighL - 100), 1.1, 1.15, 58, { topPoint: 30, botPoint: 24 });
    if (want('greave')) longPlate('greave', 'Greave, right shin (front)', p.ankle, p.calf, Math.min(270, p.shinL - 40), 1.25, 1.1, 55, { peak: .7, topPoint: 26, botPoint: 28 });

    /* ================= build, lay out ================= */
    const parts = [], asm = [], notes = [];
    let gx = 0, gy = 0, rowH = 0;
    const tooBig = [];
    for (const sp of specs) {
      const bodies = makePiece(W, d, sp, p);
      const pose = printPose(W, bodies.map(b => b.m));
      for (const b of bodies) parts.push({ name: b.name, what: b.what + (pose.flip ? ', print upside down as exported' : ''), count: 1, m: weld(W, pose.place(b.m)) });
      if (Math.max(...pose.size) > 345) tooBig.push(sp.what);
      /* preview: the pieces side by side, as worn (standing) */
      const bb = M.union(bodies.map(b => b.m)).boundingBox(), w = bb.max[0] - bb.min[0], h = bb.max[2] - bb.min[2];
      if (gx > 900) { gx = 0; gy += rowH + 40; rowH = 0; }
      for (const b of bodies) asm.push({ m: b.m.translate([gx - bb.min[0], -(bb.min[1] + bb.max[1]) / 2, -gy - bb.max[2]]), c: b.c });
      gx += w + 30; rowH = Math.max(rowH, h);
    }
    if (tooBig.length) notes.push(`Larger than the 350 mm build volume: ${tooBig.join(', ')}. Check the measurements.`);
    if (p.mode === 'two') notes.push('Each piece is two files, "-base" and "-filigree", already lined up: import them together as one object.');
    const pieces = specs.length;
    const stats = [['Pieces', `${pieces}`, p.mode === 'two' ? `${parts.length} files, two colours` : 'one colour, pierced'], ['Finish', p.mode === 'two' ? 'Base + filigree' : 'Openwork', `${p.th} mm plate, ${p.relief} mm relief`]];
    return { parts, asm, stats, notes, colors: { a: '--tray', c: '--lift' }, legend: [['--tray', 'Plate'], ['--lift', 'Filigree']] };

    function want(k) { return p.piece === k || p.piece === 'all'; }
  }
};
