/* Habitat, sculpted pieces: lifelike skulls, bats, ravens, moths and snakes, modelled as smooth melted shapes
   (see lib/sdf.js) instead of stacked outlines. Standing pieces get every overhang filled to 45° so they print without
   supports; wall pieces are reliefs with a flat back. Every builder returns {parts:[{file,role,m}], notes, magnets}. */
(function(root){
  const S=root.Sdf,G=root.Geo;
  const {sphere,ellipsoid,rod,chain,box,slab,smooth,cut,scut,union,both,mirrorX,move,turnX,turnY,turnZ,rough,near,mesh,fbm,noise}=S;
  const {sqrt,abs,min,max,cos,sin,PI}=Math;
  const part=(file,m,role)=>({file,role:role||'Main colour',m});
  /* scale a shape made in units of 1 to s mm */
  const sized=(f,s)=>(x,y,z)=>f(x/s,y/s,z/s)*s;

  /* ---------- a human skull, about 1 tall, facing -y ---------- */
  function skullShape(o){
    /* the vault of the head, the forehead and the back */
    const cran=smooth(.1,ellipsoid(0,.05,.62,.285,.4,.33),ellipsoid(0,-.13,.63,.27,.29,.28),ellipsoid(0,.28,.55,.245,.2,.26),ellipsoid(0,.04,.42,.235,.28,.12));
    const brow=mirrorX(rod([.04,-.425,.55],[.2,-.405,.555],.014,.01));
    /* the face: upper jaw, cheekbones and the arches back to the ear */
    const face=smooth(.06,box(0,-.32,.43,.225,.1,.11,.06),ellipsoid(0,-.375,.31,.15,.075,.07),
      mirrorX(ellipsoid(.225,-.33,.42,.075,.065,.055)),mirrorX(rod([.26,-.3,.42],[.29,-.04,.43],.03,.026)));
    /* the lower jaw: chin, body, the angle and the branch up to the hinge */
    /* the lower jaw: a U-shaped plate of bone, and a flat branch on each side up to the hinge by the ear */
    const ring=(x,y,z)=>{const a=.235,b=.395,cy=-.02,e=(Math.sqrt((x/a)**2+((y-cy)/b)**2)-1)*.235;
      const zt=.19-(y>-.1?(y+.1)*.25:0),zb=.03+Math.max(0,y+.25)*.12,hz=(zt-zb)/2,zc=(zb+zt)/2,w=.024-.008*(z-zb)/(zt-zb||1),r=.018;
      const qx=Math.abs(e+.024)-w+r,qz=Math.abs(z-zc)-hz+r,d=Math.hypot(Math.max(qx,0),Math.max(qz,0))+Math.min(Math.max(qx,qz),0)-r;
      return Math.max(d,y-.01)};
    const ramusP=S.slab([[[-.08,.06],[-.02,.04],[.04,.05],[.055,.2],[.07,.35],[.045,.37],[.02,.32],[.0,.29],[-.03,.34],[-.05,.32],[-.07,.2]]],-.02,.02,.016);
    const ramus=mirrorX((x,y,z)=>ramusP(y,z,x-.225));
    const jaw=smooth(.03,ring,ramus,ellipsoid(0,-.395,.08,.07,.03,.05));
    let f=smooth(.08,cran,face);f=smooth(.06,f,brow);
    /* hollows: the temples above the cheek arches */
    f=scut(.05,f,mirrorX(ellipsoid(.34,-.1,.5,.07,.17,.09)));
    f=smooth(.04,f,jaw);
    /* teeth, upper and lower, around the curve of the jaw */
    const teeth=[];for(const [zt,hh] of [[.262,.03],[.205,.027]])for(let i=0;i<8;i++){
      const x=.013+i*.023+(i>2?(i-2)*.005:0),y=(zt>.24?-.435:-.42)+x*x*2.6,w=i<2?.011:i<3?.012:.015,a=Math.atan(2*2.6*x);
      for(const sg of [-1,1])teeth.push(turnZ(box(sg*x,y,zt+(zt>.24?-1:1)*((i*7+(sg>0?3:0))%5)*.0015,w,.02+(i>3?.008:0),hh,.01),sg*a,sg*x,y))}
    f=smooth(.016,f,union(...teeth));
    f=cut(f,box(0,-.4,.234,.2,.08,.0035,.002));
    /* eye sockets and the nose opening */
    const eye=mirrorX(turnY(box(.128,-.48,.465,.082,.16,.07,.056),-.12,.125,.475));
    const nose=smooth(.02,mirrorX(ellipsoid(.022,-.47,.365,.03,.1,.05)),ellipsoid(0,-.47,.42,.018,.1,.04));
    f=scut(.025,f,eye);f=scut(.012,f,nose);
    if(o.age!=='clean')f=rough(f,.003,.025,o.seed||1,2);
    return f;
  }
  /* printed lying on its back, face up: the face, the eye sockets and the teeth all open upwards, so the 45° filling
     only touches the hidden back of the jaw and the inside of the mouth. The back of the head is cut flat to sit on the bed. */
  function skull(o){
    const s=o.size,cy=.425,g=skullShape(o);
    const f=sized((X,Y,Z)=>g(X,cy-Z,Y),s);
    return {f,b:[-s*.4,-s*.02,s*.4,s*1.02,s*.9],display:(x,y,z)=>[x,-z,y],note:'Prints lying on its back, face up, with no supports. The back of the head is flat where it sat on the bed.'};
  }
  /* a smooth curve through points (Catmull-Rom), as a closed outline */
  function curve(pts,n){n=n||6;const o=[],L=pts.length;for(let i=0;i<L;i++){const p0=pts[(i-1+L)%L],p1=pts[i],p2=pts[(i+1)%L],p3=pts[(i+2)%L];
    for(let k=0;k<n;k++){const t=k/n,t2=t*t,t3=t2*t;o.push([0,1].map(a=>.5*((2*p1[a])+(-p0[a]+p2[a])*t+(2*p0[a]-5*p1[a]+4*p2[a]-p3[a])*t2+(-p0[a]+3*p1[a]-3*p2[a]+p3[a])*t3)))}}return o}
  const flipX=r=>r.map(([x,y])=>[-x,y]).reverse();
  /* round magnet pockets in a flat back: open on the bed side, so they print as plain holes */
  const pockets=(f,o,list)=>{if(o.mount!=='magnet')return f;const r=(o.dMagD||10)/2+.15,d=(o.dMagH||3)+.2;return cut(f,...list.map(([x,y])=>S.cylZ(x,y,r,-1,d)))};

  /* ---------- a bat with its wings spread, as a wall relief: x across, y up, z out of the wall ---------- */
  function bat(o){
    const W=o.size,u=W;
    const wing=[[.045,.06],[.12,.11],[.2,.125],[.27,.1],[.3,.075],[.4,.115],[.5,.125],[.47,.06],[.44,.02],[.475,-.04],[.42,-.06],[.37,-.1],[.385,-.165],[.33,-.15],[.27,-.14],[.225,-.205],[.17,-.17],[.11,-.15],[.065,-.2],[.05,-.12],[.045,-.04]];
    const R=curve(wing,5),memb=slab([R],-1,.011,.004),membL=slab([flipX(R)],-1,.011,.004);
    const bones=mirrorX(smooth(.008,chain([[.05,.06,.012],[.2,.125,.013],[.3,.075,.012]],[.014,.011,.01]),
      rod([.3,.075,.012],[.5,.125,.009],.008,.003),rod([.3,.075,.012],[.475,-.04,.009],.007,.003),rod([.3,.075,.012],[.385,-.165,.009],.007,.003),rod([.3,.075,.012],[.225,-.205,.009],.006,.003),
      rod([.3,.075,.012],[.32,.11,.012],.008,.003),rod([.05,-.1,.012],[.065,-.2,.01],.01,.004)));
    let body=smooth(.02,ellipsoid(0,-.03,0,.06,.125,.058),sphere(0,.115,0,.05),ellipsoid(0,.08,.03,.025,.03,.03));
    const ears=mirrorX(turnZ(ellipsoid(.035,.175,.012,.02,.055,.014),-.35,.035,.175));
    body=smooth(.012,body,ears);body=scut(.006,body,mirrorX(sphere(.022,.11,.052,.009)));
    body=rough(body,.004,.02,o.seed||1,2);
    /* folds in the skin between the fingers */
    const fold=(x,y,z)=>.003*Math.sin(x*60+y*25);
    const mem=(x,y,z)=>min(memb(x,y,z),membL(x,y,z))+fold(x,y,z);
    let f=smooth(.01,mem,bones);f=smooth(.015,f,body);
    f=sized(f,u);f=both(f,(x,y,z)=>-z);
    f=pockets(f,o,W>110?[[0,-.03*W],[.3*W,.075*W],[-.3*W,.075*W]]:[[0,-.03*W]]);
    return {f,b:[-.52*W,-.23*W,.52*W,.16*W+.12*W,.075*W],relief:true,magnets:o.mount==='magnet'?(W>110?3:1):0};
  }

  /* ---------- a death's-head hawkmoth, as a wall relief ---------- */
  function moth(o){
    const W=o.size;
    const fore=curve([[.04,.08],[.15,.14],[.3,.19],[.45,.24],[.51,.235],[.48,.17],[.42,.08],[.3,.02],[.15,-.02],[.06,.0]],5);
    const hind=curve([[.05,-.0],[.16,-.02],[.27,-.05],[.3,-.1],[.24,-.17],[.14,-.18],[.07,-.12]],5);
    const wings=union(slab([fore],-1,.016,.005),slab([flipX(fore)],-1,.016,.005),slab([hind],-1,.012,.004),slab([flipX(hind)],-1,.012,.004));
    /* veins and the bands across the wings */
    const veins=mirrorX(union(rod([.06,.06,.016],[.46,.2,.016],.004,.002),rod([.07,.05,.016],[.42,.1,.016],.0035,.002),rod([.06,.04,.016],[.3,.02,.016],.0035,.002),
      rod([.06,-.02,.012],[.27,-.08,.012],.003,.002),rod([.06,-.03,.012],[.18,-.16,.012],.003,.002)));
    const band=mirrorX(rod([.2,.02,.02],[.3,.2,.02],.006));
    let w=smooth(.006,wings,veins);w=scut(.004,w,band);
    let body=smooth(.02,ellipsoid(0,.05,0,.055,.075,.05),ellipsoid(0,-.13,0,.045,.17,.042),sphere(0,.14,0,.035));
    /* the rings of the abdomen */
    for(let i=0;i<5;i++)body=scut(.004,body,ellipsoid(0,-.05-i*.045,.045,.06,.004,.014));
    /* the skull mark on the back */
    body=scut(.004,body,mirrorX(ellipsoid(.018,.065,.05,.012,.014,.012)),ellipsoid(0,.035,.05,.006,.008,.01));
    const ant=mirrorX(chain([[.015,.165,.02],[.06,.25,.015],[.1,.3,.012]],[.006,.004,.006],.01));
    let f=smooth(.012,w,body,ant);f=rough(f,.0025,.015,o.seed||1,2);
    f=sized(f,W);f=both(f,(x,y,z)=>-z);
    f=pockets(f,o,[[0,.04*W]]);
    return {f,b:[-.52*W,-.33*W,.52*W,.33*W,.06*W],relief:true,magnets:o.mount==='magnet'?1:0};
  }

  /* ---------- a raven on a stone, standing ---------- */
  function raven(o){
    const H=o.size;
    const body=smooth(.06,rod([0,-.08,.42],[0,.17,.33],.13,.085),ellipsoid(0,-.1,.4,.11,.11,.13));
    const neck=rod([0,-.1,.48],[0,-.15,.62],.095,.08),head=ellipsoid(0,-.16,.66,.075,.09,.08);
    const beak=smooth(.01,rod([0,-.22,.665],[0,-.37,.625],.034,.006),rod([0,-.22,.645],[0,-.33,.62],.024,.004));
    const tail=rod([0,.17,.33],[0,.4,.22],.06,.035),tailF=(x,y,z)=>max(tail(x,y,z),abs(z-(.33-(y-.17)*.48))-.018);
    const wings=mirrorX(rod([.085,-.06,.47],[.065,.3,.3],.07,.02));
    const legs=mirrorX(chain([[.04,-.04,.3],[.045,-.05,.17],[.05,-.08,.13]],[.022,.013,.013],.01));
    const stone=ellipsoid(0,0,.02,.27,.3,.13);
    let f=smooth(.04,body,neck,head);f=smooth(.05,f,wings);f=smooth(.012,f,beak);f=smooth(.03,f,tailF);
    /* feathers: fine overlapping ridges on the wings and back */
    f=(g=>(x,y,z)=>{const d=g(x,y,z);if(abs(d)>.015)return d;const w=abs(x)>.04?1:.35;return d+.0018*w*(Math.sin(y*120-abs(x)*40+z*60)+.5*Math.sin(y*230+z*150))})(f);
    f=scut(.004,f,mirrorX(sphere(.058,-.2,.69,.011)));
    f=smooth(.02,f,legs);
    f=smooth(.03,f,rough(stone,.012,.06,o.seed||1,3));
    f=sized(f,H);
    return {f,b:[-.3*H,-.42*H,.3*H,.45*H,.76*H],note:'Prints standing up, without supports: the space under the body and the beak is filled in at 45°.'};
  }

  /* ---------- a snake coiled on the ground, head resting on the top coil ---------- */
  function snake(o){
    const D=o.size,r=.07;
    /* the spine: a flat spiral, then rising onto the coil */
    const pts=[],rs=[];const turns=2.3;
    for(let i=0;i<=60;i++){const t=i/60,a=t*turns*Math.PI*2,R=.44-t*.3;pts.push([R*Math.cos(a),R*Math.sin(a),r*.75+(t>.82?(t-.82)*.5:0)]);rs.push(r*(t<.1?.35+t*6.5:t>.88?1-(t-.88)*2:1))}
    let body=chain(pts,rs,.02);
    const hp=pts[pts.length-1],hd=[hp[0]-pts[pts.length-3][0],hp[1]-pts[pts.length-3][1]],hl=Math.hypot(...hd);
    const head=smooth(.02,ellipsoid(hp[0]+hd[0]/hl*.06,hp[1]+hd[1]/hl*.06,hp[2],.09,.06,.04),ellipsoid(hp[0]+hd[0]/hl*.11,hp[1]+hd[1]/hl*.11,hp[2]-.005,.05,.04,.028));
    let f=smooth(.03,body,turnZ(head,Math.atan2(hd[1],hd[0]),hp[0]+hd[0]/hl*.06,hp[1]+hd[1]/hl*.06));
    /* scales: a fine diamond pattern */
    f=(g=>(x,y,z)=>{const d=g(x,y,z);return abs(d)>.02?d:d+.003*abs(Math.sin(x*140+y*80)*Math.sin(x*80-y*140+z*90))})(f);
    f=sized(f,D);f=both(f,(x,y,z)=>-z+.025*D);const g=f;f=(x,y,z)=>g(x,y,z+.025*D);
    return {f,b:[-.55*D,-.55*D,.55*D,.55*D,.3*D],note:'Prints flat on the bed without supports.'};
  }

  /* ---------- a real human skull, from a detailed anatomical model ----------
     "High quality skull" by Mariano Coretti (DrCoretti), Wikimedia Commons, CC BY-SA 4.0. Its 54 separate bones were
     merged into one solid and stored as a distance field (skull-scan.bin): a small grid that says how far each point
     is from the bone surface. It loads once when the page opens. */
  const SCAN={ready:false,credit:'Skull model: "High quality skull" by Mariano Coretti (DrCoretti), Wikimedia Commons, CC BY-SA 4.0.'};
  async function loadScan(url){
    try{const r=await fetch(url);if(!r.ok)throw new Error(r.status);let buf;
      if(typeof DecompressionStream!=='undefined'){buf=await new Response(r.body.pipeThrough(new DecompressionStream('gzip'))).arrayBuffer()}else throw new Error('no gzip');
      const dv=new DataView(buf);SCAN.nx=dv.getInt32(0,true);SCAN.ny=dv.getInt32(4,true);SCAN.nz=dv.getInt32(8,true);SCAN.qs=dv.getInt32(12,true);SCAN.vf=dv.getFloat32(16,true);
      SCAN.q=new Int8Array(buf,20,SCAN.nx*SCAN.ny*SCAN.nz);SCAN.ready=true;if(SCAN.onready)SCAN.onready()}catch(e){SCAN.error=String(e)}
  }
  /* the scan, as a shape 1 tall, centred across, the face looking along -y, standing on z=0 */
  function scanShape(){
    const {nx,ny,nz,qs,vf,q}=SCAN,ox=nx*vf/2,oy=ny*vf/2,oz=3*vf,far=7*vf;
    const I=(i,j,k)=>q[(k*ny+j)*nx+i];
    /* the stored grid has the face towards +y: turn it round */
    return (x,y,z)=>{const u=(ox-x)/vf-.5,v=(oy-y)/vf-.5,w=(z+oz)/vf-.5;
      if(u<0||v<0||w<0||u>=nx-1||v>=ny-1||w>=nz-1)return far;
      const i=u|0,j=v|0,k=w|0,a=u-i,b=v-j,c=w-k;
      const c00=I(i,j,k)*(1-a)+I(i+1,j,k)*a,c10=I(i,j+1,k)*(1-a)+I(i+1,j+1,k)*a,c01=I(i,j,k+1)*(1-a)+I(i+1,j,k+1)*a,c11=I(i,j+1,k+1)*(1-a)+I(i+1,j+1,k+1)*a;
      return ((c00*(1-b)+c10*b)*(1-c)+(c01*(1-b)+c11*b)*c)/qs*vf}}
  function realSkull(o){
    if(!SCAN.ready)return null;
    const s=o.size,g=scanShape(),L=(SCAN.ny-6)*SCAN.vf,W=(SCAN.nx-6)*SCAN.vf,cy=L/2-.03;
    /* printed lying on its back, face up, like the sculpted one; the back of the head is cut flat for the bed */
    const f=sized((X,Y,Z)=>g(X,cy-Z,Y),s);
    return {f,b:[-s*(W/2+.02),-s*.02,s*(W/2+.02),s*1.02,s*(cy+L/2+.02)],display:(x,y,z)=>[x,-z,y],credit:SCAN.credit,
      note:'Prints lying on its back, face up, with no supports: hollows that open downwards are filled in at 45°, out of sight. The back of the head is flat where it sat on the bed. The eye sockets have thin bone at the back, as a real skull does.'};
  }
  const SCULPTS={real:'Human skull, anatomical (from a real model)',skull:'Human skull, sculpted',bat:'Bat, wings spread (wall)',moth:'Death\'s-head moth (wall)',raven:'Raven on a stone',snake:'Coiled snake'};

  const MAKERS={real:realSkull,skull,bat,moth,raven,snake},CACHE=new Map();
  function build(o){
    const k=MAKERS[o.kind]?o.kind:'skull',key=JSON.stringify([k,o.size,o.seed,o.print,o.detail,o.mount,o.dMagD,o.dMagH,o.age,o.preview]);
    if(CACHE.has(key))return CACHE.get(key);
    let sh=MAKERS[k](o);const late=!sh;if(!sh)sh=skull(o);
    const h=Math.max(.2,Math.min(.5,o.size/(sh.relief?220:140)))*(o.detail==='fine'?.75:1)*(o.preview?1.8:1);
    const m=mesh(sh.f,sh.b,h,{print:o.print!=='full',debug:o.debug});
    const notes=[];if(late)notes.push(SCAN.error?'The anatomical skull could not be loaded here, so this is the sculpted one.':'The anatomical skull is still loading: this is the sculpted one for now. Change any setting in a moment to see it.');if(sh.note)notes.push(sh.note);if(sh.credit)notes.push(sh.credit+' You may sell prints; credit it, for example on the card or listing.');if(sh.relief)notes.push('Prints flat on its back without supports.'+(o.mount==='magnet'?' The magnet pockets are in the back.':''));
    if(o.print==='full')notes.push('Full detail: turn on tree supports in the slicer.');
    const res={parts:[part(k+'.stl',m)],notes,magnets:sh.magnets||0,display:sh.display,relief:!!sh.relief};
    if(!late){if(CACHE.size>20)CACHE.clear();CACHE.set(key,res)}return res;
  }
  /* ---------- your own model (an STL from Blender or a shop), sized and given a base or a mount ---------- */
  function parseSTL(buf){
    const dv=new DataView(buf),n=buf.byteLength>=84?dv.getUint32(80,true):0;
    if(buf.byteLength===84+n*50&&n>0){const t=new Float32Array(n*9);for(let i=0;i<n;i++)for(let k=0;k<9;k++)t[i*9+k]=dv.getFloat32(84+i*50+12+k*4,true);return t}
    const txt=new TextDecoder().decode(new Uint8Array(buf)),v=[];const re=/vertex\s+([-+\d.eE]+)\s+([-+\d.eE]+)\s+([-+\d.eE]+)/g;let m;
    while((m=re.exec(txt)))v.push(+m[1],+m[2],+m[3]);if(!v.length||v.length%9)throw new Error('not an STL file');return new Float32Array(v)}
  function custom(o){
    const src=root.HabitatSculpt.model;
    if(!src)return {parts:[],notes:['Choose an STL file first (from Blender: File > Export > STL).'],magnets:0};
    const t=new Float32Array(src.tris.length),n=t.length/3;
    /* turn it the way it should print */
    for(let i=0;i<n;i++){let x=src.tris[i*3],y=src.tris[i*3+1],z=src.tris[i*3+2];
      if(o.turn==='x')[y,z]=[-z,y];else if(o.turn==='xr')[y,z]=[z,-y];else if(o.turn==='y')[x,z]=[z,-x];else if(o.turn==='flip')[y,z]=[-y,-z];
      t[i*3]=x;t[i*3+1]=y;t[i*3+2]=z}
    let mn=[1e9,1e9,1e9],mx=[-1e9,-1e9,-1e9];for(let i=0;i<t.length;i+=3)for(let a=0;a<3;a++){mn[a]=min(mn[a],t[i+a]);mx[a]=max(mx[a],t[i+a])}
    const ext=[mx[0]-mn[0],mx[1]-mn[1],mx[2]-mn[2]],k=o.size/(o.fit==='longest'?max(...ext):ext[2]||1);
    const base=o.base||'none',bh=base==='none'?0:Math.max(3,o.size*.06),sink=base==='none'?0:.6;
    for(let i=0;i<t.length;i+=3){t[i]=(t[i]-(mn[0]+mx[0])/2)*k;t[i+1]=(t[i+1]-(mn[1]+mx[1])/2)*k;t[i+2]=(t[i+2]-mn[2])*k+bh-sink}
    /* sum of signed volumes, and edges that aren't closed */
    let vol=0;for(let i=0;i<t.length;i+=9)vol+=(t[i]*(t[i+4]*t[i+8]-t[i+5]*t[i+7])-t[i+1]*(t[i+3]*t[i+8]-t[i+5]*t[i+6])+t[i+2]*(t[i+3]*t[i+7]-t[i+4]*t[i+6]))/6;
    const notes=[`Your model, ${(ext[0]*k).toFixed(0)} × ${(ext[1]*k).toFixed(0)} × ${(ext[2]*k).toFixed(0)} mm${bh?' on a '+(base==='rock'?'rock':'round')+' base':''}.`];
    const parts=[];let magnets=0;
    const r=max(ext[0],ext[1])*k/2;
    if(base!=='none'){
      let bf;const pk=o.mount==='magnet'?[[0,0]]:[];
      if(base==='round'){const f=[G.prism(0,bh,G.circle(0,0,r*1.08+2,96)),G.prism(bh-.8,bh,G.subtract(G.circle(0,0,r*1.08+2,96),G.circle(0,0,r*1.08+1.2,96)),'sub'),G.prism(bh-.8,bh,G.circle(0,0,r*1.08+1.2,96))];
        for(const [x,y] of pk)f.push(G.prism(0,(o.mh||3)+.2,G.circle(x,y,(o.md||10)/2+.15,40),'sub'));
        if(o.mount==='peg')f.push(G.prism(0,root.HabitatParts.PEG.depth,G.circle(0,0,root.HabitatParts.PEG.sock,40),'sub'));
        bf=G.build(f)}
      else{let rk=rough(S.ellipsoid(0,0,0,r*1.15+3,r*1.15+3,bh*2),bh*.18,bh*1.2,o.seed||1,3);rk=both(rk,(x,y,z)=>-z);
        if(o.mount==='magnet')rk=cut(rk,S.cylZ(0,0,(o.md||10)/2+.15,-1,(o.mh||3)+.2));
        if(o.mount==='peg')rk=cut(rk,S.cylZ(0,0,root.HabitatParts.PEG.sock,-1,root.HabitatParts.PEG.depth));
        bf=mesh(rk,[-r*1.2-4,-r*1.2-4,r*1.2+4,r*1.2+4,bh*2+1],Math.max(.3,r/80))}
      const all=new Float32Array(t.length+bf.tris.length);all.set(t);all.set(bf.tris,t.length);
      parts.push(part('model-on-base.stl',{tris:all,vol:abs(vol)+bf.vol}));
      notes.push('The model and its base are one file, overlapping a little, so the slicer joins them.');
      if(o.mount==='magnet'){magnets=1;notes.push('One magnet goes into the pocket under the base.')}
      if(o.mount==='peg')notes.push('The socket under the base fits the floor pegs.');
    }else{
      parts.push(part('model.stl',{tris:t,vol:abs(vol)}));
      if(o.mount==='magnet'){const w=min(40,max(16,r)),f=[G.prism(0,2.6,G.rrect(-w/2,-w/2,w/2,w/2,3)),G.prism(2.6-(o.mh||3)+0,2.6,G.circle(0,0,(o.md||10)/2+.15,40),'sub')];
        const pl=G.build([G.prism(0,(o.mh||3)+1,G.rrect(-w/2,-w/2,w/2,w/2,3)),G.prism(1,(o.mh||3)+1.01,G.circle(0,0,(o.md||10)/2+.15,40),'sub')]);
        parts.push(part('magnet-plate.stl',pl,'Second file'));magnets=1;notes.push('Glue the magnet into the plate, then glue the plate flat to the back of your model.')}
    }
    if(o.turn&&o.turn!=='none')notes.push('Turned before printing, as chosen. Check in the slicer that the flattest side is on the bed.');
    notes.push('Your model is printed as you made it: if it hangs out over air, turn on supports in the slicer.');
    return {parts,notes,magnets};
  }
  root.HabitatSculpt={SCULPTS,build,skullShape,custom,parseSTL,model:null,loadScan,SCAN};
})(typeof window!=='undefined'?window:globalThis);
