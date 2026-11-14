/* Full suit of armour from body measurements: gorget, breastplate and backplate (each an upper plate with an
   overlapping lower plate, split down the middle and joined with a centre strip and M3 screws so every part
   fits the bed), pauldrons (a cap and three lames on leather straps), rerebraces, couters, faulds and tassets,
   cuisses and poleyns. Bracers, greaves and gauntlets come from their own tabs and join the whole-suit download.
   Every part has room for a foam lining, prints standing without supports, and is held by straps, screws or
   rivets, never glue. Styles: plain medieval, gothic (flutes and scalloped edges), fantasy (crest and points).
   Built with the Manifold library. Units: mm, Z up, the wearer faces +Y. */
import { ellipseFor, smooth, shell, frame, rod, boxAt, holeAt, roundHole, angleAlong } from './prints-armour-lib.js?v=3';
import armour from './prints-armour.js?v=5';
import gauntlet from './prints-gauntlet.js?v=4';

const r1 = v => Math.round(v * 10) / 10;
const PIECES = [['helmet', 'Helmet'], ['gorget', 'Gorget'], ['breast', 'Breastplate'], ['back', 'Backplate'], ['pauldron', 'Pauldrons'], ['rerebrace', 'Rerebraces'],
  ['couter', 'Couters'], ['fauld', 'Faulds and tassets'], ['cuisse', 'Cuisses'], ['poleyn', 'Poleyns'], ['sabaton', 'Sabatons'], ['all', 'Whole suit']];

export default {
  id: 'suit', title: 'Armour: full suit',
  intro: 'A whole suit from your measurements. Pick a piece to see and download it, or the whole suit at once. Bracers, greaves and gauntlets use their own tabs and are added to the whole-suit download.',
  defaults: {
    piece: 'breast', style: 'plain', lining: 3, pad: 3, th: 2.4, strap: 25,
    height: 1580, neck: 390, shoulders: 470, chest: 990, waist: 940, hips: 1010, front: 400, frontLow: 570, backL: 490,
    arm: 340, armL: 325, aboveElbow: 250, elbow: 300, skirt: 250, thigh: 610, aboveKnee: 420, thighL: 430, knee: 450,
    headC: 550, faceH: 185, crown: 100, helmLiner: 8, visor: 'yes', shoeL: 255, shoeW: 95, instep: 65
  },
  derive(o) {
    const p = { ...this.defaults, ...o };
    for (const k in this.defaults) if (typeof this.defaults[k] === 'number') p[k] = isFinite(+p[k]) ? +p[k] : this.defaults[k];
    p.room = p.pad + p.lining;
    p.visor = p.visor === true || p.visor === 'yes' ? 'yes' : 'no';
    return p;
  },
  sections: [
    { title: 'Piece', fields: [{ k: 'piece', type: 'seg', options: PIECES }] },
    { title: 'Style', fields: [{ k: 'style', type: 'seg', options: [['plain', 'Plain medieval'], ['gothic', 'Gothic'], ['fantasy', 'Fantasy']] }],
      hint: 'Plain: rolled edges and one ridge. Gothic: fluted ridges and scalloped lower edges. Fantasy: a raised crest and pointed lower edges.' },
    { title: 'Lining and fit', fields: [
      { k: 'lining', type: 'seg', options: [[0, 'None'], [2, '2 mm foam'], [3, '3 mm foam'], [5, '5 mm foam'], [8, 'Thick padding']] },
      { k: 'pad', type: 'num', label: 'Clothing underneath (mm)', min: 0, max: 20, step: .5 },
      { k: 'th', type: 'num', label: 'Plate thickness (mm)', min: 1.6, max: 4, step: .2 },
      { k: 'strap', type: 'num', label: 'Strap width (mm)', min: 15, max: 40, step: 1 }],
      hint: 'PLA must not sit on skin: every plate is made bigger by the lining and clothing you choose. Cut foam about 3 mm short of each edge.' },
    { title: 'Body (mm, over bare skin)', fields: [
      { k: 'height', type: 'num', label: 'Height', min: 1200, max: 2100, step: 1 },
      { k: 'neck', type: 'num', label: 'Neck round', min: 250, max: 600, step: 1 },
      { k: 'shoulders', type: 'num', label: 'Shoulder width', min: 300, max: 650, step: 1 },
      { k: 'chest', type: 'num', label: 'Chest under the arms', min: 600, max: 1600, step: 1 },
      { k: 'waist', type: 'num', label: 'Waist', min: 550, max: 1600, step: 1 },
      { k: 'hips', type: 'num', label: 'Hips', min: 600, max: 1700, step: 1 },
      { k: 'front', type: 'num', label: 'Collarbone to navel', min: 250, max: 600, step: 1 },
      { k: 'frontLow', type: 'num', label: 'Collarbone to pubis', min: 350, max: 800, step: 1 },
      { k: 'backL', type: 'num', label: 'Back length (neck to waist)', min: 300, max: 700, step: 1 },
      { k: 'arm', type: 'num', label: 'Upper arm round (armpit)', min: 200, max: 600, step: 1 },
      { k: 'armL', type: 'num', label: 'Upper arm length', min: 200, max: 450, step: 1 },
      { k: 'aboveElbow', type: 'num', label: 'Upper arm round above the elbow', min: 150, max: 500, step: 1 },
      { k: 'elbow', type: 'num', label: 'Elbow round, bent', min: 180, max: 500, step: 1 },
      { k: 'skirt', type: 'num', label: 'Waist to mid-thigh', min: 150, max: 450, step: 1 },
      { k: 'thigh', type: 'num', label: 'Thigh round at the top', min: 350, max: 900, step: 1 },
      { k: 'aboveKnee', type: 'num', label: 'Thigh round above the knee', min: 250, max: 700, step: 1 },
      { k: 'thighL', type: 'num', label: 'Hip bone to knee', min: 300, max: 650, step: 1 },
      { k: 'knee', type: 'num', label: 'Knee round, bent', min: 280, max: 700, step: 1 }] },
    { title: 'Head and feet', fields: [
      { k: 'visor', type: 'seg', options: [['yes', 'Helmet with visor'], ['no', 'Open face']] },
      { k: 'headC', type: 'num', label: 'Head round (over the brow)', min: 450, max: 700, step: 1 },
      { k: 'faceH', type: 'num', label: 'Brow to chin', min: 140, max: 260, step: 1 },
      { k: 'crown', type: 'num', label: 'Brow to top of head', min: 70, max: 160, step: 1 },
      { k: 'helmLiner', type: 'num', label: 'Helmet padding (mm)', min: 3, max: 25, step: 1 },
      { k: 'shoeL', type: 'num', label: 'Shoe length (outside)', min: 180, max: 340, step: 1 },
      { k: 'shoeW', type: 'num', label: 'Shoe width', min: 60, max: 140, step: 1 },
      { k: 'instep', type: 'num', label: 'Shoe height at the instep', min: 40, max: 110, step: 1 }],
      hint: 'These start as estimates from your height and shoe size: measure your head and the shoes you will wear under the sabatons and put in the real numbers. Helmets need more padding than other pieces, about 8–12 mm of foam.' }
  ],
  tips: [
    'PLA or PETG, 0.2 mm layers, 4 walls, 15 % infill. Every part prints standing up as exported, no supports. A brim helps the tall plates.',
    'Joins: the left and right halves of each big plate butt together under a centre strip. Put M3 screws (8–10 mm, pan or button head) through the strip and both halves, with nuts inside. Brass split rivets look more period and work the same way.',
    'Lames (pauldrons, faulds) hang on leather or webbing strips behind them: a screw or rivet through each hole into the strip. Keep them a little loose so the lames slide.',
    'Straps: 25 mm leather or webbing with buckles. Breast and back join with straps over the shoulders and under the arms. Cuisses and tassets hang from a belt.',
    'Lining: EVA craft foam cut to each plate, held by the straps or a few stitches through the slots. Sand every edge smooth before wearing.',
    'Helmet: print it upside down, standing on its tip, with a brim. That way every surface leans less than 50°, and the face opening needs no support. The little finial pushes into the hole at the top. The visor pivots on two M4 screws with nyloc nuts.',
    'Sabatons: the lames ride on two leather strips inside, a screw or rivet through each hole. A strap under the shoe through the side slots holds them on.',
    'Paint: filler primer, sand, then metallic paint and a dark wash for steel, or browns and dry-brushed edges for leather. Gothic flutes look great with a black wash.'
  ],
  build(W, p) {
    const M = W.Manifold, R = p.room, th = p.th, style = p.style, BEAD = 1.3, CL = th + BEAD + .6 + (style === 'gothic' ? 1.3 : 0);   /* CL: gap between nested plates, clear of the rolled edge */
    const parts = [], asm = [];
    /* booleans can leave two bits of the plate touching at a single point; a slicer sees that as a broken edge.
       Weld each such point with a tiny cube (0.4 mm, far below what prints). */
    const weld = m => {
      for (let pass = 0; pass < 8; pass++) {
        const mesh = m.getMesh(), P = mesh.vertProperties, np = mesh.numProp, seen = new Set(), at = [];
        for (let v = 0; v < P.length / np; v++) { const k = P[v * np] + ',' + P[v * np + 1] + ',' + P[v * np + 2]; if (seen.has(k)) at.push([P[v * np], P[v * np + 1], P[v * np + 2]]); else seen.add(k); }
        if (!at.length) break;
        m = m.add(M.union(at.map(q => M.cube(.4 + pass * .15, true).rotate([pass * 17, pass * 29, pass * 11]).translate(q))));
      }
      return m;
    };
    const add = (name, what, count, m, place, c) => { m = weld(m.simplify(.02)); parts.push({ name, what, count, m }); if (place) for (const pl of [].concat(place)) asm.push({ m: pl(m), c }); };
    const rotZ = (m, d) => m.rotate([0, 0, d]);

    /* ---- style: extra thickness (rolled edge, ridges or flutes, crest) ----
       Gothic and fantasy edges are roped: the roll carries little slanted ridges, like twisted rope.
       On torso plates (centre given) the gothic flutes fan out from the waist across the chest. */
    const trimFor = (L, { ridge = true, flutes = true, centre = null, z0 = 0, Ltot = L } = {}) => (s, z, al, t) => {
      const ds = Math.min(s, 1 - s) * al, dz = Math.min(z, L - z), d = Math.min(ds, dz);
      let roll = Math.max(0, 1 - d / 4) ** 1.5;
      if (style !== 'plain' && roll > 0) { const along = ds < dz ? z : s * al; roll *= .62 + .38 * Math.sin(2 * Math.PI * (along + d * 1.3) / 5.5); }
      let e = BEAD * roll;
      const bump = (sc, h, w) => { const q = ((s - sc) * al) / (w / 2); return h * Math.exp(-q * q); };
      if (ridge && style === 'plain') e += bump(.5, 1.8, 10);
      if (ridge && style === 'fantasy') e += bump(.5, 3.2, 7) + bump(.5, 1, 22);
      if (flutes && style === 'gothic') {
        if (centre === null) for (const sc of [.2, .32, .44, .56, .68, .8]) e += bump(sc, 1.2, 6) * smooth(0, L * .3, z) * (1 - .4 * smooth(L * .7, L, z));
        else {
          const za = z + z0, fan = .35 + .65 * smooth(0, Ltot, za), dt = t - centre;
          for (const k of [-3, -2, -1, 1, 2, 3]) { const q = (dt - k * 13 * fan) / 2.6; e += 1.25 * Math.exp(-q * q) * smooth(Ltot * .08, Ltot * .3, za) * (1 - .5 * smooth(Ltot * .8, Ltot, za)); }
        }
      }
      return e;
    };
    /* ---- style: shaped lower edges (scallops or points), cut along the bottom of a shell ---- */
    function edgeCut(o, zEdge, from, to, step) {
      if (style === 'plain') return null;
      const cuts = [], n = Math.max(2, Math.round((to - from) / step));
      for (let i = 0; i <= n; i++) {
        const t = from + (to - from) * i / n, f = frame(o, t, Math.max(.5, zEdge));
        if (style === 'gothic') {      /* scallops: half-round bites between cusps */
          if (i === n) break;
          const tm = from + (to - from) * (i + .5) / n, g = frame(o, tm, Math.max(.5, zEdge)), rr = Math.min(9, step * .3 * (Math.PI / 180) * g.r);
          cuts.push(rod(W, g.p.map((x, j) => x - g.n[j] * 6), g.p.map((x, j) => x + g.n[j] * 12), Math.max(3, rr), 24).translate([0, 0, zEdge - g.p[2]]));
        } else {                        /* fantasy: V notches between points */
          if (i === 0 || i === n) continue;
          const tm = from + (to - from) * (i - .5) / n, g = frame(o, tm, Math.max(.5, zEdge)), w = Math.min(15, step * .55 * (Math.PI / 180) * g.r);
          const u = g.tg.map((x, j) => (x + [0, 0, 1][j]) / Math.SQRT2), v = g.n, ww = g.tg.map((x, j) => ([0, 0, 1][j] - x) / Math.SQRT2);
          cuts.push(boxAt(W, [w, 30, w], [g.p[0], g.p[1], zEdge - w * .1], u, v, ww));
        }
      }
      return cuts.length ? M.union(cuts) : null;
    }
    const cutEdge = (m, o, zEdge, from, to, step) => { const c = edgeCut(o, zEdge, from, to, step); return c ? m.subtract(c) : m; };

    /* ---- strap slots and screw holes ---- */
    const slot = (o, t, z, along) => holeAt(W, o, t, z, along ? p.strap + 1.5 : 3.6, along ? 3.6 : p.strap + 1.5);
    const screw = (o, t, z) => roundHole(W, o, t, z, 3.4);

    /* ================= torso ================= */
    /* ring at height z on a torso whose waist is at z=0, chest line at zC and top at zT */
    const torso = (zC, zT, extra) => z => {
      const u = z <= zC ? smooth(0, zC, z) : 1, v = z > zC ? smooth(zC, zT, z) : 0;
      const C = (p.waist + (p.chest - p.waist) * u) * (1 - .06 * v), k = 1.25 + .1 * u + .25 * v;
      const fl = 7 * Math.max(0, 1 - z / 35) ** 2;                      /* the lower edge flares out a little at the waist */
      const e = ellipseFor(C, k); return { a: e.a + R + extra + fl, b: e.b + R + extra + fl };
    };
    const ellCyl = (rx, rz, len, x, y, z) => M.cylinder(len, 1, 1, 64, true).scale([rx, rz, 1]).rotate([90, 0, 0]).translate([x, y, z]);
    /* the raised rib along a cut edge: the plate made thicker, kept only in a band around the cut */
    const ribAlong = (o, cut, cutGrown) => shell(W, { ...o, th: o.th + 1.2, bulge: (t, z) => (o.bulge ? o.bulge(t, z) : 0) + .4 }).intersect(cutGrown.subtract(cut));
    /* the top edge of a lower plate: a cutter above a curve that rises towards the middle */
    function topContour(zMid, drop, pw, xMax, grow = 0) {
      const pts = [];
      for (let i = 0; i <= 60; i++) { const x = -xMax + 2 * xMax * i / 60; pts.push([x, zMid - grow - drop * Math.abs(x / xMax) ** pw]); }
      pts.push([xMax + 50, zMid - drop - grow], [xMax + 50, 2000], [-xMax - 50, 2000], [-xMax - 50, zMid - drop - grow]);
      return M.extrude(W.CrossSection.ofPolygons([pts]), 800, 0, 0, [1, 1], true).rotate([90, 0, 0]);
    }
    /* one plate (front or back), split into halves joined by a centre strip; returns the parts.
       o.bulge(t, zAbs) pushes the plate out (the rounded chest); o.stopRib adds the V rib below the neck;
       o.contour = [drop, power] shapes the top edge of a lower plate. */
    function plateHalves(tag, label, ring, z0, z1, centre, half, cutTop, isLower, stripFrom = 0, opt = {}) {
      const L = z1 - z0, rg = z => ring(z + z0), gap = .3;
      const spanR = () => [centre - half, centre - gap], spanL = () => [centre + gap, centre + half];
      const bulge = opt.bulge ? (t, z) => opt.bulge(t, z + z0) : null;
      const base = trimFor(L, { ridge: false, centre, z0, Ltot: opt.Ltot || L });
      const ex = opt.stopRib ? (s, z, al, t) => { const dt = Math.abs(t - centre), zr = L - 72 + .9 * dt; return base(s, z, al, t) + (dt < 55 ? 1.8 * Math.exp(-(((z - zr) / 2.6) ** 2)) : 0); } : base;
      const oR = { L, ring: rg, span: spanR, th, extra: ex, bulge, nu: 72 }, oL = { L, ring: rg, span: spanL, th, extra: ex, bulge, nu: 72 };
      let hr = shell(W, oR), hl = shell(W, oL);
      /* centre strip over the seam: a narrow band one plate-thickness further out, with the style's ridge */
      /* (on an upper plate the strip stops above the lower plate, which overlaps the bottom of the upper one) */
      const sw = 22, LS = L - stripFrom, rgS = z => { const r = rg(z + stripFrom); return { a: r.a + th + BEAD + 2.1 + (style === 'gothic' ? 1.3 : 0), b: r.b + th + BEAD + 2.1 + (style === 'gothic' ? 1.3 : 0) }; };   /* clear of the ribs under it */
      const bS = bulge ? (t, z) => bulge(t, z + stripFrom) : null;
      const oS = { L: LS, ring: rgS, bulge: bS, span: z => { const d = (sw / frame({ ring: rgS }, centre, z).r) * 180 / Math.PI; return [centre - d, centre + d]; }, th: th * .9, extra: trimFor(LS), nu: 24 };
      let strip = shell(W, oS).translate([0, 0, stripFrom]);
      const oSz = { ...oS, ring: z => rgS(z - stripFrom), bulge: bS ? (t, z) => bS(t, z - stripFrom) : null };
      /* screw holes through strip and halves, 3 or 4 down the seam */
      const nH = LS > 200 ? 4 : 3, holes = [];
      for (let i = 0; i < nH; i++) { const z = stripFrom + 16 + (LS - 32) * i / (nH - 1); for (const d of [-11, 11]) { holes.push(screw(oSz, angleAlong(oSz, centre, z, d), z)); } }
      const H = M.union(holes); hr = hr.subtract(H); hl = hl.subtract(H); strip = strip.subtract(H);
      /* neck and armholes on the upper plate, each with a raised rib along the edge */
      if (cutTop) {
        const c = cutTop(z0, 0), cg = cutTop(z0, 4.5);
        hr = hr.subtract(c).add(ribAlong(oR, c, cg)); hl = hl.subtract(c).add(ribAlong(oL, c, cg)); strip = strip.subtract(c);
      }
      /* the top edge of a lower plate, shaped to the style, with a rib along it */
      if (opt.contour) {
        const [drop, pw] = opt.contour, xMax = Math.max(rg(L).a, rg(0).a) + 10;
        const c = topContour(L, drop, pw, xMax), cg = topContour(L, drop, pw, xMax, 4.5);
        hr = hr.subtract(c).add(ribAlong(oR, c, cg)); hl = hl.subtract(c).add(ribAlong(oL, c, cg)); strip = strip.subtract(c);
      }
      /* side strap slots near the outer edges, and the style's lower edge on the lower plate */
      const zs = isLower ? [L * .4] : [Math.max(20, L * .35)];
      for (const z of zs) { hr = hr.subtract(slot(oR, angleAlong(oR, spanR()[0], z, 9), z)); hl = hl.subtract(slot(oL, angleAlong(oL, spanL()[1], z, -9), z)); }
      if (isLower) { hr = cutEdge(hr, oR, 0, spanR()[0] + 4, spanR()[1] - 2, 14); hl = cutEdge(hl, oL, 0, spanL()[0] + 2, spanL()[1] - 4, 14); }
      /* name the halves by the wearer's side (+x is the wearer's right) */
      const rIsRight = Math.cos((centre - half / 2) * Math.PI / 180) > 0;
      const A = rIsRight ? ['right', hr] : ['left', hr], B = rIsRight ? ['left', hl] : ['right', hl];
      return [[`${tag}-${A[0]}`, `${label}, ${A[0]} half`, A[1]], [`${tag}-${B[0]}`, `${label}, ${B[0]} half`, B[1]], [`${tag}-strip`, `${label}, centre strip`, strip]];
    }

    const frontTop = p.front, zCf = frontTop - 150;
    const backTop = p.backL, zCb = backTop - 170;
    const armX = p.shoulders / 2 - 20;
    function cutsFor(top, zC, neckR, neckDepth, isFront) {
      return (z0, g = 0) => M.union([
        ellCyl(neckR + g, neckDepth + 3 + g, 500, 0, 0, top - z0 + 3),
        ellCyl(85 + g, top - zC + 10 + g, 500, armX, 0, top + 25 - z0), ellCyl(85 + g, top - zC + 10 + g, 500, -armX, 0, top + 25 - z0)
      ]);
    }
    function torsoPlate(which) {
      const front = which === 'breast', top = front ? frontTop : backTop, zC = front ? zCf : zCb;
      const centre = front ? 90 : 270, half = 82;
      const split = top * (front ? .38 : .42), lap = 45;
      const out = [];
      /* a rounded, pigeon-breasted chest on the front; a gentle swell over the shoulder blades on the back */
      const bulge = front ? (t, z) => 14 * Math.exp(-(((t - 90) / 40) ** 2)) * Math.exp(-(((z - zC) / 115) ** 2))
                          : (t, z) => 5 * (Math.exp(-(((t - 235) / 22) ** 2)) + Math.exp(-(((t - 305) / 22) ** 2))) * Math.exp(-(((z - zC - 40) / 80) ** 2));
      const contour = front ? ({ plain: [30, 2], gothic: [70, 1.15], fantasy: [80, .75] })[style] : [18, 2];
      const upper = plateHalves(front ? 'breast' : 'back', front ? 'Breastplate' : 'Backplate', torso(zC, top, 0), split, top, centre, half,
        cutsFor(top, zC, front ? 78 : 60, front ? 55 : 28, front), false, lap + 2, { bulge, stopRib: front, Ltot: top });
      const lower = plateHalves(front ? 'plackart' : 'lowerback', front ? 'Plackart (lower plate)' : 'Lower back plate', torso(zC, top, CL), 0, split + lap, centre, half - 4, null, true, 0, { bulge, contour, Ltot: top });
      /* shoulder strap slots on the upper plate, running across the strap */
      const fixUpper = upper.map(([n, w, m]) => {
        if (n.endsWith('strip')) return [n, w, m];
        const L = top - split, o = { L, ring: z => torso(zC, top, 0)(z + split), span: () => [0, 360], th };
        const tS = Math.acos(Math.min(.99, (p.shoulders / 2 - 95) / o.ring(L - 40).a)) * 180 / Math.PI;
        const t = n.endsWith('right') ? (front ? tS : 360 - tS) : (front ? 180 - tS : 180 + tS);
        return [n, w, m.subtract(slot(o, t, L - 42, true))];
      });
      for (const [n, w, m] of fixUpper) out.push([n, w, m, split]);
      for (const [n, w, m] of lower) out.push([n, w, m, 0]);
      return out;
    }

    /* ================= limbs ================= */
    /* a tube piece along a limb, narrow end at z=0; full = front and back shells, otherwise front only */
    function limb(tag, label, { c0, c1, len, s0, s1, k0, k1, full, frontPct, levels }) {
      const L = Math.max(40, len - s0 - s1);
      const circ = z => c0 + (c1 - c0) * smooth(0, 1, (z + s0) / len);
      const ring = z => { const e = ellipseFor(circ(z), k0 + (k1 - k0) * z / L), fl = 2.5 * (Math.max(0, 1 - z / 12) ** 2 + Math.max(0, 1 - (L - z) / 12) ** 2); return { a: e.a + R + fl, b: e.b + R + fl }; };
      const half = frontPct * 1.8, g = z => 360 * 5 / circ(z);
      const fS = z => [90 - half + g(z) / 2, 90 + half - g(z) / 2], bS = z => [90 + half + g(z) / 2, 450 - half - g(z) / 2];
      const oF = { L, ring, span: fS, th, extra: trimFor(L), nu: 80 }, oB = { L, ring, span: bS, th, extra: trimFor(L, { ridge: false, flutes: false }), nu: 64 };
      let F = shell(W, oF), B = full ? shell(W, oB) : null;
      for (const u of levels) {
        const z = L * u;
        F = F.subtract(slot(oF, angleAlong(oF, fS(z)[0], z, 9), z)).subtract(slot(oF, angleAlong(oF, fS(z)[1], z, -9), z));
        if (B) B = B.subtract(slot(oB, angleAlong(oB, bS(z)[0], z, 9), z)).subtract(slot(oB, angleAlong(oB, bS(z)[1] - 360, z, -9), z));
      }
      const out = [[`${tag}-front`, `${label}, front`, F]];
      if (B) out.push([`${tag}-back`, `${label}, back`, B]);
      return { out, L };
    }
    /* a cop (knee or elbow): a barrel-shaped plate that bulges over the joint */
    function cop(tag, label, C, L, orig = 'right', over = 0) {
      const r0 = Math.max(C / (2 * Math.PI) + R, over);          /* over: the plate it laps over at its ends */
      const ring = z => { const r = r0 * (1 + .22 * Math.sin(Math.PI * z / L)); return { a: r, b: r }; };
      const span = () => [-20, 200];
      const o = { L, ring, span, th, extra: trimFor(L), nu: 88 };
      let m = shell(W, o);
      for (const u of [.2, .8]) { const z = L * u; m = m.subtract(slot(o, angleAlong(o, -20, z, 9), z)).subtract(slot(o, angleAlong(o, 200, z, -9), z)); }
      m = cutEdge(m, o, 0, 15, 165, 20);
      /* the fan on the outer side: a flat wing standing off the joint, as on real couters and poleyns */
      const CSx = W.CrossSection, fw = Math.min(r0 * .62, L * .24), fh = L * .3,     /* fw runs along the limb, kept clear of the plate above */ ta = 27.3, rm = r0 * 1.22;
      let fan;
      if (style === 'fantasy') fan = CSx.circle(fw * 1.6, 96).translate([fw * .75, 0]).intersect(CSx.circle(fw * 1.6, 96).translate([-fw * .75, 0])).scale([1, fh / fw]);
      else fan = CSx.circle(1, 96).scale([fw, fh]);
      if (style === 'gothic') { const bites = []; for (let k = 0; k < 14; k++) { const a = k / 14 * 2 * Math.PI; bites.push(CSx.circle(Math.min(fw, fh) * .16, 24).translate([Math.cos(a) * fw * 1.02, Math.sin(a) * fh * 1.02])); } fan = fan.subtract(CSx.union(bites)); }
      let F = M.extrude(fan, th);
      /* a raised rim, and for gothic three ribs fanning out */
      F = F.add(M.extrude(fan.subtract(fan.offset(-3.5, 'Round')), 1.4).translate([0, 0, th]));
      if (style === 'gothic') for (const a of [-35, 0, 35]) F = F.add(M.extrude(CSx.square([fw * 1.6, 2.2], true).translate([fw * .4, 0]).rotate(a).intersect(fan.offset(-4, 'Round')), 1.2).translate([0, 0, th]));
      /* stand it up against the side of the cop: plate in the y-z plane, a little turned towards the front */
      F = F.transform([0, 0, 1, 0, 1, 0, 0, 0, 0, 1, 0, 0, rm - 1.37, 0, L / 2, 1]).rotate([0, 0, ta]);
      m = m.add(F);
      const mL = m.mirror([1, 0, 0]);
      const other = orig === 'right' ? 'left' : 'right';
      return [[`${tag}-${orig}`, `${label}, ${orig}`, m], [`${tag}-${other}`, `${label}, ${other}`, mL]];
    }

    /* ================= pauldron: cap and three lames ================= */
    function pauldron() {
      const ra = p.arm / (2 * Math.PI) + R + 22, capH = 95;
      const out = [];
      const capRing = z => { const r = ra * (1 - .42 * smooth(capH * .45, capH, z)); return { a: r, b: r }; };
      const oC = { L: capH, ring: capRing, span: () => [-115, 115], th, extra: trimFor(capH), nu: 96 };
      let cap = shell(W, oC);
      cap = cap.subtract(slot(oC, 0, capH - 18, true));                          /* strap to the breastplate */
      for (const t of [-95, 95]) cap = cap.subtract(screw(oC, t, 7));
      cap = cutEdge(cap, oC, 0, -100, 100, 18);
      out.push(['pauldron-cap', 'Pauldron cap', cap, 0]);
      for (let i = 1; i <= 3; i++) {
        const rL = ra - i * CL, H = 42, sp = 112 - i * 4;
        const o = { L: H, ring: () => ({ a: rL, b: rL }), span: () => [-sp, sp], th, extra: trimFor(H, { ridge: false }), nu: 80 };
        let m = shell(W, o);
        for (const t of [-(sp - 17), sp - 17]) for (const z of [6, H - 6]) m = m.subtract(screw(o, t, z));
        m = cutEdge(m, o, 0, -sp + 6, sp - 6, 18);
        out.push([`pauldron-lame-${i}`, `Pauldron lame ${i}`, m, -30 * i]);
      }
      return out;
    }

    /* ================= faulds and tassets ================= */
    function faulds() {
      const out = [];
      const hipC = z => p.waist + (p.hips - p.waist) * smooth(0, -150, z);
      const base = 2 * CL + 15;                              /* outside the plackart and its flared lower edge */
      for (let i = 1; i <= 3; i++) {
        const H = 52, z0 = -42 * i, off = base - (i - 1) * CL;
        const ring = z => { const e = ellipseFor(hipC(z + z0), 1.25 + .07 * smooth(0, -150, z + z0)); return { a: e.a + R + off, b: e.b + R + off }; };
        for (const [side, sp] of [['right', [12, 89.5]], ['left', [90.5, 168]]]) {
          const o = { L: H, ring, span: () => sp, th, extra: trimFor(H, { ridge: false, flutes: i === 1 }), nu: 64 };
          let m = shell(W, o);
          for (const t of [sp[0] + 10, sp[1] - 10]) for (const z of [6, H - 6]) m = m.subtract(screw(o, t, z));
          if (i === 3) m = cutEdge(m, o, 0, sp[0] + 3, sp[1] - 3, 13);
          out.push([`fauld-${i}-${side}`, `Fauld lame ${i}, ${side}`, m, z0]);
        }
      }
      /* tassets: three lames over each thigh, hung from the lowest fauld */
      const tL = Math.max(90, p.skirt - 110), lH = tL / 3 + 12, rt = ellipseFor(p.thigh, 1.15).a + R + 3 * CL + 4;      /* the smallest lame still clears the cuisse */
      for (let j = 0; j < 3; j++) {
        const r = rt - j * CL, top = -42 * 3 - 4 - j * (lH - 12);
        const o = { L: lH, ring: () => ({ a: r, b: r }), span: () => [36 + j * 2, 144 - j * 2], th, extra: trimFor(lH, { ridge: j === 0, flutes: j === 0 }), nu: 64 };
        let t = shell(W, o);
        for (const a of [58 + j * 2, 122 - j * 2]) for (const z of [6, lH - 6]) t = t.subtract(screw(o, a, z));
        if (j === 0) t = t.subtract(slot(o, 90, lH - 10, true));
        if (j === 2) t = cutEdge(t, o, 0, 42, 138, 16);
        out.push([`tasset-${j + 1}`, `Tasset lame ${j + 1} (one per thigh)`, t, top - lH]);
      }
      return out;
    }

    /* ================= gorget ================= */
    function gorget() {
      const rn = p.neck / (2 * Math.PI) + R + 4, H = 70;
      const ring = z => { const u = smooth(0, H, z); return { a: rn + 70 * (1 - u), b: rn + 50 * (1 - u) }; };
      const out = [];
      for (const [n, sp] of [['front', [5, 175]], ['back', [185, 355]]]) {
        const o = { L: H, ring, span: () => sp, th, extra: trimFor(H, { ridge: false }), nu: 96 };
        let m = shell(W, o);
        for (const z of [H * .4]) m = m.subtract(slot(o, angleAlong(o, sp[0], z, 9), z)).subtract(slot(o, angleAlong(o, sp[1], z, -9), z));
        m = cutEdge(m, o, 0, sp[0] + 8, sp[1] - 8, 20);
        out.push([`gorget-${n}`, `Gorget, ${n}`, m]);
      }
      return out;
    }

    /* ================= helmet: a pointed bascinet, open face, optional visor ================= */
    function helmet() {
      const hr = p.helmLiner + 2, e = ellipseFor(p.headC, .8);          /* e.a: half the width, e.b: half the length */
      const A = e.a + hr, B = e.b + hr, zb = p.faceH * .8, Hc = (p.crown + hr) * 1.35, H = zb + Hc;
      const f = z => z <= zb ? 1 + .06 * Math.max(0, 1 - z / 25) ** 2 : Math.max(.09, 1 - ((z - zb) / Hc) ** 1.6);
      const ring = z => ({ a: A * f(z), b: B * f(z) });
      const ex = (s, z, al) => {
        let x = BEAD * Math.max(0, 1 - z / 5) ** 1.5;
        const ang = s * 360, d = Math.min(Math.abs(ang - 90), Math.abs(ang - 270));    /* front-back crest line */
        if (style === 'fantasy') x += 3.2 * Math.exp(-((d / 6) ** 2)) * smooth(zb - 30, zb + 20, z);
        if (style === 'plain') x += 1.6 * Math.exp(-((d / 5) ** 2)) * smooth(zb, zb + 30, z);
        if (style === 'gothic') for (let k = 0; k < 16; k++) { const dd = Math.abs(((ang - k * 22.5 + 540) % 360) - 180); x += 1.1 * Math.exp(-((dd / 3.5) ** 2)) * smooth(zb + 10, zb + 50, z) * (1 - smooth(H - 30, H, z)); }
        return x;
      };
      const o = { L: H, ring, span: () => [-90, 270], th, extra: ex, nu: 160, closed: true, nz: Math.round(H / 2.5) };
      let m = shell(W, o);
      /* face opening: a rounded rectangle in the front, from the chin up to the brow */
      const ow = Math.min(A * 1.7, 150), rr = 34;
      const box = (x0, z0, x1, z1) => M.cube([x1 - x0, 400, z1 - z0]).translate([x0, 0, z0]);
      const opening = g => M.union([box(-ow / 2 - g, -5 - g, ow / 2 + g, zb - rr), box(-ow / 2 + rr, -5 - g, ow / 2 - rr, zb + g),
        M.cylinder(400, rr + g, rr + g, 48).rotate([-90, 0, 0]).translate([-ow / 2 + rr, 0, zb - rr]), M.cylinder(400, rr + g, rr + g, 48).rotate([-90, 0, 0]).translate([ow / 2 - rr, 0, zb - rr])]);
      const open = opening(0);
      /* a raised rib all round the face opening, as on a real bascinet */
      const rib = shell(W, { ...o, th: th + 1.4, bulge: () => .4 }).intersect(opening(5).subtract(open));
      m = m.subtract(open).add(rib);
      /* breaths: a cluster of small holes on the right cheek */
      const br = [];
      for (let r = 0; r < 4; r++) for (let k = 0; k < 3; k++) br.push(roundHole(W, o, 6 + k * 6 + (r % 2) * 3, 45 + r * 13, 4));
      m = m.subtract(M.union(br));
      /* holes: lining laces round the rim, the visor pivots, and the finial at the top */
      const holes = [];
      for (let k = 0; k < 14; k++) { const t = 135 + k * (270 / 13); holes.push(roundHole(W, o, t, 12, 2.5)); }
      const pivZ = zb - 20, pivT = [90 - 88, 90 + 88];
      if (p.visor === 'yes') for (const t of pivT) holes.push(roundHole(W, o, t, pivZ, 4.4));
      m = m.subtract(M.union(holes));
      const out = [['helmet', 'Helmet (print upside down)', m]];
      /* finial: plugs the small hole at the top */
      const rTop = Math.min(A, B) * .09;
      const fin = M.union([M.cylinder(6, rTop - .25, rTop - .25, 32).translate([0, 0, -6]), M.cylinder(style === 'fantasy' ? 26 : 10, rTop + 4, style === 'fantasy' ? .8 : rTop + 1, 32)]);
      out.push(['helmet-finial', 'Finial for the top', fin.translate([0, 0, 6])]);
      if (p.visor === 'yes') {
        /* visor: a band over the face opening, a little further out, with vertical eye slits and breaths */
        const gap = th + BEAD + 2.5, vR = z => { const r = ring(z); return { a: r.a + gap, b: r.b + gap }; };
        /* the snout: the visor is pushed forward round the nose and mouth, pointed for gothic (a hounskull) */
        const snout = { plain: 8, gothic: 30, fantasy: 17 }[style], eyeZ0 = zb - 42;
        const vH = zb + 14, ov = { L: vH, ring: vR, span: () => [2, 178], th, extra: trimFor(vH), nu: 120, nz: Math.round(vH / 2.5),
          bulge: (t, z) => snout * Math.exp(-(((t - 90) / (style === 'gothic' ? 22 : 30)) ** 2)) * Math.exp(-(((z - (eyeZ0 - 30)) / 48) ** 2)) };
        let v = shell(W, ov);
        const cuts = [];
        const eyeZ = zb - 42;
        for (let k = -7; k <= 7; k++) { if (Math.abs(k) < 1) continue; const t = 90 + k * 5.2; const fr = frame(ov, t, eyeZ); cuts.push(boxAt(W, [3.4, 30, 16], fr.p, fr.tg, fr.n, [0, 0, 1])); }
        for (let r = 0; r < 3; r++) for (let k = 0; k < 5; k++) cuts.push(roundHole(W, ov, 52 + k * 5, eyeZ - 45 - r * 12, 4));
        for (const t of [2, 178]) cuts.push(roundHole(W, ov, angleAlong(ov, t, pivZ, t < 90 ? 8 : -8), pivZ, 4.4));
        v = v.subtract(M.union(cuts));
        out.push(['helmet-visor', 'Visor', v]);
      }
      return { out, H };
    }

    /* ================= sabatons: lames over the foot and a toe cap ================= */
    function sabaton() {
      /* lames alternate over and under: the odd ones sit outside both neighbours and carry the ridge, the even ones
         tuck under, so the sabaton keeps the shoe's width all the way to the toe */
      const a0 = p.shoeW / 2 + R + 3, Lf = p.shoeL * .62, nL = 4, lameL = 34, step = 26;
      const bAt = z => p.instep + R + 3 - (p.instep - 38) * smooth(0, Lf, z);
      const out = [];
      for (let i = 0; i < nL; i++) {
        const z0 = i * step, under = i % 2 === 1, off = under ? -CL : 0;
        const o = { L: lameL, ring: z => ({ a: a0 + off, b: bAt(z + z0) + off }), span: () => [0, 180], th, extra: trimFor(lameL, { ridge: !under, flutes: !under }), nu: 64 };
        let m = shell(W, o);
        for (const t of [10, 170]) for (const z of [6, lameL - 6]) m = m.subtract(screw(o, t, z));
        if (i === 0) for (const t of [3, 177]) m = m.subtract(holeAt(W, o, angleAlong(o, t, lameL / 2, t < 90 ? 6 : -6), lameL / 2, 3.6, 21));
        out.push([`sabaton-lame-${i + 1}`, `Sabaton lame ${i + 1}`, m, z0]);
      }
      /* toe cap: narrows to the toe; pointed styles run on into a long point */
      const z0 = nL * step, off = 0, tipL = style === 'plain' ? 0 : style === 'gothic' ? 30 : 60, Lc = 55 + tipL;
      const shrink = z => style === 'plain' ? 1 - .55 * smooth(15, 55, z) : 1 - .88 * smooth(15, Lc, z);
      const oc = { L: Lc, ring: z => ({ a: (a0 + off) * shrink(z) * (style === 'plain' ? 1 : 1 - .1 * smooth(0, 40, z)), b: (bAt(z0 + Math.min(z, 40)) + off) * shrink(z) }), span: () => [0, 180], th, extra: trimFor(Lc), nu: 64 };
      let cap = shell(W, oc);
      for (const t of [10, 170]) cap = cap.subtract(screw(oc, t, 6));
      for (const t of [3, 177]) cap = cap.subtract(holeAt(W, oc, angleAlong(oc, t, 26, t < 90 ? 6 : -6), 26, 3.6, 18));
      /* close the end with a small rounded tip */
      const end = oc.ring(Lc), rt = Math.max(end.a, end.b) + th + 1;
      cap = cap.add(M.sphere(rt, 32).scale([1, Math.max(.5, end.b / end.a), 1.4]).translate([0, 0, Lc]).intersect(M.cube([200, 200, 200], true).translate([0, 100, Lc + 100 - rt * .4])));
      out.push(['sabaton-toe', 'Sabaton toe cap', cap, z0]);
      return out;
    }

    /* ================= body positions for the whole-suit view ================= */
    const Hb = p.height, zCollar = .815 * Hb, zWaist = zCollar - p.front, zElbow = zCollar - p.armL, zKnee = .285 * Hb;
    const legX = p.thigh / (2 * Math.PI) + R + 22, armXp = p.shoulders / 2 + 5;
    const T = (x, y, z, rz = 0) => m => m.rotate([0, 0, rz]).translate([x, y, z]);
    const shZ = zCollar - 45, armOut = 11;     /* arms held a little away from the body, turning at the shoulder */
    const TA = (x, y, z, rz = 0) => m => T(x, y, z, rz)(m).translate([-Math.sign(x) * armXp, 0, -shZ]).rotate([0, -Math.sign(x) * armOut, 0]).translate([Math.sign(x) * armXp, 0, shZ]);
    const want = k => p.piece === k || p.piece === 'all';

    if (want('helmet')) { const { out } = helmet(); for (const [n, w, m] of out) add(n, w, 1, m, n === 'helmet-finial' ? null : T(0, 0, zCollar + 35), n === 'helmet-visor' ? 'c' : 'a'); }
    if (want('gorget')) for (const [n, w, m] of gorget()) add(n, w, 1, m, T(0, 0, zCollar - 30), 'a');
    for (const which of ['breast', 'back']) if (want(which)) for (const [n, w, m, z0] of torsoPlate(which)) add(n, w, 1, m, T(0, 0, zWaist + z0), n.includes('strip') ? 'c' : z0 ? 'a' : 'b');
    if (want('pauldron')) for (const [n, w, m, z0] of pauldron()) add(n, w, 2, m, [TA(armXp, 0, zCollar - 75 + z0), TA(-armXp, 0, zCollar - 75 + z0, 180)], n.includes('cap') ? 'a' : 'b');
    if (want('rerebrace')) { const { out } = limb('rerebrace', 'Rerebrace', { c0: p.aboveElbow, c1: p.arm, len: p.armL, s0: 45, s1: 80, k0: 1.05, k1: 1.05, full: true, frontPct: 55, levels: [.25, .75] }); for (const [n, w, m] of out) add(n, w, 2, m, [TA(armXp, 0, zElbow + 45, -90), TA(-armXp, 0, zElbow + 45, 90)], n.endsWith('front') ? 'a' : 'b'); }
    if (want('couter')) for (const [n, w, m] of cop('couter', 'Couter (elbow)', p.elbow, 110, 'left')) add(n, w, 1, m, n.endsWith('right') ? TA(armXp, 0, zElbow - 55, 180) : TA(-armXp, 0, zElbow - 55, 180), 'c');
    if (want('fauld')) for (const [n, w, m, z0] of faulds()) {
      if (n.startsWith('tasset')) add(n, w, 2, m, [T(legX, 0, zWaist + z0, -25), T(-legX, 0, zWaist + z0, 25)], 'a');
      else add(n, w, 1, m, T(0, 0, zWaist + z0), 'b');
    }
    if (want('cuisse')) { const { out } = limb('cuisse', 'Cuisse', { c0: p.aboveKnee, c1: p.thigh, len: p.thighL, s0: 40, s1: 75, k0: 1.1, k1: 1.15, full: false, frontPct: 55, levels: [.15, .5, .85] }); for (const [n, w, m] of out) add(n, w, 2, m, [T(legX, 0, zKnee + 40, -25), T(-legX, 0, zKnee + 40, 25)], 'a'); }
    if (want('poleyn')) for (const [n, w, m] of cop('poleyn', 'Poleyn (knee)', p.knee, 150, 'right', ellipseFor(p.aboveKnee * 1.03, 1.1).a + R + CL + 7)) add(n, w, 1, m, n.endsWith('right') ? T(legX, 0, zKnee - 75, -25) : T(-legX, 0, zKnee - 75, 25), 'c');

    if (want('sabaton')) {
      const footY = 40, ankleZ = .05 * Hb;
      const onFoot = (m, z0, x) => m.translate([0, 0, z0]).transform([-1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, x, footY - 70, 8, 1]);
      for (const [n, w, m, z0] of sabaton()) add(n, w, 2, m, [mm => onFoot(mm, z0, legX), mm => onFoot(mm, z0, -legX)], n.includes('toe') ? 'c' : 'b');
    }
    if (p.piece === 'all') {
      /* bracers, greaves and gauntlets from their own designs, with this suit's lining and style ridge */
      const st = { bead: 1.3, ridge: style === 'plain' ? 1.8 : style === 'fantasy' ? 3 : 0 };
      const br = armour.build(W, armour.derive({ part: 'bracer', lining: p.lining, pad: p.pad, ...st }));
      for (const pt of br.parts) add(`bracer-${pt.name.split('-').pop()}`, pt.what, 2, pt.m, [TA(armXp, 0, zElbow - 230, -90), TA(-armXp, 0, zElbow - 230, 90)], 'a');
      const gr = armour.build(W, armour.derive({ part: 'greave', len: 320, c0: 210, c1: 370, pad: p.pad, lining: p.lining, th: 2.6, close: 'straps', strap: 25, startOff: 25, endOff: 25, ...st }));
      for (const pt of gr.parts) add(`greave-${pt.name.split('-').pop()}`, pt.what, 2, pt.m, [T(legX, 0, 90), T(-legX, 0, 90)], 'a');
      const ga = gauntlet.build(W, gauntlet.derive({ pair: false }));
      for (const pt of ga.parts) add(`gauntlet-${pt.name}`, pt.what, 2, pt.m, null);
    }

    const count = parts.reduce((a, x) => a + x.count, 0);
    const stats = [['Parts to print', `${count}`, p.piece === 'all' ? 'whole suit, both sides' : PIECES.find(x => x[0] === p.piece)[1]],
      ['Style', { plain: 'Plain medieval', gothic: 'Gothic', fantasy: 'Fantasy' }[style], `lining ${p.lining} mm + clothing ${p.pad} mm`],
      ['Torso plates', `${r1(2 * torso(zCf, frontTop, 0)(zCf).a)} mm`, 'across at the chest, inside']];
    const notes = [];
    if (p.piece === 'all') notes.push(`The whole suit is ${count} prints. The filament figure assumes solid parts; at 15 % infill and 4 walls it is roughly half. Print and try one piece, such as a rerebrace, before printing everything.`);
    const tall = parts.filter(x => { const b = x.m.boundingBox(); return b.max[2] - b.min[2] > 345; });
    if (tall.length) notes.push(`${tall.map(x => x.name).join(', ')} ${tall.length > 1 ? 'are' : 'is'} taller than 345 mm. Split it or check your printer height.`);
    return { parts, asm, stats, notes, colors: { a: '--tray', b: '--post', c: '--lift' }, legend: [['--tray', 'Main plates'], ['--post', 'Lower plates and lames'], ['--lift', 'Strips and cops']] };
  }
};
