/* Costume armour: the jester. Harlequin pauldrons (a cap and two lames ending in points with little balls that
   carry jingle bells) and a harlequin half mask with upswept points. Two colours (base and raised harlequin
   diamonds for the CFS) or one colour with every other diamond pierced. Plates are sewn or laced on; bells hang
   on jump rings. Units: mm, Z up. Built with the Manifold library. */
import { surface, draw, alongEdge, makePiece, printPose, weld, ellipseFor, smooth } from './prints-filigree-lib.js?v=1';

const PIECES = [['pauldrons', 'Pauldrons'], ['mask', 'Half mask'], ['gorget', 'Gorget'], ['poleyns', 'Bell poleyns'], ['marotte', 'Marotte (sceptre)'], ['all', 'Everything']];

export default {
  id: 'jester', title: 'Costume armour: jester',
  intro: 'Harlequin pauldrons, half mask, gorget and knee cops with bell-tipped points, in two colours or pierced in one, plus a marotte: the fool\'s sceptre with a grinning little head in a three-tailed cap. Sew or lace the plates onto the costume; hang small jingle bells from the points.',
  defaults: { piece: 'pauldrons', mode: 'two', th: 2, relief: 1, arm: 340, sleeve: 6, headC: 550, ipd: 63, faceW: 135, maskH: 80, foam: 3, diamond: 26, neck: 390, gorgetH: 55, knee: 450, kneeRoom: 4, dowel: 12 },
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
      hint: 'Pupil distance: an optician\'s prescription often lists it, or measure in a mirror with a ruler held under your eyes. Temple to temple: a tape measure laid across the forehead from one temple to the other.' },
    { title: 'Gorget and knees', fields: [
      { k: 'neck', type: 'num', label: 'Neck round', min: 280, max: 550, step: 1 },
      { k: 'gorgetH', type: 'num', label: 'Gorget height, neck to collarbone', min: 35, max: 90, step: 1 },
      { k: 'knee', type: 'num', label: 'Knee round, bent', min: 280, max: 700, step: 1 },
      { k: 'kneeRoom', type: 'num', label: 'Room for tights and padding (mm)', min: 0, max: 15, step: .5 }] },
    { title: 'Marotte', fields: [
      { k: 'dowel', type: 'num', label: 'Wooden dowel for the stick (mm)', min: 8, max: 20, step: .5 }],
      hint: 'A 12 mm hardwood dowel about 60 cm long, wrapped in ribbon, makes the stick.' }
  ],
  tips: [
    'Gorget: lace the front and back plates together at each side with ribbon through the holes, and sew the top edge to the doublet’s collar stand or to a fabric neckband. It sits under the fabric jester collar.',
    'Poleyns: one for each knee (the fans point outwards). Sew them onto the slops’ leg bands or onto a pair of knee pads, or lace them over the tights with elastic.',
    'Marotte: the head, the ruff and the cap print separately, each in one colour (no CFS needed). Slide the ruff up the socket, push the cap onto the head’s peg, push the dowel into the socket and fix it with an M3 screw through the side hole. The head needs tree supports under the chin and the cap under its curling tails, touching the bed only.',
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

    const want = k => p.piece === k || p.piece === 'all';
    /* ================= pauldrons ================= */
    if (want('pauldrons')) {
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
    if (want('mask')) {
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

    /* a little grinning sun for the throat */
    const sun = (x, y, r) => {
      const L = [d.ring(x, y, r, 1.3), circle(x - r * .35, y + r * .2, r * .13, 16), circle(x + r * .35, y + r * .2, r * .13, 16)];
      const sm = []; for (let i = 0; i <= 16; i++) { const a = Math.PI * (1.15 + .7 * i / 16); sm.push([x + r * .55 * Math.cos(a), y + r * .1 + r * .55 * Math.sin(a)]); }
      L.push(stroke(sm, 1.4, 1.4));
      for (let i = 0; i < 12; i++) { const a = i / 12 * 2 * Math.PI; L.push(leaf([x + r * 1.15 * Math.cos(a), y + r * 1.15 * Math.sin(a)], [x + r * 1.75 * Math.cos(a), y + r * 1.75 * Math.sin(a)], .45)); }
      return union(L);
    };

    /* ================= gorget: front and back, laced at the sides, points with bells ================= */
    if (want('gorget')) {
      const H = p.gorgetH, ptLen = 22, base = ptLen * .3;
      const e0 = ellipseFor(p.neck, 1.12);
      /* a cone: snug at the neck, flaring out over the collarbones */
      const S = surface({ ring: z => { const g = 8 + (H - Math.min(H, z)) * .85; return { a: e0.a + g, b: e0.b + g }; }, tc: 90 });
      for (const [tag, label, front] of [['gorget-front', 'Gorget, front', true], ['gorget-back', 'Gorget, back', false]]) {
        const top = front ? H : H + 10;
        const Sx = front ? S : surface({ ring: S.ring, tc: 270 });
        const U = z => Sx.arcTo(82, Math.max(base, Math.min(top, z)));
        const right = [[0, top - (front ? 8 : 0)]];
        for (const q of bez([0, top - (front ? 8 : 0)], [U(top) * .4, top - (front ? 7 : 0)], [U(top) * .8, top], [U(top), top - 2], 10)) right.push(q);
        for (let z = top - 8; z > base + 4; z -= 6) right.push([U(z), z]);
        right.push([U(base), base], [0, base]);
        const body = d.polyFix([...right, ...right.slice(1, -1).reverse().map(([u, z]) => [-u, z])]);
        const n = 7, Wb = U(base), pts = [], bells = [];
        for (let i = 0; i < n; i++) { const x = -Wb * .92 + (i + .5) * 2 * Wb * .92 / n; pts.push(bellPoint(x, base + 1, ptLen + 4, 2 * Wb * .92 / n * .9)); bells.push([x, base + 1 - ptLen - 4]); }
        const out = union([body, ...pts]).simplify(.05);
        const inner = body.offset(-5, 'Round', 2, 48);
        const dw = p.diamond * .8, hq = harlequin([-260, -40, 260, top + 20], dw, dw * 1.45, 0, top * .5);
        const lines = [hq.lines.intersect(inner), beads(body, 3.2, 6, .8).intersect(body.offset(-1.5))];
        let sol = union(bells.map(([u, z]) => circle(u, z, 5, 24)));
        if (front) {
          const sz = Math.min(11, H * .2), cy = top * .52, disk = circle(0, cy, sz * 1.9);
          lines.push(sun(0, cy, sz)); lines[0] = lines[0].subtract(disk);
          if (p.mode !== 'pierced') lines.push(hq.A.intersect(inner).subtract(disk));
          sol = union([sol, circle(0, cy, sz * 1.1), p.mode === 'pierced' ? hq.B.intersect(inner).subtract(disk).offset(-.6, 'Round', 2, 12) : null]);
        } else {
          if (p.mode !== 'pierced') lines.push(hq.A.intersect(inner));
          else sol = union([sol, hq.B.intersect(inner).offset(-.6, 'Round', 2, 12)]);
        }
        /* lacing holes down each side, sewing holes along the top */
        const holes = [...bells];
        for (const s of [1, -1]) for (let z = base + 6; z < top - 4; z += 9) holes.push([s * (U(z) - 4), z]);
        for (const q of alongEdge(body, 3.4, 8)) if (q[1] > top - 12 && Math.abs(q[0]) < U(top) - 8) holes.push(q);
        specs.push({ name: tag, what: label, surf: Sx, outline: out, lines: union(lines), solids: sol, holes, holeD: 2.4, band: 5 });
      }
    }

    /* ================= bell poleyns: knee cops with a fan of bell points on the outer side ================= */
    if (want('poleyns')) {
      const L = 110, r0 = p.knee / (2 * Math.PI) + p.kneeRoom + 2;
      const S = surface({ ring: z => { const r = r0 * (1 + .15 * Math.sin(Math.PI * Math.min(L, Math.max(0, z)) / L)); return { a: r, b: r }; }, tc: 90 });
      const U = S.arcTo(52, L / 2), Wf = S.arcTo(112, L / 2);
      for (const [tag, label, side] of [['poleyn-left', 'Poleyn, left knee', 1], ['poleyn-right', 'Poleyn, right knee', -1]]) {
        const ov = []; for (let i = 0; i <= 40; i++) { const a = i / 40 * 2 * Math.PI; ov.push([U * Math.cos(a) * (1 - .1 * Math.cos(2 * a)), L / 2 + (L / 2 - 4) * Math.sin(a)]); }
        const cx = side * U * .75, cy = L / 2, fr = Wf - U * .75 - 6, bells = [], fan = [];
        /* five points radiating from the side of the cop, each ending in a ball with a bell */
        for (let k = -2; k <= 2; k++) {
          const a = k * 22 * Math.PI / 180, ex = cx + side * fr * Math.cos(a) * (k ? .92 : 1), ey = cy + fr * Math.sin(a) * .9;
          fan.push(leaf([cx, cy], [ex, ey], .3), circle(ex, ey, 5, 28)); bells.push([ex, ey]);
        }
        const out = union([d.polyFix(ov), ...fan]).simplify(.05);
        const inner = d.polyFix(ov).offset(-5, 'Round', 2, 48);
        const dw = p.diamond * .75, hq = harlequin([-200, -40, 200, L + 40], dw, dw * 1.45, 0, L / 2);
        const lines = [hq.lines.intersect(inner), beads(d.polyFix(ov), 3.2, 6, .8), d.ring(cx, cy, 6, 1.2)];
        for (let k = -2; k <= 2; k++) { const a = k * 22 * Math.PI / 180; lines.push(stroke([[cx + side * 8 * Math.cos(a), cy + 8 * Math.sin(a)], [cx + side * (fr - 9) * Math.cos(a), cy + (fr - 9) * Math.sin(a) * .9]], 1.2, .9)); }
        if (p.mode !== 'pierced') lines.push(hq.A.intersect(inner));
        const sol = union([union(bells.map(([u, z]) => circle(u, z, 5, 24))), p.mode === 'pierced' ? hq.B.intersect(inner).offset(-.6, 'Round', 2, 12) : null, union(fan).subtract(d.polyFix(ov))]);
        const holes = [...bells, ...alongEdge(d.polyFix(ov), 3.4, 8).filter(([u]) => side * u < U * .5)];
        specs.push({ name: tag, what: label, surf: S, outline: out, lines: union(lines), solids: sol, holes, holeD: 2.4, band: 5 });
      }
    }

    /* ================= build and lay out ================= */
    const parts = [], asm = [], notes = [];
    let gx = 0;
    if (want('marotte')) marotte(W, p, parts, asm, notes);
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
    const stats = [['Pieces', `${parts.reduce((a, q) => a + (/filigree/.test(q.name) ? 0 : q.count), 0)}`, p.mode === 'two' ? 'two colours' : 'one colour, pierced'], ['Diamonds', `${p.diamond} mm`, 'wide']];
    return { parts, asm, stats, notes, colors: { a: '--tray', c: '--lift' }, legend: [['--tray', 'Plate'], ['--lift', 'Harlequin']] };
  }
};

/* the marotte: a fool's sceptre head. Head with neck and dowel socket, a ruff that slides up under the chin, and a
   three-tailed cap that pushes onto a peg on top of the head. Each part is one colour. */
function marotte(W, p, parts, asm, notes) {
  const M = W.Manifold;
  const ball = (r, n = 40) => M.sphere(r, n);
  /* head: a slightly long egg with nose, cheeks, eyes and a grin */
  const R = 24;
  let head = ball(R, 64).scale([1, .95, 1.15]);
  head = head.add(ball(5.5, 32).translate([0, R * .95, -2]));                               /* nose */
  for (const s of [1, -1]) head = head.add(ball(6, 32).scale([1, .7, .8]).translate([s * 12, R * .78, -6]));   /* cheeks */
  for (const s of [1, -1]) head = head.subtract(ball(3.6, 24).translate([s * 8.5, R * .93, 8])).add(ball(2.2, 20).translate([s * 8.5, R * .86, 8]));  /* eyes */
  const grin = M.revolve(W.CrossSection.circle(1.8, 16).translate([16, 0]), 48, 110).rotate([0, 0, 215]).rotate([90, 0, 0]).translate([0, R * .7, 2]);
  head = head.subtract(grin);
  /* neck, socket for the dowel, and a peg on top for the cap */
  const sockH = 40, sockR = Math.max(11, p.dowel / 2 + 4.5);
  head = head.add(M.cylinder(14, sockR, sockR, 48).translate([0, 0, -R * 1.1 - 6]));
  head = head.add(M.cylinder(sockH, sockR, sockR * .92, 48).translate([0, 0, -R * 1.1 - 6 - sockH]));
  head = head.add(M.cylinder(10, 4, 4, 32).translate([0, 0, R * 1.1 - 4]));
  head = head.subtract(M.cylinder(sockH - 4, p.dowel / 2 + .25, p.dowel / 2 + .25, 40).translate([0, 0, -R * 1.1 - 6 - sockH - .01]));
  head = head.subtract(M.cylinder(sockR * 2 + 2, 1.6, 1.6, 16).rotate([0, 90, 0]).translate([-sockR - 1, 0, -R * 1.1 - 6 - sockH + 14]));   /* M3 screw across the dowel */
  /* ruff: a ring of puffs that slides up the socket to sit under the chin */
  let ruff = M.union(Array.from({ length: 14 }, (_, i) => { const a = i / 14 * 2 * Math.PI; return ball(8.5, 28).scale([1, 1, .75]).translate([20 * Math.cos(a), 20 * Math.sin(a), 0]); }));
  ruff = ruff.add(M.cylinder(9, 22, 22, 48).translate([0, 0, -4.5])).subtract(M.cylinder(30, sockR + .25, sockR + .25, 48).translate([0, 0, -15]));
  /* cap: a cup over the top of the head with a rolled brim and three curling tails ending in bell balls */
  const capIn = head.boundingBox();
  let cap = ball(R + 3.2, 64).scale([1, .95, 1.15]).intersect(M.cube([200, 200, 200], true).translate([0, 0, 100 + 4]));
  const brim = M.revolve(W.CrossSection.circle(3.2, 16).translate([R + 2, 0]), 64).scale([1, .95, 1]).translate([0, 0, 5]);
  cap = cap.add(brim);
  const tails = [];
  for (let k = 0; k < 3; k++) {
    const a = k / 3 * 2 * Math.PI + Math.PI / 2;
    const P = t => { const s = 1 - t; const p0 = [6, R * 1.0], p1 = [18, R * 1.0 + 30], p2 = [38, R * 1.1 + 34], p3 = [54, R * 1.1 + 22];
      const x = s ** 3 * p0[0] + 3 * s * s * t * p1[0] + 3 * s * t * t * p2[0] + t ** 3 * p3[0], z = s ** 3 * p0[1] + 3 * s * s * t * p1[1] + 3 * s * t * t * p2[1] + t ** 3 * p3[1];
      return [x * Math.cos(a), x * Math.sin(a), z]; };
    const seg = [];
    for (let i = 0; i < 14; i++) { const t0 = i / 14, t1 = (i + 1) / 14; seg.push(M.hull([ball(11 * (1 - .75 * t0), 24).translate(P(t0)), ball(11 * (1 - .75 * t1), 24).translate(P(t1))])); }
    const tip = P(1);
    tails.push(M.union(seg).add(ball(5.5, 28).translate(tip)).subtract(M.cylinder(14, 1.3, 1.3, 12).rotate([90, 0, 0]).rotate([0, 0, a * 180 / Math.PI]).translate([tip[0] - 7 * Math.cos(a + Math.PI / 2) * 0, tip[1], tip[2]]).translate([0, 0, 0])));
  }
  cap = cap.add(M.union(tails));
  /* hollow the cup to fit over the head and the peg */
  cap = cap.subtract(ball(R + .4, 64).scale([1, .95, 1.15])).subtract(M.cylinder(12, 4.25, 4.25, 32).translate([0, 0, R * 1.1 - 4.5]));
  const twoC = p.mode === 'two';
  const put = (name, what, m, c) => { const b = m.boundingBox(); parts.push({ name, what, count: 1, m: m.translate([-(b.min[0] + b.max[0]) / 2, -(b.min[1] + b.max[1]) / 2, -b.min[2]]) }); };
  put('marotte-head', 'Marotte: head with socket (print upright, tree supports under the chin)', head, 'a');
  put('marotte-ruff', 'Marotte: ruff (print flat)', ruff, 'c');
  put('marotte-cap', 'Marotte: three-tailed cap (print upright, tree supports under the tails)', cap, 'c');
  const off = [-150, 0, 0];
  asm.push({ m: head.translate(off), c: 'a' }, { m: ruff.translate([0, 0, -R * 1.1 - 1]).translate(off), c: 'c' }, { m: cap.translate(off), c: 'c' });
  notes.push(`Marotte: push a ${p.dowel} mm dowel into the socket and fix it with an M3 × 25 screw and nut through the side hole.`);
}
