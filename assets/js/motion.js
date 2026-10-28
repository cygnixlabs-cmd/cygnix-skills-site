/* Cygnix motion layer: GSAP + ScrollTrigger + Lenis. Only GPU-friendly props (transform/opacity).
   html.motion    = motion allowed (no reduced-motion)
   html.motion-lg = desktop + enough memory: pins, scrubs, smooth scroll, particles */
(function(){
'use strict';
var root=document.documentElement;
function bail(){root.classList.remove('motion','motion-lg');document.querySelectorAll('.rv').forEach(function(e){e.classList.add('in');});}
if(!root.classList.contains('motion'))return;
if(!window.gsap||!window.ScrollTrigger){bail();return;}
var gsap=window.gsap,ST=window.ScrollTrigger;gsap.registerPlugin(ST);
var LG=root.classList.contains('motion-lg');
var FINE=matchMedia('(pointer:fine)').matches;
var $=function(s,c){return (c||document).querySelector(s);},$$=function(s,c){return Array.prototype.slice.call((c||document).querySelectorAll(s));};
gsap.defaults({ease:'power3.out'});

/* ---------- smooth scroll ---------- */
var lenis=null;
if(LG&&window.Lenis){
  lenis=new window.Lenis({lerp:.1,smoothWheel:true});
  lenis.on('scroll',ST.update);
  gsap.ticker.add(function(t){lenis.raf(t*1000);});gsap.ticker.lagSmoothing(0);
  document.addEventListener('click',function(e){var a=e.target.closest&&e.target.closest('a[href^="#"]');if(!a)return;var id=a.getAttribute('href');if(id.length<2)return;var el=document.querySelector(id);if(!el)return;e.preventDefault();lenis.scrollTo(el,{offset:id==='#top'?0:-64,duration:1.2});});
  window.addEventListener('hashchange',function(){var el=document.querySelector(location.hash);if(el)lenis.scrollTo(el,{offset:-64});});
}

/* ---------- pointer-reactive background ---------- */
var mx=innerWidth/2,my=innerHeight/2;
addEventListener('pointermove',function(e){mx=e.clientX;my=e.clientY;},{passive:true});
var grid=$('.bg-grid');
if(grid&&FINE){var gx=gsap.quickTo(grid,'x',{duration:1.2}),gy=gsap.quickTo(grid,'y',{duration:1.2});
  addEventListener('pointermove',function(e){gx((e.clientX/innerWidth-.5)*-30);gy((e.clientY/innerHeight-.5)*-30);},{passive:true});}
if(grid)gsap.to(grid,{backgroundPosition:'0px 280px',ease:'none',scrollTrigger:{start:0,end:'max',scrub:true}});
var cv=$('#bg-fx');
if(cv&&LG){
  var ctx=cv.getContext('2d'),W,H,P=[],N=Math.min(70,Math.round(innerWidth/22));
  var size=function(){W=cv.width=innerWidth;H=cv.height=innerHeight;};size();addEventListener('resize',size);
  for(var i=0;i<N;i++)P.push({x:Math.random()*innerWidth,y:Math.random()*innerHeight,vx:(Math.random()-.5)*.25,vy:(Math.random()-.5)*.25,r:Math.random()*1.4+.4});
  var lastY=scrollY;
  gsap.ticker.add(function(){if(document.hidden)return;
    var dy=(scrollY-lastY)*.15;lastY=scrollY;ctx.clearRect(0,0,W,H);
    for(var i=0;i<P.length;i++){var p=P[i];p.x+=p.vx;p.y+=p.vy-dy*p.r*.6;
      var ddx=p.x-mx,ddy=p.y-my,d2=ddx*ddx+ddy*ddy;if(d2<14400){var f=(14400-d2)/14400*.9;p.x+=ddx/120*f;p.y+=ddy/120*f;}
      if(p.x<-20)p.x=W+20;if(p.x>W+20)p.x=-20;if(p.y<-20)p.y=H+20;if(p.y>H+20)p.y=-20;
      ctx.fillStyle='rgba(125,211,252,'+(.25+p.r*.25)+')';ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,6.283);ctx.fill();}
    ctx.lineWidth=1;
    for(i=0;i<P.length;i++){var a=P[i];
      var pd=(a.x-mx)*(a.x-mx)+(a.y-my)*(a.y-my);if(pd<32400){ctx.strokeStyle='rgba(56,189,248,'+(.35*(1-pd/32400))+')';ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(mx,my);ctx.stroke();}
      for(var j=i+1;j<P.length;j++){var b=P[j],dx=a.x-b.x,dy2=a.y-b.y,dd=dx*dx+dy2*dy2;if(dd<10000){ctx.strokeStyle='rgba(56,189,248,'+(.12*(1-dd/10000))+')';ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();}}}
  });
}else if(cv){cv.remove();}

/* ---------- magnetic buttons ---------- */
if(FINE)$$('.ctas .btn,.flow .btn,.plan .btn,.nav .btn-p,form.f .btn-p,.more .btn').forEach(function(b){
  var qx=gsap.quickTo(b,'x',{duration:.4,ease:'power3'}),qy=gsap.quickTo(b,'y',{duration:.4,ease:'power3'});
  b.addEventListener('pointermove',function(e){var r=b.getBoundingClientRect();qx((e.clientX-r.left-r.width/2)*.35);qy((e.clientY-r.top-r.height/2)*.45);});
  b.addEventListener('pointerleave',function(){gsap.to(b,{x:0,y:0,duration:.7,ease:'elastic.out(1,.4)'});});
});

/* ---------- hero: camera dolly + parallax out ---------- */
var hero=$('.hero');
if(hero){
  var heroText=$('.hero .wrap>div:first-child');
  gsap.from($$('.pill,h1,.lead,.ctas,.ticks',heroText),{y:40,opacity:0,duration:1,stagger:.08,delay:.05,clearProps:'opacity'});
  ST.create({trigger:hero,start:'top top',end:'bottom top',scrub:true,onUpdate:function(s){window.CYG_HERO=s.progress;}});
  gsap.to(heroText,{y:-140,opacity:0,rotateX:18,transformPerspective:1000,transformOrigin:'50% 0',ease:'none',scrollTrigger:{trigger:hero,start:'top top',end:'bottom top',scrub:true}});
  gsap.to('.stage',{y:120,scale:1.12,ease:'none',scrollTrigger:{trigger:hero,start:'top top',end:'bottom top',scrub:true}});
  $$('.fb-card').forEach(function(c,i){gsap.to(c,{y:-(60+i*45),x:(i%2?1:-1)*40,opacity:0,ease:'none',scrollTrigger:{trigger:hero,start:'top top',end:'bottom top',scrub:true}});});
  gsap.to('.fb-eagle',{scale:1.25,yPercent:-30,ease:'none',scrollTrigger:{trigger:hero,start:'top top',end:'bottom top',scrub:true}});
}

/* ---------- section headings (depth) ---------- */
$$('section:not(.hero)').forEach(function(sec){
  var h=$$('.eyebrow,h2,.sub',sec);if(!h.length)return;
  gsap.from(h,{y:70,opacity:0,rotateX:-40,transformPerspective:900,transformOrigin:'50% 100%',duration:1,stagger:.1,scrollTrigger:{trigger:sec,start:'top 82%'}});
});

/* ---------- how it works: fly in + assemble, then problem → proof → fix ---------- */
var how=$('#how'),steps=$$('#how .step');
if(how&&steps.length===3){
  var probRows=$$('.row.prob',steps[0]),repTypes=$$('.rep .type',steps[1]),checks=$$('.chk',steps[2]),halos=$$('.halo',how),scan=$('.scanbar',steps[1]);
  var prog=$('.steps-progress span');
  var build=function(tl,LGmode){
    tl.from(steps[0],{x:-420,z:-700,rotateY:65,opacity:0,duration:1},0)
      .from(steps[1],{y:260,z:-900,rotateX:-60,opacity:0,duration:1},.12)
      .from(steps[2],{x:420,z:-700,rotateY:-65,opacity:0,duration:1},.24)
      .to(halos[0],{opacity:1,duration:.3},1.1)
      .from(probRows,{x:-30,opacity:0,stagger:.12,duration:.4},1.1)
      .to(halos[0],{opacity:0,duration:.3},1.9).to(halos[1],{opacity:1,duration:.3},1.9)
      .fromTo(scan,{opacity:1,y:0},{y:150,duration:1.1,ease:'none'},1.9).to(scan,{opacity:0,duration:.2},3)
      .from(repTypes,{clipPath:'inset(0 100% 0 0)',stagger:.12,duration:.35,ease:'none'},2)
      .to(halos[1],{opacity:0,duration:.3},3.1).to(halos[2],{opacity:1,duration:.3},3.1)
      .from(checks,{x:24,opacity:0,stagger:.18,duration:.4},3.1)
      .from($$('i',steps[2]),{scale:0,rotate:-90,stagger:.18,duration:.45,ease:'back.out(3)'},3.2)
      .to($$('.sw .r,.sw .a',steps[0]),{opacity:0,y:-8,stagger:.1,duration:.3},4)
      .fromTo($$('.sw .g',steps[0]),{opacity:0,y:8},{opacity:1,y:0,stagger:.1,duration:.3},4.05)
      .to(halos[2],{opacity:0,duration:.3},4.4).to(halos,{opacity:1,duration:.4},4.5);
    if(prog)tl.fromTo(prog,{scaleX:0},{scaleX:1,ease:'none',duration:tl.duration()},0);
    return tl;};
  if(LG){build(gsap.timeline({defaults:{ease:'power2.out'},scrollTrigger:{trigger:how,start:'top top',end:'+=220%',pin:true,scrub:.8,anticipatePin:1}}),true);}
  else{build(gsap.timeline({defaults:{ease:'power2.out'},scrollTrigger:{trigger:'#how .steps',start:'top 75%'}}).timeScale(1.4),false);}
}

/* ---------- who it's for: 3D carousel ---------- */
var aud=$('.aud');
if(aud){
  var cards=$$('.glass',aud);
  if(LG&&cards.length){
    var ring=document.createElement('div');ring.className='ring';cards.forEach(function(c){ring.appendChild(c);});aud.appendChild(ring);
    var R=520,step=42,state={rot:0};
    var dots=document.createElement('div');dots.className='aud-dots';
    cards.forEach(function(c,i){var b=document.createElement('button');b.type='button';b.setAttribute('aria-label','Show '+c.querySelector('h3').textContent);b.onclick=function(){go(i);};dots.appendChild(b);});
    aud.parentNode.insertBefore(dots,aud.nextSibling);
    // place cards on the cylinder
    cards.forEach(function(c,i){gsap.set(c,{transform:'rotateY('+(i*step)+'deg) translateZ('+R+'px)'});});
    var paint=function(){gsap.set(ring,{rotateY:state.rot,rotateX:-4,z:-R});var front=0,best=-2;
      cards.forEach(function(c,i){var f=Math.cos((i*step+state.rot)*Math.PI/180);c.style.opacity=(Math.max(0,(f-.55)/.45)*.65+.35).toFixed(3);c.style.zIndex=Math.round((f+1)*10);if(f>best){best=f;front=i;}});
      $$('button',dots).forEach(function(b,i){b.classList.toggle('on',i===front);});};
    paint();
    var st=gsap.to(state,{rot:-(cards.length-1)*step,ease:'none',onUpdate:paint,scrollTrigger:{trigger:'#who',start:'top top',end:'+=160%',pin:true,scrub:.8,snap:{snapTo:1/(cards.length-1),duration:.4,ease:'power2.inOut'}}});
    var go=function(i){var s=st.scrollTrigger,y=s.start+(s.end-s.start)*(i/(cards.length-1));lenis?lenis.scrollTo(y,{duration:1}):scrollTo({top:y,behavior:'smooth'});};
    gsap.from(ring,{z:-600,rotateX:30,opacity:0,duration:1.2,scrollTrigger:{trigger:'#who',start:'top 75%'}});
  }else{
    gsap.from(cards,{rotateY:-70,x:-60,opacity:0,transformPerspective:1000,transformOrigin:'0 50%',stagger:.15,duration:.9,scrollTrigger:{trigger:aud,start:'top 80%'}});
  }
}

/* ---------- tools: depth stagger, pointer tilt, animated tab switch ---------- */
var tg=$('#tool-grid'),swapping=false,batchTriggers=[];
function introBatch(){batchTriggers.forEach(function(t){t.kill();});batchTriggers=[];
  var cs=$$('.tool',tg);if(!cs.length)return;
  gsap.set(cs,{opacity:0,y:90,z:-260,rotateX:32});
  batchTriggers=ST.batch(cs,{start:'top 92%',once:true,onEnter:function(b){gsap.to(b,{opacity:1,y:0,z:0,rotateX:0,duration:.9,stagger:.07,ease:'power3.out',overwrite:true});}});
  ST.refresh();}
if(tg){
  introBatch();
  document.addEventListener('cyg:tools',function(){if(!swapping)introBatch();});
  window.CygMotion={swap:function(render){var old=$$('.tool',tg);swapping=true;
    gsap.to(old,{opacity:0,z:-220,rotateX:-25,y:-20,duration:.28,stagger:.015,ease:'power2.in',onComplete:function(){
      var h=tg.offsetHeight;render();var cs=$$('.tool',tg);
      gsap.fromTo(cs,{opacity:0,y:60,z:-300,rotateX:30},{opacity:1,y:0,z:0,rotateX:0,duration:.7,stagger:.045,ease:'power3.out'});
      swapping=false;if(tg.offsetHeight!==h)ST.refresh();}});}};
  $$('.tab').forEach(function(t){t.addEventListener('pointerdown',function(){gsap.fromTo(t,{scale:.92},{scale:1,duration:.5,ease:'elastic.out(1,.5)'});});});
  if(FINE){
    tg.addEventListener('pointermove',function(e){var c=e.target.closest('.tool');if(!c)return;var r=c.getBoundingClientRect(),px=(e.clientX-r.left)/r.width,py=(e.clientY-r.top)/r.height;
      c.style.setProperty('--mx',(px*100)+'%');c.style.setProperty('--my',(py*100)+'%');
      gsap.to(c,{rotateY:(px-.5)*16,rotateX:(.5-py)*14,z:30,duration:.4,ease:'power2.out',overwrite:'auto'});});
    tg.addEventListener('pointerout',function(e){var c=e.target.closest('.tool');if(!c||c.contains(e.relatedTarget))return;gsap.to(c,{rotateY:0,rotateX:0,z:0,duration:.7,ease:'elastic.out(1,.5)',overwrite:'auto'});});
  }
}

/* ---------- packages: rise with a perspective flip ---------- */
var plans=$$('.plans .plan'),oneoff=$$('.oneoff .plan');
if(plans.length){
  gsap.from(plans,{y:160,rotateX:-75,opacity:0,transformOrigin:'50% 100%',duration:1.1,stagger:.14,ease:'power4.out',scrollTrigger:{trigger:'.plans',start:'top 85%'}});
  gsap.from(oneoff,{y:120,rotateX:-60,opacity:0,transformOrigin:'50% 100%',duration:1,stagger:.12,ease:'power4.out',scrollTrigger:{trigger:'.oneoff',start:'top 90%'}});
  var ag=$('.plan.agency');if(ag)gsap.to(ag,{y:-14,duration:2.2,yoyo:true,repeat:-1,ease:'sine.inOut',delay:1.2});
  if(FINE)$$('.plan').forEach(function(p){p.addEventListener('pointermove',function(e){var r=p.getBoundingClientRect();gsap.to(p,{rotateY:((e.clientX-r.left)/r.width-.5)*8,rotateX:(.5-(e.clientY-r.top)/r.height)*8,transformPerspective:1200,duration:.4,overwrite:'auto'});});
    p.addEventListener('pointerleave',function(){gsap.to(p,{rotateY:0,rotateX:0,duration:.8,ease:'elastic.out(1,.5)',overwrite:'auto'});});});
}

/* ---------- FAQ + contact: smooth reveals ---------- */
var det=$$('#faq details');
if(det.length){gsap.from(det,{y:50,opacity:0,rotateX:-25,transformOrigin:'50% 0',duration:.8,stagger:.08,scrollTrigger:{trigger:'.faq',start:'top 85%'}});
  det.forEach(function(d){d.addEventListener('toggle',function(){if(d.open)gsap.fromTo($('p',d),{opacity:0,y:-10,scaleY:.9},{opacity:1,y:0,scaleY:1,duration:.45});setTimeout(function(){ST.refresh();},50);});});}
var cs=$$('.contact>*');
if(cs.length){gsap.from(cs[0],{x:-90,rotateY:25,opacity:0,transformPerspective:1200,duration:1,scrollTrigger:{trigger:'.contact',start:'top 85%'}});
  if(cs[1]){gsap.from(cs[1],{x:90,rotateY:-25,opacity:0,transformPerspective:1200,duration:1,scrollTrigger:{trigger:'.contact',start:'top 85%'}});
    gsap.from($$('label,button',cs[1]),{y:24,opacity:0,stagger:.05,duration:.6,delay:.25,scrollTrigger:{trigger:'.contact',start:'top 85%'}});}}
gsap.from('footer .wrap>*',{y:40,opacity:0,stagger:.08,duration:.8,scrollTrigger:{trigger:'footer',start:'top 95%'}});

/* ---------- section exits with depth (non-pinned) ---------- */
if(LG)['#tools','#packages','#faq'].forEach(function(id){var w=$(id+'>.wrap');if(!w)return;
  gsap.to(w,{scale:.94,opacity:.35,rotateX:-6,transformPerspective:1400,transformOrigin:'50% 100%',ease:'none',scrollTrigger:{trigger:id,start:'bottom 55%',end:'bottom top',scrub:true}});});

addEventListener('load',function(){ST.refresh();});
})();
