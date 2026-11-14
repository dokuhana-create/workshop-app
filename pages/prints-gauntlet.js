/* Gauntlet: a flared cuff, a back-of-hand plate, a knuckle plate and finger scales, sized from your hand.
   The plates are sewn onto a glove through small holes along their edges, so the glove does the bending and the
   plates overlap like scales. No glue. Every plate is modelled standing up and prints without supports.
   Built with the Manifold library. Units: mm. */
import { ellipseFor, smooth, shell, trims, roundHole, holeAt, angleAlong } from './prints-armour-lib.js?v=3';

const r1 = v => Math.round(v * 10) / 10;
/* fingers relative to the middle finger: length, circumference, spread across the hand */
const FINGERS = [['index', .92, .97, -1.5], ['middle', 1, 1, -.5], ['ring', .95, .95, .5], ['little', .76, .82, 1.5]];
const SEGS = [['1', .45], ['2', .3], ['3', .25]];

export default {
  id: 'gauntlet', title: 'Armour: gauntlet',
  intro: 'Plates you sew onto a glove: a flared cuff, a back-of-hand plate, a knuckle plate and overlapping finger scales. The glove bends, the plates follow.',
  defaults: { wrist: 160, back: 80, span: 70, fingerL: 95, fingerC: 70, thumbL: 120, cuffL: 70, flare: 50, pad: 2, th: 1.6, tip: 'point', pair: true, hole: 1.6 },
  derive(o) {
    const p = { ...this.defaults, ...o };
    for (const k of ['wrist', 'back', 'span', 'fingerL', 'fingerC', 'thumbL', 'cuffL', 'flare', 'pad', 'th', 'hole']) p[k] = isFinite(+p[k]) ? +p[k] : this.defaults[k];
    p.pair = p.pair === true || p.pair === 'true';
    return p;
  },
  sections: [
    { title: 'Your hand', fields: [
      { k: 'wrist', type: 'num', label: 'Wrist circumference (mm)', min: 100, max: 300, step: 1 },
      { k: 'back', type: 'num', label: 'Wrist to middle knuckle (mm)', min: 50, max: 140, step: 1 },
      { k: 'span', type: 'num', label: 'Knuckle to knuckle, index to little (mm)', min: 40, max: 120, step: 1 },
      { k: 'fingerL', type: 'num', label: 'Middle finger length (mm)', min: 50, max: 140, step: 1 },
      { k: 'fingerC', type: 'num', label: 'Middle finger circumference (mm)', min: 40, max: 120, step: 1 },
      { k: 'thumbL', type: 'num', label: 'Wrist to thumb tip (mm)', min: 70, max: 180, step: 1 }],
      hint: 'Measure with the glove you will sew the plates onto, or add its thickness under "Room inside". The other fingers are sized in proportion to the middle finger. The glove is the lining here, so no PLA touches your skin; for the cuff, add a strip of foam inside.' },
    { title: 'Plates', fields: [
      { k: 'tip', type: 'seg', options: [['point', 'Pointed fingertips'], ['round', 'Rounded fingertips']] },
      { k: 'pair', type: 'seg', options: [[true, 'A pair'], [false, 'One hand']] },
      { k: 'cuffL', type: 'num', label: 'Cuff length (mm)', min: 30, max: 150, step: 1 },
      { k: 'flare', type: 'num', label: 'Cuff flare (mm)', min: 0, max: 120, step: 1 },
      { k: 'pad', type: 'num', label: 'Room inside (mm)', min: 0, max: 8, step: .5 },
      { k: 'th', type: 'num', label: 'Plate thickness (mm)', min: 1, max: 3, step: .2 },
      { k: 'hole', type: 'num', label: 'Sewing hole size (mm)', min: 1, max: 3, step: .1 }],
      hint: 'The flare is how much wider the cuff gets at the open end, as circumference. Plates are the same for left and right hands, so "a pair" simply doubles the counts.' }
  ],
  tips: [
    'PLA or PETG, 0.12–0.16 mm layers for the small finger scales, 3 walls, no supports. Print every plate standing up as exported. The resin printer is good for the finger scales too.',
    'Sewing: use strong thread (upholstery or waxed) and a leather or work glove. Start with the knuckle plate, then the back plate overlapping it, then the finger scales from the fingertip back, each one tucked under the one behind it.',
    'The cuff closes with a strap through the slots, so you can slip it over the glove.',
    'Bend your fingers after each scale to check they still close freely.'
  ],
  build(W, p) {
    const parts = [], asm = [], n = p.pair ? 2 : 1, holes = [];
    const place = (m, X, Y, Z, T) => m.transform([...X, 0, ...Y, 0, ...Z, 0, ...T, 1]);
    /* lay a plate from its upright print pose into the hand: its z runs along the fingers (world +y), its top up */
    const lay = (m, x, y, z = 0) => place(m, [-1, 0, 0], [0, 0, 1], [0, 1, 0], [x, y, z]);
    const sewHoles = (o, L, t0, t1, every) => {
      const out = [];
      for (const [t, dir] of [[t0, 1], [t1, -1]]) {
        const k = Math.max(2, Math.round((L - 6) / every) + 1);
        for (let i = 0; i < k; i++) { const z = 3 + (L - 6) * i / (k - 1), tt = angleAlong(o, t, z, dir * 2.6); out.push(roundHole(W, o, tt, z, p.hole)); }
      }
      return W.Manifold.union(out);
    };

    /* ---- cuff: a flared band in two halves, a strap on each side ---- */
    const cL = p.cuffL, cC = z => p.wrist + p.flare * smooth(0, cL, z) ** 1.2, cK = z => 1.4 - .1 * z / cL;
    const cRing = z => { const e = ellipseFor(cC(z), cK(z)); return { a: e.a + p.pad + 3, b: e.b + p.pad + 3 }; };
    const g = 3;
    const cTop = { L: cL, ring: cRing, span: () => [90 - 100 + g, 90 + 100 - g], th: p.th + .8, extra: trims({ bead: 1, L: cL }), nu: 80 };
    const cBot = { L: cL, ring: cRing, span: () => [190 + g, 350 - g], th: p.th + .8, extra: trims({ bead: 1, L: cL }), nu: 64 };
    let cT = shell(W, cTop), cB = shell(W, cBot);
    for (const [o, ends] of [[cTop, [[cTop.span()[0], 1], [cTop.span()[1], -1]]], [cBot, [[cBot.span()[0], 1], [cBot.span()[1], -1]]]]) {
      const cut = W.Manifold.union(ends.map(([t, d]) => holeAt(W, o, angleAlong(o, t, cL / 2, d * 7), cL / 2, 3.4, Math.min(26, cL - 14))));
      if (o === cTop) cT = cT.subtract(cut); else cB = cB.subtract(cut);
    }
    parts.push({ name: 'cuff-top', what: 'Cuff, back of the wrist', count: n, m: cT }, { name: 'cuff-under', what: 'Cuff, inside of the wrist', count: n, m: cB });
    asm.push({ m: lay(cT, 0, -cL - 4, -cRing(0).b), c: 'a' }, { m: lay(cB, 0, -cL - 4, -cRing(0).b), c: 'a' });

    /* ---- back-of-hand plate: a gently curved plate, narrower at the wrist ---- */
    const handW = p.span + 22, wristW = Math.min(handW, p.wrist / Math.PI * 1.2), bL = p.back - 6;
    const hRing = () => ({ a: handW * .75 + p.pad, b: handW * .4 + p.pad });
    const widthAt = z => wristW + (handW - wristW) * smooth(0, bL * .8, z);
    const hSpan = z => { const { a } = hRing(); const half = Math.asin(Math.min(.99, widthAt(z) / 2 / a)) * 180 / Math.PI; return [90 - half, 90 + half]; };
    const hO = { L: bL, ring: hRing, span: hSpan, th: p.th + .4, extra: trims({ bead: .8, ridge: .8, L: bL }), nu: 64 };
    let hp = shell(W, hO);
    hp = hp.subtract(sewHoles({ ...hO, ring: hRing }, bL, hSpan(bL / 2)[0], hSpan(bL / 2)[1], 10));
    parts.push({ name: 'hand-plate', what: 'Back of the hand', count: n, m: hp });
    asm.push({ m: lay(hp, 0, 0, -hRing().b), c: 'b' });

    /* ---- knuckle plate with a raised bump over each knuckle ---- */
    const kL = 24, kO = { L: kL, ring: hRing, span: () => { const { a } = hRing(); const half = Math.asin(Math.min(.99, (handW + 4) / 2 / a)) * 180 / Math.PI; return [90 - half, 90 + half]; }, th: p.th + .4, nu: 80 };
    kO.extra = (s, z, al) => { let e = trims({ bead: .8, L: kL })(s, z, al); for (let j = 0; j < 4; j++) { const sc = .5 + (j - 1.5) * (p.span / 3) / al; const q = ((s - sc) * al / 7) ** 2 + ((z - kL / 2) / 7) ** 2; e += 2 * Math.exp(-q); } return e; };
    let kp = shell(W, kO);
    kp = kp.subtract(sewHoles(kO, kL, kO.span()[0], kO.span()[1], 9));
    parts.push({ name: 'knuckle-plate', what: 'Over the knuckles', count: n, m: kp });
    asm.push({ m: lay(kp, 0, bL - 4, 1.2 - hRing().b), c: 'c' });

    /* ---- finger scales ---- */
    const scale = (L, C, last) => {
      const r = C / (2 * Math.PI) + p.pad, Lp = L + 3 + (last && p.tip === 'point' ? 7 : 0);
      const span = z => { if (!last) return [0, 180]; const u = smooth(L * .55, Lp, z), h = 90 * (1 - u * (p.tip === 'point' ? .93 : .6)); return [90 - h, 90 + h]; };
      const o = { L: Lp, ring: () => ({ a: r, b: r }), span, th: p.th, extra: trims({ bead: .6, beadW: 2.5, ridge: .8, ridgeW: 4, L: Lp }), nu: 48, nz: Math.max(10, Math.round(Lp / 1.5)) };
      let m = shell(W, o);
      const hz = [3, Math.min(L - 3, L * .55)];
      const hs = [];
      for (const z of hz) for (const [t, d] of [[span(z)[0], 1], [span(z)[1], -1]]) hs.push(roundHole(W, o, angleAlong(o, t, z, d * 2.2), z, p.hole));
      return { m: m.subtract(W.Manifold.union(hs)), Lp, r };
    };
    const spread = p.span / 3;
    for (const [fname, lf, cf, pos] of FINGERS) {
      const FL = p.fingerL * lf, FC = p.fingerC * cf; let y = bL + kL - 8;
      SEGS.forEach(([sn, frac], i) => {
        const s = scale(FL * frac, FC, i === 2);
        parts.push({ name: `${fname}-${sn}`, what: `${fname[0].toUpperCase() + fname.slice(1)} finger, ${['base', 'middle', 'tip'][i]}`, count: n, m: s.m });
        asm.push({ m: lay(s.m, pos * spread, y, 2 - s.r - i * .3), c: i === 2 ? 'c' : 'b' });
        y += FL * frac;
      });
    }
    /* thumb: two scales, set at an angle beside the hand plate */
    const thumbLen = Math.max(40, p.thumbL - p.back * .55), TC = p.fingerC * 1.1;
    let ty = bL * .35;
    [['1', .55], ['2', .45]].forEach(([sn, frac], i) => {
      const s = scale(thumbLen * frac, TC, i === 1);
      parts.push({ name: `thumb-${sn}`, what: `Thumb, ${i ? 'tip' : 'base'}`, count: n, m: s.m });
      const m = lay(s.m, 0, 0, -s.r).rotate([0, 0, -38]).translate([handW / 2 + 4 + i * 16, ty, -3]);
      asm.push({ m, c: i ? 'c' : 'b' }); ty += thumbLen * frac * .8;
    });

    const plates = parts.reduce((a, x) => a + x.count, 0);
    const stats = [['Plates', `${plates}`, p.pair ? 'for a pair' : 'for one hand'], ['Hand plate', `${r1(handW)} × ${r1(bL)} mm`, 'width × length'],
      ['Finger scales', `${FINGERS.length * 3 + 2}`, 'per hand'], ['Cuff', `${r1(p.wrist)} → ${r1(p.wrist + p.flare)} mm`, 'round, wrist → open end']];
    const notes = [];
    if (p.fingerC / Math.PI < 15) notes.push('Very slim fingers: the scales get small. Print them on the resin printer.');
    return { parts, asm, stats, notes, colors: { a: '--tray', b: '--post', c: '--lift' }, legend: [['--tray', 'Cuff'], ['--post', 'Plates and scales'], ['--lift', 'Knuckles and tips']] };
  }
};
