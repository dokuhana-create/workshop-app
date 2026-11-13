/* Habitat, frame trim in a style: a decorative front frame that sits in front of the enclosure (an arched or
   shaped window, filigree in the corners, a patterned base and an optional name), a crest above it, finials for the
   top corners and feet for the bottom corners. Everything prints without supports: the frame flat on its back,
   finials and feet standing up with every overhang at 45° or less. */
(function(root){
  const G=root.Geo,HP=root.HabitatParts,HM=root.HabitatMore,MO=root.HabitatMotifs,S=root.Sdf;
  const {rect,rrect,circle,ellipse,ngon,polar,move,offset,intersect,subtract,unite,stroke,prism,build,varying}=G;
  const {sin,cos,PI,min,max,abs,sqrt,round}=Math;
  const U=(...a)=>{let r=null;for(const x of a)if(x&&x.length)r=r?unite(r,x):x;return r||[]};
  const B=r=>HP.bounds(r);
  const rot=(rings,a,cx,cy)=>{const c=cos(a),s=sin(a);return rings.map(q=>q.map(([x,y])=>[cx+(x-cx)*c-(y-cy)*s,cy+(x-cx)*s+(y-cy)*c]))};
  const mirror=(rings,cx)=>rings.map(q=>q.map(([x,y])=>[2*cx-x,y]).reverse());
  function rnd(seed){let s=seed*9301+49297;return ()=>{s=(s*9301+49297)%233280;return s/233280}}
  const leaf=(x,y,l,w,a)=>rot(ellipse(x+l/2,y,l/2,w/2,24),a,x,y);
  const star=(cx,cy,r,k,inner)=>{const o=[];for(let i=0;i<k*2;i++){const a=PI/2+i*PI/k,rr=i%2?r*(inner||.45):r;o.push([cx+rr*cos(a),cy+rr*sin(a)])}return [o]};
  const spiral=(cx,cy,r,turns,dir,a0)=>{const o=[],n=Math.ceil(turns*24);for(let i=0;i<=n;i++){const t=i/n,a=(a0||0)+dir*t*turns*2*PI,rr=r*(1-t*.82);o.push([cx+rr*cos(a),cy+rr*sin(a)])}return o};
  const bez=(p0,p1,p2,p3,n)=>{const o=[];for(let i=0;i<=(n||24);i++){const t=i/(n||24),u=1-t;o.push([0,1].map(k=>u*u*u*p0[k]+3*u*u*t*p1[k]+3*u*t*t*p2[k]+t*t*t*p3[k]))}return o};

  const STYLES={
    gothic:{name:'Gothic',open:'pointed',stile:'quatrefoil',rail:'arcade',corner:'bat',crest:'gable',finial:'spire',foot:'claw'},
    baroque:{name:'Baroque filigree',open:'ogee',stile:'scroll',rail:'wave',corner:'curls',crest:'cartouche',finial:'urn',foot:'bun'},
    greek:{name:'Greek and Roman',open:'rect',stile:'flute',rail:'meander',corner:'laurel',crest:'pediment',finial:'urn',foot:'block'},
    vine:{name:'Woodland vines',open:'round',stile:'vine',rail:'leaves',corner:'rose',crest:'leafArch',finial:'acorn',foot:'root'},
    orchid:{name:'Orchid',open:'round',stile:'vine',rail:'leaves',corner:'orchid',crest:'orchidSpray',finial:'bud',foot:'bun'},
    nouveau:{name:'Art nouveau',open:'round',stile:'whiplash',rail:'whiplash',corner:'tulip',crest:'fan',finial:'bud',foot:'bun'},
    fantasy:{name:'Castle and dungeon',open:'round',stile:'stones',rail:'stones',corner:'dragon',crest:'battlement',finial:'crystal',foot:'claw',key:true},
    deco:{name:'Art deco',open:'stepped',stile:'lines',rail:'chevron',corner:'sunburst',crest:'ziggurat',finial:'stepped',foot:'block'},
    rustic:{name:'Rustic twig',open:'round',stile:'bark',rail:'bark',corner:'tree',crest:'branch',finial:'acorn',foot:'root'}
  };
  /* which frame goes with which style package */
  const FOR={orchid:'orchid',temple:'greek',gothic:'gothic',fantasy:'fantasy',forest:'vine',library:'baroque',geo:'deco'};
  const styleFor=theme=>FOR[root.HABITAT_THEME?root.HABITAT_THEME(theme):theme]||'baroque';

  /* ---------- the window ---------- */
  function opening(kind,x0,y0,x1,y1){
    const w=x1-x0,h=y1-y0,mid=(x0+x1)/2;
    if(kind==='rect')return rrect(x0,y0,x1,y1,4);
    if(kind==='moon')return ellipse(mid,(y0+y1)/2,w/2,h/2,160);
    if(kind==='stepped'){const s=min(w,h)*.06;return [[[x0,y0],[x1,y0],[x1,y1-3*s],[x1-s,y1-3*s],[x1-s,y1-2*s],[x1-2*s,y1-2*s],[x1-2*s,y1-s],[x1-3*s,y1-s],[x1-3*s,y1],
      [x0+3*s,y1],[x0+3*s,y1-s],[x0+2*s,y1-s],[x0+2*s,y1-2*s],[x0+s,y1-2*s],[x0+s,y1-3*s],[x0,y1-3*s]]]}
    if(kind==='ogee'){const A=min(.62*w,.4*h),ys=y1-A,r=bez([x1,ys],[x1,ys+A*.55],[mid+w*.03,y1-A*.42],[mid,y1],30);
      return [[[x0,y0],[x1,y0],...r,...r.slice(0,-1).reverse().map(([x,y])=>[2*mid-x,y])]]}
    /* pointed (gothic) or round arch */
    let A=kind==='pointed'?min(.74*w,.42*h):w/2;if(A<w/2)A=w/2;
    const r=(A*A+w*w/4)/w,ys=y1-A,th=Math.acos(max(-1,min(1,(r-w/2)/r))),pts=[[x0,y0],[x1,y0]];
    for(let i=0;i<=40;i++){const a=th*i/40;pts.push([x1-r+r*cos(a),ys+r*sin(a)])}
    for(let i=40;i>=0;i--){const a=PI-th*i/40;pts.push([x0+r+r*cos(a),ys+r*sin(a)])}
    return [pts.filter((p,i)=>i===0||abs(p[0]-pts[i-1][0])+abs(p[1]-pts[i-1][1])>1e-6)];
  }

  /* ---------- running patterns, laid along a strip ---------- */
  /* a vertical strip x0..x1, y0..y1 (the sides) or a horizontal one (the base) */
  function pattern(kind,x0,y0,x1,y1,lw,seed){
    const w=x1-x0,h=y1-y0,vert=h>w,L=vert?h:w,T=vert?w:h,R=rnd(seed||3);
    /* place a point given (along, across) */
    const P=(a,c)=>vert?[x0+c,y0+a]:[x0+a,y0+c];
    const line=pts=>pts.map(([a,c])=>P(a,c));
    if(kind==='quatrefoil'){const s=T*.8,n=max(1,Math.floor(L/(s*1.25))),g=(L-n*s)/(n+1),o=[];
      for(let i=0;i<n;i++){const [cx,cy]=P(g+s/2+i*(s+g),T/2),r=s/2;o.push(subtract(U(circle(cx-r*.45,cy,r*.5,32),circle(cx+r*.45,cy,r*.5,32),circle(cx,cy-r*.45,r*.5,32),circle(cx,cy+r*.45,r*.5,32)),
        U(circle(cx-r*.45,cy,r*.5-lw,32),circle(cx+r*.45,cy,r*.5-lw,32),circle(cx,cy-r*.45,r*.5-lw,32),circle(cx,cy+r*.45,r*.5-lw,32))))}return U(...o)}
    if(kind==='arcade'){const s=min(T*.7,22),n=max(1,round(L/s)),u=L/n,o=[];for(let i=0;i<n;i++){const a0=i*u+u*.12,a1=(i+1)*u-u*.12;
      const ar=opening('pointed',a0,T*.12,a1,T*.88)[0];o.push(stroke([[...ar.map(([a,c])=>P(a,c)).slice(1)]],lw))}return U(...o)}
    if(kind==='scroll'||kind==='wave'){const s=T*.9,n=max(1,round(L/s)),u=L/n,o=[];
      for(let i=0;i<n;i++){const d=i%2?1:-1,ca=i*u+u/2;o.push(line(spiral(0,0,T*.36,1.4,d,i%2?0:PI).map(([a,c])=>[ca+a,T/2+c])))}
      o.push(line([[0,T/2],[L,T/2]]).map(p=>p));
      return stroke(kind==='wave'?o.slice(0,-1):o,lw)}
    if(kind==='flute'){const o=[];for(const f of [.25,.5,.75])o.push(line([[T*.9,T*f],[L-T*.9,T*f]]));
      return U(stroke(o,lw*1.2),vert?U(rect(x0,y0,x1,y0+T*.5),rect(x0,y1-T*.5,x1,y1),rect(x0-1,y1-T*.9,x1+1,y1-T*.6)):[])}
    if(kind==='meander'){const u=T/4.4,n=max(1,Math.floor(L/(4*u))),off=(L-n*4*u)/2,o=[];
      for(let i=0;i<n;i++){const a=off+i*4*u,c0=(T-3.4*u)/2;o.push(line([[a,c0],[a,c0+3.4*u],[a+3*u,c0+3.4*u],[a+3*u,c0+u],[a+1.2*u,c0+u],[a+1.2*u,c0+2.2*u],[a+2*u,c0+2.2*u]]))}
      o.push(line([[off,(T-3.4*u)/2],[L-off,(T-3.4*u)/2]]));return stroke(o,lw)}
    if(kind==='vine'||kind==='leaves'){const n=max(2,round(L/(T*1.6))),pts=[],o=[];
      for(let i=0;i<=n*12;i++){const t=i/(n*12);pts.push([t*L,T/2+T*.28*sin(t*n*PI)])}
      o.push(stroke([line(pts)],lw));
      for(let i=0;i<n;i++){const t=(i+.5)/n,a=t*L,c=T/2+T*.28*sin(t*n*PI),[x,y]=P(a,c),ang=(vert?PI/2:0)+(i%2?.9:-.9)+(vert?0:0);
        o.push(leaf(x,y,T*.38,T*.17,ang+(i%2?0:PI)))}
      return U(...o)}
    if(kind==='whiplash'){const o=[];const n=max(1,round(L/(T*3)));for(let i=0;i<n;i++){const a0=i*L/n,a1=(i+1)*L/n;
      o.push(line(bez([a0,T*.2],[a0+(a1-a0)*.6,T*.95],[a0+(a1-a0)*.3,T*.05],[a1,T*.8],30)));o.push(line(spiral(0,0,T*.18,1.1,1,0).map(([a,c])=>[a1-(a1-a0)*.08+a,T*.78+c])))}
      return stroke(o,lw)}
    if(kind==='lattice'){const s=T/2.2,o=[];for(let a=s/2;a<L;a+=s)o.push(line([[a,0],[a,T]]));for(const c of [T*.22,T*.78])o.push(line([[0,c],[L,c]]));
      return intersect(stroke(o,lw),rect(x0,y0,x1,y1))}
    if(kind==='stars'){const o=[],n=max(2,round(L/(T*.7)));for(let i=0;i<n;i++){const a=(i+.5)*L/n,c=T*(.3+.4*R()),r=T*(.14+.14*R());const [x,y]=P(a,c);o.push(star(x,y,r,i%3?5:4,.42))}
      return U(...o)}
    if(kind==='stones'){const o=[],bh=T*.55,g=lw*.9;let row=0;for(let a=0;a<L;a+=bh){const sh=row++%2?bh*.6:0;for(let c=-sh;c<T;c+=bh*1.2){
      const q0=P(a+g/2,max(0,c)+g/2),q1=P(min(L,a+bh)-g/2,min(T,c+bh*1.2)-g/2);o.push(rrect(min(q0[0],q1[0]),min(q0[1],q1[1]),max(q0[0],q1[0]),max(q0[1],q1[1]),1.2))}}
      return U(...o)}
    if(kind==='lines'){const o=[];for(const f of [.2,.4,.6,.8])o.push(line([[0,T*f],[L,T*f]]));return stroke(o,lw*.8)}
    if(kind==='chevron'){const o=[],u=T*.7,n=max(1,round(L/u));for(const f of [.25,.6]){const p=[];for(let i=0;i<=n;i++)p.push([i*L/n,T*(f+(i%2?.25:0))]);o.push(line(p))}return stroke(o,lw)}
    if(kind==='bark'){const o=[];for(const f of [.2,.45,.7,.88]){const p=[];for(let i=0;i<=40;i++){const t=i/40;p.push([t*L,T*f+T*.05*sin(t*L/(T*.7)+f*9)])}o.push(line(p))}
      const k=[];for(let i=0;i<max(1,round(L/(T*2.5)));i++){const [x,y]=P((i+.5)*L/max(1,round(L/(T*2.5))),T*(.3+.4*R()));k.push(subtract(ellipse(x,y,T*.14,T*.2,24),ellipse(x,y,T*.14-lw,T*.2-lw,24)))}
      return U(stroke(o,lw*.8),...k)}
    return [];
  }

  /* corner ornaments for the space beside the top of the window */
  /* a moth orchid seen from the front: three pointed sepals, two broad petals, the lip and the column.
     fill is its outline; detail is a fine line just inside each petal and the column, for raised relief */
  function orchidF(cx,cy,s,a){a=a||0;const P2=PI/2,ps=[leaf(cx,cy,s*.52,s*.2,a+P2),leaf(cx,cy,s*.46,s*.19,a-P2-.72),leaf(cx,cy,s*.46,s*.19,a-P2+.72),
      leaf(cx,cy,s*.5,s*.4,a+P2+1.15),leaf(cx,cy,s*.5,s*.4,a+P2-1.15),leaf(cx,cy,s*.32,s*.22,a-P2)];
    const fill=U(...ps,circle(cx,cy,s*.1,24)),lw=max(.9,s*.03);
    const detail=U(...ps.map(p=>subtract(offset(p,-lw),offset(p,-2*lw))),circle(cx,cy,s*.07,20));
    return {fill,detail};}
  function cornerArt(kind,cx,cy,s){
    if(kind==='orchid'){const f=orchidF(cx,cy,s*.8,.15);return U(f.fill,leaf(cx-s*.05,cy-s*.18,s*.5,s*.17,-PI*.8))}
    if(kind==='curls'){const o=[spiral(cx,cy,s*.42,1.6,1,0),spiral(cx-s*.25,cy-s*.3,s*.25,1.4,-1,PI)];return U(stroke(o,max(1.2,s*.05)),leaf(cx-s*.1,cy+s*.15,s*.4,s*.16,.6))}
    if(kind==='sunburst'){const o=[];for(let i=0;i<9;i++){const a=PI*(i+.5)/9;o.push([[cx+s*.14*cos(a),cy-s*.2+s*.14*sin(a)],[cx+s*.5*cos(a),cy-s*.2+s*.5*sin(a)]])}return U(stroke(o,max(1.2,s*.05)),circle(cx,cy-s*.2,s*.12,32))}
    const m=MO.motif(kind,s);return move(m.fill,cx,cy-s/2);
  }

  /* the crest above the frame */
  function crest(kind,W,y,ch,lw){
    const m=W/2,o=[],raised=[];
    if(kind==='gable'){o.push([[[W*.18,y],[W*.82,y],[m,y+ch]]]);o.push(rect(m-2.5,y+ch-4,m+2.5,y+ch+ch*.25));o.push(ngon(m,y+ch+ch*.28,4.5,4,PI/4));
      for(let i=1;i<5;i++){const t=i/5;o.push(circle(W*.18+(m-W*.18)*t,y+ch*t+1,2.6,20),circle(W*.82-(W*.82-m)*t,y+ch*t+1,2.6,20))}
      raised.push(...[MO.motif('roseWindow',ch*.5)].map(a=>move(a.fill,m,y+ch*.12)))}
    else if(kind==='cartouche'){o.push(ellipse(m,y,W*.2,ch*.85,96));raised.push(stroke([spiral(m-W*.24,y+ch*.3,ch*.3,1.5,-1,0),spiral(m+W*.24,y+ch*.3,ch*.3,1.5,1,PI)],lw*1.3));
      o.push(offset(stroke([spiral(m-W*.24,y+ch*.3,ch*.3,1.5,-1,0),spiral(m+W*.24,y+ch*.3,ch*.3,1.5,1,PI)],lw*1.3),2));
      for(let i=0;i<9;i++){const a=PI*(i+.5)/9;raised.push(stroke([[[m+ch*.1*cos(a),y+ch*.1+ch*.1*sin(a)],[m+W*.15*cos(a),y+ch*.1+ch*.6*sin(a)]]],lw))}raised.push(circle(m,y+ch*.1,ch*.07,32))}
    else if(kind==='pediment'){o.push([[[0,y],[W,y],[m,y+ch*.7]]]);o.push(rect(-2,y,W+2,y+3.5));for(const x of [3,W-3,m])o.push(circle(x,y+(x===m?ch*.72:4),5,24));
      raised.push(subtract([[[W*.08,y+4],[W*.92,y+4],[m,y+ch*.7-4]]],[[[W*.08+lw*2.5,y+4+lw],[W*.92-lw*2.5,y+4+lw],[m,y+ch*.7-4-lw*2]]]))}
    else if(kind==='leafArch'){const pts=[];for(let i=0;i<=40;i++){const t=i/40;pts.push([W*.1+W*.8*t,y+ch*.75*sin(t*PI)])}o.push(offset(stroke([pts],ch*.18),1));
      for(let i=1;i<10;i++){const t=i/10,x=W*.1+W*.8*t,yy=y+ch*.75*sin(t*PI);o.push(leaf(x,yy,ch*.4,ch*.17,PI/2+(t-.5)*2+(i%2?.6:-.6)))}}
    else if(kind==='orchidSpray'){
      /* an arching spray of moth orchids over the window: a stem from the left, flowers getting smaller towards the
         right, two buds at its tip, and a pair of broad leaves at its foot */
      const P=t=>[W*.16+W*.68*t,y+ch*(.2+.7*sin(PI*min(1,t*1.05)))];const pts=[];for(let i=0;i<=40;i++)pts.push(P(i/40));
      o.push(stroke([pts],max(3,ch*.08)),rect(W*.12,y-1,W*.88,y+3));
      o.push(leaf(W*.17,y+2,ch*.8,ch*.3,PI*.05),leaf(W*.17,y+2,ch*.65,ch*.26,PI*.93));
      [[.3,.86],[.48,.76],[.65,.64],[.8,.5]].forEach(([t,k],i)=>{const [x,yy]=P(t),f=orchidF(x,yy-ch*.06,ch*k,(i-1.5)*.12);o.push(f.fill);raised.push(f.detail)});
      for(const t of [.9,.97]){const [x,yy]=P(t);o.push(ellipse(x,yy,ch*.07,ch*.05,24))}}
    else if(kind==='fan'){o.push(ellipse(m,y,W*.24,ch,96));for(let i=0;i<11;i++){const a=PI*(i+.5)/11;raised.push(stroke([[[m+ch*.12*cos(a),y+2+ch*.12*sin(a)],[m+W*.21*cos(a),y+2+ch*.85*sin(a)]]],lw))}raised.push(circle(m,y+2,ch*.08,32))}
    else if(kind==='roof'){const pts=[[-3,y],[W+3,y]];for(let i=0;i<=40;i++){const t=i/40,x=W+3-(W+6)*t,d=abs(x-m)/(W/2+3);pts.push([x,y+ch*.25+ch*.55*(1-d)**1.8+(d>.9?(d-.9)*ch*1.8:0)])}
      o.push([pts]);raised.push(stroke([[[W*.1,y+ch*.2],[W*.9,y+ch*.2]]],lw))}
    else if(kind==='sunrays'){o.push(circle(m,y,ch*.45,64));for(let i=0;i<13;i++){const a=PI*i/12;o.push([[[m+ch*.4*cos(a-.1),y+ch*.4*sin(a-.1)],[m+ch*cos(a),y+ch*sin(a)],[m+ch*.4*cos(a+.1),y+ch*.4*sin(a+.1)]]])}
      raised.push(...[MO.motif('sun',ch*.5)].map(a=>move(a.fill,m,y+ch*.02)))}
    else if(kind==='battlement'){const n=max(3,round(W/28)),u=W/(2*n-1);for(let i=0;i<n;i++)o.push(rect(i*2*u,y-1,i*2*u+u,y+ch*.45));o.push(rect(m-ch*.35,y-1,m+ch*.35,y+ch*.85),[[[m-ch*.42,y+ch*.85],[m+ch*.42,y+ch*.85],[m,y+ch*1.2]]])}
    else if(kind==='ziggurat'){for(let i=0;i<4;i++){const hw=W*(.3-i*.07);o.push(rect(m-hw,y-1,m+hw,y+ch*(i+1)*.24))}for(let i=0;i<7;i++){const a=PI*(i+1)/8;raised.push(stroke([[[m+ch*.14*cos(a),y+ch*.3+ch*.14*sin(a)],[m+ch*.9*cos(a),y+ch*.3+ch*.9*sin(a)]]],lw*.8))}raised.push(circle(m,y+ch*.3,ch*.1,32))}
    else if(kind==='branch'){const pts=[];for(let i=0;i<=30;i++){const t=i/30;pts.push([W*.05+W*.9*t,y+ch*.55*sin(t*PI)+ch*.06*sin(t*19)])}o.push(stroke([pts],ch*.14));
      for(const t of [.25,.45,.7]){const x=W*.05+W*.9*t,yy=y+ch*.55*sin(t*PI);o.push(stroke([[[x,yy],[x+ch*.3,yy+ch*.45]]],ch*.07),leaf(x+ch*.3,yy+ch*.45,ch*.3,ch*.14,1.1))}}
    return {fill:U(...o),raised:U(...raised)};
  }

  /* ---------- the front frame ---------- */
  /* o: style, W (outer width), Htot (to the top of the lid), S (top of the base), Hwin (top of the window), name, font,
     crest yes/no, colour one/two, mount magnet/glue, md, mh (magnet), bed [x,y] */
  function frame(o){
    const st=STYLES[o.style]||STYLES.baroque,W=o.W,Ht=o.Htot,bt=2.4,oh=1.2,lw=max(1.3,W*.007),notes=[],seed=o.seed||1;
    const sw=max(16,W*.085),bot=max(o.S,16),top=max(14,Ht-o.Hwin+10);
    const x0=sw,x1=W-sw,y0=bot,y1=Ht-top,win=opening(st.open,x0,y0,x1,y1);
    const ch=o.crest==='no'?0:min(W*.22,46);
    let outer=rrect(0,0,W,Ht,3);let cr=null;
    if(ch){cr=crest(st.crest,W,Ht-1,ch,lw);outer=U(outer,cr.fill)}
    const body=subtract(outer,win),inner=subtract(offset(body,-1.6),offset(win,3.2));
    /* the ornament */
    const art=[];
    art.push(subtract(offset(win,2.8),offset(win,1)));
    art.push(subtract(offset(rrect(0,0,W,Ht,3),-1),offset(rrect(0,0,W,Ht,3),-2.6)));
    const wb=B(win);
    /* the sides: from the base to the top rail */
    art.push(pattern(st.stile,3.5,bot+3,sw-3.5,Ht-top-3,lw,seed),pattern(st.stile,W-sw+3.5,bot+3,W-3.5,Ht-top-3,lw,seed+1));
    /* the base, with the name in the middle */
    let rail=pattern(st.rail,sw*.5,3.5,W-sw*.5,bot-3.5,lw,seed+2);
    if(o.name&&o.name.trim()){const th=min(bot*.42,W*.1),t=HM.text2D([o.name.trim()],th,max(1.4,th*.13),o.font||'script');
      const tr=move(t.rings,W/2,bot/2),pad=offset(tr,3.5);rail=subtract(rail,pad);art.push(tr,subtract(pad,offset(tr,2.2)).length?subtract(offset(pad,0),offset(pad,-lw)):[])}
    art.push(rail);
    /* the corners beside the top of the window (only where there is room) */
    const sp=st.open==='rect'?0:min((y1-y0)*.18,(x1-x0)*.24);
    if(sp>14){const cy=y1-sp*.55;for(const [cx,fl] of [[x0+sp*.55,false],[x1-sp*.55,true]]){let a=cornerArt(st.corner,cx,cy,sp*.8);if(fl)a=mirror(a,cx);art.push(subtract(a,offset(win,2.5)))}}
    if(st.key){const kw=min(24,(x1-x0)*.12);art.push([[[W/2-kw/2,y1+.5],[W/2+kw/2,y1+.5],[W/2+kw*.35,y1-kw*.9],[W/2-kw*.35,y1-kw*.9]]])}
    if(cr&&cr.raised.length)art.push(cr.raised);
    let deco=intersect(U(...art),offset(body,-1.2));
    /* magnets: two at the base corners, two in the top rail held by clips on the lid */
    const mags=[];const glue=o.mount==='glue';
    /* the bottom pair sits in front of the base's front corner blocks, which have matching pockets */
    const bx=o.cornerX||[sw/2+2,W-sw/2-2],by=o.cornerX?o.S/2:bot/2;
    if(!glue){const md=o.md||10,mh=o.mh||3;for(const [x,y] of [[bx[0],by],[bx[1],by],...(o.topMags||[[sw/2+2,Ht-top/2],[W-sw/2-2,Ht-top/2]])])mags.push([x,y]);
      const pd=max(mh+.2,bt+oh),rz=pd+.6,ros=U(...mags.map(([x,y])=>st.stile==='stars'?star(x,y,md/2+5,8,.7):st.stile==='quatrefoil'?U(...[0,1,2,3].map(i=>circle(x+cos(i*PI/2)*(md/4+1.5),y+sin(i*PI/2)*(md/4+1.5),md/2+.5,32))):circle(x,y,md/2+3.5,48)));
      deco=subtract(deco,offset(ros,1));mags.rz=rz;mags.ros=ros;mags.pd=pd}
    /* split in two when it doesn't fit the bed */
    const bed=o.bed||[350,350],full=B(outer);const tall=full.y1-full.y0,wide=full.x1-full.x0;
    if(wide>bed[0]+.1&&wide>bed[1]+.1)notes.push(`The frame is ${wide.toFixed(0)} mm wide, more than your bed: it needs a bigger printer.`);
    let cuts=[null];
    if(tall>max(bed[0],bed[1])+.1||(tall>bed[1]+.1&&wide>bed[0]+.1)){
      const ys=Ht*.5,tab=(cx)=>[[cx-4,ys],[cx-4,ys+3],[cx-7,ys+9],[cx+7,ys+9],[cx+4,ys+3],[cx+4,ys]];
      const lowP=[[[-50,-50],[W+50,-50],[W+50,ys],...tab(W-sw/2).reverse(),...tab(sw/2).reverse(),[-50,ys]]];
      cuts=[lowP,subtract(rect(-50,-50,W+50,full.y1+50),offset(lowP,.05))];
      notes.push('The frame is taller than your print bed, so it comes in two halves with puzzle joints in the sides. Press them together flat on a table; once the frame hangs on its magnets the joints stay closed.')}
    const parts=[],two=o.colour==='two';
    cuts.forEach((c,i)=>{const cl=r=>c?intersect(r,c):r,f=[prism(0,bt,cl(body))],a=[prism(bt,bt+oh,cl(deco))];
      if(mags.length){a.push(prism(bt,mags.rz,cl(mags.ros)));for(const [x,y] of mags)f.push(prism(-1,mags.pd,cl(G.mag(x,y,o.md||10)),'sub'))}
      const sfx=cuts.length>1?(i?'-top':'-bottom'):'';
      if(two){parts.push({file:`frame${sfx}.stl`,role:i?'Second file':'Colour 1',m:build([...f,...(mags.length?[prism(bt,mags.rz,cl(mags.ros))]:[]),...(mags.length?mags.map(([x,y])=>prism(-1,mags.pd,cl(G.mag(x,y,o.md||10)),'sub')):[])]),at:'front'},
        {file:`frame${sfx}-filigree.stl`,role:'Colour 2',m:build([prism(bt,bt+oh,cl(deco))]),at:'front'})}
      else parts.push({file:`frame${sfx}.stl`,role:i?'Second file':'Main colour',m:build([...f,...a]),at:'front'})});
    if(two)notes.push('Two colours: add the filigree file to the frame as a part (same origin), for example gold on black.');
    if(!glue){notes.push(`Magnets: 8 in all, pressed into their pockets. 4 go in the frame; 2 in the pockets in the front corners of the base${o.frameMags?'':' (turn on Enclosure, Size, Magnets for a front frame, so the base and lid get them)'}; ${o.topMags?'and 2 in the pockets in the lugs under the front corners of the lid':'and 2 in the lid clips, which push onto the front edge of the lid'}. The frame sticks to them.`);
      if(!o.topMags)parts.push({file:'lid-clip.stl',role:'Second file',m:lidClip(o),at:'loose',count:2})}
    if(o.blocked)notes.push('The door\'s turn latch and lock hasps sit where the frame\'s right side goes. With a front frame, choose the magnet or click catch and no lock.');
    else notes.push('Glue: fix the frame to the front of the base and the corner posts with double-sided foam tape (it comes off again).');
    notes.push('The frame prints flat on its back, with the pattern facing up.');
    return {parts,notes,magnets:glue?0:4,size:[W,Ht+ch]};
  }
  /* a clip that pushes onto the front edge of the lid and holds a magnet facing forward, for the top of the frame */
  function lidClip(o){
    /* printed lying down: the profile (x forward, y up) stands on the bed and is w tall */
    const L=o.Lt||2.4,md=o.md||10,mh=o.mh||3,w=md+6,g=L+.35,d=10,f=Math.max(mh+1,o.clipReach||0),y0=min(-2,g/2-md/2-2),y1=max(g+2,g/2+md/2+2);
    const prof=U(rect(-d,g,0,g+2),rect(-d,-2,0,0),rect(0,y0,f,y1));
    return build([prism(0,w,prof),prism(w/2-md/2-.02,w/2+md/2+.02,rect(f-mh-.2,g/2-md/2-.02,f+1,g/2+md/2+.02),'sub')]);
  }

  /* ---------- finials for the top corners ---------- */
  function finial(o){
    /* the finial stands on a small plinth with a threaded hole underneath: it screws onto a stud in the corner post,
       which also holds the lid down */
    const sp=o.screw||(root.HabitatEnclosure&&root.HabitatEnclosure.screwSpec(false)),thr=!!sp&&o.rect!==false;
    const st=STYLES[o.style]||STYLES.baroque,k=o.finial||st.finial,h=(o.h||28)+(thr?6:0),b=12,pl=thr?9:3,f=[prism(0,pl,rrect(-b/2,-b/2,b/2,b/2,1.2))];
    if(thr)f.push(root.HabitatEnclosure.screwHoleUp(0,0,8,sp));
    const sq=r=>rrect(-r,-r,r,r,.6),hex=r=>ngon(0,0,r,6),oct=r=>ngon(0,0,r,8,PI/8),c=r=>circle(0,0,r,48);
    const L=(prof,shape,r0)=>HM.lathe(pl,h-pl,prof,shape,r0??b/2-.6,.3);
    const P={
      spire:[t=>t<.12?3.4:t<.2?4.6:max(.5,4.4*(1-(t-.2)/.8)+.7*sin((t-.2)*PI*7)**2),oct],
      urn:[t=>t<.12?2.6:t<.25?3.6+t*4:t<.6?5.6-((t-.42)/.18)**2*1.6:t<.72?2.4:t<.8?3.6:t<.92?2:1.6*(1-(t-.92)/.08)+.4,c],
      ball:[t=>t<.3?2.6:5.4*sqrt(max(.02,1-((t-.65)/.35)**2)),c],
      acorn:[t=>t<.12?2.4:t<.45?4.8:4.6*sqrt(max(.03,1-((t-.45)/.55)**1.6)),c],
      bud:[t=>t<.15?2.2:t<.5?2.2+(t-.15)*8:4.9*sqrt(max(.02,1-((t-.5)/.5)**2)),c],
      lotus:[t=>t<.12?2.4:t<.35?3+(t-.12)*10:5.2*(1-((t-.35)/.65)**1.4)+.3,r=>polar(0,0,a=>r*(1+.12*cos(8*a)),96)],
      star:[t=>t<.3?2.4:5.6*sqrt(max(.02,1-((t-.65)/.35)**2)),r=>star(0,0,r,6,.62)],
      crystal:[t=>t<.1?3:t<.72?3.8:3.8*(1-(t-.72)/.28)+.3,hex],
      stepped:[t=>t<.25?4.6:t<.45?3.6:t<.62?2.7:t<.78?1.9:max(.4,1.9*(1-(t-.78)/.22)),sq]
    }[k]||[t=>4,c];
    f.push(L(P[0],P[1]));
    if(!thr)return {parts:[{file:`finial-${k}.stl`,role:'Main colour',m:build(f),at:'top',count:4}],notes:['Finials: print 4 and stand one on each top corner of the lid.'],magnets:0};
    const sl=(o.Lt||2.4)+11+7;
    return {parts:[{file:`finial-${k}.stl`,role:'Main colour',m:build(f),at:'top',count:4},{file:'finial-stud-print-4.stl',role:'Second file',m:root.HabitatEnclosure.stud(sp,sl),at:'loose',count:4}],
      notes:[`Finials: print 4 finials and 4 studs. Turn a stud into each corner post through the hole in the lid, with a screwdriver in its slot, until about 7 mm stands above the lid; then screw a finial onto it. The finials hold the lid down, so you don't need the lid screws as well.${o.lidScrews?'':' Turn on Enclosure, Size, Lid fixing: Printed screws in the corners, so the posts and the lid get their threads and holes.'}`],magnets:0};
  }

  /* ---------- feet for the bottom corners: the base sits in a little corner lip ---------- */
  function foot(o){
    const st=STYLES[o.style]||STYLES.baroque,k=o.foot||st.foot,h=o.h||16,s=15,lip=5,lt=2.4,notes=['Feet: print 4. Set the enclosure on them so each corner sits inside the lip.'];
    const top=r=>intersect(rrect(-s,-s,s,s,2),circle(0,0,r,64));
    const prof={bun:t=>t<.85?7+11*sqrt(max(0,1-((t-.45)/.55)**2)):30,block:t=>t<.3?10:t<.55?12:t<.75?14:30,drum:t=>t<.85?(9+3*abs(sin(t*PI*3))):30,
      claw:t=>30,root:t=>30}[k]||(t=>30);
    let f=[];
    if(k==='claw'||k==='root'){
      /* modelled: a ball held by three toes, or a gnarled root stump, with the corner plate on top */
      const body=k==='claw'?S.smooth(1.2,S.sphere(0,0,h*.42,h*.44),...[0,1,2].map(i=>{const a=i*2*PI/3+PI/4;return S.chain([[cos(a)*h*.5,sin(a)*h*.5,h*.22],[cos(a)*h*.47,sin(a)*h*.47,h*.6],[cos(a)*h*.2,sin(a)*h*.2,h*.88]],[h*.12,h*.1,h*.07],1)}),S.rod([0,0,h*.6],[0,0,h],h*.34,s*.85))
        :S.rough(S.smooth(2,S.rod([0,0,0],[0,0,h],s*.7,s*.85),...[0,1,2,3].map(i=>{const a=i*PI/2+.4;return S.rod([cos(a)*s*.4,sin(a)*s*.4,h*.7],[cos(a)*s*1.05,sin(a)*s*1.05,.5],s*.25,s*.15)})),.5,3,o.seed||1,3);
      const sd=S.union(S.both(body,(x,y,z)=>z-h),S.box(0,0,h+1.2,s,s,1.8,1.5),S.box(-s+lt/2,0,h+3+lip/2,lt/2,s,lip/2+.6,.4),S.box(0,-s+lt/2,h+3+lip/2,s,lt/2,lip/2+.6,.4));
      const m=S.mesh(sd,[-s*1.4,-s*1.4,s*1.4,s*1.4,h+3+lip+.5],.35);
      return {parts:[{file:`foot-${k}.stl`,role:'Main colour',m,at:'bottom',count:4}],notes,magnets:0};
    }
    /* under the corner plate the foot flares out at 45°, so the plate never hangs over air */
    f.push(HM.lathe(0,h,t=>max(min(prof(t),s*1.42),s*1.42-(1-t)*h),r=>top(r),prof(0),.3));
    f.push(prism(h,h+3,rrect(-s,-s,s,s,2)),prism(h+3,h+3+lip,U(rect(-s,-s,-s+lt,s),rect(-s,-s,s,-s+lt))));
    return {parts:[{file:`foot-${k}.stl`,role:'Main colour',m:build(f),at:'bottom',count:4}],notes,magnets:0};
  }

  function piece(o){
    const which=o.piece||'all',out={parts:[],notes:[],magnets:0};
    const add=r=>{out.parts.push(...r.parts);out.notes.push(...r.notes);out.magnets+=r.magnets};
    if(['frame','all','top'].includes(which)){if(o.rect)add(frame(o));else out.notes.push('The front frame fits rectangular enclosures only; finials and feet fit any.')}
    if(['finials','all','top','small'].includes(which))add(finial(Object.assign({},o,{h:o.fh||max(22,min(40,o.W*.13))})));
    if(['feet','all','small'].includes(which))add(foot(Object.assign({},o,{h:o.ft||22})));
    return out;
  }
  root.HabitatTrim={STYLES,FOR,styleFor,frame,finial,foot,piece,opening};
})(typeof window!=='undefined'?window:globalThis);
