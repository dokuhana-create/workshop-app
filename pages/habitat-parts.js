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
    const wall=o.mount==='magnet'||o.mount==='clip',wv=wobble(o.seed||1,.16,4);
    if(wall){
      /* against a panel: the back stays flat at y=0 while the body narrows towards the top */
      const top=rs+3,bot=o.shape==='cone'?top*2.1:o.shape==='rock'?top*1.6:top;
      const r=z=>bot+(top-bot)*z/H;
      const at=z=>{const R=r(z);return o.shape==='hex'?fit(ngon(0,0,R/Math.cos(Math.PI/6),6,Math.PI/6)):fit(o.shape==='rock'?polar(0,0,a=>R*(1+wv(a)),96):circle(0,0,R))};
      if(bot===top)f.push(prism(0,H,at(0)));else f.push(varying(0,H,at,.6));
      const b=bounds(at(H)),cy=b.cy;
      f.push(prism(2,H+1,circle(0,cy,rs),'sub'));
      /* a strip joins the body to the back plate all the way up */
      const w=Math.max(8,Math.min(2*top,(b.x1-b.x0)*.8));f.push(prism(0,H,rect(-w/2,-.01,w/2,1.2)));
      if(o.mount==='clip')clipBack(f,{w,h:H});
      if(o.mount==='magnet'){magnets=magnetBack(f,{w:Math.max(w,2*o.md+6),h:H,md:o.md,mh:o.mh});if(H<o.md+6)notes.push('Make it taller so the magnet fits.')}
      if(o.shape==='rock')notes.push('Rock shapes vary. Tap Shuffle shape for another.');
    }else{
      /* standing on the floor: a clearly different silhouette for each shape */
      const top=rs+3,bot=Math.max(top*2.4,20);
      let at;
      if(o.shape==='cylinder')at=()=>circle(0,0,top+2.5,96);
      else if(o.shape==='hex')at=z=>ngon(0,0,(bot+(top-bot)*z/H)/Math.cos(Math.PI/6),6,Math.PI/6);
      else if(o.shape==='cone')at=z=>circle(0,0,bot+(top-bot)*z/H,96);
      else at=z=>polar(0,0,a=>(bot+(top-bot)*Math.pow(z/H,.6))*(1+wv(a+z*.04)),96);
      if(o.shape==='cylinder'){f.push(prism(0,H,at(0)),prism(0,3,circle(0,0,bot*.9,96)))}else f.push(varying(0,H,at,.6));
      const z0=o.mount==='peg'?PEG.depth+1.5:2;
      f.push(prism(z0,H+1,circle(0,0,rs),'sub'));
      if(o.mount==='peg')f.push(prism(-1,PEG.depth,circle(0,0,PEG.sock),'sub'));
      if(H<z0+10)notes.push('Make it taller so the twig sits deep enough.');
    }
    return {parts:[{file:'twig-holder.stl',role:'Main colour',m:build(f)}],notes,magnets};
  }

  /* ---------------- filigree helpers (after the Resin Workshop's pendants) ---------------- */
  function bez(a,b,c,d,n){n=n||40;const p=[];for(let i=0;i<=n;i++){const t=i/n,u=1-t;p.push([u*u*u*a[0]+3*u*u*t*b[0]+3*u*t*t*c[0]+t*t*t*d[0],u*u*u*a[1]+3*u*u*t*b[1]+3*u*t*t*c[1]+t*t*t*d[1]])}return p}
  function curl(from,dir,size,turn,turns,n){turns=turns||1.15;n=n||70;const p=[[...from]];let a=dir,x=from[0],y=from[1];const len=size*3.4;for(let i=1;i<=n;i++){const t=i/n,step=len/n*(1.45-.9*t);a+=turn*(2*Math.PI*turns/n)*(.25+1.5*t);x+=Math.cos(a)*step;y+=Math.sin(a)*step;p.push([x,y])}return p}
  const tangent=(l,i)=>{const a=l[Math.max(0,i-1)],b=l[Math.min(l.length-1,i+1)];return Math.atan2(b[1]-a[1],b[0]-a[0])};
  /* pattern lines inside a shelf L wide and D deep (x across, u out from the wall), as open polylines */
  const LEDGE_PATTERNS={
    rings(L,D){const o=[];for(let k=1;k<=12;k++){const a=Math.PI*k/13;o.push([[0,0],[Math.cos(a)*L,Math.sin(a)*D*2]])}return {lines:o,bands:true}},
    web(L,D){const o=[],n=9;for(let k=1;k<n;k++){const a=Math.PI*k/n;o.push([[0,0],[Math.cos(a)*L,Math.sin(a)*D*2]])}
      for(let r=.22;r<1.05;r+=.17){const arc=[];for(let k=0;k<=n;k++){const a=Math.PI*k/n,w=1-.08*Math.sin(k*Math.PI)*0;arc.push([Math.cos(a)*L/2*r*w,Math.sin(a)*D*r*w])}o.push(arc)}return {lines:o}},
    vine(L,D,r){const hw=L/2,o=[];const stem=bez([0,0],[hw*.9,D*.15],[hw*.75,D*.7],[hw*.05,D*.95],60);o.push(stem);
      for(const t of [.25,.5,.75]){const i=Math.round(t*60);o.push(curl(stem[i],tangent(stem,i)+.6,Math.min(hw,D)*(.42-t*.18),1))}return {lines:o,mirror:true}},
    scroll(L,D){const sz=Math.min(L/2,D)*.5,o=[];o.push(curl([0,0],.8,sz*1.05,1),curl([0,D*.45],.5,sz*.8,1),bez([0,0],[0,D*.3],[0,D*.6],[0,D*.95]));return {lines:o,mirror:true}},
    nouveau(L,D){const hw=L/2,a=bez([-hw*.2,0],[hw*2.4,D*.25],[-hw*2.4,D*.6],[hw*.45,D*.92],70),b=bez([hw*.3,0],[-hw*2,D*.3],[hw*2,D*.55],[-hw*.5,D*.85],70);
      return {lines:[a,curl(a[70],tangent(a,70),hw*.25,-1),b,curl(b[70],tangent(b,70),hw*.2,1)]}}
  };

  /* ---------------- wall ledge: printed lying on its back ----------------
     Plan (looking down on the shelf): x along the wall, u out from the wall.
     Print: x stays x, the height on the wall becomes print y, and u becomes print z. */
  function ledgeOutline(shape,L,D,seed){
    if(shape==='leaf'){
      const o2=[],n=50;for(let i=0;i<=n;i++){const t=i/n,hw=(L/2)*Math.pow(Math.sin(Math.PI*(.12+.88*t)),.9)*(1-.15*t);o2.push([hw,t*D])}
      return [[...o2,...o2.slice(0,-1).reverse().map(([x,u])=>[-x,u])]];
    }
    if(shape==='square')return rect(-L/2,0,L/2,D);
    if(shape==='classic')return rrect(-L/2,0,L/2,D,Math.min(8,D/3));
    if(shape==='moon'){const o=[],n=90;for(let i=0;i<=n;i++){const a=i/n*Math.PI;o.push([(L/2)*Math.cos(a),D*Math.sin(a)])}const inner=[];for(let i=0;i<=n;i++){const a=i/n*Math.PI;inner.push([(L/2)*.55*Math.cos(a),D*.42*Math.sin(a)])}return subtract([o],[inner.concat([[L*.3,-1],[-L*.3,-1]])])}
    const lobed=shape==='lobed',amp=shape==='pebble'?.16:lobed?.04:.08,w=wobble(seed,amp,shape==='pebble'?4:7),pts=[],n=120,lobes=3+((seed*7)%3);
    for(let i=0;i<=n;i++){const a=i/n*Math.PI,k=(1+w(a*2))*(lobed?.86+.14*Math.pow(Math.abs(Math.sin(a*lobes)),.5):1);pts.push([(L/2)*Math.cos(a)*k,Math.max(0,D*Math.sin(a)*k)])}
    return unite([pts],rect(-L*.35,0,L*.35,Math.min(6,D/3)));
  }
  /* see-through shelf: a frame along the outline plus filigree lines, merged and cleaned so nothing is too thin */
  function openwork(top,o,L,D,seed){
    if(!o.pattern||o.pattern==='solid')return null;
    const lw=Math.max(1.6,o.lw||2.2),P=LEDGE_PATTERNS[o.pattern](L,D,seed);
    let lines=[...P.lines];if(P.mirror)lines=lines.concat(P.lines.map(l=>l.map(([x,u])=>[-x,u])));
    let parts=G.stroke(lines,lw);
    if(P.bands)for(let d=7;d<D;d+=7){const a=offset(top,-d),b=offset(top,-d-lw);if(!a.length)break;parts=unite(parts,subtract(a,b))}
    const frame=subtract(top,offset(top,-lw*1.3));
    let all=unite(unite(frame,intersect(parts,top)),intersect(rect(-L,0,L,4),top));
    all=offset(offset(all,.4),-.4);all=offset(offset(all,-lw*.35),lw*.35);
    return intersect(all,top);
  }
  function ledge(o){
    const f=[],notes=[],clip=o.mount==='clip',mag=o.mount==='magnet';
    const md=o.md,mh=o.mh,R=md/2+.2,pd=mh+.2,st=3.2,seed=o.seed||1;
    const bt=clip?RAIL.tongue:mag?Math.max(2.4,pd+1.4):2.4;
    /* shelves: one, or three stacked fungus brackets */
    const tiers=o.shape==='tiered'?[{L:o.L,D:o.dep,dx:0,dz:0,s:seed},{L:o.L*.68,D:o.dep*.72,dx:-o.L*.12,dz:1,s:seed+3},{L:o.L*.46,D:o.dep*.5,dx:o.L*.16,dz:2,s:seed+5}]:[{L:o.L,D:o.dep,dx:0,dz:0,s:seed}];
    const under=o.under||'flat',Hd=under==='flat'?0:Math.min(o.dep*.7,o.underH||o.dep*.55);
    const step=Math.max(14,o.dep*.45);
    const zs0=Math.max(clip?CLIP.clearZ:4,Hd+3,o.Hh*.3);
    const Hb=Math.max(o.Hh,zs0+st+(tiers.length-1)*step+12,clip?CLIP.clearZ+16:16,mag?2*R+18:0);
    /* back plate outline on the wall: rounded, a little irregular (or square), straight along the bottom for a clip rail */
    const PL=o.L*1.12,wv=wobble(seed+7,o.shape==='classic'||o.shape==='square'?.0:.09,5);
    let plate=o.shape==='square'?rect(-PL/2,0,PL/2,Hb):o.shape==='classic'?rrect(-PL/2,0,PL/2,Hb,6):polar(0,Hb/2,a=>{const c=Math.cos(a),s=Math.sin(a),e=1/Math.sqrt(c*c/(PL*PL/4)+s*s/(Hb*Hb/4));return e*(1+wv(a))},120);
    plate=unite(plate,rrect(-o.L*.4,Math.max(0,zs0-Hd-4),o.L*.4,zs0+st+4,3));
    if(clip)plate=unite(intersect(plate,rect(-o.L,0,o.L,Hb*2)),rect(-Math.min(o.L*.4,30),0,Math.min(o.L*.4,30),zs0+st));
    f.push(prism(0,bt,plate));
    const slice=(rings,u)=>G.slice(rings,u);
    for(const t of tiers){
      const zs=zs0+t.dz*step,top=G.move(ledgeOutline(o.shape==='tiered'?'fungus':o.shape,t.L,t.D,t.s),t.dx,0);
      const open=openwork(top,o,t.L,t.D,t.s),body=open||top,zA=bt-.01,zMax=zA+.3*Math.ceil(o.dep*1.3/.3);
      /* underside: D (quarter round), wedge, or ribs. Each layer sits inside the one below, so no supports. */
      const hd=Hd*(t.D/o.dep),hfun=u=>under==='D'?hd*Math.sqrt(Math.max(0,1-(u/t.D)**2)):under==='flat'?0:hd*Math.max(0,1-u/t.D);
      const ribs=under==='ribs'?intersect(body,unite((t.L>60?[-t.L/3,0,t.L/3]:[-t.L/4,t.L/4]).map(x=>rect(t.dx+x-1.6,0,t.dx+x+1.6,t.D)[0]).map(r=>[r]).flat())):null;
      f.push(varying(zA,zMax,z=>{const u=z-bt,hv=Math.round(hfun(u)/.1)*.1,deep=hv>=.4&&!ribs?zs-hv:zs;
        const out=slice(body,u).map(([a,c])=>[[a,deep],[c,deep],[c,zs+st],[a,zs+st]]);
        if(ribs&&hv>=.4)for(const [a,c] of slice(ribs,u))out.push([[a,zs-hv],[c,zs-hv],[c,zs+st],[a,zs+st]]);
        return out},.3));
      if(!open){
        const rid=o.shape==='leaf'?intersect(unite(G.stroke([[[t.dx,2],[t.dx,t.D*.92]]],1.4)),offset(top,-1.5)):(()=>{const bands=[];for(let d=4;d<t.D;d+=4.5){const a=offset(top,-d),b=offset(top,-d-1.1);if(!a.length)break;bands.push(...subtract(a,b))}return intersect(unite(bands),rect(-o.L,3,o.L,o.dep*2))})();
        const rim=o.shape==='leaf'?[]:intersect(subtract(offset(top,-.05),offset(top,-1.6)),rect(-o.L,3,o.L,o.dep*2));
        if(rid.length)f.push(varying(zA,zMax,z=>slice(rid,z-bt).map(([a,c])=>[[a,zs+st-.01],[c,zs+st-.01],[c,zs+st+.8],[a,zs+st+.8]]),.3));
        if(rim.length)f.push(varying(zA,zMax,z=>slice(rim,z-bt).map(([a,c])=>[[a,zs+st-.01],[c,zs+st-.01],[c,zs+st+2.2],[a,zs+st+2.2]]),.3));
      }
    }
    let magnets=0;
    if(mag){const y=Hb-R-4,xs=o.L>=4*R+16?[-o.L/4,o.L/4]:[0];for(const x of xs)f.push(prism(-1,pd,circle(x,y,R),'sub'));magnets=xs.length}
    if(clip){const wc=Math.min(o.L*.4,30);f.push(prism(bt-.01,bt+.35,rect(-wc+2,1,wc-2,2)))}
    if(o.pattern&&o.pattern!=='solid')notes.push('The see-through pattern prints as is, with lines at least '+Math.max(1.6,o.lw||2.2).toFixed(1)+' mm wide. Tap Shuffle shape for a different version.');
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
    if(o.kind==='ring'){
      /* seats for ring-shaped LED heads lying on the lid, shining down through the mesh.
         Each ring rests on three small pads, so almost all of its LEDs stay uncovered. */
      const R=o.rd/2,n=Math.max(1,Math.min(4,Math.round(o.n||1))),gap=SEAT_GAP,pitch=2*R+2*3.2+gap,x0=-(n-1)*pitch/2,pad=2,hw=7;
      for(let i=0;i<n;i++){
        const cx=x0+i*pitch,ring=subtract(circle(cx,0,R+3.2),circle(cx,0,R+.6));
        /* wall with a gap at the back for the cable */
        f.push(prism(0,pad+7,subtract(ring,rect(cx-8,R-5,cx+8,R+10))));
        for(let k=0;k<3;k++){const a=-Math.PI/2+k*Math.PI*2/3,c=Math.cos(a),s2=Math.sin(a);
          f.push(prism(0,pad,G.stroke([[[cx+c*(R-7),s2*(R-7)],[cx+c*(R+2),s2*(R+2)]]],hw)))}
        if(i<n-1)f.push(prism(0,4,rect(cx+R+2.5,-4,cx+pitch-R-2.5,4)));
      }
      notes.push('Measure your ring lights when they arrive and set the diameter. The seats leave 0.6 mm of play.');
      return {parts:[{file:`light-ring-seats-${n}.stl`,role:'Main colour',m:build(f)}],notes,magnets:0};
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
    /* lid, printed upside down: plate on the bed (the lid's top face), rails pointing up */
    const md=p.dMagD||10,mh=p.dMagH||3,R=md/2+.2,pd=mh+.2,boss=pd+1.6,notes=[];
    const ia=a-gw/2-wall-1.5,ib=b-gw/2-wall-1.5,inEl=(x,y,m)=>(x*x)/((ia-m)*(ia-m))+(y*y)/((ib-m)*(ib-m))<1;
    /* light windows along the middle, then the hatch wherever it still fits */
    let win=lightWindows(p,0,0,b>a);
    if(win){const ok=win.centers.filter(([x,y])=>inEl(x,y,win.Rw+3.5));if(ok.length<win.centers.length)notes.push(`Only ${ok.length} light window${ok.length===1?'':'s'} fit this lid.`);win.centers=ok;if(!ok.length)win=null}
    let hatch=null;
    for(let Rh=Math.min(30,Math.min(a,b)*.35);Rh>=18;Rh-=2){
      const hy=win?-(win.Rw+4.5+Rh+13)*(b>a?0:1):0,hx2=win&&b>a?-(win.Rw+4.5+Rh+13):0;
      if(inEl(hx2,hy,Rh+13)){hatch={Rh,hx:hx2,hy};break}
    }
    if(!hatch)notes.push('There is no room for the feeding hatch next to the light windows, so you open the enclosure by lifting the lid.');
    const lf=[prism(0,Lt,oR),prism(Lt-.01,Lt+s,subtract(oR,oG)),prism(Lt-.01,Lt+s,subtract(iG,iR))];
    if(hatch){const {Rh,hx,hy}=hatch;lf.push(prism(0,boss,subtract(circle(hx,hy,Rh+12),circle(hx,hy,Rh))),prism(-1,boss+1,circle(hx,hy,Rh),'sub'));for(const x of [hx-(Rh+6),hx+Rh+6])lf.push(prism(-1,pd,circle(x,hy,R),'sub'))}
    const hs=[];
    if(win)addWindows(lf,hs,win,p,0,Lt,false,preview);
    if(!preview){
      const pitch=p.hole+p.bar;
      for(let x=-ia;x<ia;x+=pitch)for(let y=-ib;y<ib;y+=pitch){
        const c=[[x,y],[x+p.hole,y],[x+p.hole,y+p.hole],[x,y+p.hole]];
        if(!c.every(([u,v])=>inEl(u,v,0)))continue;
        if(hatch&&c.some(([u,v])=>Math.hypot(u-hatch.hx,v-hatch.hy)<hatch.Rh+13))continue;
        if(win&&c.some(([u,v])=>win.centers.some(([cx,cy])=>Math.hypot(u-cx,v-cy)<win.Rw+4.5)))continue;
        hs.push(c);
      }
    }
    if(hs.length)lf.push(prism(-1,Lt+1,hs,'sub'));
    const lid=build(lf);
    /* hatch cover: sits on the lid over the feeding hole, held by two magnets, with a knob */
    let cover=null;
    if(hatch){const Rh=hatch.Rh,cf=[prism(0,boss,circle(0,0,Rh+11)),prism(boss-.01,boss+8,circle(0,0,6))];
      for(const x of [-(Rh+6),Rh+6])cf.push(prism(-1,pd,circle(x,0,R),'sub'));
      if(!preview){const hs2=[];for(let x=-Rh;x<Rh;x+=p.hole+p.bar)for(let y=-Rh;y<Rh;y+=p.hole+p.bar){if(Math.hypot(x,y)<Rh-4&&Math.hypot(x+p.hole,y+p.hole)<Rh-4&&Math.hypot(x+p.hole,y)<Rh-4&&Math.hypot(x,y+p.hole)<Rh-4&&Math.hypot(x+p.hole/2,y+p.hole/2)>8)hs2.push([[x,y],[x+p.hole,y],[x+p.hole,y+p.hole],[x,y+p.hole]])}cf.push(prism(-1,boss+.01,hs2,'sub'))}
      cover=build(cf);}
    const outerD=[2*(a+gw/2+wall),2*(b+gw/2+wall)];
    return {base,lid,cover,C,a,b,gw,S,H,Lt,s,outerD,sheet:[perimeter(a,b)+15,H-.5],hatch,pegs,win,notes};
  }
  /* ---- light windows in a lid, under ring lights ----
     'insert': a round opening with a 1 mm ledge around it for a clear disc or a piece of fine fabric mesh.
     'fine': the same area as printed mesh with thin 0.6 mm bars. Laid out like the ring light seats. */
  const SEAT_GAP=4;
  function lightWindows(p,cx,cy,alongY){
    if(!p.lw||p.lw==='none')return null;
    /* the window covers the LED band of the ring; the ring's outer 4 mm rests on the lid around it */
    const R=p.lwD/2,n=Math.max(1,Math.min(4,Math.round(p.lwN||1))),pitch=2*R+2*3.2+SEAT_GAP,o0=-(n-1)*pitch/2,centers=[];
    for(let i=0;i<n;i++)centers.push(alongY?[cx,cy+o0+i*pitch]:[cx+o0+i*pitch,cy]);
    return {centers,Rw:R-4,mode:p.lw,R};
  }
  function addWindows(f,hs,w,p,z0,z1,topAtZ1,preview){
    const dr=1.0;
    for(const [cx,cy] of w.centers){
      if(w.mode==='insert'){
        f.push(prism(z0-1,z1+1,circle(cx,cy,w.Rw),'sub'));
        f.push(topAtZ1?prism(z1-dr,z1+1,circle(cx,cy,w.Rw+3),'sub'):prism(z0-1,z0+dr,circle(cx,cy,w.Rw+3),'sub'));
      }else if(!preview){
        const bar=.6,pitch=p.hole+bar,Rin=w.Rw+3;
        for(let x=cx-Rin;x<cx+Rin;x+=pitch)for(let y=cy-Rin;y<cy+Rin;y+=pitch){const c=[[x,y],[x+p.hole,y],[x+p.hole,y+p.hole],[x,y+p.hole]];if(c.every(([u,v])=>Math.hypot(u-cx,v-cy)<Rin))hs.push(c)}
      }
    }
  }
  /* rectangular lid with light windows, built upright like the plain one (rails down, plate on top) */
  function rectLid(d,p,preview){
    const {W,D,s,g,band,Eh,Lt,a,swing}=d,c=.25,f=[prism(s,s+Lt,rect(-band,-band,W+band,D+band))];
    for(const [ax,v] of [['x',0],['x',W],['y',0],['y',D]]){
      if(ax==='x')f.push(prism(0,s+.01,rect(v-band,0,v-g/2,D)),prism(0,s+.01,rect(v+g/2,0,v+band,D)));
      else f.push(prism(0,s+.01,rect(0,v-band,W,v-g/2)),prism(0,s+.01,rect(0,v+g/2,W,v+band)));
    }
    for(const [x,y] of [[0,0],[W,0],[W,D],[0,D]]){f.push(prism(0,s+Lt,rect(x-Eh,y-Eh,x+Eh,y+Eh)),prism(-1,s,rect(x-a-c,y-a-c,x+a+c,y+a+c),'sub'))}
    if(!swing)f.push(prism(-1,s+Lt+1,rect(g/2,-g/2,W-g/2,g/2),'sub'));
    const m=band+1.5,notes=[];let win=lightWindows(p,W/2,D/2,D>W);
    if(win){const e=win.Rw+3+band+.6,ok=win.centers.filter(([x,y])=>x-e>=0&&x+e<=W&&y-e>=0&&y+e<=D);if(ok.length<win.centers.length)notes.push(`Only ${ok.length} light window${ok.length===1?'':'s'} fit this lid.`);win.centers=ok;if(!ok.length)win=null}
    const hs=[];
    if(win)addWindows(f,hs,win,p,s,s+Lt,true,preview);
    if(!preview){
      const holes=(a0,a1)=>{const pitch=p.hole+p.bar,n=Math.max(0,Math.floor((a1-a0+p.bar)/pitch)),off=(a1-a0-(n*pitch-p.bar))/2,o=[];for(let i=0;i<n;i++)o.push(a0+off+i*pitch);return o};
      for(const x of holes(m,W-m))for(const y of holes(m,D-m)){
        const q=[[x,y],[x+p.hole,y],[x+p.hole,y+p.hole],[x,y+p.hole]];
        if(win&&q.some(([u,v])=>win.centers.some(([cx,cy])=>Math.hypot(u-cx,v-cy)<win.Rw+4.5)))continue;
        hs.push(q);
      }
    }
    if(hs.length)f.push(prism(s-1,s+Lt+1,hs,'sub'));
    const m2=build(f);m2.win=win;m2.notes=notes;return m2;
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
  root.HabitatParts={rectLid,lightWindows,RAIL,CLIP,PEG,dish,pot,twig,ledge,label,light,roundEnclosure,rectBase,perimeter};
})(typeof window!=='undefined'?window:globalThis);
