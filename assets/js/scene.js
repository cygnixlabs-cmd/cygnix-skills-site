// Cygnix hero scene: the eagle at the core, tool cards orbiting, "not indexed" pages getting fixed.
import * as THREE from '../vendor/three.module.min.js';

const host = document.getElementById('scene');
const TOOLS = [
  ['Indexing Fix Planner','why pages are not indexed'],
  ['Site SEO + AEO Audit','0–100 site score'],
  ['Redirect Checker','chains, loops, 404s'],
  ['Backlink Triage','toxic links: act or ignore'],
  ['AEO Checker','can AI cite you?'],
  ['Internal Link Audit','orphan pages'],
  ['Content Decay Audit','pages losing traffic'],
  ['YouTube Analyzer','what grows a channel'],
];
const PAGES = ['/services','/pricing','/blog/guide','/dental-implants','/spa-offers','/shop/sale','/about','/contact','/booking','/products/new'];
const BAD = ['Not indexed','404','Redirect loop','Canonical wrong','Orphan page','Noindex'];

function rr(ctx,x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath();}
function cardTex(title, sub, accent, kind){
  const c=document.createElement('canvas'); c.width=512; c.height=176; const x=c.getContext('2d');
  rr(x,6,6,500,164,26); x.fillStyle='rgba(13,24,44,0.94)'; x.fill();
  x.lineWidth=3; x.strokeStyle=accent; x.stroke();
  x.fillStyle=accent; x.beginPath(); x.arc(46,62,12,0,Math.PI*2); x.fill();
  x.globalAlpha=.25; x.beginPath(); x.arc(46,62,24,0,Math.PI*2); x.fill(); x.globalAlpha=1;
  x.fillStyle='#F1F5F9'; x.font='700 38px "Plus Jakarta Sans",system-ui,sans-serif'; x.fillText(title,82,76);
  x.fillStyle= kind==='tool' ? '#94A3B8' : accent; x.font='600 29px "Plus Jakarta Sans",system-ui,sans-serif'; x.fillText(sub,82,126);
  const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; t.anisotropy=4; return t;
}

const W=()=>host.clientWidth, H=()=>host.clientHeight;
const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'low-power'});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.75)); renderer.setSize(W(),H());
host.appendChild(renderer.domElement);
const scene=new THREE.Scene();
const camera=new THREE.PerspectiveCamera(42,W()/H(),.1,100); camera.position.set(0,1.0,13.2);

// Eagle core
const loader=new THREE.TextureLoader();
const eagleTex=loader.load(host.dataset.eagle); eagleTex.colorSpace=THREE.SRGBColorSpace;
const eagle=new THREE.Mesh(new THREE.PlaneGeometry(3.3,3.3),new THREE.MeshBasicMaterial({map:eagleTex,transparent:true,depthWrite:false}));
scene.add(eagle);
// glow
const gc=document.createElement('canvas');gc.width=gc.height=256;const g=gc.getContext('2d');
const grd=g.createRadialGradient(128,128,10,128,128,128);grd.addColorStop(0,'rgba(56,189,248,.55)');grd.addColorStop(.5,'rgba(56,189,248,.12)');grd.addColorStop(1,'rgba(56,189,248,0)');g.fillStyle=grd;g.fillRect(0,0,256,256);
const glow=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(gc),transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));
glow.scale.set(7.5,7.5,1); glow.position.z=-.2; scene.add(glow);
// shell
const shell=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(2.15,1)),new THREE.LineBasicMaterial({color:0x38BDF8,transparent:true,opacity:.18}));
scene.add(shell);

// orbit rings
const rings=new THREE.Group(); scene.add(rings);
const ORB=[{r:3.3,tilt:.42,rot:.15},{r:4.1,tilt:-.28,rot:-.35}];
ORB.forEach(o=>{const pts=[];for(let i=0;i<=128;i++){const a=i/128*Math.PI*2;pts.push(new THREE.Vector3(Math.cos(a)*o.r,0,Math.sin(a)*o.r));}
 const l=new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),new THREE.LineBasicMaterial({color:0x38BDF8,transparent:true,opacity:.22}));
 l.rotation.x=o.tilt; l.rotation.z=o.rot; rings.add(l);});

function orbitPos(o,a,out){out.set(Math.cos(a)*o.r,0,Math.sin(a)*o.r);out.applyEuler(new THREE.Euler(o.tilt,0,o.rot));return out;}

// tool cards
const tools=TOOLS.map((t,i)=>{
  const o=ORB[i%2]; const m=new THREE.Mesh(new THREE.PlaneGeometry(2.15,.74),new THREE.MeshBasicMaterial({map:cardTex(t[0],t[1],'#38BDF8','tool'),transparent:true,depthWrite:false}));
  m.userData={o,a:i/TOOLS.length*Math.PI*2+(i%2)*.4,speed:(i%2?.11:.15)*(i%2?-1:1),busy:0};
  scene.add(m); return m;});

// pages (problem → fixed)
const pages=[]; const beams=[];
function spawnPage(){
  const path=PAGES[(Math.random()*PAGES.length)|0], bad=BAD[(Math.random()*BAD.length)|0];
  const badTex=cardTex(path,'✕ '+bad,'#F87171','page'), okTex=cardTex(path,'✓ Fixed · indexed','#34D399','page');
  const m=new THREE.Mesh(new THREE.PlaneGeometry(1.8,.62),new THREE.MeshBasicMaterial({map:badTex,transparent:true,opacity:0,depthWrite:false}));
  const side=Math.random()<.5?-1:1;
  m.position.set(side*(4.4+Math.random()*.8),(Math.random()-.5)*4.6,(Math.random()-.6)*1.5);
  m.userData={t:0,okTex,state:'in',tool:null,vel:new THREE.Vector3(-side*.22,(Math.random()-.5)*.08,0)};
  scene.add(m); pages.push(m);
}
const beamMat=()=>new THREE.LineBasicMaterial({color:0x38BDF8,transparent:true,opacity:0});
function beam(a,b){const geo=new THREE.BufferGeometry().setFromPoints([a.position.clone(),b.position.clone()]);const l=new THREE.Line(geo,beamMat());scene.add(l);return l;}

// particles
const N=420,pp=new Float32Array(N*3);for(let i=0;i<N;i++){pp[i*3]=(Math.random()-.5)*30;pp[i*3+1]=(Math.random()-.5)*18;pp[i*3+2]=(Math.random()-.5)*16-4;}
const pg=new THREE.BufferGeometry();pg.setAttribute('position',new THREE.BufferAttribute(pp,3));
const stars=new THREE.Points(pg,new THREE.PointsMaterial({color:0x7DD3FC,size:.035,transparent:true,opacity:.55}));scene.add(stars);

// interaction
let mx=0,my=0;addEventListener('pointermove',e=>{mx=e.clientX/innerWidth-.5;my=e.clientY/innerHeight-.5;},{passive:true});
addEventListener('resize',()=>{camera.aspect=W()/H();camera.updateProjectionMatrix();renderer.setSize(W(),H());});
let visible=true;new IntersectionObserver(es=>{visible=es[0].isIntersecting;}).observe(host);

const clock=new THREE.Clock();let spawnT=0;const tmp=new THREE.Vector3();
spawnPage();spawnPage();
function tick(){
  requestAnimationFrame(tick);
  if(!visible||document.hidden){clock.getDelta();return;}
  const dt=Math.min(clock.getDelta(),.05), t=clock.elapsedTime;
  camera.position.x+=(mx*2.2-camera.position.x)*.04; camera.position.y+=(1.0-my*1.2-camera.position.y)*.04; camera.lookAt(0,0,0);
  eagle.position.y=Math.sin(t*1.1)*.12; eagle.lookAt(camera.position); glow.material.opacity=.85+Math.sin(t*2)*.15;
  shell.rotation.y+=dt*.12; shell.rotation.x+=dt*.05; stars.rotation.y+=dt*.01;
  tools.forEach(m=>{const u=m.userData;u.a+=dt*u.speed;orbitPos(u.o,u.a,m.position);m.lookAt(camera.position);
    const s=1+(u.busy>0?.12*Math.sin(Math.min(u.busy,1)*Math.PI):0);m.scale.setScalar(s);u.busy=Math.max(0,u.busy-dt);
    m.renderOrder=Math.round(m.position.z*10)+100;});
  eagle.renderOrder=100;
  spawnT+=dt; if(spawnT>2.1&&pages.length<5){spawnT=0;spawnPage();}
  for(let i=pages.length-1;i>=0;i--){const p=pages[i],u=p.userData;u.t+=dt;p.lookAt(camera.position);p.renderOrder=Math.round(p.position.z*10)+100;
    if(u.state==='in'){p.material.opacity=Math.min(1,p.material.opacity+dt*1.5);p.position.addScaledVector(u.vel,dt);
      if(u.t>1.6){let best=null,bd=1e9;tools.forEach(tl=>{const d=tl.position.distanceTo(p.position);if(d<bd&&tl.userData.busy<=0){bd=d;best=tl;}});
        if(best){u.tool=best;best.userData.busy=1.6;u.beam=beam(best,p);u.state='scan';u.t=0;}}}
    else if(u.state==='scan'){const pos=u.beam.geometry.attributes.position;pos.setXYZ(0,u.tool.position.x,u.tool.position.y,u.tool.position.z);pos.setXYZ(1,p.position.x,p.position.y,p.position.z);pos.needsUpdate=true;
      u.beam.material.opacity=.4+.5*Math.abs(Math.sin(u.t*9));p.position.addScaledVector(u.vel,dt*.3);
      if(u.t>1.1){const old=p.material.map;p.material.map=u.okTex;old.dispose();p.material.needsUpdate=true;u.state='ok';u.t=0;}}
    else if(u.state==='ok'){u.beam.material.opacity=Math.max(0,u.beam.material.opacity-dt*1.2);p.position.y+=dt*.35;
      if(u.t>1.6){p.material.opacity-=dt*1.2;if(p.material.opacity<=0){scene.remove(p);scene.remove(u.beam);p.geometry.dispose();p.material.map.dispose();pages.splice(i,1);}}}
  }
  renderer.render(scene,camera);
}
tick();
document.documentElement.classList.add('has3d');
