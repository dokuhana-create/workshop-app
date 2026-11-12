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
    petals:{name:'Petals',amp:3,lam:24,d:(u,z,c,L)=>{const v=2*frac((u+(floor(z/((c.H||60)/3))%2)*L/2)/L)-1;return 3*(sqrt(max(0,1-v*v))-1)*(.35+.65*clamp(z/(c.H||60),0,1))}},
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
  function pot(o,info){
    const sd=S(),b=body(o),{Rx,Ry,H,fl}=b,peg=o.mount==='peg',P=root.HabitatParts.PEG;
    const outer=(x,y,z)=>smax(smax(b.field(x,y,z,false),z-H,1.4),-z,.8);
    const cav=(x,y,z)=>smax(b.field(x,y,z,true),fl-z,1.2);
    let f=sd.scut(1.6,outer,cav);
    if(peg)f=sd.cut(sd.union(f,sd.cylZ(0,0,P.hub,0,fl+P.depth)),sd.cylZ(0,0,P.sock,-1,P.depth));
    /* drain holes in the floor, 2 mm, in rings */
    if(o.drain!==false){const hs=[];for(const r of [0,Math.min(Rx,Ry)*.35,Math.min(Rx,Ry)*.6])for(let k=0,n=r?Math.max(5,round(TAU*r/9)):1;k<n;k++){const a=k*TAU/n;if(peg&&r<P.hub+2)continue;hs.push(sd.cylZ(r*cos(a),r*sin(a),1.05,-1,fl+.5))}if(hs.length)f=sd.cut(f,...hs)}
    const m=sd.mesh(f,[-Rx*1.25-4,-Ry*1.25-4,Rx*1.25+4,Ry*1.25+4,H+2],o.preview?1:.42);
    const notes=[`A ${(FORM[o.form]||FORM.belly).name.toLowerCase()} pot with a ${(SURF[o.surface]||SURF.smooth).name.toLowerCase()} surface, about ${round(2*Rx)} × ${round(2*Ry)} × ${round(H)} mm. Prints upright without supports.`];
    if(o.drain!==false)notes.push('Drain holes in the floor: put a few clay balls in before the soil.');
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

  /* ---------- the tiered back planter ----------
     Pots in steps along the back wall, with soft rounded rims; each tier's front carries the surface. */
  function tiers(o,info){
    const sd=S(),HE=root.HabitatEnclosure,e=info.e||{},rectE=e.shape==='rect',W=rectE?e.W:Math.min(e.W,e.D||e.W)*.7,D=rectE?e.D:Math.min(e.W,e.D||e.W)*.7;
    const g=(e.T||3)+.6,ob=g/2+2.4,Sb=e.S||40,n=Math.max(2,Math.min(3,+o.tiers||2)),wall=Math.max(1.6,o.wall||2.2),fl=2.4;
    const Wp=W-2*ob-1,Dfloor=D-2*ob-1,Dp=Math.max(30*n,Math.min(Dfloor-25,Dfloor*(o.pct||60)/100)),nt=rectE&&info.Eh?info.Eh-ob+.75:0;
    const bed=info.bed||350,m=o.mods&&o.mods!=='auto'?+o.mods:Math.max(1,Math.ceil(Wp/(bed-10))),Mw=(Wp-(m-1))/m;
    const hk=k=>Sb-2.4+(o.up||20)+(n-1-k)*(o.step||30),yk=k=>(k+1)*Dp/n,sk=SURF[o.front]||SURF.flutes,amp=sk.amp||0;
    const sf=surfFn(o.front||'flutes',{C:0,H:hk(0),seed:o.seed||1});
    /* top edge: depth of a dip at x, only along the front of each tier */
    const RIM={flat:()=>0,arches:x=>{const v=2*frac(x/26)-1;return 5*sqrt(max(0,1-v*v))},pointed:x=>7*(1-abs(2*frac(x/18)-1)),
      battlements:x=>{const u=frac(x/22);return u<.5?0:5*clamp(min(u-.5,1-u)*12,0,1)},waves:x=>2.6*(.5+.5*cos(TAU*x/32))}[o.top||'flat']||(()=>0);
    const parts=[],notes=[];
    for(let j=0;j<m;j++){
      const first=j===0,last=j===m-1,X0=j*(Mw+1);
      /* the tiers as one body: each one runs from the back wall to its own front, so they step down */
      const tier=k=>(x,y,z)=>{const xx=x,front=y-(yk(k)+sf(X0+xx,z)-.2),dip=RIM((X0+xx))*clamp((y-(yk(k)-12))/8,0,1);
        let d=smax(smax(-xx,xx-Mw,1),smax(-y,front,1.6),1);d=smax(smax(d,z-(hk(k)-dip),1.4),-z,.25);return d};
      const cav=k=>(x,y,z)=>{const front=y-(yk(k)-amp-wall),back=(k?yk(k-1):0)+wall-y;let d=smax(smax(wall-x,x-(Mw-wall),1.2),smax(back,front,1.2),1.2);return smax(d,fl-z,1.2)};
      let f=sd.union(...[...Array(n)].map((_,k)=>tier(k)));
      f=sd.scut(1.4,f,...[...Array(n)].map((_,k)=>cav(k)));
      if(nt>0){const cs=[];if(first)cs.push(sd.box(nt/2-.5,nt/2-.5,60,nt/2+.5,nt/2+.5,200));if(last)cs.push(sd.box(Mw-nt/2+.5,nt/2-.5,60,nt/2+.5,nt/2+.5,200));if(cs.length)f=sd.cut(f,...cs)}
      const hs=[];for(let k=0;k<n;k++){const y0=(k?yk(k-1):0)+wall+4,y1=yk(k)-amp-wall-4;for(let x=wall+6;x<Mw-wall-4;x+=12)for(let y=y0;y<=y1;y+=12)hs.push(sd.cylZ(x,y,1.05,-1,fl+.5))}
      if(hs.length)f=sd.cut(f,...hs);
      const mm=sd.mesh(f,[-1,-1,Mw+1,Dp+amp+2,hk(0)+2],o.preview?1.4:.6);
      parts.push({file:m>1?`tiered-planter-${j+1}-of-${m}.stl`:'tiered-planter.stl',role:j?'Second file':'Main colour',m:mm});
    }
    const hs=[...Array(n)].map((_,k)=>round(hk(k)));
    notes.push(`${n} tiers across the back, ${round(Wp)} × ${round(Dp)} mm and ${hs.join(', ')} mm tall from back to front, with a ${sk.name.toLowerCase()} front. It stands on the base floor and leaves ${round(Dfloor-Dp)} mm of floor free in front.`);
    if(m>1)notes.push(`It comes in ${m} modules that stand side by side; they need nothing to join them.`);
    notes.push('Put a thin layer of clay balls in each tier, then soil. Fill the floor in front with aquarium gravel, sand or moss: the planter keeps the two apart.');
    notes.push('Prints upright without supports. Drain holes in each floor let water through to the base.');
    if(!rectE)notes.push('Made for rectangular enclosures; for this shape it is a free-standing planter of a matching size.');
    return {parts,notes,magnets:0};
  }

  root.HabitatPots={SURF,FORM,pot,wallPot,tiers};
})(typeof window!=='undefined'?window:globalThis);
