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
// 폰 알림(웹 푸시): 보여 주고, 받은 시각을 적어 둔다(앱을 열 때 PC로 감). 누르면 그 방으로
const ROOM=/^[a-z]{2,10}(\/[A-Za-z0-9_-]{1,40})?$/;
self.addEventListener('push',e=>{let d={};try{d=e.data.json()}catch(x){}
  const room=ROOM.test(d.room||'')?d.room:'lobby',title=String(d.title||'HB HQ').slice(0,80);
  e.waitUntil((async()=>{
    await self.registration.showNotification(title,{body:String(d.body||'').slice(0,300),icon:'hq-192.png',badge:'hq-badge-96.png',tag:String(d.tag||d.i||'hq'),renotify:true,silent:!!d.silent,data:{room}});
    if(d.i){const c=await caches.open('hq-push');await c.put('push-log/'+encodeURIComponent(d.i),new Response(JSON.stringify({i:String(d.i),ms:Date.now()})))}
  })())});
self.addEventListener('notificationclick',e=>{e.notification.close();const room=(e.notification.data||{}).room||'lobby',base=new URL('./',self.location).href;
  e.waitUntil((async()=>{const all=await clients.matchAll({type:'window',includeUncontrolled:true}),w=all.find(c=>c.url.split(/[#?]/)[0].replace(/index\.html$/,'')===base);
    if(w){try{await w.focus()}catch(x){}w.postMessage({hqRoom:room});return}
    return clients.openWindow(base+'#'+room)})())});
