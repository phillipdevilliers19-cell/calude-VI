import {initializeApp} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import {getAuth,onAuthStateChanged,signInWithEmailAndPassword,createUserWithEmailAndPassword,signOut} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import {initializeFirestore,collection,doc,getDoc,getDocs,setDoc,deleteDoc,updateDoc} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

const C=window.VI_CONFIG||{};
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const IND='Agriculture,Construction,Forestry,Hydraulics,Industrial,Marine,Mining,Pumps,Renewable Energy,Transport,Water & Wastewater,Valves'.split(',').join('\n');
const SECS=['Overview','Problem','Solution','Result'];
const DS={pri:'#0f3f4a',amb:'#c9861a',r:10,font:'cond',mode:'auto',company:'Vesconite',footer:'',pdfAcc:'#c9861a',cover:'dark',logo:true,pp:1,secs:SECS,feat:{oem:true,ins:true,qr:true,pv:true},ind:IND};
let S={...DS},ME=null,ROLE=null,A=[],O=[],P=[],ready=false,au,db;
const can=k=>k==='edit'?['admin','editor'].includes(ROLE):ROLE==='admin';
const dc=(n,i)=>doc(db,n,i),col=n=>collection(db,n);
const byDate=(x,y)=>(y.date||'').localeCompare(x.date||'');
const T=(p,ms=40000)=>Promise.race([p,new Promise((_,no)=>setTimeout(()=>no(new Error('Timed out. Check your connection and try again. If it keeps happening, check that the Firestore database exists and the rules are published.')),ms))]);
const clean=o=>JSON.parse(JSON.stringify(o));
const indList=()=>S.ind.split('\n').map(x=>x.trim()).filter(Boolean);

/* ---------- Data (Firestore only: no paid Storage plan needed) ---------- */
const load=async()=>{const[a,o]=await Promise.all([getDocs(col('apps')),getDocs(col('oem'))]);A=a.docs.map(d=>({photos:[],...d.data(),id:d.id})).sort(byDate);O=o.docs.map(d=>({...d.data(),id:d.id})).sort(byDate)};
const CH=700000;  /* files are stored as base64 chunks, each under Firestore's 1 MiB document limit */
const putFile=async s=>{const id=crypto.randomUUID(),n=Math.ceil(s.length/CH);await Promise.all(Array.from({length:n},(_,i)=>setDoc(dc('files',`${id}_${i}`),{d:s.slice(i*CH,(i+1)*CH)})));return{id,n}};
const getFile=async f=>(await Promise.all([...Array(f.n).keys()].map(i=>getDoc(dc('files',`${f.id}_${i}`))))).map(d=>d.data().d).join('');
const delFile=f=>f?Promise.all([...Array(f.n).keys()].map(i=>deleteDoc(dc('files',`${f.id}_${i}`)))).catch(()=>{}):0;
const safe=r=>clean({name:r.name,industry:r.industry,product:r.product,desc:r.summary||r.desc,problem:r.problem,solution:r.solution,proof:r.proof,photos:r.photos});
const save=async r=>{const{id,...d}=clean(r);await setDoc(dc('apps',id),d);if(r.shared)await setDoc(dc('shared',id),safe(r));A=[{photos:[],...clean(r)},...A.filter(x=>x.id!==id)].sort(byDate)};
const commit=async(r,items,cb)=>{let n=0;const[ph,th]=await Promise.all([Promise.all(items.map(async p=>{const f=p.ref||await putFile(p.src);cb&&cb(++n,items.length);return f})),items[0]&&items[0].src?fit(items[0].src,160,.5):Promise.resolve(r.thumb||'')]);r.photos=ph;r.thumb=items[0]?th:'';await save(r)};
const remove=async a=>{await Promise.all(a.photos.map(delFile));await deleteDoc(dc('shared',a.id)).catch(()=>{});await deleteDoc(dc('apps',a.id));A=A.filter(x=>x.id!==a.id)};
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
  const link=`${location.origin}${location.pathname}#/share/${a.id}`,show=()=>{const q=$('#qr');q.hidden=false;q.innerHTML=`<h2>Customer-safe link</h2><div id="qc"></div><p class="mut" style="word-break:break-all">${esc(link)}</p><p class="mut">Shows only the overview, problem, solution, result and photos.</p><div class="acts"><button class="btn" id="cp">Copy link</button><button class="btn bad" id="us">Stop sharing</button></div>`;window.QRCode&&new QRCode($('#qc'),{text:link,width:200,height:200});$('#cp').onclick=()=>navigator.clipboard.writeText(link).then(()=>alert('Link copied.'));$('#us').onclick=async()=>{try{a.shared=false;await save(a);await deleteDoc(dc('shared',a.id));q.hidden=true}catch(x){alert(x.message)}}};
  if(a.shared)show();
  if($('#sh'))$('#sh').onclick=async()=>{try{a.shared=true;await save(a);show()}catch(x){a.shared=false;alert(x.message)}};
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
  $('#F').onsubmit=async e=>{e.preventDefault();const b=e.submitter;b.disabled=true;b.textContent='Saving…';const d=Object.fromEntries(new FormData(e.target)),r={...a,...d,id:a.id||crypto.randomUUID(),date:a.date||new Date().toISOString()};try{await T(commit(r,ph,(d,t)=>{b.textContent=d<t?`Uploading photos ${d}/${t}…`:'Saving record…'}),90000);await Promise.all(removed.map(delFile));location.hash='#/app/'+r.id}catch(x){b.disabled=false;b.textContent='Save application';alert('Could not save: '+(x.message||x))}};
}
function oem(v){
  const inds=[...new Set(O.map(o=>o.industry).filter(Boolean))].sort();
  v.innerHTML=`<h1>OEM references</h1><p class="mut">Public OEM material by application and industry. Add a web link, a PDF, or both.</p>
  ${can('edit')?`<details class="card"><summary class="btn pri">+ Add reference</summary><form id="OF"><label>Application / title<input name="app" required></label><label>Industry<input name="industry" list="il2" required></label><datalist id="il2">${indList().map(i=>`<option>${esc(i)}</option>`).join('')}</datalist><label>OEM / manufacturer<input name="maker"></label><label>Web link<input name="url" type="url" inputmode="url" placeholder="https://"></label><label>PDF (max 3 MB)<input name="f" type="file" accept="application/pdf"></label><label>Notes<textarea name="notes" rows="2"></textarea></label><button class="btn pri wide">Save reference</button></form></details>`:''}
  <div class="filters"><input id="oq" type="search" placeholder="Search references"><select id="oi"><option value="">All industries</option>${inds.map(i=>`<option>${esc(i)}</option>`).join('')}</select></div><div class="list" id="OL"></div>`;
  const upd=()=>{const q=$('#oq').value.toLowerCase(),i=$('#oi').value,l=O.filter(o=>(!i||o.industry===i)&&[o.app,o.industry,o.maker,o.notes].join(' ').toLowerCase().includes(q));
    $('#OL').innerHTML=l.length?l.map(o=>`<div class="card" style="margin:0"><strong>${esc(o.app)}</strong><small class="mut" style="display:block">${esc([o.industry,o.maker].filter(Boolean).join(' · '))}</small>${o.notes?`<p>${esc(o.notes)}</p>`:''}<div class="acts">${o.url?`<a class="btn" target="_blank" rel="noopener" href="${esc(o.url)}">Open link</a>`:''}${o.pdf?`<button class="btn" data-pdf="${o.id}">Open PDF</button>`:''}${can('del')?`<button class="btn bad" data-d="${o.id}">Delete</button>`:''}</div></div>`).join(''):'<p class="empty">No references yet.</p>';
    $$('[data-pdf]').forEach(b=>b.onclick=async()=>{const o=O.find(x=>x.id===b.dataset.pdf),w=window.open('','_blank');try{const u=URL.createObjectURL(await(await fetch(await getFile(o.pdf))).blob());w?w.location=u:location.href=u}catch{w&&w.close();alert('Could not open the PDF.')}});
    $$('[data-d]').forEach(b=>b.onclick=async()=>{const o=O.find(x=>x.id===b.dataset.d);if(confirm('Delete this reference?')){try{await delFile(o.pdf);await deleteDoc(dc('oem',o.id));await load();render()}catch(x){alert(x.message)}}})};
  $('#oq').oninput=upd;$('#oi').onchange=upd;upd();
  if($('#OF'))$('#OF').onsubmit=async e=>{e.preventDefault();const f=new FormData(e.target),file=f.get('f'),u=(f.get('url')||'').trim(),has=file&&file.size,d={app:f.get('app'),industry:f.get('industry'),maker:f.get('maker'),notes:f.get('notes'),date:new Date().toISOString()};
    if(u){if(!/^https?:\/\//i.test(u))return alert('The link must start with http:// or https://');d.url=u}
    if(!u&&!has)return alert('Add a web link, a PDF, or both.');
    if(has&&file.size>3e6)return alert('That PDF is over 3 MB. Use a smaller file, or add its web link instead.');
    const b=e.submitter;b.disabled=true;b.textContent='Saving…';
    try{if(has){d.pdf=await T(putFile(await rd(file)),90000);d.pdf.name=file.name}const oid=crypto.randomUUID();await T(setDoc(dc('oem',oid),d));O=[{...d,id:oid},...O];render()}catch(x){b.disabled=false;b.textContent='Save reference';alert('Could not save: '+(x.message||x))}};
}
const count=k=>A.reduce((m,a)=>{const x=a[k]||'Unspecified';m[x]=(m[x]||0)+1;return m},{});
const bars=m=>{const e=Object.entries(m).sort((a,b)=>b[1]-a[1]),mx=Math.max(1,...e.map(x=>x[1]));return e.length?e.map(([k,n])=>`<div class="bar"><span>${esc(k)}</span><i style="--w:${n/mx*100}%"></i><b>${n}</b></div>`).join(''):'<p class="empty">No data yet.</p>'};
function insights(v){const q=A.reduce((m,a)=>{const g=grade(a)[0];m[g]=(m[g]||0)+1;return m},{});v.innerHTML=`<h1>Insights</h1><div class="card"><h2>By industry</h2>${bars(count('industry'))}</div><div class="card"><h2>By product</h2>${bars(count('product'))}</div><div class="card"><h2>Record quality</h2>${bars(q)}</div>`}

/* ---------- Portfolio PDF (colours, logo, sections, footer all come from Admin settings) ---------- */
const rgb=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16));
const logoData=async()=>{if(!S.logo)return null;try{const r=await fetch('vesco-intelligence-logo-header.png');if(!r.ok)return null;const u=await rd(await r.blob()),i=await img(u);return{u,r:i.width/i.height}}catch{return null}};
async function pdf(ids,o){
  if(!window.jspdf)return alert('The PDF library did not load. Check your connection and try again.');
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
  d.save(`${S.company}-portfolio.pdf`);
}
function tools(v){
  P=P.filter(id=>A.some(a=>a.id===id));
  v.innerHTML=`<h1>Tools</h1>
  ${S.feat.pv?`<section class="card"><h2>Bearing PV check</h2><p class="mut">A quick estimate from load, size and speed.</p><div class="g2"><label>Radial load (N)<input id="c1" type="number" inputmode="decimal"></label><label>Shaft diameter (mm)<input id="c2" type="number" inputmode="decimal"></label><label>Bearing length (mm)<input id="c3" type="number" inputmode="decimal"></label><label>Speed (rpm)<input id="c4" type="number" inputmode="decimal"></label><label>PV limit from datasheet (optional)<input id="c5" type="number" inputmode="decimal"></label></div><div class="res" id="cr"><p class="mut">Enter load, diameter, length and speed.</p></div></section>`:''}
  <section class="card"><h2>Customer portfolio</h2>${A.length?`<p class="mut">Customer names, operating notes and recorded-by are never included.</p><label>Prepared for<input id="pc1" placeholder="Customer or company"></label><label>Introduction (optional)<textarea id="pi" rows="2"></textarea></label><div class="g2"><label style="margin:0"><select id="pa"></select></label><button class="btn" id="pad" type="button">Add to portfolio</button></div><div id="po"></div><button class="btn pri wide" id="pdf" style="margin-top:14px">Generate PDF</button>`:'<p class="empty">Capture applications first.</p>'}</section>
  <section class="card"><h2>Account</h2><p class="mut">Signed in as ${esc(ME.email)} (${ROLE}).</p><button class="btn" id="so">Sign out</button></section>`;
  $('#so').onclick=()=>signOut(au);
  if(S.feat.pv){const cv=()=>{const[Fo,dd,L,n,lim]=['c1','c2','c3','c4','c5'].map(i=>parseFloat($('#'+i).value));if(!(Fo>0&&dd>0&&L>0&&n>=0)){$('#cr').innerHTML='<p class="mut">Enter load, diameter, length and speed.</p>';return}const p=Fo/(dd*L),vv=Math.PI*dd*n/60000,pv=p*vv;$('#cr').innerHTML=`<div><b>${p.toFixed(2)}</b><span>MPa pressure</span></div><div><b>${vv.toFixed(2)}</b><span>m/s speed</span></div><div><b>${pv.toFixed(2)}</b><span>MPa·m/s PV</span></div>`+(lim>0?`<p class="note ${pv<=lim?'ok':'bad'}">${pv<=lim?`Within the limit you entered (${Math.round(pv/lim*100)}% used).`:'Exceeds the limit you entered.'}</p>`:'')+'<p class="mut">Estimate only. Check the grade\'s published limits before specifying.</p>'};$$('#c1,#c2,#c3,#c4,#c5').forEach(i=>i.oninput=cv)}
  if(!$('#pdf'))return;
  const pf=()=>{const free=A.filter(a=>!P.includes(a.id));$('#po').innerHTML=P.map((id,i)=>`<div class="ord"><span>${i+1}. ${esc(A.find(a=>a.id===id).name)}</span><button type="button" data-m="${i}:-1" aria-label="Move up">▲</button><button type="button" data-m="${i}:1" aria-label="Move down">▼</button><button type="button" data-m="${i}:x" aria-label="Remove">×</button></div>`).join('')||'<p class="mut">No applications selected yet.</p>';$('#pa').innerHTML=free.map(a=>`<option value="${a.id}">${esc(a.name)}</option>`).join('');$('#pad').disabled=!free.length;
    $$('#po button').forEach(b=>b.onclick=()=>{const[i,m]=b.dataset.m.split(':'),k=+i;if(m==='x')P.splice(k,1);else{const j=k+ +m;if(j<0||j>=P.length)return;[P[k],P[j]]=[P[j],P[k]]}pf()})};pf();
  $('#pad').onclick=()=>{if($('#pa').value){P.push($('#pa').value);pf()}};
  $('#pdf').onclick=async e=>{if(!P.length)return alert('Add at least one application.');e.target.disabled=true;try{await pdf(P,{cust:$('#pc1').value.trim(),intro:$('#pi').value.trim()})}catch(x){alert('Could not build the PDF: '+x.message)}e.target.disabled=false};
}

/* ---------- Admin ---------- */
const PRE=[['Steel & amber','#0f3f4a','#c9861a'],['Forest','#1d4a33','#d29a2c'],['Ocean','#0e3b66','#18a0b8'],['Graphite','#23282c','#e0592a'],['Crimson','#6e1423','#c98a1a'],['Violet','#3b2a6b','#e0a63a']];
async function admin(v){
  if(!can('del')){location.hash='#/';return}
  const s=S;
  v.innerHTML=`<a class="back" href="#/tools">← Tools</a><h1>Admin</h1><form id="AF">
  <section class="card"><h2>App appearance</h2><div class="acts">${PRE.map((p,i)=>`<button type="button" class="btn" data-p="${i}" style="border-left:8px solid ${p[2]}">${p[0]}</button>`).join('')}</div>
  <div class="g2"><label>Main colour<input type="color" name="pri" value="${s.pri}"></label><label>Accent colour<input type="color" name="amb" value="${s.amb}"></label>
  <label>Corners${sel('r',[[3,'Sharp'],[10,'Soft'],[18,'Round']],s.r)}</label><label>Heading font${sel('font',[['cond','Condensed'],['std','Standard'],['serif','Serif']],s.font)}</label>
  <label>Default mode${sel('mode',[['auto','Follow device'],['light','Light'],['dark','Dark']],s.mode)}</label></div><p class="mut">Changes preview live. Press Save to keep them for everyone.</p></section>
  <section class="card"><h2>Documents (PDF)</h2><div class="g2"><label>Company name<input name="company" value="${esc(s.company)}"></label><label>Footer text<input name="footer" value="${esc(s.footer)}" placeholder="Same as company"></label>
  <label>Cover style${sel('cover',[['dark','Dark'],['light','Light'],['accent','Accent colour']],s.cover)}</label><label>Document accent<input type="color" name="pdfAcc" value="${s.pdfAcc}"></label>
  <label>Photos per application${sel('pp',[[0,'None'],[1,'1'],[2,'2'],[3,'3']],s.pp)}</label></div>
  ${ckb('logo',s.logo,'Show logo on documents')}<p class="mut" style="margin:8px 0 4px">Sections to include</p>${SECS.map(k=>ckb('secs',s.secs.includes(k),k,k)).join('')}</section>
  <section class="card"><h2>Features</h2>${ckb('oem',s.feat.oem,'OEM references')}${ckb('ins',s.feat.ins,'Insights page')}${ckb('qr',s.feat.qr,'Share links and QR codes')}${ckb('pv',s.feat.pv,'Bearing PV check')}</section>
  <section class="card"><h2>Industries</h2><p class="mut">One per line. Used as suggestions when capturing and adding OEM references.</p><textarea name="ind" rows="8">${esc(s.ind)}</textarea></section>
  <button class="btn pri wide">Save settings</button></form>
  <section class="card"><h2>Team</h2><p class="mut">New sign-ups start as Pending and cannot see anything until you set a role. Viewer reads, Editor adds and edits, Admin manages everything.</p><div id="tm"><p class="mut">Loading…</p></div></section>
  <section class="card"><h2>Data</h2><p class="mut">Back up before big changes. Backups from the earlier version import too.</p><div class="acts"><button class="btn" id="ex">Export backup</button><label class="btn">Import backup<input type="file" accept=".json,application/json" hidden id="im"></label><button class="btn bad" id="ca">Delete everything</button></div></section>`;
  const read=()=>{const f=new FormData($('#AF'));return{...S,pri:f.get('pri'),amb:f.get('amb'),r:+f.get('r'),font:f.get('font'),mode:f.get('mode'),company:f.get('company').trim()||'Vesconite',footer:f.get('footer').trim(),pdfAcc:f.get('pdfAcc'),cover:f.get('cover'),logo:f.has('logo'),pp:+f.get('pp'),secs:f.getAll('secs'),feat:{oem:f.has('oem'),ins:f.has('ins'),qr:f.has('qr'),pv:f.has('pv')},ind:f.get('ind')}};
  $('#AF').addEventListener('input',()=>apply(read()));
  $$('[data-p]').forEach(b=>b.onclick=()=>{const p=PRE[+b.dataset.p];$('[name=pri]').value=p[1];$('[name=amb]').value=p[2];$('[name=pdfAcc]').value=p[2];apply(read())});
  $('#AF').onsubmit=async e=>{e.preventDefault();try{const n=read();await setDoc(dc('settings','app'),clean(n));S=n;apply(S);alert('Settings saved for everyone.')}catch(x){alert('Could not save: '+x.message)}};
  getDocs(col('members')).then(q=>{$('#tm').innerHTML=q.docs.map(d=>{const m=d.data();return `<label class="ck">${esc(m.email)}<select data-u="${d.id}" ${d.id===ME.uid?'disabled':''}>${['pending','viewer','editor','admin'].map(r=>`<option ${r===m.role?'selected':''}>${r}</option>`).join('')}</select></label>`}).join('');$$('#tm select').forEach(s=>s.onchange=async()=>{try{await updateDoc(dc('members',s.dataset.u),{role:s.value})}catch(x){alert(x.message)}})}).catch(x=>{$('#tm').textContent=x.message});
  $('#ex').onclick=async e=>{e.target.textContent='Preparing…';try{const apps=[];for(const a of A){const{thumb,...r}=a;r.photos=await Promise.all(a.photos.map(getFile));apps.push(r)}const u=URL.createObjectURL(new Blob([JSON.stringify({v:4,apps})],{type:'application/json'})),l=document.createElement('a');l.href=u;l.download=`vi-backup-${new Date().toISOString().slice(0,10)}.json`;l.click();setTimeout(()=>URL.revokeObjectURL(u),1000)}catch(x){alert(x.message)}e.target.textContent='Export backup'};
  $('#im').onchange=async e=>{try{const j=JSON.parse(await e.target.files[0].text()),L=(Array.isArray(j)?j:j.apps).filter(r=>r&&r.name);let n=0;for(const r of L){const x=norm(r),items=x.src.map(src=>({src}));delete x.src;await commit(x,items);n++}alert(`Imported ${n} records.`);render()}catch(x){alert('That file is not a valid backup.')}};
  $('#ca').onclick=async()=>{if(confirm(`Delete all ${A.length} applications and ${O.length} OEM references? Export a backup first.`)&&confirm('This cannot be undone. Delete everything?')){try{for(const a of A)await remove(a);for(const o of O){await delFile(o.pdf);await deleteDoc(dc('oem',o.id))}await load();render()}catch(x){alert(x.message)}}};
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
  const ed=can('edit'),m={'':home,library,new:ed?form:home,edit:ed?form:home,app:detail,insights:S.feat.ins?insights:home,oem:S.feat.oem?oem:home,tools,admin};
  (m[p]||home)(v,id);
  $$('.tabs a').forEach(a=>a.classList.toggle('on',a.getAttribute('href')==='#/'+(p==='app'||p==='edit'?'library':p)));
  $('.tabs .add').hidden=!ed;scrollTo(0,0);
}
async function boot(u){
  ME=u;ROLE=null;
  if(u){let m=await getDoc(dc('members',u.uid));
    if(!m.exists()){const rec={email:(u.email||'').toLowerCase()};try{await setDoc(dc('members',u.uid),{...rec,role:'admin'})}catch{await setDoc(dc('members',u.uid),{...rec,role:'pending'})}m=await getDoc(dc('members',u.uid))}
    ROLE=m.data().role;if(['admin','editor','viewer'].includes(ROLE))await load()}
  ready=true;render();
}
addEventListener('hashchange',render);
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&ME&&['admin','editor','viewer'].includes(ROLE))load().catch(()=>{})});
if(!C.firebase||/YOUR/.test(C.firebase.apiKey||'YOUR')){$('#v').innerHTML='<h1>Setup needed</h1><p class="lead">Paste your Firebase details into config.js, then reload.</p>'}
else{
  const app=initializeApp(C.firebase);au=getAuth(app);db=initializeFirestore(app,{experimentalAutoDetectLongPolling:true,ignoreUndefinedProperties:true});
  (async()=>{try{const s=await getDoc(dc('settings','app'));if(s.exists())S={...DS,...s.data(),feat:{...DS.feat,...(s.data().feat||{})}};}catch{}
    if(!t0&&S.mode!=='auto')setT(S.mode);apply(S);
    onAuthStateChanged(au,u=>boot(u).catch(e=>{ready=true;$('#v').innerHTML=`<h1>Can't load data</h1><p class="mut">${esc(e.message)}</p><p class="mut">Check that the Firestore rules in firestore.rules are published.</p>`}));
  })();
}
