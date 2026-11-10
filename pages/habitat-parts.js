/* Habitat parts: accessory and round-enclosure designs, built with lib/geo.js.
   Every builder works in the part's print orientation (Z up from the bed) and returns closed meshes. */
(function(root){
  const G=root.Geo;
  const {prism,varying,rect,rrect,circle,ellipse,ngon,polar,wobble,offset,intersect,subtract,unite,yDisc,build}=G;

  /* ---- the clip rail on printed mesh panels, seen from the side ----
     The panel's inner face is y=0. A U-shaped channel opens upwards: a 2.6 mm slot in front of the panel,
     closed by a 2 mm lip. An accessory's back plate drops into the slot, and a small bump clicks past the lip.
     In accessory coordinates the body's back is y=0, which sits 4.9 mm out from the panel. */
  const RAIL={pitch:40,slot:2.6,lip:2,floor:1.6,lipH:7.6,tongue:2.2,front:4.9};
  const CLIP={y0:-(RAIL.front-.2),y1:-(RAIL.front-.2-RAIL.tongue),clearZ:RAIL.lipH-RAIL.floor+.4};

  /* ---- plan shapes for bodies: x centred on 0, the back at y=0 ---- */
  function body2D(kind,L,W,seed){
    let r;
    if(kind==='round')r=circle(0,L/2,L/2);
    else if(kind==='oval')r=ellipse(0,W/2,L/2,W/2);
    else if(kind==='hex'){r=ngon(0,0,L/2,6,0).map(q=>q.map(([x,y])=>[x,y*W/L+W/2]))}
    else if(kind==='square')r=rrect(-L/2,0,L/2,W,Math.min(L,W)*.18);
    else if(kind==='pebble'){const w=wobble(seed||1,.14,5);r=polar(0,W/2,a=>{const c=Math.cos(a),s=Math.sin(a),e=1/Math.sqrt(c*c/(L*L/4)+s*s/(W*W/4));return e*(1+w(a))})}
    else if(kind==='leaf'){const o=[],n=60;for(let i=0;i<=n;i++){const t=i/n,hw=(W/2)*Math.pow(Math.sin(Math.PI*t),.85);o.push([-L/2+L*t,hw])}for(let i=n-1;i>0;i--){const t=i/n,hw=(W/2)*Math.pow(Math.sin(Math.PI*t),.85)*.92;o.push([-L/2+L*t,-hw])}r=[o.map(([x,y])=>[x,y+W/2])]}
    else r=rrect(-L/2,0,L/2,W,3);
    return fit(r);
  }
  /* shift so the back touches y=0 */
  function fit(r){let mn=1e9;for(const q of r)for(const p of q)mn=Math.min(mn,p[1]);return r.map(q=>q.map(([x,y])=>[x,y-mn]))}
  function bounds(r){let x0=1e9,x1=-1e9,y0=1e9,y1=-1e9;for(const q of r)for(const [x,y] of q){x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y)}return {x0,x1,y0,y1,cx:(x0+x1)/2,cy:(y0+y1)/2}}
  const scaleAbout=(r,s,cx,cy)=>r.map(q=>q.map(([x,y])=>[cx+(x-cx)*s,cy+(y-cy)*s]));

  /* ---- mounts behind an upright body (the body's back is y=0) ---- */
  function magnetBack(f,{w,h,md,mh}){
    const R=md/2+.2,pd=mh+.2,bt=pd+1.4,ph=Math.max(h,2*R+6),zc=ph/2;
    f.push(prism(0,ph,rrect(-w/2,-bt,w/2,.6,1)));
    const xs=w>=4*R+12?[-w/4,w/4]:[0];
    for(const x of xs)f.push(yDisc(x,zc,R,-bt-1,-bt+pd,'sub'));
    return xs.length;
  }
  function clipBack(f,{w,h}){
    const ph=Math.max(h,CLIP.clearZ+6),wc=Math.max(16,w);
    f.push(prism(0,ph,rect(-wc/2,CLIP.y0,wc/2,CLIP.y1)));                 /* back plate: its lower part is the tongue */
    f.push(prism(CLIP.clearZ,ph,rect(-wc/2,CLIP.y1-.01,wc/2,.6)));         /* bridge over the lip, joining the body */
    f.push(prism(1,2,rect(-wc/2+2,CLIP.y1-.01,wc/2-2,CLIP.y1+.35)));       /* click bump */
    return ph;
  }
  /* the floor peg socket: a hole from underneath, inside a solid hub */
  const PEG={r:4,h:5,sock:4.2,depth:5.6,hub:7.5};

  /* ---------------- pearl dish ---------------- */
  function dish(o){
    const out=body2D(o.shape,o.L,o.W,o.seed),fl=2,top=fl+o.depth,sw=3,sh=3,f=[],notes=[],b=bounds(out);
    f.push(prism(0,top,out));
    const hub=o.mount==='peg'?circle(b.cx,b.cy,PEG.hub):null;
    for(let k=0;k*sh<o.depth;k++){
      let c=offset(out,-(o.wall+k*sw));if(!c.length)break;
      if(hub)c=subtract(c,hub);
      f.push(prism(Math.max(fl,top-(k+1)*sh),top+1,c,'sub'));
    }
    let magnets=0;
    if(hub){f.push(prism(0,Math.min(top,PEG.depth+1.5),hub));f.push(prism(-1,PEG.depth,circle(b.cx,b.cy,PEG.sock),'sub'));if(top<PEG.depth+1.5)notes.push('Make the dish deeper so the floor socket fits.')}
    addMount(f,o,b,top,out);
    if(o.mount==='magnet')magnets=magnetBack(f,{w:Math.min(b.x1-b.x0,60),h:top,md:o.md,mh:o.mh});
    return {parts:[{file:'pearl-dish.stl',role:'Main colour',m:build(f)}],notes,magnets};
  }
  /* connector between a rounded body and its back plate, so the curve meets the plate along a band */
  function addMount(f,o,b,h,out){
    if(o.mount!=='magnet'&&o.mount!=='clip')return;
    const w=Math.min(b.x1-b.x0,o.mount==='clip'?Math.max(20,(b.x1-b.x0)*.7):60)*.9;
    f.push(prism(o.mount==='clip'?CLIP.clearZ:0,h,intersect(rect(-w/2,0,w/2,b.cy),offset(unite(out,rect(-w/2,0,w/2,1)),0))));
    if(o.mount==='clip')clipBack(f,{w,h});
  }

  /* ---------------- plant pot ---------------- */
  function pot(o){
    const base=body2D(o.shape,o.L,o.W,o.seed),b=bounds(base),f=[],notes=[];
    const raise=o.drain?3:0,fl=2,H=o.H,tp=(o.taper||0)/100;
    const at=z=>scaleAbout(base,1+tp*z/H,b.cx,b.cy);
    const hub=o.mount==='peg'?circle(b.cx,b.cy,PEG.hub):null;
    const inner=z=>{let c=offset(at(z),-o.wall);if(hub&&z<raise+fl+PEG.depth)c=subtract(c,hub);return c};
    if(tp){f.push(varying(raise,H,at,1));f.push(varying(raise+fl,H+.01,inner,1,'sub'))}
    else{f.push(prism(raise,H,base));f.push(prism(raise+fl,H+1,offset(base,-o.wall),'sub'))}
    if(hub){f.push(prism(0,raise+fl+PEG.depth,hub));f.push(prism(-1,PEG.depth,circle(b.cx,b.cy,PEG.sock),'sub'))}
    const feet=[];
    if(raise){
      const rr=Math.min(b.x1-b.x0,b.y1-b.y0)*.32;
      for(let i=0;i<3;i++){const a=Math.PI/2+i*Math.PI*2/3,p=[b.cx+rr*Math.cos(a),b.cy+rr*Math.sin(a)];feet.push(p);f.push(prism(0,raise+.01,circle(p[0],p[1],4)))}
    }
    if(o.drain){
      const area=offset(base,-o.wall-2.5);let n=0;
      for(let x=b.x0;x<=b.x1;x+=8)for(let y=b.y0;y<=b.y1;y+=8){
        const c=circle(x,y,1.5,16);if(intersect(c,area).length!==1||Math.abs(G.area(intersect(c,area))-G.area(c))>.01)continue;
        if(feet.some(p=>Math.hypot(p[0]-x,p[1]-y)<6.5)||(hub&&Math.hypot(b.cx-x,b.cy-y)<PEG.hub+2.5))continue;
        f.push(prism(-1,raise+fl+.01,c,'sub'));n++;
      }
      if(!n)notes.push('The pot is too small for drainage holes.');
    }
    let magnets=0;addMount(f,o,b,H*.6,base);
    if(o.mount==='magnet')magnets=magnetBack(f,{w:Math.min(b.x1-b.x0,60),h:H*.6,md:o.md,mh:o.mh});
    return {parts:[{file:'plant-pot.stl',role:'Main colour',m:build(f)}],notes,magnets};
  }

  /* ---------------- twig holder ---------------- */
  function twig(o){
    const f=[],notes=[],rs=o.dia/2+.3,H=o.H;let magnets=0;
    const wall=o.mount==='magnet'||o.mount==='clip';
    if(wall){
      const R=rs+3,wv=wobble(o.seed||1,.15,4);
      const bd=fit(o.shape==='hex'?ngon(0,0,R/Math.cos(Math.PI/6),6,Math.PI/6):o.shape==='rock'?polar(0,0,a=>(R+1.5)*(1+wv(a)),96):circle(0,0,R)),b=bounds(bd);
      f.push(prism(0,H,bd));f.push(prism(2,H+1,circle(b.cx,b.cy,rs),'sub'));if(o.shape==='rock')notes.push('Rock shapes vary with the seed. Tap Shuffle for another.');
      addMount(f,o,b,H,bd);
      if(o.mount==='magnet'){magnets=magnetBack(f,{w:Math.max(b.x1-b.x0,2*o.md+6),h:H,md:o.md,mh:o.mh});if(H<o.md+6)notes.push('Make it taller so the magnet fits.')}
    }else{
      /* a standing base for the floor: wide at the bottom, narrowing up to the socket */
      const top=rs+3,bot=Math.max(top*2.2,18),w=o.shape==='rock'?wobble(o.seed||1,.16,4):()=>0;
      const shapeAt=r=>o.shape==='hex'?ngon(0,0,r/Math.cos(Math.PI/6),6,Math.PI/6):polar(0,0,a=>r*(1+w(a)),96);
      if(o.shape==='cylinder'||o.shape==='hex')f.push(prism(0,H,shapeAt(bot*.7)));
      else f.push(varying(0,H,z=>shapeAt(bot+(top-bot)*Math.pow(z/H,.7)),.6));
      const z0=o.mount==='peg'?PEG.depth+1.5:2;
      f.push(prism(z0,H+1,circle(0,0,rs),'sub'));
      if(o.mount==='peg')f.push(prism(-1,PEG.depth,circle(0,0,PEG.sock),'sub'));
      if(H<z0+10)notes.push('Make it taller so the twig sits deep enough.');
    }
    return {parts:[{file:'twig-holder.stl',role:'Main colour',m:build(f)}],notes,magnets};
  }

  /* ---------------- wall ledge: printed lying on its back ----------------
     Plan (looking down on the shelf): x along the wall, u out from the wall.
     Print: x stays x, the height on the wall becomes print y, and u becomes print z. */
  function ledgeTop(o){
    const L=o.L,D=o.dep,s=o.seed||1;
    if(o.shape==='leaf'){
      const o2=[],n=50;for(let i=0;i<=n;i++){const t=i/n,hw=(L/2)*Math.pow(Math.sin(Math.PI*(.12+.88*t)),.9)*(1-.15*t);o2.push([hw,t*D])}
      const pts=[...o2.map(([x,u])=>[x,u]),...o2.slice(0,-1).reverse().map(([x,u])=>[-x,u])];
      return [pts];
    }
    if(o.shape==='classic')return rrect(-L/2,0,L/2,D,Math.min(8,D/3));
    const amp=o.shape==='pebble'?.16:.08,w=wobble(s,amp,o.shape==='pebble'?4:7),pts=[],n=90;
    for(let i=0;i<=n;i++){const a=i/n*Math.PI,k=1+w(a*2);pts.push([(L/2)*Math.cos(a)*k,Math.max(0,D*Math.sin(a)*k)])}
    return unite([pts.map(([x,u])=>[x,u])],rect(-L*.35,0,L*.35,Math.min(6,D/3)));
  }
  function ledgeRidges(o,top){
    const bands=[];
    if(o.shape==='leaf'){
      const D=o.dep,L=o.L;
      bands.push(...G.stroke([[[0,2],[0,D*.92]]],1.4));
      for(let i=1;i<=4;i++){const u=D*i/5.5,hw=(L/2)*Math.sin(Math.PI*(.12+.88*u/D))*.75;bands.push(...G.stroke([[[0,u],[hw,u+D*.14]],[[0,u],[-hw,u+D*.14]]],1.1))}
      return intersect(unite(bands),offset(top,-1.5));
    }
    for(let d=4;d<o.dep;d+=4.5){const a=offset(top,-d),b=offset(top,-d-1.1);if(!a.length)break;bands.push(...subtract(a,b))}
    return intersect(unite(bands),rect(-o.L,3,o.L,o.dep*2));
  }
  function ledge(o){
    const f=[],notes=[],clip=o.mount==='clip',mag=o.mount==='magnet';
    const md=o.md,mh=o.mh,R=md/2+.2,pd=mh+.2;
    const bt=clip?RAIL.tongue:mag?Math.max(2.4,pd+1.4):2.4,st=3.2;
    const Hb=Math.max(o.Hh,clip?CLIP.clearZ+16:16,mag?2*R+18:0),zs=clip?Math.max(CLIP.clearZ,Hb*.3):Hb*.3;
    /* back plate outline on the wall: rounded, a little irregular; straight along the bottom when it clips into a rail */
    const wv=wobble((o.seed||1)+7,o.shape==='classic'?.03:.09,5);
    const PL=o.L*1.12;let plate=polar(0,Hb/2,a=>{const c=Math.cos(a),s=Math.sin(a),e=1/Math.sqrt(c*c/(PL*PL/4)+s*s/(Hb*Hb/4));return e*(1+wv(a))},120);
    plate=unite(plate,rrect(-o.L*.4,Math.max(0,zs-4),o.L*.4,zs+st+4,3));
    if(clip)plate=unite(intersect(plate,rect(-o.L,0,o.L,Hb*2)),rect(-Math.min(o.L*.4,30),0,Math.min(o.L*.4,30),zs+st));
    f.push(prism(0,bt,plate));
    const top=ledgeTop(o),rid=ledgeRidges(o,top),rim=o.shape==='leaf'?[]:intersect(subtract(offset(top,-.05),offset(top,-1.6)),rect(-o.L,3,o.L,o.dep*2));
    const slice=(rings,u)=>G.slice(rings,u);
    f.push(varying(bt-.01,bt+o.dep*1.25,z=>slice(top,z-bt).map(([a,c])=>[[a,zs],[c,zs],[c,zs+st],[a,zs+st]]),.3));
    if(rid.length)f.push(varying(bt,bt+o.dep*1.25,z=>slice(rid,z-bt).map(([a,c])=>[[a,zs+st-.01],[c,zs+st-.01],[c,zs+st+.8],[a,zs+st+.8]]),.3));
    if(rim.length)f.push(varying(bt,bt+o.dep*1.25,z=>slice(rim,z-bt).map(([a,c])=>[[a,zs+st-.01],[c,zs+st-.01],[c,zs+st+2.2],[a,zs+st+2.2]]),.3));
    let magnets=0;
    if(mag){const y=Math.min(Hb-R-3,zs+st+R+4),xs=o.L>=4*R+16?[-o.L/4,o.L/4]:[0];for(const x of xs)f.push(prism(-1,pd,circle(x,y,R),'sub'));magnets=xs.length}
    if(clip){const wc=Math.min(o.L*.4,30);f.push(prism(bt-.01,bt+.35,rect(-wc+2,1,wc-2,2)))}
    return {parts:[{file:'wall-ledge.stl',role:'Main colour',m:build(f)}],notes,magnets};
  }

  /* ---------------- label holder: printed flat on its back ---------------- */
  function label(o){
    const clip=o.mount==='clip',mag=o.mount==='magnet',R=o.md/2+.2,pd=o.mh+.2;
    const sp=4,ov=3,pt=clip?RAIL.tongue:mag?Math.max(2,pd+1.4):2,Lp=o.cw+2*sp,drop=clip?CLIP.clearZ:0,Hp=o.ch+sp-3+drop;
    const shape=rrect(-Lp/2,0,Lp/2,Hp,4),pf=[prism(0,pt,shape)];let magnets=0;
    if(mag){const y=drop+(Hp-drop)/2,xs=Lp>=4*R+16?[-Lp/4,Lp/4]:[0];for(const x of xs)pf.push(prism(-1,pd,circle(x,y,R),'sub'));magnets=xs.length;}
    if(clip)pf.push(prism(pt-.01,pt+.35,rect(-Lp/2+3,1,Lp/2-3,2)));
    const gz=.8,lz=1.2,y0=drop;
    const spacer=intersect(shape,unite(rect(-Lp/2,y0,-Lp/2+sp,Hp),unite(rect(Lp/2-sp,y0,Lp/2,Hp),rect(-Lp/2,y0,Lp/2,y0+sp))));
    const lips=intersect(shape,unite(rect(-Lp/2,y0,-Lp/2+sp+ov,Hp),unite(rect(Lp/2-sp-ov,y0,Lp/2,Hp),rect(-Lp/2,y0,Lp/2,y0+sp+ov))));
    const ff=[prism(pt,pt+gz,spacer),prism(pt+gz,pt+gz+lz,lips)];
    const notes=[];if(mag&&o.ch<2*R+2)notes.push('The card is too short for the magnets. Make it taller.');
    return {parts:[{file:'label-plate.stl',role:'Colour 1',m:build(pf)},{file:'label-frame.stl',role:'Colour 2',m:build(ff),same:true}],notes,magnets};
  }

  /* ---------------- light holders ----------------
     clamp: a bridge across the lid with an upright tab for a clamp-on lamp. Printed on its side.
     puck / bar: a cradle that sits on the mesh lid and holds a round or long light 2 mm above the mesh. */
  function light(o,enc){
    const f=[],notes=[];
    if(o.kind==='clamp'){
      const span=enc.span,h0=12,bh=5,tw=o.tab,tH=o.tabH,w=10;
      const x0=-span/2,x1=span/2;
      const prof=[rect(x0-2.4,-4,x0,h0+bh),rect(x1,-4,x1+2.4,h0+bh),rect(x0-2.4,0,x0+8,h0+bh),rect(x1-8,0,x1+2.4,h0+bh),rect(x0,h0,x1,h0+bh),rect(-tw/2,h0+bh-.01,tw/2,h0+bh+tH)];
      /* gussets so the tab doesn't snap: stepped wedges either side */
      for(let i=0;i<6;i++){const hgt=(6-i)*2;prof.push(rect(-tw/2-(i+1)*1.5,h0+bh-.01,-tw/2-i*1.5+.01,h0+bh+hgt),rect(tw/2+i*1.5-.01,h0+bh-.01,tw/2+(i+1)*1.5,h0+bh+hgt))}
      f.push(prism(0,w,unite([].concat(...prof))));
      if(span>enc.bed-5)notes.push('The bridge is longer than your bed. Turn it diagonally, or use a cradle instead.');
      return {parts:[{file:'light-bridge-clamp.stl',role:'Main colour',m:build(f)}],notes,magnets:0};
    }
    const fl=2,wall=2.4,hgt=10;
    let inner;
    if(o.kind==='puck')inner=circle(0,0,o.pd/2+.4);
    else inner=rrect(-o.bl/2-.4,-o.bw/2-.4,o.bl/2+.4,o.bw/2+.4,1.5);
    const outer=offset(inner,wall),window=offset(inner,-3);
    f.push(prism(0,fl,outer),prism(fl-.01,hgt,subtract(outer,inner)));
    f.push(prism(-1,fl+1,window,'sub'));
    /* air gaps in the wall, so heat can escape */
    const b=bounds(outer);
    for(let i=0;i<4;i++){const a=i*Math.PI/2+Math.PI/4;f.push(prism(fl+2.5,hgt+1,G.stroke([[[0,0],[Math.cos(a)*(b.x1+10),Math.sin(a)*(b.y1+10)]]],5),'sub'))}
    return {parts:[{file:o.kind==='puck'?'light-cradle-round.stl':'light-cradle-bar.stl',role:'Main colour',m:build(f)}],notes,magnets:0};
  }

  /* ---------------- round and oval enclosures ---------------- */
  function perimeter(a,b){const h=((a-b)/(a+b))**2;return Math.PI*(a+b)*(1+3*h/(10+Math.sqrt(4-3*h)))}
  function roundEnclosure(p,preview){
    const a=p.W/2,b=(p.shape==='round'?p.W:p.D)/2,gw=p.ts+.6,wall=2.4,f=2.4,s=6,Lt=2.4,S=p.S,H=p.H;
    const C=ellipse(0,0,a,b,Math.round(Math.max(a,b)*1.6));
    const oR=offset(C,gw/2+wall),oG=offset(C,gw/2),iG=offset(C,-gw/2),iR=offset(C,-gw/2-wall);
    const bf=[prism(0,f,oR),prism(0,S,subtract(oR,iR)),prism(S-.01,S+s,subtract(oR,oG)),prism(S-.01,S+s,subtract(iG,iR))];
    const pegs=[];
    if(p.pegs==='grid'){const lim=offset(C,-gw/2-wall-14);for(let x=-a;x<=a;x+=RAIL.pitch)for(let y=-b;y<=b;y+=RAIL.pitch){const c=circle(x,y,PEG.r,24);if(Math.abs(G.area(intersect(c,lim))-G.area(c))<.01){pegs.push([x,y]);bf.push(prism(f-.01,f+PEG.h,c))}}}
    const base=build(bf);
    /* lid, printed upside down: plate on the bed, rails pointing up */
    const md=p.dMagD||10,mh=p.dMagH||3,R=md/2+.2,pd=mh+.2,Rh=Math.min(30,Math.min(a,b)*.35),boss=pd+1.6;
    const lf=[prism(0,Lt,oR),prism(Lt-.01,Lt+s,subtract(oR,oG)),prism(Lt-.01,Lt+s,subtract(iG,iR)),
      prism(0,boss,subtract(circle(0,0,Rh+12),circle(0,0,Rh))),prism(-1,boss+1,circle(0,0,Rh),'sub')];
    for(const x of [-(Rh+6),Rh+6])lf.push(prism(-1,pd,circle(x,0,R),'sub'));
    if(!preview){
      const ia=a-gw/2-wall-1.5,ib=b-gw/2-wall-1.5,hs=[],pitch=p.hole+p.bar;
      const inEl=(x,y)=>(x*x)/(ia*ia)+(y*y)/(ib*ib)<1;
      for(let x=-ia;x<ia;x+=pitch)for(let y=-ib;y<ib;y+=pitch){
        const c=[[x,y],[x+p.hole,y],[x+p.hole,y+p.hole],[x,y+p.hole]];
        if(c.every(([u,v])=>inEl(u,v)&&Math.hypot(u,v)>Rh+13))hs.push(c);
      }
      lf.push(prism(-1,Lt+.01,hs,'sub'));
    }
    const lid=build(lf);
    /* hatch cover: sits on the lid over the feeding hole, held by two magnets, with a knob */
    const cf=[prism(0,boss,circle(0,0,Rh+11)),prism(boss-.01,boss+8,circle(0,0,6))];
    for(const x of [-(Rh+6),Rh+6])cf.push(prism(-1,pd,circle(x,0,R),'sub'));
    if(!preview){const hs=[];for(let x=-Rh;x<Rh;x+=p.hole+p.bar)for(let y=-Rh;y<Rh;y+=p.hole+p.bar){if(Math.hypot(x,y)<Rh-4&&Math.hypot(x+p.hole,y+p.hole)<Rh-4&&Math.hypot(x+p.hole,y)<Rh-4&&Math.hypot(x,y+p.hole)<Rh-4&&Math.hypot(x+p.hole/2,y+p.hole/2)>8)hs.push([[x,y],[x+p.hole,y],[x+p.hole,y+p.hole],[x,y+p.hole]])}cf.push(prism(-1,boss+.01,hs,'sub'))}
    const cover=build(cf);
    const outerD=[2*(a+gw/2+wall),2*(b+gw/2+wall)];
    return {base,lid,cover,C,a,b,gw,S,H,Lt,s,outerD,sheet:[perimeter(a,b)+15,H-.5],Rh,pegs};
  }
  /* rectangular base, with optional floor pegs */
  function rectBase(d,p){
    const {W,D,S,s,g,band,Eh,f,a}=d,c=.25,bf=[prism(0,f,rect(-band,-band,W+band,D+band))];
    for(const [ax,v] of [['x',0],['x',W],['y',0],['y',D]]){
      if(ax==='x')bf.push(prism(0,S,rect(v-band,0,v+band,D)),prism(S-.01,S+s,rect(v-band,0,v-g/2,D)),prism(S-.01,S+s,rect(v+g/2,0,v+band,D)));
      else bf.push(prism(0,S,rect(0,v-band,W,v+band)),prism(S-.01,S+s,rect(0,v-band,W,v-g/2)),prism(S-.01,S+s,rect(0,v+g/2,W,v+band)));
    }
    for(const [x,y] of [[0,0],[W,0],[W,D],[0,D]]){bf.push(prism(0,S+s,rect(x-Eh,y-Eh,x+Eh,y+Eh)),prism(S,S+s+1,rect(x-a-c,y-a-c,x+a+c,y+a+c),'sub'))}
    const pegs=[];
    if(p.pegs==='grid'){const m=band+14,nx=Math.floor((W-2*m)/RAIL.pitch),ny=Math.floor((D-2*m)/RAIL.pitch),ox=(W-nx*RAIL.pitch)/2,oy=(D-ny*RAIL.pitch)/2;for(let i=0;i<=nx;i++)for(let j=0;j<=ny;j++){const x=ox+i*RAIL.pitch,y=oy+j*RAIL.pitch;pegs.push([x,y]);bf.push(prism(f-.01,f+PEG.h,circle(x,y,PEG.r,24)))}}
    const m=build(bf);m.pegs=pegs;return m;
  }
  root.HabitatParts={RAIL,CLIP,PEG,dish,pot,twig,ledge,label,light,roundEnclosure,rectBase,perimeter};
})(typeof window!=='undefined'?window:globalThis);
