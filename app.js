import {initializeApp} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import {getAuth,onAuthStateChanged,signInWithEmailAndPassword,createUserWithEmailAndPassword,signOut} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import {initializeFirestore,collection,doc,getDoc,getDocs,setDoc,deleteDoc,updateDoc,query,orderBy,limit} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

const C=window.VI_CONFIG||{};
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const IND='Agriculture,Construction,Forestry,Hydraulics,Industrial,Marine,Mining,Pumps,Renewable Energy,Transport,Water & Wastewater,Valves'.split(',').join('\n');
const SECS=['Overview','Problem','Solution','Result'];
const DS={pri:'#0f3f4a',amb:'#c9861a',r:10,font:'cond',mode:'auto',company:'Vesconite',footer:'',pdfAcc:'#c9861a',cover:'dark',logo:true,pp:1,secs:SECS,feat:{oem:true,ins:true,qr:true,pv:true},ind:IND,dw:{logo:'',logoR:1,showLogo:true,company:'VESCONITE',title:'INDUSTRIAL BEARING BUSH',prefix:'VI',rev:'A',paper:'a3',who:'auto',whoText:'',fit:true,notes:true,noteText:'1. ALL DIMENSIONS IN mm, FOR A FREE-STANDING BUSH AT 20 °C.\n2. TOLERANCES: OD AND ID ±0.1% (MIN ±0.025); WALL +0/−0.5% (MIN −0.025);\n    LENGTH +0/−0.5% (MIN −0.3). STANDARD VESCONITE MACHINING TOLERANCES.\n3. CONTROL WALL THICKNESS AND OUTSIDE DIAMETER WHEN MACHINING.\n4. SIZES FROM THE VESCONITE DESIGN MANUAL EQUATIONS. VERIFY BEFORE MANUFACTURE.\n5. {FIT}'}};
let S={...DS},ME=null,ROLE=null,A=[],O=[],P=[],ready=false,au,db;
const can=k=>k==='edit'?['admin','editor'].includes(ROLE):ROLE==='admin';
const dc=(n,i)=>doc(db,n,i),col=n=>collection(db,n);
const byDate=(x,y)=>(y.date||'').localeCompare(x.date||'');
const T=(p,ms=40000)=>Promise.race([p,new Promise((_,no)=>setTimeout(()=>no(new Error('Timed out. Check your connection and try again. If it keeps happening, check that the Firestore database exists and the rules are published.')),ms))]);
const clean=o=>JSON.parse(JSON.stringify(o));
const LIBS={three:'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js',jspdf:'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.2/jspdf.umd.min.js',qr:'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js'},LP={};
const lib=k=>LP[k]||(LP[k]=new Promise((ok,no)=>{const s=document.createElement('script');s.src=LIBS[k];s.onload=ok;s.onerror=()=>{delete LP[k];no(new Error('Could not load the '+k+' library. Check your connection.'))};document.head.appendChild(s)}));
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
const mergeS=d=>({...DS,...d,feat:{...DS.feat,...(d.feat||{})},dw:{...DS.dw,...(d.dw||{})}});
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
const img=s=>new Promise((ok,no)=>{const i=new Image();i.onload=()=>ok(i);i.onerror=no;i.src=s});
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
  <h2>Needs evidence</h2>${need.length?`<div class="list">${need.map(row).join('')}</div>`:`<p class="empty">${A.length?'Every record has a result and a photo.':'Nothing captured yet. Start with your best-known installation.'}</p>`}
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
  <div class="acts">${can('edit')?`<a class="btn pri" href="#/edit/${a.id}">Edit</a>${S.feat.qr?'<button class="btn" id="sh">Share / QR</button>':''}`:''}${can('edit')?'<button class="btn bad" id="dl">Delete</button>':''}</div>`;
  if(a.photos.length)lazyImgs($('#st'),a.photos);
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
  ${f('name','Application name','','required')}<label>Industry<input name="industry" list="il" required value="${esc(a.industry)}"><datalist id="il">${indList().map(i=>`<option>${esc(i)}</option>`).join('')}</datalist></label>${f('product','Product / material')}${f('desc','What does it do, and where is it used?','area')}
  <fieldset><legend>Customer story</legend>${f('problem','Problem','area')}${f('solution','Solution','area')}${f('proof','Result / proof','area')}${f('summary','Customer-safe summary','area')}</fieldset>
  <fieldset><legend>Operating conditions</legend>${f('orig','Original material')}${f('env','Environment')}${f('load','Load / movement / speed')}${f('temp','Temperature')}${f('lube','Lubrication')}${f('customer','Customer / OEM')}</fieldset>
  <fieldset><legend>Photos <small id="pc"></small></legend><div class="pg" id="pg"></div><div class="acts"><label class="btn">Take photo<input type="file" accept="image/*" capture="environment" hidden id="p1"></label><label class="btn">Choose photos<input type="file" accept="image/*" multiple hidden id="p2"></label></div></fieldset>
  ${f('author','Recorded by')}<button class="btn pri wide">Save application</button></form>`;
  const rp=()=>{$('#pg').innerHTML=ph.map((p,i)=>`<figure><img src="${p.src}" alt=""><button type="button" data-i="${i}" aria-label="Remove photo">×</button></figure>`).join('');$('#pc').textContent=`${ph.length}/10`;$$('#pg button').forEach(b=>b.onclick=()=>{const[x]=ph.splice(+b.dataset.i,1);if(x.ref)removed.push(x.ref);rp()})};rp();
  const add=async e=>{for(const fl of [...e.target.files]){if(ph.length>=10){alert('Maximum 10 photos per application.');break}try{ph.push({src:await shrink(fl)})}catch{alert('One photo could not be read.')}}e.target.value='';rp()};
  $('#p1').onchange=add;$('#p2').onchange=add;
  $('#F').onsubmit=async e=>{e.preventDefault();const b=e.submitter;b.disabled=true;b.textContent='Saving…';const d=Object.fromEntries(new FormData(e.target)),r={...a,...d,id:a.id||crypto.randomUUID(),date:a.date||new Date().toISOString()};try{await T(commit(r,ph,(d,t)=>{b.textContent=d<t?`Uploading photos ${d}/${t}…`:'Saving record…'}),90000);await Promise.all(removed.map(delFile));log(a.id?'Edited application':'Created application',r.name);location.hash='#/app/'+r.id}catch(x){b.disabled=false;b.textContent='Save application';alert('Could not save: '+(x.message||x))}};
}
function oem(v){
  const inds=[...new Set(O.map(o=>o.industry).filter(Boolean))].sort();
  v.innerHTML=`<h1>OEM references</h1><p class="mut">Public OEM material by application and industry. Add a web link, a PDF, or both.</p>
  ${can('edit')?`<details class="card"><summary class="btn pri">+ Add reference</summary><form id="OF"><label>Application / title<input name="app" required></label><label>Industry<input name="industry" list="il2" required></label><datalist id="il2">${indList().map(i=>`<option>${esc(i)}</option>`).join('')}</datalist><label>OEM / manufacturer<input name="maker"></label><label>Web link<input name="url" type="url" inputmode="url" placeholder="https://"></label><label>PDF (max 3 MB)<input name="f" type="file" accept="application/pdf"></label><label>Notes<textarea name="notes" rows="2"></textarea></label><button class="btn pri wide">Save reference</button></form></details>`:''}
  <div class="filters"><input id="oq" type="search" placeholder="Search references"><select id="oi"><option value="">All industries</option>${inds.map(i=>`<option>${esc(i)}</option>`).join('')}</select></div><div class="list" id="OL"></div>`;
  const upd=()=>{const q=$('#oq').value.toLowerCase(),i=$('#oi').value,l=O.filter(o=>(!i||o.industry===i)&&[o.app,o.industry,o.maker,o.notes].join(' ').toLowerCase().includes(q));
    $('#OL').innerHTML=l.length?l.map(o=>`<div class="card" style="margin:0"><strong>${esc(o.app)}</strong><small class="mut" style="display:block">${esc([o.industry,o.maker].filter(Boolean).join(' · '))}</small>${o.notes?`<p>${esc(o.notes)}</p>`:''}<div class="acts">${o.url?`<a class="btn" target="_blank" rel="noopener" href="${esc(o.url)}">Open link</a>`:''}${o.pdf?`<button class="btn" data-pdf="${o.id}">Open PDF</button>`:''}${can('del')?`<button class="btn bad" data-d="${o.id}">Delete</button>`:''}</div></div>`).join(''):'<p class="empty">No references yet.</p>';
    $$('[data-pdf]').forEach(b=>b.onclick=async()=>{const o=O.find(x=>x.id===b.dataset.pdf),w=window.open('','_blank');try{const u=URL.createObjectURL(await(await fetch(await getFile(o.pdf))).blob());w?w.location=u:location.href=u}catch{w&&w.close();alert('Could not open the PDF.')}});
    $$('[data-d]').forEach(b=>b.onclick=async()=>{const o=O.find(x=>x.id===b.dataset.d);if(confirm('Delete this reference?')){try{await delFile(o.pdf);await deleteDoc(dc('oem',o.id));log('Deleted OEM reference',o.app);await load();render()}catch(x){alert(x.message)}}})};
  $('#oq').oninput=upd;$('#oi').onchange=upd;upd();
  if($('#OF'))$('#OF').onsubmit=async e=>{e.preventDefault();const f=new FormData(e.target),file=f.get('f'),u=(f.get('url')||'').trim(),has=file&&file.size,d={app:f.get('app'),industry:f.get('industry'),maker:f.get('maker'),notes:f.get('notes'),date:new Date().toISOString()};
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
async function pdf(ids,o){
  await lib('jspdf');
  const d=new window.jspdf.jsPDF({unit:'mm',format:'a4'}),lg=await logoData(),acc=rgb(S.pdfAcc),ink=[14,26,32];
  const bg=S.cover==='light'?[255,255,255]:S.cover==='accent'?acc:ink,tc=S.cover==='light'?ink:[255,255,255],sc=S.cover==='accent'?[255,255,255]:acc;
  d.setFillColor(...bg);d.rect(0,0,210,297,'F');
  if(lg){const h=16;d.addImage(lg.u,'PNG',20,24,h*lg.r,h)}
  d.setTextColor(...tc);d.setFontSize(32);d.text(d.splitTextToSize(`${S.company} application portfolio`,160),20,110);
  d.setFontSize(14);d.setTextColor(...sc);d.text(o.cust||'Selected applications',20,142);
  d.setFontSize(10);d.setTextColor(...tc);d.text(new Date().toLocaleDateString(),20,152);
  if(o.intro){d.setFontSize(11);d.text(d.splitTextToSize(o.intro,150),20,166)}
  for(const id of ids){const a=A.find(x=>x.id===id);if(!a)continue;d.addPage();let y=24;
    const need=h=>{if(y+h>275){d.addPage();y=24}};
    if(lg)d.addImage(lg.u,'PNG',190-10*lg.r,10,10*lg.r,10);
    d.setTextColor(...ink);d.setFontSize(20);const t=d.splitTextToSize(a.name,150);d.text(t,20,y);y+=t.length*8;
    d.setFontSize(10);d.setTextColor(90,107,115);d.text([a.industry,a.product].filter(Boolean).join('  |  '),20,y);y+=8;
    for(const r of a.photos.slice(0,S.pp)){try{const u=await getFile(r),im=await img(u),mh=S.pp>1?55:80,h=Math.min(mh,170*im.height/im.width),w=h*im.width/im.height;need(h);d.addImage(u,'JPEG',20,y,w,h);y+=h+6}catch{}}
    const secs={Overview:a.summary||a.desc,Problem:a.problem,Solution:a.solution,Result:a.proof};
    for(const k of SECS){if(!S.secs.includes(k)||!secs[k])continue;need(20);d.setFontSize(11);d.setTextColor(...acc);d.text(k,20,y);y+=5;d.setFontSize(10);d.setTextColor(...ink);const l=d.splitTextToSize(secs[k],170);for(const ln of l){need(5);d.text(ln,20,y);y+=4.6}y+=6}}
  const n=d.getNumberOfPages();for(let i=2;i<=n;i++){d.setPage(i);d.setFontSize(8);d.setTextColor(120);d.text(`${S.footer||S.company}${o.cust?'  |  '+o.cust:''}  |  ${i-1}`,20,287)}
  return{blob:d.output('blob'),name:`${S.company}-portfolio.pdf`};
}
function tools(v){
  P=P.filter(id=>A.some(a=>a.id===id));
  v.innerHTML=`<h1>Tools</h1>
  ${S.feat.pv?'<section class="card"><h2>Design</h2><a class="row" href="#/design"><div class="th">◉</div><div><strong>Industrial bearing</strong><small>Size, fit, clearance, PV and tolerances</small></div><span class="chip ok">Open</span></a><a class="row" href="#/quickdraw" style="margin-top:8px"><div class="th">✎</div><div><strong>QuickDraw</strong><small>Type sizes, get a full drawing and PDF</small></div><span class="chip ok">Open</span></a></section>':''}
  <section class="card"><h2>Customer portfolio</h2>${A.length?`<p class="mut">Customer names, operating notes and recorded-by are never included.</p><label>Prepared for<input id="pc1" placeholder="Customer or company"></label><label>Introduction (optional)<textarea id="pi" rows="2"></textarea></label><div class="g2"><label style="margin:0"><select id="pa"></select></label><button class="btn" id="pad" type="button">Add to portfolio</button></div><div id="po"></div><button class="btn pri wide" id="pdf" style="margin-top:14px">Generate PDF</button>`:'<p class="empty">Capture applications first.</p>'}</section>
  <section class="card"><h2>Account</h2><p class="mut">Signed in as ${esc(ME.email)} (${ROLE}).</p><button class="btn" id="so">Sign out</button></section>`;
  $('#so').onclick=()=>signOut(au);
  if(!$('#pdf'))return;
  const pf=()=>{const pb=$('#pdf');pb._b=null;pb.textContent='Generate PDF';const free=A.filter(a=>!P.includes(a.id));$('#po').innerHTML=P.map((id,i)=>`<div class="ord"><span>${i+1}. ${esc(A.find(a=>a.id===id).name)}</span><button type="button" data-m="${i}:-1" aria-label="Move up">▲</button><button type="button" data-m="${i}:1" aria-label="Move down">▼</button><button type="button" data-m="${i}:x" aria-label="Remove">×</button></div>`).join('')||'<p class="mut">No applications selected yet.</p>';$('#pa').innerHTML=free.map(a=>`<option value="${a.id}">${esc(a.name)}</option>`).join('');$('#pad').disabled=!free.length;
    $$('#po button').forEach(b=>b.onclick=()=>{const[i,m]=b.dataset.m.split(':'),k=+i;if(m==='x')P.splice(k,1);else{const j=k+ +m;if(j<0||j>=P.length)return;[P[k],P[j]]=[P[j],P[k]]}pf()})};pf();
  $('#pad').onclick=()=>{if($('#pa').value){P.push($('#pa').value);pf()}};
  $('#pdf').onclick=async e=>{const b=e.currentTarget;if(b._b){await deliver(b._b,b._n);return}if(!P.length)return alert('Add at least one application.');b.disabled=true;b.textContent='Building…';try{const r=await pdf(P,{cust:$('#pc1').value.trim(),intro:$('#pi').value.trim()});b._b=r.blob;b._n=r.name;b.textContent='Open PDF';log('Built portfolio PDF',$('#pc1').value.trim())}catch(x){alert('Could not build the PDF: '+x.message);b.textContent='Generate PDF'}b.disabled=false};
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
function upd3(st,o){
  st.last=o;const g=st.grp;[...g.children].forEach(m=>{m.geometry.dispose();g.remove(m)});
  const{OD,ID,L,ch,fl,gz,G}=o,rO=OD/2,rI=ID/2,h=L/2,c=Math.min(ch,(rO-rI)*.8,h*.5),rF=fl.on?fl.FD/2:rO,yF=h-(fl.on?fl.T:0);
  const planes=st.cut?[new THREE.Plane(new THREE.Vector3(1,0,0),0)]:[];
  const mat=new THREE.MeshStandardMaterial({color:GRADES[o.g][3],roughness:.6,metalness:.05,side:THREE.DoubleSide,clippingPlanes:planes});
  const lm=new THREE.LineBasicMaterial({color:0x151515,clippingPlanes:planes});
  const add=geo=>g.add(new THREE.Mesh(geo,mat)),V2=(a,b)=>new THREE.Vector2(a,b);
  const out=fl.on?[[rO-c,-h],[rO,-h+c],[rO,yF],[rF,yF],[rF,h]]:[[rO-c,-h],[rO,-h+c],[rO,h-c],[rO-c,h]];
  for(let i=0;i<out.length-1;i++)add(new THREE.LatheGeometry([V2(out[i][0],out[i][1]),V2(out[i+1][0],out[i+1][1])],128));
  out.forEach(p=>{const pts=[];for(let k=0;k<=128;k++){const t=k/128*Math.PI*2;pts.push(new THREE.Vector3(p[0]*Math.cos(t),p[1],p[0]*Math.sin(t)))}g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),lm))});
  const none=G.type==='none',Nt=none?128:720,Ny=none?1:140,pos=[],idx=[];
  for(let j=0;j<=Ny;j++){const y=-h+L*j/Ny;for(let i=0;i<Nt;i++){const t=2*Math.PI*i/Nt,r=rI+gz(t,y);pos.push(r*Math.cos(t),y,r*Math.sin(t))}}
  for(let j=0;j<Ny;j++)for(let i=0;i<Nt;i++){const a=j*Nt+i,b=j*Nt+(i+1)%Nt,c2=(j+1)*Nt+i,d=(j+1)*Nt+(i+1)%Nt;idx.push(a,c2,b,b,c2,d)}
  const bg=new THREE.BufferGeometry();bg.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));bg.setIndex(idx);bg.computeVertexNormals();add(bg);
  const ring=(y,ro)=>{const p=[],ix=[],pts=[];
    for(let i=0;i<Nt;i++){const t=2*Math.PI*i/Nt,r=rI+gz(t,y);p.push(r*Math.cos(t),y,r*Math.sin(t),ro*Math.cos(t),y,ro*Math.sin(t))}
    for(let i=0;i<Nt;i++){const a=2*i,b=2*((i+1)%Nt);ix.push(a,a+1,b,b,a+1,b+1)}
    const gm=new THREE.BufferGeometry();gm.setAttribute('position',new THREE.Float32BufferAttribute(p,3));gm.setIndex(ix);gm.computeVertexNormals();add(gm);
    for(let i=0;i<=Nt;i++){const t=2*Math.PI*(i%Nt)/Nt,r=rI+gz(t,y);pts.push(new THREE.Vector3(r*Math.cos(t),y,r*Math.sin(t)))}
    g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),lm))};
  ring(-h,rO-c);ring(h,rF-(fl.on?0:c));
  st.size=Math.max(fl.on?fl.FD:OD,L);
}

/* Engineering drawing (SVG in mm, A3 layout): end view, half section A-A, dimensions with tolerances, data table, notes, title block */
function drawSVG(p){
  const{OD,ID,L,ch,w,H,D,press,clo,c,g,tOD,tID,tW,tL,pf,drg,G,fl,dw,logo,gz}=p,q=p.q,e=esc,Dm=fl.on?fl.FD:OD;
  const sa=[5,2,1,.5,.2,.1,.05,.02,.01],s=q&&q.scale>0?q.scale:(sa.find(x=>x<=Math.min(118/Dm,125/L))||.01),scl=s>=1?`${s}:1`:`1:${Math.round(1/s)}`;
  const cy=118,cx1=80,rO=OD*s/2,rI=ID*s/2,rF=fl.on?fl.FD*s/2:rO,cs=ch>0?Math.min(Math.max(ch*s,.8),(rO-rI)*.8):0,cx2=cx1+rF+(fl.on?52:46)+L*s/2,x0=cx2-L*s/2,x1=cx2+L*s/2,xF=x1-(fl.on?fl.T*s:0);
  const yTO=cy-rO,yTI=cy-rI,yBI=cy+rI,yBO=cy+rO,yTF=cy-rF,yBF=cy+rF,hh=L/2,n=v=>+v.toFixed(2),pts=a=>a.map(q=>n(q[0])+','+n(q[1])).join(' ');
  const dh=(a,b,yr,y,t)=>{const k=y>yr?1:-1;return `<line class="k2" x1="${n(a)}" y1="${n(yr+k)}" x2="${n(a)}" y2="${n(y+k*2)}"/><line class="k2" x1="${n(b)}" y1="${n(yr+k)}" x2="${n(b)}" y2="${n(y+k*2)}"/><line class="k4" x1="${n(a)}" y1="${n(y)}" x2="${n(b)}" y2="${n(y)}"/><text x="${n((a+b)/2)}" y="${n(y-1.2)}" text-anchor="middle">${e(t)}</text>`};
  const dv=(a,b,xr,x,t)=>{const k=x>xr?1:-1;return `<line class="k2" x1="${n(xr+k)}" y1="${n(a)}" x2="${n(x+k*2)}" y2="${n(a)}"/><line class="k2" x1="${n(xr+k)}" y1="${n(b)}" x2="${n(x+k*2)}" y2="${n(b)}"/><line class="k4" x1="${n(x)}" y1="${n(a)}" x2="${n(x)}" y2="${n(b)}"/><text transform="translate(${n(x-1.2)} ${n((a+b)/2)}) rotate(-90)" text-anchor="middle">${e(t)}</text>`};
  const cell=(x,y,wd,h,l,t,sz=3.6)=>`<rect class="k1" x="${x}" y="${y}" width="${wd}" height="${h}"/><text class="lb" x="${x+1}" y="${y+2.6}">${l}</text><text x="${x+1.5}" y="${y+h-1.7}" style="font-size:${sz}px">${t}</text>`;
  const inner=(th,sgn)=>{const a=[];for(let k=0;k<=160;k++)a.push([x0+(x1-x0)*k/160,(sgn<0?yTI:yBI)+(sgn<0?-1:1)*gz(th,-hh+L*k/160)*s]);return a};
  const topOut=fl.on?[[x0,yTO+cs],[x0+cs,yTO],[xF,yTO],[xF,yTF],[x1,yTF]]:[[x0,yTO+cs],[x0+cs,yTO],[x1-cs,yTO],[x1,yTO+cs]];
  const botOut=fl.on?[[x0,yBO-cs],[x0+cs,yBO],[xF,yBO],[xF,yBF],[x1,yBF]]:[[x0,yBO-cs],[x0+cs,yBO],[x1-cs,yBO],[x1,yBO-cs]];
  const topP=[...topOut,...inner(Math.PI/2,-1).reverse()],botP=[...botOut,...inner(3*Math.PI/2,1).reverse()];
  const idEnd=G.type==='none'?`<circle class="k1" cx="${cx1}" cy="${cy}" r="${n(rI)}"/>`:`<path class="k1" d="M${Array.from({length:720},(_,k)=>{const t=2*Math.PI*k/720,r=rI+gz(t,hh)*s;return n(cx1+r*Math.cos(t))+','+n(cy-r*Math.sin(t))}).join('L')}Z"/>`;
  const lab=q?q.lab:{OD:`Ø${fx(OD)} ±${fx(tOD,3)}`,ID:`Ø${fx(ID)} ±${fx(tID,3)}`,L:`${fx(L)} +0/−${fx(tL)}`,W:`${fx(w)} +0/−${fx(tW,3)}`,FD:`Ø${fx(fl.FD)}`,T:`${fx(fl.T)}`};
  const gw=G.type==='none'?0:grooveWidth(G.d,G.r);
  const fit=[['HOUSING Ø',fx(H)],['SHAFT Ø',fx(D)],['PRESS FIT',pf?fx(press,3):'NONE'],['BORE CLOSURE',fx(clo,3)],['ASSEMBLY CLEARANCE',fx(c,3)],['FITTED INSIDE Ø',fx(D+c,3)],['WALL',fx(w)]];
  if(fl.on)fit.push(['FLANGE Ø',fx(fl.FD)],['FLANGE THICKNESS',fx(fl.T)]);
  if(G.type!=='none'){fit.push(['GROOVE TYPE',GTYPES[G.type]],['GROOVE QTY',String(G.n)],['GROOVE DEPTH',fx(G.d)],['GROOVE RADIUS',fx(G.r)],['GROOVE WIDTH',fx(gw)]);if(G.type==='spiral')fit.push(['SPIRAL PITCH',fx(G.pitch)]);if(G.type==='blind')fit.push(['GROOVE LENGTH',fx(G.len)])}
  const fitSentence=pf?'INTERFERENCE FIT INTO HOUSING. FREEZE-FIT OR PRESS WITH A MANDREL.':'NO PRESS FIT: SECURE THE BEARING MECHANICALLY OR BY BONDING.';
  const notes=dw.notes?['NOTES',...dw.noteText.replace('{FIT}',fitSentence).split('\n').slice(0,11)]:[];
  const title=q?q.title:(dw.title||'BEARING')+(fl.on?' (FLANGED)':'')+' — '+GRADES[g][0],fitRows=q?q.table:fit;
  const lgBox=logo&&dw.showLogo?(()=>{const wd=Math.min(38,12*logo.r),ht=wd/logo.r;return `<image href="${logo.u}" x="${n(220+(42-wd)/2)}" y="${n(245+(16-ht)/2)}" width="${n(wd)}" height="${n(ht)}" preserveAspectRatio="xMidYMid meet"/>`})():`<text x="241" y="254.5" text-anchor="middle" style="font-size:3.4px;font-weight:bold">${e(dw.company)}</text>`;
  const rowH=4.8;
  return `<svg xmlns="http://www.w3.org/2000/svg" class="vd" width="420mm" height="297mm" viewBox="0 0 420 297" font-family="Arial Narrow,Arial,Helvetica,sans-serif">
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
<line class="k3" x1="${n(x0-9)}" y1="${cy}" x2="${n(x1+9)}" y2="${cy}"/>
<text x="${n(cx2)}" y="${n(yBF+27)}" text-anchor="middle" class="tt">SECTION A–A</text>
${dh(x0,x1,yBF,yBF+11,lab.L)}
${dv(yTI,yBI,x0,x0-13,lab.ID)}
${fl.on?dv(yTO,yBO,x0,x0-27,lab.OD)+dv(yTF,yBF,x1,x1+13,lab.FD)+dh(xF,x1,yTF,yTF-11,lab.T):dv(yTO,yBO,x1,x1+11,lab.OD)+(()=>{const x=x1+20;return `<line class="k2" x1="${n(x1+1)}" y1="${n(yTO)}" x2="${n(x+2)}" y2="${n(yTO)}"/><line class="k2" x1="${n(x1+1)}" y1="${n(yTI)}" x2="${n(x+2)}" y2="${n(yTI)}"/><line class="k4" x1="${n(x)}" y1="${n(yTO)}" x2="${n(x)}" y2="${n(yTI)}"/><text x="${n(x+3)}" y="${n((yTO+yTI)/2+1.2)}" style="font-size:3px">${e(lab.W)}</text>`})()}
${cs>0?`<polyline class="k2" marker-start="url(#vA)" points="${n(x0+cs*.4)},${n(yTO+cs*.4)} ${n(x0-6)},${n(yTO-12)} ${n(x0)},${n(yTO-12)}"/>
<text x="${n(x0+1)}" y="${n(yTO-13)}">${e(q&&q.chText?q.chText:`${fx(ch,1)} × 30° CHAMFER, OD LEAD-IN`)}</text>`:''}
</g>
${dw.fit?`<g><rect class="k1" x="350" y="16" width="56" height="${n(rowH*(fitRows.length+1)+1)}"/><text x="352" y="20" class="sm" style="font-weight:bold;font-size:3px">FIT AND FEATURE DATA (mm)</text>${fitRows.map((r,i)=>`<line class="k2" x1="350" y1="${n(21+i*rowH)}" x2="406" y2="${n(21+i*rowH)}"/><text class="sm" x="352" y="${n(24.4+i*rowH)}">${e(r[0])}</text><text class="sm" x="404" y="${n(24.4+i*rowH)}" text-anchor="end">${e(r[1])}</text>`).join('')}</g>`:''}
<g>${notes.map((t,i)=>`<text x="14" y="${236+i*4.4}" style="font-size:${i?3:3.8}px;${i?'':'font-weight:bold'}" xml:space="preserve">${e(t)}</text>`).join('')}</g>
<g>${cell(220,245,185,16,'','',1).replace(/<rect[^>]*\/>/,'<rect class="k1" x="220" y="245" width="185" height="16"/>')}<line class="k1" x1="262" y1="245" x2="262" y2="261"/>${lgBox}<text class="lb" x="263" y="247.6">TITLE</text><text x="264" y="257" style="font-size:4.6px">${e(title)}</text>
${cell(220,261,46,12,'MATERIAL',e(q?q.material:GRADES[g][0].replace('VESCONITE HILUBE','VES. HILUBE')),3.2)}${cell(266,261,46,12,'SCALE',scl)}${cell(312,261,46,12,'SIZE',e(dw.paper.toUpperCase()))}${cell(358,261,47,12,'SHEET','1 OF 1')}${cell(220,273,68,14,'DRAWING NO.',e(drg),3.2)}${cell(288,273,16,14,'REV',e(dw.rev))}${cell(304,273,50,14,'DATE',e(p.date))}${cell(354,273,51,14,'DRAWN BY',e(p.who),2.8)}</g>
</svg>`;
}
/* Files: iOS home-screen apps cannot download directly, so use the share sheet when available */
async function deliver(blob,name){
  const f=new File([blob],name,{type:blob.type});
  if(navigator.canShare&&navigator.canShare({files:[f]})){try{await navigator.share({files:[f],title:name});return}catch(x){if(x.name==='AbortError')return}}
  const u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download=name;document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(u),60000);
}
const svgBlob=()=>new Blob(['<?xml version="1.0" encoding="UTF-8"?>\n'+LAST.svg],{type:'image/svg+xml'});
async function makeDrawingPdf(){
  await lib('jspdf');
  const u=URL.createObjectURL(svgBlob());let im;try{im=await img(u)}finally{URL.revokeObjectURL(u)}
  const cv=document.createElement('canvas');cv.width=3360;cv.height=2376;const x=cv.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,3360,2376);x.drawImage(im,0,0,3360,2376);
  const pp=LAST.paper||S.dw.paper,a4=pp==='a4',d=new window.jspdf.jsPDF({unit:'mm',format:pp,orientation:'landscape'});
  d.addImage(cv.toDataURL('image/jpeg',.95),'JPEG',0,0,a4?297:420,a4?210:297);
  return d.output('blob');
}
async function pdfStep(b){   /* tap 1 builds the PDF, tap 2 opens the share sheet (iOS needs a fresh tap) */
  if(b._b){await deliver(b._b,LAST.drg+'.pdf');return}
  const t=b.textContent;b.disabled=true;b.textContent='Building…';
  try{b._b=await makeDrawingPdf();b.textContent='Open PDF';log('Made drawing PDF',LAST.drg)}catch(x){alert('Could not build the PDF: '+(x.message||x));b.textContent=t}
  b.disabled=false;
}
function openDrawing(){
  if(!LAST)return;const o=document.createElement('div');o.className='ov';
  o.innerHTML=`<div class="ovb"><strong>${esc(LAST.drg)}</strong><span class="sp"></span><button data-z="-1" aria-label="Zoom out">−</button><button data-z="1" aria-label="Zoom in">+</button><button data-a="pdf">Make PDF</button><button data-a="svg">SVG</button><button data-a="x">Close</button></div><div class="ovs">${LAST.svg}</div>`;
  document.body.appendChild(o);document.body.style.overflow='hidden';
  const sv=$('svg',o);let wd=Math.min(1400,Math.max(innerWidth*2.4,900));sv.style.width=wd+'px';
  o.onclick=async e=>{const b=e.target.closest('button');if(!b)return;
    if(b.dataset.z){wd=Math.min(3200,Math.max(400,wd*(+b.dataset.z>0?1.3:1/1.3)));sv.style.width=wd+'px'}
    else if(b.dataset.a==='x'){o.remove();document.body.style.overflow=''}
    else if(b.dataset.a==='svg')deliver(svgBlob(),LAST.drg+'.svg');
    else if(b.dataset.a==='pdf')pdfStep(b)};
}
function design(v){
  if(!S.feat.pv){location.hash='#/tools';return}
  T3=null;T3L=false;LAST=null;
  if(!S.dw.logo)repoLogo().then(r=>{if(r&&!window.__rl){window.__rl=r;if($('#DF'))$('#DF').dispatchEvent(new Event('input'))}});
  const n=(id,l,u,val='',att='')=>`<label>${l} <span class="mut">${u}</span><input id="${id}" type="number" inputmode="decimal" step="any" value="${val}" ${att}></label>`;
  v.innerHTML=`<a class="back" href="#/tools">← Tools</a><h1>Industrial bearing</h1><p class="mut">Bearing size, fit, clearance, grooves and PV using the equations in the Vesconite design manual (metric, free-standing bush, sizes at 20 °C). A design aid: confirm with Vesconite's own Design a Bearing calculator before ordering.</p>
  <form class="card" id="DF"><div class="g2">${n('d1','Housing diameter','mm')}${n('d2','Shaft diameter','mm')}${n('d3','Bearing length (overall)','mm')}
  <label>Grade<select id="d18"><option value="v">Vesconite</option><option value="h">Vesconite Hilube</option><option value="x">Hitemp 150</option></select></label>
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
  <div class="acts"><button type="button" class="btn pri" id="mx">Expand to drawing</button><button type="button" class="btn" id="mc">Cutaway view</button></div><p class="mut" style="margin:0">3D: drag to rotate, pinch or scroll to zoom. Colours are illustrative. The drawing is generated from the sizes below.</p></div>
  <div id="DO"></div>`;
  $('#DF').onsubmit=e=>e.preventDefault();
  $$('#MD .seg button').forEach(b=>b.onclick=()=>{$$('#MD .seg button').forEach(x=>x.classList.toggle('on',x===b));$('#m3').hidden=b.dataset.t!=='3d';$('#mdr').hidden=b.dataset.t!=='dr'});
  $('#mx').onclick=openDrawing;
  $('#mc').onclick=()=>{if(T3){T3.cut=!T3.cut;$('#mc').textContent=T3.cut?'Full view':'Cutaway view';if(T3.last)upd3(T3,T3.last)}};
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
    $('#GR').innerHTML=gt==='none'?'':rec?`<p class="mut" style="margin:6px 0">Recommended for a ${fx(D,0)} mm shaft: ${gt==='spiral'||gt==='blind'?'width, depth and radius from the manual\'s groove table; count, pitch and length are suggested starting points. ':''}<b>${rec.n} grooves, depth ${rec.d} mm, radius ${rec.r} mm</b> (about ${fx(grooveWidth(rec.d,rec.r),1)} mm wide)${gt==='spiral'?`, pitch ${rec.pitch} mm`:''}${gt==='blind'?`, length ${rec.len} mm`:''}. Water flow about ${rec.q} l/min.${rec.lim?' Depth reduced to keep it under half the wall.':''}</p><button type="button" class="btn" id="ra">Apply recommendation</button>`:'<p class="mut">The manual\'s groove table covers shaft diameters of 20–200 mm. Enter your own values.</p>';
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
    LAST={drg,svg:drawSVG({OD,ID,L,ch:chn||0.5,w,H,D,press,clo,c,g:gk,tOD,tID,tW,tL,pf,drg,G:Gu,fl,dw:S.dw,logo,gz,date:dt.toLocaleDateString(),who:S.dw.who==='custom'?S.dw.whoText:(ME?.email||'').split('@')[0]})};
    $('#mdr').innerHTML=LAST.svg;MD.hidden=false;
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
  $$('#DF input,#DF select').forEach(i=>{i.addEventListener('input',cv);i.addEventListener('change',cv)});cv();
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
  <div class="card" id="QP" hidden><div class="mdr" id="QV"></div><div class="acts"><button type="button" class="btn pri" id="qx">Expand to drawing</button><button type="button" class="btn" id="qp">Make PDF</button><button type="button" class="btn" id="qs">SVG</button></div><p class="mut" style="margin:0">Make PDF, wait for it to change to Open PDF, then tap again to open or save it.</p></div>`;
  const gv=id=>$('#'+id).value,gn=id=>parseFloat(gv(id));
  const gen=()=>{
    const fl0=gv('qFl')==='y',gt=gv('qG');
    $$('[data-qf]').forEach(x=>x.hidden=!fl0);$$('[data-qg]').forEach(x=>x.hidden=gt==='none');$$('[data-qgt]').forEach(x=>x.hidden=x.dataset.qgt!==gt);
    const OD=gn('qOD'),ID=gn('qID'),L=gn('qL'),M=$('#QM'),P=$('#QP'),stop=m=>{P.hidden=true;M.innerHTML=m};
    if(!(OD>0&&ID>0&&L>0))return stop('<p class="mut">Enter the outside diameter, inside diameter and length to see the drawing.</p>');
    if(OD<=ID)return stop('<p class="note bad">The outside diameter must be larger than the inside diameter.</p>');
    const w=(OD-ID)/2,fl={on:fl0,FD:gn('qFD'),T:gn('qT')};
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
    LAST={drg,paper:gv('qPaper'),svg:drawSVG({OD,ID,L,ch,w,g:'v',pf:true,drg,G:Gu,fl,dw:dwq,logo,gz:grooveFn(Gu,ID/2),date,who:gv('qWho'),q:{lab,table,title:name+(fl0?' (FLANGED)':''),material:mat,scale:parseFloat(gv('qScale'))||0,chText:gv('qlCh').trim()||(ch>0?`${fx(ch,2)} × 45° CHAMFER`:'')}})};
    $('#QV').innerHTML=LAST.svg;P.hidden=false;const pb=$('#qp');pb._b=null;pb.textContent='Make PDF';
  };
  if(!S.dw.logo&&!window.__rl)repoLogo().then(r=>{if(r){window.__rl=r;gen()}});
  $('#QF').onsubmit=e=>e.preventDefault();
  $('#qTab').addEventListener('input',e=>{if(e.isTrusted)edited=true});
  $('#qtr').onclick=()=>{edited=false;gen()};
  $('#qstd').onclick=()=>{const OD=gn('qOD'),ID=gn('qID'),L=gn('qL'),set=(id,x)=>{$('#'+id).value=x?+x.toFixed(3):''};if(OD>0){set('qODp',tol(OD,.1,.025));set('qODm',tol(OD,.1,.025))}if(ID>0){set('qIDp',tol(ID,.1,.025));set('qIDm',tol(ID,.1,.025))}if(L>0){set('qLp',0);set('qLm',tol(L,.5,.3))}gen()};
  $('#qrec').onclick=()=>{const ID=gn('qID'),OD=gn('qOD'),L=gn('qL'),gt=gv('qG'),rc=ID>0&&OD>ID?recGroove(gt,ID,(OD-ID)/2,L):null;if(!rc){alert('Enter the OD, ID and length first. The manual\'s groove table covers shaft diameters of 20–200 mm.');return}const set=(id,x)=>{$('#'+id).value=x!=null?x:''};set('qGn',rc.n);set('qGd',rc.d);set('qGr',rc.r);if(gt==='spiral')set('qGp',rc.pitch);if(gt==='blind')set('qGl',rc.len);gen()};
  $('#qx').onclick=openDrawing;$('#qp').onclick=e=>pdfStep(e.currentTarget);$('#qs').onclick=()=>deliver(svgBlob(),LAST.drg+'.svg');
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
  <section class="card"><h2>Features</h2>${ckb('oem',s.feat.oem,'OEM references')}${ckb('ins',s.feat.ins,'Insights page')}${ckb('qr',s.feat.qr,'Share links and QR codes')}${ckb('pv',s.feat.pv,'Design calculators')}</section>
  <section class="card"><h2>Industries</h2><p class="mut">One per line. Used as suggestions when capturing and adding OEM references.</p><textarea name="ind" rows="8">${esc(s.ind)}</textarea></section>
  <button class="btn pri wide">Save settings</button></form>
  <section class="card"><h2>Team</h2><p class="mut">New sign-ups start as Pending and cannot see anything until you set a role. Viewer reads, Editor adds and edits, Admin manages everything.</p><div id="tm"><p class="mut">Loading…</p></div></section>
  <section class="card"><h2>Activity log</h2><p class="mut">Only admins can see this. Newest first.</p><input id="alf" type="search" placeholder="Filter by person or action"><div class="lg" id="ALL"><p class="mut">Loading…</p></div><div class="acts"><button type="button" class="btn" id="alm">Load more</button><button type="button" class="btn bad" id="alc">Clear log</button></div></section>
  <section class="card"><h2>Data</h2><p class="mut">Back up before big changes. Backups from the earlier version import too.</p><div class="acts"><button class="btn" id="ex">Export backup</button><label class="btn">Import backup<input type="file" accept=".json,application/json" hidden id="im"></label><button class="btn bad" id="ca">Delete everything</button></div></section>`;
  const read=()=>{const f=new FormData($('#AF'));return{...S,pri:f.get('pri'),amb:f.get('amb'),r:+f.get('r'),font:f.get('font'),mode:f.get('mode'),company:f.get('company').trim()||'Vesconite',footer:f.get('footer').trim(),pdfAcc:f.get('pdfAcc'),cover:f.get('cover'),logo:f.has('logo'),pp:+f.get('pp'),secs:f.getAll('secs'),feat:{oem:f.has('oem'),ins:f.has('ins'),qr:f.has('qr'),pv:f.has('pv')},ind:f.get('ind'),dw:{...S.dw,logo:dwLogo.u||'',logoR:dwLogo.r||1,company:f.get('dw_company').trim(),title:f.get('dw_title').trim(),prefix:f.get('dw_prefix').trim(),rev:f.get('dw_rev').trim(),paper:f.get('dw_paper'),who:f.get('dw_who'),whoText:f.get('dw_whoText').trim(),showLogo:f.has('dw_showLogo'),fit:f.has('dw_fit'),notes:f.has('dw_notes'),noteText:f.get('dw_noteText')}}};
  const lgShow=()=>{$('#lgp').innerHTML=dwLogo.u?`<img src="${dwLogo.u}" alt="" style="max-height:48px;background:#fff;padding:4px;border-radius:6px;vertical-align:middle"> Uploaded logo is used on drawings and documents.`:'No uploaded logo. The logo file in your repo is used instead.'};lgShow();
  $('#lgf').onchange=async e=>{const f=e.target.files[0];if(!f)return;try{const u=URL.createObjectURL(f),im=await img(u);URL.revokeObjectURL(u);let m=500,out;do{const k=Math.min(1,m/Math.max(im.width,im.height)),cv=document.createElement('canvas');cv.width=Math.round(im.width*k);cv.height=Math.round(im.height*k);cv.getContext('2d').drawImage(im,0,0,cv.width,cv.height);out={u:cv.toDataURL('image/png'),r:cv.width/cv.height};m-=140}while(out.u.length>450000&&m>100);dwLogo=out;lgShow()}catch{alert('That image could not be read.')}e.target.value=''};
  $('#lgx').onclick=()=>{dwLogo={u:'',r:1};lgShow()};
  $('#AF').addEventListener('input',()=>apply(read()));
  $$('[data-p]').forEach(b=>b.onclick=()=>{const p=PRE[+b.dataset.p];$('[name=pri]').value=p[1];$('[name=amb]').value=p[2];$('[name=pdfAcc]').value=p[2];apply(read())});
  $('#AF').onsubmit=async e=>{e.preventDefault();try{const n=read();await setDoc(dc('settings','app'),clean(n));log('Changed settings');S=n;try{localStorage.setItem('vi4s',JSON.stringify(S))}catch{}apply(S);alert('Settings saved for everyone.')}catch(x){alert('Could not save: '+x.message)}};
  const loadTeam=()=>getDocs(col('members')).then(q=>{$('#tm').innerHTML=q.docs.map(d=>{const m=d.data();return `<label class="ck">${esc(m.email)}<select data-u="${d.id}" data-e="${esc(m.email)}" data-r="${m.role}" ${d.id===ME.uid?'disabled':''}>${['pending','viewer','editor','admin'].map(r=>`<option ${r===m.role?'selected':''}>${r}</option>`).join('')}</select></label>`}).join('');$$('#tm select').forEach(s=>s.onchange=async()=>{try{await updateDoc(dc('members',s.dataset.u),{role:s.value});log('Changed role',s.dataset.e,`${s.dataset.r} → ${s.value}`);s.dataset.r=s.value}catch(x){alert(x.message)}})}).catch(x=>{$('#tm').textContent=x.message});loadTeam();
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
  $('#ex').onclick=async e=>{e.target.textContent='Preparing…';try{const apps=[];for(const a of A){const{thumb,...r}=a;r.photos=await Promise.all(a.photos.map(getFile));apps.push(r)}const u=URL.createObjectURL(new Blob([JSON.stringify({v:4,apps})],{type:'application/json'})),l=document.createElement('a');l.href=u;l.download=`vi-backup-${new Date().toISOString().slice(0,10)}.json`;l.click();log('Exported backup');setTimeout(()=>URL.revokeObjectURL(u),1000)}catch(x){alert(x.message)}e.target.textContent='Export backup'};
  $('#im').onchange=async e=>{try{const j=JSON.parse(await e.target.files[0].text()),L=(Array.isArray(j)?j:j.apps).filter(r=>r&&r.name);let n=0;for(const r of L){const x=norm(r),items=x.src.map(src=>({src}));delete x.src;await commit(x,items);n++}log('Imported backup','',`${n} records`);alert(`Imported ${n} records.`);render()}catch(x){alert('That file is not a valid backup.')}};
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
  const ed=can('edit'),m={'':home,library,new:ed?form:home,edit:ed?form:home,app:detail,insights:S.feat.ins?insights:home,oem:S.feat.oem?oem:home,tools,design:S.feat.pv?design:home,quickdraw:S.feat.pv?quickdraw:home,admin};
  (m[p]||home)(v,id);
  $$('.tabs a').forEach(a=>a.classList.toggle('on',a.getAttribute('href')==='#/'+(p==='app'||p==='edit'?'library':p==='design'||p==='quickdraw'?'tools':p)));
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
/* Pull down to refresh (home-screen app has no browser refresh button) */
(function(){
  const bar=document.createElement('div');bar.id='ptr';bar.textContent='Pull to refresh';document.body.appendChild(bar);
  let y0=0,dy=0,on=false;
  addEventListener('touchstart',e=>{on=scrollY<=0&&e.touches.length===1&&!e.target.closest('.ov,.m3,textarea,input,select');if(on){y0=e.touches[0].clientY;dy=0}},{passive:true});
  addEventListener('touchmove',e=>{if(!on)return;dy=e.touches[0].clientY-y0;if(dy>0){bar.style.transform=`translateY(${Math.min(dy,120)/2-30}px)`;bar.textContent=dy>90?'Release to refresh':'Pull to refresh'}else{on=false;bar.style.transform=''}},{passive:true});
  addEventListener('touchend',()=>{if(on&&dy>90){bar.textContent='Refreshing…';bar.style.transform='translateY(30px)';setTimeout(()=>location.reload(),150)}else bar.style.transform='';on=false},{passive:true});
})();

setInterval(()=>{if(!document.hidden)notifCheck()},60000);document.addEventListener('visibilitychange',()=>{if(!document.hidden)notifCheck()});
