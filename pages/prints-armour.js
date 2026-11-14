/* Armour: a forearm bracer or a shin greave, shaped from your own measurements.
   Each is a front (outer) shell and a back (inner) shell. They close with straps through slots on both sides,
   or, for the bracer, a hinge on one side that takes a piece of 1.75 mm filament as its pin, and straps on the
   other. No glue. Shells print standing up, without supports. Built with the Manifold library. Units: mm. */
import { ellipseFor, smooth, shell, frame, rod, trims, holeAt, angleAlong } from './prints-armour-lib.js?v=3';

const r1 = v => Math.round(v * 10) / 10;
const BRACER = { part: 'bracer', len: 220, c0: 160, c1: 250, pad: 5, th: 2.4, close: 'hinge', strap: 20, bead: 1.2, ridge: 1.5, startOff: 12, endOff: 25 };
const GREAVE = { part: 'greave', len: 320, c0: 210, c1: 370, pad: 6, th: 2.6, close: 'straps', strap: 25, bead: 1.4, ridge: 2.2, startOff: 25, endOff: 25 };

export default {
  id: 'armour', title: 'Armour: bracer and greave',
  intro: 'A forearm bracer or shin greave that follows your own measurements, in a front and a back half that strap or hinge together. Paint it as metal, leather or bone.',
  defaults: { cover: 'full', front: 60, lining: 3, ...BRACER },
  derive(o) {
    const p = { ...this.defaults, ...o };
    for (const k of ['len', 'c0', 'c1', 'pad', 'lining', 'th', 'front', 'strap', 'bead', 'ridge', 'startOff', 'endOff']) p[k] = isFinite(+p[k]) ? +p[k] : this.defaults[k];
    if (p.part === 'greave' && p.close === 'hinge') p.close = 'straps';
    if (p.cover === 'half') p.close = 'straps';
    p.L = Math.max(40, p.len - p.startOff - p.endOff);
    p.room = p.pad + p.lining;   /* the shell sits this far out from your measurements */
    return p;
  },
  sections: [
    { title: 'Piece', fields: [
      { k: 'part', type: 'seg', options: [['bracer', 'Forearm bracer'], ['greave', 'Shin greave']] }],
      onChange: { part: v => v === 'greave' ? { ...GREAVE } : { ...BRACER } } },
    { title: 'Coverage', fields: [
      { k: 'cover', type: 'seg', options: [['full', 'Full: front and back'], ['half', 'Half: front only']] }],
      onChange: { cover: v => v === 'half' ? { front: 50 } : { front: 60 } },
      hint: 'A half piece is just the front shell, held on by straps that go all the way round. It is lighter, quicker to print and easier to move in.' },
    { title: 'Your measurements', fields: [
      { k: 'c0', type: 'num', label: 'Narrow end circumference (mm)', min: 100, max: 400, step: 1 },
      { k: 'c1', type: 'num', label: 'Widest circumference (mm)', min: 120, max: 600, step: 1 },
      { k: 'len', type: 'num', label: 'Length (mm)', min: 80, max: 450, step: 1 },
      { k: 'pad', type: 'num', label: 'Clothing underneath (mm)', min: 0, max: 20, step: .5 }],
      hint: 'Bracer: round the wrist, round the thickest part of the forearm, wrist to elbow. Greave: round the ankle, round the calf, ankle to knee. Measure over bare skin. "Clothing underneath" is a sleeve or trousers.' },
    { title: 'Lining', fields: [
      { k: 'lining', type: 'seg', options: [[0, 'None'], [2, '2 mm foam'], [3, '3 mm foam'], [5, '5 mm foam'], [8, 'Thick padding']] }],
      hint: 'PLA should never sit straight on skin: it is hard, holds sweat and its edges rub. The shell is made bigger by the lining you choose. Use EVA craft foam or closed-cell foam, cut to the inside shape, held in by the straps or with a few stitches through the strap slots. "Thick padding" is for wearing it over a padded gambeson.' },
    { title: 'Shape', fields: [
      { k: 'front', type: 'num', label: 'Front half covers (%)', min: 40, max: 80, step: 1 },
      { k: 'th', type: 'num', label: 'Thickness (mm)', min: 1.6, max: 5, step: .2 },
      { k: 'bead', type: 'num', label: 'Edge roll height (mm)', min: 0, max: 3, step: .2 },
      { k: 'ridge', type: 'num', label: 'Centre ridge height (mm)', min: 0, max: 4, step: .2 }],
      hint: 'The shells stop short of the wrist and elbow (or ankle and knee) so you can bend. Set the edge roll or ridge to 0 for a plain shell.' },
    { title: 'Closing', fields: [
      { k: 'close', type: 'seg', options: [['hinge', 'Hinge and straps'], ['straps', 'Straps on both sides']], show: p => p.part === 'bracer' && p.cover !== 'half' },
      { k: 'strap', type: 'num', label: 'Strap width (mm)', min: 10, max: 40, step: 1 }],
      hint: 'The hinge pin is a piece of 1.75 mm filament: push it through and melt or bend the ends over. Use leather, webbing or elastic straps with buckles or press studs.' }
  ],
  tips: [
    'PLA or PETG, 0.2 mm layers, 4 walls. Print the shells standing up as exported, no supports. A brim helps the tall greave shells.',
    'Sand and fill with filler primer, then paint. Metallic paint with a dark wash looks like steel; brown and a dry-brushed edge looks like leather.',
    'Lining: cut foam to the inside shape about 3 mm short of every edge, so the shell\'s rolled edge, not the foam, is what you see. Hold it with the straps or a few stitches through the slots, no glue. Round over any sharp edge with fine sandpaper before wearing.',
    'Try the back half on first, then close the front over it.'
  ],
  build(W, p) {
    const greave = p.part === 'greave', L = p.L, z0 = p.startOff, Lf = p.len;
    /* circumference along the length (measured from the narrow end); widest at about 75 % for a forearm, 70 % for a calf, then a little less */
    const peak = greave ? .7 : .8;
    const circ = z => { const u = (z + z0) / Lf; return u <= peak ? p.c0 + (p.c1 - p.c0) * smooth(0, peak, u) : p.c1 * (1 - (greave ? .08 : .04) * smooth(peak, 1, u)); };
    const aspect = z => { const u = (z + z0) / Lf; return greave ? 1.25 - .15 * smooth(0, .7, u) : 1.45 - .2 * smooth(0, .6, u); };
    /* the ends flare out a little so the edges don't dig in */
    const flare = z => 2.5 * (Math.max(0, 1 - z / 12) ** 2 + Math.max(0, 1 - (L - z) / 12) ** 2);
    const ring = z => { const e = ellipseFor(circ(z), aspect(z)); return { a: e.a + p.room + flare(z), b: e.b + p.room + flare(z) }; };
    const fr = Math.min(.8, Math.max(.4, p.front / 100)), half = fr * 180;
    const gapDeg = z => 360 * 5 / circ(z);            /* about 5 mm gap at each seam */
    const fSpan = z => [90 - half + gapDeg(z) / 2, 90 + half - gapDeg(z) / 2];
    const bSpan = z => [90 + half + gapDeg(z) / 2, 450 - half - gapDeg(z) / 2];
    const ex = trims({ bead: p.bead, ridge: p.ridge, L });
    const exB = trims({ bead: p.bead, ridge: 0, L });
    const oF = { L, ring, span: fSpan, th: p.th, extra: ex, nu: 96 }, oB = { L, ring, span: bSpan, th: p.th, extra: exB, nu: 72 };
    const half1 = p.cover === 'half';
    let F = shell(W, oF), B = half1 ? null : shell(W, oB);

    /* strap slots: z positions along the length */
    const zs = greave ? [.15, .5, .85] : [.22, .78];
    const slots = (o, t, dir) => W.Manifold.union(zs.map(u => { const z = L * u, tt = angleAlong(o, t, z, dir * (p.strap > 25 ? 9 : 8)); return holeAt(W, o, tt, z, 3.6, p.strap + 1.5); }));
    const seamR = 90 - half, seamL = 90 + half;      /* right seam (smaller angle) and left seam */
    /* left seam: straps on both shells */
    F = F.subtract(slots(oF, fSpan(L / 2)[1], -1)); if (B) B = B.subtract(slots(oB, bSpan(L / 2)[0], 1));
    let pin = null;
    if (p.close === 'hinge' && !greave) {
      /* hinge on the right seam: knuckles alternate between the shells along a straight axis just outside the seam */
      const kr = 3.6, kl = 16, kg = .6, m = 8, n = Math.max(3, Math.floor((L - 2 * m + kg) / (kl + kg)));
      const used = n * (kl + kg) - kg, zA = (L - used) / 2;
      const axisAt = z => { const f = frame(oF, seamR, z), off = p.th + p.bead + kr + .6; return f.p.map((x, i) => x + f.n[i] * off); };
      const A0 = axisAt(zA), A1 = axisAt(zA + used), at = z => A0.map((x, i) => x + (A1[i] - A0[i]) * (z - zA) / used);
      const knF = [], knB = [];
      for (let i = 0; i < n; i++) {
        const za = zA + i * (kl + kg), zb = za + kl, own = i % 2 === 0 ? oF : oB, tEdge = i % 2 === 0 ? fSpan(za)[0] + 3 : bSpan(za)[1] - 3 - 360;
        const k = rod(W, at(za), at(zb), kr, 32);
        const e0 = frame(own, tEdge, za + 1), e1 = frame(own, tEdge, zb - 1);
        const mid = (f) => f.p.map((x, j) => x + f.n[j] * p.th / 2);
        const web = W.Manifold.hull([k, rod(W, mid(e0), mid(e1), p.th / 2, 12)]);
        (i % 2 === 0 ? knF : knB).push(web);
      }
      F = F.add(W.Manifold.union(knF)); B = B.add(W.Manifold.union(knB));
      const hole = rod(W, at(zA - 2), at(zA + used + 2), 1.0, 16);
      F = F.subtract(hole); B = B.subtract(hole);
      /* keep the knuckles of one shell clear of the other's */
      pin = used;
    } else {
      F = F.subtract(slots(oF, fSpan(L / 2)[0], 1)); if (B) B = B.subtract(slots(oB, bSpan(L / 2)[1] - 360, -1));
    }
    const name = greave ? 'greave' : 'bracer';
    const parts = [{ name: `${name}-front`, what: greave ? 'Front shell (shin)' : 'Outer shell (top of the forearm)', count: 1, m: F }];
    if (B) parts.push({ name: `${name}-back`, what: greave ? 'Back shell (calf)' : 'Inner shell', count: 1, m: B });
    let wMax = 0; for (let z = 0; z <= L; z += 5) wMax = Math.max(wMax, ring(z).a);
    const stats = [['Length', `${r1(L)} mm`, `of your ${r1(Lf)} mm`], ['Inside width', `${r1(2 * ring(14).a)} → ${r1(2 * wMax)} mm`, 'narrow end → widest'],
      ['Closing', half1 ? 'Straps all round' : p.close === 'hinge' && !greave ? 'Hinge + straps' : 'Straps both sides', pin ? `pin: ${r1(pin + 8)} mm of 1.75 filament` : `${zs.length} straps, ${p.strap} mm`]];
    const notes = [];
    if (L > 330) notes.push('This shell is taller than most printers can print standing up.');
    if (p.c1 < p.c0) notes.push('The widest circumference is smaller than the narrow end. Check the measurements.');
    if (!p.lining && p.pad < 2) notes.push('With no lining and nothing underneath, the PLA sits on your skin. Add at least a thin foam lining.');
    return { parts, asm: B ? [{ m: F, c: 'a' }, { m: B, c: 'b' }] : [{ m: F, c: 'a' }], stats, notes, colors: { a: '--tray', b: '--post' }, legend: [['--tray', greave ? 'Front shell' : 'Outer shell'], ['--post', greave ? 'Back shell' : 'Inner shell']] };
  }
};
