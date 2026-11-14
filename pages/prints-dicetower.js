/* Flat-pack dice tower: two side walls with grooves, a front and back wall that slide down the grooves and lock the
   tower together, baffles that sit in sloped grooves, and a tray with a sliding lid. In use the tower stands in one
   end of the tray and the dice roll out into the other. Packed, every panel lies flat inside the tray under the lid.
   All parts print flat without supports. Built with the Manifold library. Units are millimetres, Z up.         */

const r1 = v => Math.round(v * 10) / 10;

export default {
  id: 'dicetower', title: 'Dice tower',
  intro: 'A dice tower that slots together without glue and packs flat into its own tray, with a sliding lid to carry it.',
  defaults: { w: 55, d: 62, H: 160, baffles: 2, exitH: 35, T: 3, fit: .2 },
  derive(o) {
    const p = { ...this.defaults, ...o };
    for (const k of ['w', 'd', 'H', 'baffles', 'exitH', 'T', 'fit']) p[k] = +p[k] || this.defaults[k];
    p.baffles = Math.max(1, Math.min(5, Math.round(p.baffles)));
    p.gd = Math.max(1.2, p.T * .45);          /* groove depth */
    p.m = 2;                                  /* margin from the side-wall edge to the front/back grooves */
    p.Do = p.d + 2 * (p.m + p.T);             /* side wall width (depth of the tower) */
    p.Wp = p.w + 2 * (p.gd - p.fit);          /* front, back and baffle width */
    p.ang = 35;
    return p;
  },
  sections: [
    { title: 'Tower', fields: [
      { k: 'size', type: 'preset', label: 'Size', options: [['Standard', { w: 55, d: 62, H: 160, baffles: 2, exitH: 35 }], ['Tall, 3 baffles', { w: 55, d: 62, H: 180, baffles: 3, exitH: 35 }], ['Big dice', { w: 70, d: 78, H: 190, baffles: 2, exitH: 45 }], ['Compact', { w: 48, d: 52, H: 130, baffles: 2, exitH: 30 }]] },
      { k: 'w', type: 'num', label: 'Inside width (mm)', min: 30, max: 120, step: 1 },
      { k: 'd', type: 'num', label: 'Inside depth (mm)', min: 30, max: 120, step: 1 },
      { k: 'H', type: 'num', label: 'Height (mm)', min: 80, max: 300, step: 5 },
      { k: 'baffles', type: 'num', label: 'Baffles', min: 1, max: 5, step: 1 },
      { k: 'exitH', type: 'num', label: 'Exit height (mm)', min: 20, max: 80, step: 1 }],
      hint: '"Room for dice" shows the tightest gap inside. Keep it above about 24 mm for a d20, more for big or metal dice.' },
    { title: 'Panels', fields: [
      { k: 'T', type: 'num', label: 'Panel thickness (mm)', min: 2, max: 5, step: .2 },
      { k: 'fit', type: 'num', label: 'Slot clearance (mm)', min: .05, max: .5, step: .05 }],
      hint: 'If panels are hard to slide in, add 0.05 mm. If the tower wobbles, take 0.05 off.' }
  ],
  tips: [
    'PLA, 0.2 mm layers, 15–20 % infill is fine here. No supports: every panel prints flat with its grooves facing up.',
    'Put it together: lay one side wall flat, grooves up. Drop the baffles and the ramp into their sloped grooves. Put the other side wall on top, then stand it up and slide the front and back walls down their grooves. That locks it.',
    'Stand the tower in the marked end of the tray, exit facing the long side, and roll.',
    'To pack: slide out the front and back walls, lift off a side, and lay everything flat in the tray. The lid slides on over them.',
    'For a quieter tower, cut a piece of felt or cork to lie loose on the tray floor and the ramp.'
  ],
  build(W, p) {
    const { Manifold: M, CrossSection: CS } = W;
    const { T, gd, fit: f, Do, Wp, H, d } = p;
    const R = (x0, y0, x1, y1) => CS.square([x1 - x0, y1 - y0]).translate([x0, y0]);
    const ex = (cs, h) => M.extrude(cs, h);
    const place = (m, X, Y, Z, Tr) => m.transform([...X, 0, ...Y, 0, ...Z, 0, ...Tr, 1]);
    const rad = a => a * Math.PI / 180;

    /* ---- baffles in side-wall coordinates: u across the depth (0 = front), v up ---- */
    const uF = p.m + T, uB = Do - p.m - T;            /* inside faces of the front and back walls */
    const span = d * .55, gap = d - span;
    const slope = Math.tan(rad(p.ang)), top = H - 12;
    const bafs = [];
    const step = (top - (p.exitH + 18)) / p.baffles;
    for (let i = 0; i < p.baffles; i++) {
      const fromBack = i % 2 === 0, vHigh = top - i * step;
      const u0 = fromBack ? uB : uF, u1 = fromBack ? uB - span : uF + span;
      bafs.push({ u0, v0: vHigh, u1, v1: vHigh - span * slope });
    }
    /* ramp at the bottom: from the back wall down to the exit at the front */
    const rampHigh = Math.min(p.exitH - 4 + d * Math.tan(rad(18)), bafs[bafs.length - 1].v1 - 12);
    bafs.push({ u0: uB, v0: rampHigh, u1: uF, v1: Math.max(T + 1, rampHigh - (uB - uF) * Math.tan(rad(18))), ramp: true });
    /* pull both ends in, so the square ends of a sloped plate don't poke into the front or back wall */
    for (const b of bafs) {
      const L = Math.hypot(b.u1 - b.u0, b.v1 - b.v0), du = (b.u1 - b.u0) / L, dv = (b.v1 - b.v0) / L, th = Math.atan2(Math.abs(dv), Math.abs(du));
      const s = T / 2 * Math.tan(th) + .3 / Math.cos(th);
      b.u0 += du * s; b.v0 += dv * s; b.u1 -= du * s; b.v1 -= dv * s;
    }
    /* a groove (or a panel) along a line, thickness th, extended a little at both ends */
    const band = (b, th, extra) => {
      const L = Math.hypot(b.u1 - b.u0, b.v1 - b.v0), a = Math.atan2(b.v1 - b.v0, b.u1 - b.u0) * 180 / Math.PI;
      return R(-extra, -th / 2, L + extra, th / 2).rotate(a).translate([b.u0, b.v0]);
    };

    /* ---- side wall, grooves facing up ---- */
    let side = ex(R(0, 0, Do, H), T);
    const cut = cs => M.extrude(cs, gd + 1).translate([0, 0, T - gd]);
    side = side.subtract(cut(R(p.m - f, -1, p.m + T + f, H + 1)));
    side = side.subtract(cut(R(Do - p.m - T - f, -1, Do - p.m + f, H + 1)));
    for (const b of bafs) side = side.subtract(cut(band(b, T + 2 * f, 0).intersect(R(p.m + T - .01, 0, Do - p.m - T + .01, H))));
    /* finger notch at the top of each side */
    side = side.subtract(M.cylinder(T + 2, 8, 8, 48).translate([Do / 2, H + 3, -1]));
    const sideR = side.mirror([0, 0, 1]).translate([0, 0, T]);

    /* ---- front (with the exit) and back ---- */
    const front = ex(R(0, 0, Wp, H).subtract(R(gd + 2, -1, Wp - gd - 2, p.exitH)), T);
    const backW = ex(R(0, 0, Wp, H), T);
    /* ---- baffles and ramp: plain plates, width across the grooves ---- */
    const plate = b => { const L = Math.hypot(b.u1 - b.u0, b.v1 - b.v0) - .3; return { L, m: ex(R(0, 0, Wp, L), T) }; };

    /* ---- tray with a sliding lid ---- */
    const fw = p.w + 2 * T, fd = Do;                  /* outside footprint of the standing tower */
    const stackH = (4 + bafs.length) * T + 1.5;
    const tw = 3.2, fl = 2.4, lidT = 2, gdd = 1.4, inL = H + 3, inW = Math.max(Do, Wp, fw) + 3;
    const oL = inL + 2 * tw, oW = inW + 2 * tw, inH = stackH, oH = fl + inH + lidT + 2;
    let tray = ex(R(0, 0, oL, oW), oH).subtract(ex(R(tw, tw, oL - tw, oW - tw), oH).translate([0, 0, fl]));
    /* lid groove in both long walls and the far short wall; it runs out through the near short wall, where the lid goes in */
    const gz = fl + inH + .4, gh = lidT + .4;
    tray = tray.subtract(ex(R(-1, tw - gdd, oL - tw + gdd, oW - tw + gdd), gh).translate([0, 0, gz]));
    /* a shallow pocket that marks where the tower stands */
    tray = tray.subtract(ex(R(oL - tw - fd - .6, (oW - fw) / 2 - .3, oL - tw - .3, (oW + fw) / 2 + .3), 1).translate([0, 0, fl - .6]));
    const lidL = oL - tw + gdd - .4, lidW = oW - 2 * tw + 2 * gdd - .6;
    const lid = ex(R(0, 0, lidL, lidW), lidT).subtract(M.cylinder(lidT + 2, 7, 7, 48).translate([-2, lidW / 2, -1]));

    /* ---- assembled preview: the tower standing in the tray ---- */
    const asm = [{ m: tray, c: 'c' }];
    const x0 = (oW - fw) / 2;
    /* world: tray length along x. Tower front (exit) faces −x, towards the open tray. u → +x from xF, v → z */
    const xF = oL - tw - fd - .3, z0 = fl - .6;
    /* side walls stand along the tray, grooves facing in: the mirrored one on the near side, the other on the far side */
    const sideAt = (m, y) => place(m, [1, 0, 0], [0, 0, 1], [0, -1, 0], [xF, y + T, z0]);
    asm.push({ m: sideAt(sideR, x0), c: 'a' }, { m: sideAt(side, x0 + fw - T), c: 'a' });
    const wallAt = (m, u) => place(m, [0, 1, 0], [0, 0, 1], [1, 0, 0], [xF + u, x0 + T - gd + f, z0]);
    asm.push({ m: wallAt(front, p.m), c: 'b' }, { m: wallAt(backW, Do - p.m - T), c: 'b' });
    for (const b of bafs) {
      const { m } = plate(b), a = Math.atan2(b.v1 - b.v0, b.u1 - b.u0);
      const dir = [Math.cos(a), 0, Math.sin(a)], nrm = [-Math.sin(a), 0, Math.cos(a)];
      /* plate: x across the width (world y), y along the slope, z thickness (normal) */
      const o = [xF + b.u0 + nrm[0] * T / 2, x0 + T - gd + f, z0 + b.v0 + nrm[2] * T / 2];
      asm.push({ m: place(m, [0, 1, 0], [dir[0], 0, dir[2]], [-nrm[0], 0, -nrm[2]], o), c: b.ramp ? 'd' : 'b' });
    }

    const parts = [
      { name: 'side-left', what: 'Side wall (grooves up)', count: 1, m: side },
      { name: 'side-right', what: 'Side wall, mirrored (grooves up)', count: 1, m: sideR.rotate([180, 0, 0]) },
      { name: 'front', what: 'Front wall with the exit', count: 1, m: front },
      { name: 'back', what: 'Back wall', count: 1, m: backW },
      ...bafs.map((b, i) => ({ name: b.ramp ? 'ramp' : `baffle-${i + 1}`, what: b.ramp ? 'Ramp at the bottom' : 'Baffle', count: 1, m: plate(b).m })),
      { name: 'tray', what: 'Tray, also the box', count: 1, m: tray },
      { name: 'lid', what: 'Sliding lid', count: 1, m: lid }];
    /* the tightest spot a die must pass: under the tip of each baffle, measured square to the baffle below */
    let room = gap;
    for (let i = 0; i + 1 < bafs.length; i++) {
      const a = bafs[i], b = bafs[i + 1], L = Math.hypot(b.u1 - b.u0, b.v1 - b.v0);
      const tU = a.u1, tV = a.v1, vb = b.v0 + (b.v1 - b.v0) * (tU - b.u0) / (b.u1 - b.u0 || 1e-9), th = Math.atan2(Math.abs(b.v1 - b.v0), Math.abs(b.u1 - b.u0));
      room = Math.min(room, (tV - vb) * Math.cos(th) - T / 2);
    }
    const stats = [['Tower', `${r1(fw)} × ${r1(fd)} × ${r1(H)} mm`, 'standing'], ['Packed box', `${r1(oL)} × ${r1(oW)} × ${r1(oH)} mm`, 'with the lid on'],
      ['Room for dice', `${r1(room)} mm`, 'tightest gap inside'], ['Panels', `${parts.length - 2}`, 'plus tray and lid']];
    const notes = [];
    if (room < 24) notes.push(`The tightest gap inside is ${r1(room)} mm. A d20 is about 22 mm across, so make the tower deeper or taller, or use fewer baffles.`);
    if (p.exitH < 25) notes.push('The exit is low for big dice.');
    return { parts, asm, stats, notes, legend: [['--tray', 'Side walls'], ['--post', 'Walls and baffles'], ['--frame', 'Ramp'], ['--foot', 'Tray']], colors: { a: '--tray', b: '--post', c: '--foot', d: '--frame' } };
  }
};
