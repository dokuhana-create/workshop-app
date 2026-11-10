/* Habitat extras: feeding, climbing, plants, decor, lettering and the Shifty's mark. Built with lib/geo.js.
   Every builder takes the options from the page and returns {parts:[{file,role,m}], notes, magnets}.
   Everything is laid out in its print orientation, and anything that rises from the bed is kept within 45°
   so nothing needs supports. */
(function(root){
  const G=root.Geo,HP=root.HabitatParts;
  const {varying,rect,rrect,circle,ellipse,ngon,polar,wobble,offset,intersect,subtract,unite,build,stroke,move}=G;
  const TAU=Math.PI*2,RAIL=HP.RAIL,CLIP=HP.CLIP,PEG=HP.PEG,bounds=HP.bounds;
  const rot=(rings,a,cx,cy)=>{cx=cx||0;cy=cy||0;const c=Math.cos(a),s=Math.sin(a);return rings.map(q=>q.map(([x,y])=>{const dx=x-cx,dy=y-cy;return [cx+dx*c-dy*s,cy+dx*s+dy*c]}))};
  const rnd=seed=>{let s=Math.abs(Math.round((seed||1)*7919))%233280||1;return ()=>{s=(s*9301+49297)%233280;return s/233280}};
  const sarea=r=>{let a=0;for(let i=0;i<r.length;i++){const [x0,y0]=r[i],[x1,y1]=r[(i+1)%r.length];a+=x0*y1-x1*y0}return a/2};
  const E_=(cx,cy,rx,ry,a0,a1)=>{const n=Math.max(6,Math.round(Math.abs(a1-a0)/10)),o=[];for(let i=0;i<=n;i++){const a=(a0+(a1-a0)*i/n)*Math.PI/180;o.push([cx+rx*Math.cos(a),cy+ry*Math.sin(a)])}return o};
  const centre=rings=>{const b=bounds(rings);return move(rings,-b.cx,-b.cy)};
  /* tidy an outline: merge points closer than 5 µm and drop specks, which otherwise leave open edges */
  function clean(rings,minA){
    const CL=root.ClipperLib,SC=1000,ps=rings.map(r=>r.map(([x,y])=>({X:Math.round(x*SC),Y:Math.round(y*SC)})));
    return CL.Clipper.CleanPolygons(ps,5).filter(p=>p.length>2).map(p=>p.map(q=>[q.X/SC,q.Y/SC])).filter(r=>Math.abs(sarea(r))>(minA||.05));
  }
  const prism=(z0,z1,rings,op)=>G.prism(z0,z1,clean(rings,.01),op);
  const part=(file,m,role)=>({file,role:role||'Main colour',m});

  /* ---------------- vent and lattice patterns ----------------
     Hole outlines that sit fully inside `region`: s is the hole size, b the bar between holes. */
  function voronoi(pts,box){
    return pts.map((p,i)=>{let poly=[[box[0],box[1]],[box[2],box[1]],[box[2],box[3]],[box[0],box[3]]];
      for(let j=0;j<pts.length&&poly.length>2;j++){if(i===j)continue;const q=pts[j],mx=(p[0]+q[0])/2,my=(p[1]+q[1])/2,nx=q[0]-p[0],ny=q[1]-p[1],np=[];
        for(let k=0;k<poly.length;k++){const a=poly[k],c=poly[(k+1)%poly.length],da=(a[0]-mx)*nx+(a[1]-my)*ny,dc=(c[0]-mx)*nx+(c[1]-my)*ny;
          if(da<=0)np.push(a);if((da<=0)!==(dc<=0)){const t=da/(da-dc);np.push([a[0]+(c[0]-a[0])*t,a[1]+(c[1]-a[1])*t])}}
        poly=np}
      return poly});
  }
  function jitter(x0,y0,x1,y1,sp,r){const o=[];for(let y=y0+sp/2;y<y1;y+=sp)for(let x=x0+sp/2;x<x1;x+=sp)o.push([x+(r()-.5)*sp*.7,y+(r()-.5)*sp*.7]);return o}
  function holes(region,style,s,b,seed){
    const B=bounds(region),out=[],r=rnd(seed);
    const push=q=>{if(q.length>2&&q.every(([x,y])=>G.inside(region,x,y)))out.push(q)};
    const hexLat=(P,fn)=>{const dy=P*Math.sqrt(3)/2;let row=0;for(let y=B.y0;y<=B.y1+P;y+=dy,row++)for(let x=B.x0-(row%2?P/2:0);x<=B.x1+P;x+=P)fn(x,y,row)};
    if(style==='grid'){for(let x=B.x0;x<B.x1;x+=s+b)for(let y=B.y0;y<B.y1;y+=s+b)push([[x,y],[x+s,y],[x+s,y+s],[x,y+s]])}
    else if(style==='diamond'){const h=s*.72,P=2*h+b*1.42;let row=0;for(let y=B.y0;y<=B.y1+P;y+=P/2,row++)for(let x=B.x0+(row%2?P/2:0);x<=B.x1+P;x+=P)push([[x,y-h],[x+h,y],[x,y+h],[x-h,y]])}
    else if(style==='hex')hexLat(s+b,(x,y)=>push(ngon(x,y,s/Math.sqrt(3),6,Math.PI/6)[0]));
    else if(style==='round')hexLat(s+b,(x,y)=>push(circle(x,y,s/2,16)[0]));
    else if(style==='slots'){let row=0;for(let y=B.y0;y<B.y1;y+=3*s+b,row++)for(let x=B.x0+(row%2?(s+b)/2:0);x<B.x1;x+=s+b)push([[x,y],[x+s,y],[x+s,y+3*s],[x,y+3*s]])}
    else if(style==='radial'){
      const cx=B.cx,cy=B.cy,R=Math.hypot(B.x1-B.x0,B.y1-B.y0)/2;
      for(let rr=Math.max(b*1.5,s*.8);rr+s<=R;rr+=s+b){const n=Math.max(3,Math.floor(TAU*(rr+s/2)/(3*s+b))),gap=b/(rr+s/2);
        for(let k=0;k<n;k++){const a0=k*TAU/n+gap/2+(rr%2)*.3,a1=(k+1)*TAU/n-gap/2+(rr%2)*.3,q=[];
          for(let i=0;i<=6;i++){const a=a0+(a1-a0)*i/6;q.push([cx+rr*Math.cos(a),cy+rr*Math.sin(a)])}
          for(let i=6;i>=0;i--){const a=a0+(a1-a0)*i/6;q.push([cx+(rr+s)*Math.cos(a),cy+(rr+s)*Math.sin(a)])}push(q)}}
    }
    else if(style==='flower')hexLat(3.2*s+2*b,(x,y)=>{for(let k=0;k<6;k++){const a=k*Math.PI/3;push(rot(ellipse(x+Math.cos(a)*s*1.05,y+Math.sin(a)*s*1.05,s*.75,s*.36,14),a,x+Math.cos(a)*s*1.05,y+Math.sin(a)*s*1.05)[0])}});
    else if(style==='leaf')hexLat(1.6*s+b,(x,y,row)=>{const a=row%2?.6:-.6;push(rot(ellipse(x,y,s*.8,s*.34,16),a,x,y)[0])});
    else if(style==='voronoi'){const pts=jitter(B.x0,B.y0,B.x1,B.y1,s*1.8,r);for(const c of voronoi(pts,[B.x0,B.y0,B.x1,B.y1]))for(const q of offset([c],-b/2))push(q)}
    else if(style==='stripes'){for(let y=B.y0;y<B.y1;y+=s+b)for(let x=B.x0;x<B.x1;x+=22)push([[x,y],[x+20,y],[x+20,y+s],[x,y+s]])}
    return out;
  }
  const PATTERNS=[['grid','Square grid'],['hex','Honeycomb'],['round','Round holes'],['diamond','Diamonds'],['slots','Slots'],['radial','Radial rings'],['flower','Flowers'],['leaf','Leaves'],['voronoi','Organic cells'],['stripes','Stripes']];

  /* ---------------- stencil font ----------------
     Single-stroke capitals on a 6-unit cap height, drawn as lines and arcs and thickened to any width. */
  const FONT={
    A:[[[0,0],[2,6],[4,0]],[[.9,2.2],[3.1,2.2]]],
    B:[[[0,3],[0,6],[2.3,6],...E_(2.3,4.5,1.5,1.5,90,-90),[0,3],[0,0],[2.5,0],...E_(2.5,1.5,1.6,1.5,-90,90),[2.3,3]]],
    C:[E_(2.3,3,2.3,3,45,315)],
    D:[[[0,0],[0,6],[1.6,6],...E_(1.6,3,2.4,3,90,-90),[0,0]]],
    E:[[[4,6],[0,6],[0,0],[4,0]],[[0,3],[3,3]]],
    F:[[[4,6],[0,6],[0,0]],[[0,3],[3,3]]],
    G:[[...E_(2.2,3,2.2,3,45,360),[2.4,3]]],
    H:[[[0,0],[0,6]],[[4,0],[4,6]],[[0,3],[4,3]]],
    I:[[[0,0],[0,6]]],
    J:[[[3,6],[3,1.5],...E_(1.5,1.5,1.5,1.5,0,-180)]],
    K:[[[0,0],[0,6]],[[3.8,6],[0,2]],[[1.3,3.3],[4,0]]],
    L:[[[0,6],[0,0],[3.5,0]]],
    M:[[[0,0],[0,6],[2.4,2],[4.8,6],[4.8,0]]],
    N:[[[0,0],[0,6],[4,0],[4,6]]],
    O:[E_(2.4,3,2.4,3,0,360)],
    P:[[[0,0],[0,6],[2.4,6],...E_(2.4,4.5,1.6,1.5,90,-90),[0,3]]],
    Q:[E_(2.4,3,2.4,3,0,360),[[2.9,1.3],[4.8,-.4]]],
    R:[[[0,0],[0,6],[2.4,6],...E_(2.4,4.5,1.6,1.5,90,-90),[0,3]],[[2.2,3],[4,0]]],
    S:[[...E_(2,4.5,1.9,1.5,25,270),...E_(2,1.5,2.1,1.5,90,-155)]],
    T:[[[0,6],[4,6]],[[2,6],[2,0]]],
    U:[[[0,6],[0,2],...E_(2,2,2,2,180,360),[4,6]]],
    V:[[[0,6],[2,0],[4,6]]],
    W:[[[0,6],[1.3,0],[2.5,4.5],[3.7,0],[5,6]]],
    X:[[[0,0],[4,6]],[[0,6],[4,0]]],
    Y:[[[0,6],[2,3],[4,6]],[[2,3],[2,0]]],
    Z:[[[0,6],[4,6],[0,0],[4,0]]],
    '0':[E_(2,3,2,3,0,360)],
    '1':[[[.6,4.8],[2,6],[2,0]]],
    '2':[[...E_(2,4.2,2,1.8,160,-35),[0,0],[4,0]]],
    '3':[E_(2,4.6,1.8,1.4,150,-90),E_(2,1.6,2,1.6,90,-150)],
    '4':[[[3,0],[3,6],[0,1.8],[4.2,1.8]]],
    '5':[[[3.8,6],[.5,6],[.3,3.3]],E_(2,2,2,2,140,-150)],
    '6':[E_(2,2,2,2,0,360),E_(3.8,2.2,3.8,3.8,180,100)],
    '7':[[[0,6],[4,6],[1.5,0]]],
    '8':[E_(2,4.5,1.6,1.5,0,360),E_(2,1.6,2,1.6,0,360)],
    '9':[E_(2,4,2,2,0,360),E_(.2,3.8,3.8,3.8,0,-80)],
    "'":[[[0,6],[0,4.6]]],'’':[[[0,6],[0,4.6]]],'-':[[[0,3],[2.5,3]]],'.':[[[0,0],[0,.01]]],',':[[[.4,.3],[0,-.9]]],
    '/':[[[0,0],[3,6]]],':':[[[0,1],[0,1.01]],[[0,4],[0,4.01]]],'!':[[[0,6],[0,2]],[[0,0],[0,.01]]],'+':[[[0,3],[3,3]],[[1.5,1.5],[1.5,4.5]]],
    '&':[[[4,0],...E_(1.6,4.6,1.3,1.4,-40,250),[0,1.2],...E_(1.6,1.4,1.6,1.4,180,330),[4,3]]],
    '#':[[[1,0],[1.6,6]],[[2.6,0],[3.2,6]],[[0,2],[4,2]],[[0,4],[4,4]]]
  };
  const ACC={'Ä':['A',[1.2,2.8]],'Ö':['O',[1.5,3.3]],'Ü':['U',[1.2,2.8]],'É':['E'],'È':['E'],'Ê':['E'],'À':['A'],'Â':['A'],'Ç':['C'],'Ô':['O'],'Î':['I'],'Û':['U'],'ß':['S']};
  function textLines(str,h){
    const s=h/6,lines=[];let x=0;
    for(const raw of String(str||'').toUpperCase()){
      let ch=raw,dots=null;if(ACC[ch]){dots=ACC[ch][1]||null;ch=ACC[ch][0]}
      if(ch===' '){x+=2.6*s;continue}
      const gl=FONT[ch];if(!gl)continue;
      let x0=1e9,x1=-1e9;for(const l of gl)for(const [px] of l){x0=Math.min(x0,px);x1=Math.max(x1,px)}
      for(const l of gl)lines.push(l.map(([px,py])=>[x+(px-x0)*s,py*s]));
      if(dots)for(const d of dots)lines.push([[x+(d-x0)*s,7.2*s],[x+(d-x0)*s,7.21*s]]);
      x+=(x1-x0)*s+1.7*s;
    }
    return {lines,width:Math.max(0,x-1.7*s)};
  }
  /* one or more lines of text as outlines, centred on 0,0 */
  function text2D(lines,h,w){
    const rows=lines.filter(t=>t&&String(t).trim()).map(t=>textLines(t,h));
    if(!rows.length)return {rings:[],w:0,h:0};
    const gap=h*.6,H=rows.length*h+(rows.length-1)*gap;let all=[];
    rows.forEach((r,i)=>{const y0=H/2-h-i*(h+gap);all=all.concat(r.lines.map(l=>l.map(([x,y])=>[x-r.width/2,y+y0])))});
    return {rings:stroke(all,w),w:Math.max(...rows.map(r=>r.width))+w,h:H+w};
  }
  /* cut-through lettering: wherever a letter would leave a loose island (the middle of an O or A), cut a
     small bridge so the island stays joined to the plate */
  function stencil(plate,letters,bw){
    let L=letters;
    for(let it=0;it<5;it++){
      const res=subtract(plate,L);if(!res.length)return L;
      const big=res.reduce((a,r)=>Math.abs(sarea(r))>Math.abs(sarea(a))?r:a,res[0]),sg=Math.sign(sarea(big));
      const isl=res.filter(r=>r!==big&&Math.sign(sarea(r))===sg);
      if(!isl.length)return L;
      for(const r of isl){const b=bounds([r]),cx=b.cx,e=bw*1.5+3;L=subtract(L,rect(cx-bw/2,b.y0-e,cx+bw/2,b.y1+e))}
    }
    return L;
  }

  /* ---------------- the Shifty's mark ----------------
     A mantis head seen from the front: triangular face, big eyes at the corners under heavy lids, pupils
     glancing sideways, one antenna with a little hook, and a smirk. */
  function logoMark(W){
    const tri=[[[-11,5],[11,5],[0,-13]]],head=offset(offset(tri,-3.2),3.2);
    const eL=ellipse(-10.5,6,6.2,7.4,56),eR=ellipse(10.5,6,6.2,7.4,56);
    const face=unite(unite(head,eL),eR);
    const lidL=[[[-19,8.6],[-3.5,6.9],[-3.5,16],[-19,16]]],lidR=[[[3.5,6.9],[19,8.6],[19,16],[3.5,16]]];
    const visL=subtract(offset(eL,-1.4),lidL),visR=subtract(offset(eR,-1.4),lidR),vis=unite(visL,visR);
    const pupils=unite(circle(-7,5.4,2.5,32),circle(13.9,5.4,2.5,32));
    const ant=stroke([HP.bez([-2.2,2.5],[-5,16],[-10,20],[-15,26]),[...HP.bez([2.2,2.5],[5,17],[9,21],[11,27]),[13.5,26.4],[14.2,24.6]]],1.8);
    const smirk=stroke([HP.bez([-2.6,-6.9],[-.6,-7.7],[2,-7.3],[3.9,-4.7])],1.15);
    let mark=unite(face,ant);
    mark=unite(subtract(subtract(mark,vis),smirk),pupils);
    const b=bounds(mark),k=W/(b.x1-b.x0);
    const sc=r=>move(r,-b.cx,-b.cy).map(q=>q.map(([x,y])=>[x*k,y*k]));
    return {mark:sc(mark),eyes:sc(subtract(vis,pupils)),h:(b.y1-b.y0)*k,w:W};
  }
  function svgPath(rings,s,ox,oy){return rings.map(r=>'M'+r.map(([x,y])=>`${(x*s+ox).toFixed(2)},${(-y*s+oy).toFixed(2)}`).join('L')+'Z').join('')}
  /* the full logo as SVG: a round badge with the mark and the name, or the mark and name side by side */
  function logoSVG(o){
    o=o||{};const ink=o.ink||'#2f4a2a',paper=o.paper||'#f4efe3',accent=o.accent||ink;
    if(o.layout==='wide'){
      const m=logoMark(60),t=text2D([o.name||"SHIFTY'S"],22,4.2),tw=t.w,W=60+18+tw+20,H=Math.max(m.h,30)+20;
      const ox=10+30,oy=H/2,tx=10+60+18+tw/2;
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W.toFixed(1)} ${H.toFixed(1)}" width="${(W*4).toFixed(0)}" height="${(H*4).toFixed(0)}">${o.bg===false?'':`<rect width="100%" height="100%" fill="${paper}"/>`}<path fill-rule="evenodd" fill="${ink}" d="${svgPath(m.mark,1,ox,oy)}"/><path fill-rule="evenodd" fill="${accent}" d="${svgPath(t.rings,1,tx,oy)}"/></svg>`;
    }
    const R=50,m=logoMark(54),t=text2D([o.name||"SHIFTY'S"],10,2.3),badge=circle(0,0,R,180),ring=subtract(offset(badge,-2.2),offset(badge,-4.4));
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-52 -52 104 104" width="416" height="416"><path fill="${paper}" d="${svgPath(badge,1,0,0)}"/><path fill-rule="evenodd" fill="${accent}" d="${svgPath(ring,1,0,0)}"/><path fill-rule="evenodd" fill="${ink}" d="${svgPath(m.mark,1,0,-9)}"/><path fill-rule="evenodd" fill="${accent}" d="${svgPath(t.rings,1,0,29)}"/></svg>`;
  }

  /* ---------------- mounting a flat piece printed on its back ----------------
     foot: the outline on the wall (x across, y up). Gives the back plate, a clip tongue or magnet pockets. */
  function backMount(o,foot,opts){
    opts=opts||{};const f=[],notes=[];let bt,dy=0,magnets=0;const b0=bounds(foot);
    if(o.mount==='clip'){bt=RAIL.tongue;dy=CLIP.clearZ-b0.y0}
    else if(o.mount==='magnet')bt=Math.max(opts.min||2,o.mh+.2+1.4);
    else bt=opts.min||2;
    const ft=move(foot,0,dy),b=bounds(ft);let plate=opts.plate?move(opts.plate,0,dy):ft;
    if(o.mount==='clip'){const wc=Math.min(40,Math.max(16,(b.x1-b.x0)*.6));plate=unite(plate,rrect(b.cx-wc/2,0,b.cx+wc/2,CLIP.clearZ+4,1));f.push(prism(bt,bt+.35,rect(b.cx-wc/2+2,1,b.cx+wc/2-2,2)))}
    f.push(prism(0,bt,plate));
    if(o.mount==='magnet'){
      const R=o.md/2+.2,pd=o.mh+.2,w=b.x1-b.x0,safe=offset(ft,-R-1.2),xs=opts.xs||(w>=4*R+16?[b.cx-w/4,b.cx+w/4]:[b.cx]),my=opts.my!=null?opts.my+dy:b.cy;
      const ok=xs.filter(x=>safe.length&&G.inside(safe,x,my));
      if(ok.length){plate=unite(plate,ok.flatMap(x=>circle(x,my,R+2.4,40)));f[f.length-1]=prism(0,bt,plate)}
      for(const x of ok){f.push(prism(-1,pd,circle(x,my,R),'sub'));magnets++}
      if(!magnets)notes.push('This piece is too small for a magnet pocket. Use glue, or make it bigger.');
    }
    return {f,bt,dy,magnets,notes,plate};
  }
  /* an upright fin from an outline in the (x, z) plane, th thick. Each step may only reach 45° past the one
     below, so a leaf or a fork never prints into thin air. */
  function upright(sil,th,cx,cy,z0,dz){
    dz=dz||.3;const b=bounds(sil),steps=[];let prev=null;
    for(let z=b.y0;z<b.y1-1e-6;z+=dz){
      let iv=G.slice(sil,z+dz/2);
      if(prev)iv=iv.map(([a,c])=>{const near=prev.filter(([p,q])=>q>=a-dz&&p<=c+dz);if(!near.length)return null;return [Math.max(a,Math.min(...near.map(n=>n[0]))-dz),Math.min(c,Math.max(...near.map(n=>n[1]))+dz)]}).filter(v=>v&&v[1]-v[0]>.2);
      steps.push(iv);prev=iv;
    }
    const top=z0+steps.length*dz;
    return varying(z0,top,z=>{const i=Math.min(steps.length-1,Math.max(0,Math.floor((z-z0)/dz)));return steps[i].map(([a,c])=>[[cx+a,cy-th/2],[cx+c,cy-th/2],[cx+c,cy+th/2],[cx+a,cy+th/2]])},dz);
  }
  /* round profile r(t) for t in 0..1 up the height, clamped so it never widens faster than 45° */
  function lathe(z0,h,prof,shapeAt,rStart,dz){
    dz=dz||.3;const n=Math.max(1,Math.ceil(h/dz)),rs=[];let prev=rStart;
    for(let i=0;i<n;i++){const r=Math.max(.5,Math.min(prof((i+.5)/n),prev+dz));rs.push(r);prev=r}
    return varying(z0,z0+n*dz,z=>shapeAt(rs[Math.min(n-1,Math.max(0,Math.floor((z-z0)/dz)))]),dz);
  }

  /* ---------------- feeder cup ---------------- */
  function cupShape(shape,L,W,seed){
    if(shape==='flower')return HP.fit(polar(0,0,a=>L/2*(1+.08*Math.cos(6*a)),120).map(q=>q.map(([x,y])=>[x,y*W/L])));
    if(shape==='scallop')return HP.fit(polar(0,0,a=>L/2*(1+.045*Math.cos(12*a)),160).map(q=>q.map(([x,y])=>[x,y*W/L])));
    return HP.body2D(shape,L,W,seed);
  }
  function feeder(o){
    const W=o.shape==='round'?o.L:o.W,out=cupShape(o.shape,o.L,W,o.seed),b=bounds(out),f=[],notes=[],H=o.H,lip=Math.max(0,Math.min(o.lip,o.L/4));
    const fl=o.mount==='peg'?PEG.depth+1.5:2;
    f.push(prism(0,H,out));
    f.push(varying(fl,H+.01,z=>offset(out,-o.wall-Math.max(0,Math.min(lip,z-(H-lip-.3)))),.3,'sub'));
    if(o.mount==='peg')f.push(prism(-1,PEG.depth,circle(b.cx,b.cy,PEG.sock),'sub'));
    const magnets=HP.mountWall(f,o,b,H*.7,out);
    notes.push('The inward lip at the top stops feeders climbing out. For the smoothest inner wall, print the inside at a fine layer height or brush on a thin coat of food-safe epoxy.');
    return {parts:[part('feeder-cup.stl',build(f))],notes,magnets};
  }

  /* ---------------- fruit fly culture cup lid ----------------
     Printed top face down. The skirt snaps over the cup rim; the window takes coffee filter or fabric, held
     under a decorative lattice, or is a printed vent grid for larger feeders. */
  function flyLid(o){
    const D=o.dia,wall=1.6,Ri=D/2+.25,Ro=Ri+wall,tp=2,sk=o.skirt,f=[],notes=[];
    f.push(prism(0,tp,circle(0,0,Ro,180)),prism(tp,tp+sk,subtract(circle(0,0,Ro,180),circle(0,0,Ri,180))));
    f.push(varying(tp+sk-1.6,tp+sk,z=>{const d=Math.min(.6,Math.max(.05,z-(tp+sk-1.6)));return subtract(circle(0,0,Ri+.01,180),circle(0,0,Ri-d,180))},.2));
    const Rw=Math.max(8,Math.min(D/2-4,D/2*o.cover/100)),cork=o.cork==='yes',rc=o.corkD/2;
    let area=circle(0,0,Rw,120);if(cork)area=subtract(area,circle(0,0,rc+2.4,48));
    const fab=o.mode==='fabric',hs=holes(area,o.pattern,fab?o.hs:Math.max(1,o.hs),fab?Math.max(1.2,o.hb):Math.max(.8,o.hb),o.seed);
    if(hs.length)f.push(prism(-1,tp+1,hs,'sub'));
    if(fab)f.push(prism(tp-.8,tp+1,cork?subtract(circle(0,0,Rw+3,120),circle(0,0,rc+2.4,48)):circle(0,0,Rw+3,120),'sub'));
    if(cork){f.push(prism(tp,tp+6,subtract(circle(0,0,rc+2.4,48),circle(0,0,rc,48))),prism(-1,tp+7,circle(0,0,rc,48),'sub'))}
    if(fab)notes.push(`Glue a circle of coffee filter or fine fabric, ${(2*Rw+5).toFixed(0)} mm across, into the recess on the inside. Fruit flies get through any printed hole, so the fabric is what keeps them in.`);
    else notes.push('Printed vent holes keep crickets, roaches and larger flies in, but not fruit flies. Use the fabric window for fruit flies.');
    if(cork)notes.push(`The port takes a foam plug or cork ${o.corkD} mm across.`);
    notes.push('Measure the outside of your cup rim and set it as the cup rim diameter.');
    return {parts:[part('fly-cup-lid.stl',build(f))],notes,magnets:0};
  }

  /* ---------------- moulting ladder: printed flat ---------------- */
  function petal(len,wid,style,r0){
    r0=r0==null?len*.12:r0;const n=40,L=[],R=[];
    for(let i=0;i<=n;i++){const t=i/n;let hw;
      if(style==='pointed')hw=Math.pow(Math.sin(Math.PI*Math.pow(t,.75)),1.1);
      else if(style==='lance')hw=Math.pow(Math.sin(Math.PI*t),1.4)*.7;
      else if(style==='spatula')hw=Math.pow(t,.55)*Math.sqrt(Math.max(0,1-Math.pow(t,4)));
      else if(style==='ruffled')hw=Math.sqrt(Math.max(0,1-(2*t-1)**2))*(1+.12*Math.sin(t*Math.PI*9));
      else hw=Math.sqrt(Math.max(0,1-(2*t-1)**2));
      hw*=wid/2;const x=r0+t*(len-r0);L.push([x,hw]);if(hw>1e-3)R.push([x,-hw])}
    let ring=clean([[...L,...R.reverse()]]);
    if(style==='notched')ring=subtract(ring,[[[len*.86,0],[len*1.06,wid*.32],[len*1.06,-wid*.32]]]);
    return ring;
  }
  const leafAt=(x,y,len,wid,a)=>move(rot(petal(len,wid,'pointed',0),a),x,y);
  function ladder(o){
    const L=o.len,W=o.wid,r=rnd(o.seed),lw=2.4,f=[],notes=[];let lines=[],extra=[],ridges=[];
    const box=rect(-W/2-1.2,0,W/2+1.2,L);
    switch(o.style){
      case 'net':lines.push([[-W/2,0],[-W/2,L]],[[W/2,0],[W/2,L]]);for(let y=-W;y<L+W;y+=W*.55)lines.push([[-W/2,y],[W/2,y+W]],[[W/2,y],[-W/2,y+W]]);break;
      case 'chain':for(let y=W/2;y<=L-W/2+.1;y+=W*.72)lines.push(E_(0,y,W/2-lw/2,W/2-lw/2,0,360));lines.push([[0,0],[0,L]]);break;
      case 'vine':{const st=[];for(let y=0;y<=L;y+=2)st.push([Math.sin(y/14)*W*.22,y]);lines.push(st);
        for(let y=8,k=0;y<L-8;y+=10,k++){const x=Math.sin(y/14)*W*.22,s=k%2?1:-1;extra.push(...leafAt(x,y,W*.55,W*.3,s>0?.55:Math.PI-.55));if(k%3===1)lines.push(HP.curl([x,y],s>0?1.2:Math.PI-1.2,W*.18,s>0?1:-1))}break}
      case 'bark':{const wl=wobble(o.seed,.12,6),wr=wobble(o.seed+3,.12,6),Lp=[],Rp=[];for(let y=0;y<=L;y+=2){Lp.push([-W/2*(1+wl(y/L*TAU)),y]);Rp.push([W/2*(1+wr(y/L*TAU)),y])}
        extra.push([...Lp,...Rp.reverse()]);for(let y=4;y<L-2;y+=3.5+r()*2){const a=-W/2*.8+r()*W*.2,c=W/2*.8-r()*W*.2;ridges.push([[a,y],[c,y+(r()-.5)*2]])}break}
      case 'zigzag':{const z=[];let s=1;for(let y=0;y<=L;y+=W*.7){z.push([s*W/2,y]);s=-s}lines.push(z,[[0,0],[0,L]]);break}
      case 'bamboo':lines.push([[0,0],[0,L]]);for(let y=12;y<L-4;y+=16+r()*6){ridges.push([[-W*.28,y],[W*.28,y]]);if(r()<.5)extra.push(...leafAt(0,y,W*.5,W*.18,r()<.5?.7:Math.PI-.7))}extra.push(...rect(-W*.22,0,W*.22,L));break;
      default:lines.push([[-W/2,0],[-W/2,L]],[[W/2,0],[W/2,L]]);for(let y=8;y<L;y+=12)lines.push([[-W/2,y],[W/2,y]]);
    }
    let shape=intersect(unite(stroke(lines,lw),extra),box);
    if(o.style==='chain'||o.style==='vine'||o.style==='bamboo')shape=unite(shape,intersect(unite(stroke(lines,lw),extra),rect(-W,0,W,L)));
    /* top or bottom fixing */
    let t=o.mount==='clip'?RAIL.tongue:o.mount==='magnet'?Math.max(2.4,o.mh+1.6):2.4,magnets=0;
    if(o.mount==='tie'){shape=subtract(unite(shape,rrect(-W/2,L-2,W/2,L+10,3)),unite(circle(-W/4,L+4.5,1.3,20),circle(W/4,L+4.5,1.3,20)))}
    else if(o.mount==='hook'){const rd=o.dia/2+1.6;shape=unite(shape,stroke([[[0,L-2],[0,L+6],...E_(-rd,L+6,rd,rd,0,180),[-2*rd,L+2]]],3))}
    else if(o.mount==='clip'){shape=unite(shape,rrect(-W/2,0,W/2,CLIP.clearZ+4,1));f.push(prism(t,t+.35,rect(-W/2+2,1,W/2-2,2)))}
    else if(o.mount==='magnet'){shape=unite(shape,rrect(-W/2,L-o.md-6,W/2,L,2));const R=o.md/2+.2;if(W>=2*R+3){f.push(prism(-1,o.mh+.2,circle(0,L-R-3,R),'sub'));magnets=1}else notes.push('Make the ladder wider so a magnet fits.')}
    f.push(prism(0,t,shape));
    if(ridges.length)f.push(prism(t,t+.6,intersect(stroke(ridges,1),offset(shape,-.6))));
    if(o.mount==='tie')notes.push('Thread fishing line or a twist tie through the two holes and around the lid mesh. The ladder then hangs just below the lid, where mantises like to moult.');
    if(o.mount==='hook')notes.push(`The hook hangs over a branch or twig bridge up to ${o.dia} mm thick.`);
    return {parts:[part('moulting-ladder.stl',build(f))],notes,magnets};
  }

  /* ---------------- twig bridge: printed flat, with square pins for the twig holders ---------------- */
  function bridge(o){
    const span=o.span,h=o.rise,ps=Math.max(3,(o.dia+.6)/Math.SQRT2-.3),w=Math.max(ps,o.w),t=ps,r=rnd(o.seed),f=[],notes=[];
    const N=80,tri=u=>Math.abs(((u+1)%2)-1),path=[];
    for(let i=0;i<=N;i++){const s=i/N;let y;
      switch(o.style){case 'arc':y=h*.45*Math.sin(Math.PI*s);break;case 'straight':y=0;break;case 'zigzag':y=h*.6*tri(4*s);break;
        case 'wave':y=h*.5*Math.sin(TAU*s)+h*.5*Math.sin(Math.PI*s);break;case 'vine':y=h*.75*Math.sin(Math.PI*s)+h*.07*Math.sin(8*Math.PI*s);break;
        case 'gothic':y=h*(1-Math.abs(2*s-1))**.6;break;default:y=h*Math.sin(Math.PI*s)}
      path.push([s*span,y])}
    let shape=stroke([path],w);
    if(o.style==='vine')for(let i=8;i<N-6;i+=9){const [x,y]=path[i],s=(i/9)%2?1:-1;shape=unite(shape,leafAt(x,y,w*2.2,w*1.1,s>0?1.1:-1.1+Math.PI))}
    if(o.style==='branch'||o.style==='twisted'){for(const i of [22,40,58]){const [x,y]=path[i],a=(i===40?1.9:i<40?2.4:.7)+(r()-.5)*.4,len=w*3+r()*w*2;shape=unite(shape,stroke([[[x,y],[x+Math.cos(a)*len,y+Math.sin(a)*len]]],w*.6))}}
    for(const x of [0,span])shape=unite(shape,rect(x-ps/2,-o.pinL,x+ps/2,1));
    f.push(prism(0,t,shape));
    if(o.texture==='bark'){const ls=[];for(const d of [-w/4,w/4]){const q=[];for(let i=1;i<path.length;i++){const [x0,y0]=path[i-1],[x1,y1]=path[i],l=Math.hypot(x1-x0,y1-y0)||1;q.push([x1-(y1-y0)/l*d,y1+(x1-x0)/l*d])}ls.push(q)}f.push(prism(t,t+.5,intersect(stroke(ls,.7),offset(shape,-.5))))}
    notes.push(`Stand two twig holders ${span} mm apart. The square pins (${ps.toFixed(1)} mm) push into twig holders made for ${o.dia} mm twigs.`);
    return {parts:[part('twig-bridge.stl',build(f))],notes,magnets:0};
  }

  /* ---------------- backdrop textures: stacked 0.5 mm layers, each inside the one below ---------------- */
  function texture(kind,w,h,depth,seed){
    const r=rnd(seed),box=rect(0,0,w,h),n=Math.max(1,Math.round(depth/.5));
    const shrink=(base,st,k)=>{const o=[];for(let i=0;i<(k||n);i++){const q=i?offset(base,-i*st):base;if(!q.length)break;o.push(intersect(q,box))}return o};
    switch(kind){
      case 'stone':{const cells=voronoi(jitter(-6,-6,w+6,h+6,12,r),[-6,-6,w+6,h+6]);return shrink(unite(cells.flatMap(c=>offset([c],-.7))),.45)}
      case 'bark':{const ls=[];for(let x=0;x<w+4;x+=4+r()*5){const ph=r()*TAU,q=[];for(let y=-2;y<=h+2;y+=2)q.push([x+Math.sin(y/9+ph)*1.6+Math.sin(y/3.1+ph)*.5,y]);ls.push({q,wd:2.4+r()*3})}
        return shrink(unite(...ls.map(l=>stroke([l.q],l.wd)).reduce((a,b)=>[unite(a[0]||[],b)],[[]])),.4)}
      case 'pebbles':{const cs=[];for(let k=0;k<w*h/12;k++){const rr=2.5+r()*5,x=r()*w,y=r()*h;if(cs.every(c=>Math.hypot(c[0]-x,c[1]-y)>c[2]+rr+.8))cs.push([x,y,rr])}return shrink(unite(cs.flatMap(([x,y,rr])=>rot(ellipse(x,y,rr,rr*(.7+r()*.3),28),r()*TAU,x,y))),.4)}
      case 'moss':{const cs=[];for(let k=0;k<w*h/5;k++){const rr=.9+r()*1.6;cs.push(...circle(r()*w,r()*h,rr,12))}return shrink(unite(cs),.45,Math.min(n,4))}
      case 'planks':{const pl=[];for(let y=0;y<h;y+=0){const ph=12+r()*6;let x=-r()*30;while(x<w){const len=30+r()*40;pl.push(...rect(x+.5,y+.5,x+len-.5,Math.min(h,y+ph)-.5));x+=len}y+=ph}
        const base=unite(pl),grain=[];for(let y=2;y<h;y+=2.5+r()*2){const q=[],ph2=r()*TAU;for(let x=0;x<=w;x+=3)q.push([x,y+Math.sin(x/11+ph2)*.9]);grain.push(q)}
        return [intersect(base,box),intersect(intersect(stroke(grain,.7),offset(base,-.8)),box)]}
      case 'hex':{const cs=[],P=11;let row=0;for(let y=0;y<h+P;y+=P*Math.sqrt(3)/2,row++)for(let x=row%2?P/2:0;x<w+P;x+=P)cs.push(...ngon(x,y,P/Math.sqrt(3)-.6,6,Math.PI/6));return shrink(unite(cs),.45)}
      case 'brick':{const cs=[];let row=0;for(let y=0;y<h;y+=9,row++)for(let x=row%2?-11:0;x<w;x+=22)cs.push(...rect(x+.6,y+.6,x+21.4,y+8.4));return shrink(unite(cs),.45)}
      case 'waves':{const ls=[];for(let y=0;y<h+6;y+=6.5){const q=[],ph=r()*1;for(let x=-2;x<=w+2;x+=1.5)q.push([x,y+Math.sin(x/8+y/10+ph)*2]);ls.push(q)}return shrink(stroke(ls,3.6),.5)}
      case 'scales':{const ls=[];let row=0;for(let y=h+6;y>-6;y-=5,row++)for(let x=row%2?3.5:0;x<w+7;x+=7)ls.push(E_(x,y,3.5,4.5,200,340));return shrink(stroke(ls,1.3),.4,Math.min(n,2))}
      case 'leaves':{const lv=[];for(let k=0;k<w*h/45;k++){const x=r()*w,y=r()*h,len=9+r()*9;lv.push({ring:leafAt(x,y,len,len*.45,r()*TAU),lev:Math.floor(r()*n)})}
        const layers=[];for(let i=0;i<n;i++){const q=unite(lv.filter(l=>l.lev>=i).flatMap(l=>l.ring));if(!q.length)break;layers.push(intersect(i?intersect(q,offset(layers[i-1],.45)):q,box))}return layers}
      case 'roots':{const segs=[];const grow=(x,y,a,wd,d)=>{if(wd<.9||y>h+4||d>14)return;const len=6+r()*8,x2=x+Math.cos(a)*len,y2=y+Math.sin(a)*len;segs.push({q:[[x,y],[x2,y2]],wd});grow(x2,y2,a+(r()-.5)*.6,wd*.88,d+1);if(r()<.35)grow(x2,y2,a+(r()<.5?-.7:.7),wd*.65,d+1)};
        for(let x=4;x<w;x+=10+r()*10)grow(x,-2,Math.PI/2+(r()-.5)*.5,3.2+r()*1.6,0);
        const layers=[];for(let i=0;i<n;i++){const q=segs.filter(s=>s.wd-i*.6>.6);if(!q.length)break;layers.push(intersect(unite(q.flatMap(s=>stroke([s.q],s.wd-i*.6))),box))}return layers}
      case 'bamboo':{const st=[],nodes=[];for(let x=3+r()*4;x<w;x+=10+r()*4){const sw=6+r()*3;st.push(...rect(x,0,x+sw,h));for(let y=8+r()*10;y<h-2;y+=18+r()*10)nodes.push(...rrect(x-.8,y,x+sw+.8,y+1.6,.6))}
        const base=unite(st);return [intersect(unite(base,nodes),box),...shrink(base,.5,Math.min(n,3)).slice(1),intersect(nodes,box)].filter(q=>q.length)}
      default:return [box];
    }
  }
  const TEXTURES=[['stone','Stone wall'],['bark','Tree bark'],['pebbles','Pebbles'],['moss','Moss'],['planks','Wooden planks'],['hex','Honeycomb'],['brick','Brick'],['waves','Waves'],['scales','Scales'],['leaves','Leaf litter'],['roots','Roots'],['bamboo','Bamboo']];
  function tile(o,enc){
    const notes=[],panel=o.mount==='panel';let w=o.w,h=o.h,f,bt,dy=0,magnets=0;
    if(panel){const ts=enc.tileSize&&enc.tileSize();if(!ts){notes.push('Turn on swappable tile panels for a rectangular enclosure first. Using the size you entered.')}else{w=ts[0];h=ts[1]}}
    const outline=o.corners==='rounded'&&!panel?rrect(0,0,w,h,4):rect(0,0,w,h);
    if(panel){f=[prism(0,3,outline)];bt=3}
    else{const m=backMount(o,outline,{min:2});f=m.f;bt=m.bt;dy=m.dy;magnets=m.magnets;notes.push(...m.notes)}
    const layers=texture(o.texture,w,h,o.depth,o.seed);
    layers.forEach((L,i)=>{const q=intersect(move(L,0,dy),move(offset(outline,-.6),0,dy));if(q.length)f.push(prism(bt+i*.5,bt+(i+1)*.5,q))});
    if(panel)notes.push('Fits the openings of your swappable tile panels, with the texture facing into the enclosure.');
    return {parts:[part(`backdrop-${o.texture}.stl`,build(f))],notes,magnets};
  }

  /* ---------------- flower perch ----------------
     Petals are drawn in tiers from back to front. Printed face up, each layer holds the tiers in front of it,
     so every layer sits on the one below. */
  function flowerTiers(kind,R,n,seed){
    const r=rnd(seed),j=()=>1+(r()-.5)*.1;
    const ring=(cnt,len,wid,style,rot0,dy)=>{const o=[];for(let i=0;i<cnt;i++)o.push({len:len*j(),wid,style,a:rot0+i*TAU/cnt,dy:dy||0});return o};
    const P=Math.PI;
    switch(kind){
      case 'orchid':return [
        [{len:R,wid:R*.42,style:'pointed',a:P/2},{len:R*.95,wid:R*.4,style:'pointed',a:P*7/6+.12},{len:R*.95,wid:R*.4,style:'pointed',a:-P/6-.12}],
        [{len:R*.9,wid:R*.82,style:'round',a:P/10},{len:R*.9,wid:R*.82,style:'round',a:P-P/10}],
        [{len:R*.62,wid:R*.36,style:'notched',a:-P/2},{len:R*.36,wid:R*.3,style:'round',a:-P/2+.8},{len:R*.36,wid:R*.3,style:'round',a:-P/2-.8}]];
      case 'moth':return [
        [{len:R*.9,wid:R*.5,style:'round',a:P/2},{len:R*.85,wid:R*.45,style:'round',a:P*7/6+.12},{len:R*.85,wid:R*.45,style:'round',a:-P/6-.12}],
        [{len:R,wid:R*.95,style:'ruffled',a:P/8},{len:R,wid:R*.95,style:'ruffled',a:P-P/8}],
        [{len:R*.55,wid:R*.42,style:'ruffled',a:-P/2},{len:R*.3,wid:R*.24,style:'round',a:-P/2+.9},{len:R*.3,wid:R*.24,style:'round',a:-P/2-.9}]];
      case 'dendrobium':return [ring(5,R,R*.3,'pointed',P/2),[{len:R*.62,wid:R*.46,style:'ruffled',a:-P/2}]];
      case 'sakura':return [ring(5,R,R*.66,'notched',P/2),ring(5,R*.55,R*.4,'notched',P/2+P/5)];
      case 'daisy':return [ring(n||16,R,R*.2,'lance',0),ring(n||16,R*.82,R*.18,'lance',P/(n||16))];
      case 'cosmos':return [ring(n||8,R,R*.42,'spatula',P/2)];
      case 'lily':return [ring(3,R,R*.36,'pointed',P/2),ring(3,R*.92,R*.34,'pointed',P/2+P/3)];
      case 'lotus':return [ring(8,R,R*.42,'pointed',P/2),ring(8,R*.78,R*.38,'pointed',P/2+P/8),ring(8,R*.55,R*.32,'pointed',P/2)];
      case 'rose':{const t=[];for(let k=0;k<5;k++)t.push(ring(5,R*Math.pow(.8,k),R*Math.pow(.8,k)*.9,'round',k*.63));return t}
      case 'dahlia':{const t=[],c=n||12;for(let k=0;k<4;k++)t.push(ring(c,R*(1-k*.2),R*(.3-k*.03),'pointed',k*P/c));return t}
      case 'hibiscus':return [ring(5,R,R*.85,'ruffled',P/2)];
      case 'plumeria':return [ring(5,R,R*.55,'spatula',P/2,R*.18)];
      case 'poppy':return [ring(4,R,R*.95,'ruffled',P/4),ring(2,R*.7,R*.6,'round',P/2)];
      case 'anemone':return [ring(n||6,R,R*.62,'round',P/2),ring(n||6,R*.62,R*.38,'round',P/2+P/(n||6))];
      case 'protea':{const t=[];for(let k=0;k<3;k++)t.push(ring(10,R*(1-k*.22),R*.2,'pointed',k*P/10));return t}
      case 'star':return [ring(n||6,R,R*.38,'pointed',P/2),ring(n||6,R*.6,R*.28,'pointed',P/2+P/(n||6))];
      default:return [ring(6,R,R*.5,'round',P/2)];
    }
  }
  const CENTRE_FOR={orchid:'column',moth:'column',dendrobium:'column',sakura:'stamens',daisy:'dome',cosmos:'stamens',lily:'stamens',lotus:'seedpod',rose:'spiral',dahlia:'dome',hibiscus:'pistil',plumeria:'none',poppy:'seedpod',anemone:'dome',protea:'dome',star:'dome'};
  function flower(o){
    const R=o.R,lh=o.lh||1.2,tiersSpec=flowerTiers(o.kind,R,o.n,o.seed),notes=[],f=[];
    const tiers=tiersSpec.map(t=>unite(t.flatMap(p=>rot(move(petal(p.len,p.wid,p.style),0,p.dy||0),p.a))));
    tiers[0]=unite(tiers[0],circle(0,0,Math.max(R*.24,o.mount==='magnet'?o.md/2+3.6:4),48));
    const wall=o.mount==='magnet'||o.mount==='clip'||o.mount==='glue';
    let z0=0,dy=0,magnets=0;
    if(wall){const m=backMount(o,offset(tiers[0],1.2),{min:1.6,xs:[0],my:0});f.push(...m.f);z0=m.bt;dy=m.dy;magnets=m.magnets;notes.push(...m.notes)}
    const mv=r=>move(r,0,dy),layers=tiers.map((_,i)=>unite(tiers.slice(i).flat()));
    layers.forEach((L,i)=>f.push(prism(z0+i*lh,z0+(i+1)*lh,mv(i?offset(L,-.2):L))));
    let zTop=z0+layers.length*lh;
    if(o.veins==='yes')tiersSpec.forEach((t,k)=>{const vis=offset(subtract(tiers[k],unite(tiers.slice(k+1).flat())),-.9);if(!vis.length)return;
      const ls=t.map(p=>rot([[[p.len*.28,p.dy||0],[p.len*.86,p.dy||0]]],p.a)[0]);f.push(prism(z0+(k+1)*lh,z0+(k+1)*lh+.5,mv(intersect(stroke(ls,.7),vis))))});
    const cx=0,cy=dy,rc=R*(o.kind==='orchid'||o.kind==='moth'?.11:.17),style=o.centre==='auto'?CENTRE_FOR[o.kind]:o.centre;
    let rHub=0;
    if(o.mount==='peg'){f.push(prism(0,PEG.depth+1.5,circle(cx,cy,PEG.hub)),prism(-1,PEG.depth,circle(cx,cy,PEG.sock),'sub'));rHub=PEG.hub;zTop=Math.max(zTop,PEG.depth+1.5)}
    if(o.mount==='stem'){if(zTop<5){f.push(prism(0,5,circle(cx,cy,4)));zTop=Math.max(zTop,5)}f.push(prism(-1,3.6,circle(cx,cy,2.1,24),'sub'))}
    const rcc=Math.max(rc,rHub);
    if(style==='dome'){const hc=rcc*.75;f.push(varying(zTop,zTop+hc,z=>circle(cx,cy,Math.max(.6,rcc*Math.sqrt(Math.max(0,1-((z-zTop)/hc)**2))),40),.3))}
    else if(style==='stamens'){f.push(prism(zTop,zTop+1,circle(cx,cy,rcc*.55,24)));for(let k=0;k<9;k++){const a=k*TAU/9,d=rcc*(.55+(k%2)*.3);f.push(prism(zTop,zTop+2.4+(k%3)*.8,circle(cx+Math.cos(a)*d,cy+Math.sin(a)*d,.7,12)))}}
    else if(style==='seedpod'){f.push(prism(zTop,zTop+1.8,circle(cx,cy,rcc,40)));const hs=[];for(let k=0;k<7;k++){const a=k*TAU/7;hs.push(...circle(cx+Math.cos(a)*rcc*.55,cy+Math.sin(a)*rcc*.55,.7,12))}hs.push(...circle(cx,cy,.7,12));f.push(prism(zTop+.8,zTop+2.5,hs,'sub'))}
    else if(style==='spiral'){f.push(prism(zTop,zTop+.8,circle(cx,cy,rcc,40)));const q=[];for(let a=0;a<TAU*2.2;a+=.2){const rr=rcc*.95*(1-a/(TAU*2.4));q.push([cx+Math.cos(a)*rr,cy+Math.sin(a)*rr])}f.push(prism(zTop+.79,zTop+2,stroke([q],.8)))}
    else if(style==='column'){f.push(varying(zTop,zTop+2.2,z=>ellipse(cx,cy-rcc*.3,rcc*(1-.3*(z-zTop)/2.2),rcc*1.2*(1-.3*(z-zTop)/2.2),24),.3))}
    else if(style==='pistil'){f.push(prism(zTop,zTop+7,circle(cx,cy,1.1,16)));for(let k=0;k<5;k++){const a=k*TAU/5;f.push(prism(zTop+5.5,zTop+7.6,circle(cx+Math.cos(a)*1.4,cy+Math.sin(a)*1.4,.65,10)))}}
    const parts=[part(`flower-${o.kind}.stl`,build(f))];
    if(o.mount==='stem'){parts.push(part('flower-stem.stl',build([prism(0,o.stemL,circle(0,0,o.dia/2,32)),prism(o.stemL,o.stemL+3.4,circle(0,0,1.9,24))]),'Second file'));notes.push(`The stem pushes into a twig holder made for ${o.dia} mm twigs, and the flower sits on its top.`)}
    if(o.mount==='peg')notes.push('Pushes onto a floor peg.');
    if(o.kind==='orchid'||o.kind==='moth')notes.push('Orchid mantises sit on flowers like this in the wild to wait for pollinators. Pink, white or pale purple filament suits them best.');
    return {parts,notes,magnets};
  }
  const FLOWERS=[['orchid','Moth orchid (Phalaenopsis)'],['moth','Ruffled orchid'],['dendrobium','Dendrobium orchid'],['sakura','Cherry blossom'],['daisy','Daisy'],['cosmos','Cosmos'],['lily','Lily'],['lotus','Lotus'],['rose','Rose'],['dahlia','Dahlia'],['hibiscus','Hibiscus'],['plumeria','Frangipani'],['poppy','Poppy'],['anemone','Anemone'],['protea','Protea'],['star','Star flower']];

  /* ---------------- mister port ---------------- */
  function plateShape(kind,D,seed){
    if(kind==='hex')return ngon(0,0,D/2,6,0);
    if(kind==='flower')return polar(0,0,a=>D/2*(1+.12*Math.cos(6*a)),120);
    if(kind==='leaf')return centre(rot(petal(D*1.2,D*.8,'pointed',0),Math.PI/2));
    if(kind==='pebble')return polar(0,0,a=>D/2*(1+wobble(seed,.1,4)(a)),120);
    return circle(0,0,D/2,90);
  }
  function mister(o,enc){
    const rn=o.noz/2,f=[],notes=[],th=4;
    if(o.kind==='hatch'){
      const R=enc.hatchR||Math.min(30,(o.hatchD||60)/2);if(!enc.hatchR)notes.push('Your enclosure has no feeding hatch yet. This cover is sized for the hatch opening you enter here.');
      f.push(prism(0,th,unite(circle(0,0,R+8,90),rrect(R+4,-6,R+18,6,4))),prism(th,th+4.5,subtract(circle(0,0,R-.2,90),circle(0,0,R-2,90))));
      const hs=holes(subtract(circle(0,0,R-4,60),circle(0,0,rn+th*.6+4,40)),'round',1.6,1.4,o.seed);if(hs.length&&o.vent==='yes')f.push(prism(-1,th+1,hs,'sub'));
      notes.push('Replaces the push-in cover of a plug hatch. The cone opens inwards, so the spray fans out over the enclosure.');
    }else{
      const sh=plateShape(o.shape,o.D,o.seed);f.push(prism(0,th,sh));
      notes.push('Rests on the lid mesh; the mist goes through the cone and the mesh. A dot of clear silicone keeps it in place.');
    }
    f.push(varying(-1,th+1,z=>circle(0,0,rn+Math.max(0,Math.min(th,z))*.6,40),.3,'sub'));
    const cap=build([prism(0,2,unite(circle(0,0,rn+4,40),rrect(rn+2,-3,rn+9,3,2))),prism(2,4.5,circle(0,0,rn-.15,40))]);
    notes.push(`Measure your spray nozzle tip and set it as the nozzle size. The cap pushes into the port between mistings.`);
    return {parts:[part('mister-port.stl',build(f)),part('mister-cap.stl',cap,'Second file')],notes,magnets:0,separate:true};
  }

  /* ---------------- moss tray ---------------- */
  function trayShape(shape,L,W,seed){
    if(shape==='kidney')return HP.fit(polar(0,0,a=>1-.3*Math.pow(Math.max(0,Math.sin(a)),3),120).map(q=>q.map(([x,y])=>[x*L/2,y*W/2])));
    if(shape==='corner'){const q=[[0,0]];for(let i=0;i<=30;i++){const a=i/30*Math.PI/2;q.push([L*Math.cos(a),L*Math.sin(a)])}return HP.fit(move([q],-L/2,0))}
    if(shape==='crescent')return HP.fit(subtract(ellipse(0,0,L/2,W/2,90),ellipse(0,W*.35,L*.42,W*.45,90)));
    return HP.body2D(shape,L,W,seed);
  }
  function moss(o){
    const W=o.shape==='round'?o.L:o.W,fp=trayShape(o.shape,o.L,W,o.seed),b=bounds(fp),f=[],notes=[],parts=[];
    const fl=o.mount==='peg'?PEG.depth+1.5:2;
    f.push(prism(0,o.H,fp),prism(fl,o.H+1,offset(fp,-o.wall),'sub'));
    if(o.mount==='peg')f.push(prism(-1,PEG.depth,circle(b.cx,b.cy,PEG.sock),'sub'));
    parts.push(part('moss-tray.stl',build(f)));
    if(o.insert==='yes'){
      const ins=offset(fp,-o.wall-.5),fh=Math.max(3,(o.H-fl)*.45),ft=[];
      const ib=bounds(ins);for(let x=ib.x0+8;x<ib.x1-4;x+=18)for(let y=ib.y0+8;y<ib.y1-4;y+=18)if(G.inside(offset(ins,-4),x,y))ft.push(...circle(x,y,2.2,16));
      const hs=holes(subtract(offset(ins,-2),offset(ft,1.2)),o.pattern||'grid',2,1.4,o.seed);
      const fi=[prism(0,1.6,ins),prism(1.6,1.6+fh,ft)];if(hs.length)fi.push(prism(-1,2,hs,'sub'));
      parts.push(part('moss-tray-grid.stl',build(fi),'Second file'));
      notes.push('The grid sits on its feet inside the tray (feet down), so water collects underneath and the moss stays damp without going sour.');
    }
    notes.push('Fill with sphagnum moss and keep it damp. It raises the humidity in one corner without wetting all the substrate.');
    return {parts,notes,magnets:0,separate:true};
  }

  /* ---------------- hanging planter: flat back against the wall ---------------- */
  function halfShape(kind,L,D,seed){
    let full;
    if(kind==='halfhex')full=ngon(0,0,L/2,6,0).map(q=>q.map(([x,y])=>[x,y*D/(L/2*.866)]));
    else if(kind==='facet')full=ngon(0,0,L/2,8,Math.PI/8).map(q=>q.map(([x,y])=>[x,y*D/(L/2*Math.cos(Math.PI/8))]));
    else if(kind==='scallop')full=polar(0,0,a=>1+.07*Math.cos(10*a),160).map(q=>q.map(([x,y])=>[x*L/2,y*D]));
    else if(kind==='pebble'){const w=wobble(seed,.12,4);full=polar(0,0,a=>1+w(a),120).map(q=>q.map(([x,y])=>[x*L/2,y*D]))}
    else if(kind==='square')full=rrect(-L/2,-D,L/2,D,Math.min(L,D)*.2);
    else full=ellipse(0,0,L/2,D,120);
    return intersect(full,rect(-L,0,L,D*2));
  }
  function planter(o){
    const base=halfShape(o.shape==='cone'?'halfround':o.shape,o.L,o.D,o.seed),f=[],notes=[],H=o.H,fl=2;
    let tp=(o.shape==='cone'?55:(o.taper||0))/100;tp=Math.min(tp,.95*H/(o.L/2),.95*H/o.D);
    const at=z=>G.scale(base,1-tp*(1-z/H),1-tp*(1-z/H),0,0);
    f.push(varying(0,H,at,1),varying(fl,H+.01,z=>offset(at(Math.min(z,H)),-o.wall),1,'sub'));
    if(o.drain){const fb=offset(at(0),-o.wall-2.5),bb=bounds(fb);let n=0;for(let x=bb.x0;x<=bb.x1;x+=7)for(let y=bb.y0;y<=bb.y1;y+=7)if(G.inside(fb,x,y)){f.push(prism(-1,fl+.01,circle(x,y,1.3,14),'sub'));n++}if(!n)notes.push('Too small for drainage holes.')}
    const b=bounds(base),magnets=HP.mountWall(f,o,b,H,base);
    notes.push('Good for air plants, pothos or fittonia cuttings. With drainage holes, water drips onto the substrate below.');
    return {parts:[part('hanging-planter.stl',build(f))],notes,magnets};
  }

  /* ---------------- cork bark holder: printed on its back ---------------- */
  function bark(o){
    const bw=o.bw,bh=o.bh,bk=o.bk,f=[],notes=[],yb=6,yt=yb+3+bh+1,m=8,org=o.style==='organic';
    const foot=org?polar(0,(yt+6)/2,a=>{const rx=bw/2+m+3,ry=(yt+6)/2+3,c=Math.cos(a),s=Math.sin(a);return 1/Math.sqrt(c*c/(rx*rx)+s*s/(ry*ry))*(1+wobble(o.seed,.07,5)(a))},140):rrect(-bw/2-m,0,bw/2+m,yt+6,6);
    let plate=null;if(o.open==='yes')plate=subtract(foot,holes(offset(foot,-6),'voronoi',9,3.2,o.seed));
    const mt=backMount(o,foot,{plate,min:2.4});f.push(...mt.f);notes.push(...mt.notes);
    const bt=mt.bt,dy=mt.dy,zl=bt+bk+1,sw=o.style==='cradle'?bw*.9:bw*.8;
    f.push(prism(bt,zl+4,rect(-sw/2,yb+dy,sw/2,yb+3+dy)));
    f.push(varying(zl,zl+4,z=>rect(-sw/2,yb+dy,sw/2,yb+3+dy+Math.min(5,z-zl+.15)),.3));
    const xs=o.style==='minimal'?[0]:o.style==='cradle'?[]:[-bw/4,bw/4];
    if(xs.length)f.push(varying(bt,zl+5,z=>{const d=Math.max(0,z-zl);return xs.map(x=>rect(x-4,yt+dy-d,x+4,yt+3+dy-d)[0])},.3));
    if(o.style==='cradle'){const ym=yb+3+bh*.55+dy;f.push(varying(bt,zl+5,z=>{const d=Math.max(0,z-zl);return [rect(-bw/2-1.5-3+d,ym-6,-bw/2-1.5+d,ym+6)[0],rect(bw/2+1.5-d,ym-6,bw/2+4.5-d,ym+6)[0]]},.3))}
    notes.push(`Holds a piece of cork bark up to ${bw} mm wide, ${bh} mm tall and ${bk} mm thick. Slide it in from the side or from above.`);
    return {parts:[part('cork-bark-holder.stl',build(f))],notes,magnets:mt.magnets};
  }

  /* ---------------- stacking feet, risers and links ---------------- */
  function cornerBlock(enc){
    if(enc.corner==='circle')return circle(0,0,enc.Eh,48);
    if(enc.corner==='rounded')return rrect(-enc.Eh,-enc.Eh,enc.Eh,enc.Eh,3);
    return rect(-enc.Eh,-enc.Eh,enc.Eh,enc.Eh);
  }
  function stack(o,enc){
    const notes=[],f=[];
    if(!enc.Eh)return {parts:[],notes:['Stacking parts fit rectangular and polygon enclosures. Choose one of those under Enclosure first.'],magnets:0};
    const sq=enc.corner!=='circle',pk=offset(cornerBlock(enc),.35,enc.corner==='square'?'miter':null),wall=2.4,outer=o.outer==='square'&&enc.corner==='square'?offset(pk,wall,'miter'):offset(pk,wall);
    const ob=bounds(outer),rMax=Math.max(ob.x1-ob.x0,ob.y1-ob.y0)/2,cw=2*(enc.band||4.2)+.6;
    /* the lid and base edges run out of each corner block, so the pocket walls are slotted where they pass */
    const slots=(cx,cy,dirs,z0,z1)=>f.push(prism(z0,z1,unite(dirs.flatMap(a=>rot(rect(0,-cw/2,rMax+wall+3,cw/2),a,0,0).map(q=>q.map(([x,y])=>[x+cx,y+cy]))),[]),'sub'));
    const dirs=[0,enc.alpha||Math.PI/2],cross=[0,Math.PI/2,Math.PI,Math.PI*1.5];
    let file='stacking-riser.stl',count=4;
    if(o.kind==='riser'){
      const g=o.gap,H=6+g+6;f.push(prism(0,H,outer),prism(-1,6,pk,'sub'),prism(6+g,H+1,pk,'sub'));
      if(o.outer==='bead'){const zm=6+g/2;f.push(varying(zm-2,zm+2,z=>offset(outer,Math.max(.01,1.2-Math.abs(z-zm)*.6)),.3))}
      slots(0,0,dirs,-1,6);slots(0,0,dirs,6+g,H+1);
      notes.push(`Put one on each lid corner and stand the next enclosure on top. The ${g} mm gap lets air flow between them.`);
      if(!sq)notes.push('Turn each riser so its two slots line up with the lid edges.');
    }else if(o.kind==='link2'||o.kind==='link4'){
      if(!sq)return {parts:[],notes:['Link caps are for rectangular enclosures standing side by side. Use risers or feet for this shape.'],magnets:0};
      const E=enc.Eh,cs=o.kind==='link2'?[[-E,0],[E,0]]:[[-E,-E],[E,-E],[-E,E],[E,E]],pks=unite(cs.flatMap(([x,y])=>move(pk,x,y)));
      const out2=offset(pks,wall,enc.corner==='square'?'miter':null);f.push(prism(0,8,out2),prism(2.4,9,pks,'sub'));
      for(const [x,y] of cs)slots(x,y,cross,2.4,9);
      file=o.kind==='link2'?'link-cap-2.stl':'link-cap-4.stl';count=o.kind==='link2'?2:1;
      notes.push('Prints top down. '+(o.kind==='link2'?'Press onto the touching lid corners of two enclosures side by side, so they can\'t drift apart.':'Press onto the four lid corners where four enclosures meet.'));
    }else{
      /* foot: printed upside down, pocket open on the bed, the decoration rising from the block */
      f.push(prism(0,8,outer),prism(-1,6,pk,'sub'));slots(0,0,dirs,-1,6);
      const fh=o.fh,sh=o.style;file=`foot-${sh}.stl`;
      const shapeAt=r=>sh==='hex'?ngon(0,0,r,6,0):sh==='block'?offset(pk,Math.min(wall,r-rMax+wall),enc.corner==='square'?'miter':null):circle(0,0,r,48);
      const prof={bun:t=>rMax*(.78+.22*Math.sin(Math.PI*t)),ball:t=>t<.15?rMax*.45:rMax*.85*Math.sqrt(Math.max(.02,1-((t-.6)/.42)**2)),cone:t=>rMax*(1-.45*t),
        turned:t=>rMax*(.55+.22*Math.pow(Math.sin(3*Math.PI*t),2)),hex:t=>rMax*(1-.25*t),block:()=>rMax}[sh]||(()=>rMax);
      f.push(lathe(8,fh,prof,shapeAt,rMax));
      notes.push('Prints upside down. Push one onto each base corner'+(sq?'.':', with the slots lined up with the base edges.'));
    }
    return {parts:[part(file,build(f))],notes:[`Print ${count}.`,...notes],magnets:0};
  }
  /* ---------------- moult display ---------------- */
  function plinth(shape,L,W,seed){
    if(shape==='oval')return ellipse(0,0,L/2,W/2,120);
    if(shape==='hex')return ngon(0,0,L/2,6,0);
    if(shape==='square')return rrect(-L/2,-W/2,L/2,W/2,5);
    if(shape==='pebble')return polar(0,0,a=>{const c=Math.cos(a),s=Math.sin(a);return 1/Math.sqrt(c*c/(L*L/4)+s*s/(W*W/4))*(1+wobble(seed,.08,4)(a))},120);
    if(shape==='leaf')return centre(rot(petal(L*1.1,W,'pointed',0),Math.PI/2));
    if(shape==='log')return unite(rrect(-L/2,-W/2,L/2,W/2,W/2),circle(L/2-W/2,0,W/2));
    return circle(0,0,L/2,120);
  }
  function postSil(style,H,seed){
    const r=rnd(seed),P=Math.PI;
    if(style==='stake')return {sil:unite(rect(-1.6,0,1.6,H-3),[[[-1.6,H-3],[1.6,H-3],[0,H]]]),th:3.2};
    if(style==='ring'){const rr=Math.min(10,H/4),z=H-3*rr;return {sil:stroke([[[0,0],[0,z],[-rr,z+rr],[-rr,z+2*rr],[0,z+3*rr],[rr,z+2*rr],[rr,z+rr],[0,z]]],3),th:3}}
    if(style==='leaf')return {sil:unite(rect(-1.2,0,1.2,H*.3),move(rot(petal(H*.75,H*.38,'pointed',0),P/2),0,H*.25)),th:2.4};
    if(style==='fork')return {sil:stroke([[[0,0],[0,H*.5]],[[0,H*.5],[-H*.35,H]],[[0,H*.5],[H*.35,H]]],3.2),th:3.2};
    const main=[];for(let z=0;z<=H;z+=H/12)main.push([(r()-.5)*2.4,z]);
    return {sil:unite(stroke([main],4),unite(stroke([[[main[6][0],H*.5],[H*.32,H*.85]],[[main[4][0],H*.33],[-H*.2,H*.58]]],2.6),[[[-5,0],[5,0],[0,6]]])),th:4};
  }
  function moult(o){
    const W=o.shape==='round'||o.shape==='hex'?o.L:o.W,fp=plinth(o.shape,o.L,W,o.seed),b=bounds(fp),ph=o.ph,f=[prism(0,ph,fp)],notes=[],parts=[];
    const depth=b.y1-b.y0,ty=b.y0+depth*.24,py=b.y0+depth*.64;
    let T=text2D([o.t1,o.t2],o.th,Math.max(1.1,o.th*.15));
    if(T.w>(b.x1-b.x0)*.82){const s=(b.x1-b.x0)*.82/T.w;T=text2D([o.t1,o.t2],o.th*s,Math.max(1.1,o.th*s*.15));notes.push('The text was made smaller to fit the plinth.')}
    const letters=move(T.rings,0,ty);
    const {sil,th}=postSil(o.post,o.postH,o.seed);
    f.push(upright(sil,th,0,py,ph-.01));
    if(o.cover==='yes'&&(o.shape==='round'||o.shape==='oval')){const gw=1.2;f.push(prism(ph-3,ph+1,subtract(offset(fp,-3),offset(fp,-3-gw)),'sub'));
      const a=(b.x1-b.x0)/2-3.6,bb=(b.y1-b.y0)/2-3.6,per=HP.perimeter?HP.perimeter(a,bb):Math.PI*(a+bb);notes.push(`Clear cover: roll a PET sheet (0.5–0.75 mm) ${(per+12).toFixed(0)} × ${(o.postH+10).toFixed(0)} mm into the groove, tape the seam, and add a printed or glass lid if you like.`)}
    if(letters.length){if(o.colour==='two'){parts.push(part('moult-display-letters.stl',build([prism(ph,ph+.8,letters)]),'Colour 2'))}else f.push(prism(ph,ph+.8,letters))}
    parts.unshift(part('moult-display.stl',build(f),o.colour==='two'?'Colour 1':'Main colour'));
    notes.push('Glue the shed skin onto the post with a small dot of PVA glue. It dries clear.');
    return {parts,notes,magnets:0};
  }

  /* ---------------- name plate ---------------- */
  function plateOutline(shape,w,h,seed){
    const r=rnd(seed);
    switch(shape){
      case 'oval':return ellipse(0,0,w/2*1.12,h/2*1.25,120);
      case 'banner':{const n=h*.35;return [[[-w/2-n,h/2],[w/2+n,h/2],[w/2+n*.2,0],[w/2+n,-h/2],[-w/2-n,-h/2],[-w/2-n*.2,0]]]}
      case 'leaf':return centre(rot(petal(w*1.25,h*1.45,'pointed',0),0));
      case 'hex':return [[[-w/2-h/2,0],[-w/2,h/2],[w/2,h/2],[w/2+h/2,0],[w/2,-h/2],[-w/2,-h/2]]];
      case 'arch':return unite(rect(-w/2,-h/2,w/2,h/4),ellipse(0,h/4,w/2,h*.5,90));
      case 'cloud':{const cs=[...rrect(-w/2,-h/2,w/2,h/2,h/3)];for(let x=-w/2;x<=w/2;x+=h*.55){cs.push(...circle(x,h/2-h*.05,h*(.22+r()*.12),24),...circle(x+h*.25,-h/2+h*.05,h*(.2+r()*.1),24))}return unite(cs)}
      case 'tag':return subtract(unite(rrect(-w/2,-h/2,w/2,h/2,3),[[[-w/2,h/2],[-w/2-h*.45,h*.2],[-w/2-h*.45,-h*.2],[-w/2,-h/2]]]),circle(-w/2-h*.2,0,Math.min(2.5,h*.12),20));
      case 'scroll':return unite(rect(-w/2,-h/2,w/2,h/2),unite(circle(-w/2,0,h/2,40),circle(w/2,0,h/2,40)));
      default:return rrect(-w/2,-h/2,w/2,h/2,Math.min(4,h/4));
    }
  }
  function nameplate(o){
    const lines=[o.t1,o.t2],h=o.th,sw=Math.max(1.2,h*.16),T=text2D(lines,h,sw),notes=[],parts=[];
    const logo=o.logo==='yes'?logoMark(Math.max(h*2.2,T.h*1.1)):null,gap=h*.6;
    if(!T.rings.length&&!logo)return {parts:[],notes:['Type a name to make a plate.'],magnets:0};
    const cw=T.w+(logo?logo.w+gap:0),ch=Math.max(T.h,logo?logo.h:0),m=h*.7;
    const tx=logo?(logo.w+gap)/2:0,letters=move(T.rings,tx,0),mark=logo?move(logo.mark,-cw/2+logo.w/2,0):[];
    const outline=plateOutline(o.shape,cw+2*m,ch+2*m,o.seed);
    const mt=backMount(o,outline,{min:o.mode==='engraved'?2.4:2});const f=[...mt.f],bt=mt.bt,dy=mt.dy;notes.push(...mt.notes);
    let art=move(unite(letters,mark),0,dy);
    if(o.mode==='stencil'){art=stencil(move(outline,0,dy),art,Math.max(1.2,sw*.9));f.push(prism(-1,bt+1,art,'sub'));notes.push('Cut-through letters: small bridges keep the middles of letters like O and A in place.')}
    else if(o.mode==='engraved')f.push(prism(bt-.8,bt+1,art,'sub'));
    else if(o.colour==='two'){parts.push(part('name-plate-letters.stl',build([prism(bt,bt+1,art)]),'Colour 2'));notes.push('Raised letters come as a second file so you can print them in another colour with the CFS.')}
    else f.push(prism(bt,bt+1,art));
    if(o.border==='yes'){const bd=subtract(offset(move(outline,0,dy),-.8),offset(move(outline,0,dy),-2.2));if(o.colour==='two'&&o.mode==='raised')parts[0].m=build([prism(bt,bt+1,unite(art,bd))]);else if(o.mode==='raised'||o.mode==='engraved')f.push(o.mode==='raised'?prism(bt,bt+1,bd):prism(bt-.8,bt+1,bd,'sub'))}
    parts.unshift(part('name-plate.stl',build(f),parts.length?'Colour 1':'Main colour'));
    return {parts,notes,magnets:mt.magnets};
  }

  /* ---------------- transport box ---------------- */
  function boxShape(shape,L,W,seed){
    if(shape==='square')return rrect(-L/2,-W/2,L/2,W/2,5);
    if(shape==='hex')return ngon(0,0,L/2,6,0);
    if(shape==='oval')return ellipse(0,0,L/2,W/2,120);
    if(shape==='pebble')return polar(0,0,a=>{const c=Math.cos(a),s=Math.sin(a);return 1/Math.sqrt(c*c/(L*L/4)+s*s/(W*W/4))*(1+wobble(seed,.07,4)(a))},120);
    if(shape==='octagon')return ngon(0,0,L/2,8,Math.PI/8);
    return circle(0,0,L/2,120);
  }
  function transport(o){
    const fp=boxShape(o.shape,o.L,o.shape==='round'||o.shape==='hex'||o.shape==='octagon'?o.L:o.W,o.seed),wall=2,H=o.H,outer=offset(fp,wall),f=[],notes=[],parts=[];
    f.push(prism(0,H,outer),prism(2,H+1,fp,'sub'));
    if(o.vents!=='lid'){
      const q=fp[0],per=q.reduce((a,p,i)=>a+Math.hypot(p[0]-q[(i+1)%q.length][0],p[1]-q[(i+1)%q.length][1]),0),n=Math.floor(per/5),sl=[];
      const at=s=>{let acc=0;for(let i=0;i<q.length;i++){const a=q[i],c=q[(i+1)%q.length],l=Math.hypot(c[0]-a[0],c[1]-a[1]);if(acc+l>=s){const t=(s-acc)/l;return [a[0]+(c[0]-a[0])*t,a[1]+(c[1]-a[1])*t,(c[0]-a[0])/l,(c[1]-a[1])/l]}acc+=l}return [q[0][0],q[0][1],1,0]};
      for(let k=0;k<n;k++){const [x,y,tx,ty]=at(k*per/n),nx=ty,ny=-tx,s2=.8;sl.push([[x-tx*s2-nx*1,y-ty*s2-ny*1],[x+tx*s2-nx*1,y+ty*s2-ny*1],[x+tx*s2+nx*(wall+1),y+ty*s2+ny*(wall+1)],[x-tx*s2+nx*(wall+1),y-ty*s2+ny*(wall+1)]])}
      f.push(prism(H*.3,Math.min(H-6,H*.85),sl,'sub'));
    }
    parts.push(part('transport-box.stl',build(f)));
    const lf=[prism(0,2,unite(outer,o.handle==='tabs'?unite(rrect(-6,(bounds(outer).y1)-2,6,bounds(outer).y1+6,3),rrect(-6,bounds(outer).y0-6,6,bounds(outer).y0+2,3)):[])),prism(2,7,subtract(offset(fp,-.3),offset(fp,-1.9)))];
    if(o.vents!=='sides'){const hs=holes(offset(fp,-3),o.pattern,1.6,1.3,o.seed),ob=bounds(outer);const keep=o.handle==='loop'?hs.filter(h=>h.every(([x,y])=>Math.hypot(Math.abs(x)-(ob.x1-ob.x0)*.3,y)>5)):hs;if(keep.length)lf.push(prism(-1,3,keep,'sub'))}
    if(o.handle==='loop'){const ob=bounds(outer),ax=(ob.x1-ob.x0)*.3;lf.push(prism(-1,3,unite(rect(-ax-2.2,-2.2,-ax+2.2,2.2),rect(ax-2.2,-2.2,ax+2.2,2.2)),'sub'));
      const hp=[[-ax,-2],[-ax,6],[-ax+6,6+Math.min(14,ax*.5)],[ax-6,6+Math.min(14,ax*.5)],[ax,6],[ax,-2]];
      parts.push(part('transport-handle.stl',build([prism(0,4,unite(stroke([hp.slice(1,5)],4),unite(rect(-ax-2,-2,-ax+2,6.5),rect(ax-2,-2,ax+2,6.5))))]),'Second file'));
      notes.push('Push the handle pegs into the two square holes in the lid, with a drop of glue.')}
    parts.splice(1,0,part('transport-lid.stl',build(lf),'Second file'));
    notes.push('The lid prints upside down and pushes into the box. Line the floor with a paper towel and add a twig so the mantis can hold on.');
    return {parts,notes,magnets:0,separate:true};
  }

  /* ---------------- Shifty's emblem ---------------- */
  function emblem(o){
    const W=o.size,notes=[],mk=logoMark(W*.6),sw=Math.max(1.2,W*.022),T=o.text==='yes'?text2D([o.name||"SHIFTY'S"],W*.12,sw):{rings:[],h:0};
    let badge;
    if(o.shape==='shield')badge=unite(rect(-W/2,-W*.05,W/2,W*.5),[[[-W/2,-W*.05],[W/2,-W*.05],[W*.32,-W*.38],[0,-W*.55],[-W*.32,-W*.38]]]);
    else if(o.shape==='hex')badge=ngon(0,0,W/2/Math.cos(Math.PI/6),6,Math.PI/6);
    else if(o.shape==='oval')badge=ellipse(0,0,W*.42,W*.55,120);
    else if(o.shape==='leaf')badge=centre(rot(petal(W*1.25,W*.95,'pointed',0),Math.PI/2));
    else if(o.shape==='square')badge=rrect(-W/2,-W/2,W/2,W/2,W*.12);
    else badge=circle(0,0,W/2,140);
    const bb=bounds(badge),my=T.rings.length?bb.cy+(bb.y1-bb.y0)*.1:bb.cy,ty=bb.y0+(bb.y1-bb.y0)*.2;
    let art=unite(move(mk.mark,0,my),move(T.rings,0,ty));
    if(o.border==='yes')art=unite(art,subtract(offset(badge,-1),offset(badge,-1-Math.max(1.2,W*.025))));
    const o2=Object.assign({},o,{mount:o.mount==='none'?'glue':o.mount}),mt=backMount(o2,badge,{min:2});notes.push(...mt.notes);
    const art2=move(art,0,mt.dy),parts=[part('shiftys-emblem.stl',build(mt.f),'Colour 1'),part('shiftys-emblem-mark.stl',build([prism(mt.bt,mt.bt+1,art2)]),'Colour 2')];
    parts.push({file:'shiftys-logo.svg',text:logoSVG({}),role:'Logo'},{file:'shiftys-logo-wide.svg',text:logoSVG({layout:'wide'}),role:'Logo'});
    notes.push('The mark comes as its own file. In Creality Print, add it to the badge as a part and give it a second CFS colour. The zip also has the logo as SVG files for labels and your shop.');
    return {parts,notes,magnets:mt.magnets};
  }

  root.HabitatMore={holes,PATTERNS,voronoi,text2D,stencil,logoMark,logoSVG,svgPath,backMount,upright,lathe,petal,
    feeder,flyLid,ladder,bridge,texture,TEXTURES,tile,flower,FLOWERS,mister,moss,planter,bark,stack,moult,nameplate,transport,emblem};
})(typeof window!=='undefined'?window:globalThis);
