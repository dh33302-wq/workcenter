/* HONEY BADGER 3D 키우기 탭 뼈대 — 직접 만든 블록아웃(외부 모델 없음). 탭 열 때만 로딩. */
(function(){
const W={on:false};window.World=W;
const DOORS=[{id:'director',nm:'대표실',x:-8,z:-10,c:0xCEA85E},{id:'studio',nm:'작업실',x:8,z:-10,c:0x7AA4D2},{id:'ops',nm:'운영실',x:-8,z:10,c:0x68B096},{id:'out',nm:'퇴근(스타게이저)',x:8,z:10,c:0xB58AC8}];
const LW=22,LD=30,H=6; // 호텔 로비(B 27x42x7)의 비례 축소
let R,scene,cam,player,joy={x:0,y:0},keys={},raf=0,last=0,frames=0,t0=0,near=null,host,label,staffM=[],sg;
function box(w,h,d,col,x,y,z,em){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshStandardMaterial({color:col,roughness:.85,metalness:.05,emissive:em||0x000000}));m.position.set(x,y,z);scene.add(m);return m}
function person(col,scale){const g=new THREE.Group();
  const body=new THREE.Mesh(new THREE.CylinderGeometry(.3,.38,1.0,8),new THREE.MeshStandardMaterial({color:col,roughness:.8}));body.position.y=.9;g.add(body);
  const head=new THREE.Mesh(new THREE.SphereGeometry(.26,10,8),new THREE.MeshStandardMaterial({color:0xd8c4a8,roughness:.9}));head.position.y=1.65;g.add(head);
  const leg=new THREE.Mesh(new THREE.BoxGeometry(.5,.45,.28),new THREE.MeshStandardMaterial({color:0x222226}));leg.position.y=.22;g.add(leg);
  g.scale.setScalar(scale||1);scene.add(g);return g}
function build(){
  scene=new THREE.Scene();scene.background=new THREE.Color(0x07070a);scene.fog=new THREE.Fog(0x07070a,18,60);
  scene.add(new THREE.HemisphereLight(0xb0b4cc,0x3a2e22,1.5));
  const key=new THREE.PointLight(0xffc980,1.6,40);key.position.set(0,H-1.2,0);scene.add(key);
  box(LW,.2,LD,0x2a241c,0,-.1,0);
  box(.4,H,LD,0x3a3540,-LW/2,H/2,0);box(.4,H,LD,0x3a3540,LW/2,H/2,0);
  box(LW,H,.4,0x3a3540,0,H/2,-LD/2);box(LW,H,.4,0x3a3540,0,H/2,LD/2);
  for(const x of[-6,6])for(const z of[-5,5])box(.7,H,.7,0x2a2530,x,H/2,z);
  for(const z of[-8,0,8]){const l=new THREE.PointLight(0xffb870,.5,14);l.position.set(0,H-1,z);scene.add(l);box(1.2,.25,1.2,0xffd9a0,0,H-.5,z,0x553820)}
  DOORS.forEach(d=>{const wz=d.z<0?-LD/2+.3:LD/2-.3;d.wz=wz;box(2.6,4,.3,0x050505,d.x,2,wz);box(2.9,.18,.4,d.c,d.x,4.1,wz,d.c);box(.18,4,.4,d.c,d.x-1.4,2,wz,d.c);box(.18,4,.4,d.c,d.x+1.4,2,wz,d.c)});
  sg=new THREE.Mesh(new THREE.OctahedronGeometry(.9),new THREE.MeshStandardMaterial({color:0xCEA85E,emissive:0x6a5426,roughness:.4}));sg.position.set(0,1.6,0);scene.add(sg);
  box(2.4,.5,2.4,0x2a2530,0,.25,0);
  box(3,2,.2,0x2b2118,0,2.2,-LD/2+.3);box(2.6,1.6,.05,0x3a2e22,0,2.2,-LD/2+.45,0x1a1208);
  const cols=[0xCEA85E,0x68B096,0x68B096,0x68B096,0x7AA4D2,0xB58AC8,0xD2A27A,0x68B096];
  staffM=cols.map((c,i)=>{const col=i%4,row=i<4?0:1,px=-7.5+col*5,pz=0+row*5.5;
    box(1.8,.1,.9,0x2f261b,px,.85,pz);box(.1,.85,.1,0x1b1b1b,px-.8,.42,pz);box(.1,.85,.1,0x1b1b1b,px+.8,.42,pz);
    const p=person(c,.9);p.position.set(px,0,pz+.9);p.rotation.y=Math.PI;
    const mark=new THREE.Mesh(new THREE.ConeGeometry(.16,.4,4),new THREE.MeshBasicMaterial({color:0xE0443B}));mark.position.set(px,2.9,pz+.9);mark.visible=false;scene.add(mark);return{p,mark}});
  player=person(0xe8e2d2,1);player.position.set(0,0,12);
  cam=new THREE.PerspectiveCamera(58,1,.1,80);
}
function resize(){if(!R||!host)return;const w=host.clientWidth||300,h=host.clientHeight||300;R.setSize(w,h,false);cam.aspect=w/h;cam.updateProjectionMatrix()}
function loop(t){raf=requestAnimationFrame(loop);const dt=Math.min(.05,(t-last)/1000||.016);last=t;frames++;
  let ix=joy.x+((keys.d||keys.ArrowRight)?1:0)-((keys.a||keys.ArrowLeft)?1:0),iz=joy.y+((keys.s||keys.ArrowDown)?1:0)-((keys.w||keys.ArrowUp)?1:0);
  const L=Math.hypot(ix,iz);if(L>1){ix/=L;iz/=L}
  if(L>.05){const sp=5.2;player.position.x=Math.max(-LW/2+1,Math.min(LW/2-1,player.position.x+ix*sp*dt));player.position.z=Math.max(-LD/2+1.2,Math.min(LD/2-1.2,player.position.z+iz*sp*dt));player.rotation.y=Math.atan2(ix,iz);player.children[0].position.y=.9+Math.sin(t/90)*.04}
  cam.position.set(player.position.x*.8,9,Math.min(LD/2-.6,player.position.z+9));cam.lookAt(player.position.x,1.2,player.position.z-1.5);
  sg.rotation.y+=dt*.8;
  near=null;for(const d of DOORS){if(Math.hypot(player.position.x-d.x,player.position.z-d.wz)<3.2)near=d}
  if(!near&&Math.hypot(player.position.x,player.position.z-(-LD/2+.5))<3)near={id:'studio',nm:'게시판 → 작업실 퀘스트'};
  label.textContent=near?('▶ '+near.nm+' 들어가기'):'';host.classList.toggle('near',!!near);
  R.render(scene,cam);
  if(t-t0>1000){W.fps=Math.round(frames*1000/(t-t0));frames=0;t0=t;const f=document.getElementById('w-fps');if(f)f.textContent=W.fps+' fps'}
}
W.setStaff=function(states){(states||[]).forEach((s,i)=>{const m=staffM[i];if(!m)return;m.mark.visible=s==='block';m.p.scale.y=s==='rest'?.7:.9})};
W.enter=function(){if(near)location.hash='#'+near.id};
W.teleport=function(x,z){if(player){player.position.x=x;player.position.z=z}};
W.start=function(el){host=el;W.on=true;
  host.innerHTML='<canvas id="w-cv"></canvas><div id="w-hud"><span id="w-fps"></span><b id="w-lab"></b></div><div id="w-joy"><i></i></div><button id="w-go" aria-label="들어가기">들어가기</button><p id="w-hint">스틱(또는 WASD)으로 이동 · 문 앞에서 들어가기</p>';
  label=host.querySelector('#w-lab');const cv=host.querySelector('#w-cv');
  if(R){try{R.dispose()}catch(e){}R=null}
  R=new THREE.WebGLRenderer({canvas:cv,antialias:false,powerPreference:'low-power'});R.setPixelRatio(Math.min(devicePixelRatio||1,1.5));
  if(!scene)build();
  resize();
  const joyEl=host.querySelector('#w-joy'),knob=joyEl.firstChild;let aid=null,cx=0,cy=0;
  const mv=e=>{const dx=e.clientX-cx,dy=e.clientY-cy,m=Math.min(1,Math.hypot(dx,dy)/45),a=Math.atan2(dy,dx);joy.x=Math.cos(a)*m;joy.y=Math.sin(a)*m;knob.style.transform='translate('+joy.x*40+'px,'+joy.y*40+'px)'};
  joyEl.onpointerdown=e=>{aid=e.pointerId;joyEl.setPointerCapture(aid);const r=joyEl.getBoundingClientRect();cx=r.left+r.width/2;cy=r.top+r.height/2;mv(e)};
  joyEl.onpointermove=e=>{if(e.pointerId===aid)mv(e)};
  joyEl.onpointerup=joyEl.onpointercancel=()=>{aid=null;joy.x=joy.y=0;knob.style.transform=''};
  host.querySelector('#w-go').onclick=W.enter;
  W._kd=e=>{keys[e.key]=true;if(e.key==='Enter'||e.key==='e')W.enter()};W._ku=e=>{keys[e.key]=false};
  addEventListener('keydown',W._kd);addEventListener('keyup',W._ku);addEventListener('resize',resize);
  last=performance.now();t0=last;frames=0;cancelAnimationFrame(raf);raf=requestAnimationFrame(loop)};
W.stop=function(){W.on=false;cancelAnimationFrame(raf);removeEventListener('keydown',W._kd);removeEventListener('keyup',W._ku);removeEventListener('resize',resize);keys={};joy.x=joy.y=0};
})();
