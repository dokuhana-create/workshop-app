const V='workshop-habitat-40';
const FILES=['./','index.html','shim.js','manifest.webmanifest','icon-180.png','icon-192.png','icon-512.png','pages/hub.html','pages/resin.html','pages/sewing.html','pages/habitat.html','pages/habitat-parts.js?v=40','pages/habitat-enclosure.js?v=40','pages/habitat-more.js?v=40','pages/habitat-motifs.js?v=40','pages/habitat-keep.js?v=40','pages/habitat-pots.js?v=40','pages/habitat-sets.js?v=40','pages/skull-scan.bin?v=40','pages/raven-scan.bin?v=40','pages/ravenskull-scan.bin?v=40','pages/python-scan.bin?v=40','pages/bat-scan.bin?v=40','pages/moth-scan.bin?v=40','pages/habitat-sculpt.js?v=40','lib/sdf.js?v=40','pages/habitat-trim.js?v=40','pages/habitat-addons.js?v=40','pages/habitat-forms.js?v=40','pages/habitat-shapes.js?v=40','order.html','lib/geo.js?v=40','lib/earcut.min.js','lib/clipper.js','lib/jspdf.umd.min.js'];
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
