/* Cygnix assistant: free, client-side conversational helper.
   Answers come only from assets/kb.json (built by build_kb.py from the real catalogue, packages and FAQs).
   No paid API, no server. Intent matching = keyword + synonym scoring with IDF, light stemming and typo tolerance. */
(function(){
'use strict';
var chat=document.getElementById('chat');if(!chat||chat.dataset.assist)return;chat.dataset.assist='1';
var CF=window.CygForm||{};var CONTACT=CF.contact||'info@cygnixlabs.com';
var body=chat.querySelector('.chat-b'),fm=chat.querySelector('.chat-f'),input=fm&&fm.querySelector('input'),fab=document.getElementById('chat-fab');
var V=(document.currentScript&&(document.currentScript.src.split('v=')[1]||''))||'';
var KEY='cyg-chat-v2';
var reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- honest header + input copy ---------- */
var hb=chat.querySelector('.chat-h b'),hs=chat.querySelector('.chat-h small');
if(hb)hb.textContent='Cygnix assistant';
if(hs)hs.textContent='Automated assistant, not a person · the team replies by email';
chat.setAttribute('aria-label','Cygnix automated assistant');
if(input){input.placeholder='Ask a question in your own words…';input.setAttribute('aria-label','Ask the Cygnix assistant a question');input.maxLength=400;input.setAttribute('enterkeyhint','send');input.autocomplete='off';}
var note=chat.querySelector('.chat-note');
if(note)note.innerHTML='Automated answers from our catalogue and FAQ. Not a live chat.';
/* suggestion chips under the input + action row */
var sug=document.createElement('div');sug.className='chat-sug';sug.setAttribute('aria-label','Suggested questions');
var act=document.createElement('div');act.className='chat-act';
act.innerHTML='<button type="button" class="ca" data-a="send" title="Send this conversation to the Cygnix team">✉ Send this chat to the team</button><button type="button" class="ca" data-a="consult">Free 15-min consultation</button>';
if(fm){fm.parentNode.insertBefore(sug,fm.nextSibling);sug.parentNode.insertBefore(act,sug.nextSibling);}

/* ---------- state (session only) ---------- */
var S={msgs:[],ctx:{aud:null,last:null,topic:null,miss:0}};
try{var saved=JSON.parse(sessionStorage.getItem(KEY)||'null');if(saved&&saved.msgs)S=saved;}catch(e){}
function save(){try{S.msgs=S.msgs.slice(-60);sessionStorage.setItem(KEY,JSON.stringify(S));}catch(e){}}

/* ---------- text utils ---------- */
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function txt(h){var d=document.createElement('div');d.innerHTML=h;return d.textContent;}
var STOP=('a an the and or but if of to in on at for from by with about into is are was were be been being am do does did done have has had i im me my we our you your it its this that these those there here what which who whom how why when where can could would should will shall may might must please hi hey just so too very also any some all get got want need like know tell show give help let lets make one site website page pages web thing things something anything really much many more most not no than then them they their he she his her us u ur pls thanks thank ok okay yes yeah hello im ive dont doesnt cant isnt arent wont wanna gonna').split(' ');
var STOPS={};STOP.forEach(function(w){STOPS[w]=1;});
var SYN={
 deindexed:'index',indexed:'index',indexing:'index',indexation:'index',invisible:'index',
 chatgpt:'ai chatgpt',gpt:'ai chatgpt',openai:'ai chatgpt',gemini:'ai',perplexity:'ai',claude:'ai',copilot:'ai',llm:'ai',llms:'ai llms',bard:'ai',
 cheap:'price',cost:'price',costs:'price',pricing:'price',prices:'price',fee:'price',fees:'price',charge:'price',rate:'price',rates:'price',budget:'price',quote:'price',expensive:'price',afford:'price',
 ecommerce:'store',ecom:'store',shopify:'store shopify',woocommerce:'store',shop:'store',shops:'store',retail:'store',products:'store product',
 dentist:'dental',doctor:'clinic',clinics:'clinic',salons:'salon',restaurants:'restaurant',cafe:'restaurant',
 agencies:'agency',whitelabel:'white label',reseller:'resell',resellers:'resell',
 call:'consultation',meeting:'consultation',meet:'consultation',zoom:'consultation',appointment:'consultation',consult:'consultation',
 ranking:'rank rankings',rankings:'rank rankings',ranked:'rank',position:'rank',
 dropped:'drop',dropping:'drop',decline:'drop',declined:'drop',fell:'drop',falling:'drop',lost:'drop lost',losing:'drop lost',decrease:'drop',
 backlinks:'backlink',links:'link',toxic:'spam toxic',
 vids:'video',videos:'video',yt:'youtube',subs:'subscriber',
 insta:'instagram',ig:'instagram',tik:'tiktok',
 emails:'email',mail:'email',contacts:'contact',phone:'contact phone',whatsapp:'contact whatsapp',
 human:'human person',person:'human person',someone:'human person',
 visible:'index visibility',found:'index find',showing:'show',appear:'show',appearing:'show',
 migrate:'migration',migrating:'migration',moved:'migration move',moving:'migration move',
 check:'check audit',review:'audit',analyse:'audit',analyze:'audit',scan:'audit',
 tools:'tool',actors:'actor',scraper:'scraper',
 buy:'buy payment',paying:'payment',paypal:'payment paypal',card:'payment',invoice:'payment invoice'
};
function stem(w){if(w.length>5&&/ies$/.test(w))return w.slice(0,-3)+'y';if(w.length>5&&/ing$/.test(w))return w.slice(0,-3);if(w.length>4&&/ed$/.test(w))return w.slice(0,-2);if(w.length>3&&/[^s]s$/.test(w))return w.slice(0,-1);return w;}
function toks(s,keepStop){s=String(s||'').toLowerCase().replace(/[’']/g,'').replace(/llms\.txt/g,'llms txt').replace(/e-commerce/g,'ecommerce').replace(/white[- ]label/g,'whitelabel').replace(/[^a-z0-9]+/g,' ');
 var out=[];s.split(' ').forEach(function(w){if(!w)return;if(!keepStop&&STOPS[w])return;var syn=SYN[w];
  out.push(stem(w));if(syn)syn.split(' ').forEach(function(x){out.push(stem(x));});});
 return out;}
function lev1(a,b){if(a.length===b.length){var df=[];for(var q=0;q<a.length;q++)if(a[q]!==b[q])df.push(q);if(df.length===2&&df[1]===df[0]+1&&a[df[0]]===b[df[1]]&&a[df[1]]===b[df[0]])return true;}if(Math.abs(a.length-b.length)>1)return false;var i=0,j=0,d=0;while(i<a.length&&j<b.length){if(a[i]===b[j]){i++;j++;continue;}if(++d>1)return false;if(a.length>b.length)i++;else if(b.length>a.length)j++;else{i++;j++;}}return d+(a.length-i)+(b.length-j)<=1;}

/* ---------- knowledge base + index ---------- */
var KB=null,DF={},N=1,kbP=null;
var PRIOR={topic:1.3,faq:1.1,actor:1,package:1,bundle:.9,skill:.45};
function index(items){items.forEach(function(it){var w={};
  function add(s,x){toks(s).forEach(function(t){if(!w[t]||w[t]<x)w[t]=x;});}
  add(txt(it.a).slice(0,400),.5);add(it.kw,2);add(it.title,3);it._w=w;it._k=Object.keys(w);
  it._k.forEach(function(t){DF[t]=(DF[t]||0)+1;});});N=items.length;}
function loadKB(){if(kbP)return kbP;kbP=fetch('assets/kb.json'+(V?'?v='+V:''),{cache:'no-cache'}).then(function(r){return r.json();}).then(function(d){KB=d.items;index(KB);return KB;}).catch(function(){KB=[];return KB;});return kbP;}
function idf(t){return Math.log(1+N/(DF[t]||N));}
function rank(q,ctx){var qt=toks(q);var uq=[];qt.forEach(function(t){if(uq.indexOf(t)<0)uq.push(t);});if(!uq.length)return {res:[],cov:0,n:0};
 var oov=uq.filter(function(t){if(DF[t])return false;if(t.length<5)return true;for(var k in DF){if(k.length>=5&&lev1(t,k))return false;}return true;});
 var res=KB.map(function(it){var s=0,hit=0;
  uq.forEach(function(t){var w=it._w[t];
   if(w){s+=w*idf(t);hit++;return;}
   if(t.length>=5){for(var k=0;k<it._k.length;k++){var u=it._k[k];if(u.length>=5&&(lev1(t,u)||(u.indexOf(t)===0&&t.length>=6)||(t.indexOf(u)===0&&u.length>=6))){s+=.6*it._w[u]*idf(u);hit++;return;}}}});
  if(!s)return null;
  s*=(PRIOR[it.kind]||1)*(0.55+0.45*hit/uq.length);
  if(ctx&&ctx.aud&&it.aud&&it.aud.indexOf(ctx.aud)>=0)s*=1.25;
  return {it:it,s:s,hit:hit};}).filter(Boolean).sort(function(a,b){return b.s-a.s;});
 var cov=res.length?res[0].hit/uq.length:0;return {res:res,cov:cov,n:uq.length,oov:oov};}
function byId(id){if(!KB)return null;for(var i=0;i<KB.length;i++)if(KB[i].id===id)return KB[i];return null;}

/* ---------- rendering ---------- */
function scroll(){body.scrollTop=body.scrollHeight;}
function bubble(html,who,noSave){var d=document.createElement('div');d.className='msg '+(who||'bot');d.innerHTML=html;body.appendChild(d);scroll();if(!noSave){S.msgs.push({w:who||'bot',h:html});save();}return d;}
function chipRow(list,cls){var w=document.createElement('div');w.className='chips '+(cls||'');list.forEach(function(c){var b=document.createElement(c.href?'a':'button');b.className='chip'+(c.p?' chip-p':'');if(c.href){b.href=c.href;if(/^https?:/.test(c.href)){b.target='_blank';b.rel='noopener';}}else b.type='button';b.textContent=c.label;if(c.fn)b.addEventListener('click',c.fn);w.appendChild(b);});body.appendChild(w);scroll();return w;}
function typing(ms,then){var t=document.createElement('div');t.className='msg bot typing';t.setAttribute('aria-label','Assistant is typing');t.innerHTML='<i></i><i></i><i></i>';body.appendChild(t);scroll();
 setTimeout(function(){t.remove();then();},reduce?60:ms);}
function linkBtn(it){if(!it.link)return null;return {label:(it.cta||'Open')+' →',href:it.link,p:1};}
function consultChip(){return {label:'Book a free 15-min consultation',fn:consult};}
function emailChip(){return {label:'Email '+CONTACT,href:'mailto:'+CONTACT};}
function sendChip(){return {label:'Send this conversation to the team',fn:handoff};}

/* ---------- suggestions under the input ---------- */
var SUG={def:['topic:notindexed','topic:ai','topic:drop','topic:agency','topic:pricing','topic:consult'],
 agency:['topic:agency','topic:sample','topic:leads','topic:pricing','topic:payment','topic:consult'],
 business:['topic:local','topic:freecheck','topic:ai','topic:notindexed','topic:pricing','topic:consult'],
 store:['topic:store','topic:redirects','topic:notindexed','topic:drop','topic:pricing','topic:consult'],
 creator:['topic:youtube','topic:social','topic:diy','topic:pricing','topic:contact']};
function renderSug(){sug.innerHTML='';(SUG[S.ctx.aud]||SUG.def).forEach(function(id){var it=byId(id);if(!it)return;var b=document.createElement('button');b.type='button';b.className='chip';b.textContent=it.title;b.onclick=function(){ask(it.title,it);};sug.appendChild(b);});}

/* ---------- conversation logic ---------- */
var AUD_RE=[['agency',/\b(agency|agencies|white ?label|resell|my clients|client sites|freelancer|consultant)\b/i],
 ['store',/\b(online store|e-?commerce|ecom|shopify|woocommerce|my (shop|store)|retail|sell products)\b/i],
 ['business',/\b(clinic|dental|dentist|salon|spa|restaurant|cafe|cleaning|local business|small business|my business|service business|law firm|plumber|gym)\b/i],
 ['creator',/\b(youtuber|creator|influencer|my channel|tiktoker|content creator)\b/i]];
var AUD_TOPIC={agency:'topic:agency',store:'topic:store',business:'topic:local',creator:'topic:social'};
function detectAud(q){for(var i=0;i<AUD_RE.length;i++)if(AUD_RE[i][1].test(q))return AUD_RE[i][0];return null;}
function answer(it,extra){S.ctx.last=it.id;S.ctx.n=(S.ctx.n||0)+1;if(it.kind==='topic')S.ctx.topic=it.id;S.ctx.miss=0;save();
 var h=(extra?extra+' ':'')+it.a;
 if(it.tools&&it.tools.length)h+='<br><span class="try">Try it:</span> '+it.tools.map(function(t){return '<a href="'+esc(t[1])+'" target="_blank" rel="noopener">'+esc(t[0])+' →</a>';}).join(' · ');
 bubble(h);
 var c=[];var lb=linkBtn(it);if(lb)c.push(lb);
 if(it.pkg&&it.pkg!=='consultation'&&document.getElementById('contact-form'))c.push({label:it.pkg==='Free sample audit (agencies)'?'Request a free sample':(it.pkg==='Free site check'?'Get a free site check':'Book: '+it.pkg),fn:function(){toForm(it.pkg);}});
 if(it.id!=='topic:consult')c.push(consultChip());
 chipRow(c.slice(0,3),'after');renderSug();}
function clarify(r,q){S.ctx.miss++;save();
 var top=(r.oov&&r.oov.length?[]:r.res).filter(function(x){return x.it.kind!=='skill'&&x.s>=1.2;}).slice(0,3);
 if(top.length<2)top=['topic:notindexed','topic:ai','topic:pricing'].map(function(id){return {it:byId(id)};});
 var lead=S.ctx.miss>1?'I still can\'t match that to one of our tools or packages. ':'I\'m not sure I understood that. ';
 bubble(lead+'Is your question about <b>Google visibility</b>, <b>AI answers</b> (ChatGPT, Perplexity), <b>social media</b>, or <b>prices</b>? These might be close:');
 chipRow(top.map(function(x){return {label:x.it.title,fn:function(){ask(x.it.title,x.it);}};}));
 bubble('Or talk to a person: book a free 15-minute consultation, or email <a href="mailto:'+CONTACT+'">'+CONTACT+'</a>.');
 chipRow([consultChip(),emailChip(),sendChip()]);}
function reply(q){var ql=q.toLowerCase().trim();var it,aud=detectAud(q),wasAud=S.ctx.aud;if(aud){S.ctx.aud=aud;save();}
 var rest=toks(q.replace(/\b(i ?a?m|i'm|we are|we're|i run|we run|i have|we have|i own|own|run|a|an|my|our)\b/gi,' ')).filter(function(t){return ['agency','store','dental','clinic','salon','spa','restaurant','creator','youtuber','influencer','business','local','small','servic','client','ecommerce','shopify','retail','resell','white','label','whitelabel','product'].indexOf(t)<0;});
 if(/^(hi|hello|hey|salam|salaam|good (morning|evening|afternoon)|yo)\b[!. ]*$/i.test(ql)){bubble('Hello! I\'m an automated assistant for Cygnix Labs. Ask me about a problem with your site, our tools, or prices. For example: "Why isn\'t my site on Google?"');renderSug();return;}
 if(/^(thanks|thank you|thx|ty|great|perfect|cool|ok(ay)?|got it)\b[!. ]*$/i.test(ql)){bubble('You\'re welcome. If you want a person to look at your site, book a free 15-minute consultation or send this conversation to the team.');chipRow([consultChip(),sendChip()]);return;}
 if(/\b(are you|r u|is this|am i (talking|chatting) (to|with))\b.*\b(human|real|person|bot|robot|ai|automated|live)\b|\b(real person|live agent|talk to (a )?(human|person|someone))\b/i.test(ql)){
  bubble('I\'m an <b>automated assistant</b>, not a person. My answers come from our real tool catalogue, prices and FAQ. To reach the Cygnix team, book a free 15-minute consultation, email <a href="mailto:'+CONTACT+'">'+CONTACT+'</a>, or send this conversation and a person replies by email.');
  chipRow([consultChip(),sendChip(),emailChip()]);return;}
 /* profile statement only ("I'm an agency") */
 if(aud&&rest.length<=1){it=byId(AUD_TOPIC[aud]);if(it){answer(it,aud===wasAud?'':'Thanks, noted. I\'ll keep that in mind.');return;}}
 /* follow-ups about the last thing we discussed */
 var last=S.ctx.last&&byId(S.ctx.last);
 var priceQ=/\b(how much|price|pricing|cost|costs|fee|charge|expensive|cheap)\b/i.test(ql);
 if(priceQ&&rest.filter(function(t){return ['price','much'].indexOf(t)<0;}).length<=1&&!/\b(plan|plans|package|packages|all|everything|audit|sprint|monitor|growth)\b/i.test(ql)){
  if(last&&/^(actor|skill|bundle|package)$/.test(last.kind)){var m=last.a.match(/Price:<\/b> ([^<]+)|Price: <b>([^<]+)<\/b>|<b>(\$[^<]+)<\/b>/);
   if(m){bubble('<b>'+esc(last.title)+'</b>: '+(m[1]||m[2]||m[3]).replace(/\.$/,'')+'.');chipRow([linkBtn(last),consultChip()].filter(Boolean));return;}}
  if(S.ctx.aud==='agency'){answer(byId('topic:agency'),'For agencies:');return;}
  if(S.ctx.aud==='business'||S.ctx.aud==='store'){answer(byId('topic:pricing'),'For a single business site, the monthly plans or a one-time audit fit best.');return;}}
 if(last&&/^(link|url|where( can i| do i)? (get|find|buy) (it|this|that)|send (me )?(the )?link|tell me more|more( info| details)?|details|how does (it|this|that) work)\??$/i.test(ql)){
  var tool=last.tools&&last.tools[0]&&KB.filter(function(k){return k.link===last.tools[0][1];})[0];
  if(/more|detail|work/.test(ql)){if(last.kind!=='topic'){answer(last);return;}if(tool){answer(tool,'Here is more on the main tool for that:');return;}}
  var lk=last.link||(last.tools&&last.tools[0]&&last.tools[0][1]);
  if(lk){bubble('Here you go: <a href="'+esc(lk)+'"'+(/^https?:/.test(lk)?' target="_blank" rel="noopener"':'')+'>'+esc(last.link?(last.cta||last.title):last.tools[0][0])+' →</a>');return;}
  if(false){bubble('Here you go: <a href="'+esc(last.link)+'"'+(/^https?:/.test(last.link)?' target="_blank" rel="noopener"':'')+'>'+esc(last.cta||last.title)+' →</a>');return;}}
 var r=rank(q,S.ctx);var top=r.res[0];
 var ok=top&&top.s>=2.2&&(r.cov>=.34||top.s>=6)&&!(r.oov.length&&r.oov.length>=top.hit);
 if(!ok){clarify(r,q);return;}
 /* prefer a curated topic if it is close to the best hit */
 var best=top.it;
 if(priceQ){for(var pi=0;pi<Math.min(r.res.length,4);pi++){var px=r.res[pi];if(/^(actor|package|bundle)$/.test(px.it.kind)&&px.s>=top.s*.6){best=px.it;break;}}}
 else if(best.kind!=='topic'){for(var i=1;i<Math.min(r.res.length,6);i++){var x=r.res[i];if(x.it.kind==='topic'&&x.s>=top.s*.8){best=x.it;break;}}}
 answer(best);
 var seen={};seen[best.title]=1;(best.tools||[]).forEach(function(t){seen[t[1]]=1;});if(best.link)seen[best.link]=1;
 var rel=r.res.filter(function(x){if(x.it===best||x.s<top.s*.55||x.it.kind==='skill'||seen[x.it.title]||seen[x.it.link])return false;seen[x.it.title]=1;return true;}).slice(0,2);
 if(rel.length)chipRow(rel.map(function(x){var lt=x.it.title.split(':')[0];return {label:'Also: '+(lt.length>42?lt.slice(0,40)+'…':lt),fn:function(){ask(x.it.title,x.it);}};}),'rel');}
function ask(q,it){q=String(q||'').trim().slice(0,400);if(!q)return;bubble(esc(q),'me');sug.innerHTML='';
 loadKB().then(function(){typing(350+Math.min(900,q.length*12),function(){if(it)answer(it);else reply(q);});});}

/* ---------- actions ---------- */
function toForm(pkg){var f=document.getElementById('contact-form');
 if(!f){location.href='index.html?package='+(pkg==='Free 15-min consultation'?'consultation':encodeURIComponent(pkg))+'#contact';return;}
 if(CF.prefill)CF.prefill(pkg,'');else{var s=f.querySelector('[name=package]');if(s)s.value=pkg;}
 if(pkg==='Free 15-min consultation'){var m=f.querySelector('[name=message]');if(m&&!m.value)m.value='I\'d like a free 15-minute consultation. Topic: '+(S.ctx.topic&&byId(S.ctx.topic)?byId(S.ctx.topic).title:'');try{history.replaceState(null,'','?package=consultation#contact');}catch(e){}}
 if(matchMedia('(max-width: 760px)').matches)close();
 var c=document.getElementById('contact');if(c)c.scrollIntoView({behavior:reduce?'auto':'smooth'});
 var n=f.querySelector('[name=name]');if(n)setTimeout(function(){n.focus({preventScroll:true});},700);}
function consult(){bubble('Book a free 15-min consultation','me');bubble('Great. I\'ve opened the form with <b>Free 15-min consultation</b> selected. Add your name and email and the Cygnix team emails you to set a time.');toForm('Free 15-min consultation');}
function transcript(){return S.msgs.map(function(m){return (m.w==='me'?'Visitor: ':'Assistant: ')+txt(m.h);}).join('\n');}
function handoff(){if(body.querySelector('form.mini'))return body.querySelector('form.mini input').focus();
 bubble('Send this conversation to the Cygnix team','me');
 var f=document.createElement('form');f.className='mini msg bot';f.noValidate=false;
 f.innerHTML='<span>The team will read this chat and reply by email to:</span><input name="name" type="text" placeholder="Your name (optional)" autocomplete="name"><input name="email" type="email" required placeholder="Your email" autocomplete="email"><input name="site" type="text" placeholder="Your website (optional)" autocomplete="url"><button class="btn btn-p btn-sm" type="submit">Send to the team</button>';
 body.appendChild(f);scroll();f.querySelector('[name=email]').focus();
 f.addEventListener('submit',function(e){e.preventDefault();if(!f.email.value||!/.+@.+\..+/.test(f.email.value)){f.email.focus();return;}
  var b=f.querySelector('button');b.disabled=true;b.textContent='Sending…';var t=transcript();
  var top=S.ctx.topic&&byId(S.ctx.topic);
  var data={_subject:'Cygnix site chat: '+(top?top.title:'conversation')+(f.name.value?' — '+f.name.value:''),name:f.name.value,email:f.email.value,_replyto:f.email.value,website:f.site.value,
   type:S.ctx.aud||'',package:'Talk to us (chat)',message:'Conversation with the automated assistant on '+location.pathname,transcript:t.length>1800?'…'+t.slice(-1800):t};
  if(!CF.send){location.href='mailto:'+CONTACT+'?subject='+encodeURIComponent(data._subject)+'&body='+encodeURIComponent(data.transcript);return;}
  CF.send(data).then(function(j){f.remove();bubble(j&&j.mailto?'Your email app should open with this conversation addressed to <a href="mailto:'+CONTACT+'">'+CONTACT+'</a>. Press Send there and a person replies by email.':'Sent ✓ The Cygnix team will reply to <b>'+esc(f.email.value)+'</b> by email, usually within 1–2 business days.');})
  .catch(function(){b.disabled=false;b.textContent='Send to the team';bubble('That didn\'t go through. Please email <a href="mailto:'+CONTACT+'">'+CONTACT+'</a>.');});});}
act.addEventListener('click',function(e){var b=e.target.closest('.ca');if(!b)return;if(b.dataset.a==='send')handoff();else consult();});

/* ---------- open / close ---------- */
function restore(){body.innerHTML='';S.msgs.forEach(function(m){bubble(m.h,m.w,true);});}
function greet(){bubble('Hi! I\'m the <b>Cygnix assistant</b>, an automated helper (not a person). Ask me anything about getting found on Google or in AI answers, our tools, or prices. Tell me if you\'re an agency, a local business or an online store and I\'ll tailor my answers.');}
function open(){chat.classList.add('open');if(fab)fab.setAttribute('aria-expanded','true');document.documentElement.classList.add('chat-open');
 if(!body.children.length){if(S.msgs.length)restore();else greet();}
 loadKB().then(renderSug);
 if(!matchMedia('(max-width: 760px)').matches)setTimeout(function(){input&&input.focus();},60);}
function close(){chat.classList.remove('open');if(fab)fab.setAttribute('aria-expanded','false');document.documentElement.classList.remove('chat-open');}
window.CygChat={open:open,close:close,ask:function(q){open();ask(q);},_reply:function(q){return loadKB().then(function(){body.innerHTML='';var m0=S.ctx.miss,n0=S.ctx.n;reply(q);return {text:body.innerText,id:S.ctx.n!==n0?S.ctx.last:null,clarified:S.ctx.miss>m0,aud:S.ctx.aud};});}};
document.querySelectorAll('[data-chat]').forEach(function(b){b.addEventListener('click',function(e){e.preventDefault();open();});});
if(fab)fab.addEventListener('click',function(){chat.classList.contains('open')?close():open();});
var x=chat.querySelector('.chat-x');if(x)x.addEventListener('click',close);
if(fm)fm.addEventListener('submit',function(e){e.preventDefault();var v=input.value.trim();if(!v)return;input.value='';ask(v);});
document.addEventListener('keydown',function(e){if(e.key==='Escape'&&chat.classList.contains('open'))close();});
if('requestIdleCallback' in window)requestIdleCallback(function(){loadKB();},{timeout:4000});
})();
