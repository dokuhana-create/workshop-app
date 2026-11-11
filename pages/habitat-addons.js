/* Habitat add-ons: a modular backdrop wall (textured tiles that click together, with planting pockets), a moult-safe
   ceiling grid, and a photo stage. */
(function(root){
  const G=root.Geo,S=root.Sdf;
  const {rect,rrect,circle,ngon,move,offset,intersect,subtract,unite,prism,build}=G;
  const {sin,cos,PI,min,max,abs,floor,sqrt}=Math;
  const U=(...a)=>{let r=null;for(const x of a)if(x&&x.length)r=r?unite(r,x):x;return r||[]};
  const part=(file,m,role)=>({file,role:role||'Main colour',m});

  /* ---------- modular backdrop wall ---------- */
  /* textures, as a height 0..1 at a point on the wall (world mm, so the tiles carry on into each other) */
  function cells(x,y,s,seed){const i=floor(x/s),j=floor(y/s);let d1=1e9,d2=1e9;
    for(let a=-1;a<=1;a++)for(let b=-1;b<=1;b++){const h=S.noise((i+a)*1.7,(j+b)*1.3,seed,seed)*.5+.5,k=S.noise((i+a)*2.9,(j+b)*.7,seed+3,seed)*.5+.5;
      const px=(i+a+h)*s,py=(j+b+k)*s,d=Math.hypot(x-px,y-py);if(d<d1){d2=d1;d1=d}else if(d<d2)d2=d}return [d1,d2]}
  const TEX={
    rock:(x,y,s)=>{const v=.5+.75*S.fbm(x/26,y/15,.3,s,4)+.18*sin(y/6+S.fbm(x/30,y/30,1,s+5,2)*4),k=v*5,fl=floor(k),fr=k-fl,
      t=(fl+min(1,fr*fr*3))/5;return min(1,max(0,t*.85+.15*abs(S.fbm(x/3,y/3,0,s+7,2))))},
    bark:(x,y,s)=>{const n=S.fbm(x/3.5,y/28,.5,s,3);return min(1,max(0,.5+.9*n+.15*sin(x/2.2+S.fbm(x/9,y/30,0,s+2,2)*4)))},
    stone:(x,y,s)=>{const [a,b]=cells(x,y,22,s);const edge=min(1,(b-a)/4);return edge*(.75+.25*S.fbm(x/8,y/8,0,s+1,2))},
    moss:(x,y,s)=>{const n=S.fbm(x/6,y/6,.2,s,4);return min(1,max(0,.5+.8*n))},
    roots:(x,y,s)=>{let v=0;for(let k=0;k<4;k++){const w=abs(sin((x+S.fbm(x/30,y/50,k,s+k,3)*45)/(9+k*4)+k*1.7));v=max(v,max(0,1-w*3.2))}return min(1,v*.9+.15*(S.fbm(x/6,y/6,0,s+9,2)+.5))}
  };
  const TEXNAMES=[['rock','Layered rock'],['bark','Bark'],['stone','Fieldstone wall'],['roots','Tangled roots'],['moss','Moss and soil']];
  /* the outline of one tile, with dovetail tabs on the right and top edges and matching slots on the left and bottom */
  function tileOutline(w,h,edges){
    const a=4,b=7,L=6,c=.2,pos=n=>n>70?[n*.3,n*.7]:[n/2];
    let o=rect(0,0,w,h);
    for(const p of pos(h)){
      if(edges.right)o=unite(o,[[[w-.5,p-a],[w+L,p-b],[w+L,p+b],[w-.5,p+a]]]);
      if(edges.left)o=subtract(o,offset([[[-1,p-a],[0,p-a],[L,p-b],[L,p+b],[0,p+a],[-1,p+a]]],c))}
    for(const p of pos(w)){
      if(edges.top)o=unite(o,[[[p+a,h-.5],[p+b,h+L],[p-b,h+L],[p-a,h-.5]]]);
      if(edges.bottom)o=subtract(o,offset([[[p+a,-1],[p+a,0],[p+b,L],[p-b,L],[p-a,0],[p-a,-1]]],c))}
    return o;
  }
  function wall(o){
    const w=o.w||100,h=o.h||100,cols=max(1,min(4,o.cols||2)),rows=max(1,min(3,o.rows||1)),dep=o.depth||5,bt=2.4,tex=TEX[o.texture]||TEX.rock,seed=o.seed||1;
    const md=o.md||10,mh=o.mh||3,parts=[],notes=[];let magnets=0;
    const pk=o.pockets==='none'?[]:o.pockets==='two'?[[0,0],[cols-1,rows-1]]:[[floor((cols-1)/2),0]];
    for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){
      const edges={right:i<cols-1,top:j<rows-1,left:i>0,bottom:j>0},ol=tileOutline(w,h,edges),X=i*w,Y=j*h;
      let plate=S.slab(ol,-1,bt,0,300);
      /* the texture rises from the plate, a little lower at the edges of the whole wall */
      /* the height is worked out once on a fine raster, then looked up */
      const st=.5,x0=-10,y0r=-10,nx=Math.ceil((w+20)/st)+1,ny=Math.ceil((h+20)/st)+1,hg=new Float32Array(nx*ny);
      for(let b=0;b<ny;b++)for(let a=0;a<nx;a++)hg[b*nx+a]=tex(x0+a*st+X,y0r+b*st+Y,seed);
      const hAt=(x,y)=>{const u=Math.min(nx-1.001,Math.max(0,(x-x0)/st)),v=Math.min(ny-1.001,Math.max(0,(y-y0r)/st)),a=floor(u),b=floor(v),fu=u-a,fv=v-b,q=b*nx+a;
        return (hg[q]*(1-fu)+hg[q+1]*fu)*(1-fv)+(hg[q+nx]*(1-fu)+hg[q+nx+1]*fu)*fv};
      const relief=(x,y,z)=>z-(bt+.6+dep*hAt(x,y));
      let f=S.union(plate,S.both(S.slab(ol,-1,bt+dep+1,0,300),relief));
      const mags=o.mount==='magnet'?[[w*.25,h*.25],[w*.75,h*.75]]:[];
      if(mags.length)f=S.union(f,...mags.map(([x,y])=>S.cylZ(x,y,md/2+2,-1,mh+1)));
      /* a planting pocket: a cup open at the top, its front sloping back to the wall at 45° so it prints */
      if(pk.some(([a,b])=>a===i&&b===j)){const pw=min(w*.55,46),ph=min(h*.42,38),pd=min(22,ph*.8),cx=w/2,y0=h*.25,wl=1.8;
        const outer=(x,y,z)=>max(abs(x-cx)-pw/2,y0-y,y-(y0+ph),z-(bt+min(pd,(y-y0)+2)),-z),inner=(x,y,z)=>max(abs(x-cx)-pw/2+wl,y0+wl-y,y-(y0+ph+5),z-(bt+min(pd,(y-y0)+2)-wl),bt+.6-z);
        const drain=(x,y,z)=>max(Math.hypot(x-cx,z-(bt+3.5))-1.3,y0-1-y,y-(y0+wl+1));
        f=S.cut(S.union(f,outer),inner,drain)}
      if(mags.length){f=S.cut(f,...mags.map(([x,y])=>S.cylZ(x,y,md/2+.15,-1,mh+.2)));magnets+=2}
      const m=S.mesh(f,[-8,-8,w+8,h+8,bt+max(dep+1,pk.length?24:0)],.6);
      parts.push(part(`wall-tile-r${j+1}-c${i+1}.stl`,m,parts.length?'Second file':'Main colour'));
    }
    notes.push(`${cols*rows} tiles, ${cols} across and ${rows} down: the texture runs on from one tile into the next. They push together with dovetails (right and top tabs into left and bottom slots); a drop of glue makes it permanent.`);
    if(pk.length)notes.push('Planting pockets: a little cup open at the top, with a drain hole. Fill with moss or a small air plant.');
    notes.push('Every tile prints flat on its back, without supports.'+(o.mount==='magnet'?' Two magnet pockets in the back of each tile.':''));
    return {parts,notes,magnets,separate:true};
  }

  /* ---------- moult-safe ceiling grid ---------- */
  /* mantises hang upside down to moult, and a slippery lid can make them fall: this lattice gives them a grip */
  function grid(o){
    const w=o.w||180,h=o.h||180,bt=1.8,pitch=o.pattern==='fine'?5:7,bar=1.4,md=o.md||10,mh=o.mh||3,notes=[];let magnets=0;
    const out=rrect(0,0,w,h,4),holes=[];
    if(o.pattern==='hex'){const r=pitch*.62;for(let j=0,y=pitch;y<h-pitch*.5;j++,y+=r*1.5)for(let x=pitch+(j%2?r*.866:0);x<w-pitch*.5;x+=r*1.732)holes.push(ngon(x,y,r-bar*.6,6,PI/6))}
    else for(let y=bar+2;y+pitch-bar<h-2;y+=pitch)for(let x=bar+2;x+pitch-bar<w-2;x+=pitch)holes.push(rect(x,y,x+pitch-bar,y+pitch-bar));
    let plate=subtract(out,U(...holes));plate=U(plate,subtract(out,offset(out,-4)));
    const f=[prism(0,bt,plate)];
    /* grip: tiny bumps along the bars */
    const bumps=[];for(let y=2;y<h-2;y+=pitch)for(let x=2;x<w-2;x+=pitch)bumps.push(circle(x+bar/2-.2,y+bar/2-.2,.75,10));
    f.push(prism(bt,bt+.6,intersect(U(...bumps),offset(plate,-.1))));
    if(o.mount==='magnet'){for(const [x,y] of [[12,12],[w-12,12],[12,h-12],[w-12,h-12]]){f.push(prism(0,mh+1,circle(x,y,md/2+2.5,40)),prism(-1,mh+.2,circle(x,y,md/2+.15,40),'sub'))}magnets=4;
      notes.push('Magnets: 4 in the grid; put 4 more on top of the lid over them, and the grid hangs underneath.')}
    else notes.push('Glue or tape the grid under the lid.');
    notes.push('Prints flat. Mantises hang from the ceiling to moult: this gives a firm grip under a smooth or clear lid. Keep it clean of old skins.');
    return {parts:[part('ceiling-grid.stl',build(f))],notes,magnets};
  }

  /* ---------- photo stage ---------- */
  /* a little stage to photograph a mantis on: a card backdrop curves from the floor up into two slotted uprights,
     with a socket for a twig in front */
  function stage(o){
    const W=o.w||140,D=o.d||90,H=o.h||110,bt=3,card=o.card||.8,g=card+.5,pw=8,notes=[];
    const f=[prism(0,bt,rrect(0,0,W,D,6))];
    /* the uprights at the back corners, each with a slot facing in for the card's edges */
    for(const x of [0,W-pw]){f.push(prism(bt,bt+H,rrect(x,D-26,x+pw,D,1.5)));
      f.push(prism(bt+2,bt+H+1,rect(x===0?pw-3:x-1,D-20,x===0?pw+1:x+3,D-20+g),'sub'))}
    /* a socket for a twig perch, and a shallow groove for the front edge of the card */
    f.push(prism(bt-2,bt+8,circle(W/2,D*.45,7,40)),prism(bt-1.5,bt+8.1,circle(W/2,D*.45,4.2,32),'sub'));
    f.push(prism(bt-.6,bt+.1,rect(pw,8,W-pw,9.2),'sub'));
    notes.push(`Cut a strip of card, ${(W-2*pw+5).toFixed(0)} mm wide and about ${(D+H-10).toFixed(0)} mm long. Slide its edges down the slots in the uprights and lay the end on the floor in the groove: it bends into a seamless backdrop.`);
    notes.push('The socket in front takes a twig (up to 8 mm thick) for the mantis to sit on. Put the stage by a window or under a soft lamp.');
    notes.push('Prints in one piece, flat side down, without supports.');
    return {parts:[part('photo-stage.stl',build(f))],notes,magnets:0};
  }

  root.HabitatAddons={wall,grid,stage,TEXNAMES};
  if(root.HabitatKeep)Object.assign(root.HabitatKeep,{wall,grid,stage});
})(typeof window!=='undefined'?window:globalThis);
