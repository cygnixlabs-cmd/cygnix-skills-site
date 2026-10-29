/* Page explainer: the Cygnix eagle walks through captioned steps (CSS/JS only, no video). */
(function(){
'use strict';
var reduce=matchMedia('(prefers-reduced-motion: reduce)').matches,small=matchMedia('(max-width: 760px)').matches;
document.querySelectorAll('.explain').forEach(function(sec){
 if(sec.dataset.on)return;sec.dataset.on='1';sec.classList.add('js');
 var steps=[].slice.call(sec.querySelectorAll('.ex-steps li')),say=sec.querySelector('.ex-say'),num=sec.querySelector('.ex-n'),bar=sec.querySelector('.ex-bar i'),
     play=sec.querySelector('[data-ex=play]'),stage=sec.querySelector('.ex-stage');
 if(!steps.length||!say)return;
 var cur=-1,timer=null,typer=null,running=false,inView=false,DUR=5200;
 function type(t){clearInterval(typer);if(reduce){say.textContent=t;return;}var n=0;say.textContent='';
  typer=setInterval(function(){n+=2;say.textContent=t.slice(0,n);if(n>=t.length)clearInterval(typer);},22);}
 function show(i){cur=(i+steps.length)%steps.length;steps.forEach(function(li,k){li.classList.toggle('on',k===cur);li.classList.toggle('done',k<cur);li.setAttribute('aria-current',k===cur?'step':'false');});
  var li=steps[cur];type(li.dataset.say||li.textContent);if(num)num.textContent=(cur+1)+'/'+steps.length;
  sec.style.setProperty('--ex-p',((cur+1)/steps.length).toFixed(3));
  if(stage){stage.classList.remove('talk');void stage.offsetWidth;stage.classList.add('talk');stage.dataset.step=cur;}
  if(bar){bar.style.transition='none';bar.style.width='0';void bar.offsetWidth;if(running){bar.style.transition='width '+DUR+'ms linear';bar.style.width='100%';}}}
 function tick(){clearTimeout(timer);if(!running)return;timer=setTimeout(function(){show(cur+1);tick();},DUR);}
 function setRun(r){running=r&&!reduce;if(play){play.textContent=running?'❚❚ Pause':'▶ Play';play.setAttribute('aria-pressed',running?'true':'false');}
  if(bar&&!running){bar.style.transition='none';}show(cur<0?0:cur);tick();}
 steps.forEach(function(li,k){li.tabIndex=0;li.setAttribute('role','button');li.addEventListener('click',function(){show(k);tick();});li.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();show(k);tick();}});});
 sec.querySelectorAll('[data-ex]').forEach(function(b){b.addEventListener('click',function(){var a=b.dataset.ex;if(a==='play'){setRun(!running);return;}show(cur+(a==='next'?1:-1));tick();});});
 show(0);
 if('IntersectionObserver' in window){new IntersectionObserver(function(es){es.forEach(function(e){inView=e.isIntersecting;if(inView&&!sec.dataset.paused)setRun(true);else if(!inView){running=false;clearTimeout(timer);}});},{threshold:.45}).observe(sec);}
 if(play)play.addEventListener('click',function(){sec.dataset.paused=running?'':'1';});
 /* gentle 3D tilt on desktop pointers only */
 if(stage&&!small&&!reduce&&matchMedia('(pointer:fine)').matches){var box=sec.querySelector('.ex');
  box.addEventListener('pointermove',function(e){var r=box.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;stage.style.setProperty('--rx',(-y*10).toFixed(2)+'deg');stage.style.setProperty('--ry',(x*14).toFixed(2)+'deg');});
  box.addEventListener('pointerleave',function(){stage.style.setProperty('--rx','0deg');stage.style.setProperty('--ry','0deg');});}
});
})();
