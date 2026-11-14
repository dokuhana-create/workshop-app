/* Hounskull: a pointed bascinet with a snouted visor that really opens and closes.
   Skull: an egg-shaped bascinet with its point a little behind the top of the head, an open face with a raised
   rib round it, a ridge over the top, holes for a liner, a mail or leather aventail and a chin strap.
   Visor: a cone-shaped snout with two eye slits (each with a raised lower lip, as on the originals), breaths,
   a lifting peg, and arms that pivot on an M5 screw at each temple. A raised boss with a small bump sits under
   each arm; the bump clicks into one hole when the visor is down and another when it is up, so the visor
   stays where you put it. No glue.
   Printing: the skull upside down on its point, the visor on the flat at the tip of its snout. Neither needs
   supports. Units: mm, Z up, the wearer faces +Y. */
import { ellipseFor, smooth, shell, frame, rod } from './prints-armour-lib.js?v=3';

const r1 = v => Math.round(v * 10) / 10;

export default {
  id: 'hounskull', title: 'Armour: hounskull helmet',
  intro: 'A pointed bascinet with a snouted "hound\'s skull" visor. The visor pivots at the temples, clicks into place both closed and open, and comes off with two screws.',
  defaults: { headC: 550, ratio: .8, faceH: 185, eyeDrop: 30, crown: 100, liner: 8, th: 2.4,
    snout: 'pointed', snoutL: 125, slitH: 10, breaths: 'both', ridge: 'yes', view: 'closed' },
  derive(o) {
    const p = { ...this.defaults, ...o };
    for (const k in this.defaults) if (typeof this.defaults[k] === 'number') p[k] = isFinite(+p[k]) ? +p[k] : this.defaults[k];
    p.snoutL = Math.min(160, Math.max(40, p.snoutL));
    p.slitH = Math.min(16, Math.max(6, p.slitH));
    return p;
  },
  sections: [
    { title: 'Your head (mm)', fields: [
      { k: 'headC', type: 'num', label: 'Head round, over the brow', min: 450, max: 700, step: 1 },
      { k: 'ratio', type: 'num', label: 'Width ÷ length of the head', min: .65, max: .95, step: .01 },
      { k: 'faceH', type: 'num', label: 'Brow to chin', min: 140, max: 260, step: 1 },
      { k: 'eyeDrop', type: 'num', label: 'Brow to the middle of the eyes', min: 15, max: 50, step: 1 },
      { k: 'crown', type: 'num', label: 'Brow to top of head', min: 70, max: 160, step: 1 },
      { k: 'liner', type: 'num', label: 'Padding inside (mm)', min: 4, max: 25, step: 1 }],
      hint: 'Head round: a tape over the eyebrows and round the widest part at the back. Width ÷ length: about 0.8 for most heads (measure ear to ear and brow to back with a ruler held flat if you can). Brow to top: a ruler flat on your head, measured down to the eyebrows. The eye slits are placed from "brow to the middle of the eyes", so check that one in a mirror.' },
    { title: 'Visor', fields: [
      { k: 'snout', type: 'seg', options: [['pointed', 'Hounskull (pointed)'], ['blunt', 'Pig-face (blunt)']] },
      { k: 'snoutL', type: 'num', label: 'Snout length (mm)', min: 40, max: 160, step: 1 },
      { k: 'slitH', type: 'num', label: 'Eye slit height (mm)', min: 6, max: 16, step: .5 },
      { k: 'breaths', type: 'seg', options: [['right', 'Breaths on the right'], ['both', 'Both sides'], ['none', 'No breaths']] },
      { k: 'ridge', type: 'seg', options: [['yes', 'Ridge down the snout and over the skull'], ['no', 'Smooth']] }],
      hint: 'Keep the snout at 120 mm or more: shorter, it gets too flat to print on its tip without supports. 10 mm eye slits match the originals; go up to 12–14 mm if you want more to see.' },
    { title: 'Preview', fields: [
      { k: 'view', type: 'seg', options: [['closed', 'Visor down'], ['open', 'Visor up']] },
      { k: 'th', type: 'num', label: 'Plate thickness (mm)', min: 1.8, max: 4, step: .2 }] }
  ],
  tips: [
    'PLA or PETG, 0.2 mm layers, 4 walls. Print the skull upside down standing on its point, and the visor standing on the flat at the tip of the snout, both with a brim and no supports. Every surface leans less than 50°.',
    'Pivots: an M5 × 16 button-head screw through the visor arm and the skull on each side, a spring washer under the screw head and a nyloc nut inside. Tighten until the visor clicks firmly into its two positions and stays there; back it off a little if it is hard to move.',
    'The visor comes off with the two screws, as the originals came off their hinge pins.',
    'Liner: a band of 8 mm EVA foam or a padded cap, stitched through the row of small holes above the brow. Leave the foam a few millimetres clear of the pivot nuts.',
    'Aventail: lace mail or a leather or padded fabric curtain through the holes along the lower edge at the back and sides. Chin strap: rivet or lace a leather strap to the two holes on each side behind the cheeks.',
    'The finial plugs the small hole at the point of the skull: push it in, no glue.',
    'Paint: filler primer and sanding, then metallic paint and a dark wash. Leave the inside of the eye slits dark, it makes them look deeper.'
  ],
  build(W, p) {
    const M = W.Manifold, th = p.th, BEAD = 1.3;
    /* ---------- skull ---------- */
    const hr = p.liner + 2, e = ellipseFor(p.headC, p.ratio);
    const A = e.a + hr, B = e.b + hr, zb = p.faceH * .8, zn = zb + 24, Hc = (p.crown + hr) * 1.4 - 8, H = zn + Hc;
    /* straight-sided up to a little above the brow (where the visor pivots), then rising to the point */
    const f = z => z <= zn ? 1 + .06 * Math.max(0, 1 - z / 25) ** 2 : Math.max(.09, 1 - ((z - zn) / Hc) ** 1.6);
    const ring = z => ({ a: A * f(z), b: B * f(z) });
    const ridgeOn = p.ridge === 'yes';
    const exS = (s, z, al, t) => {
      let x = BEAD * Math.max(0, 1 - z / 5) ** 1.5;
      if (ridgeOn) { const d = Math.min(Math.abs(t - 90), Math.abs(t - 270)); x += 1.8 * Math.exp(-((d / 4.5) ** 2)) * smooth(zn + 10, zn + 45, z) * (1 - smooth(H - 25, H, z)); }
      return x;
    };
    const oS = { L: H, ring, span: () => [-90, 270], th, extra: exS, nu: 160, closed: true, nz: Math.round(H / 2.5) };
    let skull = shell(W, oS);
    /* face opening with a raised rib round it */
    const ow = Math.min(A * 1.7, 150), rr = 34;
    const box = (x0, z0, x1, z1) => M.cube([x1 - x0, 400, z1 - z0]).translate([x0, 0, z0]);
    const opening = g => M.union([box(-ow / 2 - g, -5 - g, ow / 2 + g, zb - rr), box(-ow / 2 + rr, -5 - g, ow / 2 - rr, zb + g),
      M.cylinder(400, rr + g, rr + g, 48).rotate([-90, 0, 0]).translate([-ow / 2 + rr, 0, zb - rr]), M.cylinder(400, rr + g, rr + g, 48).rotate([-90, 0, 0]).translate([ow / 2 - rr, 0, zb - rr])]).translate([0, 0, -.37]);
    const open = opening(0);
    const rib = shell(W, { ...oS, th: th + 1.4, extra: null, bulge: () => .4 }).intersect(opening(5).subtract(open));
    skull = skull.subtract(open).add(rib);
    const pivZ = zb + 8, GAP = th + 2.7;               /* the visor sits GAP outside the skull's inside surface */
    /* bosses under the visor arms, each with a detent bump; and the holes */
    const BOSS_R = 7.5, DET_R = 5.5, beta = -140 * Math.PI / 180;
    const bosses = [], holes = [];
    for (const t of [0, 180]) {
      const fr = frame(oS, t, pivZ), n = fr.n, at = d => fr.p.map((x, i) => x + n[i] * d);
      bosses.push(rod(W, at(th - 1), at(GAP - .3), BOSS_R, 40));
      const c = at(GAP - .3 - .35);
      bosses.push(M.sphere(1, 20).translate([c[0], c[1] + DET_R * Math.cos(beta), c[2] + DET_R * Math.sin(beta)]));
      holes.push(rod(W, at(-6), at(GAP + 6), 2.65, 24));
    }
    /* liner stitching holes above the brow, all round */
    for (let k = 0; k < 24; k++) { const fr = frame(oS, k * 15 + 7.5, zb + 32), A0 = fr.p.map((x, i) => x - fr.n[i] * 6), B0 = fr.p.map((x, i) => x + fr.n[i] * 10); holes.push(rod(W, A0, B0, 1.3, 10)); }
    /* aventail lacing holes along the lower edge, round the back and sides */
    for (let k = 0; k <= 16; k++) { const t = 198 + k * (144 / 16), fr = frame(oS, t, 9); holes.push(rod(W, fr.p.map((x, i) => x - fr.n[i] * 6), fr.p.map((x, i) => x + fr.n[i] * 10), 1.6, 12)); }
    /* chin strap: two holes on each side, behind the cheeks */
    for (const t of [-24, 204]) for (const z of [22, 36]) { const fr = frame(oS, t, z); holes.push(rod(W, fr.p.map((x, i) => x - fr.n[i] * 6), fr.p.map((x, i) => x + fr.n[i] * 10), 1.8, 14)); }
    const bare = skull;                                  /* without the bosses: used to find how far the visor can open */
    skull = skull.add(M.union(bosses)).subtract(M.union(holes));
    /* the point sits a little behind the top of the head, as on most bascinets */
    const back = 32;
    const warpBack = v => { v[1] -= back * smooth(zn, H, v[2]); };
    skull = skull.warp(warpBack);
    const bareW = bare.warp(warpBack).intersect(M.cube([600, 600, 600]).translate([-300, -300, pivZ + 12]));
    const rTop = Math.min(A, B) * .09;
    const finial = M.union([M.cylinder(6, rTop - .25, rTop - .25, 32).translate([0, 0, -6]), M.cylinder(22, rTop + 4, .8, 32)]);

    /* ---------- visor ---------- */
    const vz0 = -35, vTop = pivZ + 15, vL = vTop - vz0;     /* from just below the chin to just above the brow */
    const eyeZ = zb - p.eyeDrop;
    const vRing = z => { const g = f(Math.max(0, z)); return { a: A * g + GAP, b: B * g + GAP }; };
    const zs = (vz0 + vTop) / 2 - 8;                      /* the tip of the snout: in front of the nose */
    /* the snout: a cone with a rounded-square base, so it fills the whole front of the visor and every part of
       it leans back at least 45° (that is what lets it print on its tip without supports) */
    const PW = 3, Rup = vTop - zs + 4, Rdn = zs - vz0 + 4, Ru = Math.max(92, B * .9), Ls = p.snoutL;
    const uOf = (t, z) => (t - 90) * Math.PI / 180 * vRing(z).b;
    const cone = (t, z) => { const u = Math.abs(uOf(t, z)) / Ru, w = Math.abs(z - zs) / (z > zs ? Rup : Rdn), r = (u ** PW + w ** PW) ** (1 / PW); return Ls * Math.max(0, 1 - r); };
    /* arms: the rear edge of the visor reaches back to the pivots at the temples and curves forward above and below */
    const t0 = z => -11 + 25 * smooth(15, 55, Math.abs(z - pivZ));
    const slitIn = 13, slitOut = 74;                     /* the eye slits run from 13 to 74 mm either side of the middle */
    const lipZ0 = eyeZ - p.slitH / 2 - 7, lipZ1 = eyeZ - p.slitH / 2 + .6;
    const exV = (s, zl, al, t) => {
      const z = zl + vz0, ds = Math.min(s, 1 - s) * al, dz = Math.min(zl, vL - zl), d = Math.min(ds, dz);
      let x = BEAD * Math.max(0, 1 - d / 4) ** 1.5;
      const au = Math.abs(uOf(t, z));
      /* the raised lower lip of each sight */
      if (au > slitIn - 4 && au < slitOut + 4) x += 2.4 * smooth(lipZ0, lipZ0 + 2, z) * (1 - smooth(lipZ1 - .6, lipZ1, z)) * smooth(slitIn - 4, slitIn - 1, au) * (1 - smooth(slitOut + 1, slitOut + 4, au));
      /* the keel down the middle of the snout */
      if (ridgeOn) x += 1.7 * Math.exp(-((uOf(t, z) / 3.5) ** 2)) * smooth(vz0 + 6, vz0 + 20, z) * (1 - smooth(vTop - 20, vTop - 6, z));
      return x;
    };
    const oV = { L: vL, ring: zl => vRing(zl + vz0), span: zl => [t0(zl + vz0), 180 - t0(zl + vz0)], th, extra: exV, bulge: (t, zl) => cone(t, zl + vz0), nu: 150, nz: Math.round(vL / 2) };
    let visor = shell(W, oV).translate([0, 0, vz0]);
    const fV = (t, z) => { const fr = frame(oV, t, z - vz0); fr.p[2] += vz0; return fr; };
    const holeV = (t, z, d) => { const fr = fV(t, z); return rod(W, fr.p.map((x, i) => x - fr.n[i] * 8), fr.p.map((x, i) => x + fr.n[i] * (cone(t, z) + 14)), d / 2, 14); };
    /* the tip: filled solid behind, and cut flat so it stands on the printer bed */
    const Rz = Math.min(Rup, Rdn), yTip = vRing(zs).b + Ls + th, D = p.snout === 'blunt' ? 34 : 11, dFlat = (D / 2) * Ls / ((Ru + Rz) / 2), hP = 16 + dFlat;
    const plug = M.cylinder(hP, hP * Rz / Ls * .9, 0, 48).scale([Ru / Rz, 1, 1]).rotate([-90, 0, 0]).translate([0, yTip - .7 - hP, zs]);
    visor = visor.add(plug.intersect(M.cube([400, hP + 2, 400], true).translate([0, yTip - hP / 2, zs]))).subtract(M.cube([400, 100, 400], true).translate([0, yTip - dFlat + 50, zs]));
    /* eye slits: wedges from the middle of the head, one each side of the nose bridge */
    const slits = [];
    for (const sgn of [1, -1]) {
      const tA = 90 - sgn * slitIn / vRing(eyeZ).b * 180 / Math.PI, tB = 90 - sgn * slitOut / vRing(eyeZ).b * 180 / Math.PI;
      const pa = fV(tA, eyeZ).p, pb = fV(tB, eyeZ).p, fa = Math.atan2(pa[1], pa[0]), fb = Math.atan2(pb[1], pb[0]);
      const pts = [[0, 0]]; for (let j = 0; j <= 16; j++) { const a = fa + (fb - fa) * j / 16; pts.push([600 * Math.cos(a), 600 * Math.sin(a)]); }
      slits.push(M.extrude(W.CrossSection.ofPolygons([sgn > 0 ? pts.reverse() : pts]), p.slitH).translate([0, 0, eyeZ - p.slitH / 2]));
    }
    visor = visor.subtract(M.union(slits));
    /* breaths: a cross of holes low on the snout, on the right or both sides */
    const br = [];
    const sides = p.breaths === 'both' ? [1, -1] : p.breaths === 'right' ? [1] : [];
    for (const sgn of sides) for (const [du, dz] of [[0, 0], [9, 0], [-9, 0], [0, 9], [0, -9], [18, 0], [0, 18], [0, -18], [9, 9], [9, -9], [-9, 9], [-9, -9]]) {
      const u = 46 + du, z = zs - 18 + dz, t = 90 - sgn * u / vRing(z).b * 180 / Math.PI;
      br.push(holeV(t, z, 4));
    }
    if (br.length) visor = visor.subtract(M.union(br));
    /* pivot holes and detent holes in the arms (closed and open positions) */
    /* how far the visor can swing up before its top edge meets the skull: open it in steps and test.
       The detent for "open" goes 3° short of that, so it rests on the click, not on the paint. */
    const top = visor.intersect(M.cube([600, 600, 80]).translate([-300, -300, pivZ - 20]));
    const hits = deg => bareW.intersect(top.translate([0, 0, -pivZ]).rotate([deg, 0, 0]).translate([0, 0, pivZ])).volume() > .05;
    let free = 40; for (let d = 44; d <= 80 && !hits(d); d += 4) free = d;
    for (let d = free + 1; d < free + 4 && d <= 80 && !hits(d); d++) free = d;
    const openDeg = Math.min(72, free - 3), OPEN = openDeg * Math.PI / 180, vh = [];
    for (const t of [0, 180]) {
      const fr = fV(t, pivZ), n = fr.n, P = fr.p;
      const thru = (dy, dz, r) => rod(W, [P[0] - n[0] * 6, P[1] + dy, P[2] + dz], [P[0] + n[0] * 10, P[1] + dy, P[2] + dz], r, 20);
      vh.push(thru(0, 0, 2.65));
      for (const g of [beta, beta - OPEN]) vh.push(thru(DET_R * Math.cos(g), DET_R * Math.sin(g), 1.15));
    }
    visor = visor.subtract(M.union(vh));
    /* lifting peg, low on the right */
    { const t = 90 - 78 / vRing(vz0 + 30).b * 180 / Math.PI, z = vz0 + 30, fr = fV(t, z), n = fr.n, out = cone(t, z) + th;
      const a0 = fr.p.map((x, i) => x + n[i] * (out - 1)), a1 = fr.p.map((x, i) => x + n[i] * (out + 11));
      const d = a1.map((x, i) => x - a0[i]), Lp = Math.hypot(...d), w = d.map(x => x / Lp), u = [-w[1], w[0], 0].map(x => x / Math.hypot(w[0], w[1]));
      const v = [w[1] * u[2] - w[2] * u[1], w[2] * u[0] - w[0] * u[2], w[0] * u[1] - w[1] * u[0]];
      visor = visor.add(M.cylinder(Lp, 5, 3.6, 28).transform([...u, 0, ...v, 0, ...w, 0, ...a0, 1])); }

    /* booleans can leave two bits touching at a single point; weld each with a tiny cube so slicers see a clean solid */
    const weld = m => {
      for (let pass = 0; pass < 8; pass++) {
        const mesh = m.getMesh(), P = mesh.vertProperties, np = mesh.numProp, seen = new Set(), at = [];
        for (let v = 0; v < P.length / np; v++) { const k = P[v * np] + ',' + P[v * np + 1] + ',' + P[v * np + 2]; if (seen.has(k)) at.push([P[v * np], P[v * np + 1], P[v * np + 2]]); else seen.add(k); }
        if (!at.length) break;
        m = m.add(M.union(at.map(q => M.cube(.4 + pass * .15, true).rotate([pass * 17, pass * 29, pass * 11]).translate(q))));
      }
      return m;
    };
    skull = weld(skull.simplify(.02)); visor = weld(visor.simplify(.02));
    /* ---------- parts, printing positions, preview ---------- */
    const rotOpen = m => m.translate([0, 0, -pivZ]).rotate([p.view === 'open' ? OPEN * 180 / Math.PI : 0, 0, 0]).translate([0, 0, pivZ]);
    /* skull upside down on its point */
    const skullP = skull.rotate([180, 0, 0]);
    const sb = skullP.boundingBox();
    const parts = [
      { name: 'skull', what: 'Skull (print upside down, on its point)', count: 1, m: skullP.translate([0, 0, -sb.min[2]]) },
      { name: 'visor', what: 'Visor (print standing on the tip of the snout)', count: 1, m: null },
      { name: 'finial', what: 'Finial for the point', count: 1, m: finial.translate([0, 0, 6]) }];
    const visorP = visor.rotate([-90, 0, 0]);               /* forward becomes down */
    parts[1].m = visorP.translate([0, 0, -visorP.boundingBox().min[2]]);
    const asm = [{ m: skull, c: 'a' }, { m: rotOpen(visor), c: 'c' }, { m: finial.translate([0, -back, H + .2]), c: 'b' }];

    const bbS = parts[0].m.boundingBox(), bbV = parts[1].m.boundingBox(), dims = b => [0, 1, 2].map(i => r1(b.max[i] - b.min[i])).join(' × ');
    const stats = [['Inside the skull', `${r1(2 * A)} × ${r1(2 * B)} mm`, `width × length, with ${p.liner} mm padding`],
      ['Snout', `${r1(Ls)} mm`, p.snout === 'blunt' ? 'pig-face' : 'pointed'],
      ['Visor travel', `${openDeg}°`, 'clicks shut and open']];
    const notes = [`Skull ${dims(bbS)} mm and visor ${dims(bbV)} mm as printed.`];
    if (Ls < 115) notes.push('With a snout this short, parts of the visor lean more than 50°: turn on tree supports (touching the bed only), or make the snout at least 120 mm.');
    const big = Math.max(...[0, 1, 2].map(i => bbS.max[i] - bbS.min[i]), ...[0, 1, 2].map(i => bbV.max[i] - bbV.min[i]));
    if (big > 350) notes.push('A part is larger than the K2 Plus build volume (350 mm). Check the head measurements.');
    else if (big > 335) notes.push(`The tallest part is ${r1(big)} mm, close to the K2 Plus's 350 mm height limit. A brim is fine, but leave out any raft.`);
    if (openDeg < 55) notes.push(`The visor only opens ${openDeg}° before it touches the skull, which may not clear your eyes. A longer snout or a lower "brow to top of head" gives it more room.`);
    return { parts, asm, stats, notes, colors: { a: '--tray', b: '--post', c: '--lift' }, legend: [['--tray', 'Skull'], ['--lift', 'Visor'], ['--post', 'Finial']] };
  }
};
