/* Habitat parts: accessory and round-enclosure designs, built with lib/geo.js.
   Every builder works in the part's print orientation (Z up from the bed) and returns closed meshes. */
(function(root){
  const G=root.Geo;
  const {prism,varying,rect,rrect,circle,ellipse,ngon,polar,wobble,offset,intersect,subtract,unite,yDisc,build}=G;

  /* ---- pin rails on printed mesh panels ----
     Both faces of the panel stay flat. Every 40 mm up the wall there is a solid band with square holes every 20 mm,
     open to the inside. A piece lies flat against the wall on a back tab with two holes 20 mm apart; a printed snap pin
     goes through the tab into the wall and clicks behind it. Squeeze the split tip from outside to take it off.
     In accessory coordinates the body's back is y=0, against the wall. */
  const RAIL={pitch:40,step:20,band:12,hole:3.8,tongue:2.4,front:0};
  /* the tab below a piece: two holes 20 mm apart, low enough that the pin heads sit under the body */
  const CLIP={t:2.4,holeY:5,holeR:2.15,headR:4.5,clearZ:10.5,tabW:32,maxW:32};
  function clipTab(cx){return {shape:rrect(cx-CLIP.tabW/2,0,cx+CLIP.tabW/2,CLIP.clearZ+4,1.5),holes:[-1,1].map(k=>circle(cx+k*RAIL.step/2,CLIP.holeY,CLIP.holeR,28)[0])}}
  /* the snap pin, printed head down: shaft through the tab and the panel, a split tip with a barb that clicks behind the panel */
  function railPin(Tw){
    const L=CLIP.t+Tw+.3,h=1.4,r=1.75,f=[prism(0,1,circle(0,0,CLIP.headR,40)),prism(.99,h,circle(0,0,CLIP.headR-.4,40)),prism(h-.01,h+L,circle(0,0,r,28))];
    const z=h+L;f.push(prism(z-.01,z+.6,circle(0,0,2.2,28)),prism(z+.59,z+1.1,circle(0,0,1.95,28)),prism(z+1.09,z+1.6,circle(0,0,1.7,28)));
    f.push(prism(z-2.2,z+2,rect(-.5,-3,.5,3),'sub'));
    return build(f);
  }
  /* ---- plan shapes for bodies: x centred on 0, the back at y=0 ---- */
  function body2D(kind,L,W,seed){
    let r;
    if(kind==='round')r=circle(0,L/2,L/2);
    else if(kind==='oval')r=ellipse(0,W/2,L/2,W/2);
    else if(kind==='hex'){r=ngon(0,0,L/2,6,0).map(q=>q.map(([x,y])=>[x,y*W/L+W/2]))}
    else if(kind==='square')r=rrect(-L/2,0,L/2,W,Math.min(L,W)*.18);
    else if(kind==='pebble'){const w=wobble(seed||1,.14,5);r=polar(0,W/2,a=>{const c=Math.cos(a),s=Math.sin(a),e=1/Math.sqrt(c*c/(L*L/4)+s*s/(W*W/4));return e*(1+w(a))})}
    else if(kind==='leaf'){const o=[],n=60;for(let i=0;i<=n;i++){const t=i/n,hw=(W/2)*Math.pow(Math.sin(Math.PI*t),.85);o.push([-L/2+L*t,hw])}for(let i=n-1;i>0;i--){const t=i/n,hw=(W/2)*Math.pow(Math.sin(Math.PI*t),.85)*.92;o.push([-L/2+L*t,-hw])}r=[o.map(([x,y])=>[x,y+W/2])]}
    else if(kind==='leaf'&&false){}
    else if(kind==='shield'){/* a heater shield: straight top, sides curving to a point */const o=[[-L/2,W]];for(let i=0;i<=30;i++){const t=i/30;o.push([L/2*(1-t*t),W-W*t])}for(let i=29;i>0;i--){const t=i/30;o.push([-L/2*(1-t*t),W-W*t])}r=[o]}
    else if(kind==='fluted'){/* a round dish with fine flutes round its side, like a classical patera */r=polar(0,W/2,a=>{const c=Math.cos(a),s=Math.sin(a),e=1/Math.sqrt(c*c/(L*L/4)+s*s/(W*W/4));return e-1.1*(.5+.5*Math.cos(32*a))},256)}
    else if(kind==='flower'){/* six soft petals round an oval */r=polar(0,W/2,a=>{const c=Math.cos(a),s=Math.sin(a),e=1/Math.sqrt(c*c/(L*L/4)+s*s/(W*W/4));return e*(.9+.1*Math.cos(6*a))},180)}
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
    for(const x of xs)f.push(G.yMag(x,zc,md,-bt-1,-bt+pd,'sub'));
    return xs.length;
  }
  /* an upright body (back at y=0, printed standing): a back plate whose wings reach past the body, with pin holes in them */
  function clipBack(f,{w,h}){
    const ph=Math.max(h,16),sp=Math.max(RAIL.step,Math.ceil((w+2*CLIP.headR+2)/RAIL.step)*RAIL.step),zc=Math.min(ph/2,ph-CLIP.headR-1.5);
    f.push(prism(0,ph,rrect(-sp/2-5.5,-CLIP.t,sp/2+5.5,.6,1)));
    for(const x of [-sp/2,sp/2])f.push(G.yDisc(x,zc,CLIP.holeR,-CLIP.t-1,1,'sub'));
    return ph;
  }
  /* the floor peg socket: a hole from underneath, inside a solid hub */
  const PEG={r:4,h:5,sock:4.2,depth:5.6,hub:7.5};

  /* ---------------- pearl dish ---------------- */
  function dish(o){
    /* a wide, shallow bowl with a flat floor: the sides curve in gently near the floor, so the beads roll to the
       middle and there are no pits. With a floor peg the whole floor is thick enough for the socket. */
    const out=body2D(o.shape,o.L,o.W,o.seed),peg=o.mount==='peg',fl=peg?PEG.depth+1.2:2,top=fl+o.depth,f=[],notes=[],b=bounds(out);
    const rim=Math.min(8,(Math.min(b.x1-b.x0,b.y1-b.y0)/2-o.wall)*.45);
    f.push(prism(0,top,out));
    f.push(varying(fl,top+1,z=>{const t=Math.min(1,(z-fl)/o.depth);return offset(out,-(o.wall+rim*(1-t)*(1-t)))},.3,'sub'));
    if(peg)f.push(prism(-1,PEG.depth,circle(b.cx,b.cy,PEG.sock),'sub'));
    let magnets=0;
    addMount(f,o,b,top,out);
    if(o.mount==='magnet')magnets=magnetBack(f,{w:Math.min(b.x1-b.x0,60),h:top,md:o.md,mh:o.mh});
    return {parts:[{file:'pearl-dish.stl',role:'Main colour',m:build(f)}],notes,magnets};
  }
  /* connector between a rounded body and its back plate, so the curve meets the plate along a band */
  function addMount(f,o,b,h,out){
    if(o.mount!=='magnet'&&o.mount!=='clip')return;
    const w=Math.min(b.x1-b.x0,o.mount==='clip'?Math.max(20,(b.x1-b.x0)*.7):60)*.9;
    f.push(prism(0,h,intersect(rect(-w/2,0,w/2,b.cy),unite(offset(out,-.3),rect(-w/2,0,w/2,1)))));
    if(o.mount==='clip')clipBack(f,{w:2*Math.max(-b.x0,b.x1),h});
  }


  /* ---------------- surface profiles for pots and planters ----------------
     Each gives how far in (0..amp mm) the wall sits at a distance s along it, so a fluted, bamboo or stone face is
     still just an outline: the wall stays upright and prints without supports. */
  const PROFILES={
    flutes:{name:'Fluted',f:s=>2.5*(.5+.5*Math.cos(2*Math.PI*s/12)),lam:12},
    waves:{name:'Waves',f:s=>6*(.5+.5*Math.cos(2*Math.PI*s/40)),lam:40},
    zigzag:{name:'Zigzag',f:s=>{const u=((s/20)%1+1)%1,v=2*u-1,e=.004;return 5*(Math.sqrt(v*v+e)-Math.sqrt(e))/(Math.sqrt(1+e)-Math.sqrt(e))},lam:20},
    scallops:{name:'Scallops',f:s=>{const u=((s/24)%1+1)%1,v=2*u-1;return 5*(1-Math.sqrt(Math.max(0,1-v*v)))},lam:24},
    bamboo:{name:'Bamboo stalks',f:s=>{const u=((s/14)%1+1)%1,v=2*u-1;return 3.2*(1-Math.sqrt(Math.max(0,1-v*v)))},lam:14},
    stones:{name:'Stones',f:(s,seed)=>{const R=k=>{const x=Math.sin((k+1)*12.9898+(seed||1)*78.233)*43758.5453;return x-Math.floor(x)};
      let k=0,a=0;for(;;){const w=14+16*R(k);if(a+w>s){const v=2*(s-a)/w-1;return 1+(2+3*R(k+50))*(1-Math.sqrt(Math.max(0,1-v*v)))}a+=w;k++;if(k>4000)return 1}},lam:0},
    bark:{name:'Bark',f:(s,seed)=>{const p=(seed||1)*1.7;return 1.6+1.1*Math.sin(s*.31+p)+.6*Math.sin(s*1.13+2*p)+.4*Math.sin(s*2.7+p)},lam:0},
    straight:{name:'Smooth',f:()=>0,lam:0}
  };
  /* an outline pushed in along its normals by a profile, sampled every 0.6 mm (CCW outer ring) */
  function textured(rings,kind,seed){
    const P=PROFILES[kind];if(!P||kind==='straight')return rings;
    return rings.map(r=>{const q=[],n=r.length;let L=0;const seg=[];for(let i=0;i<n;i++){const a=r[i],b=r[(i+1)%n];seg.push(Math.hypot(b[0]-a[0],b[1]-a[1]));L+=seg[i]}
      const cw=(()=>{let A=0;for(let i=0;i<n;i++){const a=r[i],b=r[(i+1)%n];A+=a[0]*b[1]-b[0]*a[1]}return A<0})();
      /* a whole number of repeats around the outline, so the pattern meets itself */
      const sc=P.lam?L/(Math.max(1,Math.round(L/P.lam))*P.lam):1;
      let s=0;for(let i=0;i<n;i++){const a=r[i],b=r[(i+1)%n],l=seg[i];if(l<1e-9)continue;const tx=(b[0]-a[0])/l,ty=(b[1]-a[1])/l,nx=cw?-ty:ty,ny=cw?tx:-tx;
        const m=Math.max(1,Math.ceil(l/.8));for(let j=0;j<m;j++){const t=j/m*l,d=P.f((s+t)/sc,seed);q.push([a[0]+tx*t-nx*d,a[1]+ty*t-ny*d])}s+=l}
      return q}).flatMap(q=>{/* corners push the pattern inward from two sides: tidy the crossings and near-duplicate points */
        const CL=root.ClipperLib,K=1000,p=CL.Clipper.CleanPolygon(q.map(([x,y])=>({X:Math.round(x*K),Y:Math.round(y*K)})),20);
        return G.unite([p.map(v=>[v.X/K,v.Y/K])])})}
  /* ---------------- plant pot ---------------- */
  function pot(o){
    /* a textured surface goes round softened corners, so the pattern never folds over itself at a sharp corner */
    const sf=o.surface||'straight',b0=body2D(o.shape,o.L,o.W,o.seed),base=sf==='straight'?b0:textured(offset(offset(b0,-6),6),sf,o.seed),b=bounds(base),f=[],notes=[];
    const raise=o.drain?3:0,fl=2,H=o.H,tp=sf==='straight'?(o.taper||0)/100:0;/* textured pots have straight sides */
    const at=z=>scaleAbout(base,1+tp*z/H,b.cx,b.cy);
    const hub=o.mount==='peg'?circle(b.cx,b.cy,PEG.hub):null;
    const inner=z=>{let c=offset(at(z),-o.wall);if(hub&&z<raise+fl+PEG.depth)c=subtract(c,hub);return c};
    if(tp){f.push(varying(0,H,at,1));f.push(varying(raise+fl,H+.01,inner,1,'sub'))}
    else{f.push(prism(0,H,base));f.push(prism(raise+fl,H+1,offset(base,-o.wall),'sub'))}
    if(hub){f.push(prism(0,raise+fl+PEG.depth,hub));f.push(prism(-1,PEG.depth,circle(b.cx,b.cy,PEG.sock),'sub'))}
    /* the pot stands flat on the bed; channels underneath, one under each row of holes, let water run out */
    const feet=[],rows=[];for(let y=b.y0;y<=b.y1;y+=8)rows.push(y);
    if(raise){let ch=[];for(const y of rows)ch.push(...rect(b.x0-2,y-1.2,b.x1+2,y+1.2));if(hub)ch=subtract(ch,circle(b.cx,b.cy,PEG.hub+1));f.push(prism(-1,raise,ch,'sub'))}
    if(o.drain){
      const area=offset(base,-o.wall-2.5);let n=0;
      for(let x=b.x0;x<=b.x1;x+=8)for(const y of rows){
        const c=circle(x,y,1.1,16);if(intersect(c,area).length!==1||Math.abs(G.area(intersect(c,area))-G.area(c))>.01)continue;
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
      if(o.mount==='clip')clipBack(f,{w:2*bot,h:H});
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
      if(o.shape==='stump'){
        /* a tree stump: bark grooves round it and roots spreading at the foot, flaring at 45° or less */
        const rt=top+3.4,wv2=wobble(o.seed||3,.05,3);
        f.push(varying(0,H,z=>polar(0,0,a=>{const fl=Math.max(0,1-z/7);return rt*(1+wv2(a))+7*fl*Math.pow(.5+.5*Math.cos(5*a+1),2)+.5*Math.sin(17*a)},72),.8))}
      else if(o.shape==='tower'){
        /* a round castle tower: a wider footing, the tower, a corbelled ring under the top and battlements round
           the socket; the corbel steps out at 45° */
        const rt=top+3.2,zc=H-7;
        f.push(varying(0,3,z=>circle(0,0,rt+3-z*.6,96),.3),prism(3,zc,circle(0,0,rt,96)),varying(zc,zc+2,z=>circle(0,0,rt+(z-zc),96),.25),
          prism(zc+2,H,subtract(circle(0,0,rt+2,96),circle(0,0,rs+1.6,48))),prism(zc+2,H-3.5,circle(0,0,rt+2,96)));
        for(let i=0;i<8;i++){const a=i*Math.PI/4+Math.PI/8;f.push(prism(H-3.5,H+1,G.rect(-1.6,0,1.6,rt+4).map(r=>r.map(([x,y])=>[x*Math.cos(a)-y*Math.sin(a),x*Math.sin(a)+y*Math.cos(a)])),'sub'))}}
      else if(o.shape==='candle'){
        /* a gothic candlestick: a round foot, a turned baluster stem and a drip pan; the twig stands where the candle
           would. Every step in the profile is 45° or less */
        const rt=top+1.2,prof=z=>{const t=z/H;if(t<.12)return bot*.95-(z)*.6;if(t<.2)return rt+2.4+(.2-t)*H*.9;if(t<.42)return rt+.6+2.6*Math.sin(Math.PI*(t-.2)/.22);
          if(t<.55)return rt;if(t<.68)return rt+(t-.55)*H*.9;if(t<.8)return rt+.13*H*.9-(t-.68)*H*.9*.6;return rt+.13*H*.9*.4+(t>.92?(t-.92)*H:0)};
        f.push(varying(0,H,z=>circle(0,0,Math.max(rt,prof(z)),96),.3))}
      else if(o.shape==='column'){
        /* a little Doric column: square plinth, a round base, a fluted shaft, a flaring capital under a square abacus.
           The capital flares at 45° to the abacus corners, so nothing overhangs */
        const rsh=top+2.5,hs=rsh+1.7,Re=hs*Math.SQRT2,zc=Math.max(10,H-2-(Re-rsh));
        f.push(prism(0,3,G.rrect(-rsh-3.2,-rsh-3.2,rsh+3.2,rsh+3.2,.8)),varying(3,5,z=>circle(0,0,rsh+1.6-(z-3)*.8,96),.25),
          prism(5,zc,polar(0,0,a=>rsh-.8*(.5+.5*Math.cos(16*a)),160)),varying(zc,H-2,z=>{const r=rsh+(z-zc);return intersect(circle(0,0,r,96),rect(-hs,-hs,hs,hs))},.3),prism(H-2,H,rect(-hs,-hs,hs,hs)))}
      else if(o.shape==='cylinder'){f.push(prism(0,H,at(0)),prism(0,3,circle(0,0,bot*.9,96)))}else f.push(varying(0,H,at,.6));
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
    /* a cloud: puffs along the front edge */
    if(shape==='cloud'){let c=rect(-L/2+D*.3,0,L/2-D*.3,D*.5);const n=Math.max(3,Math.round(L/(D*.55)));for(let i=0;i<n;i++){const t=i/(n-1),x=-L/2+D*.32+t*(L-D*.64),r=D*(.3+.12*Math.sin(i*2.1+seed));c=unite(c,circle(x,D-r,r,48))}return unite(c,rect(-L*.35,0,L*.35,Math.min(6,D/3)))}
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
    all=offset(offset(all,.4),-.4);all=offset(offset(all,-lw*.35),lw*.35);return intersect(all,top);
  }
  /* The shelf prints on its back, so u (out from the wall) is the print height. Every hole in a see-through shelf
     gets a pointed top: going up, a hole may only narrow by one layer height per layer, so nothing spans thin air.
     Works on the slices themselves, from the top layer down; returns the slices to print at any u. */
  function pointedHoles(body,uMax,dz){
    const N=Math.ceil(uMax/dz)+1,L=new Array(N+1),BIG=1e6;let above=null;
    for(let i=N;i>=0;i--){const u=i*dz,M=G.slice(body,u).sort((a,b)=>a[0]-b[0]);
      if(!above||!above.length||!M.length){L[i]=M.length||!above?M:above.map(([a,c])=>[a+dz,c-dz]).filter(([a,c])=>c-a>.4);above=L[i];continue}
      /* where the layer above is empty, widened by dz: only there may this layer be empty too */
      const up=[];let x=-BIG;for(const [a,c] of above){if(a>x)up.push([x-dz,a+dz]);x=Math.max(x,c)}up.push([x-dz,BIG]);
      const gaps=[[-BIG,M[0][0]]];for(let k=1;k<M.length;k++)gaps.push([M[k-1][1],M[k][0]]);gaps.push([M[M.length-1][1],BIG]);
      const V=[];
      gaps.forEach(([a,c],k)=>{let keep=up.map(([p,q])=>[Math.max(a,p),Math.min(c,q)]).filter(([p,q])=>q-p>.05);
        /* a hole closed above gets a pointed top */
        if(!keep.length&&k>0&&k<gaps.length-1){const m=(a+c)/2;keep=[[Math.max(a,m-dz),Math.min(c,m+dz)]]}
        V.push(...keep)});
      const out=[];for(let k=1;k<V.length;k++)if(V[k][0]-V[k-1][1]>.01)out.push([V[k-1][1],V[k][0]]);
      L[i]=out;above=out}
    return u=>L[Math.max(0,Math.min(N,Math.round(u/dz)))];
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
    /* back plate outline on the wall: rounded, a little irregular (or square), straight along the bottom for the pin-rail tab */
    const PL=o.L*1.12,wv=wobble(seed+7,o.shape==='classic'||o.shape==='square'?.0:.09,5);
    let plate=o.shape==='square'?rect(-PL/2,0,PL/2,Hb):o.shape==='classic'?rrect(-PL/2,0,PL/2,Hb,6):polar(0,Hb/2,a=>{const c=Math.cos(a),s=Math.sin(a),e=1/Math.sqrt(c*c/(PL*PL/4)+s*s/(Hb*Hb/4));return e*(1+wv(a))},120);
    plate=unite(plate,rrect(-PL/2,Math.max(0,zs0-Hd-4),PL/2,zs0+st+4,3));
    const tab=clip?clipTab(0):null;
    if(clip)plate=unite(intersect(plate,rect(-o.L,CLIP.clearZ,o.L,Hb*2)),unite(tab.shape,rect(-CLIP.tabW/2+4,0,CLIP.tabW/2-4,zs0+st)));
    f.push(prism(0,bt,plate));
    const slice=(rings,u)=>G.slice(rings,u);
    for(const t of tiers){
      const zs=zs0+t.dz*step,top=G.move(ledgeOutline(o.shape==='tiered'?'fungus':o.shape,t.L,t.D,t.s),t.dx,0);
      const open=openwork(top,o,t.L,t.D,t.s),body=open||top,zA=bt-.01,zMax=zA+.3*Math.ceil(o.dep*1.3/.3);
      /* underside: D (quarter round), wedge, or ribs. Each layer sits inside the one below, so no supports. */
      const hd=Hd*(t.D/o.dep),hfun=u=>under==='D'?hd*Math.sqrt(Math.max(0,1-(u/t.D)**2)):under==='flat'?0:hd*Math.max(0,1-u/t.D);
      const ribs=under==='ribs'?intersect(body,unite((t.L>60?[-t.L/3,0,t.L/3]:[-t.L/4,t.L/4]).map(x=>rect(t.dx+x-1.6,0,t.dx+x+1.6,t.D)[0]).map(r=>[r]).flat())):null;
      const sl=pointedHoles(body,zMax-zA+.6,.3);
      f.push(varying(zA,zMax,z=>{const u=z-bt,hv=Math.round(hfun(u)/.1)*.1,deep=hv>=.4&&!ribs?zs-hv:zs;
        const out=sl(u).map(([a,c])=>[[a,deep],[c,deep],[c,zs+st],[a,zs+st]]);
        if(ribs&&hv>=.4)for(const [a,c] of slice(ribs,u))out.push([[a,zs-hv],[c,zs-hv],[c,zs+st],[a,zs+st]]);
        return out},.3));
      if(!open){
        const rid=o.shape==='leaf'?intersect(unite(G.stroke([[[t.dx,2],[t.dx,t.D*.92]]],1.4)),offset(top,-1.5)):(()=>{const bands=[];for(let d=4;d<t.D;d+=4.5){const a=offset(top,-d),b=offset(top,-d-1.1);if(!a.length)break;bands.push(...subtract(a,b))}return intersect(unite(bands),rect(-o.L,3,o.L,o.dep*2))})();
        const rim=o.shape==='leaf'?[]:intersect(subtract(offset(top,-.05),offset(top,-1.6)),rect(-o.L,3,o.L,o.dep*2));
        if(rid.length)f.push(varying(zA,zMax,z=>slice(rid,z-bt).map(([a,c])=>[[a,zs+st-.01],[c,zs+st-.01],[c,zs+st+.5],[a,zs+st+.5]]),.3));
        if(rim.length)f.push(varying(zA,zMax,z=>slice(rim,z-bt).map(([a,c])=>[[a,zs+st-.01],[c,zs+st-.01],[c,zs+st+.6],[a,zs+st+.6]]),.3));
      }
    }
    let magnets=0;
    if(mag){const y=Hb-R-4,xs=o.L>=4*R+16?[-o.L/4,o.L/4]:[0];for(const x of xs)f.push(prism(-1,pd,G.mag(x,y,md),'sub'));magnets=xs.length}
    if(clip)f.push(prism(-1,bt+1,tab.holes,'sub'));
    if(o.pattern&&o.pattern!=='solid')notes.push('The see-through pattern prints as is, with lines at least '+Math.max(1.6,o.lw||2.2).toFixed(1)+' mm wide. Tap Shuffle shape for a different version.');
    return {parts:[{file:'wall-ledge.stl',role:'Main colour',m:build(f)}],notes,magnets};
  }

  /* ---------------- label holder: printed flat on its back ---------------- */
  function label(o){
    const clip=o.mount==='clip',mag=o.mount==='magnet',R=o.md/2+.2,pd=o.mh+.2;
    const sp=4,ov=3,pt=clip?RAIL.tongue:mag?Math.max(2,pd+1.4):2,Lp=o.cw+2*sp,drop=clip?CLIP.clearZ:0,Hp=o.ch+sp-3+drop;
    const tab=clip?clipTab(0):null,shape=clip?unite(rrect(-Lp/2,drop,Lp/2,Hp,4),tab.shape):rrect(-Lp/2,0,Lp/2,Hp,4),pf=[prism(0,pt,shape)];let magnets=0;
    if(mag){const y=drop+(Hp-drop)/2,xs=Lp>=4*R+16?[-Lp/4,Lp/4]:[0];for(const x of xs)pf.push(prism(-1,pd,G.mag(x,y,o.md),'sub'));magnets=xs.length;}
    if(clip)pf.push(prism(-1,pt+1,tab.holes,'sub'));
    const gz=.8,lz=1.2,y0=drop;
    const spacer=intersect(shape,unite(rect(-Lp/2,y0,-Lp/2+sp,Hp),unite(rect(Lp/2-sp,y0,Lp/2,Hp),rect(-Lp/2,y0,Lp/2,y0+sp))));
    const lips=intersect(shape,unite(rect(-Lp/2,y0,-Lp/2+sp+ov,Hp),unite(rect(Lp/2-sp-ov,y0,Lp/2,Hp),rect(-Lp/2,y0,Lp/2,y0+sp+ov))));
    /* the frame prints on its own, lips down on the bed, so the lips never hang over the card slot. Three small pins on
       its back press into holes in the plate, so it needs no glue */
    const ym=y0+(Hp-y0)/2,pins=[[-Lp/2+sp/2,ym],[Lp/2-sp/2,ym],[0,y0+sp/2]];
    const ff=[prism(0,lz,lips),prism(lz,lz+gz,spacer),prism(lz+gz-.01,lz+gz+1.8,pins.map(([x,y])=>circle(x,y,1.2,20)[0]))];
    pf.push(prism(pt-2.2,pt+1,pins.map(([x,y])=>circle(x,y,1.1,20)[0]),'sub'));
    const notes=[];if(mag&&o.ch<2*R+2)notes.push('The card is too short for the magnets. Make it taller.');
    notes.push('The frame prints separately, face down. Press its three pins into the holes in the plate; the top stays open for the card. Print it in a second colour if you like.');
    return {parts:[{file:'label-plate.stl',role:'Main colour',m:build(pf)},{file:'label-frame.stl',role:'Second file',m:build(ff)}],notes,magnets};
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
    if(hatch){const {Rh,hx,hy}=hatch;lf.push(prism(0,boss,subtract(circle(hx,hy,Rh+12),circle(hx,hy,Rh))),prism(-1,boss+1,circle(hx,hy,Rh),'sub'));for(const x of [hx-(Rh+6),hx+Rh+6])lf.push(prism(-1,pd,G.mag(x,hy,md),'sub'))}
    const hs=[];
    if(win)addWindows(lf,hs,win,p,0,Lt,false,preview);
    if(!preview){
      const pitch=p.hole+p.bar;
      for(let x=-ia;x<ia;x+=pitch)for(let y=-ib;y<ib;y+=pitch){
        const c=[[x,y],[x+p.hole,y],[x+p.hole,y+p.hole],[x,y+p.hole]];
        if(!c.every(([u,v])=>inEl(u,v,0)))continue;
        if(hatch&&c.some(([u,v])=>Math.hypot(u-hatch.hx,v-hatch.hy)<hatch.Rh+13))continue;
        if(win&&c.some(([u,v])=>win.centers.some(([cx,cy])=>Math.hypot(u-cx,v-cy)<win.Rw+3+LAMP_COLLAR)))continue;
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
  /* under a lamp: wide ring slots split by six spokes, clearly more open than the vent holes in the rest of the lid */
  function lampSlots(cx,cy,Rin){
    const out=[],sw=.9,slot=2.4,bar=1.2;
    for(let r0=4;r0+slot<=Rin;r0+=slot+bar){const r1=r0+slot;
      for(let j=0;j<6;j++){const b0=j*Math.PI/3,b1=b0+Math.PI/3,q=[],arc=(r,f)=>{const d=Math.asin(Math.min(.9,sw/r)),a0=b0+d,a1=b1-d,n=Math.max(3,Math.ceil((a1-a0)*r/1.5));for(let i=0;i<=n;i++){const t=f?a0+(a1-a0)*i/n:a1-(a1-a0)*i/n;q.push([cx+r*Math.cos(t),cy+r*Math.sin(t)])}};
        arc(r1,true);arc(r0,false);out.push(q)}}
    return out;
  }
  /* the solid collar round each lamp area: the lamp seat rests on it, and the vent holes stay outside it */
  const LAMP_COLLAR=7;
  function addWindows(f,hs,w,p,z0,z1,topAtZ1,preview){
    const dr=1.0;
    for(const [cx,cy] of w.centers){
      if(w.mode==='insert'){
        f.push(prism(z0-1,z1+1,circle(cx,cy,w.Rw),'sub'));
        f.push(topAtZ1?prism(z1-dr,z1+1,circle(cx,cy,w.Rw+3),'sub'):prism(z0-1,z0+dr,circle(cx,cy,w.Rw+3),'sub'));
      }else hs.push(...lampSlots(cx,cy,w.Rw+3));
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
        if(win&&q.some(([u,v])=>win.centers.some(([cx,cy])=>Math.hypot(u-cx,v-cy)<win.Rw+3+LAMP_COLLAR)))continue;
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
  /* a wall mount behind an upright body (back at y=0): returns the number of magnets */
  function mountWall(f,o,b,h,out){addMount(f,o,b,h,out);return o.mount==='magnet'?magnetBack(f,{w:Math.min(b.x1-b.x0,60),h,md:o.md,mh:o.mh}):0}
  root.HabitatParts={PROFILES,textured,rectLid,lightWindows,RAIL,CLIP,PEG,clipTab,railPin,lampSlots,LAMP_COLLAR,dish,pot,twig,ledge,label,light,roundEnclosure,rectBase,perimeter,body2D,fit,bounds,bez,curl,mountWall,LEDGE_PATTERNS};
})(typeof window!=='undefined'?window:globalThis);
