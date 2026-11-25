// HB HQ 서비스워커: 껍데기만 저장. 네트워크 먼저(no-store), 안 되면 저장본. version.json·dev/ 는 저장하지 않음. v9/(옛 화면)는 자기 서비스워커가 맡는다.
const C='hq-shell';
const SHELL=['./','index.html','manifest.webmanifest','hq-192.png','hq-512.png'];
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(C).then(c=>c.addAll(SHELL.map(u=>new Request(u,{cache:'reload'}))).catch(()=>{})))});
self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));
self.addEventListener('fetch',e=>{
  const u=new URL(e.request.url),root=new URL('./',self.location).pathname,p=u.pathname.startsWith(root)?u.pathname.slice(root.length):'';
  if(e.request.method!=='GET'||u.origin!==location.origin||/version\.json$/.test(u.pathname)||/^(dev|v9)\//.test(p))return;
  e.respondWith((async()=>{
    const c=await caches.open(C);   // 옛 화면 저장본(wc-shell)과 섞이지 않게 이 저장소 안에서만 찾는다
    try{const n=new URL(e.request.url);n.searchParams.set('v',Date.now());
      const r=await fetch(n,{cache:'no-store'});if(r.ok)c.put(e.request,r.clone());return r}
    catch(err){const m=await c.match(e.request,{ignoreSearch:true});if(m)return m;if(e.request.mode==='navigate'&&!/^v3\//.test(p)){const s=await c.match('index.html');if(s)return s}return Response.error()}
  })());
});
