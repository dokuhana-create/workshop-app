/* Habitat enclosures: bases, lids, posts, walls, doors and hatches, built with lib/geo.js.
   Every enclosure is described by its centre line: the outline the panels (or the rolled sheet) stand on.
   Rectangles, polygons, circles and ovals then share the same base, lid, hatch and light-window code. */
(function(root){
  const G=root.Geo,HP=root.HabitatParts;
  const {prism,varying,rect,rrect,circle,ellipse,polar,offset,intersect,subtract,unite,yDisc,build}=G;
  const RAIL=HP.RAIL,PEG=HP.PEG,TAU=Math.PI*2;

  /* ---------- shared pieces ---------- */
  const sq=(x,y,h)=>[[x,y],[x+h,y],[x+h,y+h],[x,y+h]];
  function bbox(rings){let x0=1e9,x1=-1e9,y0=1e9,y1=-1e9;for(const r of rings)for(const [x,y] of r){x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y)}return {x0,x1,y0,y1}}
  /* mirror a finished mesh in y and keep its faces pointing out: turns a part built top-down into a proper rotation */
  function mirrorY(m){const t=m.tris,o=new Float32Array(t.length);for(let i=0;i<t.length;i+=9){for(const [v,w] of [[0,0],[1,2],[2,1]]){o[i+w*3]=t[i+v*3];o[i+w*3+1]=-t[i+v*3+1];o[i+w*3+2]=t[i+v*3+2]}}return Object.assign({},m,{tris:o})}

  /* ---------- printed screws ----------
     A coarse thread with 45° flanks: the screw prints standing on its head, and the threaded hole prints lying in a
     corner post; both work without supports. The same profile function makes the screw and the hole, offset by a
     small clearance, so they always match. */
  const SCREW={cl:.22,len:12,head:12,headH:3};
  /* sized so the threaded hole keeps at least 1 mm of wall to the panel slots, the outside and the print flat */
  const screwSpec=slim=>slim?{d:5,P:1.6,c:2}:{d:6,P:2,c:2.5};
  function threadR(sp,a,z,cl){const h=.4*sp.P,ph=((z/sp.P-a/TAU)%1+1)%1*sp.P,f=ph<h?ph/h:ph<sp.P/2?1:ph<sp.P/2+h?1-(ph-sp.P/2)/h:0;return sp.d/2-h+h*f+cl}
  /* threaded hole along z, open at z1, with a small lead-in at the mouth */
  function screwHole(cx,cy,z0,z1,sp){return varying(z0,z1+1,z=>polar(cx,cy,a=>Math.max(threadR(sp,a,z,SCREW.cl),sp.d/2+SCREW.cl+.6-(z1-z)),48),.2,'sub')}
  /* the same, open at the bottom (z=0, on the bed) and closed at depth */
  function screwHoleUp(cx,cy,depth,sp){return varying(-1,depth,z=>polar(cx,cy,a=>Math.max(threadR(sp,a,z,SCREW.cl),sp.d/2+SCREW.cl+.6-Math.max(0,z)),48),.17,'sub')}
  /* a threaded stud with a screwdriver slot in its top: turned into a corner post through the lid, it carries a finial */
  function stud(sp,len){const h=.4*sp.P,R0=sp.d/2-h-SCREW.cl;
    return build([varying(0,len,z=>polar(0,0,a=>Math.min(threadR(sp,a,z,-SCREW.cl),R0+.2+z,R0+.2+(len-z)),48),.17),prism(len-1.6,len+1,rect(-sp.d/2-1,-.7,sp.d/2+1,.7),'sub')])}
  /* door lock hasp, standing on edge to print: a plate with two pegs that press into holes, and a tab with a hole
     for a padlock. Local x along the plate, y forward from the face it sits on, z up (0..18). */
  function hasp(L,peg,F,hy){return build([prism(0,18,unite(rect(-4,0,L,2.4),rect(L-2.4,0,L,F))),G.yDisc(0,3,1.6,-peg,.01),G.yDisc(0,15,1.6,-peg,.01),G.xDisc(hy,9,2.6,L-3.4,L+1,'sub')])}
  /* the screw, printed head down: a slot for a coin or screwdriver in the head, a 45° chamfer round its top edge */
  function lidScrew(sp,Lt){
    const H=SCREW.headH,L=Lt+SCREW.len-1,h=.4*sp.P,R0=sp.d/2-h-SCREW.cl;
    return build([varying(0,H,z=>circle(0,0,SCREW.head/2-Math.max(0,.8-z),64),.2),prism(-1,1.4,rect(-4.5,-.8,4.5,.8),'sub'),
      varying(H-.01,H+L,z=>polar(0,0,a=>Math.min(threadR(sp,a,z-H,-SCREW.cl),R0+h+.2,R0+.2+(H+L-z)),48),.17)]);
  }
  /* small turn button: a flat arm on a peg that pushes stiffly into a 3 mm hole. The hub lifts the arm clear of
     what it holds. Printed arm down. */
  function turnButton(hub,peg,arm){arm=arm||8;const [a0,a1]=Array.isArray(arm)?arm:[arm,arm],f=[prism(0,2,unite(G.rrect(-a0,-3.5,a1,3.5,3.5),circle(0,0,3.5)))];
    if(hub>0)f.push(prism(1.99,2+hub,circle(0,0,3.5,32)));f.push(prism(1.99+hub,2+hub+(peg||4.5),circle(0,0,1.6,20)),prism(1.99+hub,2.6+hub,circle(0,0,2.4,20)));return build(f)}

  /* ring lights over the lid: same layout as the ring light seats */
  const SEAT_GAP=4;
  function lightWindows(p,cx,cy,alongY){
    if(!p.lw||p.lw==='none')return null;
    const R=p.lwD/2,n=Math.max(1,Math.min(4,Math.round(p.lwN||1))),pitch=2*R+2*3.2+SEAT_GAP,o0=-(n-1)*pitch/2,centers=[];
    for(let i=0;i<n;i++)centers.push(alongY?[cx,cy+o0+i*pitch]:[cx+o0+i*pitch,cy]);
    return {centers,Rw:R-4,mode:p.lw,R};
  }

  /* ---------- base ----------
     C: centre line ring. o: {gw groove width, wall, S substrate, s rail height, f floor, join, corners:[{x,y,block,pocket}], pegs, rounded} */
  function base(C,o,p){
    const ob=o.gw/2+o.wall,outer=offset(C,ob,o.join),inner=offset(C,-ob,o.join),oG=offset(C,o.gw/2,o.join),iG=offset(C,-o.gw/2,o.join);
    const f=[prism(0,o.f,outer),prism(0,o.S,subtract(outer,inner)),prism(o.S-.01,o.S+o.s,subtract(outer,oG)),prism(o.S-.01,o.S+o.s,subtract(iG,inner))];
    for(const c of o.corners||[]){f.push(prism(0,o.S+o.s,c.block));f.push(prism(o.S,o.S+o.s+1,c.pocket,'sub'))}
    const pegs=[];
    if(p.pegs==='grid'){
      const lim=offset(C,-ob-14),b=bbox(lim),nx=Math.floor((b.x1-b.x0)/RAIL.pitch),ny=Math.floor((b.y1-b.y0)/RAIL.pitch);
      const ox=(b.x0+b.x1-nx*RAIL.pitch)/2,oy=(b.y0+b.y1-ny*RAIL.pitch)/2;
      for(let i=0;i<=nx;i++)for(let j=0;j<=ny;j++){const x=ox+i*RAIL.pitch,y=oy+j*RAIL.pitch;if([[x-PEG.r,y],[x+PEG.r,y],[x,y-PEG.r],[x,y+PEG.r]].every(([u,v])=>G.inside(lim,u,v))){pegs.push([x,y]);f.push(prism(o.f-.01,o.f+PEG.h,circle(x,y,PEG.r,24)))}}
    }
    for(const x of o.subs||[])f.push(x);
    if(o.rounded)f.push(prism(-1,o.S+o.s+2,roundClip(outer,o.corners),'sub'));
    const m=build(f);m.pegs=pegs;return m;
  }
  /* everything outside a softly rounded footprint, to cut the corners round */
  function roundClip(outer,corners){
    const all=unite(outer.concat(...(corners||[]).map(c=>c.block))),r=Math.min(6,Math.max(2,.25*(bbox(all).x1-bbox(all).x0)));
    const soft=offset(offset(all,-r),r),b=bbox(all);
    return subtract(rect(b.x0-20,b.y0-20,b.x1+20,b.y1+20),soft);
  }

  /* ---------- hatch ----------
     style 'magnet': lift-off cover held by two round magnets. 'plug': a cover with a ring that pushes into the hole. 'twist': a plug that locks with a quarter-ish turn. */
  function hatchOK(p){return p.hatch&&p.hatch!=='none'}
  /* width of the raised ring round the hatch: room for the magnets, or just a rim for a plug or twist cover */
  const hatchRim=p=>p.hatch==='magnet'?12:9;
  /* twist lock (bayonet): three lugs on the cover's plug drop through three notches in the hatch rim, then the
     cover turns 40° so the lugs slide under the rim. Lugs and rim meet on matching 45° slopes, so both print without
     supports. A small bump on the rim makes the cover click into place and holds it there; a stop ends the turn.
     Angles are measured from a notch centre, in degrees. */
  const TW={LP:1.6,LH:1.2,lug:21,notch:27,turn:40,c:.15,bump:.35,hold:.2};
  function twistRamp(u){if(u<-TW.lug/2||u>TW.turn+TW.lug/2+.5)return null;const e=TW.turn-TW.lug/2;if(u<e-11.5)return 0;if(u<e-3.5)return TW.bump*(u-(e-11.5))/8;if(u<e-2)return TW.bump;if(u<e-.5)return TW.bump+(TW.hold-TW.bump)*(u-(e-2))/1.5;return TW.hold}
  const sectorU=a=>{let d=((a*180/Math.PI)%120+120)%120;return d>60?d-120:d};
  function hatchCut(f,h,p,Lt){
    const R=(p.dMagD||10)/2+.2,pd=(p.dMagH||3)+.2,boss=Math.max(pd+1.6,5);
    f.push(prism(0,boss,subtract(circle(h.x,h.y,h.R+hatchRim(p)),circle(h.x,h.y,h.R))));
    if(p.hatch==='twist'){
      const deep=TW.LP+.3,top=boss-deep;
      f.push(varying(-1,boss+1,z=>polar(h.x,h.y,a=>{const r=twistRamp(sectorU(a));if(r==null)return h.R;return h.R+Math.max(0,Math.min(deep-r,z-(top+r)))},360),.2,'sub'));
      const nr=h.R+TW.LP+.6;for(let k=0;k<3;k++){const a0=(k*120-TW.notch/2)*Math.PI/180,a1=(k*120+TW.notch/2)*Math.PI/180,q=[];
        for(let i=0;i<=8;i++){const a=a0+(a1-a0)*i/8;q.push([h.x+nr*Math.cos(a),h.y+nr*Math.sin(a)])}for(let i=8;i>=0;i--){const a=a0+(a1-a0)*i/8;q.push([h.x+(h.R-1)*Math.cos(a),h.y+(h.R-1)*Math.sin(a)])}
        f.push(prism(-1,boss+1,[q],'sub'))}
      return;
    }
    f.push(prism(-1,boss+1,circle(h.x,h.y,h.R),'sub'));
    if(p.hatch==='magnet')for(const dx of [-(h.R+6),h.R+6])f.push(prism(-1,pd,G.mag(h.x+dx,h.y,p.dMagD||10),'sub'));
  }
  /* opt.hole: a round opening through the middle instead of vent holes, for a chute or airlock that sits in it */
  function hatchCover(h,p,preview,opt){
    opt=opt||{};const R=(p.dMagD||10)/2+.2,pd=(p.dMagH||3)+.2,f=[];
    const holes=r=>{if(preview||opt.hole)return [];const o=[];for(let x=-r;x<r;x+=p.hole+p.bar)for(let y=-r;y<r;y+=p.hole+p.bar){const q=sq(x,y,p.hole);if(q.every(([u,v])=>Math.hypot(u,v)<r)&&Math.hypot(x+p.hole/2,y+p.hole/2)>8)o.push(q)}return o};
    if(p.hatch==='magnet'){
      const th=pd+1.4;f.push(prism(0,th,circle(0,0,h.R+11)));if(!opt.hole)f.push(prism(th,th+8,circle(0,0,6)));
      for(const dx of [-(h.R+6),h.R+6])f.push(prism(-1,pd,G.mag(dx,0,p.dMagD||10),'sub'));
      const hs=holes(h.R-4);if(hs.length)f.push(prism(-1,th+1,hs,'sub'));
    }else if(p.hatch==='twist'){
      /* printed upside down: the disc on the bed, with a ridged edge to grip; the plug ring rises from it and carries
         three lugs whose undersides slope at 45° to match the slope under the hatch rim */
      const th=2.4,boss=Math.max(pd+1.6,5),Rp=h.R-.25,deep=TW.LP+.3,ztop=th+boss+TW.LH;
      f.push(prism(0,th,unite(polar(0,0,a=>h.R+8+.8*Math.max(0,Math.cos(a*36)),288),G.rrect(h.R+4,-6,h.R+18,6,4))));
      /* ring and lugs as one outline per layer, sampled at the same angles every layer, so edges never nearly meet */
      const inLug=a=>{let d=((a*180/Math.PI)%120+120)%120;if(d>60)d-=120;return Math.abs(d)<=TW.lug/2};
      const ringAt=rl=>subtract(polar(0,0,a=>rl>Rp&&inLug(a)?rl:Rp,360),circle(0,0,Rp-2.2,120)),z0=th+boss-deep;
      f.push(prism(th,z0,ringAt(0)));
      f.push(varying(z0,ztop,z=>{const zz=z-th,rl=h.R-TW.c+Math.max(0,Math.min(deep,zz-(boss-deep)));return ringAt(rl<Rp+.3?0:rl)},.2));
      const hs=holes(h.R-4);if(hs.length)f.push(prism(-1,th+1,hs,'sub'));
    }else{
      /* printed upside down: the cover disc on the bed, the plug ring rising from it, a finger tab at the side */
      const th=2.4;f.push(prism(0,th,unite(circle(0,0,h.R+8),G.rrect(h.R+4,-6,h.R+18,6,4))),prism(th-.01,th+4.5,subtract(circle(0,0,h.R-.2),circle(0,0,h.R-2))));
      const hs=holes(h.R-4);if(hs.length)f.push(prism(-1,th+1,hs,'sub'));
    }
    if(opt.hole)f.push(prism(-1,30,circle(0,0,opt.hole,64),'sub'));
    return build(f);
  }

  /* ---------- lid, built top down (z=0 is the top face), then turned over for printing ----------
     o: {gw, wall, s, Lt, join, corners, slot (ring to cut for a sliding door), centre [cx,cy], alongY, rounded} */
  function lid(C,o,p,preview){
    const ob=o.gw/2+o.wall,outer=offset(C,ob,o.join),oG=offset(C,o.gw/2,o.join),iG=offset(C,-o.gw/2,o.join),inner=offset(C,-ob,o.join);
    const f=[prism(0,o.Lt,outer),prism(o.Lt-.01,o.Lt+o.s,subtract(outer,oG)),prism(o.Lt-.01,o.Lt+o.s,subtract(iG,inner))],notes=[];
    for(const c of o.corners||[]){f.push(prism(0,o.Lt+o.s,c.block));f.push(prism(o.Lt,o.Lt+o.s+1,c.pocket,'sub'))}
    if(o.slot)f.push(prism(-1,o.Lt+o.s+1,o.slot,'sub'));
    if(o.screws&&o.screws.length)f.push(prism(-1,o.Lt+1,o.screws.map(([x,y,r])=>circle(x,y,r,40)[0]),'sub'));
    const mesh=offset(C,-ob-4),fits=(x,y,r)=>[[x-r,y],[x+r,y],[x,y-r],[x,y+r],[x-r*.7,y-r*.7],[x+r*.7,y-r*.7],[x-r*.7,y+r*.7],[x+r*.7,y+r*.7]].every(([u,v])=>G.inside(mesh,u,v));
    /* light windows */
    let win=lightWindows(p,o.centre[0],o.centre[1],o.alongY);
    const innerR=offset(C,-ob),fitsW=(x,y,r)=>[...Array(16)].every((_,k)=>G.inside(innerR,x+r*Math.cos(k*TAU/16),y+r*Math.sin(k*TAU/16)));
    /* with a hatch, the lamps move as far to one side as they fit, to leave the hatch the most room */
    if(win&&hatchOK(p)){const px=o.alongY?0:1;let best=0;for(let sft=0;sft<400;sft+=2){if(win.centers.every(c=>{const q=[...c];q[px]+=sft;return fitsW(q[0],q[1],win.Rw+7.5)}))best=sft;else break}
      if(best)win.centers=win.centers.map(c=>{const q=[...c];q[px]+=best;return q})}
    if(win){const ok=win.centers.filter(([x,y])=>fitsW(x,y,win.Rw+3.3));if(ok.length<win.centers.length)notes.push(`Only ${ok.length} light window${ok.length===1?'':'s'} fit this lid.`);win.centers=ok;if(!ok.length)win=null}
    /* hatch: where the person put it, else the nearest free spot */
    let hatch=null;
    if(hatchOK(p)){
      const rr=hatchRim(p)+1,clear=(x,y,R)=>fits(x,y,R+rr)&&(!win||win.centers.every(([cx,cy])=>Math.hypot(x-cx,y-cy)>win.Rw+7.5+R+rr));
      const want=[o.centre[0]+(+p.hatchX||0),o.centre[1]+(+p.hatchY||0)];
      search:for(let R=Math.min(60,(p.hatchD||80)/2);R>=15;R-=3){
        for(let r=0;r<200;r+=4)for(let k=0;k<(r?24:1);k++){const a=k/24*TAU,x=want[0]+r*Math.cos(a),y=want[1]+r*Math.sin(a);if(clear(x,y,R)){hatch={x,y,R};if(r>0)notes.push('The hatch was moved to the nearest spot where it fits.');if(R<Math.min(60,(p.hatchD||80)/2)-1)notes.push(`The hatch opening is ${2*R} mm across: that is the largest that fits here. Make the lid bigger, use fewer lamps, or move the hatch for a larger one.`);break search}}
      }
      if(!hatch)notes.push('There is no room for a feeding hatch here, so you open the enclosure by lifting the lid.');
      else hatchCut(f,hatch,p,o.Lt);
    }
    const hs=[];
    if(win)for(const [cx,cy] of win.centers){
      /* a plain round opening; the clear disc lies over it on the flat rim around it (a recess for it would hang over thin air while printing) */
      if(win.mode==='insert'){f.push(prism(-1,o.Lt+1,circle(cx,cy,win.Rw),'sub'))}
      else hs.push(...HP.lampSlots(cx,cy,win.Rw+3));
    }
    if(p.lidVent==='rings'){
      /* rings and spokes: concentric slots round the lamp (or the lid's middle), split by six spokes; the corners stay solid */
      const one=win&&win.centers.length===1,[cx,cy]=one?win.centers[0]:o.centre,pitch=p.hole+p.bar,sw=1.6;
      let Rmax=0;for(let r=4;r<2000;r+=.5){if([...Array(48)].every((_,k)=>G.inside(mesh,cx+r*Math.cos(k*TAU/48),cy+r*Math.sin(k*TAU/48))))Rmax=r;else break}
      const Rmin=one?win.Rw+3+HP.LAMP_COLLAR:6,slots=[];
      for(let r0=Rmin;r0+p.hole<=Rmax-2;r0+=pitch){const r1=r0+p.hole;
        for(let j=0;j<6;j++){const b0=j*TAU/6,b1=b0+TAU/6,q=[],arc=(r,s)=>{const d=Math.asin(Math.min(.9,sw/r));const a0=b0+d,a1=b1-d,n=Math.max(3,Math.ceil((a1-a0)*r/1.5));for(let i=0;i<=n;i++){const t=s?a0+(a1-a0)*i/n:a1-(a1-a0)*i/n;q.push([cx+r*Math.cos(t),cy+r*Math.sin(t)])}};
          arc(r1,true);arc(r0,false);slots.push(q)}}
      const keep=[];if(hatch)keep.push(circle(hatch.x,hatch.y,hatch.R+hatchRim(p)+1,48)[0]);if(win&&!one)for(const [x,y] of win.centers)keep.push(circle(x,y,win.Rw+3+HP.LAMP_COLLAR,48)[0]);
      const cut=keep.length?subtract(slots,keep):slots;if(cut.length)f.push(prism(-1,o.Lt+1,cut,'sub'));
    }else if(!preview){
      const b=bbox(mesh),pitch=p.hole+p.bar;
      for(let x=b.x0;x<b.x1;x+=pitch)for(let y=b.y0;y<b.y1;y+=pitch){
        const q=sq(x,y,p.hole);
        if(!q.every(([u,v])=>G.inside(mesh,u,v)))continue;
        if(hatch&&q.some(([u,v])=>Math.hypot(u-hatch.x,v-hatch.y)<hatch.R+hatchRim(p)+1))continue;
        if(win&&q.some(([u,v])=>win.centers.some(([cx,cy])=>Math.hypot(u-cx,v-cy)<win.Rw+3+HP.LAMP_COLLAR)))continue;
        hs.push(q);
      }
    }
    if(hs.length)f.push(prism(-1,o.Lt+1,hs,'sub'));
    if(o.rounded)f.push(prism(-1,o.Lt+o.s+2,roundClip(outer,o.corners),'sub'));
    for(const x of o.extra||[])f.push(x);
    const m=mirrorY(build(f));m.win=win;m.hatch=hatch;m.notes=notes;m.cover=hatch?hatchCover(hatch,p,preview):null;
    return m;
  }

  /* ---------- rectangular enclosure ---------- */
  function rectCorners(d,rounded){
    const {W,D,Eh,a}=d,c=.25,o=[];
    for(const [x,y] of [[0,0],[W,0],[W,D],[0,D]])o.push({x,y,block:rounded?G.rrect(x-Eh,y-Eh,x+Eh,y+Eh,3):rect(x-Eh,y-Eh,x+Eh,y+Eh),pocket:rect(x-a-c,y-a-c,x+a+c,y+a+c)});
    return o;
  }
  const rectC=d=>[[[0,0],[d.W,0],[d.W,d.D],[0,d.D]]];
  /* air slots low in the front of the base, so fresh air comes in at the bottom and leaves through the lid */
  function frontVents(d,p){
    if(p.frontVent!=='slots'||d.S<20)return null;
    const ob=d.g/2+2.4,z1=d.S-3,z0=Math.max(d.f+3,d.S-14),w=p.hole,pitch=Math.max(w+1.6,p.hole+p.bar),xs=[],x0=d.Eh+6,x1=d.W-d.Eh-6;
    const n=Math.floor((x1-x0-w)/pitch),o0=(x0+x1-(n*pitch+w))/2;for(let i=0;i<=n;i++){const x=o0+i*pitch;xs.push(rect(x,-(d.E||ob)-1,x+w,ob+1)[0])}
    return {sub:prism(z0,z1,xs,'sub'),z0,z1,n:n+1};
  }
  /* ---------- the plinth and cornice (v32) ----------
     The base is wrapped in a thin moulded skin that runs flush round the corners, E out from the panel line: a small
     chamfer at the foot, a shadow line 8 mm up, and a chamfer at the top. Behind the skin is a hollow, open underneath
     and closed at the top by a short flat bridge, so it prints without supports and costs little filament. Ribs tie the skin
     to the wall. The lid gets a matching cornice: its top plate runs out to the same line, with chamfered edges, over
     the recessed frieze of the corner blocks. */
  const PL={skin:1.2,rib:1.2,ribPitch:55};
  const plRect=(d,i,r)=>G.rrect(-d.E+i,-d.E+i,d.W+d.E-i,d.D+d.E-i,Math.max(.4,r-i),10);
  function baseInset(z,Hb){if(z<.8)return .8-z;if(z>7&&z<8.6)return .8-Math.abs(z-7.8);if(z>Hb-1.4)return z-(Hb-1.4);return 0}
  function plinthBase(d,p){
    const Hb=d.S+d.s,r=p.corners==='rounded'?6:2,ob=d.g/2+2.4,wallL=offset(rectC(d),ob,'miter'),C=rectC(d);
    const blocks=[[0,0],[d.W,0],[d.W,d.D],[0,d.D]].map(([x,y])=>rect(x-d.Eh,y-d.Eh,x+d.Eh,y+d.Eh)[0]);
    /* ribs from the skin to the wall, about every 55 mm */
    const ribs=[],rw=PL.rib/2;
    for(const [len,mk] of [[d.W,(t,sd)=>sd?rect(t-rw,d.D,t+rw,d.D+d.E+1):rect(t-rw,-d.E-1,t+rw,0)],[d.D,(t,sd)=>sd?rect(d.W,t-rw,d.W+d.E+1,t+rw):rect(-d.E-1,t-rw,0,t+rw)]]){
      const span=len-2*d.Eh,n=Math.max(1,Math.round(span/PL.ribPitch));for(let i=1;i<n;i++){const t=d.Eh+span*i/n;for(const sd of [0,1])ribs.push(mk(t,sd)[0])}}
    /* solid bosses behind the magnet pockets for a front frame */
    const zb=d.S/2+7,boss=[0,d.W].map(x=>rect(x-7,-d.E-1,x+7,-d.Eh+.5)[0]);
    const skin=varying(0,Hb,z=>subtract(plRect(d,baseInset(z,Hb),r),wallL),.2);
    /* the roof over the hollow is a flat 1.6 mm bridge, about 10 mm wide between the ribs */
    const hollow=varying(-1,Hb-1.6,z=>{const zz=Math.max(0,z),ins=PL.skin+baseInset(zz,Hb);
      if(d.E-ins<=ob+.4)return [];return subtract(plRect(d,ins,r),unite(wallL,blocks,ribs,zz<zb?boss:[]))},.2,'sub');
    return [skin,hollow];
  }
  function rectBase(d,p){const v=frontVents(d,p),subs=v?[v.sub]:[];
    if(d.E)subs.push(...plinthBase(d,p));
    /* magnet pockets in the front of the two front corners, for a decorative front frame */
    const fy=-(d.E||d.Eh);
    if(p.frameMags==='yes'&&d.S>=(p.dMagD||10)+4)for(const x of [0,d.W])subs.push(G.yMag(x,d.S/2,p.dMagD||10,fy-1,fy+(p.dMagH||3)+.2,'sub'));
    const m=base(rectC(d),{gw:d.g,wall:2.4,S:d.S,s:d.s,f:d.f,join:'miter',corners:rectCorners(d,p.corners==='rounded'),rounded:!d.E&&p.corners==='rounded',subs},p);m.vents=v;return m}
  /* the cornice plate: the lid's top runs out to the plinth line, chamfered top and bottom */
  function lidInset(z){if(z<.8)return .8-z;if(z>1.6)return z-1.6;return 0}
  /* where a crest stands on the lid: two square pegs go into slots in small blocks under the front of the cornice */
  const crestX=d=>[d.W/2-d.W*.22,d.W/2+d.W*.22];
  const CREST={y0:1,y1:5,peg:4,len:7};
  function cornice(d,p){
    const r=p.corners==='rounded'?6:2,f=[varying(0,2.4,z=>plRect(d,lidInset(z),r),.2)];
    if(p.doorStyle&&p.doorStyle!=='plain')for(const x of crestX(d)){const c=CREST.peg/2+.15;
      f.push(prism(1,2.4+6,rect(x-5,-d.E+.6,x+5,-d.E+CREST.y1+2)),prism(-1,CREST.len+.4,rect(x-c,-d.E+CREST.y0-.15,x+c,-d.E+CREST.y1+.15),'sub'))}
    return f;
  }
  /* where each corner's lid screw goes: in the outer quarter of the post, clear of both panel slots */
  function screwSpots(d,p){if(p.lidScrews!=='screws')return [];const c=screwSpec(d.slim).c;return [[0,0],[d.W,0],[d.W,d.D],[0,d.D]].map(([x,y],i)=>{const a=i*Math.PI/2,co=Math.round(Math.cos(a)),si=Math.round(Math.sin(a));return [x+co*-c-si*-c,y+si*-c+co*-c]})}
  function rectLid(d,p,preview){
    const g=d.g,slot=d.swing?null:rect(g/2,-g/2,d.W-g/2,g/2),sp=screwSpec(d.slim);
    const m=lid(rectC(d),{gw:g,wall:2.4,s:d.s,Lt:d.Lt,join:'miter',corners:rectCorners(d,p.corners==='rounded'),slot,screws:screwSpots(d,p).map(([x,y])=>[x,y,sp.d/2+.4]),centre:[d.W/2,d.D/2],alongY:d.D>d.W,rounded:!d.E&&p.corners==='rounded',extra:d.E?cornice(d,p):[]},p,preview);
    m.screw=p.lidScrews==='screws'?lidScrew(sp,d.Lt):null;return m;
  }
  /* corner post: two slots for the panels; printed lying on a flat side */
  function rectPost(d,p){
    const {a,g,Hp}=d,r=p.corners==='rounded'?3:0,ch=d.slim?3:4.5;
    const f=[prism(0,Hp,r?G.rrect(-a,-a,a,a,r):rect(-a,-a,a,a)),prism(-1,Hp+1,rect(g/2,-g/2,a+1,g/2),'sub'),prism(-1,Hp+1,rect(-g/2,g/2,g/2,a+1),'sub')];
    /* a flat along the outer corner: the post prints lying on it, with both grooves facing up at 45° */
    f.push(prism(-1,Hp+1,[[[-a-1,-a-1],[-a+ch,-a-1],[-a-1,-a+ch]]],'sub'));
    /* threaded hole at the top for the lid screw */
    if(p.lidScrews==='screws'){const sp=screwSpec(d.slim);f.push(screwHole(-sp.c,-sp.c,Hp-SCREW.len-1,Hp,sp))}
    /* holes in both outer faces for the door's turn latch (every post gets them, so any post fits any corner) */
    if(d.latch){const dep=latchDepth(d),z=d.latchZ;f.push(G.yDisc(3,z,1.5,-a-1,-a+dep,'sub'),G.xDisc(3,z,1.5,-a-1,-a+dep,'sub'))}
    if(d.lockZ!=null){const dep=latchDepth(d);for(const z of [d.lockZ-6,d.lockZ+6])f.push(G.yDisc(3,z,1.5,-a-1,-a+dep,'sub'),G.xDisc(3,z,1.5,-a-1,-a+dep,'sub'))}
    return build(f);
  }
  const latchDepth=d=>Math.min(5,d.a-d.g/2-.8);

  /* ---------- polygon enclosure: 5 to 8 flat walls ----------
     W is the width across the flats, measured between panel centres. One flat faces the front. */
  function polyGeom(p){
    const n=Math.max(5,Math.min(8,Math.round(p.sides||6))),A=p.W/2,Rv=A/Math.cos(Math.PI/n),V=[];
    for(let k=0;k<n;k++){const a=-Math.PI/2-Math.PI/n+k*TAU/n;V.push([Rv*Math.cos(a),Rv*Math.sin(a)])}
    return {n,A,Rv,V,Lf:2*A*Math.tan(Math.PI/n),alpha:Math.PI-TAU/n};
  }
  /* corner spine: holds the edges of two panels meeting at an angle. Local frame: the corner at the origin,
     the inside along +y. It prints lying on its flat outer face. */
  function spineProfile(pg,g,a){
    const h=pg.alpha/2,d1=[Math.sin(h),Math.cos(h)],d2=[-Math.sin(h),Math.cos(h)],t0=g*.75;
    let body=intersect(circle(0,0,a,64),rect(-a-1,-a*.55,a+1,a+1));
    const slot=d=>{const nx=-d[1],ny=d[0],w=g/2;return [[[d[0]*t0+nx*w,d[1]*t0+ny*w],[d[0]*(a+2)+nx*w,d[1]*(a+2)+ny*w],[d[0]*(a+2)-nx*w,d[1]*(a+2)-ny*w],[d[0]*t0-nx*w,d[1]*t0-ny*w]]]};
    body=subtract(body,unite(slot(d1),slot(d2)));
    return {body,t0};
  }
  function polyEnclosure(p,preview){
    const pg=polyGeom(p),g=p.T+.6,s=6,Lt=2.4,a=g/2+6.5,c=.25,Eh=a+c+2.4,S=p.S,H=p.H;
    const C=[pg.V],corners=pg.V.map(([x,y])=>({x,y,block:circle(x,y,Eh,48),pocket:circle(x,y,a+c,48)}));
    const b=base(C,{gw:g,wall:2.4,S,s,f:2.4,join:'miter',corners,rounded:false},p);
    const {body,t0}=spineProfile(pg,g,a),Hp=H-.5,spine=build([prism(0,Hp,body)]);
    /* sliding front door through the lid, along the front flat */
    const v0=pg.V[0],v1=pg.V[1],frontDoor=p.pFront!=='none';
    const slot=frontDoor?rect(v0[0]+t0,-pg.A-g/2,v1[0]-t0,-pg.A+g/2):null;
    const L=lid(C,{gw:g,wall:2.4,s,Lt,join:'miter',corners,slot,centre:[0,0],alongY:false,rounded:false},p,preview);
    /* panels: one per flat */
    const pw=pg.Lf-2*(t0+.5),panels=[];
    for(let k=0;k<pg.n;k++){
      const front=k===0;let type=p.polyWalls||'clear';
      if(type==='alt')type=k%2?'mesh':'clear';else if(type==='frontclear')type=front?'clear':'mesh';
      if(front)type=p.pFront==='mesh'?'mesh':'clear';
      panels.push({k:front?'front':'w'+k,label:front?'Front door':`Wall ${k+1}`,w:pw,h:front?H+Lt+20:H-.5,type,idx:k});
    }
    return {pg,g,s,Lt,a,S,H,base:b,lid:L,spine,Hp,panels,corners,t0};
  }
  /* world placement of a spine at corner k */
  function spineToWorld(t,pg,k,S){
    const [vx,vy]=pg.V[k],ang=Math.atan2(-vy,-vx)-Math.PI/2,co=Math.cos(ang),si=Math.sin(ang),o=new Float32Array(t.length);
    for(let i=0;i<t.length;i+=3){o[i]=vx+co*t[i]-si*t[i+1];o[i+1]=vy+si*t[i]+co*t[i+1];o[i+2]=t[i+2]+S}
    return o;
  }

  /* ---------- round and oval enclosures ----------
     The wall is a rolled clear sheet, or a printed mesh tube for full ventilation. */
  function perimeter(a,b){const h=((a-b)/(a+b))**2;return Math.PI*(a+b)*(1+3*h/(10+Math.sqrt(4-3*h)))}
  function roundEnclosure(p,preview){
    const a=p.W/2,b=(p.shape==='round'?p.W:p.D)/2,meshWall=p.roundWall==='mesh',wt=meshWall?2.4:p.ts,gw=wt+.6,s=6,Lt=2.4,S=p.S,H=p.H;
    const C=ellipse(0,0,a,b,Math.round(Math.max(a,b)*1.6));
    const bs=base(C,{gw,wall:2.4,S,s,f:2.4,join:'round'},p);
    const L=lid(C,{gw,wall:2.4,s,Lt,join:'round',centre:[0,0],alongY:b>a},p,preview);
    let tube=null;
    if(meshWall){
      /* a printed mesh tube, meshed on a grid that follows the ellipse: around, through the wall, and up */
      const Ht=H-.5,pitch=p.hole+p.bar,N=2000,pts=[],cum=[0];
      for(let i=0;i<=N;i++){const t=i/N*TAU;pts.push([a*Math.cos(t),b*Math.sin(t)]);if(i)cum.push(cum[i-1]+Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1]))}
      const per=cum[N],at=sv=>{let lo=0,hi=N;while(hi-lo>1){const m=(lo+hi)>>1;if(cum[m]<=sv)lo=m;else hi=m}const f=(sv-cum[lo])/(cum[hi]-cum[lo]||1),t=(lo+f)/N*TAU;return t};
      const ncol=Math.max(8,Math.floor(per/pitch)),us=new Set([0,per]);const cols=[];
      for(let j=0;j<ncol;j++){const s0=j*per/ncol+p.bar/2,s1=s0+p.hole;cols.push([s0,s1]);us.add(+s0.toFixed(4));us.add(+s1.toFixed(4))}
      const U=[...us].sort((x,y)=>x-y),Wz=new Set([0,Ht]),rows=[];
      if(!preview)for(let z=8;z+p.hole<Ht-8;z+=pitch){rows.push([z,z+p.hole]);Wz.add(+z.toFixed(4));Wz.add(+(z+p.hole).toFixed(4))}
      const Z=[...Wz].sort((x,y)=>x-y);
      const inCol=u=>!preview&&cols.some(([s0,s1])=>u>s0&&u<s1),inRow=z=>rows.some(([z0,z1])=>z>z0&&z<z1);
      tube=G.gridMesh(U,[-wt/2,wt/2],Z,(i,j,k)=>!(inCol((U[i]+U[i+1])/2)&&inRow((Z[k]+Z[k+1])/2)),(u,v,w)=>{const t=at(u),x=a*Math.cos(t),y=b*Math.sin(t),nx=b*Math.cos(t),ny=a*Math.sin(t),l=Math.hypot(nx,ny);return [x+v*nx/l,y+v*ny/l,w]},true);
    }
    const outerD=[2*(a+gw/2+2.4),2*(b+gw/2+2.4)];
    return {base:bs,lid:L,tube,C,a,b,gw,S,H,Lt,s,outerD,sheet:meshWall?null:[perimeter(a,b)+15,H-.5],pegs:bs.pegs,notes:L.notes};
  }

  /* ---------- swappable tile panel ----------
     A frame with a grid of openings. Each opening takes a tile, either a printed mesh tile or a piece of clear
     acrylic, held by small turn buttons that push into holes in the frame. Swap tiles whenever you like.
     Printed flat; the edges that go in the grooves stay at panel thickness. */
  const TILE={bar:10,rebate:3,depth:3.2,frame:6.2};
  function tilePanel(q,p,s,preview){
    const T=p.T,Tf=T+TILE.frame-3,e=s+1,iw=q.w-2*e,ih=q.h-2*e;
    const nx=Math.max(1,Math.round(iw/95)),ny=Math.max(1,Math.round(ih/95)),bw=TILE.bar;
    const cw=(iw-(nx+1)*bw)/nx,ch=(ih-(ny+1)*bw)/ny,f=[prism(0,T,rect(0,0,q.w,q.h)),prism(T-.01,Tf,rect(e,e,q.w-e,q.h-e))];
    const cells=[];
    for(let i=0;i<nx;i++)for(let j=0;j<ny;j++){
      const x0=e+bw+i*(cw+bw),y0=e+bw+j*(ch+bw);cells.push([x0,y0]);
      f.push(prism(-1,Tf+1,rect(x0,y0,x0+cw,y0+ch),'sub'),prism(Tf-TILE.depth,Tf+1,rect(x0-TILE.rebate,y0-TILE.rebate,x0+cw+TILE.rebate,y0+ch+TILE.rebate),'sub'));
    }
    /* button holes: the middle of every bar between two openings, and of the frame beside each opening */
    const holes=[];
    for(let i=0;i<=nx;i++)for(let j=0;j<ny;j++)holes.push([e+bw/2+i*(cw+bw),e+bw+j*(ch+bw)+ch/2]);
    for(let i=0;i<nx;i++)for(let j=0;j<=ny;j++)holes.push([e+bw+i*(cw+bw)+cw/2,e+bw/2+j*(ch+bw)]);
    for(const [x,y] of holes)f.push(prism(Tf-5,Tf+1,circle(x,y,1.5,20),'sub'));
    const frame=build(f);
    /* tile and button */
    const tw=cw+2*TILE.rebate-.6,th=ch+2*TILE.rebate-.6,tf=[prism(0,3,rect(0,0,tw,th))];
    if(!preview){const hs=[];for(let x=3.5;x+p.hole<=tw-3.5;x+=p.hole+p.bar)for(let y=3.5;y+p.hole<=th-3.5;y+=p.hole+p.bar)hs.push(sq(x,y,p.hole));if(hs.length)tf.push(prism(-1,4,hs,'sub'))}
    const tile=build(tf);
    const button=build([prism(0,2,unite(G.rrect(-8,-3.5,8,3.5,3.5),circle(0,0,3.5))),prism(1.99,6.5,circle(0,0,1.6,20)),prism(1.99,2.6,circle(0,0,2.4,20))]);
    return {frame,tile,button,cells:cells.length,rects:cells.map(([x,y])=>[x,y,cw,ch]),nx,ny,tileSize:[tw,th],buttons:holes.length,Tf};
  }

  /* ---------- swing door with a printed snap hinge ----------
     Frame coordinates: x across the doorway, y outwards from the frame's outer face, z up.
     The door carries a round rod along its hinge edge. Three C-shaped clips on the frame wrap the rod;
     the door snaps in from the front and turns on the rod. No pin, no screws.
     catch 'magnet': two round magnets in the rim and door. 'detent': a printed rib on the rim clicks into a
     groove in the door. */
  /* ---------- the window door (v35) ----------
     Built lying down, in its own frame: x across the door, y up the door, z through it from the inner face (off) to
     the outer face (off+dt); it prints face down on the bed, so the outer face comes out smooth and the engraving
     crisp. The pane goes in from the inside: its hinge-side edge tucks under a sloped lip, turn buttons hold the other
     edge. The front layer in front of the pane carries the window opening in the theme's shape and the engraved
     ornament around it. A push-in knob replaces the old moulded pull, so nothing stands proud of the face. */
  function themedDoor(q,p){
    const {xh,yh,rr,cR,gp,zone,xm,zm,xd1,xo0,xo1,zo0,zo1,zd0,zd1,off,dt,T,md,pd,mag,turn}=q,Z1=off+dt,TR=root.HabitatTrim;
    const st=TR&&p.doorStyle&&TR.STYLES[p.doorStyle]?TR.STYLES[p.doorStyle]:null;
    const f=[prism(off,Z1,rect(xh,zd0,xd1,zd1))];
    /* the hinge rod along the hinge edge, and the gaps for the frame's clips */
    const xIv=(rings,z)=>G.slice(rings,z);
    f.push(varying(off,Z1,z=>xIv(circle(xh,yh,rr,40),z).map(([a,b])=>rect(a,zd0,b,zd1)[0]),.2));
    const cut=subtract(rect(xh-cR-2,off-1,xh+cR+1.2,Z1+1),circle(xh,yh,rr+.01,40));
    for(const i of [0,2,4]){const [z0,z1]=zone(i);f.push(varying(off-1,Z1+1,z=>xIv(cut,z).map(([a,b])=>rect(a,z0-gp,b,z1+gp)[0]),.2,'sub'))}
    /* catch: magnet pockets or click dimples in the inner face */
    if(mag)for(const z of zm)f.push(prism(off-1,off+pd,G.mag(xm,z,md),'sub'));
    else if(!turn)for(const z of zm)f.push(prism(off-1,off+.9,rect(xm-.9,z-13,xm+.9,z+13),'sub'));
    if(q.lockZ!=null)for(const z of [q.lockZ-6,q.lockZ+6])f.push(prism(Z1-3,Z1+1,circle(xd1-5,z,1.5,24),'sub'));
    /* the pane: same size as before (it fits the panes already cut), in a recess from the inside */
    const PL=xo0,PR=xo1+6,zR0=zo0-3.3,zR1=zo1+3.3,dR=T+.3;
    f.push(varying(off-1,off+dR,z=>{const t=Math.max(0,Math.min(1,(z-off)/dR)),xl=PL+1.2-1.5*t;return rect(xl,zR0,PR+.3,zR1)},.2,'sub'));
    const bx=PR+.3+3.3;let buttons=0;
    if(bx+2.6<=xd1){const zs=[zR0+14,zR1-14];for(const z of zs)f.push(prism(off-1,off+4.5,circle(bx,z,1.5,24),'sub'));buttons=zs.length}
    /* the window opening in the front layer: the theme's shape inside the pane, 3 mm of pane held all round */
    const ox0=PL+3,ox1=PR-3,oz0=zR0+3.3,oz1=zR1-3.3;
    const win=st?TR.opening(st.open,ox0,oz0,ox1,oz1):G.rrect(ox0,oz0,ox1,oz1,6);
    f.push(prism(off+dR-.01,Z1+1,win,'sub'));
    /* knob hole on the free side, at mid height */
    const kz=(zd0+zd1)/2,kx=xd1-6;f.push(prism(Z1-4.5,Z1+1,circle(kx,kz,1.6,24),'sub'));
    /* engraved ornament: the theme's corner art beside the top of the window, a running pattern up the free side,
       and a fine line round the opening */
    let art=[];
    if(st){const lw=1.2,face=G.rrect(xh+cR+2,zd0+2,xd1-2,zd1-2,2),keep=subtract(face,offset(win,1.2));
      art.push(subtract(offset(win,2.6),offset(win,1.4)));
      /* corner art: in the largest round space beside the top of the window, found by search */
      const segD=(px,py,rings)=>{let d=1e9;for(const r of rings)for(let i=0;i<r.length;i++){const [ax,ay]=r[i],[bx_,by_]=r[(i+1)%r.length],vx=bx_-ax,vy=by_-ay,L2=vx*vx+vy*vy||1,t=Math.max(0,Math.min(1,((px-ax)*vx+(py-ay)*vy)/L2));d=Math.min(d,Math.hypot(px-ax-t*vx,py-ay-t*vy))}return d};
      if(st.open!=='rect'){let best=null;const w=ox1-ox0;
        for(let i=0;i<=24;i++)for(let j=0;j<=24;j++){const px=ox0-4+(w*.5)*i/24,py=oz1+2-(w*.6)*j/24;if(!G.inside(keep,px,py))continue;const dd=segD(px,py,keep);if(!best||dd>best[2])best=[px,py,dd]}
        if(best&&best[2]>5){const sz=best[2]*1.8;for(const [cx,fl] of [[best[0],false],[ox0+ox1-best[0],true]]){let a=TR.cornerArt(st.corner,cx,best[1],sz);if(fl)a=a.map(r=>r.map(([x,y])=>[2*cx-x,y]).reverse());art.push(a)}}}
      const sx0=PR+.8,sx1=xd1-2.2;if(sx1-sx0>4.5)art.push(TR.pattern(st.stile,sx0,zd0+16,sx1,zd1-16,.9,7));
      art=intersect(U2(art),offset(keep,-.6));
      if(art.length)f.push(prism(Z1-.8,Z1+1,art,'sub'))}
    const m=build(f);
    /* back to the enclosure's axes: x stays, the door's y becomes height, its z becomes depth */
    const t=m.tris,o2=new Float32Array(t.length);
    for(let i=0;i<t.length;i+=9)for(const [v,w] of [[0,0],[1,2],[2,1]]){o2[i+w*3]=t[i+v*3];o2[i+w*3+1]=t[i+v*3+2];o2[i+w*3+2]=t[i+v*3+1]}
    return {doorM:{tris:o2},faceDown:true,win:[PR-PL,zR1-zR0-.6],recess:true,buttons,button:buttons?turnButton(0,4.5):null,knob:knob(),styled:!!st,face2D:{art,win,leaf:[[xh,zd0],[xd1,zd0],[xd1,zd1],[xh,zd1]]}};
  }
  const U2=a=>a.filter(x=>x&&x.length).reduce((x,y)=>unite(x,y),[]);
  /* a small turned knob with a 3 mm peg that pushes into the door */
  function knob(){return build([varying(0,8,z=>circle(0,0,3+3.5*Math.sin(.9*Math.PI*Math.min(1,(8-z)/8*1.15))+.01,40),.25),prism(7.99,13,circle(0,0,1.45,24))])}
  function swingDoor(o,p,preview){
    const {fbW,pH,T,postX,s}=o,catchM=p.doorCatch!=='detent',mag=p.doorCatch==='magnet'||!p.doorCatch,turn=p.doorCatch==='turn';
    const md=p.dMagD||10,mh=p.dMagH||3,pd=mh+.2,Rm=md/2+.2,recess=p.front==='swingWindow';
    const off=catchM?mh+1.6:3.2,dt0=catchM?Math.max(T,mh+1.6):Math.max(T,3.2),rr=3,cR=rr+2.6,cl=.3;
    /* with the window in a recess the door is thicker: the pane sits flush in its outer face, behind it stays a 1.6 mm
       back, and the magnet pockets in the inner face stay clear of the recess */
    const dt=recess?Math.max(dt0,T+.3+2.2,2*rr,pd+1.2):dt0;
    const xh=postX+.8+cR,yh=off+rr,zd0=s+1,zd1=pH-s-1,Lh=zd1-zd0,xd1=fbW-postX-1.5;
    /* the free side always has room for the window's turn buttons */
    const rwR=catchM||recess?2*Rm+4:8,xr0=xh+cR+1.2,xo0=xr0+4,xo1=xd1-1-rwR,zo0=zd0+5,zo1=zd1-5;
    if(xo1-xo0<40||zo1-zo0<60)return {ok:false};
    const gp=.6,seg=(Lh-4*gp)/5,zone=i=>[zd0+i*(seg+gp),zd0+i*(seg+gp)+seg],xm=(xo1+xd1-1)/2,zm=[zo0+(zo1-zo0)*.25,zo0+(zo1-zo0)*.75];
    /* frame */
    const ff=[prism(0,pH,rect(0,-T,fbW,0)),prism(zd0+1,zd1-1,subtract(rect(xr0,-.01,xd1-1,off),rect(xo0,-1,xo1,off+1)))];
    ff.push(prism(-1,pH+1,rect(xo0,-T-1,xo1,1),'sub'));
    const clip=subtract(unite(circle(xh,yh,cR,48),rect(xh-cR*.8,-.01,xh+cR*.8,yh)),unite(circle(xh,yh,rr+cl,48),rect(xh-rr*.85,yh,xh+rr*.85,yh+cR+1)));
    for(const i of [0,2,4]){const [z0,z1]=zone(i);ff.push(prism(z0,z1,clip))}
    if(mag)for(const z of zm)ff.push(G.yMag(xm,z,md,off-pd,off+1,'sub'));
    else if(!turn)for(const z of zm)ff.push(prism(z-12,z+12,G.rrect(xm-.6,off-.01,xm+.6,off+.6,.3)));
    if(recess)return Object.assign(themedDoor({xh,yh,rr,cR,gp,zone,xm,zm,xd1,xo0,xo1,zo0,zo1,zd0,zd1,off,dt,T,md,pd,Rm,mag,turn,lockZ:o.lockZ},p),{ok:true,frameM:build(ff),pinLen:0,catchM:mag,turn,front:off+dt,edge:xd1,midZ:(zd0+zd1)/2});
    /* door */
    const leaf=rect(xh,off,xd1,off+dt),df=[prism(zd0,zd1,leaf),prism(zd0,zd1,circle(xh,yh,rr,40))];
    df.push(prism((zd0+zd1)/2-15,(zd0+zd1)/2+15,rect(xd1-10,off+dt-.01,xd1,off+dt+8)));
    for(const i of [0,2,4]){const [z0,z1]=zone(i);df.push(prism(z0-gp,z1+gp,subtract(rect(xh-cR-2,off-1,xh+cR+1.2,off+dt+1),circle(xh,yh,rr+.01,40)),'sub'))}
    if(mag)for(const z of zm)df.push(G.yMag(xm,z,md,off-1,off+pd,'sub'));
    else if(!turn)for(const z of zm)df.push(prism(z-13,z+13,rect(xm-.9,off-1,xm+.9,off+.9),'sub'));
    let buttons=0;
    /* lock hasp: two shallow holes near the free edge, clear of the magnet pockets in the back */
    if(o.lockZ!=null)for(const z of [o.lockZ-6,o.lockZ+6])df.push(yDisc(xd1-5,z,1.5,off+dt-3,off+dt+1,'sub'));
    if(recess){
      /* window opening with rounded corners, which also keeps cracks from starting there */
      const wx0=xo0+3,wx1=xo1-3,wz0=zo0+3,wz1=zo1-3,rc=6;
      df.push(varying(wz0,wz1,z=>{const e=Math.min(z-wz0,wz1-z),i=e<rc?rc-Math.sqrt(Math.max(0,rc*rc-(rc-e)**2)):0;return rect(wx0+i,off-1,wx1-i,off+dt+1)},.25,'sub'));
      /* the recess for the pane: 3 mm over the opening on the hinge side, under a sloped lip it tucks behind, and
         9 mm on the free side, where turn buttons hold it. Top and bottom 6 mm. */
      const PL=xo0,PR=xo1+6,yR=off+dt-T-.3,zR0=zo0-3.3,zR1=zo1+3.3;
      df.push(prism(zR0,zR1,[[[PL-.3,yR],[PR+.3,yR],[PR+.3,off+dt+1],[PL+1.2,off+dt+1],[PL+1.2,off+dt]]],'sub'));
      const bx=PR+.3+3.3;
      if(bx+2.6<=xd1){const zs=[zR0+14,zR1-14];for(const z of zs)df.push(yDisc(bx,z,1.5,off+dt-5,off+dt+1,'sub'));buttons=zs.length}
    }else if(p.front==='swingWindow')df.push(prism(zo0+3,zo1-3,rect(xo0+3,off-1,xo1-3,off+dt+1),'sub'));
    else if(!preview){
      const cols=[];for(let x=xo0+3;x+p.hole<=xo1-3;x+=p.hole+p.bar)cols.push(rect(x,off-1,x+p.hole,off+dt+1)[0]);
      for(let z=zo0+3;z+p.hole<=zo1-3;z+=p.hole+p.bar)df.push(prism(z,z+p.hole,cols,'sub'));
    }
    return {ok:true,frameM:build(ff),doorM:build(df),pinLen:0,win:p.front==='swingWindow'?[xo1-xo0-6+12,zo1-zo0-6+12]:null,mesh:p.front==='swingMesh',catchM:mag,turn,recess,buttons,
      button:buttons?turnButton(0,4.5):null,front:off+dt,edge:xd1,midZ:(zd0+zd1)/2};
  }

  root.HabitatEnclosure={crestX,CREST,screwSpec,screwSpots,stud,hasp,screwHoleUp,lidScrew,turnButton,latchDepth,frontVents,hatchCover,TW,base,lid,rectBase,rectLid,rectPost,polyGeom,polyEnclosure,spineToWorld,roundEnclosure,perimeter,tilePanel,TILE,swingDoor,lightWindows,mirrorY};
})(typeof window!=='undefined'?window:globalThis);
