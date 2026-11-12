/* Habitat, more enclosure forms:
   - hexCell: a hexagonal cell that hangs on the wall, its clear front facing the room; cells sit side by side as a
     honeycomb. The shell prints in one piece standing on its back (the back is the first layers), so every wall is
     vertical and needs no supports. The clear front is a hexagon of acrylic or PET held in a magnetic front frame.
   - hanger: brackets that clip over the lid and under the base, with keyholes, to hang a shallow enclosure on the wall.
   - carry: a carrying handle that holds the enclosure from under the base, for fairs and handovers. */
(function(root){
  const G=root.Geo;
  const {rect,rrect,circle,ngon,move,offset,intersect,subtract,unite,prism,build,varying}=G;
  const {sin,cos,PI,min,max,abs,sqrt,round,floor}=Math;
  const U=(...a)=>{let r=null;for(const x of a)if(x&&x.length)r=r?unite(r,x):x;return r||[]};
  const rot=(rings,a)=>{const c=cos(a),s=sin(a);return rings.map(q=>q.map(([x,y])=>[x*c-y*s,x*s+y*c]))};

  /* ---------- hexagonal wall cell ---------- */
  /* p: W (across the flats, floor to ceiling), D (depth from the wall), S (substrate lip), T (front sheet), hole, bar
     (vent slots), dMagD, dMagH */
  function hexCell(p,pv){
    const W=p.W,D=p.D,R=W/sqrt(3),t=2.4,bt=3,md=p.dMagD||10,mh=p.dMagH||3,hole=Math.min(2.2,max(1,p.hole||1.6)),bar=max(1.2,p.bar||1.6);
    const hex=r=>ngon(0,0,r,6,0),outer=hex(R),inner=hex(R-t/cos(PI/6)),V=k=>[R*cos(k*PI/3),R*sin(k*PI/3)];
    /* the walls, band by band: the vent bands have tall narrow slots through the top wall (the ceiling), so the only
       overhangs are short bridges at the tops of the slots */
    const ring=subtract(outer,inner),slots=[],z0=bt+12,z1=D-16;
    for(const k of [1]){const [ax,ay]=V(k),[bx,by]=V(k+1),L=Math.hypot(bx-ax,by-ay),ux=(bx-ax)/L,uy=(by-ay)/L,nx=uy,ny=-ux;
      const n=floor((L-24)/(hole+bar));for(let i=0;i<n;i++){const s=12+(L-24-n*(hole+bar))/2+i*(hole+bar)+bar/2,cx=ax+ux*s,cy=ay+uy*s;
        slots.push([[cx-nx*4,cy-ny*4],[cx+nx*4,cy+ny*4],[cx+nx*4+ux*hole,cy+ny*4+uy*hole],[cx-nx*4+ux*hole,cy-ny*4+uy*hole]])}}
    const vent=subtract(ring,U(...slots.map(q=>{let a=0;for(let i=0;i<4;i++){a+=q[i][0]*q[(i+1)%4][1]-q[(i+1)%4][0]*q[i][1]}return [a<0?q.reverse():q]})));
    const f=[prism(0,bt,outer)];let zc=bt;
    for(let zz=z0;zz+8<z1;zz+=40){f.push(prism(zc,zz,ring),prism(zz,min(z1,zz+34),vent));zc=min(z1,zz+34)}
    f.push(prism(zc,D,ring));
    /* the back: two keyholes for screws in the wall, and vent slots */
    for(const x of [-R*.35,R*.35]){f.push(prism(-1,bt+1,U(circle(x,W*.18,4.2,32),rect(x-2.1,W*.18,x+2.1,W*.18+9),circle(x,W*.18+9,2.1,20)),'sub'))}
    for(let x=-R*.4;x<=R*.4;x+=hole+bar)f.push(prism(-1,bt+1,rect(x,-W*.05,x+hole,W*.08),'sub'));
    /* the substrate lip at the front of the floor: a solid wedge that rises at 45° to a short wall at the front, so it
       holds the substrate in when the front comes off */
    const Sl=Math.min(p.S||15,18,W*.15),fy=-W/2+t;
    f.push(varying(D-3-Sl,D,z=>{const top=Math.min(Sl,z-(D-3-Sl));return top<=.3?[]:intersect(inner,rect(-R,fy-1,R,fy+top))},.3));
    /* magnet seats in four corners at the front: they widen at 45° so they need no supports */
    const seats=[0,3,4,5].map(k=>V(k));
    for(const [x,y] of seats){const c=[x*(1-(md/2+3.4)/R),y*(1-(md/2+3.4)/R)];
      f.push(varying(D-md-14,D,z=>intersect(outer,circle(c[0],c[1],max(.1,min(md/2+4.5,(z-(D-md-14))*1)),40)),.3));
      f.push(prism(D-mh-.2,D+1,G.mag(c[0],c[1],md),'sub'))}
    const shell=build(f);
    /* the front frame: a hexagon ring, with a recess at the back for the clear sheet and four magnets */
    const fw=9,open=hex(R-fw/cos(PI/6)),sheet=hex(R-(fw-4.5)/cos(PI/6)),T=p.T||2,ft=T+2.2;
    const ff=[prism(0,ft,subtract(outer,open)),prism(ft-T-.2,ft+1,sheet,'sub')];
    for(const [x,y] of seats){const c=[x*(1-(md/2+3.4)/R),y*(1-(md/2+3.4)/R)];ff.push(prism(ft-mh-.2-T-.2,ft+1,G.mag(c[0],c[1],md),'sub'),prism(ft-T-.2,ft,intersect(circle(c[0],c[1],md/2+3,40),outer)))}
    for(let x=-R*.42;x<=R*.42;x+=hole+bar)ff.push(prism(-1,ft+1,rect(x,W/2-fw+1.2,x+hole,W/2-1.8),'sub'));
    const frame=build(ff);
    /* a link: a bow-tie key that joins two cells at the back */
    const notch=r=>[[-r*.5,0],[-r,6],[r,6],[r*.5,0]];
    const link=build([prism(0,bt-.3,U([[...notch(5.6).map(([x,y])=>[x,y])]],[[...notch(5.6).map(([x,y])=>[x,-y]).reverse()]]))]);
    const flatAcross=(W-2*fw+9).toFixed(0);
    const notes=[`The shell prints standing on its back, with no supports: the back is the first layers and every wall goes straight up.`,
      `Clear front: a hexagon of acrylic or PET, ${flatAcross} mm across the flats (${(2*(R-(fw-4.5)/cos(PI/6))).toFixed(0)} mm corner to corner). It sits in the back of the front frame, which holds to the shell with 4 magnets.`,
      'Hang each cell on two screws through the keyholes. Cells go side by side like a honeycomb: line them up with a spirit level, flat side down.',
      'Feed by lifting the front frame off; mantises move slowly, so this is easy. Air comes in through slots in the ceiling and along the top of the front frame.'];
    const parts=[{name:'Cell shell',file:'hex-cell-shell.stl',tris:shell.tris},{name:'Front frame',file:'hex-cell-front-frame.stl',tris:frame.tris}];
    const cut=[[`Front, clear acrylic or PET ${T} mm, a hexagon`,`${flatAcross} across the flats`]];
    /* the preview: three cells in a honeycomb, as on the wall */
    const items=[],toW=(x,y,z,dx,dz)=>[x+dx,D-z,y+W/2+dz];
    for(const [dx,dz] of [[0,0],[1.5*R,W/2],[0,W]]){if(pv===false)break;
      items.push({tris:place0(shell.tris,(x,y,z)=>toW(x,y,z,dx,dz)),color:'frame'});
      items.push({tris:place0(frame.tris,(x,y,z)=>toW(x,y,D+ft-z,dx,dz)),color:'frame'});
      items.push({tris:build([prism(0,1,sheet)]).tris.map((v,i)=>v).length?place0(build([prism(0,1,sheet)]).tris,(x,y,z)=>toW(x,y,D+.5+z,dx,dz)):[],color:'clear',alpha:.3})}
    const readme=`Hexagonal wall cell, ${W} mm across the flats, ${D} mm deep\n\nTo cut:\n- ${cut[0][0]}: ${cut[0][1]} mm\n\nMagnets: 8 per cell (${md} × ${mh} mm), 4 in the shell and 4 in the front frame. Check the poles attract, then press each magnet into its pocket with a flat tool or a small vice: the little ribs hold it, no glue.\n\n`+notes.map(n=>'- '+n).join('\n')+'\n';
    return {parts,items,cut,notes,readme,tag:`hex-cell-${W}x${D}`,link};
  }
  function place0(t,fn){const o=new Float32Array(t.length);for(let i=0;i<t.length;i+=3){const p=fn(t[i],t[i+1],t[i+2]);o[i]=p[0];o[i+1]=p[1];o[i+2]=p[2]}return o}

  /* ---------- wall hanger: two brackets that hold the enclosure from under the base and over the lid ---------- */
  function hanger(o){
    const Ht=o.Htot||300,Lt=o.Lt||2.4,w=24,t=4,hook=12,parts=[],notes=[];
    /* printed lying on its back: the strip is the bar against the wall, the hooks stand up from it */
    const L=Ht+t*2+.6,f=[prism(0,t,rrect(0,0,w,L,3))];
    f.push(prism(t,t+hook,rect(0,0,w,t)),varying(t+hook-4.6,t+hook,z=>rect(0,0,w,t+Math.max(.05,Math.min(3,z-(t+hook-4.6)))),.3));
    f.push(prism(t,t+hook,rect(0,L-t,w,L)),varying(t+hook-4.6,t+hook,z=>rect(0,L-t-Math.max(.05,Math.min(3,z-(t+hook-4.6))),w,L),.3));
    for(const y of [L*.3,L*.7])f.push(prism(-1,t+1,U(circle(w/2,y,4.2,32),rect(w/2-2.1,y,w/2+2.1,y+9),circle(w/2,y+9,2.1,20)),'sub'));
    const m=build(f);
    if(L>max(...(o.bed||[350,350])))notes.push('The bracket is longer than your bed: turn it diagonally, or make the enclosure lower.');
    notes.push('Print 2. Each bracket goes behind the enclosure near a side: the bottom hook goes under the back edge of the base, the top hook over the back edge of the lid, then screw the bracket to the wall through the keyholes.',
      'Hang only shallow enclosures with little substrate, and screw into a stud or with wall plugs.');
    parts.push({file:'wall-hanger.stl',role:'Main colour',m,count:2});
    return {parts,notes,magnets:0};
  }

  /* ---------- carrying handle ---------- */
  function carry(o){
    const W=o.W||200,Ht=o.Htot||300,w=22,t=5,parts=[],notes=[],up=40;
    /* two side straps: a bar up each side, a foot that reaches under the base, and a peg at the top */
    const L=Ht+up,sf=[prism(0,t,rrect(0,0,w,L,3)),prism(t,t+14,rect(0,0,w,t)),varying(t+2,t+14,z=>rect(0,0,w,t+Math.max(.05,Math.min(10,z-(t+2)))),.3),prism(t,t+3.2,circle(w/2,L-10,5,32))];
    parts.push({file:'carry-side.stl',role:'Main colour',m:build(sf),count:2});
    /* the handle: a bar across the top with a grip, and a socket at each end for the pegs */
    const span=W+2*t+4,hf=[prism(0,8,rrect(-10,-w/2,span+10,w/2,6)),prism(-1,9,circle(0,0,5.25,32),'sub'),prism(-1,9,circle(span,0,5.25,32),'sub')];
    hf.push(prism(8,22,rrect(span*.3,-6,span*.7,6,5)),prism(8,10,rrect(span*.3-3,-8,span*.7+3,8,5)));
    parts.push({file:'carry-handle.stl',role:'Second file',m:build(hf)});
    if(span+20>max(...(o.bed||[350,350])))notes.push('The handle is longer than your bed: it needs a bigger printer, or turn it diagonally.');
    notes.push('Stand a side strap against each side of the enclosure, its foot under the base. Push the handle onto the two pegs above the lid. Carry it level, and only with little substrate inside.');
    notes.push('The straps print lying flat; the handle prints flat with the grip on top.');
    return {parts,notes,magnets:0};
  }

  root.HabitatForms={hexCell,hanger,carry};
})(typeof window!=='undefined'?window:globalThis);
