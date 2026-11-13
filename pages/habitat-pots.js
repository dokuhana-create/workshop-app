/* Habitat flowerpots: soft, organic pots, wall pots and the tiered back planter, modelled as distance fields
   (lib/sdf.js) so rims are rounded and surfaces can vary up and around, like hand-made ceramics: faceted rock,
   river pebbles, bark, flutes, swirls, petals, bamboo or low-poly facets.
   The mesher keeps every overhang to 45°, so everything prints upright without supports. */
(function(root){
  const {sqrt,abs,min,max,floor,cos,sin,atan2,PI,round}=Math,TAU=2*PI;
  const S=()=>root.Sdf;
  const clamp=(v,a,b)=>v<a?a:v>b?b:v,frac=v=>v-floor(v);
  const H2=(i,j,s)=>{const x=sin(i*127.1+j*311.7+s*74.7)*43758.5453;return x-floor(x)};
  const smax=(a,b,k)=>{const h=clamp(.5+.5*(a-b)/k,0,1);return b+(a-b)*h+k*h*(1-h)};

  /* ---------- surfaces ----------
     surf(u,z): how far out (+) or in (−) the surface sits, in mm, at u mm along it and z mm up.
     ctx: {C: length all the way round (0 for a flat face), H: height, seed} */
  const SURF={
    smooth:{name:'Smooth',d:()=>0,amp:0},
    rock:{name:'Rock',amp:4.6,d:(u,z,c)=>{
      /* split stone: the surface is broken into irregular cells (the nearest point of a jittered grid), each a flat
         face at its own depth and tilt, so neighbouring faces meet in small steps and ridges */
      const cell=15,N=c.C?max(3,round(c.C/cell)):0,cw=c.C?c.C/N:cell,ch=cell*.8,iu=floor(u/cw),iz=floor(z/ch);let d1=1e9,d2=1e9,v1=0,v2=0;
      for(let a=-1;a<=1;a++)for(let b=-1;b<=1;b++){let i=iu+a;const j=iz+b,k=N?((i%N)+N)%N:i;
        const cu=(i+.15+.7*H2(k,j,c.seed))*cw,cz=(j+.15+.7*H2(k,j,c.seed+3))*ch;let du=u-cu;if(N){du=((du%c.C)+c.C*1.5)%c.C-c.C/2}const dz=z-cz,dd=sqrt(du*du+dz*dz*1.3);
        const v=-3.6*H2(k,j,c.seed+7)+(H2(k,j,c.seed+11)-.5)*.6*du+(H2(k,j,c.seed+13)-.5)*.5*dz;
        if(dd<d1){d2=d1;v2=v1;d1=dd;v1=v}else if(dd<d2){d2=dd;v2=v}}
      /* the step between two faces is eased over about a millimetre, so its edge prints clean */
      const t=clamp((d2-d1)/1.4,0,1),v=v1*(.5+.5*t)+v2*(.5-.5*t);
      return clamp(v,-4.4,.4)+.2+.3*S().fbm(u/2.4,z/2.4,0,c.seed+9,2)}},
    pebbles:{name:'River pebbles',amp:2.6,d:(u,z,c)=>{
      const cell=11,N=c.C?max(3,round(c.C/cell)):0,cw=c.C?c.C/N:cell,ch=cell*.8,iu=floor(u/cw),iz=floor(z/ch);let best=0;
      for(let a=-1;a<=1;a++)for(let b=-1;b<=1;b++){let i=iu+a;const j=iz+b,k=N?((i%N)+N)%N:i;
        const cu=(i+.5+.5*(H2(k,j,c.seed)-.5))*cw,cz=(j+.5+.5*(H2(k,j,c.seed+3)-.5))*ch;let du=u-cu;if(N){du=((du%c.C)+c.C*1.5)%c.C-c.C/2}
        const r=cell*(.55+.25*H2(k,j,c.seed+5)),q=(du*du/(r*r*1.3)+(z-cz)**2/(r*r*.8));if(q<1)best=max(best,2.6*sqrt(1-q))}
      return best-2.6}},
    bark:{name:'Bark',amp:2.8,d:(u,z,c)=>{const sd=S(),w=c.C?c.C:0;
      /* long cracks running up the trunk: noise stretched along z, turned into ridges */
      const n=w?(()=>{const a=u/w*TAU,R=w/TAU;return sd.fbm(R*cos(a)/3.2,R*sin(a)/3.2,z/16,c.seed,3)})():sd.fbm(u/3.2,0,z/16,c.seed,3);
      return -2.4*abs(n)*1.6+.4*sd.fbm(u/1.4,z/1.4,0,c.seed+4,2)}},
    flutes:{name:'Fluted',amp:1.8,lam:10,d:(u,z,c,L)=>-1.8*(.5-.5*cos(TAU*u/L))*edge(z,c.H)},
    swirl:{name:'Swirl',amp:3.3,lam:26,d:(u,z,c,L)=>2.2*sin(TAU*(u+z*.55)/L)*edge(z,c.H)-1.1},
    /* petals: two rows of tall, pointed petals, the back row peeping between the front one, each with a soft midrib,
       closing to a point at the rim like a flower bud opening */
    petals:{name:'Petals',amp:2.8,lam:30,d:(u,z,c,L)=>{const H=c.H||60,t=clamp(z/H,0,1),wr=x=>{const q=((x%L)+L*1.5)%L-L/2;return q};
      const w=.6*L*Math.pow(sin(PI*min(1,.04+t*.98)),.75)+.01,amp=2.8;
      const df=wr(u-L/2),qf=df/w,fr=qf*qf<1?amp*sqrt(1-qf*qf)*(.45+.55*t)-.45*Math.exp(-((df/1.1)**2))*(.3+.7*t):0;
      const db=wr(u),wb=w*.8,qb=db/wb,bk=qb*qb<1?.62*amp*sqrt(1-qb*qb)*(.45+.55*t):0;
      return (max(fr,bk)-amp)*edge(z,H)}},
    bamboo:{name:'Bamboo',amp:3.1,lam:10,d:(u,z,c,L)=>{const v=2*frac(u/L)-1,node=frac(z/22+.5*H2(floor(u/L),0,c.seed));
      return 2*(sqrt(max(0,1-v*v))-1)-1.1*max(0,1-abs(node-.5)/.04)}},
    facets:{name:'Low-poly facets',amp:3,lam:20,d:(u,z,c,L)=>{const v=2*frac((u+z*.35)/L)-1;return -3*abs(v)}},
    knit:{name:'Knitted',amp:1.9,lam:7,d:(u,z,c,L)=>{const v=2*frac(u/L)-1,w=frac(z/6+abs(v)*.5);return -1.6*(abs(v)**1.5)-.5*abs(w-.5)}}
  };
  /* fade a pattern out towards the rim and the foot, so both stay soft and round */
  function edge(z,H){if(!H)return 1;const a=clamp(z/5,0,1),b=clamp((H-z)/6,0,1);return a*a*(3-2*a)*(b*b*(3-2*b))}
  const surfFn=(kind,ctx)=>{const s=SURF[kind]||SURF.smooth;if(!s.lam)return (u,z)=>s.d(u,z,ctx);const L=ctx.C?ctx.C/max(1,round(ctx.C/s.lam)):s.lam;return (u,z)=>s.d(u,z,ctx,L)};

  /* ---------- plan and profile ---------- */
  /* plan: radius (as a fraction) at angle a, for a body Rx × Ry */
  const PLAN={round:()=>1,oval:()=>1,pebble:(a,sd)=>1+.06*cos(2*a+sd)+.04*cos(3*a+2*sd),
    square:a=>{const c=abs(cos(a)),s=abs(sin(a)),p=5;return 1/Math.pow(c**p+s**p,1/p)*.9},
    hex:a=>{const k=((a%(PI/3))+PI/3)%(PI/3)-PI/6;return (.88/cos(k))*.85+.15}};
  /* profile: radius (as a fraction) at t = 0 (foot) .. 1 (rim) */
  const FORM={belly:{name:'Round belly',f:t=>.84+.16*sin(PI*min(1,.18+t*.9))},straight:{name:'Straight',f:t=>.95+.05*t},
    tulip:{name:'Opening like a tulip',f:t=>.82+.18*sin(PI/2*t)},bowl:{name:'Low bowl',f:t=>.72+.28*sin(PI/2*min(1,t*1.25))},
    urn:{name:'Urn',f:t=>t<.65?.8+.2*sin(PI*t/.65):.82+.1*((t-.65)/.35)**1.5}};

  /* ---------- a free-standing pot ---------- */
  function body(o){
    const sd=S(),Rx=(o.L||60)/2,Ry=(o.shape==='round'?(o.L||60):(o.W||50))/2,H=o.H||60,Rm=(Rx+Ry)/2,wall=Math.max(1.6,o.wall||2.2),fl=2.4;
    const plan=PLAN[o.shape]||PLAN.round,form=(FORM[o.form]||FORM.belly).f,sk=SURF[o.surface]||SURF.smooth,C=TAU*Rm,sf=surfFn(o.surface||'smooth',{C,H,seed:o.seed||1}),seed=(o.seed||1)*.7;
    const sh=sk.amp||0;
    /* outer and inner radius at (x,y,z), as distances in mm */
    const field=(x,y,z,inner)=>{const nx=x/Rx,ny=y/Ry,a=atan2(ny,nx),rn=sqrt(nx*nx+ny*ny),t=clamp(z/H,0,1),P=plan(a,seed)*form(t);
      if(inner)return (rn-P)*Rm+wall+sh;return (rn-P)*Rm-sf(frac(a/TAU)*C,z)};
    return {Rx,Ry,H,Rm,wall,fl,field,sh};
  }
  /* the base's floor pegs (a 40 mm grid) under a planter module, in the module's own frame. The planter stands with
     its x mirrored against the back wall, so X runs from the right. Pegs fully inside get a socket in a solid hub;
     pegs on the edge get a notch so the planter still sits flat. */
  function pegsUnder(e,Wp,ob,X0,Mw,ymax){
    if(e.shape!=='rect')return [];const P=root.HabitatParts.PEG,g=(e.T||3)+.6,mg=g/2+2.4+14,pi=40,nx=floor((e.W-2*mg)/pi),ny=floor((e.D-2*mg)/pi),ox=(e.W-nx*pi)/2,oy=(e.D-ny*pi)/2,out=[];
    for(let i=0;i<=nx;i++)for(let j=0;j<=ny;j++){const x=ob+.5+Wp-(ox+i*pi)-X0,y=e.D-ob-.5-(oy+j*pi);
      if(x<-P.r-.5||x>Mw+P.r+.5||y<-P.r-.5||y>ymax+P.r+.5)continue;out.push([x,y])}
    return out;
  }
  /* a floor-peg socket from underneath with a pointed roof, so the 45° print rule never fills it in */
  /* the sockets are cut after the 45° print rule (which would fill any hole from underneath) */
  const socketAt=(cx,cy,r)=>{const P=root.HabitatParts.PEG;return {f:(x,y,z)=>max(Math.hypot(x-cx,y-cy)-r,max(-2-z,z-P.depth)),box:[cx-r-2,cy-r-2,-2,cx+r+2,cy+r+2,P.depth+2]}};
  const HUB_H=fl=>fl+root.HabitatParts.PEG.depth;
  function socketPegs(sd,f,spots,fl){
    const P=root.HabitatParts.PEG,hubs=[],socks=[];
    for(const [x,y] of spots){const inside=[...Array(9)].every((_,k)=>{const r=k?P.hub:0,a=k*TAU/8;return f(x+r*cos(a),y+r*sin(a),1)<-.2});
      if(inside)hubs.push(sd.cylZ(x,y,P.hub,0,HUB_H(fl)));socks.push(socketAt(x,y,P.sock+(inside?0:.4)))}
    if(hubs.length)f=sd.union(f,...hubs);
    return {f,n:hubs.length,carve:socks};
  }
  function pot(o,info){
    const sd=S(),b=body(o),{Rx,Ry,H,fl}=b,peg=o.mount==='peg',P=root.HabitatParts.PEG;
    const outer=(x,y,z)=>smax(smax(b.field(x,y,z,false),z-H,1.4),-z,.8);
    const cav=(x,y,z)=>smax(b.field(x,y,z,true),fl-z,1.2);
    let f=sd.scut(1.6,outer,cav);
    /* two sockets 40 mm apart, so the pot sits on two floor pegs and can't turn */
    const pegX=peg?(Rx>=20+P.hub+b.wall+1&&Ry>=P.hub+b.wall+1?[-20,20]:[0]):[];
    if(peg)f=sd.union(f,...pegX.map(x=>sd.cylZ(x,0,P.hub,0,HUB_H(fl))));const carve=pegX.map(x=>socketAt(x,0,P.sock));
    /* drain holes in the floor, 2 mm, in rings */
    if(o.drain!==false){const hs=[];for(const r of [0,Math.min(Rx,Ry)*.35,Math.min(Rx,Ry)*.6])for(let k=0,n=r?Math.max(5,round(TAU*r/9)):1;k<n;k++){const a=k*TAU/n,hx=r*cos(a),hy=r*sin(a);if(pegX.some(x=>Math.hypot(hx-x,hy)<P.hub+2))continue;hs.push(sd.cylZ(r*cos(a),r*sin(a),1.05,-1,fl+.5))}if(hs.length)f=sd.cut(f,...hs)}
    const m=sd.mesh(f,[-Rx*1.25-4,-Ry*1.25-4,Rx*1.25+4,Ry*1.25+4,H+2],o.preview?1:.42,{carve});
    const notes=[`A ${(FORM[o.form]||FORM.belly).name.toLowerCase()} pot with a ${(SURF[o.surface]||SURF.smooth).name.toLowerCase()} surface, about ${round(2*Rx)} × ${round(2*Ry)} × ${round(H)} mm. Prints upright without supports.`];
    if(o.drain!==false)notes.push('Drain holes in the floor: put a few clay balls in before the soil.');
    if(peg)notes.push(pegX.length>1?'Two sockets underneath, 40 mm apart: the pot sits on two floor pegs of the base and can\'t turn or tip. Turn on floor pegs for the enclosure.':'Make the pot at least '+round(2*(20+P.hub+b.wall+1))+' mm long for two floor-peg sockets; it has one now.');
    return {parts:[{file:`pot-${o.surface||'smooth'}.stl`,role:'Main colour',m}],notes,magnets:0};
  }
  /* ---------- a pot for the wall: the same body with a flat back, held by magnets ---------- */
  function wallPot(o,info){
    const sd=S(),q=Object.assign({},o,{L:o.L||70,W:(o.W||40)*2}),b=body(q),{Rx,Ry,H,fl}=b,md=o.md||10,mh=o.mh||3,bt=Math.max(3,mh+.2+1.6);
    /* the body is cut flat at y = 0; the back wall is thicker, for the magnet pockets */
    const outer=(x,y,z)=>smax(smax(smax(b.field(x,y,z,false),z-H,1.4),-z,.8),-y,.6);
    const cav=(x,y,z)=>smax(smax(b.field(x,y,z,true),fl-z,1.2),bt-y,1);
    let f=sd.scut(1.6,outer,cav);
    const zs=[H*.55],xs=Rx>=2*md?[-Rx*.38,Rx*.38]:[0],R=md/2+.15;
    f=sd.cut(f,...xs.flatMap(x=>zs.map(z=>sd.rod([x,-1,z],[x,mh+.2,z],R))));
    if(o.drain!==false){const hs=[];for(let x=-Rx*.5;x<=Rx*.5+.1;x+=Rx*.25)hs.push(sd.cylZ(x,Ry*.45,1.05,-1,fl+.5));f=sd.cut(f,...hs)}
    const m=sd.mesh(f,[-Rx*1.25-4,0,Rx*1.25+4,Ry*1.25+4,H+2],o.preview?1:.42);
    return {parts:[{file:`wall-pot-${o.surface||'smooth'}.stl`,role:'Main colour',m}],magnets:xs.length,
      notes:[`A pot with a flat back, ${round(2*Rx)} mm wide and ${round(H)} mm tall. Press ${xs.length} magnet${xs.length>1?'s':''} into the back and put ${xs.length>1?'two more':'another'} on the outside of the panel to hold it. Prints upright without supports.`,'A few clay balls in the bottom keep the roots out of the wet.']};
  }


  /* ---------- flowing terraces, like rice fields on a hillside ----------
     The terraces follow wavy contour lines around a starting place: the back wall, a back corner, one side, or a
     hill somewhere in the middle. Each terrace is a soil pocket held by a low rounded bank; widths and heights vary,
     and the banks never meet in sharp corners. Each pocket goes down to the floor, so the planter is only thin walls. */
  function flowTiers(o,info){
    const sd=S(),e=info.e||{},rectE=e.shape==='rect',W=rectE?e.W:Math.min(e.W,e.D||e.W)*.7,D=rectE?e.D:Math.min(e.W,e.D||e.W)*.7;
    const g=(e.T||3)+.6,ob=g/2+2.4,Sb=e.S||40,n=Math.max(2,Math.min(3,+o.tiers||3)),wall=Math.max(1.6,o.wall||2.2),fl=2.4,seed=o.seed||1;
    const Wp=W-2*ob-1,Df=D-2*ob-1,nt=rectE&&info.Eh?info.Eh-ob+.75:0,lay=o.layout||'back',R=(i,s)=>H2(i,s,seed*1.37);
    const bed=info.bed||350,m=o.mods&&o.mods!=='auto'?+o.mods:Math.max(1,Math.ceil(Wp/(bed-10))),Mw=(Wp-(m-1))/m,pct=(o.pct||60)/100;
    /* where the terraces start, and how far they reach */
    const hill=[Wp*(.3+.4*R(1,1)),Df*(.28+.12*R(2,1))];
    const LAY={back:{phi:(x,y)=>y,R:Df*pct},side:{phi:x=>x,R:Wp*pct},cornerL:{phi:(x,y)=>Math.hypot(x,y*1.15),R:Math.hypot(Wp,Df)*pct*.85},
      cornerR:{phi:(x,y)=>Math.hypot(Wp-x,y*1.15),R:Math.hypot(Wp,Df)*pct*.85},point:{phi:(x,y)=>Math.hypot(x-hill[0],(y-hill[1])*1.1),R:Math.min(Wp,Df)*pct*.75}};
    const L=LAY[lay]||LAY.back,phi=L.phi,Rr=Math.max(n*16,L.R);
    /* band widths and step heights vary; the highest terrace is the one at the start */
    const wts=[...Array(n)].map((_,k)=>.7+.6*R(k,3)),sw=wts.reduce((a,b)=>a+b,0),B=[];let acc=0;for(let k=0;k<n;k++){acc+=wts[k]/sw*Rr;B.push(acc)}
    /* rice-field steps are low: on average about half the even planter's, each one different */
    const steps=[...Array(n)].map((_,k)=>(o.step||30)*.45*(.55+.9*R(k,5))),T=[];let t=Sb-2.4+(o.up||20)*.5;for(let k=n-1;k>=0;k--){T[k]=t;t+=steps[k]}
    const Tmax=Math.min(T[0],Sb+(e.H||300)*.55);if(T[0]>Tmax){const sc=(Tmax-T[n-1])/(T[0]-T[n-1]||1);for(let k=0;k<n;k++)T[k]=T[n-1]+(T[k]-T[n-1])*sc}
    /* each contour line wanders on its own, so the terraces widen and narrow */
    const A=k=>Math.min(14,(k?B[k]-B[k-1]:B[0])*.38);
    const cell=1,GX=Math.ceil(Wp/cell)+3,GY=Math.ceil(Df/cell)+3,grid=[...Array(n)].map((_,k)=>{const g=new Float32Array(GX*GY);
      for(let j=0;j<GY;j++)for(let i=0;i<GX;i++){const x=(i-1)*cell,y=(j-1)*cell;g[j*GX+i]=B[k]+A(k)*sd.fbm(x/55,y/55,k*3.1,seed*5+k,3)*1.6}return g});
    const bnd=(k,x,y)=>{if(k<0)return -1e9;const u=clamp(x/cell+1,0,GX-1.001),v=clamp(y/cell+1,0,GY-1.001),i=floor(u),j=floor(v),a=u-i,b=v-j,G=grid[k],q=j*GX+i;
      return (G[q]*(1-a)+G[q+1]*a)*(1-b)+(G[q+GX]*(1-a)+G[q+GX+1]*a)*b};
    const sk=SURF[o.front]||SURF.smooth,amp=sk.amp||0,sf=surfFn(o.front||'smooth',{C:0,H:T[0],seed});
    const parts=[];let pegN=0;
    for(let j=0;j<m;j++){
      const first=j===0,last=j===m-1,X0=j*(Mw+1);
      /* x, y, z here are in the module's own frame; X is across the whole planter */
      const terr=k=>(x,y,z)=>{const X=x+X0,p=phi(X,y);return smax(smax(p-(bnd(k,X,y)+sf(X+y,z)),z-T[k],3),-z,.25)};
      const box=(x,y,z)=>smax(smax(-x,x-Mw,.6),smax(-y,y-Df,.6),.6);
      let f=sd.both(sd.union(...[...Array(n)].map((_,k)=>terr(k))),box);
      const pocket=k=>(x,y,z)=>{const X=x+X0,p=phi(X,y);let d=smax(k?bnd(k-1,X,y)+wall-p:-1e9,p-(bnd(k,X,y)-wall-amp),1.5);
        d=smax(d,smax(smax(wall-x,x-(Mw-wall),1),smax(wall-y,y-(Df-wall),1),1),1);return smax(d,fl-z,1.2)};
      f=sd.scut(1.4,f,...[...Array(n)].map((_,k)=>pocket(k)));
      if(nt>0){const cs=[];if(first)cs.push(sd.box(nt/2-.5,nt/2-.5,60,nt/2+.5,nt/2+.5,200));if(last)cs.push(sd.box(Mw-nt/2+.5,nt/2-.5,60,nt/2+.5,nt/2+.5,200));if(cs.length)f=sd.cut(f,...cs)}
      /* drain holes wherever a pocket floor is */
      const spots=pegsUnder(e,Wp,ob,X0,Mw,Df),near=(x,y)=>spots.some(([u,v])=>Math.hypot(x-u,y-v)<9.5);
      const hs=[];for(let x=wall+5;x<Mw-wall-4;x+=12)for(let y=wall+5;y<Df-wall-4;y+=12)if(!near(x,y)&&[...Array(n)].some((_,k)=>pocket(k)(x,y,fl+1)<-2.5))hs.push(sd.cylZ(x,y,1.05,-1,fl+.5));
      if(hs.length)f=sd.cut(f,...hs);
      const sp=socketPegs(sd,f,spots,fl);f=sp.f;pegN+=sp.n;const carve=sp.carve;
      const mm=sd.mesh(f,[-1,-1,Mw+1,Df+1,T[0]+3],o.preview?1.6:.7,{carve});
      parts.push({file:m>1?`terraced-planter-${j+1}-of-${m}.stl`:'terraced-planter.stl',role:j?'Second file':'Main colour',m:mm});
    }
    const where={back:'along the back wall',side:'from the left wall',cornerL:'from the back left corner',cornerR:'from the back right corner',point:'around a hill'}[lay];
    const notes=[`${n} flowing terraces ${where}, ${T.map(round).join(', ')} mm tall from the highest down, each a soil pocket behind a low rounded bank. Shuffle for a different layout.`,
      'Fill every pocket with a few clay balls and then soil; plant the high terraces with trailing plants so they spill over the banks. The floor beyond the last bank stays free for gravel, sand or moss.',
      'Prints upright without supports, as thin walls only. Drain holes in each pocket let water through to the base.'];
    if(m>1)notes.push(`It comes in ${m} modules that stand side by side.`);
    notes.push(pegN>=2*m?`It sits on ${pegN} floor pegs of the base, so it can't slide or tip. Turn on floor pegs for the enclosure.`:'Turn on floor pegs for the enclosure and make the planter reach further, so it sits on at least two pegs; it has sockets wherever a peg is under it.');

    if(!rectE)notes.push('Made for rectangular enclosures; for this shape it is a free-standing planter of a matching size.');
    return {parts,notes,magnets:0,Mw};
  }

  /* ---------- the tiered back planter ----------
     Pots in steps along the back wall, with soft rounded rims; each tier's front carries the surface. */
  function tiers(o,info){
    if(o.layout&&o.layout!=='even')return flowTiers(o,info);
    const sd=S(),HE=root.HabitatEnclosure,e=info.e||{},rectE=e.shape==='rect',W=rectE?e.W:Math.min(e.W,e.D||e.W)*.7,D=rectE?e.D:Math.min(e.W,e.D||e.W)*.7;
    const g=(e.T||3)+.6,ob=g/2+2.4,Sb=e.S||40,n=Math.max(2,Math.min(3,+o.tiers||2)),wall=Math.max(1.6,o.wall||2.2),fl=2.4;
    const Wp=W-2*ob-1,Dfloor=D-2*ob-1,Dp=Math.max(30*n,Math.min(Dfloor-25,Dfloor*(o.pct||60)/100)),nt=rectE&&info.Eh?info.Eh-ob+.75:0;
    const bed=info.bed||350,m=o.mods&&o.mods!=='auto'?+o.mods:Math.max(1,Math.ceil(Wp/(bed-10))),Mw=(Wp-(m-1))/m;
    const hk=k=>Sb-2.4+(o.up||20)+(n-1-k)*(o.step||30),yk=k=>(k+1)*Dp/n,sk=SURF[o.front]||SURF.flutes,amp=sk.amp||0;
    const sf=surfFn(o.front||'flutes',{C:0,H:hk(0),seed:o.seed||1});
    /* top edge: depth of a dip at x, only along the front of each tier */
    const RIM={flat:()=>0,arches:x=>{const v=2*frac(x/26)-1;return 5*sqrt(max(0,1-v*v))},pointed:x=>7*(1-abs(2*frac(x/18)-1)),
      battlements:x=>{const u=frac(x/22);return u<.5?0:5*clamp(min(u-.5,1-u)*12,0,1)},waves:x=>2.6*(.5+.5*cos(TAU*x/32))}[o.top||'flat']||(()=>0);
    const parts=[],notes=[];let pegN=0;
    for(let j=0;j<m;j++){
      const first=j===0,last=j===m-1,X0=j*(Mw+1);
      /* the tiers as one body: each one runs from the back wall to its own front, so they step down */
      const tier=k=>(x,y,z)=>{const xx=x,front=y-(yk(k)+sf(X0+xx,z)-.2),dip=RIM((X0+xx))*clamp((y-(yk(k)-12))/8,0,1);
        let d=smax(smax(-xx,xx-Mw,1),smax(-y,front,1.6),1);d=smax(smax(d,z-(hk(k)-dip),1.4),-z,.25);return d};
      const cav=k=>(x,y,z)=>{const front=y-(yk(k)-amp-wall),back=(k?yk(k-1):0)+wall-y;let d=smax(smax(wall-x,x-(Mw-wall),1.2),smax(back,front,1.2),1.2);return smax(d,fl-z,1.2)};
      let f=sd.union(...[...Array(n)].map((_,k)=>tier(k)));
      f=sd.scut(1.4,f,...[...Array(n)].map((_,k)=>cav(k)));
      if(nt>0){const cs=[];if(first)cs.push(sd.box(nt/2-.5,nt/2-.5,60,nt/2+.5,nt/2+.5,200));if(last)cs.push(sd.box(Mw-nt/2+.5,nt/2-.5,60,nt/2+.5,nt/2+.5,200));if(cs.length)f=sd.cut(f,...cs)}
      const spots=pegsUnder(e,Wp,ob,X0,Mw,Dp+amp),near=(x,y)=>spots.some(([u,v])=>Math.hypot(x-u,y-v)<9.5);
      const hs=[];for(let k=0;k<n;k++){const y0=(k?yk(k-1):0)+wall+4,y1=yk(k)-amp-wall-4;for(let x=wall+6;x<Mw-wall-4;x+=12)for(let y=y0;y<=y1;y+=12)if(!near(x,y))hs.push(sd.cylZ(x,y,1.05,-1,fl+.5))}
      if(hs.length)f=sd.cut(f,...hs);
      const sp=socketPegs(sd,f,spots,fl);f=sp.f;pegN+=sp.n;const carve=sp.carve;
      const mm=sd.mesh(f,[-1,-1,Mw+1,Dp+amp+2,hk(0)+2],o.preview?1.4:.6,{carve});
      parts.push({file:m>1?`tiered-planter-${j+1}-of-${m}.stl`:'tiered-planter.stl',role:j?'Second file':'Main colour',m:mm});
    }
    const hs=[...Array(n)].map((_,k)=>round(hk(k)));
    notes.push(`${n} tiers across the back, ${round(Wp)} × ${round(Dp)} mm and ${hs.join(', ')} mm tall from back to front, with a ${sk.name.toLowerCase()} front. It stands on the base floor and leaves ${round(Dfloor-Dp)} mm of floor free in front.`);
    if(m>1)notes.push(`It comes in ${m} modules that stand side by side; they need nothing to join them.`);
    notes.push(pegN>=2*m?`It sits on ${pegN} floor pegs of the base, so it can't slide or tip. Turn on floor pegs for the enclosure.`:'Turn on floor pegs for the enclosure and make the planter reach further, so it sits on at least two pegs; it has sockets wherever a peg is under it.');

    notes.push('Put a thin layer of clay balls in each tier, then soil. Fill the floor in front with aquarium gravel, sand or moss: the planter keeps the two apart.');
    notes.push('Prints upright without supports. Drain holes in each floor let water through to the base.');
    if(!rectE)notes.push('Made for rectangular enclosures; for this shape it is a free-standing planter of a matching size.');
    return {parts,notes,magnets:0,Mw};
  }

  root.HabitatPots={SURF,FORM,pot,wallPot,tiers};
})(typeof window!=='undefined'?window:globalThis);
