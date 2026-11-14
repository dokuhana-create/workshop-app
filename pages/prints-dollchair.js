/* Doll chair: a take-apart chair, stool or bench for ball-jointed dolls.
   Two side frames are joined by rails whose tenons pass through the frames and are locked with small wedges
   (tusk tenons), so it goes together and comes apart without glue. The seat drops onto the rails and the back
   slides down grooves in the back legs. Every part prints flat, without supports.
   Built with the Manifold library. Units are millimetres, Z up.                                               */

const r1 = v => Math.round(v * 10) / 10;
/* sizes in proportion to the doll: seat at knee height, a little deeper and wider than the thigh */
const forDoll = h => ({ seatH: r1(h * .255), seatD: r1(h * .24), seatW: r1(h * .26), backH: r1(h * .24) });

export default {
  id: 'dollchair', title: 'Doll chair',
  intro: 'A chair, stool or bench for ball-jointed dolls that comes apart flat. The rails go through the side frames and are locked with little wedges, so there is no glue.',
  defaults: { dollH: 430, style: 'chair', back: 'slats', ...forDoll(430), fit: .2 },
  derive(o) {
    const p = { ...this.defaults, ...o };
    for (const k of ['dollH', 'seatH', 'seatD', 'seatW', 'backH', 'fit']) p[k] = +p[k] || this.defaults[k];
    p.t = Math.max(5, Math.round(p.dollH * .016));       /* leg size */
    p.hr = Math.max(6, Math.round(p.dollH * .019));      /* rail height */
    p.tr = Math.max(3.2, Math.round(p.dollH * .009 * 10) / 10); /* rail thickness */
    p.seatT = 3; p.pT = 2.4; p.gd = 1.4; p.ws = 2.4; p.ext = Math.max(5, p.t * .8);
    p.W = p.style === 'bench' ? r1(p.seatW * 2.2) : p.seatW;
    p.hasBack = p.style !== 'stool';
    return p;
  },
  sections: [
    { title: 'Doll', fields: [
      { k: 'size', type: 'preset', label: 'Doll size', options: [['1/6 (about 27 cm)', { dollH: 270 }], ['1/4 (about 43 cm)', { dollH: 430 }], ['1/3 (about 60 cm)', { dollH: 600 }]] },
      { k: 'dollH', type: 'num', label: 'Doll height (mm)', min: 150, max: 800, step: 5 }],
      onChange: { dollH: h => forDoll(+h) },
      hint: 'Changing the doll\'s height sets the chair sizes in proportion. For the best fit, set the seat height to your doll\'s knee height when it sits.' },
    { title: 'Chair', fields: [
      { k: 'style', type: 'seg', options: [['chair', 'Chair'], ['stool', 'Stool'], ['bench', 'Bench']] },
      { k: 'back', type: 'seg', options: [['slats', 'Slatted back'], ['arch', 'Arched back'], ['plain', 'Plain back']], show: p => p.style !== 'stool' },
      { k: 'seatH', type: 'num', label: 'Seat height (mm)', min: 30, max: 300, step: 1 },
      { k: 'seatD', type: 'num', label: 'Seat depth (mm)', min: 30, max: 300, step: 1 },
      { k: 'seatW', type: 'num', label: 'Seat width (mm)', min: 30, max: 300, step: 1 },
      { k: 'backH', type: 'num', label: 'Back height (mm)', min: 20, max: 300, step: 1, show: p => p.style !== 'stool' },
      { k: 'fit', type: 'num', label: 'Joint clearance (mm)', min: .05, max: .5, step: .05 }],
      hint: 'A bench is a little over twice as wide as the chair. If the joints are too tight or loose, change the clearance by 0.05 mm.' }
  ],
  tips: [
    'PLA or PETG, 0.12–0.16 mm layers for crisp joints, no supports. Everything prints flat. The wedges are small, so your resin printer is good for them too.',
    'Put it together: stand the two side frames up, push the rails through the square holes, then tap a wedge into each tenon, thin end first, until it is snug. Drop the seat on and slide the back down its grooves.',
    'To take it apart, push the wedges out from the thin end.',
    'Paint or stain it like wood: a light sanding and a wood-tone acrylic wash hide the layer lines well at this size.'
  ],
  build(W, p) {
    const { Manifold: M, CrossSection: CS } = W;
    const f = p.fit, t = p.t, D = p.seatD, sH = p.seatH, seatTop = sH - p.seatT, Wi = p.W - 2 * t;
    const R = (x0, y0, x1, y1) => CS.square([x1 - x0, y1 - y0]).translate([x0, y0]);
    const ex = (cs, h) => M.extrude(cs, h);
    const place = (m, X, Y, Z, T) => m.transform([...X, 0, ...Y, 0, ...Z, 0, ...T, 1]);
    const topV = p.hasBack ? sH + p.backH : seatTop;
    const sh = r1(sH * .28), hs = Math.max(5, Math.round(p.hr * .75));
    /* cross rails: [name, u centre, v bottom, height] */
    const rails = [['seat', t / 2, seatTop - p.hr, p.hr], ['seat', D - t / 2, seatTop - p.hr, p.hr], ['stretcher', D / 2, sh, hs]];

    /* ---- side frame, in its own plane: u from front to back, v up; printed flat, the inside face on top ---- */
    let prof = CS.union([R(0, 0, t, seatTop), R(D - t, 0, D, topV), R(0, seatTop - p.hr, D, seatTop), R(0, sh, D, sh + hs)]);
    for (const [, u, v, h] of rails) prof = prof.subtract(R(u - p.tr / 2 - f, v + 1 - f, u + p.tr / 2 + f, v + h - 1 + f));
    let side = ex(prof, t);
    if (p.hasBack) { const u = D - t / 2; side = side.subtract(M.cube([p.pT + 2 * f, topV - sH + 2, p.gd + 1]).translate([u - p.pT / 2 - f, sH, t - p.gd])); }
    const sideR = side.mirror([0, 0, 1]).translate([0, 0, t]);   /* the other side: groove on the other face */

    /* ---- rails: printed flat on one face; tenons at both ends with a slot for the wedge ---- */
    function rail(h) {
      const half = Wi / 2, out = half + t + p.ext;
      let s = R(-half, 0, half, h).add(R(-out, 1, -half, h - 1)).add(R(half, 1, out, h - 1));
      for (const sgn of [-1, 1]) { const x0 = half + t - .4; s = s.subtract(sgn > 0 ? R(x0, 1.8, x0 + p.ws, h - 1.8) : R(-x0 - p.ws, 1.8, -x0, h - 1.8)); }
      return ex(s, p.tr);
    }
    const railSeat = rail(p.hr), railStr = rail(hs);
    /* wedge: tapers along its length, so it pulls the rail shoulder tight against the frame */
    const wedgeFor = h => { const L = p.tr + 10; return ex(CS.ofPolygons([[[0, 0], [L, 0], [L, p.ws - .7], [0, p.ws + .5]]]), h - 1.8 * 2 - .4); };
    const wedgeSeat = wedgeFor(p.hr), wedgeStr = wedgeFor(hs);

    /* ---- seat: notched round the back legs, with two tabs underneath that sit inside the frames ---- */
    let seatCS = R(-p.W / 2, -1.5, p.W / 2, D + (p.hasBack ? 0 : 1.5));
    if (p.hasBack) for (const s of [-1, 1]) seatCS = seatCS.subtract(s < 0 ? R(-p.W / 2 - 1, D - t - f, -p.W / 2 + t + f, D + 1) : R(p.W / 2 - t - f, D - t - f, p.W / 2 + 1, D + 1));
    let seat = ex(seatCS, p.seatT);
    for (const s of [-1, 1]) { const x = s * (Wi / 2 - f - 1); seat = seat.add(M.cube([2, D - 2 * t - 4, 3]).translate([x - 1, t + 2, -3])); }

    /* ---- back panel, slides down the grooves ---- */
    let back = null;
    if (p.hasBack) {
      const bw = Wi + 2 * (p.gd - .25), bh = topV - sH;
      let s = R(-bw / 2, 0, bw / 2, bh);
      if (p.back === 'arch') { const rr = bw * .9; s = s.intersect(CS.circle(rr, 128).translate([0, bh - rr])).add(R(-bw / 2, 0, bw / 2, bh * .55)); }
      if (p.back === 'slats') { const n = p.style === 'bench' ? 7 : 3, gw = Math.max(2, (bw - 2 * (p.gd + 3)) / (2 * n - 1)); for (let i = 0; i < n - 1; i++) { const x = -bw / 2 + p.gd + 3 + gw * (2 * i + 1); s = s.subtract(CS.hull([CS.circle(gw / 2, 24).translate([x + gw / 2, bh * .22]), CS.circle(gw / 2, 24).translate([x + gw / 2, bh * .8])])); } }
      back = ex(s, p.pT);
    }

    /* ---- assembled, for the preview ---- */
    const asm = [];
    const fx = [0, 1, 0], fy = [0, 0, 1], fz = [1, 0, 0];
    asm.push({ m: place(side, fx, fy, fz, [-p.W / 2, 0, 0]), c: 'a' }, { m: place(sideR, fx, fy, fz, [p.W / 2 - t, 0, 0]), c: 'a' });
    const rx = [1, 0, 0], ry = [0, 0, 1], rz = [0, -1, 0];
    rails.forEach(([k, u, v]) => {
      asm.push({ m: place(k === 'seat' ? railSeat : railStr, rx, ry, rz, [0, u + p.tr / 2, v]), c: 'b' });
      for (const sgn of [-1, 1]) {
        /* wedge: length along y, taper across x (flat side on the frame's outer face), height up */
        const w = k === 'seat' ? wedgeSeat : wedgeStr, L = p.tr + 10, xo = Wi / 2 + t;
        asm.push({ m: sgn > 0 ? place(w, [0, -1, 0], [1, 0, 0], [0, 0, 1], [xo, u + L / 2, v + 2]) : place(w, [0, 1, 0], [-1, 0, 0], [0, 0, 1], [-xo, u - L / 2, v + 2]), c: 'c' });
      }
    });
    asm.push({ m: seat.translate([0, 0, seatTop]), c: 'b' });
    if (back) asm.push({ m: place(back, rx, ry, rz, [0, D - t / 2 + p.pT / 2, sH]), c: 'b' });

    /* ---- print layout ---- */
    const parts = [
      { name: 'side-left', what: 'Side frame (grooved face up)', count: 1, m: side },
      { name: 'side-right', what: 'Side frame, mirrored', count: 1, m: sideR.rotate([180, 0, 0]) },
      { name: 'rail-seat', what: 'Seat rail, front and back', count: 2, m: railSeat },
      { name: 'rail-stretcher', what: 'Lower stretcher', count: 1, m: railStr },
      { name: 'wedge-seat', what: 'Wedges for the seat rails', count: 4, m: wedgeSeat },
      { name: 'wedge-stretcher', what: 'Wedges for the stretcher', count: 2, m: wedgeStr },
      { name: 'seat', what: 'Seat (print tabs up)', count: 1, m: seat.rotate([180, 0, 0]) }];
    if (back) parts.push({ name: 'back', what: 'Back panel', count: 1, m: back });
    const stats = [['Seat height', `${r1(sH)} mm`, 'top of the seat'], ['Footprint', `${r1(p.W)} × ${r1(D)} mm`, 'width × depth'],
      ['Height', `${r1(Math.max(topV, sH))} mm`, p.hasBack ? 'to the top of the back' : 'stool'], ['Joints', `${(rails.length * 2)} wedges`, 'tusk tenons']];
    const notes = [];
    if (p.W > 240 && p.style === 'bench') notes.push('A long bench rail can bow a little. Print the rails in PETG, or make the bench narrower.');
    if (p.t < 6) notes.push('At this size the legs and wedges are small. The resin printer will give cleaner joints.');
    return { parts, asm, stats, notes, colors: { a: '--tray', b: '--post', c: '--lift' }, legend: [['--tray', 'Side frames'], ['--post', 'Rails, seat and back'], ['--lift', 'Wedges']] };
  }
};
