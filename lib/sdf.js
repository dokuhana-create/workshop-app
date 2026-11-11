/* Sdf: a small sculpting modeller for organic, lifelike pieces (a skull, a bat, a raven).
   A shape is a function f(x,y,z) that is below zero inside and above zero outside, built from blobs that melt into
   each other (smooth union) or are carved away (smooth subtraction). The field is sampled on a grid and turned into
   triangles with marching tetrahedra: every grid edge gets at most one point, shared by all its neighbours, so the
   mesh is always closed (watertight).
   For printing without supports, the field is filled from the top down: each layer must sit inside the layer above
   grown by one layer height, which turns every overhang into a 45° slope. Bits that would start in mid air are
   removed layer by layer from the bottom up. */
(function(root){
  const {sqrt,abs,min,max,floor,cos,sin}=Math;
  const clamp=(v,a,b)=>v<a?a:v>b?b:v,mix=(a,b,t)=>a+(b-a)*t;

  /* ---------- shapes ---------- */
  const sphere=(cx,cy,cz,r)=>(x,y,z)=>sqrt((x-cx)**2+(y-cy)**2+(z-cz)**2)-r;
  /* a close approximation of an ellipsoid's distance */
  const ellipsoid=(cx,cy,cz,rx,ry,rz)=>(x,y,z)=>{const a=(x-cx)/rx,b=(y-cy)/ry,c=(z-cz)/rz,k0=sqrt(a*a+b*b+c*c);
    if(k0<1e-9)return -min(rx,ry,rz);const k1=sqrt((a/rx)**2+(b/ry)**2+(c/rz)**2);return k0*(k0-1)/k1};
  /* a rod from a to b whose radius goes from ra to rb */
  function rod(a,b,ra,rb){rb=rb??ra;const [ax,ay,az]=a,bx=b[0]-ax,by=b[1]-ay,bz=b[2]-az,L2=bx*bx+by*by+bz*bz||1e-9;
    return (x,y,z)=>{const px=x-ax,py=y-ay,pz=z-az,t=clamp((px*bx+py*by+pz*bz)/L2,0,1),dx=px-bx*t,dy=py-by*t,dz=pz-bz*t;return sqrt(dx*dx+dy*dy+dz*dz)-mix(ra,rb,t)}}
  /* a chain of rods through points, with a radius at each point */
  const chain=(pts,rs,k)=>smooth(k||Math.min(...rs)*.5,...pts.slice(1).map((p,i)=>rod(pts[i],p,rs[i],rs[i+1])));
  const box=(cx,cy,cz,hx,hy,hz,r)=>{r=r||0;return (x,y,z)=>{const qx=abs(x-cx)-hx+r,qy=abs(y-cy)-hy+r,qz=abs(z-cz)-hz+r;
    return sqrt(max(qx,0)**2+max(qy,0)**2+max(qz,0)**2)+min(max(qx,qy,qz),0)-r}};
  const cylZ=(cx,cy,r,z0,z1)=>(x,y,z)=>{const d=sqrt((x-cx)**2+(y-cy)**2)-r,h=max(z0-z,z-z1);return max(d,0)>0&&h>0?sqrt(d*d+h*h):max(d,h)};
  const plane=(nx,ny,nz,d)=>(x,y,z)=>x*nx+y*ny+z*nz-d;
  /* a flat 2D outline (rings of [x,y]) made into a slab between z0 and z1 with rounded edges */
  function poly2(rings){const segs=[];for(const r of rings)for(let i=0;i<r.length;i++)segs.push([r[i],r[(i+1)%r.length]]);
    let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;for(const r of rings)for(const [x,y] of r){x0=min(x0,x);y0=min(y0,y);x1=max(x1,x);y1=max(y1,y)}
    return {bb:[x0,y0,x1,y1],d:(x,y)=>{let d=1e9,ins=false;for(const [[ax,ay],[bx,by]] of segs){
      if((ay>y)!==(by>y)&&x<(bx-ax)*(y-ay)/(by-ay)+ax)ins=!ins;
      const ex=bx-ax,ey=by-ay,t=clamp(((x-ax)*ex+(y-ay)*ey)/(ex*ex+ey*ey||1e-9),0,1),qx=x-ax-ex*t,qy=y-ay-ey*t,q=qx*qx+qy*qy;if(q<d)d=q}
      return ins?-sqrt(d):sqrt(d)}}}
  /* the outline's 2D distance is worked out once on a fine raster and looked up after that */
  function raster2(P,n){const [x0,y0,x1,y1]=P.bb,m=max(x1-x0,y1-y0)*.08,X0=x0-m,Y0=y0-m,sx=(x1-x0+2*m)/n,sy=(y1-y0+2*m)/n,g=new Float32Array((n+1)*(n+1));
    for(let j=0;j<=n;j++)for(let i=0;i<=n;i++)g[j*(n+1)+i]=P.d(X0+i*sx,Y0+j*sy);
    return (x,y)=>{const u=(x-X0)/sx,v=(y-Y0)/sy;if(u<0||v<0||u>=n||v>=n)return P.d(x,y);const i=floor(u),j=floor(v),a=u-i,b=v-j,q=j*(n+1)+i;
      return (g[q]*(1-a)+g[q+1]*a)*(1-b)+(g[q+n+1]*(1-a)+g[q+n+2]*a)*b}}
  function slab(rings,z0,z1,round,res){const P=poly2(rings),[bx0,by0,bx1,by1]=P.bb,r=round||0,D=raster2(P,res||320);
    return (x,y,z)=>{const far=max(bx0-x,x-bx1,by0-y,y-by1);if(far>2)return far;const d=D(x,y)+r,h=max(z0+r-z,z-z1+r);
      return (d>0&&h>0?sqrt(d*d+h*h):max(d,h))-r}}

  /* ---------- combining ---------- */
  const union=(...fs)=>(x,y,z)=>{let d=1e9;for(const f of fs){const v=f(x,y,z);if(v<d)d=v}return d};
  const smin=(a,b,k)=>{const h=clamp(.5+.5*(b-a)/k,0,1);return mix(b,a,h)-k*h*(1-h)};
  const smooth=(k,...fs)=>(x,y,z)=>{let d=fs[0](x,y,z);for(let i=1;i<fs.length;i++)d=smin(d,fs[i](x,y,z),k);return d};
  const cut=(f,...gs)=>(x,y,z)=>{let d=f(x,y,z);for(const g of gs)d=max(d,-g(x,y,z));return d};
  const scut=(k,f,...gs)=>(x,y,z)=>{let d=f(x,y,z);for(const g of gs)d=-smin(-d,g(x,y,z),k);return d};
  const both=(...fs)=>(x,y,z)=>{let d=-1e9;for(const f of fs){const v=f(x,y,z);if(v>d)d=v}return d};
  const mirrorX=f=>(x,y,z)=>f(abs(x),y,z);
  const move=(f,dx,dy,dz)=>(x,y,z)=>f(x-dx,y-dy,z-dz);
  /* turn about an axis through a point (angle in radians) */
  const turnZ=(f,a,cx,cy)=>{const c=cos(-a),s=sin(-a);cx=cx||0;cy=cy||0;return (x,y,z)=>{const dx=x-cx,dy=y-cy;return f(cx+dx*c-dy*s,cy+dx*s+dy*c,z)}};
  const turnX=(f,a,cy,cz)=>{const c=cos(-a),s=sin(-a);cy=cy||0;cz=cz||0;return (x,y,z)=>{const dy=y-cy,dz=z-cz;return f(x,cy+dy*c-dz*s,cz+dy*s+dz*c)}};
  const turnY=(f,a,cx,cz)=>{const c=cos(-a),s=sin(-a);cx=cx||0;cz=cz||0;return (x,y,z)=>{const dz=z-cz,dx=x-cx;return f(cx+dz*s+dx*c,y,cz+dz*c-dx*s)}};
  /* only where a box is: outside it the field is left alone (speeds up small details on big pieces) */
  const near=(f,x0,y0,z0,x1,y1,z1)=>(x,y,z)=>{const o=max(x0-x,x-x1,y0-y,y-y1,z0-z,z-z1);return o>0?o+.01:f(x,y,z)};

  /* ---------- surface detail ---------- */
  function hash(i,j,k,s){let h=(i*374761393+j*668265263+k*2147483647+s*1274126177)|0;h=(h^(h>>>13))*1274126177|0;return ((h^(h>>>16))>>>0)/4294967295}
  function noise(x,y,z,s){const i=floor(x),j=floor(y),k=floor(z),fx=x-i,fy=y-j,fz=z-k,u=fx*fx*(3-2*fx),v=fy*fy*(3-2*fy),w=fz*fz*(3-2*fz);
    const c=(a,b,d)=>hash(i+a,j+b,k+d,s||0);
    return mix(mix(mix(c(0,0,0),c(1,0,0),u),mix(c(0,1,0),c(1,1,0),u),v),mix(mix(c(0,0,1),c(1,0,1),u),mix(c(0,1,1),c(1,1,1),u),v),w)*2-1}
  const fbm=(x,y,z,s,oct)=>{let a=0,f=1,w=.5;for(let o=0;o<(oct||3);o++){a+=w*noise(x*f,y*f,z*f,(s||0)+o*17);f*=2.03;w*=.5}return a};
  /* roughen a surface: amp in mm, size of the bumps in mm */
  const rough=(f,amp,size,seed,oct)=>(x,y,z)=>{const d=f(x,y,z);return abs(d)>amp*3?d:d+amp*fbm(x/size,y/size,z/size,seed||0,oct)};

  /* ---------- meshing ---------- */
  /* signed distance across one layer (in grid cells), from a solid/empty mask: Felzenszwalb's exact transform */
  function edt1(f,n,d,v,z){let k=0;v[0]=0;z[0]=-1e20;z[1]=1e20;
    const S=(q,p)=>((f[q]+q*q)-(f[p]+p*p))/(2*q-2*p);
    for(let q=1;q<n;q++){let s=S(q,v[k]);while(s<=z[k]){k--;s=S(q,v[k])}k++;v[k]=q;z[k]=s;z[k+1]=1e20}
    k=0;for(let q=0;q<n;q++){while(z[k+1]<q)k++;d[q]=(q-v[k])**2+f[v[k]]}}
  function dist2(mask,nx,ny,want){const INF=1e12,g=new Float64Array(nx*ny),n=max(nx,ny),f=new Float64Array(n),d=new Float64Array(n),v=new Int32Array(n),z=new Float64Array(n+1);
    for(let i=0;i<nx*ny;i++)g[i]=mask[i]===want?0:INF;
    for(let x=0;x<nx;x++){for(let y=0;y<ny;y++)f[y]=g[y*nx+x];edt1(f,ny,d,v,z);for(let y=0;y<ny;y++)g[y*nx+x]=d[y]}
    for(let y=0;y<ny;y++){for(let x=0;x<nx;x++)f[x]=g[y*nx+x];edt1(f,nx,d,v,z);for(let x=0;x<nx;x++)g[y*nx+x]=sqrt(d[x])}
    return g}

  /* simplify a closed mesh by collapsing short edges where the surface is flat enough (quadric error), never letting
     a triangle flip or the surface pinch, so it stays closed. pts: [x,y,z,...], tri: [a,b,c,...] (indices). */
  function simplify(pts,tri,tol,keepFrac){
    const nv=pts.length/3,nf=tri.length/3,P=Float64Array.from(pts),T=Int32Array.from(tri),dead=new Uint8Array(nf),Q=new Float64Array(nv*10),stamp=new Uint32Array(nv),gone=new Uint8Array(nv);
    const vf=Array.from({length:nv},()=>[]);for(let f=0;f<nf;f++)for(let k=0;k<3;k++)vf[T[f*3+k]].push(f);
    const nrm=(a,b,c,o)=>{const ux=P[b*3]-P[a*3],uy=P[b*3+1]-P[a*3+1],uz=P[b*3+2]-P[a*3+2],vx=P[c*3]-P[a*3],vy=P[c*3+1]-P[a*3+1],vz=P[c*3+2]-P[a*3+2];
      o[0]=uy*vz-uz*vy;o[1]=uz*vx-ux*vz;o[2]=ux*vy-uy*vx;return Math.hypot(o[0],o[1],o[2])};
    const n=[0,0,0];
    for(let f=0;f<nf;f++){const a=T[f*3],b=T[f*3+1],c=T[f*3+2],l=nrm(a,b,c,n);if(l<1e-12)continue;const A=n[0]/l,B=n[1]/l,C=n[2]/l,D=-(A*P[a*3]+B*P[a*3+1]+C*P[a*3+2]),w=l/2;
      const q=[A*A,A*B,A*C,A*D,B*B,B*C,B*D,C*C,C*D,D*D];for(const v of [a,b,c])for(let i=0;i<10;i++)Q[v*10+i]+=q[i]*w}
    const err=(v,x,y,z)=>{const q=v*10;return Q[q]*x*x+2*Q[q+1]*x*y+2*Q[q+2]*x*z+2*Q[q+3]*x+Q[q+4]*y*y+2*Q[q+5]*y*z+2*Q[q+6]*y+Q[q+7]*z*z+2*Q[q+8]*z+Q[q+9]};
    /* a flat bed: a point on z=0 never leaves it */
    const onBed=v=>Math.abs(P[v*3+2])<1e-6;
    const cost=(u,v)=>{const cu=onBed(v)&&!onBed(u)?1e30:err(u,P[u*3],P[u*3+1],P[u*3+2])+err(v,P[u*3],P[u*3+1],P[u*3+2]),cv=onBed(u)&&!onBed(v)?1e30:err(u,P[v*3],P[v*3+1],P[v*3+2])+err(v,P[v*3],P[v*3+1],P[v*3+2]);
      return cu<=cv?[cu,u,v]:[cv,v,u]};
    /* a binary heap of candidate collapses, in flat growable arrays */
    let cap=1<<20,HC=new Float64Array(cap),HK=new Int32Array(cap),HD=new Int32Array(cap),HS=new Uint32Array(cap),HT=new Uint32Array(cap),hn=0;
    const grow=()=>{cap*=2;for(const nm of ['HC','HK','HD','HS','HT']){}const c=new Float64Array(cap);c.set(HC);HC=c;const k=new Int32Array(cap);k.set(HK);HK=k;const d=new Int32Array(cap);d.set(HD);HD=d;const s1=new Uint32Array(cap);s1.set(HS);HS=s1;const t1=new Uint32Array(cap);t1.set(HT);HT=t1};
    const sw=(i,j)=>{let t=HC[i];HC[i]=HC[j];HC[j]=t;t=HK[i];HK[i]=HK[j];HK[j]=t;t=HD[i];HD[i]=HD[j];HD[j]=t;t=HS[i];HS[i]=HS[j];HS[j]=t;t=HT[i];HT[i]=HT[j];HT[j]=t};
    const push=(c,k,d)=>{if(hn===cap)grow();let i=hn++;HC[i]=c;HK[i]=k;HD[i]=d;HS[i]=stamp[k];HT[i]=stamp[d];while(i){const p=(i-1)>>1;if(HC[p]<=HC[i])break;sw(p,i);i=p}};
    const pop=()=>{hn--;if(hn){sw(0,hn);let i=0;for(;;){const l=2*i+1,r=l+1;let m=i;if(l<hn&&HC[l]<HC[m])m=l;if(r<hn&&HC[r]<HC[m])m=r;if(m===i)break;sw(m,i);i=m}}return hn};
    const addEdges=(v,once)=>{const seen=new Set();for(const f of vf[v]){if(dead[f])continue;for(let k=0;k<3;k++){const w=T[f*3+k];if(w===v||seen.has(w))continue;seen.add(w);if(w<v&&!once)continue;const [c,keep,drop]=cost(v,w);if(c<tol*tol)push(c,keep,drop)}}};
    for(let v=0;v<nv;v++)addEdges(v,false);
    let alive=nf,gen=1;const mk=new Uint32Array(nv);const target=Math.round(nf*(keepFrac||.2)),m=[0,0,0];
    const nbr=v=>{const s=new Set();for(const f of vf[v])if(!dead[f])for(let k=0;k<3;k++)s.add(T[f*3+k]);s.delete(v);return s};
    while(hn&&alive>target){
      const e=pop(),keep=HK[e],drop=HD[e],sk=HS[e],sd=HT[e];if(gone[keep]||gone[drop]||stamp[keep]!==sk||stamp[drop]!==sd)continue;
      /* the two must share exactly the two triangles on their edge, and exactly those two neighbours */
      const shared=vf[drop].filter(f=>!dead[f]&&(T[f*3]===keep||T[f*3+1]===keep||T[f*3+2]===keep));if(shared.length!==2)continue;
      gen++;let nk=0,nd=0,common=0;for(const f of vf[keep])if(!dead[f])for(let q=0;q<3;q++){const w=T[f*3+q];if(w!==keep&&mk[w]!==gen){mk[w]=gen;nk++}}
      gen++;for(const f of vf[drop])if(!dead[f])for(let q=0;q<3;q++){const w=T[f*3+q];if(w!==drop&&mk[w]!==gen){if(mk[w]===gen-1)common++;mk[w]=gen;nd++}}
      gen++;if(common!==2||nk+nd<8||nk+nd>36)continue;
      /* no triangle around the dropped point may flip or get too thin */
      let ok=true;const px=P[keep*3],py=P[keep*3+1],pz=P[keep*3+2];
      for(const f of vf[drop]){if(dead[f]||shared.includes(f))continue;const i=f*3,a=T[i],b=T[i+1],cc=T[i+2];
        const l0=nrm(a,b,cc,n);const n0=[n[0],n[1],n[2]];
        const qx=P[drop*3],qy=P[drop*3+1],qz=P[drop*3+2];P[drop*3]=px;P[drop*3+1]=py;P[drop*3+2]=pz;const l1=nrm(a,b,cc,m);P[drop*3]=qx;P[drop*3+1]=qy;P[drop*3+2]=qz;
        if(l1<1e-9||(n0[0]*m[0]+n0[1]*m[1]+n0[2]*m[2])<.5*l0*l1){ok=false;break}}
      if(!ok)continue;
      for(const f of shared){dead[f]=1;alive--}
      for(const f of vf[drop]){if(dead[f])continue;for(let k=0;k<3;k++)if(T[f*3+k]===drop)T[f*3+k]=keep;vf[keep].push(f)}
      vf[keep]=vf[keep].filter(f=>!dead[f]);gone[drop]=1;vf[drop]=[];
      for(let i=0;i<10;i++)Q[keep*10+i]+=Q[drop*10+i];stamp[keep]++;
      addEdges(keep,true)}
    const outT=[];for(let f=0;f<nf;f++)if(!dead[f])outT.push(T[f*3],T[f*3+1],T[f*3+2]);
    return {pts:P,tri:outT};
  }
  /* the 6 tetrahedra of a cube (corner bits: x=1, y=2, z=4), all sharing the main diagonal 0-7 */
  const TETS=[[0,1,3,7],[0,1,5,7],[0,2,3,7],[0,2,6,7],[0,4,5,7],[0,4,6,7]];
  /* f: the shape; b: [x0,y0,x1,y1,z1] (the bottom is always z=0, the print bed); h: grid step in mm.
     opt.print: fill overhangs to 45° and drop floating bits (default true) */
  function mesh(f,b,h,opt){
    opt=opt||{};const print=opt.print!==false;
    const [x0,y0,x1,y1,z1]=b,nx=Math.ceil((x1-x0)/h)+3,ny=Math.ceil((y1-y0)/h)+3,nz=Math.ceil(z1/h)+3,ox=x0-h,oy=y0-h,oz=-h/2,L=nx*ny;
    const F=new Float32Array(L*nz),NT=L*nz;
    /* a coarse pass first: far from the surface the value is close enough, so only a thin band is worked out exactly */
    const c=4,cx=Math.ceil((nx-1)/c)+1,cyn=Math.ceil((ny-1)/c)+1,cz=Math.ceil((nz-1)/c)+1,CF=new Float32Array(cx*cyn*cz),band=c*h*.9+h*1.5;
    for(let k=0;k<cz;k++)for(let j=0;j<cyn;j++)for(let i=0;i<cx;i++){const z=oz+min(k*c,nz-1)*h;CF[(k*cyn+j)*cx+i]=max(f(ox+min(i*c,nx-1)*h,oy+min(j*c,ny-1)*h,z),-z)}
    for(let k=0;k<nz;k++){const z=oz+k*h,kc=min(cz-1,Math.round(k/c));for(let j=0;j<ny;j++){const y=oy+j*h,jc=min(cyn-1,Math.round(j/c));for(let i=0;i<nx;i++){
      let v;if(k===0)v=h/2;else if(i===0||j===0||i===nx-1||j===ny-1||k===nz-1)v=h;
      else{const cv=CF[(kc*cyn+jc)*cx+min(cx-1,Math.round(i/c))];v=abs(cv)>band?cv:max(f(ox+i*h,y,z),-z)}
      F[k*L+j*nx+i]=v}}}
    if(print){
      /* top down: a layer may reach out at most one step beyond the layer above (45°) */
      const m=new Uint8Array(L),lab0=new Int32Array(L),stk=new Int32Array(L),small=Math.max(2,Math.round((opt.tip||3)/(h*h)));let D=null;
      for(let k=nz-2;k>=1;k--){const o=k*L;
        if(D){for(let q=0;q<L;q++){const s=D[q]+h*.75;if(s<F[o+q])F[o+q]=s}
          /* a patch of the layer above that would end here in mid air goes straight down instead, as a thin stalk,
             until it reaches something (so the slope never starts from nothing) */
          lab0.fill(0);let nl=0;
          for(let q=0;q<L;q++){if(!m[q]||lab0[q])continue;nl++;let sp=0,sup=false,best=1e9;stk[sp++]=q;lab0[q]=nl;const cells=[];
            while(sp){const p=stk[--sp];cells.push(p);if(F[o+p]<0)sup=true;if(D[p]<best)best=D[p];const px=p%nx;
              for(const n of [px>0?p-1:-1,px<nx-1?p+1:-1,p-nx,p+nx])if(n>=0&&n<L&&m[n]&&!lab0[n]){lab0[n]=nl;stk[sp++]=n}}
            if(!sup&&cells.length>small)for(const p of cells)if(D[p]<=best+h*.6)F[o+p]=min(F[o+p],-h*.5)}}
        let any=false;for(let q=0;q<L;q++){m[q]=F[o+q]<0?1:0;if(m[q])any=true}
        if(!any){D=null;continue}
        const din=dist2(m,nx,ny,0),dout=dist2(m,nx,ny,1);D=new Float32Array(L);
        for(let q=0;q<L;q++)D[q]=m[q]?-(din[q]-.5)*h:(dout[q]-.5)*h}
      if(opt.debug){const c=[];for(let k=0;k<nz;k++){let n=0;for(let q=0;q<L;q++)if(F[k*L+q]<0)n++;c.push(n)}console.log('after fill',c.join(' '))}
      /* bottom up: a patch that doesn't touch the layer below (or the bed) can't be printed */
      const keep=new Uint8Array(L),lab=new Int32Array(L),stack=new Int32Array(L);
      for(let k=1;k<nz-1;k++){const o=k*L;lab.fill(0);let nl=0;const ok=[0];
        for(let q=0;q<L;q++){if(F[o+q]>=0||lab[q])continue;nl++;let good=k===1||keep[q]===1,sp=0,cnt=0;stack[sp++]=q;lab[q]=nl;
          while(sp){const p=stack[--sp];cnt++;if(keep[p])good=true;const px=p%nx;
            for(const n of [px>0?p-1:-1,px<nx-1?p+1:-1,p-nx,p+nx])if(n>=0&&n<L&&!lab[n]&&F[o+n]<0){lab[n]=nl;stack[sp++]=n}}
          ok.push(good||cnt<=small?1:0)}
        for(let q=0;q<L;q++){if(F[o+q]<0&&!ok[lab[q]]){F[o+q]=h*.5}keep[q]=F[o+q]<0?1:0}}
    }
    if(opt.debug){const c=[];for(let k=0;k<nz;k++){let n=0;for(let q=0;q<L;q++)if(F[k*L+q]<0)n++;c.push(n)}console.log('after isl',c.join(' '))}
    /* the first layer sits exactly on the bed */
    for(let q=L;q<2*L;q++)if(F[q]<-h/2)F[q]=-h/2;
    /* marching tetrahedra */
    const pts=[],idx=new Map(),out=[];
    const P=(a,b)=>{const key=a<b?a*NT+b:b*NT+a;let r=idx.get(key);if(r!==undefined)return r;
      const va=F[a],vb=F[b],t=clamp(va/(va-vb),.02,.98),ka=floor(a/L),ra=a-ka*L,ja=floor(ra/nx),ia=ra-ja*nx,kb=floor(b/L),rb=b-kb*L,jb=floor(rb/nx),ib=rb-jb*nx;
      r=pts.length/3;pts.push(ox+mix(ia,ib,t)*h,oy+mix(ja,jb,t)*h,oz+mix(ka,kb,t)*h);idx.set(key,r);return r};
    const tri=(a,b,c,inside,outside)=>{const A=a*3,B=b*3,C=c*3,ux=pts[B]-pts[A],uy=pts[B+1]-pts[A+1],uz=pts[B+2]-pts[A+2],vx=pts[C]-pts[A],vy=pts[C+1]-pts[A+1],vz=pts[C+2]-pts[A+2];
      const nx_=uy*vz-uz*vy,ny_=uz*vx-ux*vz,nz_=ux*vy-uy*vx;
      let dx=0,dy=0,dz=0;for(const g of outside){dx+=g[0];dy+=g[1];dz+=g[2]}for(const g of inside){dx-=g[0]*outside.length/inside.length;dy-=g[1]*outside.length/inside.length;dz-=g[2]*outside.length/inside.length}
      if(nx_*dx+ny_*dy+nz_*dz<0)out.push(a,c,b);else out.push(a,b,c)};
    const cid=[0,0,0,0,0,0,0,0],cpos=[];for(let c=0;c<8;c++)cpos.push([c&1,(c>>1)&1,(c>>2)&1]);
    for(let k=0;k<nz-1;k++)for(let j=0;j<ny-1;j++)for(let i=0;i<nx-1;i++){
      const base=k*L+j*nx+i;let neg=0,pos=0;
      for(let c=0;c<8;c++){const q=base+(c&1)+((c>>1)&1)*nx+((c>>2)&1)*L;cid[c]=q;if(F[q]<0)neg++;else pos++}
      if(!neg||!pos)continue;
      for(const T of TETS){const ins=[],outs=[];for(const c of T)(F[cid[c]]<0?ins:outs).push(c);
        if(!ins.length||!outs.length)continue;
        const gp=c=>cpos[c],I=ins.map(gp),O=outs.map(gp);
        if(ins.length===1)tri(P(cid[ins[0]],cid[outs[0]]),P(cid[ins[0]],cid[outs[1]]),P(cid[ins[0]],cid[outs[2]]),I,O);
        else if(ins.length===3)tri(P(cid[outs[0]],cid[ins[0]]),P(cid[outs[0]],cid[ins[1]]),P(cid[outs[0]],cid[ins[2]]),I,O);
        else{const a=P(cid[ins[0]],cid[outs[0]]),b=P(cid[ins[0]],cid[outs[1]]),c=P(cid[ins[1]],cid[outs[1]]),d=P(cid[ins[1]],cid[outs[0]]);tri(a,b,c,I,O);tri(a,c,d,I,O)}}}
    /* drop specks: tiny separate shells left where two details nearly touch */
    {const par=new Int32Array(pts.length/3).map((_,i)=>i),find=x=>{while(par[x]!==x){par[x]=par[par[x]];x=par[x]}return x};
      for(let t=0;t<out.length;t+=3){const a=find(out[t]);par[find(out[t+1])]=a;par[find(out[t+2])]=a}
      const cnt=new Map();for(let t=0;t<out.length;t+=3){const r=find(out[t]);cnt.set(r,(cnt.get(r)||0)+1)}
      const big=Math.max(...cnt.values()),keep=[];
      for(let t=0;t<out.length;t+=3){const c=cnt.get(find(out[t]));if(c===big||c>Math.max(300,big*.01))keep.push(out[t],out[t+1],out[t+2])}
      out.length=0;for(const v of keep)out.push(v)}
    let PT=pts;if(opt.simplify!==false){const r=simplify(pts,out,opt.tol||Math.max(.012,h*.06),opt.keep||.12);PT=r.pts;out.length=0;for(const v of r.tri)out.push(v)}
    const tris=new Float32Array(out.length*3);let vol=0;
    for(let t=0;t<out.length;t+=3){const a=out[t]*3,b=out[t+1]*3,c=out[t+2]*3;
      for(let e=0;e<3;e++){tris[t*3+e]=PT[a+e];tris[t*3+3+e]=PT[b+e];tris[t*3+6+e]=PT[c+e]}
      vol+=(PT[a]*(PT[b+1]*PT[c+2]-PT[b+2]*PT[c+1])-PT[a+1]*(PT[b]*PT[c+2]-PT[b+2]*PT[c])+PT[a+2]*(PT[b]*PT[c+1]-PT[b+1]*PT[c]))/6}
    return {tris,vol:abs(vol)};
  }
  root.Sdf={sphere,ellipsoid,rod,chain,box,cylZ,plane,slab,poly2,union,smooth,smin,cut,scut,both,mirrorX,move,turnX,turnY,turnZ,near,noise,fbm,rough,mesh,clamp,mix};
})(typeof window!=='undefined'?window:globalThis);
