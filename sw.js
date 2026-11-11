const V='workshop-habitat-20';
const FILES=['./','index.html','shim.js','manifest.webmanifest','icon-180.png','icon-192.png','icon-512.png','pages/hub.html','pages/resin.html','pages/sewing.html','pages/habitat.html','pages/habitat-parts.js?v=20','pages/habitat-enclosure.js?v=20','pages/habitat-more.js?v=20','pages/habitat-motifs.js?v=20','pages/habitat-keep.js?v=20','pages/habitat-sets.js?v=20','pages/skull-scan.bin?v=20','pages/raven-scan.bin?v=20','pages/ravenskull-scan.bin?v=20','pages/python-scan.bin?v=20','pages/bat-scan.bin?v=20','pages/moth-scan.bin?v=20','pages/habitat-sculpt.js?v=20','lib/sdf.js?v=20','pages/habitat-trim.js?v=20','pages/habitat-addons.js?v=20','pages/habitat-forms.js?v=20','lib/geo.js?v=20','lib/earcut.min.js','lib/clipper.js','lib/jspdf.umd.min.js'];
self.addEventListener('install',e=>e.waitUntil(caches.open(V).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x.startsWith('workshop-')&&x!==V).map(x=>caches.delete(x)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{
  const u=new URL(e.request.url);
  if(e.request.method!=='GET'||u.hostname==='api.anthropic.com')return;
  const page=e.request.mode==='navigate'||/\.(html|js|css|webmanifest)$/.test(u.pathname);
  if(page&&u.origin===location.origin){
    /* Pages and scripts come from the network when possible, so a new page never runs with an old script. */
    e.respondWith(fetch(e.request).then(n=>{const c=n.clone();caches.open(V).then(x=>x.put(e.request,c));return n}).catch(()=>caches.match(e.request).then(r=>r||caches.match('index.html'))));
    return;
  }
  e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request).then(n=>{if(u.hostname.includes('fonts.g')||u.origin===location.origin){const c=n.clone();caches.open(V).then(x=>x.put(e.request,c))}return n})));
});
