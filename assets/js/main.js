(function(){
'use strict';
var CONTACT_EMAIL='info@cygnixlabs.com';
/* Form backend: Formgong (free, emails each submission to info@). Paste the public fk_ access key below.
   While it is empty, the forms open the visitor's email app with the message addressed to info@ (no backend needed). */
var FORM_KEY='';
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

/* ---------- Talk to us: guided assistant ---------- */
var A='https://apify.com/cygnix_labs/';
var INTENTS=[
 {k:'notindexed',label:'My pages are not indexed',re:/index|not (show|appear)|google (can.?t|doesn.?t|won.?t) find|crawled|discovered/i,
  say:'That usually comes from a 404, a noindex tag, a wrong canonical, thin content or an orphan page. The <b>Indexing Fix Planner</b> checks every not-indexed URL and gives the cause and the fix for each one.',
  tools:[['Indexing Fix Planner',A+'indexing-fix-planner'],['Internal Link Audit',A+'internal-link-audit']]},
 {k:'drop',label:'My rankings or traffic dropped',re:/drop|lost|declin|fell|down|decay|traffic/i,
  say:'Let us find which pages are losing clicks and why. <b>Content Decay Audit</b> ranks the pages that are slipping, and <b>SEO Change Impact Checker</b> tells you if a recent change caused it or if it is just noise.',
  tools:[['Content Decay Audit',A+'content-decay-audit'],['SEO Change Impact Checker',A+'seo-change-impact-checker']]},
 {k:'backlinks',label:'Toxic or spam backlinks',re:/backlink|toxic|spam|disavow|link/i,
  say:'Most spam links can be ignored. <b>Spam Backlink Triage</b> gives one answer (NO / MONITOR / ACT) and a verdict per domain, so you only disavow when it really matters.',
  tools:[['Spam Backlink Triage',A+'spam-backlink-triage']]},
 {k:'redirects',label:'Broken redirects or a site move',re:/redirect|301|302|migrat|moved|404|broken/i,
  say:'<b>Redirect Checker</b> traces every hop and flags chains, loops, 404s and soft 404s, and it checks your old-to-new redirect map after a migration.',
  tools:[['Redirect Checker',A+'redirect-checker']]},
 {k:'ai',label:'AI tools don’t mention me',re:/\bai\b|chatgpt|gpt|perplexity|gemini|claude|llm|aeo|geo|overview|cite|mention/i,
  say:'To get cited by ChatGPT, Perplexity and Google AI Overviews, AI tools need to read your pages and trust your brand facts. <b>AEO Checker</b> scores each page 0–100, and <b>Brand Facts Checker</b> finds facts your own site contradicts.',
  tools:[['AEO & AI Visibility Audit',A+'aeo-readiness-checker'],['Brand Facts Checker',A+'brand-facts-checker']]},
 {k:'youtube',label:'Grow my YouTube channel',re:/youtube|video|channel|subscriber/i,
  say:'<b>YouTube Channel Analyzer</b> shows your best upload day and hour, your outlier videos and the title patterns that win, for your channel or a competitor’s.',
  tools:[['YouTube Channel Analyzer',A+'youtube-channel-analyzer']]},
 {k:'social',label:'Best time to post / hashtags',re:/instagram|tiktok|hashtag|post(ing)? time|best time|social/i,
  say:'<b>Best Time to Post</b> builds a weekday × hour heatmap from real posts, and <b>Hashtag Research</b> gives you ready-to-paste tag sets.',
  tools:[['Best Time to Post',A+'social-best-time-to-post'],['Hashtag Research',A+'hashtag-research-strategy']]},
 {k:'keywords',label:'Keyword research or cannibalization',re:/keyword|cannibal|intent|cluster|serp|content brief/i,
  say:'<b>Keyword Clusterer</b> groups your keywords into topics with content briefs, <b>SERP Intent Mapper</b> tells you which page type to build, and <b>Cannibalization Checker</b> finds pages competing for the same keyword.',
  tools:[['Keyword Clusterer + Briefs',A+'keyword-clusterer-brief'],['SERP Intent Mapper',A+'serp-intent-mapper'],['Cannibalization Checker',A+'keyword-cannibalization-finder']]},
 {k:'agency',label:'I’m an agency (many client sites)',re:/agency|client|white.?label|resell/i,
  say:'Agencies usually start with a <b>white-label AI visibility audit</b>: <b>$99</b> per client site, or <b>4 for $299</b>, with your logo and no Cygnix branding. Ask for a free sample first. For ongoing work, the <b>Agency plan ($99/mo)</b> covers 5 client sites. You can also run our Apify actors across your client list yourself.',
  tools:[['Contact Details Scraper',A+'outreach-contact-finder'],['Tech Stack Detector',A+'website-tech-stack-detector']],pkg:'Free sample audit (agencies)'},
 {k:'audit',label:'Not sure, check my whole site',re:/audit|check|whole|everything|not sure|help|seo|rank/i,
  say:'Start with a full check. <b>Website SEO + AEO Audit</b> crawls your site and scores every page 0–100, covering meta tags, broken links, schema, llms.txt and AI readiness. Or we can run it for you with the free site check.',
  tools:[['Website SEO + AEO Audit',A+'site-seo-aeo-audit']],pkg:'Free site check'}
];
var chat=document.getElementById('chat'),body=chat&&chat.querySelector('.chat-b'),input=chat&&chat.querySelector('.chat-f input');
var log=[],lastIntent=null;
function add(html,who){var d=document.createElement('div');d.className='msg '+(who||'bot');d.innerHTML=html;body.appendChild(d);body.scrollTop=body.scrollHeight;log.push((who==='me'?'Visitor: ':'Assistant: ')+d.textContent);return d;}
function chips(list){var w=document.createElement('div');w.className='chips';list.forEach(function(c){var b=document.createElement('button');b.className='chip';b.type='button';b.textContent=c.label;b.onclick=c.fn;w.appendChild(b);});body.appendChild(w);body.scrollTop=body.scrollHeight;}
function menu(){chips(INTENTS.map(function(it){return {label:it.label,fn:function(){pick(it,it.label);}};}));}
function pick(it,text){add(esc(text),'me');lastIntent=it;
 setTimeout(function(){add(it.say);add('Try it: '+it.tools.map(function(t){return '<a href="'+t[1]+'" target="_blank" rel="noopener">'+t[0]+' →</a>';}).join('<br>'));
  chips([{label:'Send this to the Cygnix team',fn:handoff},{label:'See packages and pricing',fn:function(){location.href=/pricing\.html/.test(location.pathname)?'#agencies':'pricing.html';}},{label:'Another problem',fn:menu}]);},250);}
function handoff(){add('Send this to the Cygnix team','me');
 var f=document.createElement('form');f.className='mini msg bot';f.innerHTML='<span>Leave your details and we’ll reply by email with next steps.</span><input name="email" type="email" required placeholder="Your email" autocomplete="email"><input name="site" type="text" placeholder="Your website (optional)" autocomplete="url"><button class="btn btn-p btn-sm" type="submit">Send to the team</button>';
 body.appendChild(f);body.scrollTop=body.scrollHeight;f.querySelector('input').focus();
 f.addEventListener('submit',function(e){e.preventDefault();var b=f.querySelector('button');b.disabled=true;b.textContent='Sending…';
  send({_subject:'Cygnix site chat: '+(lastIntent?lastIntent.label:'enquiry'),email:f.email.value,_replyto:f.email.value,website:f.site.value,package:(lastIntent&&lastIntent.pkg)||'Talk to us (chat)',problem:lastIntent?lastIntent.label:'',transcript:log.join('\n')})
  .then(function(j){f.remove();add(j&&j.mailto?'Your email app should open with this chat addressed to <a href="mailto:info@cygnixlabs.com">info@cygnixlabs.com</a>. Press Send there and we reply by email.':'Sent ✓ The Cygnix team will reply to <b>'+esc(f.email.value)+'</b> by email.');})
  .catch(function(){b.disabled=false;b.textContent='Send to the team';add('That didn’t go through. Please email <a href="mailto:info@cygnixlabs.com">info@cygnixlabs.com</a>.');});});}
function openChat(){if(!chat)return;chat.classList.add('open');document.getElementById('chat-fab').setAttribute('aria-expanded','true');
 if(!body.children.length){add('Hi! I’m the Cygnix guide. Tell me what’s wrong with your site and I’ll point you to the right tool. <br><small style="color:#94A3B8">This is an automated guide. If you send us your chat, the Cygnix team replies by email.</small>');menu();}
 setTimeout(function(){input&&input.focus();},50);}
document.querySelectorAll('[data-chat]').forEach(function(b){b.addEventListener('click',function(e){e.preventDefault();openChat();});});
var fab=document.getElementById('chat-fab');if(fab)fab.addEventListener('click',function(){chat.classList.contains('open')?(chat.classList.remove('open'),fab.setAttribute('aria-expanded','false')):openChat();});
if(chat){chat.querySelector('.chat-x').onclick=function(){chat.classList.remove('open');fab.setAttribute('aria-expanded','false');};
 chat.querySelector('.chat-f').addEventListener('submit',function(e){e.preventDefault();var v=input.value.trim();if(!v)return;input.value='';
  var it=INTENTS.find(function(x){return x.re.test(v);});
  if(it)pick(it,v);else{add(esc(v),'me');setTimeout(function(){add('Thanks. I’m not sure which tool fits that yet. Pick the closest problem below, or send it to the Cygnix team and a person will reply by email.');chips([{label:'Send this to the Cygnix team',fn:handoff}]);menu();},250);}});}
document.addEventListener('keydown',function(e){if(e.key==='Escape'&&chat&&chat.classList.contains('open')){chat.classList.remove('open');}});
})();
