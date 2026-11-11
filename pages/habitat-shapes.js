/* Habitat, more enclosure shapes. Clear walls are always flat acrylic or bent PET sheet, never printed:
   - corner: two straight walls that meet at a right angle at the back and a quarter-round front, for a room or
     shelf corner. One sheet of PET (or a printed mesh wall) runs all the way round in the base groove.
   - dome: a faceted glass-house dome. A straight PET wall stands in the base; on it sits a ring, ribs rise from the
     ring to a mesh cap, and flat PET panels spring into slots in the ribs.
   - cage: a Victorian birdcage: a round mesh cage with a bell-shaped top, printed standing in one piece, on a base.
   - nursery: a cabinet of drawers for nymphs. Each cubby is printed on its own and joins its neighbours with keys,
     so the cabinet can be any size.
   - book panels: printed panels that turn a rectangular enclosure into a book on a shelf (spine, cover, pages).
   Coordinates: x right, y back, z up, millimetres. */
(function(root){
  const G=root.Geo,HE=root.HabitatEnclosure;
  const {rect,rrect,circle,ngon,offset,intersect,subtract,unite,prism,build,varying}=G;
  const {sin,cos,PI,min,max,abs,sqrt,hypot,floor,ceil,round,atan2}=Math;
  const TAU=PI*2,U=(...a)=>{let r=null;for(const x of a)if(x&&x.length)r=r?unite(r,x):x;return r||[]};
  const sq=(x,y,s)=>[[x,y],[x+s,y],[x+s,y+s],[x,y+s]];
  const sarea=r=>{let a=0;for(let i=0;i<r.length;i++){const [x0,y0]=r[i],[x1,y1]=r[(i+1)%r.length];a+=x0*y1-x1*y0}return a/2};

  /* ---------- a printed mesh wall that follows any closed outline ----------
     ring: points of the outline (the groove centre). Holes are in columns along the outline and rows up the wall. */
  function pathTube(ring,Ht,wt,p,preview){
    let pts=ring.slice();if(sarea(pts)<0)pts.reverse();
    const n=pts.length,cum=[0];for(let i=1;i<=n;i++){const a=pts[i-1],b=pts[i%n];cum.push(cum[i-1]+hypot(b[0]-a[0],b[1]-a[1]))}
    const per=cum[n],pitch=p.hole+p.bar;
    const at=s=>{s=((s%per)+per)%per;let lo=0,hi=n;while(hi-lo>1){const m=(lo+hi)>>1;if(cum[m]<=s)lo=m;else hi=m}
      const a=pts[lo],b=pts[(lo+1)%n],f=(s-cum[lo])/(cum[lo+1]-cum[lo]||1),x=a[0]+(b[0]-a[0])*f,y=a[1]+(b[1]-a[1])*f;
      /* outward normal, smoothed over the neighbouring segments so rounded corners stay smooth */
      const c=pts[(lo-1+n)%n],d=pts[(lo+2)%n],t0=[b[0]-a[0],b[1]-a[1]],t1=f<.5?[a[0]-c[0],a[1]-c[1]]:[d[0]-b[0],d[1]-b[1]],w=f<.5?.5-f:f-.5;
      let tx=t0[0]/(hypot(...t0)||1)*(1-w)+t1[0]/(hypot(...t1)||1)*w,ty=t0[1]/(hypot(...t0)||1)*(1-w)+t1[1]/(hypot(...t1)||1)*w;const l=hypot(tx,ty)||1;
      return [x,y,ty/l,-tx/l]};
    const ncol=max(8,floor(per/pitch)),us=new Set([0,per]),cols=[];
    for(let j=0;j<ncol;j++){const s0=j*per/ncol+p.bar/2,s1=s0+p.hole;cols.push([s0,s1]);us.add(+s0.toFixed(4));us.add(+s1.toFixed(4))}
    const Uv=[...us].sort((a,b)=>a-b),Wz=new Set([0,Ht]),rows=[];
    if(!preview)for(let z=8;z+p.hole<Ht-8;z+=pitch){rows.push([z,z+p.hole]);Wz.add(+z.toFixed(4));Wz.add(+(z+p.hole).toFixed(4))}
    const Z=[...Wz].sort((a,b)=>a-b),inCol=u=>!preview&&cols.some(([a,b])=>u>a&&u<b),inRow=z=>rows.some(([a,b])=>z>a&&z<b);
    /* no holes where the outline turns a tight corner: they would tear */
    return G.gridMesh(Uv,[-wt/2,wt/2],Z,(i,j,k)=>!(inCol((Uv[i]+Uv[i+1])/2)&&inRow((Z[k]+Z[k+1])/2)),(u,v,w)=>{const [x,y,nx,ny]=at(u);return [x+v*nx,y+v*ny,w]},true);
  }
  function perimeterOf(ring){let s=0;for(let i=0;i<ring.length;i++){const a=ring[i],b=ring[(i+1)%ring.length];s+=hypot(b[0]-a[0],b[1]-a[1])}return s}

  /* ---------- corner enclosure ---------- */
  function cornerEnclosure(p,preview){
    const W=p.W,meshWall=p.roundWall==='mesh',wt=meshWall?2.4:p.ts,gw=wt+.6,s=6,Lt=2.4,S=p.S,H=p.H,rc=12;
    /* the right angle sits at the back left (0,W); the quarter circle bulges towards the front right */
    const raw=[[0,W],[W,W]];for(let i=1;i<48;i++){const a=-i/48*PI/2;raw.push([W*cos(a),W+W*sin(a)])}raw.push([0,0]);
    const C=offset(offset([raw],-rc),rc);
    const bs=HE.base(C,{gw,wall:2.4,S,s,f:2.4,join:'round'},p);
    const L=HE.lid(C,{gw,wall:2.4,s,Lt,join:'round',centre:[W*.36,W*.64],alongY:false},p,preview);
    const tube=meshWall?pathTube(C[0],H-.5,wt,p,preview):null;
    return {base:bs,lid:L,tube,C,S,H,Lt,s,gw,sheet:meshWall?null:[perimeterOf(C[0])+15,H-.5],pegs:bs.pegs,notes:L.notes};
  }

  /* ---------- faceted dome ---------- */
  function domeGeom(p){
    const n=max(6,min(10,round(p.sides||8))),Rf=p.W/2,Rc=Rf/cos(PI/n),gw=p.ts+.6,wall=2.4;
    /* the straight wall's groove runs round an n-sided outline; ribs stand at its corners */
    const C=[[...Array(n)].map((_,i)=>{const a=(i+.5)*TAU/n-PI/2;return [Rc*cos(a),Rc*sin(a)]})];
    const R0=Rc-(gw/2+wall+1),m=3,rib={w:8,t:6,sd:2.1,d0:2.4,sw:1.3};
    /* the rim of the cap has to hold the 9 cm lamp: at least 55 mm out from the middle */
    const rcap=max(58,R0*.38),Th=Math.acos(min(.95,rcap/R0)),lv=[];
    for(let k=0;k<=m;k++){const th=Th*k/m;lv.push({th,r:R0*cos(th),z:R0*sin(th)})}
    const phi=[...Array(n)].map((_,i)=>(i+.5)*TAU/n-PI/2);
    return {n,Rf,Rc,C,R0,m,rib,lv,phi,rcap,gw,wall};
  }
  /* one rib, drawn flat: x = distance from the middle, y = height above the ring, z = thickness */
  function domeRib(g,Lt){
    const {lv,rib}=g,w=rib.w,m=g.m,O=lv.map(l=>[l.r,l.z]),I=lv.map(l=>[l.r-w*cos(l.th),l.z-w*sin(l.th)]),top=lv[m];
    let poly=[...O,[top.r-w,top.z],...I.slice().reverse()];
    let shape=U([poly],rect(g.R0-w,-Lt,g.R0,.6),rect(top.r-w+.5,top.z-1,top.r-.5,top.z+Lt));
    const f=[prism(0,rib.t,shape)];
    /* slots on both faces for the panels: they lean in towards the next rib, so the slot leans out as it goes in */
    const tb=Math.tan(PI/g.n),band=(d0,d1)=>{const out=[];for(let k=0;k<m;k++){const a=lv[k],b=lv[k+1],na=[cos(a.th),sin(a.th)],nb=[cos(b.th),sin(b.th)];
      const P=(l,nn,d)=>[l.r-nn[0]*d,l.z-nn[1]*d];out.push([P(a,na,d0),P(b,nb,d0),P(b,nb,d1),P(a,na,d1)])}
      return U(...out.map(q=>[sarea(q)<0?q.reverse():q]))};
    const dz=.3;
    f.push(varying(-.01,rib.sd,z=>{const d=rib.d0-max(0,z)*tb;return band(d,d+rib.sw)},dz,'sub'));
    f.push(varying(rib.t-rib.sd,rib.t+.01,z=>{const d=rib.d0-max(0,rib.t-z)*tb;return band(d,d+rib.sw)},dz,'sub'));
    return build(f);
  }
  function domeEnclosure(p,preview){
    const g=domeGeom(p),gw=g.gw,s=6,Lt=2.4,S=p.S,H=p.H,notes=[];
    const bs=HE.base(g.C,{gw,wall:2.4,S,s,f:2.4,join:'miter'},p);
    /* the ring on top of the straight wall: printed upside down like a lid, with rails that grip the sheet, and a
       socket at each corner for a rib's foot */
    const ob=gw/2+2.4,outer=offset(g.C,ob,'miter'),oG=offset(g.C,gw/2,'miter'),iG=offset(g.C,-gw/2,'miter'),inner=offset(g.C,-ob,'miter');
    const plateIn=offset(g.C,-ob-g.rib.w-4,'miter'),rf=[prism(0,Lt,subtract(outer,plateIn)),prism(Lt-.01,Lt+s,subtract(outer,oG)),prism(Lt-.01,Lt+s,subtract(iG,inner))];
    const sock=(r0,r1,a,t)=>{const c=cos(a),sn=sin(a),q=[[r0,-t/2],[r1,-t/2],[r1,t/2],[r0,t/2]].map(([x,y])=>[x*c-y*sn,x*sn+y*c]);return [q]};
    for(const a of g.phi)rf.push(prism(-1,Lt+1,sock(g.R0-g.rib.w-.25,g.R0+.25,a,g.rib.t+.4),'sub'));
    const ring=build(rf);
    const rib=domeRib(g,Lt);
    /* the cap: a mesh plate that sits on the rib tops, with a slot for each rib's top peg. Lift it off to feed. */
    const top=g.lv[g.m],capR=top.r+5,cap0=ngon(0,0,capR/cos(PI/g.n),g.n,PI/g.n-PI/2);
    const cf=[prism(0,Lt,cap0),prism(Lt-.01,Lt+3,subtract(cap0,offset(cap0,-2.4,'miter')))];
    for(const a of g.phi)cf.push(prism(-1,Lt+4,sock(top.r-g.rib.w+.25,top.r-.25,a,g.rib.t+.4),'sub'));
    if(!preview){const lim=offset(cap0,-7,'miter'),pitch=p.hole+p.bar,hs=[];for(let x=-capR;x<capR;x+=pitch)for(let y=-capR;y<capR;y+=pitch){const q=sq(x,y,p.hole);if(q.every(([u,v])=>G.inside(lim,u,v))&&g.phi.every(a=>{const c=cos(a),sn=sin(a),r=(x+p.hole/2)*c+(y+p.hole/2)*sn,tt=-(x+p.hole/2)*sn+(y+p.hole/2)*c;return !(r>top.r-g.rib.w-3&&abs(tt)<g.rib.t/2+3)}))hs.push(q)}if(hs.length)cf.push(prism(-1,Lt+1,hs,'sub'))}
    const cap=build(cf);
    /* the flat panels, tier by tier: they reach into the slots of the ribs on each side */
    const tiers=[];for(let k=0;k<g.m;k++){const a=g.lv[k],b=g.lv[k+1],d=g.rib.d0+.6,ch=r=>2*(r-d)*sin(PI/g.n)-(g.rib.t-2*g.rib.sd)-.8;
      tiers.push({bottom:ch(a.r),top:ch(b.r),h:hypot((a.r-b.r)*cos(PI/g.n),b.z-a.z)-.8})}
    const perim=g.n*2*g.Rc*sin(PI/g.n);
    return {g,base:bs,ring,rib,cap,tiers,S,H,Lt,s,gw,sheet:[perim+15,H-.5],pegs:bs.pegs,notes};
  }

  /* ---------- Victorian birdcage ---------- */
  /* the profile of the cage, from the base up: straight, then a bell that never leans in more than 45°, so the
     whole cage prints standing up without supports */
  function cageProfile(R,H){
    const pts=[[R,0],[R,H]];let r=R,z=H;
    const rTop=9;while(r>rTop){const t=(R-r)/(R-rTop),slope=.55+.45*min(1,t*3);const dz=1.2;r=max(rTop,r-dz*slope);z+=dz;pts.push([r,z])}
    return pts;
  }
  function cageEnclosure(p,preview){
    const R=p.W/2,wt=2.4,gw=wt+.6,s=6,S=p.S,H=p.H,notes=[];
    const C=G.ellipse(0,0,R,R,Math.round(R*1.6));
    const bs=HE.base(C,{gw,wall:2.4,S,s,f:2.4,join:'round'},p);
    const prof=cageProfile(R,H-.5),cum=[0];for(let i=1;i<prof.length;i++)cum.push(cum[i-1]+hypot(prof[i][0]-prof[i-1][0],prof[i][1]-prof[i-1][1]));
    const len=cum[cum.length-1],pAt=s0=>{let lo=0,hi=prof.length-1;while(hi-lo>1){const m=(lo+hi)>>1;if(cum[m]<=s0)lo=m;else hi=m}
      const a=prof[lo],b=prof[hi],f=(s0-cum[lo])/(cum[hi]-cum[lo]||1),tx=b[0]-a[0],tz=b[1]-a[1],l=hypot(tx,tz)||1;return [a[0]+tx*f,a[1]+tz*f,tz/l,-tx/l]};
    /* bars: tall narrow slots in columns round the cage, between solid bands at the foot, the waist and the shoulder */
    const ncol=max(24,floor(TAU*R/(p.hole+p.bar*1.6))),slotH=12,gap=2.6,bands=[[0,7],[H*.45-3,H*.45+3],[H-6,H+4]];
    const us=new Set([0,1]),cols=[];for(let j=0;j<ncol;j++){const u0=(j+.3)/ncol,u1=u0+min(.6,p.hole/(TAU*R/ncol))/ncol;cols.push([u0,u1]);us.add(+u0.toFixed(6));us.add(+u1.toFixed(6))}
    const ws=new Set([0,len]),rows=[];
    if(!preview)for(let w=8;w+slotH<len-4;w+=slotH+gap){const [rr,zz]=pAt(w+slotH/2);if(rr<R*.45)break;if(bands.some(([a,b])=>zz+slotH/2>a&&zz-slotH/2<b))continue;rows.push([w,w+slotH]);ws.add(+w.toFixed(4));ws.add(+(w+slotH).toFixed(4))}
    for(let w=0;w<len;w+=4)ws.add(+w.toFixed(3));
    const Uv=[...us].sort((a,b)=>a-b),Wv=[...ws].sort((a,b)=>a-b);
    const hole=(i,k)=>{const u=(Uv[i]+Uv[i+1])/2,w=(Wv[k]+Wv[k+1])/2;
      /* keep the slots no wider than a mesh hole as the bell narrows */
      const [r]=pAt(w);if(r<R*.45)return false;
      return cols.some(([a,b])=>u>a&&u<b)&&rows.some(([a,b])=>w>a&&w<b)};
    const cage=G.gridMesh(Uv,[-wt/2,wt/2],Wv,(i,j,k)=>!hole(i,k),(u,v,w)=>{const [r,z,nr,nz]=pAt(w),a=u*TAU;
      return [(r+v*nr)*cos(a),(r+v*nr)*sin(a),z+v*nz]},true);
    /* the finial: a plug for the small opening at the top, a 45° flare, a turned knob, and a slot for the eye */
    const top=prof[prof.length-1],rin=top[0]-wt/2-.25,rd=top[0]+2.5,ff=[prism(0,5,circle(0,0,rin,40))];
    ff.push(varying(5,5+(rd-rin),z=>circle(0,0,rin+(z-5),40),.3));
    const zk=5+(rd-rin);ff.push(prism(zk-.01,zk+2,circle(0,0,rd,40)));
    ff.push(varying(zk+2,zk+14,z=>{const u=(z-zk-2)/12,r=3+(rd-3)*(1-u)*(.75+.5*sin(u*PI));return circle(0,0,min(rd,max(3,r)),40)},.3));
    ff.push(prism(zk+8,zk+14.1,rect(-3.2,-1.7,3.2,1.7),'sub'));
    const fin=build(ff);
    const eye=build([prism(0,3,subtract(U(circle(0,0,9,48),rect(-3,-15,3,-5)),circle(0,0,5.5,40)))]);
    notes.push(`The cage prints in one piece, standing up, ${round(top[1])} mm tall: the bell never leans in more than 45°, so it needs no supports. Use a brim.`);
    return {base:bs,cage,fin,eye,C,S,H,Lt:0,s,gw,top,prof,notes,pegs:bs.pegs};
  }

  /* ---------- nursery cabinet ---------- */
  /* one cubby: a sleeve open at the front, printed standing on its back. A drawer slides into it.
     Sleeve coordinates while printing: x across, y up (as it stands in the cabinet), z from the back to the front. */
  function nurseryCell(p,preview){
    const W=p.W,Hc=p.H,D=p.D,t=2,notes=[],pitch=p.hole+p.bar;
    const sf=[prism(0,t,rect(-W/2,0,W/2,Hc)),prism(t-.01,D,subtract(rect(-W/2,0,W/2,Hc),rect(-W/2+t,t,W/2-t,Hc-t)))];
    if(!preview){
      /* vents through the top wall, row by row (the wall stands upright while printing), and in the back */
      const xs=[];for(let x=-W/2+8;x+p.hole<W/2-8;x+=pitch)xs.push([[x,Hc-t-1],[x+p.hole,Hc-t-1],[x+p.hole,Hc+1],[x,Hc+1]]);
      if(xs.length)for(let z=10;z+p.hole<D-10;z+=pitch*2)sf.push(prism(z,z+p.hole,xs,'sub'));
      const bh=[];for(let x=-W/2+10;x+p.hole<W/2-10;x+=pitch)for(let y=Hc*.55;y+p.hole<Hc-10;y+=pitch)bh.push(sq(x,y,p.hole));if(bh.length)sf.push(prism(-1,t+1,bh,'sub'))}
    /* half-notches at the back edges: a bow-tie key joins two cubbies side by side or one above the other */
    const key=(x,y,a)=>{const c=cos(a),s0=sin(a),q=[[-.01,-3],[6,-5],[6,5],[-.01,3]].map(([u,v])=>[x+u*c-v*s0,y+u*s0+v*c]);return [sarea(q)<0?q.reverse():q]};
    for(const [x,y,a] of [[-W/2,Hc*.25,0],[-W/2,Hc*.75,0],[W/2,Hc*.25,PI],[W/2,Hc*.75,PI],[-W*.25,0,PI/2],[W*.25,0,PI/2],[-W*.25,Hc,-PI/2],[W*.25,Hc,-PI/2]])sf.push(prism(-1,6,key(x,y,a),'sub'));
    const sleeve=build(sf);
    /* the drawer, printed lying on its floor: x across, y from the front plate to the back, z up.
       Its front plate covers the opening from the cubby floor to the top edge. */
    const c=.5,dw=W-2*t-2*c,dh=Hc-2*t-2*c-1.5,dd=D-t-3,ft=3,fw=W-1,fh=Hc-t-c-.5,wl=1.6;
    const df=[prism(0,wl,rect(-dw/2,0,dw/2,dd)),prism(wl-.01,dh,subtract(rect(-dw/2,0,dw/2,dd),rect(-dw/2+wl,wl,dw/2-wl,dd-wl))),prism(0,fh,rrect(-fw/2,-ft,fw/2,.01,1))];
    if(!preview){
      /* a mesh window to look through, row by row up the front */
      const xs=[];for(let x=-dw/2+6;x+p.hole<dw*.1;x+=pitch)xs.push([[x,-ft-1],[x+p.hole,-ft-1],[x+p.hole,1],[x,1]]);
      for(let z=wl+6;z+p.hole<fh*.85;z+=pitch)df.push(prism(z,z+p.hole,xs,'sub'));
    }
    /* a feeding port for a foam plug, round at the bottom and pointed at the top so it prints */
    const px=dw*.3,pz=fh*.55,pr=6;
    df.push(varying(pz-pr,pz+pr*1.42,z=>{const h=z<pz?sqrt(max(0,pr*pr-(z-pz)**2)):max(0,pr*1.42-(z-pz));return h<.05?[]:rect(px-h,-ft-1,px+h,1)},.25,'sub'));
    /* a finger pull at the top edge */
    df.push(prism(fh-8,fh+1,rect(-9,-ft-1,9,1),'sub'));
    const drawer=build(df);
    /* a clip-on label frame for the top edge of the drawer front */
    const lw=min(50,fw*.55),lab=build([prism(0,1.2,rrect(-lw/2-2,-2,lw/2+2,16,2)),prism(1.19,3.6,subtract(rrect(-lw/2-2,-2,lw/2+2,16,2),rect(-lw/2,0,lw/2,20))),prism(0,1.2,rect(-lw/2+3,14,lw/2-3,24))]);
    const plug=build([prism(0,2,circle(0,0,8.5,32)),prism(1.99,7,circle(0,0,5.8,32))]);
    const link=build([prism(0,5.4,[[[-6,-4.8],[0,-2.8],[6,-4.8],[6,4.8],[0,2.8],[-6,4.8]]])]);
    return {sleeve,drawer,lab,plug,link,dims:{dw,dh,dd,ft,fh,fw,t,c},notes};
  }

  /* ---------- book panels for a rectangular enclosure ---------- */
  /* q: {w,h} panel size; T thickness; e: margin that sits in the grooves. Raised work is on the outer face (z<0
     in panel coordinates); the file is turned over so that face prints on top. */
  function bookPanel(kind,q,T,e,p,preview){
    const w=q.w,h=q.h,f=[prism(0,T,rect(0,0,w,h))],x0=e+3,x1=w-e-3,y0=e+3,y1=h-e-3;
    if(kind==='pages'){
      /* fine horizontal slots, like the edges of the pages: air comes in, and it looks like paper */
      if(!preview){const sl=[];const sh=Math.max(1,p.hole*.8),pitch=sh+1.4;for(let y=y0+4;y+sh<y1-4;y+=pitch)for(let x=x0+2,j=0;x<x1-2;j++){const xe=min(x1-2,x+38);sl.push([[x,y],[xe,y],[xe,y+sh],[x,y+sh]]);x=xe+2.4}
        if(sl.length)f.push(prism(-1,T+1,sl,'sub'))}
    }else if(kind==='spine'){
      /* raised bands across the spine, a title panel between them, and a border */
      const bands=[.12,.2,.72,.8,.88];for(const b of bands){const y=y0+(y1-y0)*b;f.push(prism(-2.2,.01,rrect(x0,y-2.5,x1,y+2.5,1.5)))}
      f.push(prism(-1.2,.01,subtract(rrect(x0+4,y0+(y1-y0)*.3,x1-4,y0+(y1-y0)*.62,3),rrect(x0+6.4,y0+(y1-y0)*.3+2.4,x1-6.4,y0+(y1-y0)*.62-2.4,2))));
    }else if(kind==='cover'){
      /* a raised border with corner pieces, like a leather-bound cover */
      f.push(prism(-1.6,.01,subtract(rect(x0,y0,x1,y1),rect(x0+5,y0+5,x1-5,y1-5))));
      for(const [cx,cy,sx,sy] of [[x0,y0,1,1],[x1,y0,-1,1],[x0,y1,1,-1],[x1,y1,-1,-1]])f.push(prism(-2.4,.01,[[[cx,cy],[cx+sx*22,cy],[cx,cy+sy*22]]].map(r=>sx*sy<0?r.reverse():r)));
      const cx=w/2,cy=h/2,r=min(w,h)*.12;f.push(prism(-1.6,.01,subtract(ngon(cx,cy,r,4,0),ngon(cx,cy,r-3,4,0))));
    }
    return build(f);
  }

  root.HabitatShapes={pathTube,cornerEnclosure,domeEnclosure,domeGeom,cageEnclosure,nurseryCell,bookPanel,perimeterOf};
})(typeof window!=='undefined'?window:globalThis);
