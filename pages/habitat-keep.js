/* Habitat, keeper's kit: breeding and nymph gear, hatch chutes and airlocks, a turntable, shipping inserts and
   diorama pieces (with glow or UV accent parts). Every builder returns {parts:[{file,role,m}], notes, magnets}.
   Everything is laid out in its print orientation and keeps to 45° so nothing needs supports. */
(function(root){
  const G=root.Geo,HP=root.HabitatParts,HM=root.HabitatMore,HE=root.HabitatEnclosure;
  const {varying,rect,rrect,circle,ellipse,ngon,polar,wobble,offset,intersect,subtract,unite,build,stroke,move}=G;
  const TAU=Math.PI*2,bounds=HP.bounds,PEG=HP.PEG,CLIP=HP.CLIP,RAIL=HP.RAIL;
  const sarea=r=>{let a=0;for(let i=0;i<r.length;i++){const [x0,y0]=r[i],[x1,y1]=r[(i+1)%r.length];a+=x0*y1-x1*y0}return a/2};
  function clean(rings,minA){const CL=root.ClipperLib,SC=1000,ps=rings.map(r=>r.map(([x,y])=>({X:Math.round(x*SC),Y:Math.round(y*SC)})));
    return CL.Clipper.CleanPolygons(ps,5).filter(p=>p.length>2).map(p=>p.map(q=>[q.X/SC,q.Y/SC])).filter(r=>Math.abs(sarea(r))>(minA||.01))}
  const prism=(z0,z1,rings,op)=>G.prism(z0,z1,clean(rings),op);
  const part=(file,m,role)=>({file,role:role||'Main colour',m});
  const rnd=seed=>{let s=Math.abs(Math.round((seed||1)*7919))%233280||1;return ()=>{s=(s*9301+49297)%233280;return s/233280}};
  const rot=(rings,a,cx,cy)=>{cx=cx||0;cy=cy||0;const c=Math.cos(a),s=Math.sin(a);return rings.map(q=>q.map(([x,y])=>{const dx=x-cx,dy=y-cy;return [cx+dx*c-dy*s,cy+dx*s+dy*c]}))};
  const sector=(r0,r1,a0,a1,n)=>{n=n||12;const q=[];for(let i=0;i<=n;i++){const a=a0+(a1-a0)*i/n;q.push([r1*Math.cos(a),r1*Math.sin(a)])}for(let i=n;i>=0;i--){const a=a0+(a1-a0)*i/n;q.push([r0*Math.cos(a),r0*Math.sin(a)])}return [q]};
  const ring=(r0,r1,n)=>subtract(circle(0,0,r1,n||96),circle(0,0,r0,n||96));
  /* a shell of revolution r(z) (outer) with a wall, clamped so each step moves at most 45° from the one below */
  function shell(z0,z1,rOut,wall,dz,shape){
    dz=dz||.3;shape=shape||(r=>circle(0,0,r,96));const n=Math.max(1,Math.ceil((z1-z0)/dz)),ro=[],ri=[];let po=null,pi=null;
    for(let i=0;i<n;i++){const z=z0+(i+.5)*(z1-z0)/n;let o=rOut(z),w=wall==null?0:wall;
      if(po!=null)o=Math.max(po-dz,Math.min(po+dz,o));let ii=w?Math.max(0,o-w):0;if(pi!=null&&w)ii=Math.max(Math.min(ii,pi+dz),pi-dz,0);ii=Math.min(ii,o-.8);
      ro.push(o);ri.push(ii);po=o;pi=ii}
    return varying(z0,z1,z=>{const i=Math.min(n-1,Math.max(0,Math.floor((z-z0)/(z1-z0)*n)));return ri[i]>.4?subtract(shape(ro[i]),shape(ri[i])):shape(ro[i])},(z1-z0)/n);
  }

  /* ================= breeding and nymphs ================= */

  /* ootheca incubator: a tray, a vented body, a bar to hang the egg case from, and a funnel top. Newly hatched
     nymphs climb up towards the light, through the funnel, into a clear cup turned upside down on the collar. */
  function incubator(o){
    const W=o.W,H=o.H,wl=1.6,r=6,f=[],notes=[],parts=[];
    /* tray */
    const tw=W+2*(wl+.4),trayO=rrect(-tw/2,-tw/2,tw/2,tw/2,r+2);
    parts.push(part('incubator-tray.stl',build([prism(0,14,trayO),prism(2,15,offset(trayO,-wl),'sub')])));
    /* body: vented walls, two notches at the top for the hanger bar */
    const bo=rrect(-W/2,-W/2,W/2,W/2,r),bi=offset(bo,-wl),bf=[prism(0,H,subtract(bo,bi))];
    const sw=o.slot,pitch=sw+1.6,z0=8,z1=H-10,row=12;
    for(let z=z0;z+row<=z1;z+=row+3){const cut=[];
      for(let x=-W/2+r+2;x+sw<=W/2-r-2;x+=pitch){cut.push(...rect(x,-W/2-1,x+sw,-W/2+wl+1),...rect(x,W/2-wl-1,x+sw,W/2+1),...rect(-W/2-1,x,-W/2+wl+1,x+sw),...rect(W/2-wl-1,x,W/2+1,x+sw))}
      bf.push(prism(z,z+row,cut,'sub'))}
    bf.push(prism(H-6,H+1,unite(rect(-W/2-1,-3,-W/2+wl+1,3),rect(W/2-wl-1,-3,W/2+1,3)),'sub'));
    parts.push(part('incubator-body.stl',build(bf)));
    /* hanger bar: drops into the notches; thread, a twist tie or hot glue holds the egg case's twig */
    const bl=W+1;let bar=rrect(-bl/2,-2.6,bl/2,2.6,1.5);for(const x of [-W*.25,0,W*.25])bar=subtract(bar,circle(x,0,1.1,16));
    parts.push(part('incubator-hanger-bar.stl',build([prism(0,3,bar)]),'Second file'));
    /* funnel top: a skirt over the body, a cone up to the opening, and a collar the cup sits over */
    const so=offset(bo,wl+.4),si=offset(bo,.3),sk=8,rs=o.spout/2,rc=Math.min(o.cup/2,W/2),wc=wl+.6;
    /* skirt over the body, then a 45° chamfer inwards down to the body wall, so the funnel rests on it */
    const ft=[prism(0,sk-4,subtract(so,si)),varying(sk-4,sk,z=>subtract(so,offset(bo,Math.max(-wl,.3-(z-(sk-4))))),.25)];
    /* the cone: a square shrinking into a circle, every edge moving in at 45°, so it prints without supports */
    const k1=W/2+wl+.4,k2=k1*Math.SQRT2+.5,hc=k1-wc-rs,shape=(d,t)=>intersect(rrect(-(k1-d-t),-(k1-d-t),k1-d-t,k1-d-t,Math.max(.5,r-d-t)),circle(0,0,k2-d-t,128));
    ft.push(varying(sk,sk+hc,z=>{const d=z-sk;return subtract(shape(d,0),shape(d,wc))},.3));
    /* four short pegs on the cone, just outside the cup rim, keep the upside-down cup in place */
    const rp=Math.min(rc+1.2,k1-3),zb=sk+Math.max(0,k1-(rp+2)-.3);
    for(let k=0;k<4;k++)ft.push(prism(zb,zb+6,rot(rect(rp,-1,rp+2,1),k*Math.PI/2)));
    parts.push(part('incubator-funnel-top.stl',build(ft),'Second file'));
    notes.push(`Stand the body in the tray on a damp paper towel, hang the egg case from the bar (thread through a hole, or a dot of hot glue on its twig), and put the funnel top on. Turn a clear cup (rim up to ${o.cup} mm across) upside down over the opening, inside the four pegs.`);
    notes.push('Newly hatched nymphs climb up towards the light and gather in the cup. Slide a card under it, lift it off and close it. Keep the room bright above and darker below so they head the right way.');
    notes.push(`Vent slots are ${sw} mm. Mantis nymphs are thicker than that, but fruit flies get through, so don't put flies in here.`);
    return {parts,notes,magnets:0,separate:true};
  }

  /* hanger for an egg case: a hook over a wall or mesh edge, and a clip that holds the twig the case is stuck to */
  function oothClip(o){
    const e=o.edge+.5,d=o.dia,w=2.2,parts=[];
    const style=o.style;let line,clipC;
    if(style==='string'){line=[[0,0],[0,10]];clipC=null}
    else line=[[0,0],[0,-10],[0,-14]];
    /* hook over the edge: a U of inside width e, 10 deep */
    const hook=[[e+w,-6],[e+w,8],[e/2+w/2,8+e/2+w/2],[0,8],[0,0]];
    let shape=stroke([hook,line],w);
    if(style==='string')shape=subtract(unite(shape,circle(0,12,3,24)),circle(0,12,1.2,16));
    else{const R=d/2,cy=-14-R-w/2;shape=unite(shape,subtract(circle(0,cy,R+w,48),circle(0,cy,R,48)));
      /* the mouth of the clip: slightly narrower than the twig, so it snaps on */
      shape=subtract(shape,[[[-(R*.75),cy-R*.4],[R*.75,cy-R*.4],[R*1.4,cy-R-w-1],[-(R*1.4),cy-R-w-1]]])}
    const n=Math.max(1,Math.min(12,o.n|0)),m=[];const b=bounds(shape),sx=b.x1-b.x0+4;
    for(let i=0;i<n;i++)m.push(prism(0,6,move(shape,i*sx,0)));
    parts.push(part('ootheca-hangers.stl',build(m)));
    return {parts,notes:[style==='string'?'The hook hangs over a wall or mesh edge; tie the egg case on with thread through the eye.':`The hook hangs over a wall or mesh edge up to ${o.edge} mm thick, and the clip snaps onto a twig ${d} mm thick. Most egg cases come stuck to a piece of twig: clip that, so the case itself is never squeezed.`],magnets:0};
  }

  /* mating divider for a rectangular enclosure: two channels held on the side walls by magnets, and a mesh panel
     that slides down between them. Lift the panel out when it is time. */
  function divider(o,enc){
    const e=enc.e||{};if(e.shape!=='rect')return {parts:[],notes:['The mating divider fits rectangular enclosures. Choose one under Enclosure first.'],magnets:0};
    const span=e.W-e.T,dt=2.4,ds=dt+.7,lip=1.6,dep=5,bt=o.mount==='magnet'?o.mh+.2+1.4:2,Lc=e.H-20,parts=[],notes=[];
    const cw=ds+2*lip,cf=[prism(0,bt,rrect(0,0,Lc,cw,1)),prism(bt,bt+dep,unite(rect(0,0,Lc,lip),rect(0,cw-lip,Lc,cw)))];
    let mags=0;if(o.mount==='magnet'){const R=o.md/2+.2;if(cw<2*R+2){cf[0]=prism(0,bt,rrect(0,-(2*R+3-cw)/2,Lc,cw+(2*R+3-cw)/2,1))}
      for(let x=25;x<Lc-10;x+=Math.max(40,(Lc-50)/3)){cf.push(prism(-1,o.mh+.2,circle(x,cw/2,R,40),'sub'));mags++}}
    parts.push(part('divider-channel-print-2.stl',build(cf)));
    const pw=span-2*bt-1.2,ph=e.H-12,fr=8,hole=e.hole||1.6,bar=e.bar||1.2;
    const pf=[prism(0,dt,rrect(0,0,pw,ph,2))],hs=[];
    if(o.style!=='solid'){for(let x=fr;x+hole<=pw-fr;x+=hole+bar)for(let y=fr;y+hole<=ph-fr;y+=hole+bar)hs.push(...rect(x,y,x+hole,y+hole));if(hs.length)pf.push(prism(-1,dt+1,hs,'sub'))}
    pf.push(prism(-1,dt+1,unite(circle(pw/2-12,ph-6,3,24),circle(pw/2+12,ph-6,3,24)),'sub'));
    parts.push(part('divider-panel.stl',build(pf),'Second file'));
    notes.push(`Print 2 channels. Stick one inside each side wall, upright and opposite each other, ${o.mount==='magnet'?`held by ${mags} magnets each with matching magnets outside the wall`:'with glue or strong tape'}. The panel (${pw.toFixed(0)} × ${ph.toFixed(0)} mm) slides down between them from above with the lid off; the two holes at the top are finger holes.`);
    notes.push(o.style==='solid'?'A solid panel keeps the two from seeing each other.':'A mesh panel lets the two see and smell each other first. Feed the female well before you lift it out.');
    return {parts,notes,magnets:mags*2,separate:true};
  }

  /* nymph cup rack: a board with a recess for each deli cup and its number engraved in front, plus number tags */
  function cupRack(o){
    const D=o.cupD+1.2,R=D/2,c=Math.max(1,o.cols|0),r=Math.max(1,o.rows|0),g=8,strip=11,cell=D+g,W=c*cell+g,L=r*(cell+strip)+g;
    const parts=[],notes=[],bt=6,f=[prism(0,bt,rrect(0,0,W,L,6))],txt=[];let n=1;
    for(let j=r-1;j>=0;j--)for(let i=0;i<c;i++){const cx=g+R+i*cell,cy=g+strip+R+j*(cell+strip);f.push(prism(bt-3,bt+1,circle(cx,cy,R,72),'sub'));
      const T=HM.text2D([String(n)],6,1.1);txt.push(...move(T.rings,cx,cy-R-strip/2-1));n++}
    if(txt.length)f.push(prism(bt-.8,bt+1,txt,'sub'));
    if(W>340||L>340)notes.push('This rack is bigger than your print bed. Use fewer columns or rows.');
    parts.push(part('nymph-cup-rack.stl',build(f)));
    if(o.tags==='yes'){const tf=[];n=1;const tw=26,th=14;
      for(let k=0;k<c*r;k++){const x=(k%6)*(tw+4),y=Math.floor(k/6)*(th+4);let t=subtract(rrect(x,y,x+tw,y+th,4),circle(x+5,y+th/2,1.8,20));tf.push(prism(0,1.6,t));
        const T=HM.text2D([String(k+1)],7,1.2);tf.push(prism(1.6,2.4,move(T.rings,x+16,y+th/2)))}
      parts.push(part('nymph-cup-tags.stl',build(tf),'Second file'));notes.push('The tags hang on the cups with a small rubber band or thread through the hole, so the number stays with the cup when you take it off the rack.')}
    notes.push(`Each recess takes a cup with a bottom up to ${o.cupD} mm across. Raise one nymph per cup from about the third moult, so they don't eat each other.`);
    return {parts,notes,magnets:0,separate:true};
  }

  /* ================= feeding through the hatch ================= */
  function hatchBase(o,enc){
    const e=enc.e||{},style=e.hatch&&e.hatch!=='none'?e.hatch:'plug',R=enc.hatchR||Math.min(30,(o.hatchD||60)/2),sr=Math.min(12,R-4.5);
    const p={hatch:style,dMagD:e.dMagD||10,dMagH:e.dMagH||3,hole:e.hole||1.6,bar:e.bar||1.2};
    return {m:HE.hatchCover({R},p,false,{hole:sr}),R,sr,style,notes:enc.hatchR?[]:['Your enclosure has no feeding hatch yet, so this is sized for the hatch opening you entered here. Turn a hatch on under Enclosure, Lid and lights.']};
  }
  /* the part that sits in the base: a spigot through it, a neck with a sliding shutter, and on top either a funnel
     (drop chute) or a closed chamber with a cap (airlock) */
  function chuteTop(o,sr,kind){
    const bore=sr-1.6,so=sr-.25,rn=sr+5,f=[],sl=6,fl=rn-so,neck=10,s0=sl+fl+2,zt=sl+fl+neck;
    f.push(prism(0,sl,ring(bore,so)));
    /* the flange widens at 45° from the spigot to the neck, so nothing hangs out */
    f.push(varying(sl,sl+fl,z=>circle(0,0,so+(z-sl),96),.25),prism(sl+fl,zt,circle(0,0,rn,96)),prism(-1,zt+1,circle(0,0,bore,64),'sub'));
    /* shutter slot, open on one side */
    f.push(prism(s0,s0+2.6,unite(rect(-rn-1,-bore-1,bore+1.5,bore+1),[]),'sub'));
    let top;
    if(kind==='chute'){const rt=Math.max(rn+4,o.top/2),hc=rt-bore;f.push(shell(zt,zt+hc,z=>bore+1.8+(z-zt),1.8));f.push(prism(zt+hc,zt+hc+3,ring(bore+hc,bore+hc+1.8)));top=zt+hc+3}
    else{const rc=Math.max(rn,o.cham/2),hw=rc-rn;f.push(shell(zt,zt+hw+1,z=>Math.min(rc,rn+(z-zt)),1.8));f.push(prism(zt+hw+1,zt+hw+1+o.chamH,ring(rc-1.8,rc)));top=zt+hw+1+o.chamH;
      f.push(prism(zt-.6,zt,ring(bore,rn)))}
    const shutter=build([prism(0,2,unite(rrect(-rn-14,-bore-.5,bore+1,bore+.5,1),[]))]);
    return {m:build(f),shutter,rn,bore,top};
  }
  function chute(o,enc){
    const b=hatchBase(o,enc),t=chuteTop(o,b.sr,'chute'),parts=[part('chute-base.stl',b.m),part('chute-funnel.stl',t.m,'Second file'),part('chute-shutter.stl',t.shutter,'Second file')];
    return {parts,notes:[...b.notes,`The base fits your ${b.style==='twist'?'twist-lock':b.style==='magnet'?'magnet':'push-in'} hatch in place of the normal cover; the funnel pushes into it. Close the shutter, tip crickets, roaches or flies into the funnel, then pull the shutter out so they drop in. Push it back in to close.`,'Make the funnel opening wider for bigger feeders.'],magnets:b.style==='magnet'?2:0,separate:true};
  }
  function airlock(o,enc){
    const b=hatchBase(o,enc),t=chuteTop(o,b.sr,'airlock'),rc=Math.max(t.rn,o.cham/2);
    const cap=build([prism(0,2.4,unite(circle(0,0,rc+2,96),rrect(rc-1,-5,rc+10,5,3))),prism(2.4,8,ring(rc-1.8-.25-1.8,rc-1.8-.25))]);
    const parts=[part('airlock-base.stl',b.m),part('airlock-chamber.stl',t.m,'Second file'),part('airlock-shutter.stl',t.shutter,'Second file'),part('airlock-cap.stl',cap,'Second file')];
    return {parts,notes:[...b.notes,'An airlock for flying feeders: with the shutter closed, put the flies (or a fly cup) into the chamber and close the cap. Then pull the shutter out; the flies spread into the enclosure, and none get out because the cap stays shut. Close the shutter before you open the cap again.','A drop of honey water on a cotton bud in the chamber keeps flies alive while they wait.'],magnets:b.style==='magnet'?2:0,separate:true};
  }

  /* ================= shipping ================= */
  function shipInsert(o){
    const L=o.L-1,W=o.W-1,n=Math.max(1,Math.min(6,o.n|0)),hp=Math.max(10,o.cupH*.5),rh=(o.cupB+(o.cupT-o.cupB)*hp/o.cupH)/2+.6,f=[],notes=[];
    const cols=Math.min(n,Math.max(1,Math.floor((L-6)/(2*rh+6)))),rows=Math.ceil(n/cols),cx0=L/2-(cols-1)*(2*rh+6)/2,cy0=W/2-(rows-1)*(2*rh+6)/2,cs=[];
    for(let k=0;k<n;k++)cs.push([cx0+(k%cols)*(2*rh+6),cy0+Math.floor(k/cols)*(2*rh+6)]);
    if(rows*(2*rh+6)>W)notes.push('These cups don\'t fit the box side by side. Use a bigger box or fewer cups.');
    const plate=subtract(rrect(0,0,L,W,4),unite(circle(0,W/2,6,24),circle(L,W/2,6,24)));
    f.push(prism(0,2.4,plate));
    for(const [x,y] of cs)f.push(prism(-1,hp+1,circle(x,y,rh,96),'sub'));
    /* ribs underneath (printed on top), with gaps for air */
    const ribs=[...subtract(rrect(0,0,L,W,4),offset(rrect(0,0,L,W,4),-1.6))];
    for(const [x,y] of cs)ribs.push(...subtract(circle(x,y,rh+1.6,96),circle(x,y,rh,96)));
    let rb=unite(ribs);for(let x=10;x<L-10;x+=22)rb=subtract(rb,rect(x,-1,x+6,W+1));
    f.push(prism(2.4,hp,rb));
    /* the name, engraved on the face that is printed on the bed: mirrored, so it reads right way up in the box */
    if(o.text){const T=HM.text2D([o.text],7,1.1,o.font==='caps'?null:'script');const tx=T.rings.map(q=>q.map(([x,y])=>[L/2-x,y+W-6-T.h/2]));if(T.w<L-12)f.push(prism(-1,.6,tx,'sub'))}
    const m=build(f),parts=[part('shipping-insert.stl',m)];
    notes.push(`Holds ${n} cup${n>1?'s':''} upright at mid height, ${hp.toFixed(0)} mm off the box floor. Turn it over after printing; the two finger notches lift it out.`);
    if(o.both==='yes'){parts[0].file='shipping-insert-print-2.stl';notes.push('Print 2: one goes in upside down on top of the cups, so they can\'t move up or down.')}
    notes.push('Ship in mild weather, with a heat or cold pack when needed, and pad the cup with paper towel so the mantis can grip.');
    return {parts,notes,magnets:0};
  }

  /* ================= turntable ================= */
  /* an involute gear outline (20° pressure angle) */
  function gear(z,m){
    const pa=20*Math.PI/180,r=m*z/2,rb=r*Math.cos(pa),ra=r+m,rf=r-1.25*m,inv=a=>Math.tan(a)-a,tp=Math.PI/(2*z)+inv(pa);
    const th=rho=>tp-inv(Math.acos(Math.min(1,rb/rho))),q=[];
    for(let k=0;k<z;k++){const c=k*TAU/z,r0=Math.max(rb,rf);
      q.push([rf*Math.cos(c-th(r0)),rf*Math.sin(c-th(r0))]);
      for(let i=0;i<=6;i++){const rho=r0+(ra-r0)*i/6;q.push([rho*Math.cos(c-th(rho)),rho*Math.sin(c-th(rho))])}
      for(let i=6;i>=0;i--){const rho=r0+(ra-r0)*i/6;q.push([rho*Math.cos(c+th(rho)),rho*Math.sin(c+th(rho))])}
      q.push([rf*Math.cos(c+th(r0)),rf*Math.sin(c+th(r0))])}
    return [q];
  }
  function turntable(o){
    const D=o.D,Rt=D/2-14,mot=o.drive==='motor',wall=3,notes=[],parts=[];
    const BB=6,gr=BB/2+.2,gd=BB/2-.6,gap=1.2;
    /* heights: with a motor, the base must house it standing up under the gear */
    const mLen=o.mLen,mod=1.25,zp=12,rp=mod*zp/2,zg=Math.max(18,Math.round((Rt-26)*2/mod)),Rg=mod*zg/2,ringL=7.5;
    const hb=mot?3+mLen+1+6+1-gap:14;
    const groove=zTop=>varying(zTop-gd,zTop+1,z=>{const d=zTop-z;const hw=Math.sqrt(Math.max(0,gr*gr-(d+(gr-gd))**2));return hw<.1?[]:ring(Rt-hw,Rt+hw,180)},.2,'sub');
    /* base */
    const Rb=Rt+8,bf=[prism(0,3,circle(0,0,Rb,180)),prism(0,hb,ring(Rt-6,Rb,180))];
    const hubR=15;bf.push(prism(0,hb-1,circle(0,0,hubR,64)),prism(hb-1-7.2,hb,circle(0,0,11.1,64),'sub'),prism(-1,hb,circle(0,0,5,32),'sub'));
    const spokeH=mot?hb-8:hb-2;for(let k=0;k<6;k++)bf.push(prism(0,spokeH,rot(rect(hubR-1,-1.6,Rt-5,1.6),k*TAU/6)));
    bf.push(groove(hb));
    /* rubber feet recesses */
    let pin=null;
    if(mot){/* N20 gear motor standing in a pocket, shaft up, beside the gear ring */
      const cx=Rg+rp+.15,mw=12.3,mt=10.3;
      bf.push(prism(0,3+mLen,rrect(cx-mw/2-2.4,-mt/2-2.4,cx+mw/2+2.4,mt/2+2.4,2)),prism(3,3+mLen+1,rect(cx-mw/2,-mt/2,cx+mw/2,mt/2),'sub'));
      bf.push(prism(3,9,unite(rect(cx,-2.5,Rb+1,2.5),[]),'sub'));
      const dsh=intersect(circle(0,0,1.6,24),rect(-2,-2,1.05,2));pin=build([prism(0,6,subtract(gear(zp,mod),dsh)),prism(6,8,subtract(circle(0,0,4,32),dsh))]);
    }
    parts.push(part('turntable-base.stl',build(bf)));
    /* platter: printed top face down; groove, axle peg and (with a motor) the gear ring rise from its underside */
    const pt=4,pf=[prism(0,pt,circle(0,0,D/2,180))];
    /* platter groove, mirrored: it opens upward in print, downward in use */
    pf.push(varying(pt-gd,pt+1,z=>{const d=pt-z,hw=Math.sqrt(Math.max(0,gr*gr-(d+(gr-gd))**2));return hw<.1?[]:ring(Rt-hw,Rt+hw,180)},.2,'sub'));
    pf.push(prism(pt,pt+gap+1-.2,circle(0,0,6,48)),prism(pt,pt+gap+1+7,circle(0,0,3.95,40)));
    if(mot){pf.push(prism(pt,pt+ringL,subtract(gear(zg,mod),circle(0,0,Rg-mod*1.25-4,180))))}
    parts.push(part('turntable-platter.stl',build(pf),'Second file'));
    if(pin)parts.push(part('turntable-pinion.stl',pin,'Second file'));
    const nb=Math.floor(TAU*Rt/(BB+.6));
    notes.push(`You need one 608 skateboard bearing (22 × 8 × 7 mm), ${Math.round(nb*.6)} to ${nb} round 6 mm airsoft BBs for the track, and 4 small stick-on rubber feet.`);
    notes.push('Press the bearing into the hub, lay the BBs in the base groove, and set the platter on so its peg drops into the bearing.');
    if(mot)notes.push(`For the slow motor drive: an N20 gear motor, 5–6 V, about 10 rpm, with a 3 mm D shaft and ${o.mLen} mm long (motor plus gearbox), and a USB cable with bare wires to power it from a phone charger. The ${zg}:${zp} gears turn the platter about once every ${(zg/zp/10).toFixed(1)} minutes at 10 rpm. Push the pinion onto the shaft, stand the motor in its pocket with the wires out through the slot, and check the gears mesh before you glue anything.`);
    if(D>340)notes.push('The platter is bigger than your print bed.');
    return {parts,notes,magnets:0,separate:true};
  }

  /* ================= diorama pieces ================= */
  function engr(rings,z,d){return prism(z-d,z+1,rings,'sub')}
  function dioColumn(o,r){
    const D=o.size,H=o.h,R=D/2,f=[],fl=16,pl=D+8;
    f.push(prism(0,4,rrect(-pl/2,-pl/2,pl/2,pl/2,1)));
    f.push(shell(4,7,z=>R+2.5-(z-4)*.6,0));
    const flute=R0=>polar(0,0,a=>R0*(1-.07*Math.pow(Math.max(0,Math.cos(fl*a/2)),2)),192);
    const hb=o.style==='broken'?H*(.6+r()*.15):H-7,ang=r()*TAU,cut=wobble(Math.round(r()*99)+1,.25,4);
    f.push(varying(7,hb,z=>flute(R*(1-.08*(z-7)/H)),.5));
    if(o.style==='broken'){const top=H;f.push(varying(hb,top,z=>{const t=(z-hb)/(top-hb),k=R*(1.1-2.2*t),q=[[-3*R,-R-2]];
      for(let y=-R-2;y<=R+2;y+=.5)q.push([k+R*.35*cut(y/R*2.5),y]);q.push([-3*R,R+2]);
      return intersect(flute(R*(1-.08*(z-7)/H)),rot([q],ang))},.3))}
    else{const fl=R*.08+3;f.push(varying(hb,hb+fl,z=>circle(0,0,R*.92+(z-hb),96),.3));f.push(prism(hb+fl,Math.max(H,hb+fl+2),circle(0,0,R+3.2,96)))}
    return [part(`column-${o.style}.stl`,build(f))];
  }
  function dioAmphora(o){
    const H=o.h,R=o.size/2,wl=1.6,prof=t=>R*(t<.08?.38:t<.45?.38+.62*Math.sin(Math.PI/2*(t-.08)/.37):t<.78?1-.62*Math.pow((t-.45)/.33,1.2):t<.92?.38:.38+.25*(t-.92)/.08);
    const f=[shell(0,H,z=>prof(z/H),null)],cav=shell(2.4,H+.01,z=>Math.max(.5,prof(z/H)-wl),null,.3);cav.op='sub';f.push(cav);
    /* two handles, from the neck down to the shoulder */
    for(const s of [-1,1]){const sil=stroke([[[s*R*.3,H*.88],[s*R*.95,H*.86],[s*R*1.05,H*.7],[s*R*.75,H*.58]]],2.4);
      f.push(HM.upright(sil,2.4,0,0,bounds(sil).y0))}
    return [part('amphora.stl',build(f.filter(Boolean)))];
  }
  function dioArch(o,r){
    const W=o.size*2,H=o.h,pw=Math.max(14,W*.22),ri=W/2-pw,th=10,ro=W/2,sp=H-ro;
    let a=unite(rect(-W/2,0,-W/2+pw,sp),rect(W/2-pw,0,W/2,sp));
    a=unite(a,intersect(subtract(circle(0,sp,ro,96),circle(0,sp,ri,96)),rect(-ro-1,sp,ro+1,sp+ro+1)));
    if(o.style==='broken'){const k=r()*.5+.2;a=subtract(a,[[[ro*k-2,H+2],[ro+2,H+2],[ro+2,sp+ro*.3],[ro*k+ro*.4,sp+ro*.55]]])}
    const joints=[];for(let i=1;i<9;i++){const t=Math.PI*i/9;joints.push([[ri*Math.cos(t),sp+ri*Math.sin(t)],[ro*Math.cos(t),sp+ro*Math.sin(t)]])}
    for(let y=8;y<sp;y+=9){joints.push([[-W/2,y],[-W/2+pw,y]],[[W/2-pw,y],[W/2,y]])}
    return {outline:a,detail:intersect(stroke(joints,.7),offset(a,-.8)),th,mag:{xs:[-(W/2-pw/2),W/2-pw/2],my:sp*.45}};
  }
  function dioMosaic(o){
    const W=o.size*2,t=3,f=[prism(0,2,rect(-W/2,-W/2,W/2,W/2))],c1=[],c2=[],ts=3,gp=.7;
    const pat=o.pattern||'rosette';
    for(let x=-W/2+gp;x+ts<=W/2-gp+.01;x+=ts+gp)for(let y=-W/2+gp;y+ts<=W/2-gp+.01;y+=ts+gp){
      const cx=x+ts/2,cy=y+ts/2,i=Math.round((cx+W/2)/(ts+gp)),j=Math.round((cy+W/2)/(ts+gp)),N=Math.round(W/(ts+gp)),edge=Math.min(i,j,N-1-i,N-1-j);let on;
      if(pat==='rosette'){const rr=Math.hypot(cx,cy),a=Math.atan2(cy,cx);on=edge<2||(rr<W*.38&&Math.cos(8*a)>.3&&rr>W*.08)||rr<W*.07}
      else if(pat==='meander'){const k=((i%8)+8)%8,l=((j%8)+8)%8;on=edge===1&&!(k===3||k===4)||edge===0||(edge>3&&(i+j)%2===0)}
      else if(pat==='waves'){on=edge<1||(Math.sin(i*.8)*2.5+N/2>j&&Math.sin(i*.8)*2.5+N/2-2<j)}
      else on=(i+j)%2===0;
      (on?c2:c1).push(...rect(x,y,x+ts,y+ts))}
    f.push(prism(2,t,c1));
    return [part(`mosaic-${pat}.stl`,build(f),'Colour 1'),part(`mosaic-${pat}-accent.stl`,build([prism(2,t,c2)]),'Colour 2')];
  }
  function dioPagoda(o){
    const n=Math.max(2,Math.min(5,o.tiers|0)),B=o.size,f=[],sq=r=>rrect(-r,-r,r,r,Math.min(1.5,r/4));
    let z=0,s=B/2;f.push(prism(0,3,sq(s+3)));z=3;
    for(let i=0;i<n;i++){const hw=B*.42*(1-i*.12),wh=Math.max(6,o.h/(n+1)),ev=hw+4;
      f.push(prism(z,z+wh,sq(hw)));z+=wh;
      /* the eaves widen at 45° and then the roof slopes back in */
      const ze=z;f.push(varying(ze,ze+(ev-hw),zz=>sq(hw+(zz-ze)),.3));z+=ev-hw;
      const next=i<n-1?B*.42*(1-(i+1)*.12):1.5,rh=(ev-next)*.55,zr=z;f.push(varying(zr,zr+rh,zz=>sq(Math.max(next,ev-(zz-zr)/.55)),.3));z+=rh}
    f.push(prism(z,z+8,circle(0,0,1.2,16)),prism(z+2,z+3,circle(0,0,2,16)));
    return [part('pagoda.stl',build(f))];
  }
  function dioTorii(o){
    const W=o.size*2,H=o.h,pw=W*.09,y1=H*.82,f=[];
    let a=unite(rect(-W*.33-pw/2,0,-W*.33+pw/2,y1),rect(W*.33-pw/2,0,W*.33+pw/2,y1));
    a=unite(a,rect(-W*.42,H*.62,W*.42,H*.62+pw*.8));
    const top=[];for(let i=0;i<=40;i++){const t=i/40*2-1;top.push([t*W/2,y1+pw*.6+Math.pow(Math.abs(t),3)*pw*1.2])}
    a=unite(a,stroke([top],pw*1.1));a=unite(a,rect(-W*.47,y1-pw*.2,W*.47,y1+pw*.4));
    a=unite(a,unite(rect(-W*.33-pw,0,-W*.33+pw,3),rect(W*.33-pw,0,W*.33+pw,3)));
    return {outline:a,detail:[],th:6};
  }
  function dioBooks(o,r){
    const n=Math.max(2,Math.min(7,o.n|0)),f=[];let prev=null,z=0;
    for(let i=0;i<n;i++){const L=o.size*(1.1-r()*.25),W=L*(.62+r()*.12),t=2.5+r()*2.5;let b=rot(rrect(-L/2,-W/2,L/2,W/2,.5),(r()-.5)*.6);
      b=move(b,(r()-.5)*3,(r()-.5)*3);if(prev)b=intersect(b,prev);if(!b.length)break;
      /* page block: a recessed band on three sides, the spine stays full */
      f.push(prism(z,z+t,b));
      prev=b;z+=t}
    return [part('book-stack.stl',build(f))];
  }
  function dioShelf(o,r){
    const W=o.size*2,H=o.h,fr=3,sh=3,rows=2,rh=(H-2*fr-(rows-1)*sh)/rows,outline=rrect(-W/2,0,W/2,H,2),books=[];
    for(let k=0;k<rows;k++){const y0=fr+k*(rh+sh);let x=-W/2+fr+.6;
      while(x<W/2-fr-3){const bw=2+r()*3,bh=rh*(.65+r()*.33);if(x+bw>W/2-fr-.6)break;
        if(r()<.12&&x+bh*.6<W/2-fr){const lean=rot(rect(0,0,bw,bh),-.5,0,0);books.push(...move(lean,x+bw,y0));x+=bh*.55+bw;continue}
        books.push(...rect(x,y0,x+bw,y0+bh));x+=bw+.4}}
    return {outline,recess:subtract(offset(outline,-fr),unite([].concat(...Array.from({length:rows-1},(_,k)=>rect(-W/2,fr+(k+1)*rh+k*sh,W/2,fr+(k+1)*(rh+sh)))),[])),books:intersect(unite(books,[]),offset(outline,-fr-.3)),th:12};
  }
  function dioCottage(o,r){
    const W=o.size*2,H=o.h,wh=H*.55,rf=H-wh;
    let a=unite(rect(-W*.4,0,W*.4,wh),[[[-W/2,wh-1],[W/2,wh-1],[0,H]]]);a=unite(a,rect(W*.2,H*.65,W*.3,H*.92));
    const door=unite(rect(-W*.12,0,W*.12,wh*.45),circle(0,wh*.45,W*.12,48)),win=circle(W*.22,wh*.6,W*.09,40),win2=circle(0,wh+rf*.38,W*.07,32);
    const shingles=[];let row=0;for(let y=wh+1.5;y<H-2;y+=2.6,row++){const q=[];for(let x=-W/2;x<W/2;x+=3)q.push(...ellipse(x+(row%2)*1.5,y,1.6,1.4,12));shingles.push(...q)}
    const roof=intersect([[[-W/2+1,wh],[W/2-1,wh],[0,H-1.5]]],offset([[[-W/2,wh-1],[W/2,wh-1],[0,H]]],-1));
    const beams=intersect(stroke([[[-W*.4,wh*.75],[W*.4,wh*.75]],[[-W*.4+1.5,0],[-W*.4+1.5,wh]],[[W*.4-1.5,0],[W*.4-1.5,wh]],[[-W*.3,wh*.75],[-W*.18,wh]],[[W*.36,wh*.75],[W*.08,wh]]],1.6),subtract(rect(-W*.4,0,W*.4,wh),offset(unite(door,win),1.2)));
    return {outline:a,panes:unite(unite(door,win),win2),relief:unite(intersect(unite(shingles,[]),roof),beams),th:8};
  }
  function dioMushroom(o,r){
    const n=Math.max(1,Math.min(4,o.n|0)),f=[],acc=[],pad=[];
    const ms=[];for(let i=0;i<n;i++){const s=i?o.size*(.45+r()*.35):o.size;let best=null;
      /* keep the caps apart, so each mushroom stands on its own */
      for(let t=0;t<40&&!best;t++){const a=r()*TAU,d=i?(o.size/2+s/2+1.5)*(1+r()*.15):0,x=d*Math.cos(a),y=d*Math.sin(a);if(ms.every(m=>Math.hypot(m.x-x,m.y-y)>m.s/2+s/2+1.5))best={x,y,s}}
      if(best)ms.push(best)}
    for(const m of ms)pad.push(...circle(m.x,m.y,m.s*.42+3,48));
    if(o.mount==='peg'){f.push(prism(0,PEG.depth+1.5,unite(pad,circle(0,0,PEG.hub,40))),prism(-1,PEG.depth,circle(0,0,PEG.sock,32),'sub'))}
    else f.push(prism(0,2.4,unite(pad,[])));
    for(const m of ms){const rs=m.s*.18,hs=m.s*.9*(.8+r()*.4),rc=m.s/2,cap=rc*.75,z0=2.4;
      f.push(prism(z0,z0+hs*.3,circle(m.x,m.y,rs*1.15,32)),prism(z0+hs*.3,z0+hs,circle(m.x,m.y,rs,32)));
      const zc=z0+hs,flare=rc-rs;
      f.push(varying(zc,zc+flare,z=>circle(m.x,m.y,rs+(z-zc),64),.3));
      const zt=zc+flare,dome=z=>Math.max(1.5,rc*Math.sqrt(Math.max(0,1-Math.pow((z-zt)/cap,2))));
      f.push(varying(zt,zt+cap*.95,z=>circle(m.x,m.y,dome(z),64),.3));
      /* spots on the cap: through the dome, standing proud of it by half a millimetre */
      const k=Math.max(3,Math.round(rc/2.2));for(let i=0;i<k;i++){const a=r()*TAU,d=rc*(.25+r()*.5),sx=m.x+d*Math.cos(a),sy=m.y+d*Math.sin(a),sr=.8+r()*rc*.06;
        const zs=zt+cap*Math.sqrt(Math.max(0,1-Math.pow(d/rc,2))),g=v=>zt+Math.round((v-zt)/.3)*.3;acc.push({x:sx,y:sy,r:sr,z0:g(zs-1.6),z1:g(zs+.5)})}}
    const spots=acc.map(s=>prism(s.z0,s.z1,circle(s.x,s.y,s.r,20)));
    if(o.accent==='yes'){for(const s of acc)f.push(prism(s.z0,s.z1+.9,circle(s.x,s.y,s.r+.05,20),'sub'));return [part('mushrooms.stl',build(f),'Colour 1'),part('mushrooms-spots.stl',build(spots),'Colour 2')]}
    return [part('mushrooms.stl',build([...f,...spots]))];
  }
  /* flat pieces printed on their back, standing up or hanging on a wall */
  function flatPiece(o,name,pc){
    const parts=[],notes=[];let magnets=0;
    const mt=o.mount==='free'?{f:[],bt:0,dy:0,magnets:0,notes:[]}:HM.backMount(o,pc.outline,{min:2,xs:pc.mag&&pc.mag.xs,my:pc.mag&&pc.mag.my});
    const dy=mt.dy,bt=mt.bt,f=[...mt.f];magnets=mt.magnets;notes.push(...mt.notes);
    const sh=r=>move(r,0,dy),th=pc.th;
    f.push(prism(bt,bt+th,sh(pc.outline)));
    if(pc.detail&&pc.detail.length)f.push(engr(sh(pc.detail),bt+th,.6));
    if(pc.recess)f.push(prism(bt+3,bt+th+1,sh(pc.books?subtract(pc.recess,pc.books):pc.recess),'sub'));
    if(pc.books&&pc.books.length)f.push(prism(bt+th-1,bt+th+1,sh(pc.books),'sub'));
    if(pc.relief&&pc.relief.length)f.push(prism(bt+th,bt+th+.8,sh(pc.relief)));
    if(pc.panes){f.push(prism(bt+th-1.4,bt+th+1,sh(pc.panes),'sub'));
      const pane=prism(bt+th-1.4,bt+th,sh(pc.panes));
      if(o.accent==='yes')parts.push(part(`${name}-windows.stl`,build([pane]),'Colour 2'));else f.push(pane)}
    parts.unshift(part(`${name}.stl`,build(f),parts.length?'Colour 1':'Main colour'));
    if(o.mount==='free')notes.push('Prints lying flat; stand it up in the substrate, or glue it to a wall.');
    return {parts,notes,magnets};
  }
  const DIORAMA={column:'Roman column',amphora:'Amphora',arch:'Ruined arch',mosaic:'Mosaic floor tile',pagoda:'Pagoda',torii:'Torii gate',books:'Stack of books',shelf:'Bookshelf',cottage:'Fairy cottage',mushroom:'Mushroom cluster'};
  function diorama(o){
    const r=rnd(o.seed||1),k=o.kind,notes=[];let res;
    if(k==='column')res={parts:dioColumn(o,r),notes:[],magnets:0};
    else if(k==='amphora')res={parts:dioAmphora(o),notes:['Hollow, so it can hold a little moss or a succulent cutting.'],magnets:0};
    else if(k==='mosaic')res={parts:dioMosaic(o),notes:['Two colours: add the accent file to the tile as a part in Creality Print. Terracotta and cream, or black and white, look classic.'],magnets:0};
    else if(k==='pagoda')res={parts:dioPagoda(o),notes:[],magnets:0};
    else if(k==='books')res={parts:dioBooks(o,r),notes:[],magnets:0};
    else if(k==='mushroom')res={parts:dioMushroom(o,r),notes:[],magnets:0};
    else{const pc=k==='arch'?dioArch(o,r):k==='torii'?dioTorii(o):k==='shelf'?dioShelf(o,r):dioCottage(o,r);res=flatPiece(o,k,pc)}
    if(o.accent==='yes'&&(k==='mushroom'||k==='cottage'))res.notes.push('The accent file is for glow-in-the-dark or UV-reactive filament: glowing spots, or windows lit up at night.');
    return res;
  }

  root.HabitatKeep={incubator,oothClip,divider,cupRack,chute,airlock,shipInsert,turntable,gear,diorama,DIORAMA};
})(typeof window!=='undefined'?window:globalThis);
