/* Habitat, pieces from real 3D scans of museum specimens, statues and shells, each stored as a compact distance field and meshed here at the size you choose. Standing
   pieces get every overhang filled to 45° so they print without supports; wall pieces are reliefs with a flat back.
   Also: your own model from an STL file. Every builder returns {parts:[{file,role,m}], notes, magnets}. */
(function(root){
  const S=root.Sdf,G=root.Geo;
  const {sphere,ellipsoid,rod,chain,box,slab,smooth,cut,scut,union,both,mirrorX,move,turnX,turnY,turnZ,rough,near,mesh,fbm,noise}=S;
  const {sqrt,abs,min,max,cos,sin,PI}=Math;
  const part=(file,m,role)=>({file,role:role||'Main colour',m});
  /* scale a shape made in units of 1 to s mm */
  const sized=(f,s)=>(x,y,z)=>f(x/s,y/s,z/s)*s;

  const pockets=(f,o,list)=>{if(o.mount!=='magnet')return f;const r=(o.dMagD||10)/2+.05,d=(o.dMagH||3)+.2;return cut(f,...list.map(([x,y])=>S.cylZ(x,y,r,-1,d)))};

  /* ---------- pieces made from real 3D scans ----------
     Each scan was merged into one solid and stored as a distance field: a small grid (gzip, int8) that says how
     far each point is from the surface. They load once, in the background, when the page opens.
     stand: prints standing on the bed, z up. relief: a wall piece, x across, y up, z out of the wall. */
  const SCANS={
    real:{group:'Gothic and curiosities',file:'skull-scan.bin',name:'Human skull',type:'stand',size:'height',legacy:true,
      credit:'Skull model: "High quality skull" by Mariano Coretti (DrCoretti), Wikimedia Commons, CC BY-SA 4.0.',
      note:'Prints lying on its back, face up, with no supports: hollows that open downwards are filled in at 45°, out of sight. The back of the head is flat where it sat on the bed. The eye sockets have thin bone at the back, as a real skull does.'},
    raven:{group:'Gothic and curiosities',file:'raven-scan.bin',name:'Raven on its perch',type:'stand',size:'height',
      credit:'Raven model: "Common raven", a mounted specimen of the Krystyna and Włodzimierz Tomek Natural Science Museum in Ciężkowice, scanned by Virtual Museums of Małopolska, CC0 (public domain): no credit needed.',
      note:'A real mounted raven, standing on the short branch it was mounted on. It prints standing up: the tail and the underside of the body are filled in at 45° below, out of sight, so no supports are needed.'},
    ravenskull:{group:'Gothic and curiosities',file:'ravenskull-scan.bin',name:'Raven skull',type:'stand',size:'length',cut:.05,
      credit:'Raven skull model: "Raven skull", a micro-CT scan by University of Dundee Museum Collections (D\'Arcy Thompson Zoology Museum), CC0 (public domain): no credit needed.',
      note:'A micro-CT scan of a real raven skull. It prints the right way up, cut flat a little at the bottom so it stands; hollows under the bone are filled in at 45°. Size is the length, beak to back.'},
    python:{group:'Gothic and curiosities',file:'python-scan.bin',name:'Python skeleton, coiled',type:'stand',size:'length',
      credit:'Python skeleton model: "Royal Python (Python regius)" by The University of Edinburgh (CT courtesy of Dr. Tobias Schwarz, prepared by Brian Mather, Royal (Dick) School of Veterinary Studies), Sketchfab, CC BY 4.0.',
      note:'A CT scan of a real royal python skeleton, lying in a loose coil. The bones were thickened slightly so the ribs print; under 80 mm long they get very fine, so print it large (about 100–150 mm) and with a 0.2 mm nozzle layer height. It prints flat, as it lies.'},
    bat:{group:'Gothic and curiosities',file:'bat-scan.bin',name:'Bat, wings spread (wall)',type:'relief',size:'width',mags:[[0,-.02]],
      credit:'Bat model: "Bat" by victorberdugo1, Sketchfab, CC BY 4.0.',
      note:'A bat with its wings spread wide, as a wall relief: its head and body stand out and the wings sweep back towards the wall. It prints flat on its back, without supports. Size is the wingspan.'},
    moth:{group:'Gothic and curiosities',file:'moth-scan.bin',name:'Death\'s-head hawkmoth (wall)',type:'relief',size:'length',mags:[[0,0]],
      credit:'Moth model: "Death\'s-head Hawk Moth Acherontia Atropos", a specimen of The Watt Institution (Greenock), Sketchfab, CC BY 4.0.',
      note:'A scan of a real death\'s-head hawkmoth at rest, wings folded over its back, as a wall relief. It prints flat on its back, without supports. Size is its length, head to wing tips; paint the skull mark on the thorax.'},
    angel:{file:'angel-scan.bin',name:'Praying angel',group:'Gothic and curiosities',type:'stand',size:'height',
      credit:'Angel model: "Engel" by noe-3d.at (cultural heritage scans of Lower Austria), Sketchfab, CC BY 4.0.',
      note:'A scan of a carved stone angel from a grave, wings folded, on its own plinth. It prints standing; the wings and arms are filled underneath at 45°, so no supports are needed. Size is the height.'},
    tombstone:{file:'tombstone-scan.bin',name:'Grave monument with mourning figure',group:'Gothic and curiosities',type:'stand',size:'height',
      credit:'Grave monument model: "Tombstone Familie Laurenz" by 3dhdscan, Sketchfab, CC BY 4.0.',
      note:'A scan of a real grave monument: a veiled mourning figure on a tall stepped plinth. It prints standing, without supports. Size is the height.'},
    barnowl:{file:'barnowl-scan.bin',name:'Barn owl (mounted specimen)',group:'Gothic and curiosities',type:'stand',size:'height',
      credit:'Barn owl model: "Barn Owl (Tyto alba)", a specimen of The Watt Institution (Greenock), Sketchfab, CC BY 4.0.',
      note:'A scan of a real mounted barn owl on its display base. It prints standing; the tail and the underside are filled at 45° below, out of sight. Size is the height.'},
    stagbeetle:{file:'stagbeetle-scan.bin',name:'Stag beetle (specimen)',group:'Gothic and curiosities',type:'stand',size:'length',
      credit:'Stag beetle model: "European stag beetle", a specimen scanned by Virtual Museums of Małopolska, CC0 (public domain): no credit needed.',
      note:'A scan of a real European stag beetle. It prints lying as it was pinned; the legs are thin, so make it at least 80 mm long. Size is the length, antlers to tail.'},
    ammonite:{file:'ammonite-scan.bin',name:'Ammonite fossil (wall)',group:'Gothic and curiosities',type:'relief',size:'width',cut:.3,mags:[[0,0]],
      credit:'Ammonite model: "Ammonite Euaspidoceras paucituberkulatum Arkell", scanned by Virtual Museums of Małopolska, CC0 (public domain): no credit needed.',
      note:'A scan of a real Jurassic ammonite, cut flat at the back so it hangs on the wall like a fossil plaque. It prints flat on its back. Size is its width.'},
    nautilus:{file:'nautilus-scan.bin',name:'Nautilus shell',group:'Gothic and curiosities',type:'stand',size:'length',cut:.12,
      credit:'Nautilus model: "Nautilus Shell" by RISD Nature Lab, Sketchfab, CC BY 4.0.',
      note:'A scan of a real chambered nautilus shell, lying on its side with the spiral on top, cut a little flat underneath. It prints without supports. Size is the length.'},
    pinecone:{file:'pinecone-scan.bin',name:'Pine cone with little mushrooms',group:'Forest and crystals',type:'stand',size:'height',
      credit:'Pine cone model: "Pine Cone with Fungi" by Thomas Flynn, Sketchfab, CC BY 4.0.',
      note:'A scan of a real pine cone with tiny mushrooms growing from it. It prints standing; tiny caps too thin to print are left off. Size is the height.'},
    amethyst:{file:'amethyst-scan.bin',name:'Amethyst geode',group:'Forest and crystals',type:'stand',size:'length',cut:.05,
      credit:'Amethyst model: "Amethyst Geode" by University Libraries at Virginia Tech, Sketchfab, CC BY 4.0.',
      note:'A scan of a real amethyst geode: a rough rock opening onto a bed of crystals. Print it in a translucent purple, or paint it. Size is the length.'},
    lion:{file:'lion-scan.bin',name:'Lion statue',group:'Ancient temple',type:'stand',size:'height',
      credit:'Lion model: "Lion Statue" by Thomas Flynn, Sketchfab, CC0 (public domain): no credit needed.',
      note:'A scan of a classical stone lion with a shield, on its plinth. It prints standing, without supports. Size is the height.'},
    torso:{file:'torso-scan.bin',name:'Marble torso of Dionysos',group:'Ancient temple',type:'stand',size:'height',cut:.02,
      credit:'Torso model: "Marble torso from a statue of Dionysos" by Thomas Flynn, Sketchfab, CC BY 4.0.',
      note:'A scan of an ancient Roman marble torso, broken as it was found, like a ruin. It prints standing. Size is the height.'}};
  const SCULPTS={},OPTIONS=[];for(const k in SCANS){SCULPTS[k]=SCANS[k].name;OPTIONS.push([k,SCANS[k].name,SCANS[k].group])}
  /* older names for the same pieces */
  const ALIAS={skull:'real',snake:'python'};
  const SCAN=SCANS.real;
  function loadOne(k){const v=VER;const S0=SCANS[k];if(S0.loading)return S0.loading;
    return S0.loading=(async()=>{try{const r=await fetch(S0.file+(v?'?v='+v:''));if(!r.ok)throw new Error(r.status);
      if(typeof DecompressionStream==='undefined')throw new Error('no gzip');
      const buf=await new Response(r.body.pipeThrough(new DecompressionStream('gzip'))).arrayBuffer(),dv=new DataView(buf);
      Object.assign(S0,{nx:dv.getInt32(0,true),ny:dv.getInt32(4,true),nz:dv.getInt32(8,true),qs:dv.getInt32(12,true),vf:dv.getFloat32(16,true)});
      S0.q=new Int8Array(buf,20,S0.nx*S0.ny*S0.nz);S0.ready=true;if(api.onready)api.onready(k)}catch(e){S0.error=String(e)}})()}
  /* scans load when a piece first needs them; pending() waits for every one that has started */
  let VER='';function setVersion(v){VER=v}
  function pending(){return Promise.all(Object.values(SCANS).filter(S0=>S0.loading).map(S0=>S0.loading))}
  /* the scan as a distance field, in units where one voxel is vf; centred across, standing on z=0 */
  function field(S0){
    const {nx,ny,nz,qs,vf,q}=S0,ox=nx*vf/2,oy=ny*vf/2,oz=3*vf,far=7*vf,I=(i,j,k)=>q[(k*ny+j)*nx+i];
    return (x,y,z)=>{const u=S0.legacy?(ox-x)/vf-.5:(x+ox)/vf-.5,v=S0.legacy?(oy-y)/vf-.5:(y+oy)/vf-.5,w=(z+oz)/vf-.5;
      if(u<0||v<0||w<0||u>=nx-1||v>=ny-1||w>=nz-1)return far;
      const i=u|0,j=v|0,k=w|0,a=u-i,b=v-j,c=w-k;
      const c00=I(i,j,k)*(1-a)+I(i+1,j,k)*a,c10=I(i,j+1,k)*(1-a)+I(i+1,j+1,k)*a,c01=I(i,j,k+1)*(1-a)+I(i+1,j,k+1)*a,c11=I(i,j+1,k+1)*(1-a)+I(i+1,j+1,k+1)*a;
      return ((c00*(1-b)+c10*b)*(1-c)+(c01*(1-b)+c11*b)*c)/qs*vf}}
  function scanPiece(k,o){
    const S0=SCANS[k];if(!S0.ready)return null;
    const ex=(S0.nx-6)*S0.vf,ey=(S0.ny-6)*S0.vf,ez=(S0.nz-6)*S0.vf,g=field(S0);
    if(S0.legacy){/* the anatomical skull: printed lying on its back, face up */
      const s=o.size,L=(S0.ny-6)*S0.vf,W=(S0.nx-6)*S0.vf,cy=L/2-.03,f=sized((X,Y,Z)=>g(X,cy-Z,Y),s);
      return {f,b:[-s*(W/2+.02),-s*.02,s*(W/2+.02),s*1.02,s*(cy+L/2+.02)],display:(x,y,z)=>[x,-z,y]}}
    const ref=S0.size==='height'?ez:S0.size==='width'?ex:Math.max(ex,ey),s=o.size/ref;
    let f=sized(g,s);const X=ex*s/2,Y=ey*s/2,Z=ez*s;
    if(S0.cut){const zc=S0.cut*Z;const f0=f;f=(x,y,z)=>f0(x,y,z+zc)}
    if(S0.type==='relief'){f=both(f,(x,y,z)=>-z);f=pockets(f,o,(S0.mags||[[0,0]]).map(([a,b])=>[a*2*X,b*2*Y]))}
    return {f,b:[-X-1,-Y-1,X+1,Y+1,Z*(1-(S0.cut||0))+1],relief:S0.type==='relief',magnets:S0.type==='relief'&&o.mount==='magnet'?(S0.mags||[0]).length:0}}

  const CACHE=new Map();
  function build(o){
    const k=SCANS[ALIAS[o.kind]||o.kind]?(ALIAS[o.kind]||o.kind):'real',S0=SCANS[k],key=JSON.stringify([k,o.size,o.print,o.detail,o.mount,o.dMagD,o.dMagH,o.preview]);
    if(CACHE.has(key))return CACHE.get(key);
    const sh=scanPiece(k,o);
    if(!sh){if(!S0.loading)loadOne(k);return {parts:[],notes:[S0.error?`The ${S0.name.toLowerCase()} could not be loaded here. Check the connection and reload the page.`:`The ${S0.name.toLowerCase()} is still loading. It appears in a moment.`],magnets:0,loading:true}}
    const h=Math.max(.2,Math.min(.5,o.size/(sh.relief?170:140)))*(o.detail==='fine'?.75:1)*(o.preview?1.8:1);
    const m=mesh(sh.f,sh.b,h,{print:o.print!=='full'&&!sh.relief});
    const notes=[S0.note,S0.credit+(S0.credit.includes('no credit needed')?'':' You may sell prints; credit it, for example on the card or listing.')];
    if(sh.relief)notes.push(o.mount==='magnet'?'The magnet pockets are in the back.':'Choose magnets to hang it on a wall.');
    if(o.print==='full'&&!sh.relief)notes.push('Full detail: turn on tree supports in the slicer.');
    const res={parts:[part(k+'.stl',m)],notes,magnets:sh.magnets||0,display:sh.display,relief:!!sh.relief};
    if(CACHE.size>20)CACHE.clear();CACHE.set(key,res);return res;
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
        const pl=G.build([G.prism(0,(o.mh||3)+1,G.rrect(-w/2,-w/2,w/2,w/2,3)),G.prism(1,(o.mh||3)+1.01,G.mag(0,0,o.md||10),'sub')]);
        parts.push(part('magnet-plate.stl',pl,'Second file'));magnets=1;notes.push('Press the magnet into the plate. Fix the plate to the back of your model with double-sided tape, or give the model a flat back and choose magnets instead.')}
    }
    if(o.turn&&o.turn!=='none')notes.push('Turned before printing, as chosen. Check in the slicer that the flattest side is on the bed.');
    notes.push('Your model is printed as you made it: if it hangs out over air, turn on supports in the slicer.');
    return {parts,notes,magnets};
  }
  const api={SCULPTS,OPTIONS,SCANS,build,custom,parseSTL,model:null,setVersion,pending,SCAN,onready:null};root.HabitatSculpt=api;
})(typeof window!=='undefined'?window:globalThis);
