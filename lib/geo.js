/* Geo: a small solid modeller for printable parts.
   A part is a list of features, each a 2D outline that exists between two heights, and is either added or cut away.
   The part is cut into horizontal slabs wherever any feature starts, ends or changes shape. Each slab's outline is
   found exactly with Clipper, the steps between slabs are capped with earcut, and the walls are stitched so every
   edge is shared by exactly two triangles. The result is a closed, watertight STL mesh.
   Curves in plan view (circles, ovals, wavy edges) are exact to the polygon resolution. Shapes that change with
   height (a tapered pot, a round pocket in an upright wall) are stepped in thin slabs, like the printer's layers. */
(function(root){
  const CL=root.ClipperLib||(typeof require!=='undefined'?require('./clipper.js'):null);
  const EC=root.earcut||(typeof require!=='undefined'?require('./earcut.min.js'):null);
  const SC=1000; /* clipper works in whole numbers: 1 unit = 1 micrometre */

  /* ---------- 2D shapes, in millimetres, as arrays of rings [[x,y],...] ---------- */
  const TAU=Math.PI*2;
  function ellipse(cx,cy,rx,ry,n){n=n||Math.max(24,Math.min(160,Math.round(Math.max(rx,ry)*2.2)));const o=[];for(let i=0;i<n;i++){const a=i/n*TAU;o.push([cx+rx*Math.cos(a),cy+ry*Math.sin(a)])}return [o]}
  const circle=(cx,cy,r,n)=>ellipse(cx,cy,r,r,n);
  const rect=(x0,y0,x1,y1)=>[[[x0,y0],[x1,y0],[x1,y1],[x0,y1]]];
  function rrect(x0,y0,x1,y1,r,n){
    r=Math.max(0,Math.min(r,(x1-x0)/2-.01,(y1-y0)/2-.01));if(r<.05)return rect(x0,y0,x1,y1);
    n=n||Math.max(4,Math.round(r*1.5));const o=[],cs=[[x1-r,y0+r,-Math.PI/2],[x1-r,y1-r,0],[x0+r,y1-r,Math.PI/2],[x0+r,y0+r,Math.PI]];
    for(const [cx,cy,a0] of cs)for(let i=0;i<=n;i++){const a=a0+i/n*Math.PI/2;o.push([cx+r*Math.cos(a),cy+r*Math.sin(a)])}
    return [o];
  }
  function ngon(cx,cy,r,k,rot){const o=[];for(let i=0;i<k;i++){const a=(rot||0)+i/k*TAU;o.push([cx+r*Math.cos(a),cy+r*Math.sin(a)])}return [o]}
  /* a closed outline whose radius wobbles: f(angle) gives the radius */
  function polar(cx,cy,f,n){n=n||160;const o=[];for(let i=0;i<n;i++){const a=i/n*TAU,r=f(a);o.push([cx+r*Math.cos(a),cy+r*Math.sin(a)])}return [o]}
  /* repeatable random wobble from a seed: a sum of a few sine waves */
  function wobble(seed,amp,waves){
    let s=seed*9301+49297;const rnd=()=>{s=(s*9301+49297)%233280;return s/233280};
    const terms=[];for(let k=2;k<2+(waves||5);k++)terms.push([k,rnd()*TAU,(rnd()*.7+.3)/k]);
    const norm=terms.reduce((a,t)=>a+t[2],0);
    return a=>amp*terms.reduce((v,[k,ph,w])=>v+w*Math.sin(k*a+ph),0)/norm;
  }
  const move=(rings,dx,dy)=>rings.map(r=>r.map(([x,y])=>[x+dx,y+dy]));
  const scale=(rings,sx,sy,cx,cy)=>rings.map(r=>r.map(([x,y])=>[cx+(x-cx)*sx,cy+(y-cy)*(sy??sx)]));
  const toPath=r=>r.map(([x,y])=>({X:Math.round(x*SC),Y:Math.round(y*SC)}));
  const fromPath=p=>p.map(q=>[q.X/SC,q.Y/SC]);
  /* grow (d>0) or shrink (d<0) an outline with round corners */
  function offset(rings,d,join){
    const co=new CL.ClipperOffset(join==='miter'?8:2,.05*SC);co.AddPaths(rings.map(toPath),join==='miter'?CL.JoinType.jtMiter:CL.JoinType.jtRound,CL.EndType.etClosedPolygon);
    const out=new CL.Paths();co.Execute(out,d*SC);return out.map(fromPath);
  }
  /* the part of an outline inside another, or outside it */
  function clip2(a,b,type){const c=new CL.Clipper();c.AddPaths(a.map(toPath),CL.PolyType.ptSubject,true);c.AddPaths(b.map(toPath),CL.PolyType.ptClip,true);const o=new CL.Paths();c.Execute(type,o,CL.PolyFillType.pftNonZero,CL.PolyFillType.pftNonZero);return o.map(fromPath)}
  const intersect=(a,b)=>clip2(a,b,CL.ClipType.ctIntersection);
  const subtract=(a,b)=>clip2(a,b,CL.ClipType.ctDifference);
  const unite=(a,b)=>clip2(a,b||[],CL.ClipType.ctUnion);

  /* is the point inside the outline (even-odd)? */
  function inside(rings,x,y){let c=false;for(const r of rings)for(let i=0,j=r.length-1;i<r.length;j=i++){const [xi,yi]=r[i],[xj,yj]=r[j];if((yi>y)!==(yj>y)&&x<(xj-xi)*(y-yi)/(yj-yi)+xi)c=!c}return c}
  const area=rings=>{const u=unite(rings);return u.reduce((t,r)=>{let a=0;for(let i=0;i<r.length;i++){const [x0,y0]=r[i],[x1,y1]=r[(i+1)%r.length];a+=x0*y1-x1*y0}return t+a/2},0)};
  /* thick lines with round ends */
  function stroke(lines,w){const co=new CL.ClipperOffset(2,.05*SC);co.AddPaths(lines.map(toPath),CL.JoinType.jtRound,CL.EndType.etOpenRound);const out=new CL.Paths();co.Execute(out,w/2*SC);return out.map(fromPath)}
  /* where the line y=u crosses the outline: a list of [x0,x1] intervals inside it */
  function slice(rings,u){
    const xs=[];
    for(const r of rings)for(let i=0;i<r.length;i++){const [x0,y0]=r[i],[x1,y1]=r[(i+1)%r.length];if((y0<=u&&u<y1)||(y1<=u&&u<y0))xs.push(x0+(u-y0)*(x1-x0)/(y1-y0))}
    xs.sort((a,b)=>a-b);const o=[];for(let i=0;i+1<xs.length;i+=2)if(xs[i+1]-xs[i]>.01)o.push([xs[i],xs[i+1]]);return o;
  }

  /* ---------- features ---------- */
  const prism=(z0,z1,rings,op)=>({z0,z1,rings,op:op||'add'});
  /* a feature whose outline changes with height; it is sampled every dz millimetres */
  const varying=(z0,z1,fn,dz,op)=>({z0,z1,fn,dz:dz||.4,op:op||'add'});
  /* an upright disc (axis along y), as used for a round pocket in a wall: stepped in z */
  function yDisc(cx,cz,r,y0,y1,op,dz){
    return varying(cz-r,cz+r,z=>{const h=Math.sqrt(Math.max(0,r*r-(z-cz)*(z-cz)));return h<.01?[]:rect(cx-h,y0,cx+h,y1)},dz||.25,op);
  }
  /* same, with the axis along x */
  function xDisc(cy,cz,r,x0,x1,op,dz){
    return varying(cz-r,cz+r,z=>{const h=Math.sqrt(Math.max(0,r*r-(z-cz)*(z-cz)));return h<.01?[]:rect(x0,cy-h,x1,cy+h)},dz||.25,op);
  }

  /* one feature's own outline at height z, cleaned to clipper paths with outers CCW and holes CW */
  function featurePaths(f,z){
    if(f.rings&&f._p)return f._p;
    const rings=f.rings||f.fn(z);if(!rings||!rings.length)return [];
    const c=new CL.Clipper();c.AddPaths(rings.map(toPath),CL.PolyType.ptSubject,true);
    const o=new CL.Paths();c.Execute(CL.ClipType.ctUnion,o,CL.PolyFillType.pftEvenOdd,CL.PolyFillType.pftEvenOdd);
    if(f.rings)f._p=o;return o;
  }
  function region(features,z){
    const adds=[],subs=[];
    for(const f of features)if(z>f.z0&&z<f.z1){const p=featurePaths(f,z);if(!p.length)continue;(f.op==='sub'?subs:adds).push(...p)}
    if(!adds.length)return null;
    const c=new CL.Clipper();c.StrictlySimple=false;c.AddPaths(adds,CL.PolyType.ptSubject,true);if(subs.length)c.AddPaths(subs,CL.PolyType.ptClip,true);
    const t=new CL.PolyTree();c.Execute(subs.length?CL.ClipType.ctDifference:CL.ClipType.ctUnion,t,CL.PolyFillType.pftNonZero,CL.PolyFillType.pftNonZero);
    const ex=CL.JS.PolyTreeToExPolygons(t).filter(e=>e.outer.length>2);
    return ex.length?ex:null;
  }
  function boolEx(a,b,type){
    if(!a)return [];
    const c=new CL.Clipper();c.StrictlySimple=false;
    for(const e of a)c.AddPaths([e.outer,...e.holes],CL.PolyType.ptSubject,true);
    if(b)for(const e of b)c.AddPaths([e.outer,...e.holes],CL.PolyType.ptClip,true);
    const t=new CL.PolyTree();c.Execute(type,t,CL.PolyFillType.pftNonZero,CL.PolyFillType.pftNonZero);
    return CL.JS.PolyTreeToExPolygons(t).filter(e=>e.outer.length>2);
  }
  const sig=ex=>ex?ex.map(e=>[e.outer,...e.holes].map(r=>r.map(p=>p.X+','+p.Y).join(';')).join('|')).join('#'):'';

  /* ---------- stitching ---------- */
  function PointIndex(cell){this.c=cell;this.m=new Map();this.all=[]}
  PointIndex.prototype.add=function(p){const k=p.X+','+p.Y;if(this.seen&&this.seen.has(k))return;(this.seen||(this.seen=new Set())).add(k);this.all.push(p);const g=Math.floor(p.X/this.c)+','+Math.floor(p.Y/this.c);let b=this.m.get(g);if(!b)this.m.set(g,b=[]);b.push(p)};
  PointIndex.prototype.addEx=function(ex){if(ex)for(const e of ex){for(const p of e.outer)this.add(p);for(const h of e.holes)for(const p of h)this.add(p)}};
  /* points (other than a and b) lying on segment a-b, as [t, point] sorted along it */
  PointIndex.prototype.onSeg=function(a,b){
    const dx=b.X-a.X,dy=b.Y-a.Y,L2=dx*dx+dy*dy;if(!L2)return [];
    const L=Math.sqrt(L2),out=[];
    const gx0=Math.floor((Math.min(a.X,b.X)-3)/this.c),gx1=Math.floor((Math.max(a.X,b.X)+3)/this.c),gy0=Math.floor((Math.min(a.Y,b.Y)-3)/this.c),gy1=Math.floor((Math.max(a.Y,b.Y)+3)/this.c);
    const test=p=>{if((p.X===a.X&&p.Y===a.Y)||(p.X===b.X&&p.Y===b.Y))return;const t=((p.X-a.X)*dx+(p.Y-a.Y)*dy)/L2;if(t<=1e-9||t>=1-1e-9)return;if(Math.abs((p.X-a.X)*dy-(p.Y-a.Y)*dx)/L>2.5)return;out.push([t,p])};
    if((gx1-gx0+1)*(gy1-gy0+1)>4000){for(const p of this.all)test(p)}
    else for(let gx=gx0;gx<=gx1;gx++)for(let gy=gy0;gy<=gy1;gy++){const bk=this.m.get(gx+','+gy);if(bk)for(const p of bk)test(p)}
    out.sort((u,v)=>u[0]-v[0]);
    return out;
  }
  function splitRing(r,idx){const o=[];for(let i=0;i<r.length;i++){const a=r[i],b=r[(i+1)%r.length];o.push(a);for(const [,p] of idx.onSeg(a,b))o.push(p)}return o}

  function tile(ex){
    const out=[];
    for(const e of ex){
      let n=e.outer.length;for(const h of e.holes)n+=h.length;
      if(e.holes.length<300){out.push(e);continue}
      let x0=1e18,x1=-1e18,y0=1e18,y1=-1e18;for(const p of e.outer){x0=Math.min(x0,p.X);x1=Math.max(x1,p.X);y0=Math.min(y0,p.Y);y1=Math.max(y1,p.Y)}
      const k=Math.max(2,Math.ceil(Math.sqrt(e.holes.length/150))),tx=(x1-x0)/k,ty=(y1-y0)/k;
      const hb=e.holes.map(h=>{let a=1e18,b=-1e18,c=1e18,d=-1e18;for(const p of h){a=Math.min(a,p.X);b=Math.max(b,p.X);c=Math.min(c,p.Y);d=Math.max(d,p.Y)}return [a,b,c,d]});
      for(let i=0;i<k;i++)for(let j=0;j<k;j++){
        const r=[{X:Math.round(x0+i*tx)-(i?0:1),Y:Math.round(y0+j*ty)-(j?0:1)},{X:Math.round(x0+(i+1)*tx)+(i===k-1?1:0),Y:Math.round(y0+j*ty)-(j?0:1)},{X:Math.round(x0+(i+1)*tx)+(i===k-1?1:0),Y:Math.round(y0+(j+1)*ty)+(j===k-1?1:0)},{X:Math.round(x0+i*tx)-(i?0:1),Y:Math.round(y0+(j+1)*ty)+(j===k-1?1:0)}];
        const rx0=r[0].X,rx1=r[1].X,ry0=r[0].Y,ry1=r[2].Y,near=e.holes.filter((h,hi)=>{const bb=hb[hi];return bb[1]>=rx0&&bb[0]<=rx1&&bb[3]>=ry0&&bb[2]<=ry1});
        const c=new CL.Clipper();c.AddPaths([e.outer,...near],CL.PolyType.ptSubject,true);c.AddPath(r,CL.PolyType.ptClip,true);
        const t=new CL.PolyTree();c.Execute(CL.ClipType.ctIntersection,t,CL.PolyFillType.pftNonZero,CL.PolyFillType.pftNonZero);
        out.push(...CL.JS.PolyTreeToExPolygons(t).filter(q=>q.outer.length>2));
      }
    }
    return out;
  }
  function build(features){
    const Z=new Set();
    /* heights snap to 0.01 mm, so features that nearly line up share a level instead of leaving a sliver */
    const qz=v=>Math.round(v*100)/100;
    for(const f of features){if(!(f.z1>f.z0))continue;Z.add(qz(f.z0));Z.add(qz(f.z1));if(f.fn){const n=Math.max(1,Math.ceil((f.z1-f.z0)/f.dz));for(let i=1;i<n;i++)Z.add(qz(f.z0+(f.z1-f.z0)*i/n))}}
    const zs=[...Z].sort((a,b)=>a-b);
    /* slabs, merging neighbours with the same outline */
    const slabs=[];
    for(let i=0;i<zs.length-1;i++){
      const ex=region(features,(zs[i]+zs[i+1])/2),s=sig(ex),last=slabs[slabs.length-1];
      if(last&&last.z1===zs[i]&&last.s===s&&ex){last.z1=zs[i+1];continue}
      if(ex)slabs.push({z0:zs[i],z1:zs[i+1],ex,s});
    }
    const out=[];let vol=0;
    const pushTri=(a,za,b,zb,c,zc)=>{out.push(a.X/SC,a.Y/SC,za,b.X/SC,b.Y/SC,zb,c.X/SC,c.Y/SC,zc)};
    /* interfaces: every height where the outline above differs from the one below */
    const levels=[];
    for(let i=0;i<slabs.length;i++){
      const s=slabs[i],prev=slabs[i-1];
      if(!prev||prev.z1!==s.z0)levels.push({z:s.z0,below:null,above:s});
      else levels.push({z:s.z0,below:prev,above:s});
      const next=slabs[i+1];
      if(!next||next.z0!==s.z1)levels.push({z:s.z1,below:s,above:null});
    }
    for(const L of levels){
      const A=L.below?L.below.ex:null,B=L.above?L.above.ex:null;
      const up=A?boolEx(A,B,CL.ClipType.ctDifference):[],down=B?boolEx(B,A,CL.ClipType.ctDifference):[];
      /* big caps full of holes (a mesh lid) are cut into tiles first: earcut slows down sharply with many holes */
      const upT=tile(up),downT=tile(down);
      const idx=new PointIndex(2000);idx.addEx(A);idx.addEx(B);idx.addEx(upT);idx.addEx(downT);
      L.idx=idx;
      if(L.below)L.below.top=idx;if(L.above)L.above.bot=idx;
      for(const [set,upward] of [[upT,true],[downT,false]])for(const e of set){
        const rings=[e.outer,...e.holes].map(r=>splitRing(r,idx)),flat=[],holes=[],pts=[];
        for(const r of rings){if(pts.length)holes.push(pts.length);for(const p of r){flat.push(p.X,p.Y);pts.push(p)}}
        const tri=EC(flat,holes);
        /* earcut winds all its triangles the same way; flat ones (three points in a line) are kept, since they close the seams */
        let sum=0;for(let t=0;t<tri.length;t+=3){const a=pts[tri[t]],b=pts[tri[t+1]],c=pts[tri[t+2]];sum+=(b.X-a.X)*(c.Y-a.Y)-(b.Y-a.Y)*(c.X-a.X)}
        const keep=(sum>0)===upward;
        for(let t=0;t<tri.length;t+=3){
          let a=pts[tri[t]],b=pts[tri[t+1]],c=pts[tri[t+2]];
          if(!keep){const x=b;b=c;c=x}
          /* earcut drops points that sit in a straight line; put them back so no edge has a vertex in its middle */
          const ab=idx.onSeg(a,b),bc=idx.onSeg(b,c),ca=idx.onSeg(c,a);
          if(!ab.length&&!bc.length&&!ca.length){pushTri(a,L.z,b,L.z,c,L.z);continue}
          const ring=[a,...ab.map(q=>q[1]),b,...bc.map(q=>q[1]),c,...ca.map(q=>q[1])];
          const m={X:(a.X+b.X+c.X)/3,Y:(a.Y+b.Y+c.Y)/3};
          for(let i=0;i<ring.length;i++)pushTri(m,L.z,ring[i],L.z,ring[(i+1)%ring.length],L.z);
        }
      }
    }
    for(const s of slabs){
      for(const e of s.ex){
        vol+=(CL.JS.AreaOfPolygons([e.outer,...e.holes])/SC/SC)*(s.z1-s.z0);
        for(const r of [e.outer,...e.holes]){
          for(let i=0;i<r.length;i++){
            const a=r[i],b=r[(i+1)%r.length];
            const B=[[0,a],...s.bot.onSeg(a,b),[1,b]],T=[[0,a],...s.top.onSeg(a,b),[1,b]];
            let bi=0,ti=0;
            while(bi<B.length-1||ti<T.length-1){
              if(ti>=T.length-1||(bi<B.length-1&&B[bi+1][0]<=T[ti+1][0])){pushTri(B[bi][1],s.z0,B[bi+1][1],s.z0,T[ti][1],s.z1);bi++}
              else{pushTri(B[bi][1],s.z0,T[ti+1][1],s.z1,T[ti][1],s.z1);ti++}
            }
          }
        }
      }
    }
    return {tris:weld(out),vol:Math.abs(vol)};
  }
  /* a solid on a curved grid: us (around, optionally wrapping), vs (through), ws (up); keep(i,j,k) says which cells are
     solid; map(u,v,w) gives the point. Faces sit only between solid and empty cells, so the mesh is closed. */
  function gridMesh(us,vs,ws,keep,map,wrap){
    const nu=us.length-1,nv=vs.length-1,nw=ws.length-1,K=new Uint8Array(nu*nv*nw),id=(i,j,k)=>(k*nv+j)*nu+i;
    let vol=0;for(let k=0;k<nw;k++)for(let j=0;j<nv;j++)for(let i=0;i<nu;i++)if(keep(i,j,k))K[id(i,j,k)]=1;
    const P=(i,j,k)=>map(us[wrap&&i===nu?0:i]===undefined?us[0]:us[i],vs[j],ws[k]);
    const cache=new Map(),pt=(i,j,k)=>{if(wrap&&i===nu)i=0;const key=i+','+j+','+k;let q=cache.get(key);if(!q){q=map(us[i],vs[j],ws[k]);cache.set(key,q)}return q};
    const at=(i,j,k)=>{if(wrap){i=(i+nu)%nu}else if(i<0||i>=nu)return false;return j>=0&&k>=0&&j<nv&&k<nw&&K[id(i,j,k)]===1};
    const out=[],quad=(a,b,c,d)=>{out.push(...a,...b,...c,...a,...c,...d)};
    for(let k=0;k<nw;k++)for(let j=0;j<nv;j++)for(let i=0;i<nu;i++){
      if(!K[id(i,j,k)])continue;
      const p=(di,dj,dk)=>pt(i+di,j+dj,k+dk);
      if(!at(i+1,j,k))quad(p(1,0,0),p(1,1,0),p(1,1,1),p(1,0,1));
      if(!at(i-1,j,k))quad(p(0,0,0),p(0,0,1),p(0,1,1),p(0,1,0));
      if(!at(i,j+1,k))quad(p(0,1,0),p(0,1,1),p(1,1,1),p(1,1,0));
      if(!at(i,j-1,k))quad(p(0,0,0),p(1,0,0),p(1,0,1),p(0,0,1));
      if(!at(i,j,k+1))quad(p(0,0,1),p(1,0,1),p(1,1,1),p(0,1,1));
      if(!at(i,j,k-1))quad(p(0,0,0),p(0,1,0),p(1,1,0),p(1,0,0));
    }
    let t=new Float32Array(out),sv=0;
    for(let i=0;i<t.length;i+=9){const [ax,ay,az,bx,by,bz,cx,cy,cz]=t.subarray(i,i+9);sv+=(ax*(by*cz-bz*cy)-ay*(bx*cz-bz*cx)+az*(bx*cy-by*cx))/6}
    if(sv<0)for(let i=0;i<t.length;i+=9)for(let a=0;a<3;a++){const x=t[i+3+a];t[i+3+a]=t[i+6+a];t[i+6+a]=x}
    return {tris:t,vol:Math.abs(sv)};
  }
  /* merge vertices closer than 3 micrometres and drop the slivers that collapse, so near-coincident edges meet */
  function weld(out){
    const cell=.01,eps2=.003*.003,grid=new Map(),reps=[],res=[];
    const rep=(x,y,z)=>{const gx=Math.floor(x/cell),gy=Math.floor(y/cell),gz=Math.floor(z/cell);
      for(let a=-1;a<=1;a++)for(let b=-1;b<=1;b++)for(let c=-1;c<=1;c++){const l=grid.get((gx+a)+','+(gy+b)+','+(gz+c));if(l)for(const i of l){const q=reps[i];if((q[0]-x)**2+(q[1]-y)**2+(q[2]-z)**2<eps2)return i}}
      const i=reps.length;reps.push([x,y,z]);const k=gx+','+gy+','+gz;let l=grid.get(k);if(!l)grid.set(k,l=[]);l.push(i);return i};
    for(let i=0;i<out.length;i+=9){
      const a=rep(out[i],out[i+1],out[i+2]),b=rep(out[i+3],out[i+4],out[i+5]),c=rep(out[i+6],out[i+7],out[i+8]);
      if(a===b||b===c||a===c)continue;
      res.push(...reps[a],...reps[b],...reps[c]);
    }
    return new Float32Array(res);
  }
  root.Geo={gridMesh,inside,area,stroke,slice,ellipse,circle,rect,rrect,ngon,polar,wobble,move,scale,offset,intersect,subtract,unite,prism,varying,yDisc,xDisc,build};
  if(typeof module!=='undefined')module.exports=root.Geo;
})(typeof window!=='undefined'?window:globalThis);
