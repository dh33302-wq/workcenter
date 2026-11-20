// 앱 껍데기만 저장. 네트워크 먼저(no-store), 안 되면 저장본. version.json·dev/는 저장하지 않음.
const C='wc-shell';
const SHELL=['./','index.html','manifest.webmanifest','icon-192.png','icon-512.png'];
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(C).then(c=>c.addAll(SHELL).catch(()=>{})))});
self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));
self.addEventListener('fetch',e=>{
  const u=new URL(e.request.url);
  if(e.request.method!=='GET'||u.origin!==location.origin||/version\.json$/.test(u.pathname)||u.pathname.includes('/dev/'))return;
  e.respondWith((async()=>{
    try{const n=new URL(e.request.url);n.searchParams.set('v',Date.now());
      const r=await fetch(n,{cache:'no-store'});if(r.ok){const c=await caches.open(C);c.put(e.request,r.clone())}return r}
    catch(err){const m=await caches.match(e.request,{ignoreSearch:true});return m||caches.match('index.html')}
  })());
});
