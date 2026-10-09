import {initializeApp} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import {getAuth,onAuthStateChanged,signInWithEmailAndPassword,createUserWithEmailAndPassword,signOut} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import {initializeFirestore,collection,doc,getDoc,getDocs,setDoc,deleteDoc,updateDoc,query,orderBy,limit} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

const C=window.VI_CONFIG||{};
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const IND='Agriculture,Construction,Forestry,Hydraulics,Industrial,Marine,Mining,Pumps,Renewable Energy,Transport,Water & Wastewater,Valves'.split(',').join('\n');
const SECS=['Overview','Problem','Solution','Result'];
const DS={pri:'#0f3f4a',amb:'#c9861a',r:10,font:'cond',mode:'auto',company:'Vesconite',footer:'',pdfAcc:'#c9861a',cover:'dark',logo:true,pp:1,secs:SECS,feat:{oem:true,ins:true,qr:true,pv:true},ind:IND,dw:{logo:'',logoR:1,showLogo:true,company:'VESCONITE',title:'INDUSTRIAL BEARING BUSH',prefix:'VI',rev:'A',paper:'a3',who:'auto',whoText:'',fit:true,notes:true,noteText:'1. ALL DIMENSIONS IN mm, FOR A FREE-STANDING BUSH AT 20 °C.\n2. TOLERANCES: OD AND ID ±0.1% (MIN ±0.025); WALL +0/−0.5% (MIN −0.025);\n    LENGTH +0/−0.5% (MIN −0.3). STANDARD VESCONITE MACHINING TOLERANCES.\n3. CONTROL WALL THICKNESS AND OUTSIDE DIAMETER WHEN MACHINING.\n4. SIZES FROM THE VESCONITE DESIGN MANUAL EQUATIONS. VERIFY BEFORE MANUFACTURE.\n5. {FIT}'}};
DS.dsc={v:{c:'#8a8d91',a:.3},h:{c:'#efe6cf',a:.6},h10:{c:'#e6dcc0',a:.55},h20:{c:'#ddd0ab',a:.55},s:{c:'#7fa3b8',a:.35},t150:{c:'#d9822b',a:.3},t160:{c:'#c9472b',a:.3},t230:{c:'#8f2d2d',a:.3},f:{c:'#3d3d42',a:.3},n:{c:'#d8d2c4',a:.55},pc:{c:'#c5ccd2',a:.55}};
let S={...DS},ME=null,ROLE=null,A=[],O=[],P=[],ready=false,au,db;
try{P=JSON.parse(localStorage.getItem('vi4p')||'[]')}catch{}
const can=k=>k==='edit'?['admin','editor'].includes(ROLE):ROLE==='admin';
const dc=(n,i)=>doc(db,n,i),col=n=>collection(db,n);
const byDate=(x,y)=>(y.date||'').localeCompare(x.date||'');
const T=(p,ms=40000)=>Promise.race([p,new Promise((_,no)=>setTimeout(()=>no(new Error('Timed out. Check your connection and try again. If it keeps happening, check that the Firestore database exists and the rules are published.')),ms))]);
const clean=o=>JSON.parse(JSON.stringify(o));
const LIBS={three:['https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js','https://cdn.jsdelivr.net/npm/three@0.128.0/build/three.min.js'],qr:['https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js','https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js']},LP={};
const lib=k=>LP[k]||(LP[k]=(async()=>{for(const u of LIBS[k]){try{await new Promise((ok,no)=>{const s=document.createElement('script');s.src=u;s.onload=ok;s.onerror=no;document.head.appendChild(s)});return}catch{}}delete LP[k];throw new Error('Could not load the '+k+' library. Check your connection.')})());
const OKR=['admin','editor','viewer'];
const cacheSave=()=>{try{localStorage.setItem('vi4d',JSON.stringify({uid:ME&&ME.uid,role:ROLE,A,O}))}catch{}};
const cacheGet=()=>{try{return JSON.parse(localStorage.getItem('vi4d')||'null')}catch{return null}};
const log=(action,target='',detail='')=>{if(!ME||!db)return;setDoc(dc('activity',crypto.randomUUID()),{t:new Date().toISOString(),uid:ME.uid,email:ME.email||'',action,target:String(target||''),detail:String(detail||'')}).catch(()=>{})};
let NB=0;
async function notifCheck(){   /* admin badge: people waiting for access + changes by others since the admin last opened Admin */
  if(!ME||!can('del'))return;
  try{
    const seen=localStorage.getItem('vi4seen')||'';
    const[m,a]=await Promise.all([getDocs(col('members')),getDocs(query(col('activity'),orderBy('t','desc'),limit(100)))]);
    NB=m.docs.filter(d=>d.data().role==='pending').length+a.docs.filter(d=>{const x=d.data();return x.t>seen&&x.uid!==ME.uid}).length;
    const b=$('#ad');b.textContent=NB?`Admin · ${NB}`:'Admin';b.classList.toggle('alert',NB>0);
  }catch{}
}
const mergeS=d=>({...DS,...d,feat:{...DS.feat,...(d.feat||{})},dw:{...DS.dw,...(d.dw||{})},dsc:{...DS.dsc,...(d.dsc||{})}});
const indChoices=cur=>{const l=[...new Set([...S.ind.split('\n').map(x=>x.trim()).filter(Boolean),...A.map(a=>a.industry).filter(Boolean),...O.map(o=>o.industry).filter(Boolean)])].sort((x,y)=>x.localeCompare(y));if(cur&&!l.includes(cur))l.push(cur);return l};
const indSelect=(cur,sid,oid,wid)=>`<label>Industry<select name="industry" id="${sid}" required><option value="">Select industry…</option>${indChoices(cur).map(i=>`<option ${i===cur?'selected':''}>${esc(i)}</option>`).join('')}<option value="__other">Other (type a new one)…</option></select></label><label id="${wid}" hidden>New industry name<input id="${oid}" autocomplete="off"></label>`;
const indBind=(sid,wid)=>{const s=$('#'+sid);if(s)s.onchange=()=>{$('#'+wid).hidden=s.value!=='__other'}};
const indList=()=>S.ind.split('\n').map(x=>x.trim()).filter(Boolean);

/* ---------- Data (Firestore only: no paid Storage plan needed) ---------- */
const load=async()=>{const[a,o]=await Promise.all([getDocs(col('apps')),getDocs(col('oem'))]);A=a.docs.map(d=>({photos:[],...d.data(),id:d.id})).sort(byDate);O=o.docs.map(d=>({...d.data(),id:d.id})).sort(byDate);cacheSave()};
const CH=700000;  /* files are stored as base64 chunks, each under Firestore's 1 MiB document limit */
const putFile=async s=>{const id=crypto.randomUUID(),n=Math.ceil(s.length/CH);await Promise.all(Array.from({length:n},(_,i)=>setDoc(dc('files',`${id}_${i}`),{d:s.slice(i*CH,(i+1)*CH)})));return{id,n}};
const getFile=async f=>(await Promise.all([...Array(f.n).keys()].map(i=>getDoc(dc('files',`${f.id}_${i}`))))).map(d=>d.data().d).join('');
const delFile=f=>f?Promise.all([...Array(f.n).keys()].map(i=>deleteDoc(dc('files',`${f.id}_${i}`)))).catch(()=>{}):0;
const safe=r=>clean({name:r.name,industry:r.industry,product:r.product,desc:r.summary||r.desc,problem:r.problem,solution:r.solution,proof:r.proof,photos:r.photos});
const save=async r=>{const{id,...d}=clean(r);await setDoc(dc('apps',id),d);if(r.shared)await setDoc(dc('shared',id),safe(r));A=[{photos:[],...clean(r)},...A.filter(x=>x.id!==id)].sort(byDate);cacheSave()};
const commit=async(r,items,cb)=>{let n=0;const[ph,th]=await Promise.all([Promise.all(items.map(async p=>{const f=p.ref||await putFile(p.src);cb&&cb(++n,items.length);return f})),items[0]&&items[0].src?fit(items[0].src,160,.5):Promise.resolve(r.thumb||'')]);r.photos=ph;r.thumb=items[0]?th:'';await save(r)};
const remove=async a=>{await Promise.all(a.photos.map(delFile));await deleteDoc(dc('shared',a.id)).catch(()=>{});await deleteDoc(dc('apps',a.id));A=A.filter(x=>x.id!==a.id);cacheSave();log('Deleted application',a.name)};
const norm=r=>({name:r.name,industry:r.industry||'Other',product:r.product,desc:r.desc??r.description,problem:r.problem,solution:r.solution,proof:r.proof??r.outcome,summary:r.summary??r.customerSummary,orig:r.orig??r.original,env:r.env??r.environment,load:r.load,temp:r.temp??r.temperature,lube:r.lube??r.lubrication,customer:r.customer,author:r.author,id:crypto.randomUUID(),date:r.date||new Date().toISOString(),photos:[],src:(r.photos||(r.photo?[r.photo]:[])).map(p=>p.src||p).filter(p=>typeof p==='string'&&p.startsWith('data:'))});

/* ---------- Helpers ---------- */
const img=s=>new Promise((ok,no)=>{const i=new Image();i.onload=()=>ok(i);i.onerror=()=>no(new Error('Image failed to load'));i.src=s});
const fit=async(src,max,q)=>{const i=await img(src),s=Math.min(1,max/Math.max(i.width,i.height)),c=document.createElement('canvas');c.width=Math.round(i.width*s);c.height=Math.round(i.height*s);c.getContext('2d').drawImage(i,0,0,c.width,c.height);return c.toDataURL('image/jpeg',q)};
const shrink=async f=>{const u=URL.createObjectURL(f);try{return await fit(u,900,.6)}finally{URL.revokeObjectURL(u)}};
const rd=f=>new Promise(ok=>{const r=new FileReader();r.onload=()=>ok(r.result);r.readAsDataURL(f)});
const score=a=>['problem','solution','proof','summary'].filter(k=>a[k]).length+(a.photos.length?1:0);
const grade=a=>{const s=score(a);return s>=4?['Complete','ok']:s>=2?['Needs detail','warn']:['Draft','bad']};
const chip=a=>{const[g,c]=grade(a);return `<span class="chip ${c}">${g}</span>`};
const row=a=>`<a class="row" href="#/app/${a.id}"><div class="th">${a.thumb?`<img src="${a.thumb}" alt="">`:'▣'}</div><div><strong>${esc(a.name)}</strong><small>${esc([a.industry,a.product].filter(Boolean).join(' · '))}</small></div>${chip(a)}</a>`;
const sel=(n,o,v)=>`<select name="${n}">${o.map(([k,l])=>`<option value="${k}" ${String(k)===String(v)?'selected':''}>${l}</option>`).join('')}</select>`;
const ckb=(n,c,l,v='on')=>`<label class="ck"><input type="checkbox" name="${n}" value="${v}" ${c?'checked':''}>${l}</label>`;
const lazyImgs=(box,refs)=>{box.innerHTML=refs.map(()=>'<img alt="" style="background:var(--line);min-height:180px">').join('');refs.forEach(async(r,i)=>{try{box.children[i].src=await getFile(r)}catch{}})};

/* ---------- Theme (admin-controlled) ---------- */
function apply(s){
  const R=document.documentElement,dk=R.dataset.t==='dark';
  R.style.setProperty('--pri',dk?s.amb:s.pri);R.style.setProperty('--amb',s.amb);R.style.setProperty('--rd',s.r+'px');
  R.style.setProperty('--f1',s.font==='serif'?'Georgia,"Times New Roman",serif':s.font==='std'?'var(--f2)':'"Barlow Condensed","Arial Narrow",sans-serif');
  $('#t-oem').hidden=!s.feat.oem;
}
const setT=t=>{document.documentElement.dataset.t=t;$('meta[name=theme-color]').content=t==='dark'?'#0b1317':'#e6eaec';try{localStorage.setItem('vi4t',t)}catch{}apply(S)};
let t0;try{t0=localStorage.getItem('vi4t')}catch{}
setT(t0||(matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light'));
$('#th').onclick=()=>setT(document.documentElement.dataset.t==='dark'?'light':'dark');
$('#ad').onclick=()=>{location.hash='#/admin'};

/* ---------- Views ---------- */
function login(v){
  v.innerHTML=`<h1>Sign in</h1><form id="LF"><label>Email<input name="e" type="email" required autocomplete="username"></label><label>Password<input name="p" type="password" required minlength="6" autocomplete="current-password"></label><button class="btn pri wide">Sign in</button><button type="button" class="btn wide" id="su" style="margin-top:10px">Create account</button></form><p class="mut" style="margin-top:14px">New accounts need approval from an admin before they can see any data.</p>`;
  const go=async mk=>{const f=new FormData($('#LF')),e=f.get('e').trim(),p=f.get('p');try{mk?await createUserWithEmailAndPassword(au,e,p):await signInWithEmailAndPassword(au,e,p)}catch(x){alert(x.message.replace('Firebase: ',''))}};
  $('#LF').onsubmit=e=>{e.preventDefault();go(false)};$('#su').onclick=()=>$('#LF').reportValidity()&&go(true);
}
function pending(v){v.innerHTML=`<h1>Waiting for approval</h1><p class="lead">Your account (${esc(ME.email)}) is created. An admin needs to give you access.</p><button class="btn" id="so">Sign out</button>`;$('#so').onclick=()=>signOut(au)}
function home(v){
  const need=A.filter(a=>!a.proof||!a.photos.length).slice(0,4);
  v.innerHTML=`<section class="hero"><h1>Every installation, on the record.</h1><p>Capture the problem, the fix and the proof while it is fresh. Then turn the best of it into a customer portfolio.</p><div class="acts">${can('edit')?'<a class="btn pri" href="#/new">Capture application</a>':''}<a class="btn" href="#/library">Open library</a>${S.feat.ins?'<a class="btn" href="#/insights">Insights</a>':''}</div></section>
  <div class="stats"><div><b>${A.length}</b><span>applications</span></div><div><b>${new Set(A.map(a=>a.industry)).size}</b><span>industries</span></div><div><b>${A.reduce((n,a)=>n+a.photos.length,0)}</b><span>photos</span></div></div>
  ${A.length?charts():''}<h2>Needs evidence</h2>${need.length?`<div class="list">${need.map(row).join('')}</div>`:`<p class="empty">${A.length?'Every record has a result and a photo.':'Nothing captured yet. Start with your best-known installation.'}</p>`}
  ${A.length?`<h2>Recent</h2><div class="list">${A.slice(0,3).map(row).join('')}</div>`:''}`;
}
const F={q:'',i:'',c:''};
function library(v){
  const inds=[...new Set(A.map(a=>a.industry))].sort();
  v.innerHTML=`<h1>Library</h1><div class="filters"><input id="q" type="search" placeholder="Search name, product, customer, notes" value="${esc(F.q)}"><select id="fi"><option value="">All industries</option>${inds.map(i=>`<option ${i===F.i?'selected':''}>${esc(i)}</option>`).join('')}</select><select id="fc"><option value="">Any quality</option>${['Complete','Needs detail','Draft'].map(g=>`<option ${g===F.c?'selected':''}>${g}</option>`).join('')}</select></div><div class="list" id="L"></div>`;
  const upd=()=>{const q=F.q.toLowerCase(),l=A.filter(a=>(!F.i||a.industry===F.i)&&(!F.c||grade(a)[0]===F.c)&&[a.name,a.industry,a.product,a.customer,a.desc,a.problem,a.solution,a.proof].join(' ').toLowerCase().includes(q));$('#L').innerHTML=l.length?l.map(row).join(''):`<p class="empty">${A.length?'No applications match.':'The library is empty. Capture the first application.'}</p>`};
  $('#q').oninput=e=>{F.q=e.target.value;upd()};$('#fi').onchange=e=>{F.i=e.target.value;upd()};$('#fc').onchange=e=>{F.c=e.target.value;upd()};upd();
}
function detail(v,id){
  const a=A.find(x=>x.id===id);
  if(!a){v.innerHTML='<a class="back" href="#/library">← Library</a><p class="empty">Record not found.</p>';return}
  const spec=[['Environment',a.env],['Load / speed',a.load],['Temperature',a.temp],['Lubrication',a.lube],['Original material',a.orig],['Customer / OEM',a.customer]].filter(x=>x[1]);
  v.innerHTML=`<a class="back" href="#/library">← Library</a>${a.photos.length?'<div class="strip" id="st"></div>':''}<h1>${esc(a.name)}</h1><div class="meta">${chip(a)}<span>${esc(a.industry)}</span>${a.product?`<span>· ${esc(a.product)}</span>`:''}</div><p class="lead">${esc(a.desc)}</p>
  ${spec.length?`<dl class="spec">${spec.map(([k,x])=>`<dt>${k}</dt><dd>${esc(x)}</dd>`).join('')}</dl>`:''}
  ${[['Problem',a.problem],['Solution',a.solution],['Result',a.proof]].map(([k,x])=>`<section class="story"><h3>${k}</h3><p>${x?esc(x):'<span class="mut">Not recorded yet.</span>'}</p></section>`).join('')}
  <div class="card" id="qr" hidden></div>
  <div class="acts"><button class="btn" id="spf">${P.includes(a.id)?`Open customer portfolio (${P.length})`:P.length?`Add to customer portfolio (${P.length})`:'Start customer portfolio'}</button>${P.length&&!P.includes(a.id)?'<button class="btn" id="npf">Start a new portfolio</button>':''}${can('edit')?`<a class="btn pri" href="#/edit/${a.id}">Edit</a>${S.feat.qr?'<button class="btn" id="sh">Share / QR</button>':''}`:''}${can('edit')?'<button class="btn bad" id="dl">Delete</button>':''}</div>`;
  if(a.photos.length)lazyImgs($('#st'),a.photos);
  $('#spf').onclick=()=>{if(!P.includes(a.id))P.push(a.id);savePf();location.hash='#/portfolio'};if($('#npf'))$('#npf').onclick=()=>{P=[a.id];savePf();location.hash='#/portfolio'};
  const link=`${location.origin}${location.pathname}#/share/${a.id}`,show=()=>{const q=$('#qr');q.hidden=false;q.innerHTML=`<h2>Customer-safe link</h2><div id="qc"></div><p class="mut" style="word-break:break-all">${esc(link)}</p><p class="mut">Shows only the overview, problem, solution, result and photos.</p><div class="acts"><button class="btn" id="cp">Copy link</button><button class="btn bad" id="us">Stop sharing</button></div>`;lib('qr').then(()=>new QRCode($('#qc'),{text:link,width:200,height:200})).catch(()=>{});$('#cp').onclick=()=>navigator.clipboard.writeText(link).then(()=>alert('Link copied.'));$('#us').onclick=async()=>{try{a.shared=false;await save(a);await deleteDoc(dc('shared',a.id));log('Stopped sharing',a.name);q.hidden=true}catch(x){alert(x.message)}}};
  if(a.shared)show();
  if($('#sh'))$('#sh').onclick=async()=>{try{a.shared=true;await save(a);log('Shared application',a.name);show()}catch(x){a.shared=false;alert(x.message)}};
  if($('#dl'))$('#dl').onclick=async()=>{if(confirm('Delete this application? This cannot be undone.')){try{await remove(a);location.hash='#/library'}catch(x){alert(x.message)}}};
}
async function share(v,id){
  v.innerHTML='<p class="empty">Loading…</p>';
  let d;try{const s=await getDoc(dc('shared',id));d=s.exists()?s.data():null}catch{}
  if(!d){v.innerHTML='<h1>Not available</h1><p class="mut">This application is not shared, or the link is wrong.</p>';return}
  v.innerHTML=`${d.photos?.length?'<div class="strip" id="st"></div>':''}<h1>${esc(d.name)}</h1><div class="meta"><span>${esc(d.industry)}</span>${d.product?`<span>· ${esc(d.product)}</span>`:''}</div><p class="lead">${esc(d.desc)}</p>${[['Problem',d.problem],['Solution',d.solution],['Result',d.proof]].filter(x=>x[1]).map(([k,x])=>`<section class="story"><h3>${k}</h3><p>${esc(x)}</p></section>`).join('')}<p class="mut">Shared from Vesco Intelligence</p>`;
  if(d.photos?.length)lazyImgs($('#st'),d.photos);
}
async function form(v,id){
  const a=A.find(x=>x.id===id)||{photos:[]};
  v.innerHTML='<p class="empty">Loading…</p>';
  let ph;try{ph=await Promise.all(a.photos.map(async r=>({ref:r,src:await getFile(r)})))}catch{v.innerHTML='<p class="empty">Could not load photos.</p>';return}
  const removed=[];
  const f=(k,l,t,ex='')=>`<label>${l}${t==='area'?`<textarea name="${k}" rows="3">${esc(a[k])}</textarea>`:`<input name="${k}" value="${esc(a[k])}" ${ex}>`}</label>`;
  v.innerHTML=`<a class="back" href="#/${id?'app/'+id:'library'}">← Cancel</a><h1>${id?'Edit':'Capture'} application</h1><form id="F">
  ${f('name','Application name','','required')}${indSelect(a.industry,'indSel','indOther','indOtherW')}${f('product','Product / material')}${f('desc','What does it do, and where is it used?','area')}
  <fieldset><legend>Customer story</legend>${f('problem','Problem','area')}${f('solution','Solution','area')}${f('proof','Result / proof','area')}${f('summary','Customer-safe summary','area')}</fieldset>
  <fieldset><legend>Operating conditions</legend>${f('orig','Original material')}${f('env','Environment')}${f('load','Load / movement / speed')}${f('temp','Temperature')}${f('lube','Lubrication')}${f('customer','Customer / OEM')}</fieldset>
  <fieldset><legend>Photos <small id="pc"></small></legend><div class="pg" id="pg"></div><div class="acts"><label class="btn">Take photo<input type="file" accept="image/*" capture="environment" hidden id="p1"></label><label class="btn">Choose photos<input type="file" accept="image/*" multiple hidden id="p2"></label></div></fieldset>
  ${f('author','Recorded by')}<button class="btn pri wide">Save application</button></form>`;
  const rp=()=>{$('#pg').innerHTML=ph.map((p,i)=>`<figure><img src="${p.src}" alt=""><button type="button" data-i="${i}" aria-label="Remove photo">×</button></figure>`).join('');$('#pc').textContent=`${ph.length}/10`;$$('#pg button').forEach(b=>b.onclick=()=>{const[x]=ph.splice(+b.dataset.i,1);if(x.ref)removed.push(x.ref);rp()})};rp();
  const add=async e=>{for(const fl of [...e.target.files]){if(ph.length>=10){alert('Maximum 10 photos per application.');break}try{ph.push({src:await shrink(fl)})}catch{alert('One photo could not be read.')}}e.target.value='';rp()};
  $('#p1').onchange=add;$('#p2').onchange=add;indBind('indSel','indOtherW');
  $('#F').onsubmit=async e=>{e.preventDefault();const b=e.submitter,d=Object.fromEntries(new FormData(e.target));if(d.industry==='__other'){d.industry=($('#indOther').value||'').trim();if(!d.industry){alert('Type the new industry name.');return}}b.disabled=true;b.textContent='Saving…';const r={...a,...d,id:a.id||crypto.randomUUID(),date:a.date||new Date().toISOString()};try{await T(commit(r,ph,(d,t)=>{b.textContent=d<t?`Uploading photos ${d}/${t}…`:'Saving record…'}),90000);await Promise.all(removed.map(delFile));log(a.id?'Edited application':'Created application',r.name);location.hash='#/app/'+r.id}catch(x){b.disabled=false;b.textContent='Save application';alert('Could not save: '+(x.message||x))}};
}
function oem(v){
  const inds=[...new Set(O.map(o=>o.industry).filter(Boolean))].sort();
  v.innerHTML=`<h1>OEM references</h1><p class="mut">Public OEM material by application and industry. Add a web link, a PDF, or both.</p>
  ${can('edit')?`<details class="card"><summary class="btn pri">+ Add reference</summary><form id="OF"><label>Application / title<input name="app" required></label>${indSelect('','oiSel','oiOther','oiOtherW')}<label>OEM / manufacturer<input name="maker"></label><label>Web link<input name="url" type="url" inputmode="url" placeholder="https://"></label><label>PDF (max 3 MB)<input name="f" type="file" accept="application/pdf"></label><label>Notes<textarea name="notes" rows="2"></textarea></label><button class="btn pri wide">Save reference</button></form></details>`:''}
  <div class="filters"><input id="oq" type="search" placeholder="Search references"><select id="oi"><option value="">All industries</option>${inds.map(i=>`<option>${esc(i)}</option>`).join('')}</select></div><div class="list" id="OL"></div>`;
  const upd=()=>{const q=$('#oq').value.toLowerCase(),i=$('#oi').value,l=O.filter(o=>(!i||o.industry===i)&&[o.app,o.industry,o.maker,o.notes].join(' ').toLowerCase().includes(q));
    $('#OL').innerHTML=l.length?l.map(o=>`<div class="card" style="margin:0"><strong>${esc(o.app)}</strong><small class="mut" style="display:block">${esc([o.industry,o.maker].filter(Boolean).join(' · '))}</small>${o.notes?`<p>${esc(o.notes)}</p>`:''}<div class="acts">${o.url?`<a class="btn" target="_blank" rel="noopener" href="${esc(o.url)}">Open link</a>`:''}${o.pdf?`<button class="btn" data-pdf="${o.id}">Open PDF</button>`:''}${can('del')?`<button class="btn bad" data-d="${o.id}">Delete</button>`:''}</div></div>`).join(''):'<p class="empty">No references yet.</p>';
    $$('[data-pdf]').forEach(b=>b.onclick=async()=>{const o=O.find(x=>x.id===b.dataset.pdf),w=window.open('','_blank');try{const u=URL.createObjectURL(await(await fetch(await getFile(o.pdf))).blob());w?w.location=u:location.href=u}catch{w&&w.close();alert('Could not open the PDF.')}});
    $$('[data-d]').forEach(b=>b.onclick=async()=>{const o=O.find(x=>x.id===b.dataset.d);if(confirm('Delete this reference?')){try{await delFile(o.pdf);await deleteDoc(dc('oem',o.id));log('Deleted OEM reference',o.app);await load();render()}catch(x){alert(x.message)}}})};
  $('#oq').oninput=upd;$('#oi').onchange=upd;upd();
  indBind('oiSel','oiOtherW');
  if($('#OF'))$('#OF').onsubmit=async e=>{e.preventDefault();const f=new FormData(e.target),file=f.get('f'),u=(f.get('url')||'').trim(),has=file&&file.size,ind=f.get('industry')==='__other'?($('#oiOther').value||'').trim():f.get('industry'),d={app:f.get('app'),industry:ind,maker:f.get('maker'),notes:f.get('notes'),date:new Date().toISOString()};
    if(!ind)return alert('Choose an industry.');
    if(u){if(!/^https?:\/\//i.test(u))return alert('The link must start with http:// or https://');d.url=u}
    if(!u&&!has)return alert('Add a web link, a PDF, or both.');
    if(has&&file.size>3e6)return alert('That PDF is over 3 MB. Use a smaller file, or add its web link instead.');
    const b=e.submitter;b.disabled=true;b.textContent='Saving…';
    try{if(has){d.pdf=await T(putFile(await rd(file)),90000);d.pdf.name=file.name}const oid=crypto.randomUUID();await T(setDoc(dc('oem',oid),d));O=[{...d,id:oid},...O];log('Added OEM reference',d.app);render()}catch(x){b.disabled=false;b.textContent='Save reference';alert('Could not save: '+(x.message||x))}};
}
const count=k=>A.reduce((m,a)=>{const x=a[k]||'Unspecified';m[x]=(m[x]||0)+1;return m},{});
const bars=m=>{const e=Object.entries(m).sort((a,b)=>b[1]-a[1]),mx=Math.max(1,...e.map(x=>x[1]));return e.length?e.map(([k,n])=>`<div class="bar"><span>${esc(k)}</span><i style="--w:${n/mx*100}%"></i><b>${n}</b></div>`).join(''):'<p class="empty">No data yet.</p>'};
function insights(v){const q=A.reduce((m,a)=>{const g=grade(a)[0];m[g]=(m[g]||0)+1;return m},{});v.innerHTML=`<h1>Insights</h1><div class="card"><h2>By industry</h2>${bars(count('industry'))}</div><div class="card"><h2>By product</h2>${bars(count('product'))}</div><div class="card"><h2>Record quality</h2>${bars(q)}</div>`}

/* ---------- Portfolio PDF (colours, logo, sections, footer all come from Admin settings) ---------- */
const rgb=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16));
const repoLogo=async()=>{try{const r=await fetch('vesco-intelligence-logo-header.png');if(!r.ok)return null;const u=await rd(await r.blob()),i=await img(u);return{u,r:i.width/i.height}}catch{return null}};
const logoData=async()=>S.logo?(S.dw.logo?{u:S.dw.logo,r:S.dw.logoR||1}:repoLogo()):null;
/* ---------- Customer portfolio: searchable picker and a designed PDF proposal ---------- */
const savePf=()=>{try{localStorage.setItem('vi4p',JSON.stringify(P))}catch{}};
const svgClip=(u,x,y,w,h,r,id)=>`<clipPath id="${id}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}"/></clipPath><image x="${x}" y="${y}" width="${w}" height="${h}" href="${u}" xlink:href="${u}" preserveAspectRatio="xMidYMid slice" clip-path="url(#${id})"/>`;
const tw=(t,fs,b)=>{_mc.font=`${b?'bold ':''}100px Arial`;return _mc.measureText(String(t)).width*fs/100};
async function pdf(ids,o){
  const acc=S.pdfAcc||'#c9861a',ink='#0e1a20',logo=await logoData(),apps=ids.map(id=>A.find(x=>x.id===id)).filter(Boolean),pages=[],N=apps.length;
  const photo=async r=>{try{const u=await getFile(r),im=await img(u);return{u,w:im.width,h:im.height}}catch{return null}};
  const lg=(max)=>{if(!logo)return null;const h=Math.min(max,max*1.9/logo.r),w=h*logo.r;return{w,h}};
  let cur,y,label='';
  const np=l=>{label=l||label;cur=[`<rect width="210" height="19" fill="${ink}"/><rect y="19" width="210" height="1.6" fill="${acc}"/>`,`<text x="14" y="11.8" font-size="3.3" font-weight="bold" letter-spacing=".6" fill="#fff">${esc(label)}</text>`];
    const s=lg(9);if(s)cur.push(`<rect x="${196-s.w-4}" y="4.2" width="${s.w+8}" height="${s.h+2}" rx="1.5" fill="#fff"/>`,svgImg(logo.u,196-s.w,5.2,s.w,s.h));pages.push(cur);y=32};
  const room=h=>{if(y+h>276)np(label)};
  const para=(t,x,w,fs,fill,bold,lh)=>{for(const l of wrapLines(t,w,fs,bold)){room(lh);cur.push(`<text x="${x}" y="${y}" font-size="${fs}" fill="${fill}"${bold?' font-weight="bold"':''}>${esc(l)}</text>`);y+=lh}};
  const callout=(lab,text,res)=>{const lines=wrapLines(text,160,3.7).slice(0,34),h=11+lines.length*5.3;room(h+4);
    cur.push(`<rect x="14" y="${y}" width="182" height="${h}" rx="2.5" fill="${res?acc:'#eef2f4'}" fill-opacity="${res?.15:1}"/><rect x="14" y="${y}" width="2.4" height="${h}" fill="${acc}"/><text x="21" y="${y+6.6}" font-size="3" font-weight="bold" letter-spacing=".7" fill="${res?acc:'#566870'}">${lab.toUpperCase()}</text>`);
    lines.forEach((l,i)=>cur.push(`<text x="21" y="${y+12.4+i*5.3}" font-size="3.7" fill="${ink}"${res?' font-weight="bold"':''}>${esc(l)}</text>`));y+=h+5};
  /* ---- cover */
  const hero=apps.length&&apps[0].photos[0]?await photo(apps[0].photos[0]):null;
  const dark=S.cover!=='light',bg=S.cover==='light'?'#f4f6f7':S.cover==='accent'?acc:ink,tc=dark?'#ffffff':ink,sc=S.cover==='accent'?'#ffffff':acc;
  const cov=[`<rect width="210" height="297" fill="${bg}"/>`];
  if(hero)cov.push(svgClip(hero.u,0,0,210,172,0,'hc'));else cov.push(`<rect width="210" height="172" fill="${acc}" fill-opacity=".3"/><circle cx="170" cy="60" r="70" fill="${acc}" fill-opacity=".25"/><circle cx="40" cy="140" r="50" fill="#fff" fill-opacity=".08"/>`);
  cov.push(`<defs><linearGradient id="hg" x1="0" y1="0" x2="0" y2="1"><stop offset=".4" stop-color="#0e1a20" stop-opacity="0"/><stop offset="1" stop-color="#0e1a20" stop-opacity=".8"/></linearGradient></defs><rect width="210" height="172" fill="url(#hg)"/>`,`<polygon points="0,158 210,134 210,147 0,172" fill="${acc}"/><polygon points="0,172 210,147 210,153 0,178" fill="${acc}" fill-opacity=".4"/>`);
  const cl=lg(14);if(cl)cov.push(`<rect x="14" y="14" width="${cl.w+10}" height="${cl.h+9}" rx="3" fill="#fff"/>`,svgImg(logo.u,19,18.5,cl.w,cl.h));
  const t1=wrapLines(`${S.company} application portfolio`,172,13,true);
  cov.push(`<text x="20" y="197" font-size="3.4" font-weight="bold" letter-spacing=".9" fill="${sc}">CUSTOMER PROPOSAL</text>`);
  t1.forEach((t,i)=>cov.push(`<text x="20" y="${209+i*14}" font-size="13" font-weight="bold" fill="${tc}">${esc(t)}</text>`));
  let cy=209+t1.length*14;
  cov.push(`<rect x="20" y="${cy-5}" width="26" height="1.4" fill="${sc}"/>`,`<text x="20" y="${cy+6}" font-size="6.4" fill="${tc}">Prepared for ${esc(o.cust||'you')}</text>`,`<text x="20" y="${cy+14}" font-size="3.6" fill="${tc}" fill-opacity=".75">${esc(new Date().toLocaleDateString(undefined,{year:'numeric',month:'long',day:'numeric'}))}</text>`);
  if(o.intro)wrapLines(o.intro,168,3.9).slice(0,5).forEach((t,i)=>cov.push(`<text x="20" y="${cy+26+i*5.4}" font-size="3.9" fill="${tc}" fill-opacity=".9">${esc(t)}</text>`));
  pages.push(cov);
  /* ---- at a glance */
  np('AT A GLANCE');
  cur.push(`<text x="14" y="${y+4}" font-size="9" font-weight="bold" fill="${ink}">Proven in the field</text>`);y+=11;
  para(`${N} real application${N===1?'':'s'}, each with the problem, the solution and the measured result.`,14,180,3.9,'#566870',false,5.4);y+=3;
  const inds=new Set(apps.map(a=>a.industry).filter(Boolean)).size,prods=new Set(apps.map(a=>a.product).filter(Boolean)).size;
  [[N,'applications'],[inds,inds===1?'industry':'industries'],[prods||1,prods===1?'material':'materials']].forEach(([n,l],i)=>cur.push(`<rect x="${14+i*62}" y="${y}" width="56" height="26" rx="3" fill="#eef2f4"/><rect x="${14+i*62}" y="${y}" width="56" height="2" fill="${acc}"/><text x="${20+i*62}" y="${y+16}" font-size="12" font-weight="bold" fill="${acc}">${n}</text><text x="${20+i*62}" y="${y+22}" font-size="3.2" fill="#566870">${l}</text>`));
  y+=36;
  apps.forEach((a,i)=>{const res=wrapLines(a.proof||a.summary||a.desc||'',150,3.4).slice(0,2),h=14+res.length*4.6+4;room(h+3);
    cur.push(`<circle cx="21" cy="${y+6}" r="5.6" fill="${acc}"/><text x="21" y="${y+7.6}" font-size="4.2" font-weight="bold" fill="#fff" text-anchor="middle">${i+1}</text><text x="31" y="${y+5.2}" font-size="4.4" font-weight="bold" fill="${ink}">${esc(wrapLines(a.name,160,4.4,true)[0])}</text><text x="31" y="${y+10.4}" font-size="3.2" fill="#566870">${esc([a.industry,a.product].filter(Boolean).join('  ·  '))}</text>`);
    res.forEach((l,k)=>cur.push(`<text x="31" y="${y+16+k*4.6}" font-size="3.4" fill="${ink}">${esc(l)}</text>`));
    cur.push(`<rect x="14" y="${y+h-1}" width="182" height=".3" fill="#d5dde1"/>`);y+=h+2});
  /* ---- one section per application */
  for(let n=0;n<N;n++){const a=apps[n];np(`APPLICATION ${n+1} OF ${N}  |  ${(a.industry||'').toUpperCase()}`);
    cur.push(`<text x="196" y="${y+10}" font-size="24" font-weight="bold" fill="${acc}" fill-opacity=".3" text-anchor="end">${String(n+1).padStart(2,'0')}</text>`);y+=3;
    wrapLines(a.name,148,7.4,true).slice(0,3).forEach(l=>{cur.push(`<text x="14" y="${y}" font-size="7.4" font-weight="bold" fill="${ink}">${esc(l)}</text>`);y+=9});
    let cx=14;for(const [k,vv] of [['Industry',a.industry],['Material',a.product],['Replaced',a.orig]]){if(!vv)continue;const t=`${k}: ${vv}`.slice(0,46),w=tw(t,3.1,true)+8;if(cx+w>196){cx=14;y+=8}cur.push(`<rect x="${cx}" y="${y-4.6}" width="${w}" height="6.6" rx="3.3" fill="${acc}" fill-opacity=".16"/><text x="${cx+4}" y="${y}" font-size="3.1" font-weight="bold" fill="${ink}">${esc(t)}</text>`);cx+=w+3}
    y+=8;
    const ph=[];for(const r of a.photos.slice(0,Math.max(S.pp,0)))ph.push(await photo(r));
    if(ph[0]){room(86);cur.push(svgClip(ph[0].u,14,y,182,82,3,`p${n}a`));y+=87;
      const rest=ph.slice(1).filter(Boolean);if(rest.length){room(40);const w=(182-4*(rest.length-1))/rest.length;rest.forEach((p,k)=>cur.push(svgClip(p.u,14+k*(w+4),y,w,36,3,`p${n}${k}`)));y+=41}}
    const ov=a.summary||a.desc;if(S.secs.includes('Overview')&&ov){para(ov,14,182,4,'#2c3b44',false,5.6);y+=3}
    if(S.secs.includes('Problem')&&a.problem)callout('The problem',a.problem,false);
    if(S.secs.includes('Solution')&&a.solution)callout('The solution',a.solution,false);
    if(S.secs.includes('Result')&&a.proof)callout('The result',a.proof,true)}
  /* ---- closing page */
  const end=[`<rect width="210" height="297" fill="${ink}"/><polygon points="0,200 210,170 210,182 0,212" fill="${acc}"/><circle cx="175" cy="48" r="60" fill="${acc}" fill-opacity=".12"/>`];
  const el=lg(16);if(el)end.push(`<rect x="20" y="24" width="${el.w+10}" height="${el.h+10}" rx="3" fill="#fff"/>`,svgImg(logo.u,25,29,el.w,el.h));
  end.push(`<text x="20" y="120" font-size="14" font-weight="bold" fill="#fff">Let’s talk about</text><text x="20" y="136" font-size="14" font-weight="bold" fill="${acc}">your application.</text>`);
  wrapLines(`Every application above started with a problem like yours. Tell us about your bearings, shafts, loads and conditions and we will recommend the right material and design.`,150,4.2).forEach((t,i)=>end.push(`<text x="20" y="${152+i*6}" font-size="4.2" fill="#fff" fill-opacity=".85">${esc(t)}</text>`));
  end.push(`<text x="20" y="236" font-size="6" font-weight="bold" fill="#fff">${esc(S.company)}</text>`);if(S.footer)wrapLines(S.footer,170,3.8).slice(0,3).forEach((t,i)=>end.push(`<text x="20" y="${244+i*5.4}" font-size="3.8" fill="#fff" fill-opacity=".8">${esc(t)}</text>`));
  if(o.cust)end.push(`<text x="20" y="276" font-size="3.4" fill="#fff" fill-opacity=".6">Prepared for ${esc(o.cust)}</text>`);
  pages.push(end);
  pages.forEach((p,i)=>{if(i>0&&i<pages.length-1)p.push(`<rect x="14" y="283.2" width="182" height=".3" fill="#cfd7db"/><text x="14" y="288.4" font-size="2.9" fill="#788">${esc((S.footer||S.company).slice(0,80)+(o.cust?'  |  '+o.cust:''))}</text><text x="196" y="288.4" font-size="2.9" fill="#788" text-anchor="end">${i}</text>`)});
  const out=[];for(const p of pages)out.push(await svgToJpeg(pageSvg(p.join('')),1240,1754));
  return{blob:buildPdf(out,210,297),name:`${S.company}-portfolio.pdf`};
}
function portfolio(v){
  P=P.filter(id=>A.some(a=>a.id===id));savePf();
  const inds=[...new Set(A.map(a=>a.industry).filter(Boolean))].sort(),st={q:'',i:''};
  v.innerHTML=`<a class="back" href="#/tools">← Tools</a><h1>Customer portfolio</h1><p class="mut">Choose the applications to feature and make a designed PDF proposal. Customer names, operating notes and recorded-by never appear in it.</p>
  <div class="card"><label>Prepared for<input id="pc1" placeholder="Customer or company"></label><label style="margin:0">Introduction on the cover (optional)<textarea id="pi" rows="3" placeholder="A short personal note"></textarea></label></div>
  <h2>1. Choose applications <small class="mut" id="pcn"></small></h2>
  <div class="filters"><input id="pq" type="search" placeholder="Search by name, product or industry"><select id="pin"><option value="">All industries</option>${inds.map(i=>`<option>${esc(i)}</option>`).join('')}</select><select id="pst"><option value="">All records</option><option value="sel">Selected only</option></select></div>
  <div class="acts" style="margin-top:0"><button type="button" class="btn" id="psa">Select all shown</button><button type="button" class="btn" id="pcl">Clear selection</button></div>
  <div class="list" id="PL"></div>
  <h2>2. Order in the proposal</h2><div class="card" id="po"></div>
  <button type="button" class="btn pri wide" id="pdf">Make PDF</button><p class="mut" id="pdh">Tap once to build the PDF, then tap Open PDF to save or share it.</p>`;
  const pb=$('#pdf'),reset=()=>{pb._b=null;pb.textContent='Make PDF'};
  const shown=()=>{const q=st.q.toLowerCase();return A.filter(a=>(!st.i||a.industry===st.i)&&(st.s!=='sel'||P.includes(a.id))&&[a.name,a.industry,a.product,a.desc].join(' ').toLowerCase().includes(q))};
  const drawOrder=()=>{$('#pcn').textContent=P.length?`(${P.length} selected)`:'';$('#po').innerHTML=P.length?P.map((id,i)=>`<div class="ord"><span>${i+1}. ${esc(A.find(a=>a.id===id).name)}</span><button type="button" data-m="${i}:-1" aria-label="Move up">▲</button><button type="button" data-m="${i}:1" aria-label="Move down">▼</button><button type="button" data-m="${i}:x" aria-label="Remove">×</button></div>`).join(''):'<p class="mut" style="margin:0">Nothing selected yet. Tap applications above.</p>';
    $$('#po button').forEach(b=>b.onclick=()=>{const[i,m]=b.dataset.m.split(':'),k=+i;if(m==='x')P.splice(k,1);else{const j=k+ +m;if(j<0||j>=P.length)return;[P[k],P[j]]=[P[j],P[k]]}savePf();reset();draw()})};
  const draw=()=>{const l=shown();$('#PL').innerHTML=l.length?l.map(a=>`<button type="button" class="row pick${P.includes(a.id)?' on':''}" data-id="${a.id}"><div class="th">${a.thumb?`<img src="${a.thumb}" alt="">`:'▣'}</div><div><strong>${esc(a.name)}</strong><small>${esc([a.industry,a.product].filter(Boolean).join(' · '))}</small></div><span class="tick">${P.includes(a.id)?'✓':'+'}</span></button>`).join(''):'<p class="empty">No applications match.</p>';
    $$('#PL .row').forEach(b=>b.onclick=()=>{const id=b.dataset.id,k=P.indexOf(id);if(k>=0)P.splice(k,1);else P.push(id);savePf();reset();b.classList.toggle('on',P.includes(id));b.querySelector('.tick').textContent=P.includes(id)?'✓':'+';drawOrder();if(st.s==='sel')draw()});drawOrder()};
  $('#pq').oninput=e=>{st.q=e.target.value;draw()};$('#pin').onchange=e=>{st.i=e.target.value;draw()};$('#pst').onchange=e=>{st.s=e.target.value;draw()};
  $('#psa').onclick=()=>{shown().forEach(a=>{if(!P.includes(a.id))P.push(a.id)});savePf();reset();draw()};
  $('#pcl').onclick=()=>{P=[];savePf();reset();draw()};
  $('#pc1').oninput=reset;$('#pi').oninput=reset;
  pb.onclick=async()=>{if(pb._b){await deliver(pb._b,pb._n);return}if(!P.length)return alert('Choose at least one application first.');pb.disabled=true;pb.textContent='Building…';
    try{const r=await pdf(P,{cust:$('#pc1').value.trim(),intro:$('#pi').value.trim()});pb._b=r.blob;pb._n=r.name;pb.textContent='Open PDF';log('Built portfolio PDF',$('#pc1').value.trim())}catch(x){alert('Could not build the PDF: '+(x.message||x));pb.textContent='Make PDF'}pb.disabled=false};
  draw();
}
function tools(v){
  P=P.filter(id=>A.some(a=>a.id===id));
  v.innerHTML=`<h1>Tools</h1>
  ${S.feat.pv?'<section class="card"><h2>Design</h2><a class="row" href="#/design"><div class="th">◉</div><div><strong>Industrial bearing</strong><small>Size, fit, clearance, PV and tolerances</small></div><span class="chip ok">Open</span></a><a class="row" href="#/quickdraw" style="margin-top:8px"><div class="th">✎</div><div><strong>QuickDraw</strong><small>Type sizes, get a full drawing and PDF</small></div><span class="chip ok">Open</span></a></section>':''}
  <section class="card"><h2>Data sheets</h2><a class="row" href="#/datasheets"><div class="th">▤</div><div><strong>Vesconite data sheets</strong><small>${DSH.length} materials, each with its PDF</small></div><span class="chip ok">Open</span></a></section>
  <section class="card"><h2>Customer portfolio</h2><a class="row" href="#/portfolio"><div class="th">▣</div><div><strong>Make a customer proposal</strong><small>${P.length?`${P.length} application${P.length>1?'s':''} selected`:'Pick applications and make a PDF'}</small></div><span class="chip ok">Open</span></a></section>
  <section class="card"><h2>Account</h2><p class="mut">Signed in as ${esc(ME.email)} (${ROLE}).</p><button class="btn" id="so">Sign out</button></section>`;
  $('#so').onclick=()=>signOut(au);
}

/* ---------- Data sheets: typical properties from the Vesconite spec sheets. The PDFs themselves are stored in Firebase. ---------- */
const DSH=[
 {id:'v',name:'Vesconite',tag:'Standard Vesconite bearing material.',rows:[['Density (specific gravity)','1.38'],['Melting point','260 °C (500 °F)'],['Hardness, Shore D','83'],['Compressive strength at yield','93 MPa (13,489 psi)'],['Modulus of elasticity, compression','2.3 GPa (333,590 psi)'],['Tensile strength at yield','66 MPa (9,573 psi)'],['Tensile strength at break','63 MPa (9,137 psi)'],['Tangent modulus of elasticity','3,726 MPa (540,410 psi)'],['Water swell, 24 h / 28 days','0.11% / 0.12%'],['Oil swell, 24 h / 28 days','0.08% / 0.09%'],['Shear strength','49.1 MPa (7,121 psi)'],['Flexural yield strength','120 MPa (17,400 psi)'],['Deflection temperature at 1.85 MPa','93 °C (200 °F)'],['Notched impact, Charpy','245 kJ/m² (117 ft-lb/in²)'],['Notched impact, Izod','30 J/m (0.56 ft-lb/in)'],['Heat conductivity','0.3 W/m·K'],['Linear thermal expansion','6 × 10⁻⁵ mm/mm·°C'],['Dynamic friction on polished steel, no lubrication','0.13 – 0.18'],['Dielectric strength','14 kV/mm (360 kV/in)'],['Gamma ray resistance, 50% loss of properties','100 Mrads']]},
 {id:'h',name:'Vesconite Hilube',tag:'Lower friction than standard Vesconite (0.08 – 0.12 on polished steel, unlubricated).',rows:[['Density (specific gravity)','1.38'],['Melting point','260 °C (500 °F)'],['Hardness, Shore D','83'],['Compressive strength at yield','98 MPa (14,214 psi)'],['Modulus of elasticity, compression','2.2 GPa (319,084 psi)'],['Tensile strength at yield','67 MPa (9,718 psi)'],['Tensile strength at break','65 MPa (9,427 psi)'],['Tangent modulus of elasticity','3,726 MPa (540,410 psi)'],['Water swell, 24 h / 28 days','0.11% / 0.13%'],['Oil swell, 24 h / 28 days','0.05% / 0.06%'],['Shear strength','49.6 MPa (7,194 psi)'],['Flexural yield strength','113 MPa (16,400 psi)'],['Deflection temperature at 1.85 MPa','117 °C (243 °F)'],['Notched impact, Charpy','245 kJ/m² (117 ft-lb/in²)'],['Notched impact, Izod','30 J/m (0.56 ft-lb/in)'],['Heat conductivity','0.3 W/m·K'],['Linear thermal expansion','6 × 10⁻⁵ mm/mm·°C'],['Dynamic friction on polished steel, no lubrication','0.08 – 0.12'],['Dielectric strength','14 kV/mm (360 kV/in)'],['Gamma ray resistance, 50% loss of properties','100 Mrads']]},
 {id:'h10',name:'Hilube 10',tag:'Operating range −50 °C to 100 °C, maximum design load 20 MPa.',rows:[['Dynamic friction on polished steel, no lubrication','0.20 – 0.27'],['Maximum design load','20 MPa (2,900 psi)'],['Operating temperature range','−50 °C to 100 °C (−58 °F to 212 °F)'],['Deflection temperature at 1.8 MPa','57 °C (135 °F)'],['Flexural modulus (dry)','2,500 MPa (363,000 psi)'],['Coefficient of thermal expansion','10 × 10⁻⁵ mm/mm·°C'],['Specific gravity','1.25']]},
 {id:'h20',name:'Hilube 20',tag:'Operating range −50 °C to 100 °C, maximum design load 20 MPa.',rows:[['Friction at 9.5 MPa (1,380 psi)','0.15 – 0.19'],['Maximum design load','20 MPa (2,900 psi)'],['Operating temperature range','−50 °C to 100 °C (−58 °F to 212 °F)'],['Deflection temperature at 1.8 MPa','57 °C (135 °F)'],['Flexural modulus (dry)','2,500 MPa (363,000 psi)'],['Coefficient of thermal expansion','10 × 10⁻⁵ mm/mm·°C'],['Specific gravity','1.25']]},
 {id:'s',name:'Vesconite Superlube',tag:'Dynamic friction on steel, unlubricated: 0.05 – 0.08.',rows:[['Density (specific gravity)','1.68'],['Hardness, Shore D','77'],['Compressive strength at yield','54 MPa (7,832 psi)'],['Ultimate compression strength','82 MPa (11,893 psi)'],['Modulus of elasticity, compression','0.41 GPa (59,465 psi)'],['Tensile strength at yield','34 MPa (4,931 psi)'],['Tensile strength at break','33 MPa (4,786 psi)'],['Modulus of elasticity in tension','0.38 GPa (55,114 psi)'],['Shear strength','27.2 MPa (3,945 psi)'],['Water swell, 24 h / 28 days','0.09% / 0.10%'],['Oil swell, 24 h / 28 days','0.09% / 0.11%'],['Impact resistance','15 kJ/m²'],['Softening temperature','163 °C (325 °F)'],['Dynamic friction on steel, unlubricated','0.05 – 0.08']]},
 {id:'t150',name:'Hitemp 150',tag:'Bearing grade for high temperatures up to 150 °C, with high PV limits.',rows:[['Melting point','265 °C (509 °F)'],['Short-term temperature limit','170 °C (340 °F)'],['Temperature rating','150 °C (300 °F)'],['Resistance to hot water and steam','Up to 120 °C (250 °F)'],['Density','1.47'],['PV limit','30 MPa·m/min (14,350 psi·ft/min)'],['Coefficient of thermal expansion','4 × 10⁻⁵ mm/mm·°C'],['Water absorption, ambient (saturated)','3 – 4%'],['Chemical resistance','Resistant to alkalis, not suited for acids'],['Features','High chemical and radiation resistance; steam and boiling water resistance']]},
 {id:'t160',name:'Hitemp 160',tag:'Excellent chemical resistance including acids, alkalis, hot water and steam.',rows:[['Density (specific gravity)','1.24'],['Melting point','280 °C (536 °F)'],['Hardness, Shore D','79'],['Ultimate compressive strength','73 MPa (10,600 psi)'],['Compressive strength at yield','42 MPa (6,100 psi)'],['Modulus of elasticity','1.4 GPa (203,000 psi)'],['Design loading','15 MPa (2,200 psi)'],['Water absorption, 24 h','0.09%'],['Poisson’s ratio','0.38'],['Thermal conductivity','0.3 W/m·K'],['Linear thermal expansion','1.0 × 10⁻⁴ mm/mm·°C'],['Dynamic friction on polished steel, no lubrication','0.12']]},
 {id:'t230',name:'Hitemp 230',tag:'Bearing grade for high temperatures up to 230 °C, with high PV limits.',rows:[['Density','1.89'],['Tensile strength (dry)','110 MPa (16,000 psi)'],['Tensile modulus','15,000 MPa (2,176,000 psi)'],['Tensile elongation at break','1%'],['Flexural modulus (dry)','15 GPa (2,176,000 psi)'],['Water absorption at 65% RH','0.03%'],['Coefficient of thermal expansion','2.7 × 10⁻⁵ mm/mm·°C'],['Melting point','282 °C (540 °F)'],['Heat distortion temperature (1.8 MPa)','278 °C (530 °F)'],['Continuous temperature rating','200 °C (390 °F)'],['Short-term temperature rating','240 °C (460 °F)'],['Design loading','80 MPa (11,600 psi)'],['PV limit','70 MPa·m/min (400,000 psi·in/min)'],['Dynamic friction, ambient','0.17 – 0.24'],['Gamma radiation resistance','1,000 Megarads'],['Chemical resistance','Generally high'],['Impact strength, Izod (unnotched)','20 kJ/m² (9.5 ft-lb/in²)']]},
 {id:'f',name:'Vescoflex',tag:'Flexible: 800% elongation at break, Shore D 40.',rows:[['Specific gravity','1.17 – 1.25'],['Melting point','112 °C (234 °F)'],['Hardness, Shore D','40'],['Ultimate tensile strength','41 MPa (5,947 psi)'],['Tensile modulus','54 MPa (7,832 psi)'],['Flexural modulus','49 MPa (7,107 psi)'],['Compression modulus','51 MPa (7,397 psi)'],['Elongation at break','800%'],['Deformation at 6.8 MPa (986 psi)','12%'],['Deformation at 10 MPa (1,450 psi)','20%'],['Compression set at 9 MPa, 23 °C','11%'],['Compression set at 70 °C, 25% deflection','60%'],['Tensile set at 100% strain','18%'],['Stress at 10% strain','4.6 MPa (667 psi)'],['Tear strength, split / Die B / Die C','3 / 11 / 12 MPa'],['Brittle point','−70 °C (−94 °F)'],['Resilience, Bashore','62%'],['Water absorption','0.6%'],['Heat resistance, 2 weeks in air','121 °C (250 °F), modulus change +6%'],['Abrasion resistance, Taber H-18 wheel, 1,000 g load','100 mg/1,000 cycles (800% of standard)'],['Solvent resistance, 7 days at 100 °C, ASTM oil no. 3','Modulus change 0%, volume change +23%']]},
 {id:'n',name:'VescoNylon',tag:'Polyamide (Nylon 6) with exceptional strength and wear resistance.',rows:[['Tensile strength (dry)','75 MPa (10,900 psi)'],['Tensile strength (wet, 9%)','20 MPa (2,900 psi)'],['Flexural modulus (dry)','2.5 GPa (363,000 psi)'],['Flexural modulus (wet, 9%)','0.5 GPa (73,000 psi)'],['Max water absorption at 65% RH','9%'],['Coefficient of thermal expansion','9 × 10⁻⁵ mm/mm·°C'],['Intermittent temperature rating','100 °C (210 °F)'],['Design loading (dry)','30 MPa (4,400 psi)'],['Design loading (wet, 9%)','10 MPa (1,500 psi)'],['PV limit','3 MPa·m/min (17,000 psi·in/min)'],['Moisture absorption','Gradually absorbs water from the air or when immersed, swelling up to 3%'],['Clearances','2% to 5% of the wall thickness, minimum 0.2 mm'],['Press fit','0.1 mm plus 0.1% of the bush diameter'],['Machining tolerance','0.3% of all dimensions'],['Expansion with moisture','1% for every 3% increase in moisture']]},
 {id:'pc',name:'VescoPolycap',tag:'Polyamide with exceptional strength and wear resistance.',rows:[['Tensile strength (dry)','75 MPa (10,900 psi)'],['Tensile strength (wet, 9%)','20 MPa (2,900 psi)'],['Flexural modulus (dry)','2.5 GPa (363,000 psi)'],['Flexural modulus (wet, 9%)','0.5 GPa (73,000 psi)'],['Max water absorption','9%'],['Coefficient of thermal expansion','9 × 10⁻⁵ mm/mm·°C'],['Intermittent temperature rating','100 °C (210 °F)'],['Design loading (dry applications)','20 MPa (2,900 psi)'],['Design loading (wet and humid applications)','10 MPa (1,500 psi)'],['PV limit','3 MPa·m/min (17,000 psi·in/min)'],['Moisture absorption','Gradually absorbs water from the air or when immersed, swelling up to 3%'],['Clearances','2% to 5% of the wall thickness, minimum 0.2 mm'],['Press fit','0.1 mm plus 0.1% of the bush diameter'],['Machining tolerance','0.3% of all dimensions'],['Expansion with moisture','1% for every 3% mass increase in moisture absorption']]}
];
const hexRgb=h=>{h=String(h||'#888888').replace('#','');return[0,2,4].map(i=>parseInt(h.slice(i,i+2),16)||0)};
const tabStyle=id=>{const d=(S.dsc&&S.dsc[id])||{c:'#8a8d91',a:.3},[r,g,b]=hexRgb(d.c),lum=(r*299+g*587+b*114)/1000,a=Math.max(0,Math.min(1,+d.a)),txt=a>=.55?(lum<140?'#ffffff':'#0e1a20'):'';return `background:rgba(${r},${g},${b},${a});border-left:7px solid rgb(${r},${g},${b});${txt?`color:${txt};--mut:${txt};`:''}`};
function datasheets(v){
  v.innerHTML=`<a class="back" href="#/tools">← Tools</a><h1>Data sheets</h1><p class="mut">Typical properties from the Vesconite spec sheets. Tap a material to see its properties and open the PDF.</p><div class="list">${DSH.map(d=>`<a class="row dtab" href="#/datasheet/${d.id}" style="grid-template-columns:1fr auto;${tabStyle(d.id)}"><div><strong>${esc(d.name)}</strong><small>${esc(d.tag)}</small></div><span class="chip">PDF ›</span></a>`).join('')}</div>`;
}
function datasheet(v,id){
  const d=DSH.find(x=>x.id===id);
  if(!d){v.innerHTML='<a class="back" href="#/datasheets">← Data sheets</a><p class="empty">Data sheet not found.</p>';return}
  v.innerHTML=`<a class="back" href="#/datasheets">← Data sheets</a><div class="dshead" style="${tabStyle(id)}"><h1>${esc(d.name)}</h1><p>${esc(d.tag)}</p></div><dl class="spec">${d.rows.map(([k,x])=>`<dt>${esc(k)}</dt><dd>${esc(x)}</dd>`).join('')}</dl><p class="mut">Typical properties, indicative only. Physical properties may be altered to some extent by processing conditions.</p><div class="acts"><button type="button" class="btn pri" id="dsp">PDF</button></div>`;
  const pb=$('#dsp');
  const ready=(async()=>{try{const s=await getDoc(dc('datasheets',id));if(!s.exists())return null;const u=await getFile(s.data().file);return new Blob([await (await fetch(u)).blob()],{type:'application/pdf'})}catch{return null}})();
  const nm=`${d.name.replace(/\s+/g,'-')}-data-sheet.pdf`;
  pb.onclick=async()=>{const t=pb.textContent;pb.textContent='…';const b=await ready;pb.textContent=t;if(b){log('Opened data sheet',d.name);await deliver(b,nm)}else alert('This PDF has not been stored yet. An admin can add it in Admin > Data sheets.')};
}

/* ---------- Home charts ---------- */
const PAL=['#0f6b6b','#c9861a','#3b6ea5','#8a5a9e','#5b8c3a','#b3303a','#7a7f85','#2b9aa0','#d1a23b'];
function donut(m,label){
  let e=Object.entries(m).sort((a,b)=>b[1]-a[1]);if(e.length>8){const rest=e.slice(8).reduce((n,x)=>n+x[1],0);e=[...e.slice(0,8),['Other',rest]]}
  const tot=e.reduce((n,x)=>n+x[1],0);if(!tot)return '<p class="empty">No data yet.</p>';
  let off=25;const segs=e.map(([k,n],i)=>{const p=n/tot*100,s=`<circle r="15.9155" cx="21" cy="21" fill="none" stroke="${PAL[i%PAL.length]}" stroke-width="6" stroke-dasharray="${p.toFixed(3)} ${(100-p).toFixed(3)}" stroke-dashoffset="${off.toFixed(3)}"/>`;off-=p;return s});
  return `<div class="dn"><svg viewBox="0 0 42 42" role="img" aria-label="${esc(label)}">${segs.join('')}<text x="21" y="23.4" text-anchor="middle" class="dnt">${tot}</text></svg><ul>${e.map(([k,n],i)=>`<li><i style="background:${PAL[i%PAL.length]}"></i><span>${esc(k)}</span><b>${n}</b><small>${Math.round(n/tot*100)}%</small></li>`).join('')}</ul></div>`;
}
function charts(){
  const q={Complete:0,'Needs detail':0,Draft:0};A.forEach(a=>q[grade(a)[0]]++);const t=A.length||1;
  return `<h2>Data progress</h2><div class="card"><h3>Record completeness</h3><div class="pbar"><i style="width:${q.Complete/t*100}%;background:var(--ok)"></i><i style="width:${q['Needs detail']/t*100}%;background:var(--warn)"></i><i style="width:${q.Draft/t*100}%;background:var(--bad)"></i></div><p class="mut" style="margin:8px 0 0"><b>${Math.round(q.Complete/t*100)}%</b> complete · ${q['Needs detail']} need detail · ${q.Draft} draft</p></div>
  <div class="card"><h3>Applications by industry</h3>${donut(count('industry'),'Applications by industry')}</div><div class="card"><h3>Applications by product</h3>${donut(count('product'),'Applications by product')}</div>`;
}

/* ---------- Design: Industrial bearing (equations from the Vesconite design manual, metric) ---------- */
const K=6e-5;  /* published linear thermal expansion, mm/mm/°C */
const tol=(x,p,m)=>Math.max(x*p/100,m);
const fx=(x,d=2)=>Number.isFinite(x)?x.toFixed(d):'–';
const GRV=[[30,3,6,2.5,4],[50,4,8,3,8],[80,6,8,3,12],[120,6,10,3.5,18],[160,8,12,4,24],[200,10,12,4,30]];  /* shaft Ø max, grooves, width, depth, water l/min */
const GRADES={v:['VESCONITE',65,100,0xb58a4e],h:['VESCONITE HILUBE',65,100,0x3a342e],x:['HITEMP 150',125,150,0x8a7260]};
const GTYPES={none:'NONE',spiral:'SPIRAL',blind:'BLIND RADIAL',long:'LONGITUDINAL'};
let T3=null,LAST=null,PEND3=null,T3L=false;

/* Groove depth (mm) into the wall at angle th (rad) and axial position y (mm, 0 = middle). Cross-section is a round-bottomed groove of radius r and depth d. */
function grooveFn(G,rI){
  if(!G||G.type==='none'||!(G.d>0)||!(G.r>0)||!(G.n>0))return()=>0;
  const sec=2*Math.PI/G.n,R=G.r,cd=G.d-R,t0=Math.PI/2;
  const prof=x=>{const q=R*R-x*x;if(q<0)return 0;const z=cd+Math.sqrt(q);return z>0?Math.min(z,G.d):0};
  const wrap=a=>{a=((a%sec)+sec)%sec;return a>sec/2?a-sec:a};
  if(G.type==='long')return th=>prof(wrap(th-t0)*rI);
  if(G.type==='blind'){const hl=(G.len||0)/2;return(th,y)=>prof(Math.hypot(wrap(th-t0)*rI,Math.max(0,Math.abs(y)-hl)))}
  const lead=G.pitch>0?G.pitch:100,k=lead/Math.hypot(2*Math.PI*rI,lead);
  return(th,y)=>prof(wrap(th-t0-2*Math.PI*y/lead)*rI*k);
}
const grooveWidth=(d,r)=>d>=r?2*r:2*Math.sqrt(2*r*d-d*d);
/* Recommended groove from the manual's table (width, depth) for the shaft size; count, pitch and blind length are starting points. */
function recGroove(type,D,wall,L){
  const t=D>=20&&D<=200?GRV.find(x=>D<=x[0]):null;if(!t)return null;
  const w=t[2];let d=t[3],lim=false;if(d>wall/2-0.3){d=Math.max(0.5,Math.floor((wall/2-0.3)*10)/10);lim=true}
  const r=+((w*w/4+d*d)/(2*d)).toFixed(2),o={n:t[1],d,r,q:t[4],lim,w};
  if(type==='spiral'){o.n=2;o.pitch=Math.round(L)}
  if(type==='blind')o.len=Math.round(L*0.6);
  return o;
}

/* 3D viewer (three.js): drag to rotate, pinch or scroll to zoom */
function init3(box){
  if(!window.THREE){box.innerHTML='<p class="empty" style="margin:12px">The 3D viewer could not load. Check your connection.</p>';return null}
  const R=new THREE.WebGLRenderer({antialias:true,alpha:true});R.localClippingEnabled=true;R.setPixelRatio(Math.min(devicePixelRatio||1,2));box.appendChild(R.domElement);
  const sc=new THREE.Scene(),cam=new THREE.PerspectiveCamera(32,1,.1,10000),grp=new THREE.Group();grp.rotation.order='YXZ';grp.rotation.set(.75,.6,0);
  sc.add(new THREE.HemisphereLight(0xffffff,0x556677,.95));const dl=new THREE.DirectionalLight(0xffffff,.8);dl.position.set(2,3,4);sc.add(dl,grp);
  const st={grp,zoom:1,size:100,drag:false,cut:false,last:null},ps=new Map();let pd=0;
  box.onpointerdown=e=>{box.setPointerCapture(e.pointerId);ps.set(e.pointerId,[e.clientX,e.clientY]);st.drag=true};
  box.onpointermove=e=>{const o=ps.get(e.pointerId);if(!o)return;ps.set(e.pointerId,[e.clientX,e.clientY]);
    if(ps.size===2){const a=[...ps.values()],d=Math.hypot(a[0][0]-a[1][0],a[0][1]-a[1][1]);if(pd)st.zoom=Math.min(4,Math.max(.4,st.zoom*pd/d));pd=d;return}
    grp.rotation.y+=(e.clientX-o[0])*.01;grp.rotation.x+=(e.clientY-o[1])*.01};
  box.onpointerup=box.onpointercancel=e=>{ps.delete(e.pointerId);pd=0;if(!ps.size)st.drag=false};
  box.onwheel=e=>{e.preventDefault();st.zoom=Math.min(4,Math.max(.4,st.zoom*(1+Math.sign(e.deltaY)*.08)))};
  const loop=()=>{if(!box.isConnected){R.dispose();return}
    if(box.offsetParent){const w=box.clientWidth,h=box.clientHeight;if(R.domElement.width!==Math.round(w*R.getPixelRatio())){R.setSize(w,h);cam.aspect=w/h;cam.updateProjectionMatrix()}
      if(!st.drag)grp.rotation.y+=.004;cam.position.set(0,0,st.size*2.7*st.zoom);cam.lookAt(0,0,0);R.render(sc,cam)}
    requestAnimationFrame(loop)};
  loop();return st;
}
function matTex(g){   /* plain material colours: Vesconite is grey, Hilube is whitish */
  return g==='h'?{c:0xf4efe3,t:null,rough:.62}:{c:0x8c9095,t:null,rough:.7};
}
function upd3(st,o){
  st.last=o;const g=st.grp;[...g.children].forEach(m=>{m.geometry.dispose();g.remove(m)});
  const{OD,ID,L,ch,fl,gz,G}=o,rO=OD/2,rI=ID/2,h=L/2,c=Math.min(ch,(rO-rI)*.8,h*.5),rF=fl.on?fl.FD/2:rO,yF=h-(fl.on?fl.T:0);
  const open=!!st.cut,sw=open?Math.PI:Math.PI*2,th0=open?Math.PI:0,M=matTex(o.g);
  const mat=new THREE.MeshStandardMaterial({color:M.c,roughness:M.rough,metalness:0,side:THREE.DoubleSide});
  const cutMat=new THREE.MeshStandardMaterial({color:new THREE.Color(M.c).multiplyScalar(.78),roughness:1,metalness:0,side:THREE.DoubleSide});
  const lm=new THREE.LineBasicMaterial({color:0x151515}),add=(geo,m)=>g.add(new THREE.Mesh(geo,m||mat)),V2=(a,b)=>new THREE.Vector2(a,b);
  const out=fl.on?[[rO-c,-h],[rO,-h+c],[rO,yF],[rF,yF],[rF,h]]:[[rO-c,-h],[rO,-h+c],[rO,h-c],[rO-c,h]];
  /* outside surfaces: lathe angle phi relates to the model angle by theta = pi/2 - phi */
  for(let i=0;i<out.length-1;i++)add(new THREE.LatheGeometry([V2(out[i][0],out[i][1]),V2(out[i+1][0],out[i+1][1])],128,Math.PI/2-th0-sw,sw));
  const arc=(r,y,rr)=>{const pts=[];for(let k=0;k<=128;k++){const t=th0+sw*k/128,q=rr?rr(t):r;pts.push(new THREE.Vector3(q*Math.cos(t),y,q*Math.sin(t)))}g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),lm))};
  out.forEach(p=>arc(p[0],p[1]));
  /* bore (with grooves) and the two end faces */
  const none=G.type==='none',Nt=none?128:720,Ny=none?1:140,W=open?Nt+1:Nt,nx=i=>open?i+1:(i+1)%Nt,pos=[],uv=[],idx=[];
  for(let j=0;j<=Ny;j++){const y=-h+L*j/Ny;for(let i=0;i<W;i++){const t=th0+sw*i/Nt,r=rI+gz(t,y);pos.push(r*Math.cos(t),y,r*Math.sin(t));uv.push(i/Nt*6,j/Ny*2)}}
  for(let j=0;j<Ny;j++)for(let i=0;i<Nt;i++){const a=j*W+i,b=j*W+nx(i),c2=(j+1)*W+i,d=(j+1)*W+nx(i);idx.push(a,c2,b,b,c2,d)}
  const bg=new THREE.BufferGeometry();bg.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));bg.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));bg.setIndex(idx);bg.computeVertexNormals();add(bg);
  const ring=(y,ro)=>{const p=[],u=[],ix=[];
    for(let i=0;i<W;i++){const t=th0+sw*i/Nt,r=rI+gz(t,y);p.push(r*Math.cos(t),y,r*Math.sin(t),ro*Math.cos(t),y,ro*Math.sin(t));u.push(i/Nt*6,0,i/Nt*6,1)}
    for(let i=0;i<Nt;i++){const a=2*i,b=2*nx(i);ix.push(a,a+1,b,b,a+1,b+1)}
    const gm=new THREE.BufferGeometry();gm.setAttribute('position',new THREE.Float32BufferAttribute(p,3));gm.setAttribute('uv',new THREE.Float32BufferAttribute(u,2));gm.setIndex(ix);gm.computeVertexNormals();add(gm);
    arc(0,y,t=>rI+gz(t,y))};
  ring(-h,rO-c);ring(h,rF-(fl.on?0:c));
  /* cutaway: flat section faces on the two cut planes */
  if(open){const sect=th=>{const inner=[];for(let j=0;j<=Ny;j++){const y=-h+L*j/Ny;inner.push(V2(rI+gz(th,y),y))}
    const geo=new THREE.ShapeGeometry(new THREE.Shape([...inner,...out.map(p=>V2(p[0],p[1])).reverse()])),ps=geo.attributes.position;
    for(let i=0;i<ps.count;i++){const r=ps.getX(i),y=ps.getY(i);ps.setXYZ(i,r*Math.cos(th),y,r*Math.sin(th))}ps.needsUpdate=true;geo.computeVertexNormals();add(geo,cutMat)};
    sect(th0);sect(th0+sw)}
  st.size=Math.max(fl.on?fl.FD:OD,L);
}

/* Engineering drawing (SVG in mm, A3 layout): end view, half section A-A, dimensions with tolerances, data table, notes, title block */
function drawSVG(p){
  const{OD,ID,L,ch,w,H,D,press,clo,c,g,tOD,tID,tW,tL,pf,drg,G,fl,dw,logo,gz}=p,q=p.q,e=esc,Dm=fl.on?fl.FD:OD;
  const sa=[5,2,1,.5,.2,.1,.05,.02,.01],extra=fl.on?20:24+String(q?q.lab.W:`${fx(w)} +0/−${fx(tW,3)}`).length*1.6,fitS=x=>x*Dm<=118&&x*L<=125&&80+x*(Dm/2+L)+(fl.on?52:46)+extra<=334,s=q&&q.scale>0?q.scale:(sa.find(fitS)||.01),scl=s>=1?`${s}:1`:`1:${Math.round(1/s)}`;
  const cy=118,cx1=80,rO=OD*s/2,rI=ID*s/2,rF=fl.on?fl.FD*s/2:rO,cs=ch>0?Math.min(Math.max(ch*s,.8),(rO-rI)*.8):0,cx2=cx1+rF+(fl.on?52:46)+L*s/2,x0=cx2-L*s/2,x1=cx2+L*s/2,xF=x1-(fl.on?fl.T*s:0);
  const yTO=cy-rO,yTI=cy-rI,yBI=cy+rI,yBO=cy+rO,yTF=cy-rF,yBF=cy+rF,hh=L/2,n=v=>+v.toFixed(2),pts=a=>a.map(q=>n(q[0])+','+n(q[1])).join(' ');
  const dh=(a,b,yr,y,t)=>{const k=y>yr?1:-1;return `<line class="k2" x1="${n(a)}" y1="${n(yr+k)}" x2="${n(a)}" y2="${n(y+k*2)}"/><line class="k2" x1="${n(b)}" y1="${n(yr+k)}" x2="${n(b)}" y2="${n(y+k*2)}"/><line class="k4" x1="${n(a)}" y1="${n(y)}" x2="${n(b)}" y2="${n(y)}"/><text x="${n((a+b)/2)}" y="${n(y-1.2)}" text-anchor="middle">${e(t)}</text>`};
  const dv=(a,b,xr,x,t)=>{const k=x>xr?1:-1;return `<line class="k2" x1="${n(xr+k)}" y1="${n(a)}" x2="${n(x+k*2)}" y2="${n(a)}"/><line class="k2" x1="${n(xr+k)}" y1="${n(b)}" x2="${n(x+k*2)}" y2="${n(b)}"/><line class="k4" x1="${n(x)}" y1="${n(a)}" x2="${n(x)}" y2="${n(b)}"/><text transform="translate(${n(x-1.2)} ${n((a+b)/2)}) rotate(-90)" text-anchor="middle">${e(t)}</text>`};
  const cell=(x,y,wd,h,l,t,sz=3.6)=>`<rect class="k1" x="${x}" y="${y}" width="${wd}" height="${h}"/><text class="lb" x="${x+1}" y="${y+2.6}">${l}</text><text x="${x+1.5}" y="${y+h-1.7}" style="font-size:${Math.min(sz,(wd-3)/Math.max(1,String(t).replace(/&[#a-z0-9]+;/g,"x").length*.5)).toFixed(2)}px">${t}</text>`;
  const inner=(th,sgn)=>{const a=[];for(let k=0;k<=160;k++)a.push([x0+(x1-x0)*k/160,(sgn<0?yTI:yBI)+(sgn<0?-1:1)*gz(th,-hh+L*k/160)*s]);return a};
  const topOut=fl.on?[[x0,yTO+cs],[x0+cs,yTO],[xF,yTO],[xF,yTF],[x1,yTF]]:[[x0,yTO+cs],[x0+cs,yTO],[x1-cs,yTO],[x1,yTO+cs]];
  const botOut=fl.on?[[x0,yBO-cs],[x0+cs,yBO],[xF,yBO],[xF,yBF],[x1,yBF]]:[[x0,yBO-cs],[x0+cs,yBO],[x1-cs,yBO],[x1,yBO-cs]];
  const ti=inner(Math.PI/2,-1),bi=inner(3*Math.PI/2,1),topP=[...topOut,...ti.slice().reverse()],botP=[...botOut,...bi.slice().reverse()];
  const idEnd=G.type==='none'?`<circle class="k1" cx="${cx1}" cy="${cy}" r="${n(rI)}"/>`:`<path class="k1" d="M${Array.from({length:720},(_,k)=>{const t=2*Math.PI*k/720,r=rI+gz(t,hh)*s;return n(cx1+r*Math.cos(t))+','+n(cy-r*Math.sin(t))}).join('L')}Z"/>`;
  const lab=q?q.lab:{OD:`Ø${fx(OD)} ±${fx(tOD,3)}`,ID:`Ø${fx(ID)} ±${fx(tID,3)}`,L:`${fx(L)} +0/−${fx(tL)}`,W:`${fx(w)} +0/−${fx(tW,3)}`,FD:`Ø${fx(fl.FD)}`,T:`${fx(fl.T)}`};
  const gw=G.type==='none'?0:grooveWidth(G.d,G.r);
  const fit=[['HOUSING Ø',fx(H)],['SHAFT Ø',fx(D)],['PRESS FIT',pf?fx(press,3):'NONE'],['BORE CLOSURE',fx(clo,3)],['ASSEMBLY CLEARANCE',fx(c,3)],['FITTED INSIDE Ø',fx(D+c,3)],['WALL',fx(w)]];
  if(fl.on)fit.push(['FLANGE Ø',fx(fl.FD)],['FLANGE THICKNESS',fx(fl.T)]);
  if(G.type!=='none'){fit.push(['GROOVE TYPE',GTYPES[G.type]],['GROOVE QTY',String(G.n)],['GROOVE DEPTH',fx(G.d)],['GROOVE RADIUS',fx(G.r)],['GROOVE WIDTH',fx(gw)]);if(G.type==='spiral')fit.push(['SPIRAL PITCH',fx(G.pitch)]);if(G.type==='blind')fit.push(['GROOVE LENGTH',fx(G.len)])}
  const fitSentence=pf?'INTERFERENCE FIT INTO HOUSING. FREEZE-FIT OR PRESS WITH A MANDREL.':'NO PRESS FIT: SECURE THE BEARING MECHANICALLY OR BY BONDING.';
  const notes=dw.notes?['NOTES',...dw.noteText.replace('{FIT}',fitSentence).split('\n').slice(0,11)]:[];
  const title=q?q.title:(dw.title||'BEARING')+(fl.on?' (FLANGED)':'')+' — '+GRADES[g][0],fitRows=q?q.table:fit;
  const lgBox=logo&&dw.showLogo?(()=>{const wd=Math.min(38,12*logo.r),ht=wd/logo.r;return `<image href="${logo.u}" xlink:href="${logo.u}" x="${n(220+(42-wd)/2)}" y="${n(245+(16-ht)/2)}" width="${n(wd)}" height="${n(ht)}" preserveAspectRatio="xMidYMid meet"/>`})():`<text x="241" y="254.5" text-anchor="middle" style="font-size:3.4px;font-weight:bold">${e(dw.company)}</text>`;
  const rowH=4.8;
  let gdim='',call='',det='';
  if(G.type!=='none'&&G.d>0&&G.r>0){
    const R=G.r,cd=G.d-R,gw2=grooveWidth(G.d,R),lead=G.pitch>0?G.pitch:100,prof=x=>{const q2=R*R-x*x;if(q2<0)return 0;const z=cd+Math.sqrt(q2);return z>0?Math.min(z,G.d):0};
    const tipY=yTI-G.d*s,fitT=(t,sp)=>t.length*1.8<=Math.min(L*s-4,sp-2),dyl=yTI+rI*.62,roomy=rI>=17;
    let pxs=[cx2],tgt=cx2,cmx=cx2;
    if(G.type==='blind')pxs=[cx2-G.len*s/2,cx2+G.len*s/2];
    if(G.type==='spiral'){const sp=lead/G.n;if(sp<L*.9&&sp*s>=6){pxs=[cx2-sp*s,cx2];cmx=cx2-sp*s/2;tgt=cx2}}
    if(roomy&&G.type==='blind'&&G.len*s>=8){const t=`${fx(G.len)} LONG`;gdim=dh(pxs[0],pxs[1],yTI,dyl,fitT(t,G.len*s)?t:fx(G.len))}
    if(roomy&&G.type==='spiral'&&pxs.length===2){const sp=lead/G.n,t=`${fx(sp,1)} SPACING`;gdim=dh(pxs[0],pxs[1],yTI,dyl,fitT(t,sp*s)?t:fx(sp,1))}
    call=`<line class="k2" marker-start="url(#vA)" x1="${n(tgt)}" y1="${n(tipY)}" x2="${n(cmx)}" y2="${n(yTI+2.4)}"/><circle class="k1" cx="${n(cmx)}" cy="${n(yTI+4.9)}" r="2.6" style="fill:#fff"/><text x="${n(cmx)}" y="${n(yTI+6.1)}" text-anchor="middle" style="font-size:3.2px;font-weight:bold">B</text>`;
    const py=dw.fit?16+rowH*(fitRows.length+1)+7:16,sd=Math.min(32/gw2,18/G.d),bw=Math.max(30,gw2*sd+12),cxm=372,xl=cxm-bw/2,xr=cxm+bw/2,y0=py+20,dd=G.d*sd,yb=y0+dd+5,hw=gw2/2*sd;
    const pr=[];for(let i=0;i<=24;i++){const x=-gw2/2+gw2*i/24;pr.push([cxm+x*sd,y0+prof(x)*sd])}
    const poly=[[xl,y0],[cxm-hw,y0],...pr,[cxm+hw,y0],[xr,y0],[xr,yb],[xl,yb]];
    const xp=-.45*gw2/2,P=[cxm+xp*sd,y0+prof(xp)*sd];
    const lines=[`${G.n} × ${GTYPES[G.type]} GROOVE${G.n>1?'S':''}`,`DEPTH ${fx(G.d)}   RADIUS R${fx(R)}`,`WIDTH AT SURFACE ${fx(gw2)}`];
    if(G.type==='spiral')lines.push(`PITCH (LEAD) ${fx(lead)}`,`${G.n} START${G.n>1?'S':''}, AXIAL SPACING ${fx(lead/G.n,1)}`);
    else if(G.type==='blind')lines.push(`LENGTH ${fx(G.len)} (BETWEEN END`,`RADIUS CENTRES), CLOSED ENDS`);
    else lines.push('FULL LENGTH, OPEN BOTH ENDS');
    const ty=yb+8,ph=ty+lines.length*3.6+1-py;
    det=`<g><rect class="k1" x="338" y="${n(py)}" width="68" height="${n(ph)}"/><text x="340" y="${n(py+4)}" class="sm" style="font-weight:bold;font-size:3px">DETAIL B — GROOVE SECTION</text><text x="340" y="${n(py+8)}" class="sm" style="font-size:2.4px">SCALE ${sd>=1?fx(sd,1)+':1':'1:'+fx(1/sd,1)}  (NOT TO DRAWING SCALE)</text>
<polygon class="k1" style="fill:url(#vh)" points="${pts(poly)}"/>
${dh(cxm-hw,cxm+hw,y0,y0-6,fx(gw2))}
<line class="k6" x1="${n(cxm)}" y1="${n(y0+dd)}" x2="${n(xr)}" y2="${n(y0+dd)}"/>${dv(y0,y0+dd,xr,xr+8,fx(G.d))}
<polyline class="k2" marker-start="url(#vA)" points="${n(P[0])},${n(P[1])} ${n(xl-2)},${n(P[1]+4)}"/><text x="${n(xl-3)}" y="${n(P[1]+5.2)}" text-anchor="end" style="font-size:3px">R${fx(R)}</text>
${lines.map((t,i)=>`<text class="sm" x="340" y="${n(ty+i*3.6)}">${e(t)}</text>`).join('')}</g>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" class="vd" width="420mm" height="297mm" viewBox="0 0 420 297" font-family="Arial Narrow,Arial,Helvetica,sans-serif">
<defs><style>svg.vd .k1{stroke:#000;stroke-width:.5;fill:none}svg.vd .k2{stroke:#000;stroke-width:.25;fill:none}svg.vd .k3{stroke:#000;stroke-width:.25;stroke-dasharray:8 1.5 1.5 1.5;fill:none}svg.vd .k4{stroke:#000;stroke-width:.25;marker-start:url(#vA);marker-end:url(#vA)}svg.vd .k5{stroke:#000;stroke-width:.7;stroke-dasharray:8 2 1.5 2;fill:none}svg.vd .k6{stroke:#000;stroke-width:.25;stroke-dasharray:3 1.5;fill:none}svg.vd text{font-size:3.5px;fill:#000}svg.vd .lb{font-size:2px;fill:#444}svg.vd .tt{font-size:5px;font-weight:bold}svg.vd .sm{font-size:2.7px}</style>
<marker id="vA" viewBox="0 0 10 4" refX="10" refY="2" markerWidth="3.2" markerHeight="1.28" markerUnits="userSpaceOnUse" orient="auto-start-reverse"><path d="M0,0L10,2L0,4z" fill="#000"/></marker>
<pattern id="vh" width="1.6" height="1.6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="1.6" stroke="#000" stroke-width=".2"/></pattern></defs>
<rect width="420" height="297" fill="#fff"/><rect class="k2" x="5" y="5" width="410" height="287"/><rect x="10" y="10" width="400" height="277" fill="none" stroke="#000" stroke-width=".7"/>
<g>
${fl.on?`<circle class="k1" cx="${cx1}" cy="${cy}" r="${n(rF)}"/><circle class="k6" cx="${cx1}" cy="${cy}" r="${n(rO)}"/>`:`<circle class="k1" cx="${cx1}" cy="${cy}" r="${n(rO)}"/>${cs>0?`<circle class="k1" cx="${cx1}" cy="${cy}" r="${n(rO-cs)}"/>`:''}`}${idEnd}
<line class="k3" x1="${n(cx1-rF-7)}" y1="${cy}" x2="${n(cx1+rF+7)}" y2="${cy}"/>
<line class="k5" x1="${cx1}" y1="${n(cy-rF-12)}" x2="${cx1}" y2="${n(cy+rF+12)}"/>
<path class="k1" d="M${cx1} ${n(cy-rF-12)}H${cx1+8}" marker-end="url(#vA)"/><path class="k1" d="M${cx1} ${n(cy+rF+12)}H${cx1+8}" marker-end="url(#vA)"/>
<text x="${cx1-4.5}" y="${n(cy-rF-12)}" class="tt">A</text><text x="${cx1-4.5}" y="${n(cy+rF+15)}" class="tt">A</text>
<text x="${cx1}" y="${n(cy+rF+27)}" text-anchor="middle" class="tt">END VIEW${fl.on?' (FLANGE END)':''}</text>
<polygon class="k1" style="fill:url(#vh)" points="${pts(topP)}"/><polygon class="k1" style="fill:url(#vh)" points="${pts(botP)}"/>
<line class="k1" x1="${n(x0)}" y1="${n(ti[0][1])}" x2="${n(x0)}" y2="${n(bi[0][1])}"/><line class="k1" x1="${n(x1)}" y1="${n(ti[160][1])}" x2="${n(x1)}" y2="${n(bi[160][1])}"/>
<line class="k3" x1="${n(x0-9)}" y1="${cy}" x2="${n(x1+9)}" y2="${cy}"/>
<text x="${n(cx2)}" y="${n(yBF+27)}" text-anchor="middle" class="tt">SECTION A–A</text>
${dh(x0,x1,yBF,yBF+11,lab.L)}
${dv(yTI,yBI,x0,x0-13,lab.ID)}
${fl.on?dv(yTO,yBO,x0,x0-27,lab.OD)+dv(yTF,yBF,x1,x1+13,lab.FD)+dh(xF,x1,yTF,yTF-11,lab.T):dv(yTO,yBO,x1,x1+11,lab.OD)+(()=>{const x=x1+20;return `<line class="k2" x1="${n(x1+1)}" y1="${n(yTO)}" x2="${n(x+2)}" y2="${n(yTO)}"/><line class="k2" x1="${n(x1+1)}" y1="${n(yTI)}" x2="${n(x+2)}" y2="${n(yTI)}"/><line class="k4" x1="${n(x)}" y1="${n(yTO)}" x2="${n(x)}" y2="${n(yTI)}"/><text x="${n(x+3)}" y="${n((yTO+yTI)/2+1.2)}" style="font-size:3px">${e(lab.W)}</text>`})()}
${cs>0?`<polyline class="k2" marker-start="url(#vA)" points="${n(x0+cs*.4)},${n(yTO+cs*.4)} ${n(x0-6)},${n(fl.on?yTF-21:yTO-12)} ${n(x0)},${n(fl.on?yTF-21:yTO-12)}"/>
<text x="${n(x0+1)}" y="${n(fl.on?yTF-22:yTO-13)}">${e(q&&q.chText?q.chText:`${fx(ch,1)} × 30° CHAMFER, OD LEAD-IN`)}</text>`:''}
${gdim}${call}
</g>
${dw.fit?`<g><rect class="k1" x="338" y="16" width="68" height="${n(rowH*(fitRows.length+1)+1)}"/><text x="340" y="20" class="sm" style="font-weight:bold;font-size:3px">FIT AND FEATURE DATA (mm)</text>${fitRows.map((r,i)=>`<line class="k2" x1="338" y1="${n(21+i*rowH)}" x2="406" y2="${n(21+i*rowH)}"/><text class="sm" x="340" y="${n(24.4+i*rowH)}">${e(String(r[0]).slice(0,24))}</text><text class="sm" x="404" y="${n(24.4+i*rowH)}" text-anchor="end">${e(String(r[1]).slice(0,28))}</text>`).join('')}</g>`:''}
${det}
<g>${notes.map((t,i)=>`<text x="14" y="${236+i*4.4}" style="font-size:${i?3:3.8}px;${i?'':'font-weight:bold'}" xml:space="preserve">${e(t.length>118?t.slice(0,117)+"…":t)}</text>`).join('')}</g>
<g>${cell(220,245,185,16,'','',1).replace(/<rect[^>]*\/>/,'<rect class="k1" x="220" y="245" width="185" height="16"/>')}<line class="k1" x1="262" y1="245" x2="262" y2="261"/>${lgBox}<text class="lb" x="263" y="247.6">TITLE</text><text x="264" y="257" style="font-size:${Math.min(4.6,138/Math.max(1,title.length*.52)).toFixed(2)}px">${e(title)}</text>
${cell(220,261,46,12,'MATERIAL',e(q?q.material:GRADES[g][0].replace('VESCONITE HILUBE','VES. HILUBE')),3.2)}${cell(266,261,46,12,'SCALE',scl)}${cell(312,261,46,12,'SIZE',e(dw.paper.toUpperCase()))}${cell(358,261,47,12,'SHEET','1 OF 1')}${cell(220,273,68,14,'DRAWING NO.',e(drg),3.2)}${cell(288,273,16,14,'REV',e(dw.rev))}${cell(304,273,50,14,'DATE',e(p.date))}${cell(354,273,51,14,'DRAWN BY',e(p.who),2.8)}</g>
</svg>`;
}
/* ---------- PDF without any library: pages are drawn as SVG, rasterised to JPEG and wrapped in a small PDF file ---------- */
function buildPdf(pages,wMm,hMm){
  const pt=m=>+(m*72/25.4).toFixed(2),W=pt(wMm),H=pt(hMm),enc=new TextEncoder(),parts=[],off={},N=2+pages.length*3;let len=0;
  const push=b=>{const u=typeof b==='string'?enc.encode(b):b;parts.push(u);len+=u.length};
  const obj=(id,body)=>{off[id]=len;push(`${id} 0 obj\n${body}\nendobj\n`)};
  push('%PDF-1.4\n');
  obj(1,'<< /Type /Catalog /Pages 2 0 R >>');
  obj(2,`<< /Type /Pages /Kids [${pages.map((_,i)=>`${3+i*3} 0 R`).join(' ')}] /Count ${pages.length} >>`);
  pages.forEach((p,i)=>{const pg=3+i*3,im=pg+1,ct=pg+2,c=`q ${W} 0 0 ${H} 0 0 cm /Im${i} Do Q`;
    obj(pg,`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${W} ${H}] /Resources << /XObject << /Im${i} ${im} 0 R >> >> /Contents ${ct} 0 R >>`);
    off[im]=len;push(`${im} 0 obj\n<< /Type /XObject /Subtype /Image /Width ${p.w} /Height ${p.h} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${p.jpg.length} >>\nstream\n`);push(p.jpg);push('\nendstream\nendobj\n');
    obj(ct,`<< /Length ${c.length} >>\nstream\n${c}\nendstream`)});
  const xr=len;let x=`xref\n0 ${N+1}\n0000000000 65535 f \n`;for(let i=1;i<=N;i++)x+=String(off[i]).padStart(10,'0')+' 00000 n \n';
  push(`${x}trailer\n<< /Size ${N+1} /Root 1 0 R >>\nstartxref\n${xr}\n%%EOF\n`);
  return new Blob(parts,{type:'application/pdf'});
}
async function svgToJpeg(svg,wPx,hPx){
  const u=URL.createObjectURL(new Blob(['<?xml version="1.0" encoding="UTF-8"?>\n'+svg],{type:'image/svg+xml'}));let im;
  try{im=await img(u)}finally{URL.revokeObjectURL(u)}
  const cv=document.createElement('canvas');cv.width=wPx;cv.height=hPx;const x=cv.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,wPx,hPx);x.drawImage(im,0,0,wPx,hPx);
  const jb=await new Promise(ok=>cv.toBlob(ok,'image/jpeg',.92));if(!jb)throw new Error('Could not render the page.');
  return{jpg:new Uint8Array(await jb.arrayBuffer()),w:wPx,h:hPx};
}
const svgImg=(u,x,y,w,h)=>`<image x="${x}" y="${y}" width="${w.toFixed(2)}" height="${h.toFixed(2)}" href="${u}" xlink:href="${u}" preserveAspectRatio="xMidYMid meet"/>`;
const pageSvg=inner=>`<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="210mm" height="297mm" viewBox="0 0 210 297" font-family="Arial,Helvetica,sans-serif"><rect width="210" height="297" fill="#fff"/>${inner}</svg>`;
const _mc=document.createElement('canvas').getContext('2d');
function wrapLines(t,maxMm,fs,bold){_mc.font=`${bold?'bold ':''}100px Arial`;const k=fs/100,out=[];for(const para of String(t||'').split('\n')){let line='';for(const w of para.split(/\s+/)){const tr=line?line+' '+w:w;if(_mc.measureText(tr).width*k>maxMm&&line){out.push(line);line=w}else line=tr}out.push(line)}return out}

/* ---------- STEP (ISO 10303-21, AP214) export of the bush body: plain faces of revolution (cylinders, cones, planes). Grooves are not modelled. ---------- */
function stepFile(p){
  if(p.G&&p.G.type!=='none'&&p.gz)return stepFaceted(p);
  return stepPlain(p);
}
/* Faceted STEP (FACETED_BREP) used when grooves are present: the whole bush, grooves included, as small flat faces. */
function stepFaceted(p){
  const rO=p.OD/2,rI=p.ID/2,L=p.L,fl=p.fl&&p.fl.on,rF=fl?p.fl.FD/2:rO,T=fl?p.fl.T:0,G=p.G,gz=p.gz,hh=L/2;
  const c=Math.max(0,Math.min(p.ch||0,(rO-rI)*.8,(L-T)*.4));
  const P=[[rI,0]];if(c>0)P.push([rO-c,0],[rO,c]);else P.push([rO,0]);
  if(fl)P.push([rO,L-T],[rF,L-T],[rF,L]);else if(c>0)P.push([rO,L-c],[rO-c,L]);else P.push([rO,L]);
  P.push([rI,L]);
  const gw=grooveWidth(G.d,G.r),Nt=Math.min(360,Math.max(180,Math.ceil(2*Math.PI*rI/(gw/9))));
  let ys;
  if(G.type==='long')ys=[hh,-hh];
  else if(G.type==='blind'){const s=new Set([hh,-hh,0]),hl=G.len/2;for(let k=0;k<=14;k++){const d=hl+G.r*k/14;[d,-d].forEach(v=>{if(Math.abs(v)<hh)s.add(+v.toFixed(4))})}[hl,-hl].forEach(v=>{if(Math.abs(v)<hh)s.add(v)});ys=[...s].sort((a,b)=>b-a)}
  else{const n=Math.min(110,Math.max(40,Math.ceil(L/(gw/6))));ys=Array.from({length:n+1},(_,j)=>hh-L*j/n)}
  const fm=x=>{x=Math.abs(x)<1e-9?0:x;return x.toFixed(5).replace(/0+$/,'')};
  const E=[];let n=0;const add=s=>{E.push(`#${++n}=${s};`);return n};
  const ring=(z,rf)=>{const ids=[];for(let i=0;i<Nt;i++){const t=2*Math.PI*i/Nt,r=rf(t);ids.push(add(`CARTESIAN_POINT('',(${fm(r*Math.cos(t))},${fm(r*Math.sin(t))},${fm(z)}))`))}return ids};
  const rows=[{z:0,g:1,ids:ring(0,t=>rI+gz(t,-hh))}];
  for(const[r,z]of P.slice(1,-1))rows.push({z,g:0,ids:ring(z,()=>r)});
  rows.push({z:L,g:1,ids:ring(L,t=>rI+gz(t,hh))});
  for(let j=1;j<ys.length-1;j++){const y=ys[j];rows.push({z:y+hh,g:1,ids:ring(y+hh,t=>rI+gz(t,y))})}
  rows.push(rows[0]);
  const faces=[];
  const mk=ids=>{const lp=add(`POLY_LOOP('',(${ids.map(x=>'#'+x).join(',')}))`),fb=add(`FACE_BOUND('',#${lp},.T.)`);faces.push(add(`FACE('',(#${fb}))`))};
  for(let k=0;k<rows.length-1;k++){const A=rows[k],B=rows[k+1],flat=A.z===B.z||(!A.g&&!B.g)||(G.type==='long'&&A.g&&B.g);
    for(let i=0;i<Nt;i++){const j=(i+1)%Nt,a=A.ids[i],b=A.ids[j],c2=B.ids[j],d=B.ids[i];if(flat)mk([a,b,c2,d]);else{mk([a,b,c2]);mk([a,c2,d])}}}
  const nm=String(p.name||'BUSH').replace(/[^\x20-\x7E]/g,'').replace(/'/g,"''")||'BUSH';
  const shell=add(`CLOSED_SHELL('',(${faces.map(x=>'#'+x).join(',')}))`),fb=add(`FACETED_BREP('${nm}',#${shell})`);
  const dZ=add("DIRECTION('',(0.,0.,1.))"),dX=add("DIRECTION('',(1.,0.,0.))"),o0=add("CARTESIAN_POINT('',(0.,0.,0.))"),a0=add(`AXIS2_PLACEMENT_3D('',#${o0},#${dZ},#${dX})`);
  const len=add("(LENGTH_UNIT()NAMED_UNIT(*)SI_UNIT(.MILLI.,.METRE.))"),ang=add("(NAMED_UNIT(*)PLANE_ANGLE_UNIT()SI_UNIT($,.RADIAN.))"),sa=add("(NAMED_UNIT(*)SI_UNIT($,.STERADIAN.)SOLID_ANGLE_UNIT())");
  const unc=add(`UNCERTAINTY_MEASURE_WITH_UNIT(LENGTH_MEASURE(1.E-05),#${len},'distance_accuracy_value','confusion accuracy')`);
  const ctx=add(`(GEOMETRIC_REPRESENTATION_CONTEXT(3)GLOBAL_UNCERTAINTY_ASSIGNED_CONTEXT((#${unc}))GLOBAL_UNIT_ASSIGNED_CONTEXT((#${len},#${ang},#${sa}))REPRESENTATION_CONTEXT('Context3d','3D Context with UNIT and UNCERTAINTY'))`);
  const rep=add(`FACETED_BREP_SHAPE_REPRESENTATION('',(#${a0},#${fb}),#${ctx})`);
  const ac=add("APPLICATION_CONTEXT('core data for automotive mechanical design processes')"),pc=add(`PRODUCT_CONTEXT('',#${ac},'mechanical')`),pr=add(`PRODUCT('${nm}','${nm}','',(#${pc}))`);
  const pf=add(`PRODUCT_DEFINITION_FORMATION('','',#${pr})`),pdc=add(`PRODUCT_DEFINITION_CONTEXT('part definition',#${ac},'design')`),pd=add(`PRODUCT_DEFINITION('design','',#${pf},#${pdc})`),pds=add(`PRODUCT_DEFINITION_SHAPE('','',#${pd})`);
  add(`SHAPE_DEFINITION_REPRESENTATION(#${pds},#${rep})`);add(`APPLICATION_PROTOCOL_DEFINITION('international standard','automotive_design',2000,#${ac})`);add(`PRODUCT_RELATED_PRODUCT_CATEGORY('part','',(#${pr}))`);
  return `ISO-10303-21;\nHEADER;\nFILE_DESCRIPTION(('Vesco Intelligence bush with grooves, faceted solid'),'2;1');\nFILE_NAME('${nm}.step','${new Date().toISOString().slice(0,19)}',('Vesco Intelligence'),(''),'Vesco Intelligence','Vesco Intelligence','');\nFILE_SCHEMA(('AUTOMOTIVE_DESIGN { 1 0 10303 214 1 1 1 1 }'));\nENDSEC;\nDATA;\n${E.join('\n')}\nENDSEC;\nEND-ISO-10303-21;\n`;
}
function stepPlain(p){
  const rO=p.OD/2,rI=p.ID/2,L=p.L,fl=p.fl&&p.fl.on,rF=fl?p.fl.FD/2:rO,T=fl?p.fl.T:0;
  const c=Math.max(0,Math.min(p.ch||0,(rO-rI)*.8,(L-T)*.4));
  const P=[[rI,0]];if(c>0)P.push([rO-c,0],[rO,c]);else P.push([rO,0]);
  if(fl)P.push([rO,L-T],[rF,L-T],[rF,L]);else if(c>0)P.push([rO,L-c],[rO-c,L]);else P.push([rO,L]);
  P.push([rI,L]);
  const fm=x=>{x=Math.abs(x)<1e-9?0:x;const s=x.toFixed(6).replace(/0+$/,'');return s.endsWith('.')?s:s}; /* e.g. "5." or "5.25" */
  const E=[];let n=0;const add=s=>{E.push(`#${++n}=${s};`);return n};
  const pt=(x,y,z)=>add(`CARTESIAN_POINT('',(${fm(x)},${fm(y)},${fm(z)}))`),dr=(x,y,z)=>add(`DIRECTION('',(${fm(x)},${fm(y)},${fm(z)}))`);
  const dZ=dr(0,0,1),dNZ=dr(0,0,-1),dX=dr(1,0,0);
  const ax=(z,d)=>add(`AXIS2_PLACEMENT_3D('',#${pt(0,0,z)},#${d},#${dX})`);
  const vert=P.map(([r,z])=>{const v=add(`VERTEX_POINT('',#${pt(r,0,z)})`),ci=add(`CIRCLE('',#${ax(z,dZ)},${fm(r)})`);return add(`EDGE_CURVE('',#${v},#${v},#${ci},.T.)`)});
  const loop=(e,s)=>add(`EDGE_LOOP('',(#${add(`ORIENTED_EDGE('',*,*,#${e},${s})`)}))`);
  const faces=[];
  for(let i=0;i<P.length;i++){const j=(i+1)%P.length,a=P[i],b=P[j];let f;
    if(a[1]===b[1]){const down=b[0]>a[0],o=a[0]>b[0]?i:j,inn=o===i?j:i,so=down?'.F.':'.T.',si=down?'.T.':'.F.';
      const pl=add(`PLANE('',#${ax(a[1],down?dNZ:dZ)})`);
      f=add(`ADVANCED_FACE('',(#${add(`FACE_OUTER_BOUND('',#${loop(vert[o],so)},.T.)`)},#${add(`FACE_BOUND('',#${loop(vert[inn],si)},.T.)`)}),#${pl},.T.)`)}
    else if(a[0]===b[0]){const out=b[1]>a[1],lo=a[1]<b[1]?i:j,hi=lo===i?j:i,cy=add(`CYLINDRICAL_SURFACE('',#${ax(0,dZ)},${fm(a[0])})`);
      f=add(`ADVANCED_FACE('',(#${add(`FACE_BOUND('',#${loop(vert[lo],out?'.T.':'.F.')},.T.)`)},#${add(`FACE_BOUND('',#${loop(vert[hi],out?'.F.':'.T.')},.T.)`)}),#${cy},${out?'.T.':'.F.'})`)}
    else{const bottom=a[0]<b[0],al=Math.atan(Math.abs(b[0]-a[0])/Math.abs(b[1]-a[1])),co=bottom?add(`CONICAL_SURFACE('',#${ax(a[1],dZ)},${fm(a[0])},${al.toFixed(8)})`):add(`CONICAL_SURFACE('',#${ax(b[1],dNZ)},${fm(b[0])},${al.toFixed(8)})`);
      f=add(`ADVANCED_FACE('',(#${add(`FACE_BOUND('',#${loop(vert[i],'.T.')},.T.)`)},#${add(`FACE_BOUND('',#${loop(vert[j],'.F.')},.T.)`)}),#${co},.T.)`)}
    faces.push(f)}
  const nm=String(p.name||'BUSH').replace(/[^\x20-\x7E]/g,'').replace(/'/g,"''")||'BUSH';
  const shell=add(`CLOSED_SHELL('',(${faces.map(x=>'#'+x).join(',')}))`),brep=add(`MANIFOLD_SOLID_BREP('${nm}',#${shell})`);
  const len=add("(LENGTH_UNIT()NAMED_UNIT(*)SI_UNIT(.MILLI.,.METRE.))"),ang=add("(NAMED_UNIT(*)PLANE_ANGLE_UNIT()SI_UNIT($,.RADIAN.))"),sa=add("(NAMED_UNIT(*)SI_UNIT($,.STERADIAN.)SOLID_ANGLE_UNIT())");
  const unc=add(`UNCERTAINTY_MEASURE_WITH_UNIT(LENGTH_MEASURE(1.E-05),#${len},'distance_accuracy_value','confusion accuracy')`);
  const ctx=add(`(GEOMETRIC_REPRESENTATION_CONTEXT(3)GLOBAL_UNCERTAINTY_ASSIGNED_CONTEXT((#${unc}))GLOBAL_UNIT_ASSIGNED_CONTEXT((#${len},#${ang},#${sa}))REPRESENTATION_CONTEXT('Context3d','3D Context with UNIT and UNCERTAINTY'))`);
  const a0=ax(0,dZ),rep=add(`ADVANCED_BREP_SHAPE_REPRESENTATION('',(#${a0},#${brep}),#${ctx})`);
  const ac=add("APPLICATION_CONTEXT('core data for automotive mechanical design processes')"),pc=add(`PRODUCT_CONTEXT('',#${ac},'mechanical')`),pr=add(`PRODUCT('${nm}','${nm}','',(#${pc}))`);
  const pf=add(`PRODUCT_DEFINITION_FORMATION('','',#${pr})`),pdc=add(`PRODUCT_DEFINITION_CONTEXT('part definition',#${ac},'design')`),pd=add(`PRODUCT_DEFINITION('design','',#${pf},#${pdc})`),pds=add(`PRODUCT_DEFINITION_SHAPE('','',#${pd})`);
  add(`SHAPE_DEFINITION_REPRESENTATION(#${pds},#${rep})`);add(`APPLICATION_PROTOCOL_DEFINITION('international standard','automotive_design',2000,#${ac})`);add(`PRODUCT_RELATED_PRODUCT_CATEGORY('part','',(#${pr}))`);
  return `ISO-10303-21;\nHEADER;\nFILE_DESCRIPTION(('Vesco Intelligence bush body, grooves not modelled'),'2;1');\nFILE_NAME('${nm}.step','${new Date().toISOString().slice(0,19)}',('Vesco Intelligence'),(''),'Vesco Intelligence','Vesco Intelligence','');\nFILE_SCHEMA(('AUTOMOTIVE_DESIGN { 1 0 10303 214 1 1 1 1 }'));\nENDSEC;\nDATA;\n${E.join('\n')}\nENDSEC;\nEND-ISO-10303-21;\n`;
}
const stepDownload=()=>{if(!LAST||!LAST.step)return;deliver(new Blob([stepFile(LAST.step)],{type:'application/octet-stream'}),LAST.drg+'.step');log('Downloaded STEP',LAST.drg)};

/* Files: iOS home-screen apps cannot download directly, so use the share sheet when available */
async function deliver(blob,name){
  const f=new File([blob],name,{type:blob.type});
  if(navigator.canShare&&navigator.canShare({files:[f]})){try{await navigator.share({files:[f],title:name});return}catch(x){if(x.name==='AbortError')return}}
  const u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download=name;document.body.appendChild(a);a.click();a.remove();
  if(/pdf|svg/.test(blob.type)&&(navigator.standalone||matchMedia('(display-mode: standalone)').matches))window.open(u,'_blank');
  setTimeout(()=>URL.revokeObjectURL(u),60000);
}
const svgBlob=()=>new Blob(['<?xml version="1.0" encoding="UTF-8"?>\n'+LAST.svg],{type:'image/svg+xml'});
async function makeDrawingPdf(){
  const a4=(LAST.paper||S.dw.paper)==='a4';
  return buildPdf([await svgToJpeg(LAST.svg,3360,2376)],a4?297:420,a4?210:297);
}
async function pdfStep(b){   /* tap 1 builds the PDF, tap 2 opens the share sheet (iOS needs a fresh tap) */
  if(b._b){await deliver(b._b,LAST.drg+'.pdf');return}
  const t=b.textContent;b.disabled=true;b.textContent='Building…';
  try{b._b=await makeDrawingPdf();b.textContent='Open PDF';log('Made drawing PDF',LAST.drg)}catch(x){alert('Could not build the PDF: '+(x.message||x));b.textContent=t}
  b.disabled=false;
}
function openDrawing(){
  if(!LAST)return;const o=document.createElement('div');o.className='ov';
  o.innerHTML=`<div class="ovb"><strong>${esc(LAST.drg)}</strong><span class="sp"></span><button data-z="-1" aria-label="Zoom out">−</button><button data-z="1" aria-label="Zoom in">+</button><button data-a="pdf">Make PDF</button><button data-a="svg">SVG</button><button data-a="step">STEP</button><button data-a="x">Close</button></div><div class="ovs">${LAST.svg}</div>`;
  document.body.appendChild(o);document.body.style.overflow='hidden';
  const sv=$('svg',o);let wd=Math.min(1400,Math.max(innerWidth*2.4,900));sv.style.width=wd+'px';
  o.onclick=async e=>{const b=e.target.closest('button');if(!b)return;
    if(b.dataset.z){wd=Math.min(3200,Math.max(400,wd*(+b.dataset.z>0?1.3:1/1.3)));sv.style.width=wd+'px'}
    else if(b.dataset.a==='x'){o.remove();document.body.style.overflow=''}
    else if(b.dataset.a==='svg')deliver(svgBlob(),LAST.drg+'.svg');
    else if(b.dataset.a==='step')stepDownload();
    else if(b.dataset.a==='pdf')pdfStep(b)};
}
function design(v){
  if(!S.feat.pv){location.hash='#/tools';return}
  T3=null;T3L=false;LAST=null;
  if(!S.dw.logo)repoLogo().then(r=>{if(r&&!window.__rl){window.__rl=r;if($('#DF'))$('#DF').dispatchEvent(new Event('input'))}});
  const n=(id,l,u,val='',att='')=>`<label>${l} <span class="mut">${u}</span><input id="${id}" type="number" inputmode="decimal" step="any" value="${val}" ${att}></label>`;
  v.innerHTML=`<a class="back" href="#/tools">← Tools</a><h1>Industrial bearing</h1><p class="mut">Bearing size, fit, clearance, grooves and PV using the equations in the Vesconite design manual (metric, free-standing bush, sizes at 20 °C). A design aid: confirm with Vesconite's own Design a Bearing calculator before ordering.</p>
  <form class="card" id="DF"><div class="g2">${n('d1','Housing diameter','mm')}${n('d2','Shaft diameter','mm')}${n('d3','Bearing length (overall)','mm')}
  <label>Grade<select id="d18"><option value="v">Vesconite</option><option value="h">Vesconite Hilube</option></select></label>
  <label>Press fit?<select id="d4"><option value="y">Yes</option><option value="n">No</option></select></label>
  <label>Operating condition<select id="d5"><option value="wet">Immersed in water</option><option value="dry">Dry, oil or grease</option></select></label>
  ${n('d6','Max operating temp','°C')}${n('d7','Min operating temp','°C')}${n('d9','Total mass supported','kg')}${n('d10','Bearings sharing the mass','','1')}</div>
  <label>Motion<select id="d11"><option value="rot">Rotation</option><option value="osc">Oscillation</option><option value="lin">Linear</option></select></label>
  <div class="g2" data-m="rot">${n('d12','Speed','rpm')}</div>
  <div class="g2" data-m="osc" hidden>${n('d13','Swing angle','degrees')}${n('d14','Cycles per minute','')}</div>
  <div class="g2" data-m="lin" hidden>${n('d15','Travel per stroke','mm')}${n('d16','Cycles per minute','')}</div>
  ${n('d17','PV limit for your grade (optional)','MPa·m/min')}
  <h3 style="margin-top:6px">Flange</h3><label>Flanged bearing?<select id="d30"><option value="n">No</option><option value="y">Yes</option></select></label>
  <div class="g2" data-f hidden>${n('d31','Flange diameter','mm')}${n('d32','Flange thickness','mm')}</div>
  <h3 style="margin-top:6px">Grooves</h3><label>Groove type<select id="d20"><option value="none">None</option><option value="spiral">Spiral</option><option value="blind">Blind radial</option><option value="long">Longitudinal</option></select></label>
  <div data-g hidden><div class="g2">${n('d21','Number of grooves','')}${n('d22','Groove depth','mm')}${n('d23','Groove radius','mm')}
  <div data-gt="spiral" hidden>${n('d24','Spiral pitch (advance per turn)','mm')}</div><div data-gt="blind" hidden>${n('d25','Groove length','mm')}</div></div>
  <div id="GR" class="note-box"></div></div></form>
  <div class="card" id="MD" hidden><div class="seg"><button type="button" data-t="3d" class="on">3D model</button><button type="button" data-t="dr">Drawing</button></div><div class="m3" id="m3"></div><div id="mdr" class="mdr" hidden></div>
  <div class="acts"><button type="button" class="btn pri" id="mx">Expand to drawing</button><button type="button" class="btn" id="mc">Cutaway view</button><button type="button" class="btn" id="mstep">STEP file</button></div><p class="mut" style="margin:0">3D: drag to rotate, pinch or scroll to zoom. The drawing is generated from the sizes below.</p><p class="mut" id="stn" style="margin:6px 0 0"></p></div>
  <div id="DO"></div>`;
  $('#DF').onsubmit=e=>e.preventDefault();
  $$('#MD .seg button').forEach(b=>b.onclick=()=>{$$('#MD .seg button').forEach(x=>x.classList.toggle('on',x===b));$('#m3').hidden=b.dataset.t!=='3d';$('#mdr').hidden=b.dataset.t!=='dr'});
  $('#mx').onclick=openDrawing;$('#mstep').onclick=stepDownload;
  $('#mc').onclick=()=>{if(T3){T3.cut=!T3.cut;$('#mc').textContent=T3.cut?'Full view':'Cutaway view';if(T3.last)upd3(T3,T3.last)}};
  let lastGt='none',autoDone=false;
  const cv=()=>{
    const g=id=>parseFloat($('#'+id).value),H=g('d1'),D=g('d2'),L=g('d3'),O=$('#DO'),mo=$('#d11').value,MD=$('#MD'),fl0=$('#d30').value==='y',gt=$('#d20').value;
    $$('[data-m]').forEach(x=>x.hidden=x.dataset.m!==mo);$$('[data-f]').forEach(x=>x.hidden=!fl0);$$('[data-g]').forEach(x=>x.hidden=gt==='none');$$('[data-gt]').forEach(x=>x.hidden=x.dataset.gt!==gt);
    const bad=m=>{MD.hidden=true;O.innerHTML=m};
    if(!(H>0&&D>0&&L>0))return bad('<p class="mut">Enter housing diameter, shaft diameter and bearing length.</p>');
    if(H<=D)return bad('<p class="note bad">The housing diameter must be larger than the shaft diameter.</p>');
    const gk=$('#d18').value,pf=$('#d4').value==='y',dry=$('#d5').value==='dry',tx=g('d6'),tn=g('d7'),nb=g('d10')>0?g('d10'):1;
    const press=pf?0.05+0.002*H:0,clo=press*D/H,OD=H+press,c=(0.05+0.01*(OD-D-clo))/1.01,ID=D+clo+c,w=(OD-ID)/2;
    if(!(w>0))return bad('<p class="note bad">These sizes leave no bearing wall. Check the diameters.</p>');
    const fl={on:fl0,FD:g('d31'),T:g('d32')};
    if(fl0){if(!(fl.FD>OD&&fl.T>0))return bad('<p class="note bad">Enter a flange diameter larger than the bearing outside diameter ('+fx(OD)+' mm) and a flange thickness.</p>');if(fl.T>=L)return bad('<p class="note bad">The flange thickness must be less than the overall bearing length.</p>')}
    const G={type:gt,n:g('d21'),d:g('d22'),r:g('d23'),pitch:g('d24'),len:g('d25')},rec=gt!=='none'?recGroove(gt,D,w,L):null;
    if(gt!==lastGt){lastGt=gt;autoDone=false}
    if(gt!=='none'&&rec&&!autoDone){autoDone=true;let ch=false;const set=(id,x)=>{if(!(+$('#'+id).value>0)&&x!=null){$('#'+id).value=x;ch=true}};set('d21',rec.n);set('d22',rec.d);set('d23',rec.r);if(gt==='spiral')set('d24',rec.pitch);if(gt==='blind')set('d25',rec.len);if(ch)return cv()}
    const grHtml=gt==='none'?'':rec?`<p class="mut" style="margin:6px 0">Recommended for a ${fx(D,0)} mm shaft: ${gt==='spiral'||gt==='blind'?'width, depth and radius from the manual\'s groove table; count, pitch and length are suggested starting points. ':''}<b>${rec.n} grooves, depth ${rec.d} mm, radius ${rec.r} mm</b> (about ${fx(grooveWidth(rec.d,rec.r),1)} mm wide)${gt==='spiral'?`, pitch ${rec.pitch} mm`:''}${gt==='blind'?`, length ${rec.len} mm`:''}. Water flow about ${rec.q} l/min.${rec.lim?' Depth reduced to keep it under half the wall.':''}</p><button type="button" class="btn" id="ra">Apply recommendation</button>`:'<p class="mut">The manual\'s groove table covers shaft diameters of 20–200 mm. Enter your own values.</p>';
    if($('#GR').dataset.h!==grHtml){$('#GR').dataset.h=grHtml;$('#GR').innerHTML=grHtml}
    if(rec&&$('#ra'))$('#ra').onclick=()=>{const set=(id,x)=>{$('#'+id).value=x!=null?x:''};set('d21',rec.n);set('d22',rec.d);set('d23',rec.r);if(gt==='spiral')set('d24',rec.pitch);if(gt==='blind')set('d25',rec.len);cv()};
    const gOK=gt==='none'||(G.n>0&&G.d>0&&G.r>0&&(gt!=='spiral'||G.pitch>0)&&(gt!=='blind'||G.len>0));
    const Gu=gOK?G:{type:'none'},gz=grooveFn(Gu,ID/2),gw=gOK&&gt!=='none'?grooveWidth(G.d,G.r):0;
    const ms=g('d9'),P=ms>0?ms*9.81/nb/(D*L):NaN;
    const V=mo==='rot'?Math.PI*D*g('d12')/1000:mo==='osc'?Math.PI*D/1000*(2*g('d13')/360)*g('d14'):2*g('d15')/1000*g('d16');
    let frac=0;if(gOK&&gt!=='none'){const circ=Math.PI*ID;frac=gt==='long'?G.n*gw/circ:gt==='blind'?G.n*gw*Math.min(G.len,L)/(circ*L):gw/((G.pitch/G.n)*circ/Math.hypot(circ,G.pitch))}
    frac=Math.min(frac,0.9);const Pe=P/(1-frac),PV=Pe*V,lim=g('d17'),wp=w/D*100,ck=[];
    ck.push(wp>=5&&wp<=20?['ok',`Wall thickness is ${fx(wp,1)}% of the shaft diameter (recommended 5–20%).`]:['warn',`Wall thickness is ${fx(wp,1)}% of the shaft diameter, outside the recommended 5–20%.${wp<5?' Thin walls need care when machining and fitting; consider bonding or mechanical securing.':''}`]);
    if(L>D)ck.push(['warn','The bearing is longer than its diameter. Long bearings need additional care when machining and fitting.']);
    if(Number.isFinite(Pe))ck.push(Pe<=30?['ok',`Pressure ${fx(Pe)} MPa is under the 30 MPa maximum design load for static, oscillating or occasional movement. Continuous rotation is limited by PV.`]:['bad',`Pressure ${fx(Pe)} MPa is over the 30 MPa maximum design load.`]);
    const tl=dry?GRADES[gk][2]:GRADES[gk][1];
    if(Number.isFinite(tx))ck.push(tx<=tl?['ok',`Max temperature ${tx} °C is within the typical ${tl} °C limit for ${GRADES[gk][0].toLowerCase()} ${dry?'dry or lubricated':'immersed'} use.`]:['bad',`Max temperature ${tx} °C is above the typical ${tl} °C limit for ${dry?'dry or lubricated':'immersed'} use. Contact Vesconite about a higher-temperature grade.`]);
    if(pf&&tx>70)ck.push(['warn','Above 70 °C a press fit may loosen. Secure the bearing mechanically or bond it.']);
    if(!pf)ck.push(['warn','No press fit: the bearing must be secured another way (bonding, keeper plate, screws). Outside diameter is taken as the housing diameter.']);
    if(lim>0&&Number.isFinite(PV))ck.push(PV<=lim?['ok',`PV ${fx(PV,1)} is ${Math.round(PV/lim*100)}% of the limit you entered.`]:['bad',`PV ${fx(PV,1)} exceeds the limit you entered (${lim}).`]);
    if(gt!=='none'&&!gOK)ck.push(['warn','Enter the groove number, depth and radius (and pitch or length) to include grooves.']);
    if(gOK&&gt!=='none'){
      ck.push(G.d<w/2?['ok',`Groove depth ${fx(G.d)} mm is under half the wall thickness (${fx(w/2)} mm).`]:['bad',`Groove depth ${fx(G.d)} mm is half the wall thickness or more. Keep it under ${fx(w/2)} mm and add extra grooves instead.`]);
      if(G.d<2.5)ck.push(['warn','The manual prefers grooves deeper than 2.5 mm to avoid blockage by sand or coarse debris.']);
      if(G.r<G.d/2)ck.push(['warn','Groove radius is small for this depth, giving a narrow slot. A radius of at least half the depth is usual.']);
      ck.push(['ok',`Grooves remove about ${fx(frac*100,0)}% of the bore surface${frac>0?`, so contact pressure on the remaining surface is about ${fx(Pe)} MPa.`:'.'}`]);
      if(gt==='long'&&G.n*gw>Math.PI*ID*0.5)ck.push(['warn','Grooves take up more than half the bore circumference.']);
    }
    if(fl0)ck.push(['ok','Flange: overall length includes the flange thickness. Flange sizes are as entered; the manual gives no flange sizing rule.']);
    const chn=OD<10?0:OD<=20?0.5:OD<=50?1:OD<=100?1.5:OD<=250?2:3,t20=(x,t)=>x*(1+K*(t-20)),gr=D>=20&&D<=200?GRV.find(x=>D<=x[0]):null;
    const rows=[['5–10',7.5],['10–15',12.5],['15–20',17.5],['20–30',25],['30–35',32.5],['35–40',37.5]].map(([b,t])=>`<tr><td>${b} °C</td><td>${fx(t20(OD,t),2)}</td><td>${fx(t20(ID,t),2)}</td><td>${fx((t20(OD,t)-t20(ID,t))/2,2)}</td></tr>`).join('');
    const tOD=tol(OD,.1,.025),tID=tol(ID,.1,.025),tW=tol(w,.5,.025),tL=tol(L,.5,.3),dt=new Date(),drg=`${S.dw.prefix||'VI'}-${dt.toISOString().slice(0,10).replace(/-/g,'')}-${Math.round(OD)}-${Math.round(ID)}-${Math.round(L)}`;
    const logo=S.dw.logo?{u:S.dw.logo,r:S.dw.logoR||1}:window.__rl||null;
    LAST={drg,step:{name:'BEARING-BUSH',OD,ID,L,ch:chn||0.5,fl,G:Gu,gz},svg:drawSVG({OD,ID,L,ch:chn||0.5,w,H,D,press,clo,c,g:gk,tOD,tID,tW,tL,pf,drg,G:Gu,fl,dw:S.dw,logo,gz,date:dt.toLocaleDateString(),who:S.dw.who==='custom'?S.dw.whoText:(ME?.email||'').split('@')[0]})};
    $('#mdr').innerHTML=LAST.svg;MD.hidden=false;$('#stn').textContent='STEP file contains: the bush body'+(fl0?', flange':'')+(chn?', chamfer':'')+(gOK&&gt!=='none'?`, and ${G.n} ${GTYPES[gt].toLowerCase()} groove${G.n>1?'s':''} (depth ${fx(G.d)}, radius R${fx(G.r)}).`:'. No grooves are set.');
    PEND3={OD,ID,L,ch:chn||0.5,g:gk,fl,gz,G:Gu};if(T3)upd3(T3,PEND3);else if(!T3L){T3L=true;lib('three').then(()=>{T3=init3($('#m3'));if(T3&&PEND3)upd3(T3,PEND3)}).catch(()=>{$('#m3').innerHTML='<p class="empty" style="margin:12px">The 3D viewer could not load. Check your connection.</p>'})}
    O.innerHTML=`<div class="card"><h2>Bearing dimensions at 20 °C</h2><dl class="spec" style="margin:0">
    <dt>Outside diameter</dt><dd>${fx(OD)} mm ± ${fx(tOD,3)}</dd><dt>Inside diameter</dt><dd>${fx(ID)} mm ± ${fx(tID,3)}</dd>
    <dt>Wall thickness</dt><dd>${fx(w)} mm +0 / −${fx(tW,3)}</dd><dt>Length</dt><dd>${fx(L)} mm +0 / −${fx(tL,2)}</dd>
    ${fl0?`<dt>Flange</dt><dd>Ø${fx(fl.FD)} × ${fx(fl.T)} mm thick</dd>`:''}
    <dt>Press fit (interference)</dt><dd>${fx(press,3)} mm</dd><dt>Bore closure</dt><dd>${fx(clo,3)} mm</dd><dt>Assembly clearance</dt><dd>${fx(c,3)} mm</dd><dt>Fitted inside diameter</dt><dd>${fx(D+c,3)} mm</dd>
    <dt>Lead-in chamfer</dt><dd>${chn||'–'} mm × 30°</dd>${gOK&&gt!=='none'?`<dt>Grooves</dt><dd>${GTYPES[gt].toLowerCase()}, ${G.n} × ${fx(gw,1)} mm wide × ${fx(G.d)} deep (R${fx(G.r)})${gt==='spiral'?`, pitch ${fx(G.pitch,0)} mm`:''}${gt==='blind'?`, ${fx(G.len,0)} mm long`:''}</dd>`:gr?`<dt>Typical grooves (manual)</dt><dd>${gr[1]} × ${gr[2]} wide × ${gr[3]} deep mm, about ${gr[4]} l/min</dd>`:''}
    ${Number.isFinite(tx)?`<dt>Free-standing ID at ${tx} °C</dt><dd>${fx(t20(ID,tx),2)} mm</dd>`:''}${Number.isFinite(tn)?`<dt>Free-standing ID at ${tn} °C</dt><dd>${fx(t20(ID,tn),2)} mm</dd>`:''}</dl></div>
    <div class="card"><h2>Loading</h2><div class="res"><div><b>${fx(Pe)}</b><span>MPa pressure</span></div><div><b>${fx(V,1)}</b><span>m/min speed</span></div><div><b>${fx(PV,1)}</b><span>MPa·m/min PV</span></div></div>${Number.isFinite(P)?'':'<p class="mut" style="margin-top:8px">Enter the supported mass to calculate pressure and PV.</p>'}</div>
    <div class="card"><h2>Checks</h2>${ck.map(([k,t])=>`<p class="note ${k}">${k==='ok'?'✓':'⚠'} ${esc(t)}</p>`).join('')}</div>
    <div class="card"><h2>Size to cut at machining temperature</h2><p class="mut">Dimensions above are for a bearing at 20 °C. If you machine it warmer or cooler, cut to these sizes (mm).</p><div style="overflow-x:auto"><table class="tbl"><tr><th>Bearing temp</th><th>OD</th><th>ID</th><th>Wall</th></tr>${rows}</table></div></div>
    <div class="card"><h2>How this is calculated</h2><p class="mut">Press fit = 0.05 + 0.002 × housing Ø. Bore closure = press fit × shaft Ø ÷ housing Ø. Assembly clearance = 0.05 + 0.02 × wall. OD = housing Ø + press fit. ID = shaft Ø + bore closure + assembly clearance. Wall = ½ (OD − ID), solved together with the clearance. Pressure = mass × 9.81 ÷ bearings ÷ (shaft Ø × length), divided by the share of bore left after grooving. Rotation speed = π × shaft Ø × rpm ÷ 1000; oscillation and linear speeds count each stroke out and back (an assumption). PV = pressure × speed. Thermal change uses 6 × 10⁻⁵ per °C. Tolerances are the standard machining tolerances. Groove width and depth come from the manual's groove table; groove radius is the round bottom of the groove; the groove area share is an estimate. Blind radial grooves are modelled as closed-ended slots cut into the bore. Source: Vesconite Pump Bearing Design Manual. Press-fit force and expansion gap are not included.</p></div>
    <button class="btn wide" id="dc" type="button">Copy results</button>`;
    $('#dc').onclick=()=>navigator.clipboard.writeText([`Industrial bearing (${GRADES[gk][0]})`,`Housing ${H} mm, shaft ${D} mm, length ${L} mm, ${pf?'press fit':'no press fit'}${fl0?`, flange Ø${fl.FD} x ${fl.T}`:''}`,`OD ${fx(OD)} mm, ID ${fx(ID)} mm, wall ${fx(w)} mm`,`Press fit ${fx(press,3)} mm, bore closure ${fx(clo,3)} mm, assembly clearance ${fx(c,3)} mm`,gOK&&gt!=='none'?`Grooves: ${GTYPES[gt]}, ${G.n} x depth ${G.d}, radius ${G.r}`:'No grooves',`P ${fx(Pe)} MPa, V ${fx(V,1)} m/min, PV ${fx(PV,1)} MPa·m/min`,...ck.map(([k,t])=>(k==='ok'?'OK: ':'CHECK: ')+t)].join('\n')).then(()=>alert('Results copied.'));
  };
  $$('#DF input').forEach(i=>i.addEventListener('input',cv));$$('#DF select').forEach(i=>{i.addEventListener('input',cv);i.addEventListener('change',cv)});cv();
}

/* ---------- QuickDraw: type the sizes, get a full drawing and PDF. Every field is editable. ---------- */
const nz=x=>Number.isFinite(x)&&x>0?x:0;
const tolStr=(p,m)=>{p=nz(p);m=nz(m);return !p&&!m?'':p===m?`±${fx(p,3)}`:`+${fx(p,3)}/−${fx(m,3)}`};
const QNOTES='1. ALL DIMENSIONS IN mm UNLESS STATED OTHERWISE.\n2. TOLERANCES AS SHOWN ON THE DIMENSIONS.\n3. REMOVE BURRS AND BREAK SHARP EDGES.';
function quickdraw(v){
  T3=null;LAST=null;let edited=false;
  const num=(id,l,u='',val='')=>`<label>${l} <span class="mut">${u}</span><input id="${id}" type="number" inputmode="decimal" step="any" value="${val}"></label>`;
  const txt=(id,l,val='',ph='')=>`<label>${l}<input id="${id}" value="${esc(val)}" placeholder="${esc(ph)}"></label>`;
  const today=new Date().toLocaleDateString(),dw=S.dw;
  v.innerHTML=`<a class="back" href="#/tools">← Tools</a><h1>QuickDraw</h1><p class="mut">Type the sizes and get a full engineering drawing you can export to PDF. Every field below can be edited, including the dimension text, data table and notes.</p>
  <form class="card" id="QF">
  <h2>Part</h2><div class="g2">${txt('qName','Part name / title','BEARING BUSH')}${txt('qMat','Material / grade','VESCONITE')}${txt('qDrg','Drawing number','','Auto')}${txt('qRev','Revision',dw.rev)}${txt('qCo','Company (when no logo)',dw.company)}${txt('qWho','Drawn by',(ME?.email||'').split('@')[0])}${txt('qDate','Date',today)}
  <label>Paper size<select id="qPaper"><option value="a3">A3</option><option value="a4" ${dw.paper==='a4'?'selected':''}>A4</option></select></label>
  <label>Scale<select id="qScale"><option value="0">Auto</option><option value="5">5:1</option><option value="2">2:1</option><option value="1">1:1</option><option value="0.5">1:2</option><option value="0.2">1:5</option><option value="0.1">1:10</option><option value="0.05">1:20</option></select></label></div>
  <h2>Sizes <span class="mut" style="font:400 14px var(--f2)">mm, with tolerances</span></h2>
  <div class="g2">${num('qOD','Outside diameter (OD)')}<div class="g2" style="grid-column:1/-1;margin-top:-6px">${num('qODp','OD tolerance +')}${num('qODm','OD tolerance −')}</div>
  ${num('qID','Inside diameter (ID)')}<div class="g2" style="grid-column:1/-1;margin-top:-6px">${num('qIDp','ID tolerance +')}${num('qIDm','ID tolerance −')}</div>
  ${num('qL','Length (overall)')}<div class="g2" style="grid-column:1/-1;margin-top:-6px">${num('qLp','Length tolerance +')}${num('qLm','Length tolerance −')}</div></div>
  <div class="acts" style="margin-top:0"><button type="button" class="btn" id="qstd">Fill standard Vesconite tolerances</button></div>
  <label>Shape<select id="qFl"><option value="n">Straight</option><option value="y">Flanged</option></select></label>
  <div data-qf hidden><div class="g2">${num('qFD','Flange OD')}${num('qT','Flange length (thickness)')}${num('qFDp','Flange OD tolerance +')}${num('qFDm','Flange OD tolerance −')}${num('qTp','Flange length tolerance +')}${num('qTm','Flange length tolerance −')}</div></div>
  <div class="g2">${num('qCh','OD chamfer size (0 = none)')}</div>
  <h2>Grooves <span class="mut" style="font:400 14px var(--f2)">optional</span></h2>
  <label>Groove type<select id="qG"><option value="none">None</option><option value="spiral">Spiral</option><option value="blind">Blind radial</option><option value="long">Longitudinal</option></select></label>
  <div data-qg hidden><div class="g2">${num('qGn','Number of grooves')}${num('qGd','Groove depth','mm')}${num('qGr','Groove radius','mm')}<div data-qgt="spiral" hidden>${num('qGp','Spiral pitch','mm')}</div><div data-qgt="blind" hidden>${num('qGl','Groove length','mm')}</div></div>
  <div class="acts" style="margin-top:0"><button type="button" class="btn" id="qrec">Suggest from the manual's table</button></div></div>
  <details class="card" style="margin:14px 0"><summary class="btn">Edit dimension text</summary><p class="mut" style="margin:10px 0">Leave blank to use the text made from your sizes and tolerances.</p><div class="g2">${txt('qlOD','OD text')}${txt('qlID','ID text')}${txt('qlL','Length text')}${txt('qlFD','Flange OD text')}${txt('qlT','Flange length text')}${txt('qlW','Wall text')}${txt('qlCh','Chamfer note')}</div></details>
  <h2>Data table</h2><p class="mut" style="margin:0 0 6px">One row per line as LABEL | VALUE. It updates from your sizes until you edit it.</p><textarea id="qTab" rows="7"></textarea>
  <div class="acts" style="margin-top:6px"><button type="button" class="btn" id="qtr">Reset table</button></div>
  <h2>Notes</h2><textarea id="qNotes" rows="5">${esc(QNOTES)}</textarea>
  <div style="margin-top:8px"><label class="ck"><input type="checkbox" id="qLg" ${dw.showLogo?'checked':''}>Show logo</label><label class="ck"><input type="checkbox" id="qSt" checked>Show data table</label><label class="ck"><input type="checkbox" id="qSn" checked>Show notes</label></div>
  </form><div id="QM"></div>
  <div class="card" id="QP" hidden><div class="mdr" id="QV"></div><div class="acts"><button type="button" class="btn pri" id="qx">Expand to drawing</button><button type="button" class="btn" id="qp">Make PDF</button><button type="button" class="btn" id="qs">SVG</button><button type="button" class="btn" id="qstp">STEP file</button></div><p class="mut" style="margin:0">Make PDF, wait for it to change to Open PDF, then tap again to open or save it. </p><p class="mut" id="qsn" style="margin:6px 0 0"></p></div>`;
  const gv=id=>$('#'+id).value,gn=id=>parseFloat(gv(id));
  let lastQ='none',autoQ=false;
  const gen=()=>{
    const fl0=gv('qFl')==='y',gt=gv('qG');
    $$('[data-qf]').forEach(x=>x.hidden=!fl0);$$('[data-qg]').forEach(x=>x.hidden=gt==='none');$$('[data-qgt]').forEach(x=>x.hidden=x.dataset.qgt!==gt);
    const OD=gn('qOD'),ID=gn('qID'),L=gn('qL'),M=$('#QM'),P=$('#QP'),stop=m=>{P.hidden=true;M.innerHTML=m};
    if(!(OD>0&&ID>0&&L>0))return stop('<p class="mut">Enter the outside diameter, inside diameter and length to see the drawing.</p>');
    if(OD<=ID)return stop('<p class="note bad">The outside diameter must be larger than the inside diameter.</p>');
    const w=(OD-ID)/2,fl={on:fl0,FD:gn('qFD'),T:gn('qT')};
    if(gt!==lastQ){lastQ=gt;autoQ=false}
    if(gt!=='none'&&!autoQ){const rc=recGroove(gt,ID,w,L);if(rc){autoQ=true;let ch=false;const set=(id,x)=>{if(!(+$('#'+id).value>0)&&x!=null){$('#'+id).value=x;ch=true}};set('qGn',rc.n);set('qGd',rc.d);set('qGr',rc.r);if(gt==='spiral')set('qGp',rc.pitch);if(gt==='blind')set('qGl',rc.len);if(ch)return gen()}}
    if(fl0&&!(fl.FD>OD&&fl.T>0&&fl.T<L))return stop('<p class="note bad">For a flanged part, enter a flange OD larger than the OD and a flange length shorter than the overall length.</p>');
    const G={type:gt,n:gn('qGn'),d:gn('qGd'),r:gn('qGr'),pitch:gn('qGp'),len:gn('qGl')},gOK=gt==='none'||(G.n>0&&G.d>0&&G.r>0&&(gt!=='spiral'||G.pitch>0)&&(gt!=='blind'||G.len>0)),Gu=gOK?G:{type:'none'};
    const ch=nz(gn('qCh')),warn=[];
    if(gt!=='none'&&!gOK)warn.push('Enter the groove number, depth and radius (and pitch or length) to draw the grooves.');
    if(gOK&&gt!=='none'&&G.d>=w/2)warn.push(`Groove depth ${fx(G.d)} mm is half the wall (${fx(w)} mm) or more.`);
    if(ch>0&&ch>=w)warn.push('The chamfer is as large as the wall thickness.');
    M.innerHTML=warn.map(t=>`<p class="note warn">⚠ ${esc(t)}</p>`).join('');
    const tx=(base,p,m,pre='')=>`${pre}${fx(base)}${tolStr(p,m)?' '+tolStr(p,m):''}`;
    const lab={OD:gv('qlOD').trim()||tx(OD,gn('qODp'),gn('qODm'),'Ø'),ID:gv('qlID').trim()||tx(ID,gn('qIDp'),gn('qIDm'),'Ø'),L:gv('qlL').trim()||tx(L,gn('qLp'),gn('qLm')),W:gv('qlW').trim()||`(${fx(w)})`,FD:gv('qlFD').trim()||tx(fl.FD,gn('qFDp'),gn('qFDm'),'Ø'),T:gv('qlT').trim()||tx(fl.T,gn('qTp'),gn('qTm'))};
    const auto=[['OUTSIDE Ø',lab.OD.replace(/^Ø/,'')],['INSIDE Ø',lab.ID.replace(/^Ø/,'')],['LENGTH',lab.L],['WALL (REF)',fx(w)]];
    if(fl0)auto.push(['FLANGE Ø',lab.FD.replace(/^Ø/,'')],['FLANGE LENGTH',lab.T]);
    if(ch>0)auto.push(['OD CHAMFER',fx(ch,2)]);
    if(Gu.type!=='none'){auto.push(['GROOVE TYPE',GTYPES[gt]],['GROOVE QTY',String(G.n)],['GROOVE DEPTH',fx(G.d)],['GROOVE RADIUS',fx(G.r)],['GROOVE WIDTH',fx(grooveWidth(G.d,G.r))]);if(gt==='spiral')auto.push(['SPIRAL PITCH',fx(G.pitch)]);if(gt==='blind')auto.push(['GROOVE LENGTH',fx(G.len)])}
    if(!edited)$('#qTab').value=auto.map(r=>r.join(' | ')).join('\n');
    const table=gv('qTab').split('\n').map(l=>l.trim()).filter(Boolean).slice(0,20).map(l=>{const k=l.indexOf('|');return k<0?[l,'']:[l.slice(0,k).trim(),l.slice(k+1).trim()]});
    const name=gv('qName').trim()||'BEARING BUSH',mat=gv('qMat').trim()||'—',date=gv('qDate'),
      drg=gv('qDrg').trim()||`QD-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${Math.round(OD)}-${Math.round(ID)}-${Math.round(L)}`,
      dwq={...S.dw,company:gv('qCo'),rev:gv('qRev'),paper:gv('qPaper'),showLogo:$('#qLg').checked,fit:$('#qSt').checked,notes:$('#qSn').checked,noteText:gv('qNotes')},
      logo=S.dw.logo?{u:S.dw.logo,r:S.dw.logoR||1}:window.__rl||null;
    LAST={drg,paper:gv('qPaper'),step:{name:name.replace(/\s+/g,'-'),OD,ID,L,ch,fl,G:Gu,gz:grooveFn(Gu,ID/2)},svg:drawSVG({OD,ID,L,ch,w,g:'v',pf:true,drg,G:Gu,fl,dw:dwq,logo,gz:grooveFn(Gu,ID/2),date,who:gv('qWho'),q:{lab,table,title:name+(fl0?' (FLANGED)':''),material:mat,scale:parseFloat(gv('qScale'))||0,chText:gv('qlCh').trim()||(ch>0?`${fx(ch,2)} × 45° CHAMFER`:'')}})};
    $('#QV').innerHTML=LAST.svg;P.hidden=false;$('#qsn').textContent='STEP file contains: the bush body'+(fl0?', flange':'')+(ch>0?', chamfer':'')+(Gu.type!=='none'?`, and ${G.n} ${GTYPES[gt].toLowerCase()} groove${G.n>1?'s':''} (depth ${fx(G.d)}, radius R${fx(G.r)}).`:'. No grooves are set.');const pb=$('#qp');pb._b=null;pb.textContent='Make PDF';
  };
  if(!S.dw.logo&&!window.__rl)repoLogo().then(r=>{if(r){window.__rl=r;gen()}});
  $('#QF').onsubmit=e=>e.preventDefault();
  $('#qTab').addEventListener('input',e=>{if(e.isTrusted)edited=true});
  $('#qtr').onclick=()=>{edited=false;gen()};
  $('#qstd').onclick=()=>{const OD=gn('qOD'),ID=gn('qID'),L=gn('qL'),set=(id,x)=>{$('#'+id).value=x?+x.toFixed(3):''};if(OD>0){set('qODp',tol(OD,.1,.025));set('qODm',tol(OD,.1,.025))}if(ID>0){set('qIDp',tol(ID,.1,.025));set('qIDm',tol(ID,.1,.025))}if(L>0){set('qLp',0);set('qLm',tol(L,.5,.3))}gen()};
  $('#qrec').onclick=()=>{const ID=gn('qID'),OD=gn('qOD'),L=gn('qL'),gt=gv('qG'),rc=ID>0&&OD>ID?recGroove(gt,ID,(OD-ID)/2,L):null;if(!rc){alert('Enter the OD, ID and length first. The manual\'s groove table covers shaft diameters of 20–200 mm.');return}const set=(id,x)=>{$('#'+id).value=x!=null?x:''};set('qGn',rc.n);set('qGd',rc.d);set('qGr',rc.r);if(gt==='spiral')set('qGp',rc.pitch);if(gt==='blind')set('qGl',rc.len);gen()};
  $('#qx').onclick=openDrawing;$('#qp').onclick=e=>pdfStep(e.currentTarget);$('#qs').onclick=()=>deliver(svgBlob(),LAST.drg+'.svg');$('#qstp').onclick=stepDownload;
  $$('#QF input,#QF select,#QF textarea').forEach(i=>{i.addEventListener('input',gen);i.addEventListener('change',gen)});gen();
}

/* ---------- Admin ---------- */
const PRE=[['Steel & amber','#0f3f4a','#c9861a'],['Forest','#1d4a33','#d29a2c'],['Ocean','#0e3b66','#18a0b8'],['Graphite','#23282c','#e0592a'],['Crimson','#6e1423','#c98a1a'],['Violet','#3b2a6b','#e0a63a']];
async function admin(v){
  if(!can('del')){location.hash='#/';return}
  const s=S,dw=s.dw;let dwLogo={u:dw.logo,r:dw.logoR};
  v.innerHTML=`<a class="back" href="#/tools">← Tools</a><h1>Admin</h1><section class="card" id="NT"><h2>Notifications</h2><p class="mut">Loading…</p></section><form id="AF">
  <section class="card"><h2>App appearance</h2><div class="acts">${PRE.map((p,i)=>`<button type="button" class="btn" data-p="${i}" style="border-left:8px solid ${p[2]}">${p[0]}</button>`).join('')}</div>
  <div class="g2"><label>Main colour<input type="color" name="pri" value="${s.pri}"></label><label>Accent colour<input type="color" name="amb" value="${s.amb}"></label>
  <label>Corners${sel('r',[[3,'Sharp'],[10,'Soft'],[18,'Round']],s.r)}</label><label>Heading font${sel('font',[['cond','Condensed'],['std','Standard'],['serif','Serif']],s.font)}</label>
  <label>Default mode${sel('mode',[['auto','Follow device'],['light','Light'],['dark','Dark']],s.mode)}</label></div><p class="mut">Changes preview live. Press Save to keep them for everyone.</p></section>
  <section class="card"><h2>Documents (PDF)</h2><div class="g2"><label>Company name<input name="company" value="${esc(s.company)}"></label><label>Footer text<input name="footer" value="${esc(s.footer)}" placeholder="Same as company"></label>
  <label>Cover style${sel('cover',[['dark','Dark'],['light','Light'],['accent','Accent colour']],s.cover)}</label><label>Document accent<input type="color" name="pdfAcc" value="${s.pdfAcc}"></label>
  <label>Photos per application${sel('pp',[[0,'None'],[1,'1'],[2,'2'],[3,'3']],s.pp)}</label></div>
  ${ckb('logo',s.logo,'Show logo on documents')}<p class="mut" style="margin:8px 0 4px">Sections to include</p>${SECS.map(k=>ckb('secs',s.secs.includes(k),k,k)).join('')}</section>
  <section class="card"><h2>Drawing template</h2>
  <div class="acts"><label class="btn">Upload logo<input type="file" accept="image/*" hidden id="lgf"></label><button type="button" class="btn" id="lgx">Remove logo</button></div><div id="lgp" class="mut" style="margin-bottom:12px"></div>
  <div class="g2"><label>Company name (when no logo)<input name="dw_company" value="${esc(dw.company)}"></label><label>Drawing title<input name="dw_title" value="${esc(dw.title)}"></label>
  <label>Drawing number prefix<input name="dw_prefix" value="${esc(dw.prefix)}"></label><label>Revision<input name="dw_rev" value="${esc(dw.rev)}"></label>
  <label>Paper size for PDF${sel('dw_paper',[['a3','A3'],['a4','A4']],dw.paper)}</label><label>Drawn by${sel('dw_who',[['auto','Signed-in user'],['custom','Custom text']],dw.who)}</label>
  <label>Custom drawn-by text<input name="dw_whoText" value="${esc(dw.whoText)}"></label></div>
  ${ckb('dw_showLogo',dw.showLogo,'Show logo in the title block')}${ckb('dw_fit',dw.fit,'Show the fit and feature table')}${ckb('dw_notes',dw.notes,'Show notes')}
  <label style="margin-top:10px">Drawing notes, one per line. {FIT} inserts the securing note.<textarea name="dw_noteText" rows="8">${esc(dw.noteText)}</textarea></label></section>
  <section class="card"><h2>Data sheets</h2><p class="mut">Tab colour and transparency for each material, and the PDF stored in Firebase for it. Colours save with Save settings. PDFs store straight away.</p>
  ${DSH.map(d=>{const c=(S.dsc&&S.dsc[d.id])||{c:'#8a8d91',a:.3};return `<div class="dsr"><div class="dsn" id="dsn_${d.id}" style="${tabStyle(d.id)}">${esc(d.name)}</div><div class="g2" style="margin-top:8px"><label>Colour<input type="color" name="dsc_${d.id}" value="${c.c}"></label><label>Opacity <span class="mut">${Math.round(c.a*100)}%</span><input type="range" name="dsa_${d.id}" min="0" max="100" value="${Math.round(c.a*100)}"></label></div><div class="dsf"><span class="mut" id="dss_${d.id}">checking…</span><label class="btn">Replace PDF<input type="file" accept="application/pdf" hidden data-dsu="${d.id}"></label></div></div>`}).join('')}
  <div class="acts"><button type="button" class="btn" id="dsb">Store the included PDFs in Firebase</button></div></section>
  <section class="card"><h2>Features</h2>${ckb('oem',s.feat.oem,'OEM references')}${ckb('ins',s.feat.ins,'Insights page')}${ckb('qr',s.feat.qr,'Share links and QR codes')}${ckb('pv',s.feat.pv,'Design calculators')}</section>
  <section class="card"><h2>Industries</h2><p class="mut">One per line. Used as suggestions when capturing and adding OEM references.</p><textarea name="ind" rows="8">${esc(s.ind)}</textarea></section>
  <button class="btn pri wide">Save settings</button></form>
  <section class="card"><h2>Team</h2><p class="mut">New sign-ups start as Pending and cannot see anything until you set a role. Viewer reads, Editor adds and edits, Admin manages everything.</p><div id="tm"><p class="mut">Loading…</p></div></section>
  <section class="card"><h2>Activity log</h2><p class="mut">Only admins can see this. Newest first.</p><input id="alf" type="search" placeholder="Filter by person or action"><div class="lg" id="ALL"><p class="mut">Loading…</p></div><div class="acts"><button type="button" class="btn" id="alm">Load more</button><button type="button" class="btn bad" id="alc">Clear log</button></div></section>
  <section class="card"><h2>Data</h2><p class="mut">Back up before big changes. Backups from the earlier version import too.</p><div class="acts"><button class="btn" id="ex">Export backup</button><label class="btn">Import backup<input type="file" accept=".json,application/json" hidden id="im"></label><button class="btn bad" id="ca">Delete everything</button></div><h3 style="margin-top:14px">Sample data</h3><p class="mut">Adds 10 example applications with photos and every field filled in, to try the app. They are marked as samples and can be removed in one tap.</p><div class="acts"><button type="button" class="btn" id="sl">Load 10 sample applications</button><button type="button" class="btn bad" id="sr">Remove sample applications</button></div></section>`;
  const read=()=>{const f=new FormData($('#AF'));return{...S,pri:f.get('pri'),amb:f.get('amb'),r:+f.get('r'),font:f.get('font'),mode:f.get('mode'),company:f.get('company').trim()||'Vesconite',footer:f.get('footer').trim(),pdfAcc:f.get('pdfAcc'),cover:f.get('cover'),logo:f.has('logo'),pp:+f.get('pp'),secs:f.getAll('secs'),feat:{oem:f.has('oem'),ins:f.has('ins'),qr:f.has('qr'),pv:f.has('pv')},ind:f.get('ind'),dw:{...S.dw,logo:dwLogo.u||'',logoR:dwLogo.r||1,company:f.get('dw_company').trim(),title:f.get('dw_title').trim(),prefix:f.get('dw_prefix').trim(),rev:f.get('dw_rev').trim(),paper:f.get('dw_paper'),who:f.get('dw_who'),whoText:f.get('dw_whoText').trim(),showLogo:f.has('dw_showLogo'),fit:f.has('dw_fit'),notes:f.has('dw_notes'),noteText:f.get('dw_noteText')},dsc:Object.fromEntries(DSH.map(d=>[d.id,{c:f.get('dsc_'+d.id)||'#888888',a:(+f.get('dsa_'+d.id))/100}]))}};
  const lgShow=()=>{$('#lgp').innerHTML=dwLogo.u?`<img src="${dwLogo.u}" alt="" style="max-height:48px;background:#fff;padding:4px;border-radius:6px;vertical-align:middle"> Uploaded logo is used on drawings and documents.`:'No uploaded logo. The logo file in your repo is used instead.'};lgShow();
  $('#lgf').onchange=async e=>{const f=e.target.files[0];if(!f)return;try{const u=URL.createObjectURL(f),im=await img(u);URL.revokeObjectURL(u);let m=500,out;do{const k=Math.min(1,m/Math.max(im.width,im.height)),cv=document.createElement('canvas');cv.width=Math.round(im.width*k);cv.height=Math.round(im.height*k);cv.getContext('2d').drawImage(im,0,0,cv.width,cv.height);out={u:cv.toDataURL('image/png'),r:cv.width/cv.height};m-=140}while(out.u.length>450000&&m>100);dwLogo=out;lgShow()}catch{alert('That image could not be read.')}e.target.value=''};
  $('#lgx').onclick=()=>{dwLogo={u:'',r:1};lgShow()};
  $('#AF').addEventListener('input',()=>apply(read()));
  $$('[data-p]').forEach(b=>b.onclick=()=>{const p=PRE[+b.dataset.p];$('[name=pri]').value=p[1];$('[name=amb]').value=p[2];$('[name=pdfAcc]').value=p[2];apply(read())});
  $('#AF').onsubmit=async e=>{e.preventDefault();try{const n=read();await setDoc(dc('settings','app'),clean(n));log('Changed settings');S=n;try{localStorage.setItem('vi4s',JSON.stringify(S))}catch{}apply(S);alert('Settings saved for everyone.')}catch(x){alert('Could not save: '+x.message)}};
  const loadTeam=()=>getDocs(col('members')).then(q=>{$('#tm').innerHTML=q.docs.map(d=>{const m=d.data();return `<label class="ck"><span class="em">${esc(m.email)}</span><select data-u="${d.id}" data-e="${esc(m.email)}" data-r="${m.role}" ${d.id===ME.uid?'disabled':''}>${['pending','viewer','editor','admin'].map(r=>`<option ${r===m.role?'selected':''}>${r}</option>`).join('')}</select>${d.id===ME.uid?'':`<button type="button" class="btn bad" data-rm="${d.id}" data-e="${esc(m.email)}" style="min-height:34px;padding:0 10px;margin-left:8px">Remove</button>`}</label>`}).join('');$$('#tm [data-rm]').forEach(b=>b.onclick=async()=>{if(!confirm(`Remove ${b.dataset.e}? They lose access to the app. To delete their sign-in completely, also remove them in Firebase > Authentication > Users.`))return;try{await deleteDoc(dc('members',b.dataset.rm));log('Removed user',b.dataset.e);loadTeam();notifCheck()}catch(x){alert(x.message)}});$$('#tm select').forEach(s=>s.onchange=async()=>{try{await updateDoc(dc('members',s.dataset.u),{role:s.value});log('Changed role',s.dataset.e,`${s.dataset.r} → ${s.value}`);s.dataset.r=s.value}catch(x){alert(x.message)}})}).catch(x=>{$('#tm').textContent=x.message});loadTeam();
  let ACT=[],lim=100;const prevSeen=localStorage.getItem('vi4seen')||'';
  const fmt=t=>{const d=new Date(t);return d.toLocaleDateString()+' '+d.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})};
  const drawAct=()=>{const f=$('#alf').value.toLowerCase(),l=ACT.filter(x=>!f||[x.email,x.action,x.target,x.detail].join(' ').toLowerCase().includes(f));
    $('#ALL').innerHTML=l.length?l.map(x=>`<div class="lr${x.t>prevSeen&&x.uid!==ME.uid?' nw':''}"><b>${esc(x.action)}${x.target?': '+esc(x.target):''}</b><small>${esc((x.email||'').split('@')[0])} · ${fmt(x.t)}${x.detail?' · '+esc(x.detail):''}</small></div>`).join(''):'<p class="empty">No activity yet.</p>'};
  const loadAct=async()=>{try{const q=await getDocs(query(col('activity'),orderBy('t','desc'),limit(lim)));ACT=q.docs.map(d=>({id:d.id,...d.data()}));drawAct();return true}catch(x){$('#ALL').innerHTML=`<p class="note bad">Could not load the log: ${esc(x.message)} Publish the latest firestore.rules in Firebase.</p>`;return false}};
  const drawNotif=async()=>{try{const m=await getDocs(col('members')),pend=m.docs.filter(d=>d.data().role==='pending'),nw=ACT.filter(x=>x.t>prevSeen&&x.uid!==ME.uid).length;
    $('#NT').innerHTML=`<h2>Notifications</h2>${pend.length?pend.map(d=>`<div class="nrow"><span><b>${esc(d.data().email)}</b><small class="mut" style="display:block">is waiting for access</small></span><button type="button" class="btn" data-ap="${d.id}:viewer">Viewer</button><button type="button" class="btn" data-ap="${d.id}:editor">Editor</button></div>`).join(''):'<p class="mut">Nobody is waiting for access.</p>'}<p style="margin:12px 0 0">${nw?`<b>${nw}</b> change${nw>1?'s':''} by other people since your last visit, highlighted in the log below.`:'No new changes by other people since your last visit.'}</p>`;
    $$('[data-ap]').forEach(b=>b.onclick=async()=>{const[u,r]=b.dataset.ap.split(':');try{await updateDoc(dc('members',u),{role:r});log('Approved user',pend.find(x=>x.id===u).data().email,r);drawNotif();loadTeam();notifCheck();setTimeout(loadAct,500)}catch(x){alert(x.message)}})}catch(x){$('#NT').innerHTML=`<h2>Notifications</h2><p class="note bad">${esc(x.message)}</p>`}};
  $('#alf').oninput=drawAct;$('#alm').onclick=()=>{lim+=100;loadAct()};
  $('#alc').onclick=async()=>{if(ACT.length&&confirm(`Delete the ${ACT.length} activity entries shown?`)){try{await Promise.all(ACT.map(x=>deleteDoc(dc('activity',x.id))));await loadAct();drawNotif()}catch(x){alert(x.message)}}};
  loadAct().then(()=>{drawNotif();localStorage.setItem('vi4seen',new Date().toISOString());notifCheck()});
  $('#AF').addEventListener('input',()=>{const n=read(),sv=S.dsc;S.dsc=n.dsc;DSH.forEach(d=>{const el=$('#dsn_'+d.id);if(el){el.style.cssText=tabStyle(d.id);const l=el.parentNode.querySelector('input[type=range]');if(l)l.previousElementSibling.textContent=Math.round(n.dsc[d.id].a*100)+'%'}});S.dsc=sv});
  const loadDs=async()=>{let m={};try{const q=await getDocs(col('datasheets'));q.docs.forEach(x=>m[x.id]=x.data());DSH.forEach(d=>{const el=$('#dss_'+d.id);if(el)el.textContent=m[d.id]?`PDF stored (${Math.round((m[d.id].size||0)/1024)} KB)`:'No PDF stored yet'})}catch(x){DSH.forEach(d=>{const el=$('#dss_'+d.id);if(el)el.textContent='Could not read: '+x.message})}return m};
  const putDs=async(id,dataUrl,size)=>{const old=await getDoc(dc('datasheets',id)),ref=await putFile(dataUrl);await setDoc(dc('datasheets',id),{name:DSH.find(d=>d.id===id).name,file:ref,size,date:new Date().toISOString()});if(old.exists())await delFile(old.data().file)};
  $$('[data-dsu]').forEach(i=>i.onchange=async e=>{const f=e.target.files[0];if(!f)return;if(f.size>3e6){alert('That PDF is over 3 MB.');return}const id=i.dataset.dsu;try{await putDs(id,await rd(f),f.size);log('Stored data sheet PDF',DSH.find(d=>d.id===id).name);await loadDs()}catch(x){alert('Could not store the PDF: '+x.message)}e.target.value=''});
  $('#dsb').onclick=async e=>{const b=e.currentTarget;b.disabled=true;try{const r=await fetch('datasheets.json');if(!r.ok)throw new Error('datasheets.json was not found. Upload it next to index.html in your repo.');const J=await r.json(),tot=Object.keys(J).length;let n=0;for(const d of DSH){if(!J[d.id])continue;b.textContent=`Storing ${++n} of ${tot}…`;await putDs(d.id,'data:application/pdf;base64,'+J[d.id],Math.round(J[d.id].length*3/4))}log('Stored data sheet PDFs','',`${n} files`);alert(`Stored ${n} data sheet PDFs in Firebase.`);await loadDs()}catch(x){alert(x.message)}b.disabled=false;b.textContent='Store the included PDFs in Firebase'};
  loadDs();
  $('#ex').onclick=async e=>{e.target.textContent='Preparing…';try{const apps=[];for(const a of A){const{thumb,...r}=a;r.photos=await Promise.all(a.photos.map(getFile));apps.push(r)}const u=URL.createObjectURL(new Blob([JSON.stringify({v:4,apps})],{type:'application/json'})),l=document.createElement('a');l.href=u;l.download=`vi-backup-${new Date().toISOString().slice(0,10)}.json`;l.click();log('Exported backup');setTimeout(()=>URL.revokeObjectURL(u),1000)}catch(x){alert(x.message)}e.target.textContent='Export backup'};
  $('#im').onchange=async e=>{try{const j=JSON.parse(await e.target.files[0].text()),L=(Array.isArray(j)?j:j.apps).filter(r=>r&&r.name);let n=0;for(const r of L){const x=norm(r),items=x.src.map(src=>({src}));delete x.src;await commit(x,items);n++}log('Imported backup','',`${n} records`);alert(`Imported ${n} records.`);render()}catch(x){alert('That file is not a valid backup.')}};
  $('#sl').onclick=async e=>{const b=e.currentTarget;b.disabled=true;try{const r=await fetch('samples.json');if(!r.ok)throw new Error('samples.json was not found. Upload it next to index.html in your repo.');const Ls=await r.json();let n=0;
    for(const x of Ls){b.textContent=`Loading ${++n} of ${Ls.length}…`;const{photos,...f}=x;await commit({...f,id:crypto.randomUUID(),date:new Date(Date.now()-n*86400000).toISOString(),sample:true,photos:[]},photos.map(src=>({src})))}
    log('Loaded sample applications','',`${Ls.length} records`);alert(`Added ${Ls.length} sample applications.`);render()}catch(x){alert(x.message)}b.disabled=false;b.textContent='Load 10 sample applications'};
  $('#sr').onclick=async()=>{const ss=A.filter(a=>a.sample);if(!ss.length)return alert('There are no sample applications.');if(!confirm(`Remove the ${ss.length} sample applications?`))return;try{for(const a of ss)await remove(a);log('Removed sample applications');render()}catch(x){alert(x.message)}};
  $('#ca').onclick=async()=>{if(confirm(`Delete all ${A.length} applications and ${O.length} OEM references? Export a backup first.`)&&confirm('This cannot be undone. Delete everything?')){try{for(const a of A)await remove(a);for(const o of O){await delFile(o.pdf);await deleteDoc(dc('oem',o.id))}log('Deleted all data');await load();render()}catch(x){alert(x.message)}}};
}

/* ---------- Router ---------- */
function render(){
  const[p='',id]=location.hash.slice(2).split('/'),v=$('#v');
  if(!ready&&p!=='share')return;
  apply(S);document.body.classList.toggle('bare',p==='share'||!ME||ROLE==='pending');
  $('#ad').hidden=!(ME&&can('del'));
  if(p==='share')return share(v,id);
  if(!ME)return login(v);
  if(!['admin','editor','viewer'].includes(ROLE))return pending(v);
  const ed=can('edit'),m={'':home,library,new:ed?form:home,edit:ed?form:home,app:detail,insights:S.feat.ins?insights:home,oem:S.feat.oem?oem:home,tools,design:S.feat.pv?design:home,quickdraw:S.feat.pv?quickdraw:home,datasheets,datasheet,portfolio,admin};
  (m[p]||home)(v,id);
  $$('.tabs a').forEach(a=>a.classList.toggle('on',a.getAttribute('href')==='#/'+(p==='app'||p==='edit'?'library':p==='design'||p==='quickdraw'||p==='datasheets'||p==='datasheet'||p==='portfolio'?'tools':p)));
  $('.tabs .add').hidden=!ed;scrollTo(0,0);
}
const soft=()=>{const p=location.hash.slice(2).split('/')[0];if(['','library','oem','insights'].includes(p))render()};
async function refresh(u){
  const[m0]=await Promise.all([getDoc(dc('members',u.uid)),load().catch(()=>0)]);let m=m0;
  if(!m.exists()){const rec={email:(u.email||'').toLowerCase()};try{await setDoc(dc('members',u.uid),{...rec,role:'admin'})}catch{await setDoc(dc('members',u.uid),{...rec,role:'pending'})}m=await getDoc(dc('members',u.uid));await load().catch(()=>0)}
  ROLE=m.data().role;if(!OKR.includes(ROLE)){A=[];O=[]}cacheSave();
}
async function boot(u){
  ME=u;
  if(!u){ROLE=null;A=[];O=[];try{localStorage.removeItem('vi4d')}catch{}ready=true;render();return}
  const c=cacheGet();
  if(c&&c.uid===u.uid&&OKR.includes(c.role)){ROLE=c.role;A=c.A||[];O=c.O||[];ready=true;render();notifCheck();refresh(u).then(()=>{soft();notifCheck()}).catch(()=>{});return}   /* show cached data instantly, refresh in the background */
  ROLE=null;await refresh(u);ready=true;render();notifCheck();
}
addEventListener('hashchange',render);
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&ME&&['admin','editor','viewer'].includes(ROLE))load().catch(()=>{})});
if(!C.firebase||/YOUR/.test(C.firebase.apiKey||'YOUR')){$('#v').innerHTML='<h1>Setup needed</h1><p class="lead">Paste your Firebase details into config.js, then reload.</p>'}
else{
  const app=initializeApp(C.firebase);au=getAuth(app);db=initializeFirestore(app,{experimentalAutoDetectLongPolling:true,ignoreUndefinedProperties:true});
  try{const c=JSON.parse(localStorage.getItem('vi4s')||'null');if(c)S=mergeS(c)}catch{}
  if(!t0&&S.mode!=='auto')setT(S.mode);apply(S);
  getDoc(dc('settings','app')).then(s=>{if(s.exists()){S=mergeS(s.data());try{localStorage.setItem('vi4s',JSON.stringify(S))}catch{}if(!t0&&S.mode!=='auto')setT(S.mode);apply(S);if(ready)soft()}}).catch(()=>{});
  onAuthStateChanged(au,u=>boot(u).catch(e=>{ready=true;$('#v').innerHTML=`<h1>Can't load data</h1><p class="mut">${esc(e.message)}</p><p class="mut">Check that the Firestore rules in firestore.rules are published.</p>`}));
}
/* ---------- Easter egg: a container ship sails up the page, propeller turning ---------- */
const SHIP_SVG=(()=>{
  const cols=['#c0392b','#2e86c1','#e0a21b','#27ae60','#8e44ad','#d35400','#16a085','#7f8c8d','#2c3e50','#e67e22'];let seed=7;const rnd=()=>(seed=(seed*9301+49297)%233280)/233280;
  let cn='';for(let r=0;r<8;r++)for(let c=0;c<4;c++){const x=20.5+c*10,y=118+r*12.4,f=cols[Math.floor(rnd()*cols.length)];cn+=`<rect x="${x}" y="${y}" width="9" height="11.4" fill="${f}" stroke="rgba(0,0,0,.35)" stroke-width=".4"/><line x1="${x+4.5}" y1="${y+1}" x2="${x+4.5}" y2="${y+10.4}" stroke="rgba(0,0,0,.22)" stroke-width=".4"/>`}
  for(let r=0;r<3;r++)for(let c=0;c<3;c++){const x=25.5+c*10,y=70+r*14,f=cols[Math.floor(rnd()*cols.length)];if(r===0&&c!==1)continue;cn+=`<rect x="${x}" y="${y}" width="9" height="13" fill="${f}" stroke="rgba(0,0,0,.35)" stroke-width=".4"/>`}
  const bl=[0,90,180,270].map(a=>`<ellipse cx="0" cy="-6.2" rx="3.1" ry="6.3" fill="#d4a24c" stroke="#7a5a1c" stroke-width=".5" transform="rotate(${a})"/>`).join('');
  return `<svg viewBox="0 0 80 340" xmlns="http://www.w3.org/2000/svg"><path class="wk" d="M30 284 C26 310 18 326 6 340 L74 340 C62 326 54 310 50 284Z" fill="rgba(255,255,255,.28)"/><path class="wk" d="M36 288 C34 312 30 326 24 340 L56 340 C50 326 46 312 44 288Z" fill="rgba(255,255,255,.35)"/>
<path d="M40 4C58 40 66 80 66 130V270Q66 282 58 284H22Q14 282 14 270V130C14 80 22 40 40 4Z" fill="#1f3a5f" stroke="#0e2036" stroke-width="1"/><path d="M40 13C54 46 60 84 60 134V268Q60 276 54 278H26Q20 276 20 268V134C20 84 26 46 40 13Z" fill="#9aa5b1"/>${cn}
<rect x="21" y="222" width="38" height="52" rx="2" fill="#eef1f4" stroke="#5b6672" stroke-width=".6"/><rect x="18" y="226" width="44" height="9" rx="1.5" fill="#fafbfc" stroke="#5b6672" stroke-width=".6"/><rect x="22" y="228" width="36" height="3.4" fill="#3b6ea5"/><ellipse cx="49" cy="258" rx="6" ry="7" fill="#c0392b" stroke="#6b1d14" stroke-width=".6"/><ellipse cx="49" cy="258" rx="3.6" ry="4.4" fill="#2a2a2a"/><rect x="25" y="246" width="12" height="22" fill="#cfd5db" stroke="#8a949e" stroke-width=".4"/>
<rect x="38" y="283" width="4" height="14" rx="1" fill="#14253a"/><g transform="translate(40 298)"><circle r="12" fill="rgba(255,255,255,.18)"/><g class="prop">${bl}<circle r="2.2" fill="#8a6a2a" stroke="#4a3810" stroke-width=".5"/></g></g></svg>`;
})();
function showShip(){
  if(document.getElementById('ship')||(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches))return;
  const d=document.createElement('div');d.id='ship';d.setAttribute('aria-hidden','true');
  d.innerHTML=`<div class="sea"></div><div class="waves"></div><div class="vessel"><div class="sway">${SHIP_SVG}</div></div>`;
  document.body.appendChild(d);requestAnimationFrame(()=>requestAnimationFrame(()=>d.classList.add('on')));
  setTimeout(()=>d.classList.remove('on'),8000);setTimeout(()=>d.remove(),8700);
}
/* Pull down to refresh: a small Hilube bush (50 x 40 x 60 mm, longitudinal grooves) that hops. A very long pull (or a long scroll-up on a computer) sends a container ship up the page. */
(function(){
  const REF=90,SHP=230;
  const el=document.createElement('div');el.id='ptr';el.setAttribute('aria-hidden','true');
  const notch=Array.from({length:6},(_,k)=>{const t=(90+k*60)*Math.PI/180;return `<circle cx="${(30+16*Math.cos(t)).toFixed(2)}" cy="${(20+5.1*Math.sin(t)).toFixed(2)}" r="1.9" fill="#2a2e33"/>`}).join('');
  const lines=[210,250,290,330].map(a=>{const t=a*Math.PI/180,x=(30+16*Math.cos(t)).toFixed(2),y=(20+5.1*Math.sin(t)).toFixed(2);return `<line x1="${x}" y1="${y}" x2="${x}" y2="${(+y+11).toFixed(2)}" stroke="#555b63" stroke-width="1.6"/>`}).join('');
  el.innerHTML=`<div class="pb"><svg viewBox="0 0 60 84" width="50" height="70"><defs><linearGradient id="pbg" x1="0" x2="1"><stop offset="0" stop-color="#cdc3a8"/><stop offset=".45" stop-color="#fffaf0"/><stop offset="1" stop-color="#c6bca0"/></linearGradient><linearGradient id="pbl" x1="0" x2="1"><stop offset="0" stop-color="#3a50b4"/><stop offset=".45" stop-color="#7389ee"/><stop offset="1" stop-color="#32459b"/></linearGradient><clipPath id="pbc"><ellipse cx="30" cy="20" rx="16" ry="5.1"/></clipPath></defs><path d="M10 20V68A20 6.4 0 0 0 50 68V20Z" fill="url(#pbg)" stroke="#b9ae90" stroke-width=".7"/><path d="M10 40V48A20 6.4 0 0 0 50 48V40A20 6.4 0 0 1 10 40Z" fill="url(#pbl)"/><ellipse cx="30" cy="20" rx="20" ry="6.4" fill="#fffaf0" stroke="#b9ae90" stroke-width=".7"/><ellipse cx="30" cy="20" rx="16" ry="5.1" fill="#23272c"/><g clip-path="url(#pbc)">${lines}</g>${notch}</svg></div><div class="pshp">${SHIP_SVG}</div><i class="ps"></i>`;
  document.body.appendChild(el);
  const pb=el.querySelector('.pb');let y0=0,dy=0,on=false;
  const pull=d=>{const q=Math.min(d,130);el.style.transform=`translate(-50%,${q*.78-84}px)`;pb.style.transform=`rotate(${Math.sin(q/15)*12}deg) scale(${.72+Math.min(q,90)/320})`;el.classList.toggle('ready',d>REF&&d<SHP);el.classList.toggle('sh',d>=SHP)};
  const rest=()=>{el.style.transform='';pb.style.transform='';el.classList.remove('ready','sh')};
  addEventListener('touchstart',e=>{on=scrollY<=0&&e.touches.length===1&&!e.target.closest('.ov,.m3,textarea,input,select');if(on){y0=e.touches[0].clientY;dy=0}},{passive:true});
  addEventListener('touchmove',e=>{if(!on)return;dy=e.touches[0].clientY-y0;if(dy>0)pull(dy);else{on=false;rest()}},{passive:true});
  addEventListener('touchend',()=>{
    if(on&&dy>=SHP){rest();showShip()}
    else if(on&&dy>REF){el.classList.remove('ready');el.classList.add('go');el.style.transform='translate(-50%,26px)';pb.style.transform='';setTimeout(()=>location.reload(),1200)}
    else rest();
    on=false},{passive:true});
  let wa=0,wt=0;addEventListener('wheel',e=>{if(scrollY<=0&&e.deltaY<0){const t=Date.now();if(t-wt>700)wa=0;wt=t;wa-=e.deltaY;if(wa>2400){wa=0;showShip()}}else wa=0},{passive:true});
})();

setInterval(()=>{if(!document.hidden)notifCheck()},60000);document.addEventListener('visibilitychange',()=>{if(!document.hidden)notifCheck()});
