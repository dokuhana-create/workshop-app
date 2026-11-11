/* Habitat motifs: flat artwork for plaques, stand-up cut-outs, stencils, ornaments and relief tiles.
   Each motif is drawn in a box about 100 units tall (x -50..50, y 0..100) and returns
   {fill: outline rings, lines: polylines engraved into it}. The builder scales it to the size asked for. */
(function(root){
  const G=root.Geo,HP=root.HabitatParts,HM=root.HabitatMore;
  const {circle,ellipse,rect,rrect,ngon,polar,offset,intersect,subtract,unite,stroke,move}=G;
  const TAU=Math.PI*2,bez=HP.bez,curl=HP.curl;
  const P=(...pts)=>[pts];
  const U=(...a)=>a.reduce((x,y)=>unite(x,y),[]);
  const D=(a,...b)=>b.reduce((x,y)=>subtract(x,y),a);
  const S=(lines,w)=>stroke(lines,w);
  const R=(rings,a,cx,cy)=>{const c=Math.cos(a),s=Math.sin(a);return rings.map(q=>q.map(([x,y])=>[cx+(x-cx)*c-(y-cy)*s,cy+(x-cx)*s+(y-cy)*c]))};
  const MX=rings=>rings.map(q=>q.map(([x,y])=>[-x,y]).reverse());
  const ML=lines=>lines.map(l=>l.map(([x,y])=>[-x,y]));
  const sym=rings=>unite(rings,MX(rings));
  const star=(cx,cy,r,n,k)=>{n=n||5;k=k||.42;const q=[];for(let i=0;i<2*n;i++){const a=Math.PI/2+i*Math.PI/n,rr=i%2?r*k:r;q.push([cx+rr*Math.cos(a),cy+rr*Math.sin(a)])}return [q]};
  const arc=(cx,cy,rx,ry,a0,a1,n)=>{n=n||24;const o=[];for(let i=0;i<=n;i++){const a=(a0+(a1-a0)*i/n)*Math.PI/180;o.push([cx+rx*Math.cos(a),cy+ry*Math.sin(a)])}return o};
  const leaf=(x,y,len,wid,a)=>R(ellipse(x+len/2,y,len/2,wid/2,20),a,x,y);
  const lancet=(cx,w,y0,ys)=>{const r=w*1.6;return unite(rect(cx-w/2,y0,cx+w/2,ys),intersect(intersect(circle(cx+w/2-r,ys,r,96),circle(cx-w/2+r,ys,r,96)),rect(cx-w/2,ys,cx+w/2,ys+r*2)))};

  const M={};
  /* ---------- gothic and vampiric ---------- */
  M.bat=()=>{const wing=P([3,60],[14,68],[28,74],[44,74],[50,64],[46,52],[40,57],[35,46],[28,53],[22,42],[15,51],[6,44],[3,48]);
    const body=U(ellipse(0,52,7,13,32),circle(0,66,6.5,28),P([-6,68],[-6.5,79],[-2,71]),P([6,68],[6.5,79],[2,71]),sym(wing));
    return {fill:D(body,circle(-2.4,67,1.3,10),circle(2.4,67,1.3,10)),lines:[...[[[5,61],[44,74]],[[8,58],[35,46]],[[8,56],[22,42]]],...ML([[[5,61],[44,74]],[[8,58],[35,46]],[[8,56],[22,42]]])]}};
  M.skull=()=>{const head=U(ellipse(0,62,27,28,64),rrect(-16,18,16,42,6),ellipse(-19,42,8,7,24),ellipse(19,42,8,7,24));
    return {fill:D(head,ellipse(-11,55,8,9,32),ellipse(11,55,8,9,32),P([-4.5,37],[4.5,37],[0,47])),lines:[[[-14,30],[14,30]],...[-9,-4.5,0,4.5,9].map(x=>[[x,22],[x,30]])]}};
  M.crossbones=()=>{const bone=(a)=>R(U(rect(-34,-3,34,3),circle(-34,-4,4.5,20),circle(-34,4,4.5,20),circle(34,-4,4.5,20),circle(34,4,4.5,20)),a,0,0);
    const sk=M.skull();const s=sk.fill.map(q=>q.map(([x,y])=>[x*.62,y*.62+38]));
    return {fill:U(move(unite(bone(.6),bone(-.6)),0,26),s),lines:sk.lines.map(l=>l.map(([x,y])=>[x*.62,y*.62+38]))}};
  M.coffin=()=>({fill:P([-12,0],[12,0],[22,66],[15,98],[-15,98],[-22,66]),lines:[[[0,30],[0,80]],[[-11,66],[11,66]],[[-9,4],[9,4],[18,66],[12,93],[-12,93],[-18,66],[-9,4]]]});
  M.tombstone=()=>({fill:unite(rect(-30,0,30,62),ellipse(0,62,30,30,64)),lines:[[[-30,8],[30,8]],[[-15,50],[15,50]],[[0,38],[0,74]],[[-10,64],[10,64]]]});
  M.roseWindow=()=>{let f=circle(0,50,48,120);const h=[...circle(0,50,7,32)];
    for(let i=0;i<12;i++){const a=i*TAU/12;h.push(...R(ellipse(0,50+23,4.5,10,24),a,0,50),...circle(40*Math.sin(a+TAU/24),50+40*Math.cos(a+TAU/24),4,20))}
    return {fill:D(f,h),lines:[arc(0,50,32,32,0,360,96)]}};
  M.gothicWindow=()=>{const outer=lancet(0,60,0,62);
    return {fill:D(outer,lancet(-14,22,8,58),lancet(14,22,8,58),U(circle(0,88,5,24),circle(-6,82,4,20),circle(6,82,4,20),circle(0,77,4,20))),lines:[]}};
  M.gothicCross=()=>{const end=(x,y)=>U(circle(x,y,6,24),circle(x+5,y,4,20),circle(x-5,y,4,20),circle(x,y+5,4,20),circle(x,y-5,4,20));
    return {fill:U(rect(-5,0,5,92),rect(-30,58,30,68),end(0,92),end(-30,63),end(30,63),circle(0,63,12,40)),lines:[arc(0,63,8,8,0,360,40)]}};
  M.candles=()=>{const c=(x,h,w)=>U(rect(x-w/2,0,x+w/2,h),P([x-w/2,h],[x-w/2+1,h-8],[x-w/2+3,h-3],[x-w/2+5,h-10],[x,h])),flame=(x,h)=>U(ellipse(x,h+8,4,7,24),P([x-3.5,h+10],[x,h+22],[x+3.5,h+10]));
    return {fill:U(c(-18,46,13),c(0,64,15),c(18,36,12),flame(-18,46),flame(0,64),flame(18,36),rect(-30,0,30,4)),lines:[[[-18,46],[-18,50]],[[0,64],[0,68]],[[18,36],[18,40]]]}};
  M.raven=()=>{const body=U(R(ellipse(0,46,27,14,48),-.35,0,46),circle(22,63,10,32),P([29,66],[45,60],[29,58]),P([-20,40],[-48,28],[-45,38],[-48,44],[-22,50]));
    return {fill:D(U(body,S([[[2,36],[0,16]],[[10,36],[12,16]],[[-22,16],[30,16]]],3)),circle(25,65,2,14)),lines:[[[-14,52],[12,44]],[[-18,46],[8,38]],[[-22,40],[2,33]]]}};
  M.spider=()=>{const legs=[];for(const s of [-1,1])for(let i=0;i<4;i++){const a=(-40+i*28)*Math.PI/180,kx=s*(18+i*2),ky=52+18*Math.sin(-a);legs.push([[s*8,50],[kx,ky+10],[s*(34+i*4),ky-14+i*6]])}
    return {fill:U(circle(0,40,13,48),circle(0,60,8,32),S(legs,3),S([[[0,96],[0,68]]],1.2)),lines:[[[-6,46],[6,46],[0,34],[-6,46]]]}};
  M.web=()=>{const lines=[];for(let i=0;i<8;i++){const a=i*TAU/8;lines.push([[0,50],[48*Math.cos(a),50+48*Math.sin(a)]])}
    for(const r of [10,20,30,40,48]){const q=[];for(let i=0;i<=8;i++){const a=i*TAU/8,b=(i+.5)*TAU/8;q.push([r*Math.cos(a),50+r*Math.sin(a)]);if(i<8)q.push([r*.88*Math.cos(b),50+r*.88*Math.sin(b)])}lines.push(q)}
    return {fill:S(lines,2.2),lines:[],thin:true}};
  M.moon=()=>({fill:U(D(circle(-6,50,38,96),circle(10,58,32,96)),star(26,22,9),star(34,72,6),star(18,90,4)),lines:[]});

  /* ---------- Greek and Roman ---------- */
  M.laurel=()=>{const f=[],lines=[];for(const s of [-1,1]){const path=[];for(let i=0;i<=20;i++){const a=(-90+s*(i*8+10))*Math.PI/180;path.push([40*Math.cos(a)*s*s,50+40*Math.sin(a)])}
      const pts=path.map(([x,y])=>[x,y]);lines.push(pts);f.push(...S([pts],3));
      for(let i=1;i<20;i+=2){const [x,y]=pts[i],[x2,y2]=pts[i+1],t=Math.atan2(y2-y,x2-x);f.push(...leaf(x,y,13,6,t+.75),...leaf(x,y,13,6,t-.75))}}
    return {fill:unite(f),lines:[]}};
  M.helmet=()=>{const shell=P([30,12],[33,40],[28,64],[16,80],[-4,86],[-22,80],[-32,64],[-35,46],[-33,26],[-26,14],[-16,12],[-15,26],[-18,36],[-10,40],[-6,22],[-4,12]);
    const crest=S([arc(0,52,34,38,10,170,40)],10);
    return {fill:D(unite(shell,crest),ellipse(-22,52,8,4,20)),lines:[[[-16,46],[24,50]],...Array.from({length:9},(_,i)=>{const a=(20+i*17)*Math.PI/180;return [[34*Math.cos(a)*.86,52+38*Math.sin(a)*.86],[34*Math.cos(a)*1.14,52+38*Math.sin(a)*1.14]]})]}};
  M.temple=()=>{const f=[...rect(-48,0,48,5),...rect(-44,5,44,10),...rect(-42,62,42,70)],lines=[];
    for(let i=0;i<6;i++){const x=-36+i*14.4;f.push(...rect(x-4,10,x+4,62),...rect(x-6,58,x+6,62));lines.push([[x-1.5,14],[x-1.5,56]],[[x+1.5,14],[x+1.5,56]])}
    f.push(...P([-46,70],[46,70],[0,94]));lines.push([[-34,74],[34,74],[0,89],[-34,74]]);return {fill:unite(f),lines}};
  M.amphora=()=>{const prof=[[0,2],[7,2],[6,8],[16,26],[22,44],[18,62],[8,74],[7,86],[12,90],[0,90]];const half=P(...prof,[0,2]);const body=sym(half);
    return {fill:U(body,S([[[7,84],[22,82],[24,66],[17,60]]],3.4),S([[[-7,84],[-22,82],[-24,66],[-17,60]]],3.4)),lines:[[[-20,40],[20,40]],[[-21,52],[21,52]],...[-12,-4,4,12].map(x=>[[x,42],[x+3,50]])]}};
  M.owl=()=>{const body=U(ellipse(0,42,24,30,64),P([-22,62],[-18,82],[-8,70]),P([22,62],[18,82],[8,70]),ellipse(0,64,22,16,48));
    return {fill:D(U(body,S([[[-30,10],[30,10]]],4)),circle(-10,64,7,28),circle(10,64,7,28)),dots:U(circle(-10,64,3,16),circle(10,64,3,16),P([-3,58],[3,58],[0,51])),lines:[[[-12,40],[-6,30]],[[0,42],[0,30]],[[12,40],[6,30]],[[-18,30],[-12,18]],[[18,30],[12,18]]]}};
  M.lyre=()=>{const arm=[bez([-8,6],[-34,24],[-30,70],[-18,88]),bez([8,6],[34,24],[30,70],[18,88])];
    const f=U(S(arm,5),S([[[-20,78],[20,78]],[[-12,6],[12,6]]],4.5),circle(-18,90,4,20),circle(18,90,4,20));const lines=[-8,-3,2,7].map(x=>[[x*1.1,10],[x,76]]);
    return {fill:unite(f,S(lines,1.6)),lines:[]}};
  M.ionic=()=>{const f=U(rect(-14,8,14,78),rect(-20,0,20,8),rrect(-26,78,26,84,1));
    const vol=s=>S([curl([s*20,86],s>0?Math.PI*1.2:-Math.PI*.2,6,s>0?-1:1)],2.6);
    return {fill:U(f,rect(-28,84,28,90),vol(1),vol(-1),circle(20,86,3.5,16),circle(-20,86,3.5,16)),lines:[-9,-3,3,9].map(x=>[[x,12],[x,74]])}};
  M.meander=()=>{const L=[];let x=-48;const q=[[x,10]];while(x<38){q.push([x,40],[x+16,40],[x+16,20],[x+8,20],[x+8,30],[x+4,30]);x+=20;q.push([x-4,30],[x-4,10],[x,10])}
    return {fill:unite(S([q],3),U(rect(-50,0,50,4),rect(-50,46,50,50))),lines:[]}};

  /* ---------- zodiac ---------- */
  const Z={
    aries:()=>[bez([0,10],[0,62],[-10,80],[-24,72]),bez([-24,72],[-34,64],[-30,46],[-18,48]),bez([0,10],[0,62],[10,80],[24,72]),bez([24,72],[34,64],[30,46],[18,48])],
    taurus:()=>[arc(0,34,18,18,0,360,40),bez([-28,84],[-22,52],[22,52],[28,84])],
    gemini:()=>[[[-12,18],[-12,82]],[[12,18],[12,82]],bez([-28,90],[-10,80],[10,80],[28,90]),bez([-28,10],[-10,20],[10,20],[28,10])],
    cancer:()=>[arc(-14,62,8,8,0,360,24),bez([-14,70],[2,80],[22,78],[30,64]),arc(14,38,8,8,0,360,24),bez([14,30],[-2,20],[-22,22],[-30,36])],
    leo:()=>[arc(-16,30,11,11,0,360,32),bez([-8,38],[-18,70],[8,94],[14,64]),bez([14,64],[16,42],[30,26],[38,36])],
    virgo:()=>[[[-32,20],[-32,72]],bez([-32,62],[-30,80],[-16,80],[-16,62]),[[-16,62],[-16,20]],bez([-16,62],[-14,80],[0,80],[0,62]),[[0,62],[0,30]],bez([0,30],[0,8],[22,10],[18,32]),bez([18,32],[14,46],[0,40],[2,28])],
    libra:()=>[[[-32,20],[32,20]],[[-32,40],[-12,40]],bez([-12,40],[-14,64],[14,64],[12,40]),[[12,40],[32,40]]],
    scorpio:()=>[[[-32,20],[-32,72]],bez([-32,62],[-30,80],[-16,80],[-16,62]),[[-16,62],[-16,20]],bez([-16,62],[-14,80],[0,80],[0,62]),[[0,62],[0,28],[8,20],[22,20]],[[16,28],[22,20],[16,12]]],
    sagittarius:()=>[[[-28,14],[30,72]],[[30,72],[8,72]],[[30,72],[30,50]],[[-10,28],[12,50]]],
    capricorn:()=>[[[-32,74],[-20,26],[-8,70]],bez([-8,70],[2,90],[18,64],[12,42]),bez([12,42],[8,26],[30,18],[30,34]),bez([30,34],[30,48],[12,44],[16,30])],
    aquarius:()=>[[[-32,44],[-20,56],[-8,44],[4,56],[16,44],[28,56]],[[-32,20],[-20,32],[-8,20],[4,32],[16,20],[28,32]]],
    pisces:()=>[bez([-26,88],[-6,66],[-6,34],[-26,12]),bez([26,88],[6,66],[6,34],[26,12]),[[-14,50],[14,50]]]
  };
  for(const k in Z)M['zodiac-'+k]=()=>({fill:S(Z[k](),6),lines:[],thin:true});
  M.zodiacWheel=()=>{const f=[...subtract(circle(0,50,49,160),circle(0,50,44,160)),...subtract(circle(0,50,22,96),circle(0,50,19,96))];const ks=Object.keys(Z);
    ks.forEach((k,i)=>{const a=Math.PI/2-i*TAU/12,cx=33*Math.cos(a),cy=50+33*Math.sin(a);f.push(...S(Z[k]().map(l=>l.map(([x,y])=>[cx+x*.19,cy+(y-50)*.19])),2.2))});
    for(let i=0;i<12;i++){const a=Math.PI/2-(i+.5)*TAU/12;f.push(...S([[[22*Math.cos(a),50+22*Math.sin(a)],[44*Math.cos(a),50+44*Math.sin(a)]]],1.4))}
    return {fill:U(unite(f),star(0,50,12,8,.45)),lines:[]}};

  /* ---------- fantasy ---------- */
  M.dragon=()=>{const body=S([bez([-30,70],[-22,46],[0,38],[12,30]),bez([12,30],[28,20],[40,30],[44,12])],9);
    const head=P([-28,62],[-48,68],[-46,75],[-30,82],[-22,74]),horns=S([[[-28,80],[-24,94]],[[-32,79],[-36,92]]],2.6),spade=P([44,16],[52,4],[40,4]);
    const wing=P([-8,48],[-12,94],[4,82],[16,92],[24,72],[38,80],[32,52],[10,44]);
    const legs=S([[[-2,38],[-8,20],[-14,14]],[[16,26],[18,10],[24,6]]],4);
    return {fill:D(U(body,head,horns,spade,wing,legs),circle(-36,73,1.6,12)),lines:[[[-8,48],[-12,94]],[[-6,48],[4,82]],[[0,47],[24,72]],[[6,46],[32,52]]]}};
  M.castle=()=>{const cren=(x0,x1,y)=>{const o=[];for(let x=x0;x<x1-1;x+=6)o.push(...rect(x,y,x+3.5,y+5));return o};
    let f=U(rect(-30,0,30,52),rect(-46,0,-26,72),rect(26,0,46,72),rect(-10,0,10,82),cren(-30,30,52),cren(-46,-26,72),cren(26,46,72),cren(-10,10,82));
    f=unite(f,U(S([[[-36,77],[-36,96]],[[36,77],[36,96]]],1.5),P([-36,96],[-24,92],[-36,88]),P([36,96],[48,92],[36,88])));
    return {fill:D(f,unite(rect(-8,0,8,18),circle(0,18,8,32)),lancet(-36,4,50,58),lancet(36,4,50,58),lancet(0,4,62,70),lancet(-18,3,30,36),lancet(18,3,30,36)),lines:[[[-30,40],[30,40]]]}};
  M.crystal=()=>{const cr=(x,w,h,a)=>R(P([x-w/2,0],[x+w/2,0],[x+w/2,h-w*.7],[x,h],[x-w/2,h-w*.7]),a,x,0);
    const f=U(cr(0,16,96,0),cr(-16,12,68,.22),cr(16,12,74,-.2),cr(-28,9,44,.45),cr(28,9,48,-.42),ellipse(0,2,40,6,48));
    return {fill:f,lines:[[[0,0],[0,84]],[[-16,0],[-11,60]],[[16,0],[11,64]]]}};
  M.wizardHat=()=>{const cone=P([-26,22],[26,22],[14,60],[22,80],[30,84],[20,90],[6,74]);
    return {fill:D(U(cone,ellipse(0,20,46,9,64)),star(-4,44,6),D(circle(8,34,6,24),circle(10,36,5,24))),lines:[[[-24,28],[24,28]],[[-23,32],[23,32]]]}};
  M.potion=()=>({fill:U(circle(0,34,30,96),rect(-8,58,8,82),rrect(-10,82,10,94,2),rrect(-12,78,12,82,1)),lines:[[[-28,40],[-14,44],[0,38],[14,44],[28,40]]],dots:U(circle(-8,24,3,16),circle(6,18,2,14),circle(10,30,2.5,14))});
  M.mushroomSil=()=>({fill:D(U(intersect(ellipse(0,52,46,36,96),rect(-50,52,50,100)),rrect(-10,0,10,56,4)),circle(-24,64,5,20),circle(4,76,6,24),circle(24,62,4,18),circle(-6,60,3,14)),lines:[[[-40,52],[40,52]]]});
  M.tree=()=>{const tr=S([[[0,0],[0,40]],[[0,30],[-16,52]],[[0,36],[14,58]],[[0,0],[-14,-2]],[[0,0],[14,-2]]],6);
    return {fill:U(tr,circle(-20,62,16,40),circle(16,66,18,40),circle(0,80,20,48),circle(-30,76,12,32),circle(30,80,12,32)),lines:[]}};

  /* ---------- tabletop and D&D ---------- */
  M.d20=()=>{const hex=ngon(0,50,48,6,Math.PI/6),v=hex[0],t=[[0,80],[-26,35],[26,35]];
    const lines=[[...t,t[0]],...[[0,0],[0,1],[0,2],[1,2],[1,3],[1,4],[2,4],[2,5],[2,0]].map(([i,j])=>[t[i],v[j]])];
    const T=HM.text2D(['20'],14,2.4);return {fill:hex,lines,raised:move(T.rings,0,48)}};
  M.swordShield=()=>{const shield=P([-30,74],[30,74],[30,40],[22,18],[0,4],[-22,18],[-30,40]);
    const sword=U(P([-3,30],[3,30],[3,96],[0,100],[-3,96]),rect(-14,24,14,30),rect(-2.5,8,2.5,24),circle(0,6,4,16));
    return {fill:unite(R(sword,-.6,0,50),shield),lines:[[[0,70],[0,10]],[[-26,48],[26,48]]]}};
  M.chest=()=>({fill:U(rect(-40,0,40,46),intersect(ellipse(0,46,40,22,64),rect(-40,46,40,70))),lines:[[[-40,46],[40,46]],[[-28,0],[-28,62]],[[28,0],[28,62]]],dots:U(rrect(-6,36,6,52,2))});
  M.scroll=()=>({fill:U(rect(-36,8,36,82),circle(-36,14,7,24),circle(36,82,7,24),rect(-43,8,-36,82),rect(36,8,43,82)),lines:[[[-26,70],[26,70]],[[-26,60],[22,60]],[[-26,50],[26,50]],[[-26,40],[16,40]],[[-26,30],[24,30]]]});
  M.dice=()=>{const d=(cx,cy,a,n)=>{const sq=R(rrect(cx-18,cy-18,cx+18,cy+18,5),a,cx,cy);const pip={1:[[0,0]],3:[[-9,-9],[0,0],[9,9]],5:[[-9,-9],[9,-9],[0,0],[-9,9],[9,9]],6:[[-9,-10],[-9,0],[-9,10],[9,-10],[9,0],[9,10]]}[n];
      return D(sq,pip.map(([x,y])=>R(circle(cx+x,cy+y,3,16),a,cx,cy)).flat())};
    return {fill:U(d(-20,30,.3,5),d(20,58,-.25,6),d(-6,84,.1,3)),lines:[]}};

  /* ---------- flowers, sky and the rest ---------- */
  M.rose=()=>{const q=[];for(let a=0;a<TAU*2.2;a+=.15){const r=2+a*1.85;q.push([r*Math.cos(a),66+r*Math.sin(a)*.92])}
    return {fill:U(ellipse(0,66,30,27,64),S([[[0,40],[2,20],[0,0]]],4),leaf(1,24,24,11,.5),leaf(-1,14,22,10,Math.PI-.5)),lines:[q]}};
  M.tulip=()=>({fill:U(P([-16,62],[-18,86],[-8,76],[0,94],[8,76],[18,86],[16,62],[10,54],[-10,54]),S([[[0,56],[0,0]]],4),leaf(1,8,34,10,1.15),leaf(-1,20,30,9,Math.PI-1.1)),lines:[[[0,56],[0,80]],[[-8,60],[-12,78]],[[8,60],[12,78]]]});
  M.sunflower=()=>{const f=[];for(let i=0;i<20;i++){const a=i*TAU/20;f.push(...R(ellipse(0,52+30,6,14,20),a,0,52))}
    const c=circle(0,52,20,64),dots=[];for(let i=0;i<30;i++){const a=i*2.4,r=2.2*Math.sqrt(i+1)*1.6;if(r<16)dots.push(...circle(r*Math.cos(a),52+r*Math.sin(a),1.4,10))}
    return {fill:D(U(unite(f),c),dots),lines:[]}};
  M.lotusSil=()=>{const f=[];for(const [a,l,w] of [[0,52,20],[.55,46,17],[-.55,46,17],[1.1,36,14],[-1.1,36,14]])f.push(...R(P([0,10],[w/2,10+l*.45],[0,10+l],[-w/2,10+l*.45]),a,0,10));
    return {fill:U(unite(f),ellipse(0,8,36,6,48)),lines:[[[0,14],[0,56]],[[6,14],[24,48]],[[-6,14],[-24,48]]]}};
  M.cloud=()=>({fill:U(rrect(-46,10,46,32,11),circle(-24,36,17,48),circle(4,46,23,56),circle(28,36,15,48)),lines:[]});
  M.rainCloud=()=>{const c=M.cloud();const drops=[];for(const [x,y] of [[-28,0],[-12,-6],[4,2],[20,-4],[34,4]])drops.push(...U(circle(x,y,3,16),P([x-2.8,y+1],[x,y+9],[x+2.8,y+1])));
    return {fill:U(move(c.fill,0,24),drops),lines:[]}};
  M.sun=()=>{const f=[...circle(0,50,24,64)];for(let i=0;i<12;i++){const a=i*TAU/12;f.push(...R(P([-5,50+28],[5,50+28],[0,50+46]),a,0,50))}
    return {fill:D(unite(f),circle(-8,56,2.5,14),circle(8,56,2.5,14)),lines:[arc(0,48,12,9,200,340,20)]}};
  M.mantis=()=>{const abd=R(ellipse(-20,30,26,9,48),.25,-20,30),tho=S([[[2,38],[14,62]]],6.5),head=P([10,62],[24,70],[18,58]);
    const fore=S([[[13,58],[26,48],[20,36]],[[20,36],[30,44]],[[15,60],[30,54],[26,42]]],4),legs=S([[[0,36],[6,14],[12,4]],[[-6,34],[-10,12],[-16,2]],[[-14,30],[-28,12],[-36,6]]],3);
    const ant=S([bez([20,68],[24,84],[30,90],[40,96]),bez([18,68],[16,86],[20,92],[28,100])],2),wing=R(ellipse(-16,40,24,6,40),.18,-16,40);
    return {fill:D(U(abd,tho,head,fore,legs,ant),circle(18,66,1.3,10)),lines:[[[-38,28],[-4,40]],[[-30,22],[-8,36]]],raised:wing}};
  M.books=()=>{const f=[],lines=[];let y=0;for(const [w,h,dx,a] of [[84,12,0,0],[70,14,-4,.04],[78,10,6,-.03],[60,13,-2,.06],[66,9,4,-.05]]){f.push(...R(rect(-w/2+dx,y,w/2+dx,y+h),a,dx,y+h/2));lines.push([[-w/2+dx+6,y+2],[-w/2+dx+6,y+h-2]],[[w/2+dx-6,y+2],[w/2+dx-6,y+h-2]]);y+=h}
    return {fill:unite(f),lines}};
  M.openBook=()=>{const page=s=>P([0,10],[s*10,16],[s*30,16],[s*46,10],[s*46,64],[s*30,70],[s*10,70],[0,64]);
    const lines=[];for(const s of [-1,1])for(let y=24;y<62;y+=7)lines.push([[s*8,y+3],[s*20,y+5],[s*40,y]]);
    return {fill:U(page(1),page(-1),rect(-48,4,48,10)),lines:[[[0,10],[0,64]],...lines]}};

  const GROUPS=[
    ['Gothic and vampire',[['bat','Bat'],['skull','Skull'],['crossbones','Skull and bones'],['coffin','Coffin'],['tombstone','Tombstone'],['roseWindow','Rose window'],['gothicWindow','Gothic window'],['gothicCross','Gothic cross'],['candles','Candles'],['raven','Raven'],['web','Spider web'],['moon','Crescent moon']]],
    ['Greek and Roman',[['laurel','Laurel wreath'],['helmet','Corinthian helmet'],['temple','Temple'],['amphora','Amphora'],['owl','Owl of Athena'],['lyre','Lyre'],['ionic','Ionic column'],['meander','Greek key border']]],
    ['Zodiac',[['zodiacWheel','Zodiac wheel'],...Object.keys(Z).map(k=>['zodiac-'+k,k[0].toUpperCase()+k.slice(1)])]],
    ['Fantasy',[['dragon','Dragon'],['castle','Castle'],['crystal','Crystals'],['wizardHat','Wizard hat'],['potion','Potion'],['mushroomSil','Toadstool'],['tree','Gnarled tree']]],
    ['Dungeons and dragons',[['d20','D20'],['swordShield','Sword and shield'],['chest','Treasure chest'],['scroll','Scroll'],['dice','Dice']]],
    ['Flowers, sky and more',[['rose','Rose'],['tulip','Tulip'],['sunflower','Sunflower'],['lotusSil','Lotus'],['cloud','Cloud'],['rainCloud','Rain cloud'],['sun','Sun'],['mantis','Praying mantis'],['books','Stack of books'],['openBook','Open book']]]
  ];
  const MOTIFS=[];for(const [g,list] of GROUPS)for(const [k,n] of list)MOTIFS.push([k,n,g]);

  /* a motif scaled to height h (mm), centred on x=0 with its foot at y=0 */
  function motif(key,h){
    const m=(M[key]||M.mantis)(),all=[...m.fill];const b=HP.bounds(all.length?all:[[[0,0],[1,1],[0,1]]]),k=h/(b.y1-b.y0);
    const tf=r=>r.map(q=>q.map(([x,y])=>[(x-b.cx)*k,(y-b.y0)*k]));
    return {fill:tf(m.fill),lines:(m.lines||[]).map(l=>l.map(([x,y])=>[(x-b.cx)*k,(y-b.y0)*k])),raised:m.raised?tf(m.raised):null,dots:m.dots?tf(m.dots):null,thin:!!m.thin,k};
  }

  /* ---------- the printable pieces ---------- */
  function baseShape(kind,w,h){
    if(kind==='round'){const r=Math.max(w,h)/2;return circle(0,h/2,r,120)}
    if(kind==='oval')return ellipse(0,h/2,w/2*1.12,h/2*1.12,120);
    if(kind==='shield')return [[[-w/2,h],[w/2,h],[w/2,h*.45],[w*.3,h*.12],[0,0],[-w*.3,h*.12],[-w/2,h*.45]]];
    if(kind==='arch')return unite(rect(-w/2,0,w/2,h-w/2),circle(0,h-w/2,w/2,96));
    if(kind==='hex')return ngon(0,h/2,Math.max(w,h)/2*1.05,6,Math.PI/6);
    return rrect(-w/2,0,w/2,h,Math.min(w,h)*.08);
  }
  /* o: {motif, form: plaque | stencil | cutout | ornament, size (height, mm), base, border, colour, mount, md, mh} */
  function piece(o){
    const h=o.size,a=motif(o.motif,h),lw=Math.max(.9,h*.012),notes=[],parts=[],form=o.form;let magnets=0;
    const ab=HP.bounds(a.fill),aw=ab.x1-ab.x0,eng=a.lines.length?intersect(stroke(a.lines,lw),offset(a.fill,-.4)):[];
    const art=a.fill,ah=1.2,two=o.colour==='two',P_=(z0,z1,r,op)=>G.prism(z0,z1,r,op);
    if(form==='plaque'||form==='stencil'){
      const m=h*.14,bw=aw+2*m,bh=h+2*m;let out=move(baseShape(o.base,bw,bh),0,-m);
      if(o.base==='round'||o.base==='hex'){const ob=HP.bounds(out);out=move(out,0,-(ob.y0+m))}
      const mt=HM.backMount(o,out,{min:2});const dy=mt.dy,bt=mt.bt,f=[...mt.f];magnets=mt.magnets;notes.push(...mt.notes);
      const mv=r=>move(r,0,dy);
      if(form==='stencil'){const cut=HM.stencil(mv(out),mv(art),Math.max(1.2,h*.02));f.push(P_(-1,bt+1,cut,'sub'));
        parts.push({file:`stencil-${o.motif}.stl`,role:'Main colour',m:G.build(f)});notes.push('Cut-through artwork: small bridges hold any loose islands in place.');return {parts,notes,magnets}}
      if(o.border==='yes')f.push(P_(bt,bt+ah,subtract(offset(mv(out),-1),offset(mv(out),-1-Math.max(1.2,h*.02)))));
      const af=[P_(bt,bt+ah,mv(art))];if(eng.length)af.push(P_(bt+ah-.6,bt+ah+1,mv(eng),'sub'));
      if(a.raised)af.push(P_(bt+ah,bt+ah+.6,mv(a.raised)));
      if(a.dots)af.push(P_(bt+ah,bt+ah+.6,mv(a.dots)));
      if(two){parts.push({file:`plaque-${o.motif}.stl`,role:'Colour 1',m:G.build(f)},{file:`plaque-${o.motif}-art.stl`,role:'Colour 2',m:G.build(af)});notes.push('Two colours: add the artwork file to the plaque as a part in Creality Print and give it its own CFS slot.')}
      else parts.push({file:`plaque-${o.motif}.stl`,role:'Main colour',m:G.build([...f,...af])});
      return {parts,notes,magnets};
    }
    /* cut-out or ornament: the silhouette itself, printed flat */
    const th=form==='ornament'?2.4:Math.max(3,h*.05);let sil=art;
    if(form==='ornament'){const top=ab.y1;let tx=0;for(const q of art)for(const [x,y] of q)if(y>top-.01)tx=x;sil=unite(sil,subtract(unite(circle(tx,top+3.5,4.5,32),rect(tx-2,top-2,tx+2,top+3)),circle(tx,top+3.5,1.8,20)))}
    const free=form==='cutout'&&o.mount==='free',tw=Math.min(aw*.3,18);
    if(free)sil=unite(sil,rect(-tw,-4,tw,1.5));
    const mt=form==='cutout'&&(o.mount==='magnet'||o.mount==='clip')?HM.backMount(o,sil,{min:2}):{f:[],bt:0,dy:0,magnets:0,notes:[]};
    const dy=mt.dy,bt=mt.bt,f=[...mt.f];magnets=mt.magnets;notes.push(...mt.notes);const mv=r=>move(r,0,dy);
    f.push(P_(bt,bt+th,mv(sil)));if(eng.length)f.push(P_(bt+th-.6,bt+th+1,mv(eng),'sub'));
    const acc=[];if(a.raised)acc.push(P_(bt+th,bt+th+.6,mv(a.raised)));if(a.dots)acc.push(P_(bt+th,bt+th+.6,mv(a.dots)));
    if(acc.length&&two)parts.push({file:`${form}-${o.motif}.stl`,role:'Colour 1',m:G.build(f)},{file:`${form}-${o.motif}-accent.stl`,role:'Colour 2',m:G.build(acc)});
    else parts.push({file:`${form}-${o.motif}.stl`,role:'Main colour',m:G.build([...f,...acc])});
    if(free){const sw=Math.max(30,tw*2+16),sd=Math.max(16,th+12);
      parts.push({file:`${form}-${o.motif}-stand.stl`,role:'Second file',m:G.build([P_(0,6,rrect(-sw/2,-sd/2,sw/2,sd/2,3)),P_(2,7,rect(-tw-.3,-th/2-.2,tw+.3,th/2+.2),'sub')])});
      notes.push('Prints lying flat. The tab at the bottom pushes into the stand; a drop of glue makes it permanent.')}
    if(form==='ornament')notes.push('Hang it from the lid mesh or a twig with thread through the loop.');
    if(a.thin&&h<50)notes.push('This line motif gets thin at small sizes. Make it at least 50 mm tall.');
    return {parts,notes,magnets,separate:free};
  }
  root.HabitatMotifs={M,MOTIFS,motif,piece};
})(typeof window!=='undefined'?window:globalThis);
