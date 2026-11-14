const V='workshop-habitat-42';
const FILES=['./','index.html','shim.js','manifest.webmanifest','icon-180.png','icon-192.png','icon-512.png','pages/hub.html','pages/resin.html','pages/sewing.html','pages/habitat.html','pages/habitat-parts.js?v=42','pages/habitat-enclosure.js?v=42','pages/habitat-more.js?v=42','pages/habitat-motifs.js?v=42','pages/habitat-keep.js?v=42','pages/habitat-pots.js?v=42','pages/habitat-sets.js?v=42','pages/skull-scan.bin?v=42','pages/raven-scan.bin?v=42','pages/ravenskull-scan.bin?v=42','pages/python-scan.bin?v=42','pages/bat-scan.bin?v=42','pages/moth-scan.bin?v=42','pages/habitat-sculpt.js?v=42','lib/sdf.js?v=42','pages/habitat-trim.js?v=42','pages/habitat-addons.js?v=42','pages/habitat-forms.js?v=42','pages/habitat-shapes.js?v=42','order.html','lib/geo.js?v=42','lib/earcut.min.js','lib/clipper.js','lib/jspdf.umd.min.js','pages/prints.html','pages/prints-potinsert.js?v=2','pages/prints-catchcup.js?v=1','pages/prints-runner.js?v=1','pages/prints-dollchair.js?v=1','pages/prints-dicetower.js?v=1','pages/prints-armour.js?v=5','pages/prints-gauntlet.js?v=4','pages/prints-suit.js?v=4','pages/prints-hounskull.js?v=1','pages/prints-necro.js?v=1','pages/prints-jester.js?v=2','pages/prints-armour-lib.js?v=3','pages/prints-filigree-lib.js?v=1','lib/manifold/manifold.js','lib/manifold/manifold.wasm','lib/manifold/garbage-collector.js'];
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
