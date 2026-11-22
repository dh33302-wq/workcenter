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

/* ---- 플레이어 릭 + 상태머신 (클립 이름 규칙: 3d/README.md) ---- */
const QE=new THREE.Euler(),QQ=new THREE.Quaternion();
function qv(x,y,z){QE.set(x,y,z);QQ.setFromEuler(QE);return[QQ.x,QQ.y,QQ.z,QQ.w]}
function clip(name,dur,nodes,loop){const tr=[];for(const n in nodes){const k=nodes[n],times=[],vals=[];k.forEach(a=>{times.push(a[0]*dur);vals.push(...qv(a[1],a[2],a[3]))});tr.push(new THREE.QuaternionKeyframeTrack(n+'.quaternion',times,vals))}
  const c=new THREE.AnimationClip(name,dur,tr);return c}
function hero(){const g=new THREE.Group();const M=(c,r)=>new THREE.MeshStandardMaterial({color:c,roughness:r||.8});
  const body=new THREE.Group();body.name='Body';body.position.y=.95;g.add(body);
  const torso=new THREE.Group();torso.name='Torso';body.add(torso);
  const tm=new THREE.Mesh(new THREE.CylinderGeometry(.3,.36,.8,8),M(0xe8e2d2));tm.position.y=.35;torso.add(tm);
  const hd=new THREE.Mesh(new THREE.SphereGeometry(.26,10,8),M(0xd8c4a8,.9));hd.position.y=.97;torso.add(hd);
  function limb(n,x,y,len,col,parent){const p=new THREE.Group();p.name=n;p.position.set(x,y,0);const m=new THREE.Mesh(new THREE.BoxGeometry(.2,len,.2),M(col));m.position.y=-len/2;p.add(m);parent.add(p);return p}
  limb('ArmL',-.42,.68,.7,0xCEA85E,torso);const aR=limb('ArmR',.42,.68,.7,0xCEA85E,torso);
  limb('LegL',-.17,0,.95,0x222226,body);limb('LegR',.17,0,.95,0x222226,body);
  const sw=new THREE.Mesh(new THREE.BoxGeometry(.08,.9,.04),new THREE.MeshStandardMaterial({color:0xddddee,emissive:0x333344,roughness:.3,metalness:.6}));sw.position.set(0,-.95,.15);sw.rotation.x=1.2;aR.add(sw);
  g.scale.setScalar(1);scene.add(g);return g}
const PI=Math.PI;
function clips(){
  const sw=(a,b,n)=>[[0,a,0,0],[.25,0,0,0],[.5,-a,0,0],[.75,0,0,0],[1,a,0,0]];
  return[
   clip('Idle',2,{Torso:[[0,.02,0,0],[.5,.05,0,0],[1,.02,0,0]],ArmL:[[0,0,0,.08],[.5,0,0,.14],[1,0,0,.08]],ArmR:[[0,0,0,-.08],[.5,0,0,-.14],[1,0,0,-.08]]}),
   clip('Walk',1,{LegL:sw(.55),LegR:sw(-.55),ArmL:sw(-.4),ArmR:sw(.3),Torso:[[0,.05,0,0],[1,.05,0,0]]}),
   clip('Run',.6,{LegL:sw(1.0),LegR:sw(-1.0),ArmL:sw(-.9),ArmR:sw(.7),Torso:[[0,.3,0,0],[1,.3,0,0]]}),
   clip('Attack1',.45,{ArmR:[[0,-.2,0,-.1],[.25,-2.5,0,-.2],[.55,.5,0,-.1],[1,-.2,0,-.1]],Torso:[[0,0,0,0],[.25,0,.5,0],[.55,.1,-.5,0],[1,0,0,0]]}),
   clip('Attack2',.45,{ArmR:[[0,-.2,0,-.1],[.25,-1.5,-1.0,-1.4],[.55,-1.2,1.0,.6],[1,-.2,0,-.1]],Torso:[[0,0,0,0],[.25,0,-.6,0],[.55,0,.7,0],[1,0,0,0]]}),
   clip('Attack3',.6,{ArmR:[[0,-.2,0,-.1],[.35,-3.0,0,0],[.6,.7,0,0],[1,-.2,0,-.1]],ArmL:[[0,0,0,.1],[.35,-2.6,0,0],[.6,.5,0,0],[1,0,0,.1]],Torso:[[0,0,0,0],[.35,-.3,0,0],[.6,.6,0,0],[1,0,0,0]]}),
   clip('Dodge',.45,{Body:[[0,0,0,0],[.25,-PI/2,0,0],[.5,-PI,0,0],[.75,-PI*1.5,0,0],[1,-PI*2,0,0]]})]}
const ST={mx:null,act:{},cur:'',atkN:0,lock:0,press:0,bufA:0,bufD:0,hitDone:false,hsT:0,ddx:0,ddz:1};
/* ===== 수치 표 (카메라·조작 조정은 여기 한 곳) ===== */
const CAM={yaw:0,pitch:.38,dist:6.2,dMin:3,dMax:11,pMin:-.35,pMax:1.05,fov:58,fovRun:5,fovDodge:8,sens:.0058,kYaw:16,kPos:13,kLock:7,lockPitch:.28,alignDelay:2.2,alignRate:1.6,pivotY:1.55,shoulder:.55,shake:.14,armIn:30,armOut:3};
const CTRL={walkMax:3.4,run:5.4,accel:15,decel:20,turn:12,dodgeSp:8,buf:.25,cancelAtk:.55,cancelDodge:.35,hitAt:.4,hitStop:.05,hitRange:2.8,lockRange:14,stick:46,vib:18};
W.CAM=CAM;W.CTRL=CTRL;
const OPT=Object.assign({sens:1,invY:false,align:true,fx:true,vib:true},(function(){try{return JSON.parse(localStorage.getItem('v3_wcam')||'{}')}catch(e){return{}}})());
function saveOpt(){try{localStorage.setItem('v3_wcam',JSON.stringify(OPT))}catch(e){}}
let C={yaw:0,pitch:CAM.pitch,dist:CAM.dist,cyaw:0,cpitch:CAM.pitch,arm:CAM.dist,fov:CAM.fov,shk:0,idleT:0,lockOn:false,sprint:false};
let VX=0,VZ=0,dummy=null,dummyMat=null,flashT=0,hits=0;
const V=new THREE.Vector3(),P=new THREE.Vector3(),D=new THREE.Vector3();
const dmp=(k,dt)=>1-Math.exp(-k*dt),wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));
function play(n,fade){const a=ST.act[n];if(!a||ST.cur===n&&!/^(Attack|Dodge)/.test(n))return;const o=ST.act[ST.cur];
  a.reset().setEffectiveWeight(1).fadeIn(fade).play();if(o&&o!==a)o.fadeOut(fade);ST.cur=n}
function idleNow(){ST.atkN=0;ST.lock=0;ST.cur='';play('Idle',.18)}
function setupRig(){ST.mx=new THREE.AnimationMixer(player);clips().forEach(c=>{const a=ST.mx.clipAction(c);ST.act[c.name]=a;
  if(/^(Attack|Dodge)/.test(c.name)){a.setLoop(THREE.LoopOnce,1);a.clampWhenFinished=true}});
  ST.mx.addEventListener('finished',e=>{const n=e.action.getClip().name,now=performance.now(),bu=ST.bufA&&now-ST.bufA<=CTRL.buf*1000;if(n!==ST.cur)return; // 이미 다음 동작으로 넘어간 클립의 종료 신호는 무시
    if(/^Attack/.test(n)){if(bu&&ST.atkN<3){ST.bufA=0;doAttack()}else if(ST.bufD&&now-ST.bufD<=CTRL.buf*1000){ST.bufD=0;startDodge()}else idleNow()}
    else if(n==='Dodge'){if(bu){ST.bufA=0;ST.atkN=0;ST.lock=0;doAttack()}else idleNow()}});play('Idle',0)}
function doAttack(){ST.atkN=Math.min(3,ST.atkN+1);ST.lock=1;ST.bufA=0;ST.hitDone=false;play('Attack'+ST.atkN,.1);
  if(ST.press){W.atkLat=+(performance.now()-ST.press).toFixed(1);ST.press=0}}
function startDodge(){ST.lock=2;ST.atkN=0;ST.bufA=0;ST.bufD=0;
  readInput();if(inMag>.2){const n=Math.hypot(inWX,inWZ)||1;ST.ddx=inWX/n;ST.ddz=inWZ/n;player.rotation.y=Math.atan2(ST.ddx,ST.ddz)}else{ST.ddx=Math.sin(player.rotation.y);ST.ddz=Math.cos(player.rotation.y)}
  play('Dodge',.05)}
W.attack=function(){const now=performance.now();ST.press=now;if(ST.lock!==0){ST.bufA=now;return}ST.atkN=0;doAttack()};
W.dodge=function(){const now=performance.now();if(ST.lock===2)return;if(ST.lock===1){ST.bufD=now;return}startDodge()};
W.sprint=function(on){C.sprint=(typeof on==='boolean')?on:!C.sprint;const b=host&&host.querySelector('#w-run');if(b)b.classList.toggle('on',C.sprint);return C.sprint};
W.lock=function(){if(C.lockOn){C.lockOn=false}else if(dummy&&Math.hypot(player.position.x-dummy.position.x,player.position.z-dummy.position.z)<CTRL.lockRange)C.lockOn=true;
  const b=host&&host.querySelector('#w-lock');if(b)b.classList.toggle('on',C.lockOn);return C.lockOn};
W.state=function(){return ST.cur};
W.camInfo=function(){return{yaw:+C.yaw.toFixed(3),pitch:+C.pitch.toFixed(3),dist:+C.dist.toFixed(2),arm:+C.arm.toFixed(2),fov:+C.fov.toFixed(1),lock:C.lockOn,sprint:C.sprint,hits:hits,spd:+Math.hypot(VX,VZ).toFixed(2),px:+player.position.x.toFixed(2),pz:+player.position.z.toFixed(2),ry:+player.rotation.y.toFixed(2),camY:+cam.position.y.toFixed(2),opt:OPT}};
W.setCam=function(o){Object.assign(C,o)};
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
  // 훈련용 허수아비(락온·타격 대상)
  dummyMat=new THREE.MeshStandardMaterial({color:0x8a6a44,roughness:.9,emissive:0x000000});dummy=new THREE.Group();
  const st=new THREE.Mesh(new THREE.CylinderGeometry(.06,.06,1.9,6),new THREE.MeshStandardMaterial({color:0x2a2018}));st.position.y=.95;dummy.add(st);
  const tr=new THREE.Mesh(new THREE.CylinderGeometry(.34,.4,.9,8),dummyMat);tr.position.y=1.25;dummy.add(tr);
  const hd=new THREE.Mesh(new THREE.SphereGeometry(.24,8,6),dummyMat);hd.position.y=1.95;dummy.add(hd);
  dummy.position.set(-3,0,5);scene.add(dummy);W.dummy=dummy.position;
  player=hero();player.position.set(0,0,8.5);setupRig();
  cam=new THREE.PerspectiveCamera(CAM.fov,1,.1,80);
}
function resize(){if(!R||!host)return;const w=host.clientWidth||300,h=host.clientHeight||300;R.setSize(w,h,false);cam.aspect=w/h;cam.updateProjectionMatrix()}
// 입력을 카메라 기준 월드 좌표로 (joy.y>0 = 화면 아래 = 뒤로)
let inWX=0,inWZ=0,inMag=0;
function readInput(){let ix=joy.x+((keys.d||keys.ArrowRight)?1:0)-((keys.a||keys.ArrowLeft)?1:0),iz=joy.y+((keys.s||keys.ArrowDown)?1:0)-((keys.w||keys.ArrowUp)?1:0);
  const L=Math.hypot(ix,iz);if(L>1){ix/=L;iz/=L}inMag=Math.min(1,L);
  const s=Math.sin(C.cyaw),c=Math.cos(C.cyaw); // 카메라 오른쪽=(c,-s), 앞=(-s,-c)
  inWX=ix*c+iz*s;inWZ=-ix*s+iz*c}
function tryHit(){if(!dummy)return;const dx=dummy.position.x-player.position.x,dz=dummy.position.z-player.position.z,d=Math.hypot(dx,dz);
  if(d<CTRL.hitRange&&(dx*Math.sin(player.rotation.y)+dz*Math.cos(player.rotation.y))/(d||1)>.2){hits++;W.hits=hits;ST.hsT=CTRL.hitStop;flashT=.12;dummyMat.emissive.setHex(0xaa4422);
    if(OPT.fx)C.shk=CAM.shake;if(OPT.vib&&navigator.vibrate)try{navigator.vibrate(CTRL.vib)}catch(e){}}}
function loop(t){raf=requestAnimationFrame(loop);const dt=Math.min(.05,(t-last)/1000||.016);last=t;frames++;
  const now=t;let sdt=dt;
  if(ST.hsT>0){ST.hsT-=dt;sdt=0}
  if(flashT>0){flashT-=dt;if(flashT<=0)dummyMat.emissive.setHex(0)}
  readInput();
  if(C.lockOn&&dummy){const d=Math.hypot(player.position.x-dummy.position.x,player.position.z-dummy.position.z);if(d>CTRL.lockRange*1.3){C.lockOn=false;const b=host.querySelector('#w-lock');if(b)b.classList.remove('on')}}
  // 공격 중: 타격 순간·취소 창·선입력(약 0.25초)
  if(ST.lock===1&&ST.act['Attack'+ST.atkN]){const a=ST.act['Attack'+ST.atkN],f=a.time/a.getClip().duration;
    if(!ST.hitDone&&f>=CTRL.hitAt){ST.hitDone=true;tryHit()}
    if(ST.bufA){if(now-ST.bufA>CTRL.buf*1000)ST.bufA=0;else if(f>=CTRL.cancelAtk&&ST.atkN<3)doAttack()}
    if(ST.lock===1&&ST.bufD){if(now-ST.bufD>CTRL.buf*1000)ST.bufD=0;else if(f>=CTRL.cancelDodge)startDodge()}}
  // 속도: 가속·감속
  let tvx=0,tvz=0;
  if(ST.lock===0){let sp=0;if(inMag>=.12)sp=(C.sprint||inMag>=.62)?CTRL.run:1.1+inMag*(CTRL.walkMax-1.1)/.62;
    if(inMag>=.12){const n=Math.hypot(inWX,inWZ)||1;tvx=inWX/n*sp;tvz=inWZ/n*sp}
    const k=sp>Math.hypot(VX,VZ)?CTRL.accel:CTRL.decel,m=Math.min(1,k*sdt);VX+=(tvx-VX)*m;VZ+=(tvz-VZ)*m;
    const s=Math.hypot(VX,VZ),want=s<.35?'Idle':(s<3.7?'Walk':'Run');play(want,.18);
    if(want==='Walk')ST.act.Walk.timeScale=Math.max(.5,s/3.1);if(want==='Run')ST.act.Run.timeScale=Math.max(.7,s/5.4)}
  else if(ST.lock===2){VX=ST.ddx*CTRL.dodgeSp;VZ=ST.ddz*CTRL.dodgeSp}
  else{const m=Math.min(1,CTRL.decel*sdt);VX-=VX*m;VZ-=VZ*m}
  const sp2=Math.hypot(VX,VZ);
  if(sdt>0){player.position.x=Math.max(-LW/2+1,Math.min(LW/2-1,player.position.x+VX*sdt));player.position.z=Math.max(-LD/2+1.2,Math.min(LD/2-1.2,player.position.z+VZ*sdt))}
  // 회전: 락온이면 대상을 보고, 아니면 이동 방향(턴 속도 제한)
  if(ST.lock!==2&&sdt>0){let tg=null;
    if(C.lockOn&&dummy)tg=Math.atan2(dummy.position.x-player.position.x,dummy.position.z-player.position.z);else if(ST.lock===0&&sp2>.3)tg=Math.atan2(VX,VZ);
    if(tg!==null){const d=wrap(tg-player.rotation.y),mx=CTRL.turn*sdt;player.rotation.y+=Math.max(-mx,Math.min(mx,d))}}
  if(ST.mx)ST.mx.update(sdt);
  // ---- 카메라 ----
  C.idleT+=dt;
  if(C.lockOn&&dummy){const ty=Math.atan2(player.position.x-dummy.position.x,player.position.z-dummy.position.z);C.yaw+=wrap(ty-C.yaw)*dmp(CAM.kLock,dt);C.pitch+=(CAM.lockPitch-C.pitch)*dmp(CAM.kLock,dt)}
  else if(OPT.align&&C.idleT>CAM.alignDelay&&sp2>1&&ST.lock===0){C.yaw+=wrap(Math.atan2(-VX,-VZ)-C.yaw)*dmp(CAM.alignRate,dt)}
  C.pitch=Math.max(CAM.pMin,Math.min(CAM.pMax,C.pitch));C.dist=Math.max(CAM.dMin,Math.min(CAM.dMax,C.dist));
  C.cyaw+=wrap(C.yaw-C.cyaw)*dmp(CAM.kYaw,dt);C.cpitch+=(C.pitch-C.cpitch)*dmp(CAM.kYaw,dt);
  P.set(player.position.x,player.position.y+CAM.pivotY,player.position.z);
  const cp=Math.cos(C.cpitch),sy=Math.sin(C.cyaw),cy=Math.cos(C.cyaw);
  D.set(sy*cp,Math.sin(C.cpitch),cy*cp);
  // 스프링암: 방 경계(벽·바닥·천장)에 닿으면 당겨옴
  let L=C.dist;const bx=LW/2-.5,bz=LD/2-.5;
  const lim=(o,d,lo,hi)=>{if(d>1e-4)return(hi-o)/d;if(d<-1e-4)return(lo-o)/d;return 1e9};
  L=Math.min(L,lim(P.x,D.x,-bx,bx),lim(P.z,D.z,-bz,bz),lim(P.y,D.y,.45,H-.4));L=Math.max(.9,L);
  C.arm+=(L-C.arm)*dmp(L<C.arm?CAM.armIn:CAM.armOut,dt);
  V.set(P.x+D.x*C.arm,P.y+D.y*C.arm,P.z+D.z*C.arm);
  if(C.shk>0.001){V.x+=(Math.random()-.5)*C.shk;V.y+=(Math.random()-.5)*C.shk;C.shk*=Math.exp(-14*dt)}else C.shk=0;
  cam.position.lerp(V,dmp(CAM.kPos,dt));
  cam.lookAt(P.x+cy*CAM.shoulder,P.y-.15,P.z-sy*CAM.shoulder);
  let tf=CAM.fov;if(OPT.fx){if(sp2>4.5)tf+=CAM.fovRun;if(ST.lock===2)tf+=CAM.fovDodge}
  C.fov+=(tf-C.fov)*dmp(8,dt);if(Math.abs(cam.fov-C.fov)>.05){cam.fov=C.fov;cam.updateProjectionMatrix()}
  sg.rotation.y+=dt*.8;
  near=null;for(const d of DOORS){if(Math.hypot(player.position.x-d.x,player.position.z-d.wz)<3.2)near=d}
  if(!near&&Math.hypot(player.position.x,player.position.z-(-LD/2+.5))<3)near={id:'studio',nm:'게시판 → 작업실 퀘스트'};
  label.textContent=near?('▶ '+near.nm+' 들어가기'):(C.lockOn?'🎯 락온':'');host.classList.toggle('near',!!near);
  R.render(scene,cam);
  if(t-t0>1000){W.fps=Math.round(frames*1000/(t-t0));frames=0;t0=t;const f=document.getElementById('w-fps');if(f)f.textContent=W.fps+' fps'}
}
W.setStaff=function(states){(states||[]).forEach((s,i)=>{const m=staffM[i];if(!m)return;m.mark.visible=s==='block';m.p.scale.y=s==='rest'?.7:.9})};
W.enter=function(){if(near)location.hash='#'+near.id};
W.teleport=function(x,z){if(player){player.position.x=x;player.position.z=z}};
function panelHtml(){return '<label>감도 <input type="range" id="o-sens" min="0.4" max="2.5" step="0.1" value="'+OPT.sens+'"></label><label><input type="checkbox" id="o-inv"'+(OPT.invY?' checked':'')+'> 상하 반전</label><label><input type="checkbox" id="o-al"'+(OPT.align?' checked':'')+'> 자동 정렬</label><label><input type="checkbox" id="o-fx"'+(OPT.fx?' checked':'')+'> 흔들림·FOV</label><label><input type="checkbox" id="o-vib"'+(OPT.vib?' checked':'')+'> 진동</label>'}
W.start=function(el){host=el;W.on=true;
  host.innerHTML='<canvas id="w-cv"></canvas><div id="w-hud"><span id="w-fps"></span><b id="w-lab"></b><button id="w-set" aria-label="설정">⚙</button></div><div id="w-pan" hidden>'+panelHtml()+'</div><div id="w-joy"><i></i></div><button id="w-go" aria-label="들어가기">들어가기</button><button id="w-atk" aria-label="공격">⚔</button><button id="w-dod" aria-label="회피">⤴</button><button id="w-run" aria-label="달리기 토글">»</button><button id="w-lock" aria-label="락온">◎</button><p id="w-hint">스틱(WASD)=이동 · 오른쪽 드래그(마우스 드래그)=카메라 · 핀치(휠)=줌 · ⚔(J/클릭)=공격 3콤보 · ⤴(Space)=회피 · »(Shift)=달리기 · ◎(Tab)=락온</p>';
  label=host.querySelector('#w-lab');const cv=host.querySelector('#w-cv');
  if(R){try{R.dispose()}catch(e){}R=null}
  R=new THREE.WebGLRenderer({canvas:cv,antialias:false,powerPreference:'low-power'});R.setPixelRatio(Math.min(devicePixelRatio||1,1.5));
  if(!scene)build();
  resize();
  const joyEl=host.querySelector('#w-joy'),knob=joyEl.firstChild,pan=host.querySelector('#w-pan');
  let stickId=null,cx=0,cy=0;const camP=new Map();
  const home=()=>{joyEl.style.left='';joyEl.style.top='';joyEl.style.bottom='';joyEl.classList.remove('on')};
  const mv=e=>{const dx=e.clientX-cx,dy=e.clientY-cy,m=Math.min(1,Math.hypot(dx,dy)/CTRL.stick),a=Math.atan2(dy,dx);joy.x=Math.cos(a)*m;joy.y=Math.sin(a)*m;knob.style.transform='translate('+joy.x*40+'px,'+joy.y*40+'px)'};
  const stickDown=e=>{stickId=e.pointerId;const hr=host.getBoundingClientRect();
    if(!joyEl.contains(e.target)){cx=e.clientX;cy=e.clientY;joyEl.style.left=(cx-hr.left-56)+'px';joyEl.style.top=(cy-hr.top-56)+'px';joyEl.style.bottom='auto'}
    else{const r=joyEl.getBoundingClientRect();cx=r.left+r.width/2;cy=r.top+r.height/2}
    joyEl.classList.add('on');mv(e)};
  host.onpointerdown=e=>{
    if(e.target.closest('button,#w-pan'))return;
    try{host.setPointerCapture(e.pointerId)}catch(_){}
    const hr=host.getBoundingClientRect(),left=(e.clientX-hr.left)<hr.width/2,onJoy=joyEl.contains(e.target),mouse=e.pointerType==='mouse';
    if(stickId===null&&(onJoy||(!mouse&&left)))return stickDown(e);
    camP.set(e.pointerId,{x:e.clientX,y:e.clientY,x0:e.clientX,y0:e.clientY,t0:performance.now(),mouse,btn:e.button});C.idleT=0};
  host.onpointermove=e=>{
    if(e.pointerId===stickId){mv(e);return}
    const p=camP.get(e.pointerId);if(!p)return;
    const dx=e.clientX-p.x,dy=e.clientY-p.y;
    if(camP.size>=2){ // 두 손가락 = 핀치 줌
      const ids=[...camP.keys()],a=camP.get(ids[0]),b=camP.get(ids[1]),d0=Math.hypot(a.x-b.x,a.y-b.y);
      p.x=e.clientX;p.y=e.clientY;const d1=Math.hypot(a.x-b.x,a.y-b.y);if(d0>8&&d1>8)C.dist=Math.max(CAM.dMin,Math.min(CAM.dMax,C.dist*d0/d1));C.idleT=0;return}
    p.x=e.clientX;p.y=e.clientY;C.idleT=0;
    if(!C.lockOn)C.yaw-=dx*CAM.sens*OPT.sens;
    C.pitch+=dy*CAM.sens*OPT.sens*(OPT.invY?1:-1)};
  const up=e=>{
    if(e.pointerId===stickId){stickId=null;joy.x=joy.y=0;knob.style.transform='';home();return}
    const p=camP.get(e.pointerId);if(p){camP.delete(e.pointerId);
      if(p.mouse&&e.type==='pointerup'){if(p.btn===0&&Math.hypot(e.clientX-p.x0,e.clientY-p.y0)<6&&performance.now()-p.t0<300)W.attack();if(p.btn===1)W.lock()}}};
  host.onpointerup=host.onpointercancel=up;
  host.addEventListener('wheel',e=>{e.preventDefault();C.dist=Math.max(CAM.dMin,Math.min(CAM.dMax,C.dist*(1+Math.sign(e.deltaY)*.1)))},{passive:false});
  host.oncontextmenu=e=>e.preventDefault();
  host.querySelector('#w-go').onclick=W.enter;
  const bind=(id,f)=>{host.querySelector(id).onpointerdown=e=>{e.preventDefault();e.stopPropagation();f()}};
  bind('#w-atk',()=>W.attack());bind('#w-dod',()=>W.dodge());bind('#w-run',()=>W.sprint());bind('#w-lock',()=>W.lock());
  host.querySelector('#w-set').onclick=()=>{pan.hidden=!pan.hidden};
  pan.oninput=pan.onchange=()=>{OPT.sens=+host.querySelector('#o-sens').value;OPT.invY=host.querySelector('#o-inv').checked;OPT.align=host.querySelector('#o-al').checked;OPT.fx=host.querySelector('#o-fx').checked;OPT.vib=host.querySelector('#o-vib').checked;saveOpt()};
  host.querySelector('#w-run').classList.toggle('on',C.sprint);host.querySelector('#w-lock').classList.toggle('on',C.lockOn);
  W._kd=e=>{keys[e.key]=true;
    if(e.key==='Enter'||e.key==='e')W.enter();
    if(e.key==='j'&&!e.repeat)W.attack();
    if(e.key===' '){e.preventDefault();if(!e.repeat)W.dodge()}
    if(e.key==='Shift'&&!e.repeat)W.sprint(true);
    if(e.key==='Tab'){e.preventDefault();if(!e.repeat)W.lock()}};
  W._ku=e=>{keys[e.key]=false;if(e.key==='Shift')W.sprint(false)};
  addEventListener('keydown',W._kd);addEventListener('keyup',W._ku);addEventListener('resize',resize);
  last=performance.now();t0=last;frames=0;cancelAnimationFrame(raf);raf=requestAnimationFrame(loop)};
W.stop=function(){W.on=false;cancelAnimationFrame(raf);removeEventListener('keydown',W._kd);removeEventListener('keyup',W._ku);removeEventListener('resize',resize);keys={};joy.x=joy.y=0};
})();
