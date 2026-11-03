/* Replaces the Claude runtime with services that live on this device. */
(function(){
  const PRE='workshop:';
  const key=c=>PRE+'db:'+c;
  const read=c=>{try{return JSON.parse(localStorage.getItem(key(c)))||{}}catch{return {}}};
  const write=(c,o)=>{localStorage.setItem(key(c),JSON.stringify(o));subs.filter(s=>s.c===c).forEach(s=>s.fire())};
  const subs=[];
  const snap=(id,d)=>({id,exists:d!==undefined,data:()=>d});
  const docRef=(c,id)=>({id,
    async get(){return snap(id,read(c)[id])},
    async set(d){const o=read(c);o[id]=JSON.parse(JSON.stringify(d));write(c,o)},
    async update(d){const o=read(c);o[id]={...(o[id]||{}),...d};write(c,o)},
    async delete(){const o=read(c);delete o[id];write(c,o)}
  });
  const collection=c=>({
    doc:id=>docRef(c,id),
    onSnapshot(cb){const s={c,fire(){const o=read(c);cb({docs:Object.keys(o).map(k=>snap(k,o[k]))})}};subs.push(s);setTimeout(s.fire,0);return()=>subs.splice(subs.indexOf(s),1)}
  });
  addEventListener('storage',e=>{if(e.key&&e.key.startsWith(PRE+'db:')){const c=e.key.slice((PRE+'db:').length);subs.filter(s=>s.c===c).forEach(s=>s.fire())}});
  let conn=null;
  const idb=()=>conn||(conn=new Promise((ok,no)=>{const r=indexedDB.open('workshop',1);r.onupgradeneeded=()=>r.result.createObjectStore('blobs');r.onsuccess=()=>{r.result.onclose=()=>{conn=null};ok(r.result)};r.onerror=()=>{conn=null;no(r.error)}}));
  const tx=async(mode,fn)=>{const d=await idb();return new Promise((ok,no)=>{const t=d.transaction('blobs',mode),q=fn(t.objectStore('blobs'));t.oncomplete=()=>ok(q&&q.result);t.onerror=()=>no(t.error);t.onabort=()=>no(t.error||new Error('aborted'))})};
  /* Large phone photos are reduced, which saves space and keeps them within the API image limit. */
  async function shrink(b,max){
    if(!b.type.startsWith('image/'))return b;
    try{
      const im=await createImageBitmap(b),k=Math.min(1,max/Math.max(im.width,im.height));
      if(k===1&&b.size<4e6){im.close&&im.close();return b}
      const c=document.createElement('canvas');c.width=Math.round(im.width*k);c.height=Math.round(im.height*k);c.getContext('2d').drawImage(im,0,0,c.width,c.height);im.close&&im.close();
      return await new Promise(ok=>c.toBlob(r=>ok(r||b),'image/jpeg',.85));
    }catch{return b}
  }
  const urls=new Map();
  window.workshopBlobs={
    put:(id,b)=>tx('readwrite',s=>s.put(b,id)),get:id=>tx('readonly',s=>s.get(id)),
    all:async()=>{const keys=await tx('readonly',s=>s.getAllKeys());const out={};for(const k of keys)out[k]=await tx('readonly',s=>s.get(k));return out}
  };
  window.__blob=async id=>{if(urls.has(id))return urls.get(id);const b=await workshopBlobs.get(id);if(!b)return '';const u=URL.createObjectURL(b);urls.set(id,u);return u};
  const assets={async upload(file){const b=await shrink(file,1600),id=Array.from(crypto.getRandomValues(new Uint8Array(16))).map(x=>x.toString(16).padStart(2,'0')).join('');await workshopBlobs.put(id,b);return {id,url:await window.__blob(id),sizeBytes:b.size,contentType:b.type}}};
  const downloads={async save({filename,data}){
    const blob=data instanceof Blob?data:new Blob([data]);
    const file=new File([blob],filename,{type:blob.type||'application/octet-stream'});
    if(/iPhone|iPad/.test(navigator.userAgent)&&navigator.canShare&&navigator.canShare({files:[file]})){
      try{await navigator.share({files:[file]});return {status:'saved'}}catch(e){if(e.name==='AbortError')throw {code:'declined'};if(e.name==='NotAllowedError')throw {code:'tap_again'}}
    }
    const u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download=filename;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),30000);
    return {status:'saved'};
  }};
  const b64=b=>new Promise((ok,no)=>{const r=new FileReader();r.onload=()=>ok(String(r.result).split(',')[1]);r.onerror=no;r.readAsDataURL(b)});
  async function ask(prompt,opts={}){
    const k=localStorage.getItem(PRE+'apikey');if(!k)throw {code:'no_key'};
    const content=[];
    for(const raw of opts.images||[]){const i=await shrink(raw,1568);content.push({type:'image',source:{type:'base64',media_type:i.type||'image/jpeg',data:await b64(i)}})}
    content.push({type:'text',text:prompt});
    const r=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'content-type':'application/json','x-api-key':k,'anthropic-version':'2023-06-01','anthropic-dangerous-direct-browser-access':'true'},
      body:JSON.stringify({model:'claude-sonnet-5-5',max_tokens:1500,messages:[{role:'user',content}]})});
    if(!r.ok)throw {code:r.status===429?'rate_limited':'failed'};
    const j=await r.json();return j.content.map(c=>c.text||'').join('');
  }
  const sample=async(p,o)=>({text:await ask(p,o),truncated:false});
  sample.json=async(p,o)=>{const t=await ask(p+' Return only the JSON, with no other text.',o);return JSON.parse(t.slice(t.indexOf('{'),t.lastIndexOf('}')+1))};
  sample.limits=async()=>({images:{maxCount:1}});
  const user={id:async()=>'local',isOwner:()=>true,canEdit:()=>true};
  const db={collection,doc:p=>{const i=p.lastIndexOf('/');return docRef(p.slice(0,i),p.slice(i+1))}};
  window.claude={use:async n=>({db,assets,downloads,user,sample:localStorage.getItem(PRE+'apikey')?sample:null})[n]??null};
})();
