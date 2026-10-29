(function(){
'use strict';
var CONTACT_EMAIL='info@cygnixlabs.com';
/* Form backend: Formgong (free, emails each submission to info@). Paste the public fk_ access key below.
   While it is empty, the forms open the visitor's email app with the message addressed to info@ (no backend needed). */
var FORM_KEY='fk_GzPB9Nzex3utDEBEsiDevwgv';
var FORM_ENDPOINT='https://formgong.com/submit';
var FEED_LOCAL='feed/cygnix-listings.json';
var FEED_REMOTE='https://raw.githubusercontent.com/cygnixlabs-cmd/cygnix-seo-skills/main/feed/cygnix-listings.json';
var EXCLUDE=['cygnix-instagram-export-cleaner','cygnix-storefront-release-proof'];
var root=document.documentElement;

/* ---------- 3D gate: desktop + motion OK + WebGL ---------- */
function webgl(){try{var c=document.createElement('canvas');return !!(window.WebGLRenderingContext&&(c.getContext('webgl2')||c.getContext('webgl')));}catch(e){return false;}}
var reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
var small=matchMedia('(max-width: 760px)').matches;
var lowMem=navigator.deviceMemory&&navigator.deviceMemory<3;
if(!document.getElementById('scene')){root.classList.add('no3d');}
else if(!reduce&&!small&&!lowMem&&webgl()){
  var start=function(){var s=document.createElement('script');s.type='module';s.src='assets/js/scene.js';s.onerror=function(){root.classList.add('no3d');};document.body.appendChild(s);};
  if('requestIdleCallback' in window)requestIdleCallback(start,{timeout:1200});else setTimeout(start,300);
}else{root.classList.add('no3d');}

/* ---------- reveal ---------- */
var io=('IntersectionObserver' in window)?new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);}});},{threshold:.12}):null;
if(!root.classList.contains('motion'))document.querySelectorAll('.rv').forEach(function(el){io?io.observe(el):el.classList.add('in');});
/* ---------- tools from feed ---------- */
var grid=document.getElementById('tool-grid');
var tabs=document.querySelectorAll('.tab');
var moreBtn=document.getElementById('tool-more');
var items=[],filter='apify',showAll=false;
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function clean(list){return list.filter(function(i){return i&&i.url&&EXCLUDE.indexOf(i.slug)<0&&!/library\.cygnixlabs/i.test(i.url);});}
function card(i){var ap=i.platform==='Apify';
 return '<a class="tool glass" href="'+esc(i.url)+'" target="_blank" rel="noopener" data-platform="'+esc(i.platform)+'">'+
 '<div class="meta"><span class="badge '+(ap?'apify':'agensi')+'">'+(ap?'Apify actor':(i.type==='bundle'?'Agensi bundle':'Agensi skill'))+'</span><span class="badge">'+esc(i.category)+'</span></div>'+
 '<h3>'+esc(i.title)+'</h3><p>'+esc(i.short_description)+'</p>'+
 '<div class="ft"><span class="price">'+esc(i.price)+'</span><span class="go">'+(ap?'Run on Apify':'Get on Agensi')+' →</span></div></a>';}
function render(){if(!grid)return;
 var list=items.filter(function(i){return filter==='apify'?i.platform==='Apify':filter==='agensi'?i.platform!=='Apify':(i.category||'').indexOf(filter)===0;});
 var limit=showAll?list.length:(filter==='agensi'?12:(small?6:list.length));
 grid.innerHTML=list.slice(0,limit).map(card).join('');
 if(moreBtn){moreBtn.hidden=list.length<=limit;moreBtn.textContent='Show all '+list.length;}
 document.dispatchEvent(new CustomEvent('cyg:tools'));
}
function swap(){if(window.CygMotion&&window.CygMotion.swap)window.CygMotion.swap(render);else render();}
function load(url){return fetch(url,{cache:'no-cache'}).then(function(r){if(!r.ok)throw 0;return r.json();});}
function use(d){var l=clean(d.items||d.listings||d||[]);if(l.length){items=l;render();var u=document.getElementById('feed-updated');if(u&&d.updated)u.textContent='Listings updated '+d.updated+' · '+l.length+' live tools and skills';}}
if(grid){load(FEED_LOCAL).then(use).catch(function(){}).then(function(){return load(FEED_REMOTE).then(use);}).catch(function(){});
 tabs.forEach(function(t){t.addEventListener('click',function(){tabs.forEach(function(x){x.setAttribute('aria-selected','false');});t.setAttribute('aria-selected','true');filter=t.dataset.f;showAll=false;swap();});});
 if(moreBtn)moreBtn.addEventListener('click',function(){showAll=true;swap();});}

/* ---------- forms ---------- */
function mailtoSend(data){var subj=data._subject||'Cygnix site enquiry';var skip={_subject:1,_replyto:1,_template:1,_captcha:1,_honey:1,botcheck:1,access_key:1,_lang:1};
 var lines=[];Object.keys(data).forEach(function(k){if(!skip[k]&&data[k])lines.push(k.charAt(0).toUpperCase()+k.slice(1)+': '+data[k]);});
 location.href='mailto:'+CONTACT_EMAIL+'?subject='+encodeURIComponent(subj)+'&body='+encodeURIComponent(lines.join('\n'));return Promise.resolve({mailto:true});}
function send(data){if(!FORM_KEY)return mailtoSend(data);
 var fd=new FormData();fd.append('access_key',FORM_KEY);fd.append('_lang','en');Object.keys(data).forEach(function(k){if(k!=='_honey')fd.append(k,data[k]);});
 return fetch(FORM_ENDPOINT,{method:'POST',headers:{'Accept':'application/json'},body:fd}).then(function(r){return r.json().catch(function(){return {};}).then(function(j){if(!r.ok||j.success!==true)throw new Error(j.message||j.code||'send failed');return j;});});}
var form=document.getElementById('contact-form');
function prefill(pkg,msg){if(!form)return;var s=form.querySelector('[name=package]');if(s&&pkg){s.value=pkg;}var m=form.querySelector('[name=message]');if(m&&msg&&!m.value)m.value=msg;}
document.querySelectorAll('[data-package]').forEach(function(b){b.addEventListener('click',function(ev){prefill(b.dataset.package,b.dataset.msg||'');
 var h=b.getAttribute('href')||'';if(form&&h.charAt(0)==='?'){ev.preventDefault();try{history.replaceState(null,'',h);}catch(x){}var c=document.getElementById('contact');if(c)c.scrollIntoView({behavior:reduce?'auto':'smooth'});var n=form.querySelector('[name=name]');if(n)setTimeout(function(){n.focus({preventScroll:true});},600);}});});
/* ?package=… preselects a package (for links in emails and DMs) */
var ALIAS={consultation:'Free 15-min consultation','free-check':'Free site check',sample:'Free sample audit (agencies)'};
try{var qp=new URLSearchParams(location.search).get('package');if(qp&&ALIAS[qp.toLowerCase()])qp=ALIAS[qp.toLowerCase()];if(qp&&form){var sel=form.querySelector('[name=package]');if(sel&&[].some.call(sel.options,function(o){return o.value===qp;}))prefill(qp,'');}}catch(e){}
if(form){form.addEventListener('submit',function(e){e.preventDefault();var st=form.querySelector('.status');
 if(form.querySelector('[name=_honey]').value)return;
 var fd=new FormData(form),d={};fd.forEach(function(v,k){d[k]=v;});d._subject='Cygnix site: '+(d.package||'enquiry')+' — '+(d.name||'');d._replyto=d.email;
 st.className='status';st.textContent='Sending…';var btn=form.querySelector('button[type=submit]');btn.disabled=true;
 send(d).then(function(j){st.className='status ok';if(j&&j.mailto){st.innerHTML='Your email app should open with this message addressed to <a href="mailto:'+CONTACT_EMAIL+'">'+CONTACT_EMAIL+'</a>. Press Send there and we reply within 1–2 business days.';return;}st.textContent='Thanks! Your message reached the Cygnix team. We reply by email, usually within 1–2 business days'+(/\$/.test(d.package||'')?', with the scope and an invoice.':'.');form.reset();})
 .catch(function(){st.className='status err';st.innerHTML='Could not send right now. Please email <a href="mailto:info@cygnixlabs.com">info@cygnixlabs.com</a> or call <a href="tel:+96551785758">+965 5178 5758</a>.';})
 .then(function(){btn.disabled=false;});});}

/* ---------- Talk to us: conversational assistant (assets/js/chat.js) + page explainer (assets/js/explain.js) ---------- */
window.CygForm={send:send,prefill:prefill,contact:CONTACT_EMAIL};
(function(){var me=document.querySelector('script[src*="assets/js/main.js"]'),v=me&&me.src.split('v=')[1]||'';
 function add(n){var s=document.createElement('script');s.src='assets/js/'+n+'.js'+(v?'?v='+v:'');s.defer=true;document.body.appendChild(s);}
 if(document.getElementById('chat'))add('chat');if(document.querySelector('.explain'))add('explain');
})();
})();
