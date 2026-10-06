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
  ${S.feat.pv?'<section class="card"><h2>Design</h2><a class="row" href="#/design"><div class="th">◉</div><div><strong>Industrial bearing</strong><small>Size, fit, clearance, PV and tolerances</small></div><span class="chip ok">Open</span></a></section>':''}
  <section class="card"><h2>Customer portfolio</h2>${A.length?`<p class="mut">Customer names, operating notes and recorded-by are never included.</p><label>Prepared for<input id="pc1" placeholder="Customer or company"></label><label>Introduction (optional)<textarea id="pi" rows="2"></textarea></label><div class="g2"><label style="margin:0"><select id="pa"></select></label><button class="btn" id="pad" type="button">Add to portfolio</button></div><div id="po"></div><button class="btn pri wide" id="pdf" style="margin-top:14px">Generate PDF</button>`:'<p class="empty">Capture applications first.</p>'}</section>
  <section class="card"><h2>Account</h2><p class="mut">Signed in as ${esc(ME.email)} (${ROLE}).</p><button class="btn" id="so">Sign out</button></section>`;
  $('#so').onclick=()=>signOut(au);
  if(!$('#pdf'))return;
  const pf=()=>{const free=A.filter(a=>!P.includes(a.id));$('#po').innerHTML=P.map((id,i)=>`<div class="ord"><span>${i+1}. ${esc(A.find(a=>a.id===id).name)}</span><button type="button" data-m="${i}:-1" aria-label="Move up">▲</button><button type="button" data-m="${i}:1" aria-label="Move down">▼</button><button type="button" data-m="${i}:x" aria-label="Remove">×</button></div>`).join('')||'<p class="mut">No applications selected yet.</p>';$('#pa').innerHTML=free.map(a=>`<option value="${a.id}">${esc(a.name)}</option>`).join('');$('#pad').disabled=!free.length;
    $$('#po button').forEach(b=>b.onclick=()=>{const[i,m]=b.dataset.m.split(':'),k=+i;if(m==='x')P.splice(k,1);else{const j=k+ +m;if(j<0||j>=P.length)return;[P[k],P[j]]=[P[j],P[k]]}pf()})};pf();
  $('#pad').onclick=()=>{if($('#pa').value){P.push($('#pa').value);pf()}};
  $('#pdf').onclick=async e=>{if(!P.length)return alert('Add at least one application.');e.target.disabled=true;try{await pdf(P,{cust:$('#pc1').value.trim(),intro:$('#pi').value.trim()})}catch(x){alert('Could not build the PDF: '+x.message)}e.target.disabled=false};
}

/* ---------- Design: Industrial bearing (equations from the Vesconite design manual, metric) ---------- */
const K=6e-5;  /* published linear thermal expansion, mm/mm/°C */
const tol=(x,p,m)=>Math.max(x*p/100,m);
const fx=(x,d=2)=>Number.isFinite(x)?x.toFixed(d):'–';
const GRV=[[30,3,6,2.5,4],[50,4,8,3,8],[80,6,8,3,12],[120,6,10,3.5,18],[160,8,12,4,24],[200,10,12,4,30]];
const GRADES={v:['VESCONITE',65,100,0xb58a4e],h:['VESCONITE HILUBE',65,100,0x3a342e],x:['HITEMP 150',125,150,0x8a7260]};
let T3=null,LAST=null;

/* 3D viewer (three.js): a lathe model of the bush, drag to rotate, pinch or scroll to zoom */
function init3(box){
  if(!window.THREE){box.innerHTML='<p class="empty" style="margin:12px">The 3D viewer could not load. Check your connection.</p>';return null}
  const R=new THREE.WebGLRenderer({antialias:true,alpha:true});R.setPixelRatio(Math.min(devicePixelRatio||1,2));box.appendChild(R.domElement);
  const sc=new THREE.Scene(),cam=new THREE.PerspectiveCamera(32,1,.1,10000),grp=new THREE.Group();grp.rotation.order='YXZ';grp.rotation.set(.75,.6,0);
  sc.add(new THREE.HemisphereLight(0xffffff,0x556677,.95));const dl=new THREE.DirectionalLight(0xffffff,.8);dl.position.set(2,3,4);sc.add(dl,grp);
  const st={grp,zoom:1,size:100,drag:false},ps=new Map();let pd=0;
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
  const g=st.grp;[...g.children].forEach(m=>{m.geometry.dispose();g.remove(m)});
  const rO=o.OD/2,rI=o.ID/2,h=o.L/2,c=Math.min(o.ch,(rO-rI)*.8,h*.5);
  const mat=new THREE.MeshStandardMaterial({color:GRADES[o.g][3],roughness:.6,metalness:.05,side:THREE.DoubleSide});
  const P=[[rI,-h],[rO-c,-h],[rO,-h+c],[rO,h-c],[rO-c,h],[rI,h]];
  for(let i=0;i<6;i++){const a=P[i],b=P[(i+1)%6];g.add(new THREE.Mesh(new THREE.LatheGeometry([new THREE.Vector2(a[0],a[1]),new THREE.Vector2(b[0],b[1])],96),mat))}
  const lm=new THREE.LineBasicMaterial({color:0x151515});
  P.forEach(p=>{const pts=[];for(let k=0;k<=96;k++){const t=k/96*Math.PI*2;pts.push(new THREE.Vector3(p[0]*Math.cos(t),p[1],p[0]*Math.sin(t)))}g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),lm))});
  st.size=Math.max(o.OD,o.L);
}

/* Engineering drawing (A3 landscape SVG, millimetres): end view, half section A-A, dimensions with tolerances, fit data, notes, title block */
function drawSVG(p){
  const{OD,ID,L,ch,w,H,D,press,clo,c,g,tOD,tID,tW,tL,pf,drg}=p,e=esc;
  const sa=[5,2,1,.5,.2,.1,.05,.02,.01],s=sa.find(x=>x<=Math.min(130/OD,140/L))||.01,scl=s>=1?`${s}:1`:`1:${Math.round(1/s)}`;
  const cy=118,cx1=88,rO=OD*s/2,rI=ID*s/2,cs=Math.min(Math.max(ch*s,.8),(rO-rI)*.8),cx2=cx1+rO+50+L*s/2,x0=cx2-L*s/2,x1=cx2+L*s/2,yTO=cy-rO,yTI=cy-rI,yBI=cy+rI,yBO=cy+rO;
  const n=v=>+v.toFixed(2);
  const dh=(a,b,yr,y,t)=>{const k=y>yr?1:-1;return `<line class="k2" x1="${n(a)}" y1="${n(yr+k)}" x2="${n(a)}" y2="${n(y+k*2)}"/><line class="k2" x1="${n(b)}" y1="${n(yr+k)}" x2="${n(b)}" y2="${n(y+k*2)}"/><line class="k4" x1="${n(a)}" y1="${n(y)}" x2="${n(b)}" y2="${n(y)}"/><text x="${n((a+b)/2)}" y="${n(y-1.2)}" text-anchor="middle">${t}</text>`};
  const dv=(a,b,xr,x,t)=>{const k=x>xr?1:-1;return `<line class="k2" x1="${n(xr+k)}" y1="${n(a)}" x2="${n(x+k*2)}" y2="${n(a)}"/><line class="k2" x1="${n(xr+k)}" y1="${n(b)}" x2="${n(x+k*2)}" y2="${n(b)}"/><line class="k4" x1="${n(x)}" y1="${n(a)}" x2="${n(x)}" y2="${n(b)}"/><text transform="translate(${n(x-1.2)} ${n((a+b)/2)}) rotate(-90)" text-anchor="middle">${t}</text>`};
  const cell=(x,y,wd,h,l,t,sz=3.6)=>`<rect class="k1" x="${x}" y="${y}" width="${wd}" height="${h}"/><text class="lb" x="${x+1}" y="${y+2.6}">${l}</text><text x="${x+1.5}" y="${y+h-1.7}" style="font-size:${sz}px">${t}</text>`;
  const fit=[['HOUSING Ø',fx(H)],['SHAFT Ø',fx(D)],['PRESS FIT',pf?fx(press,3):'NONE'],['BORE CLOSURE',fx(clo,3)],['ASSEMBLY CLEARANCE',fx(c,3)],['FITTED INSIDE Ø',fx(D+c,3)]];
  const notes=['NOTES','1. ALL DIMENSIONS IN mm, FOR A FREE-STANDING BUSH AT 20 °C.','2. TOLERANCES: OD AND ID ±0.1% (MIN ±0.025); WALL +0/−0.5% (MIN −0.025);','    LENGTH +0/−0.5% (MIN −0.3). STANDARD VESCONITE MACHINING TOLERANCES.','3. CONTROL WALL THICKNESS AND OUTSIDE DIAMETER WHEN MACHINING.','4. SIZES FROM THE VESCONITE DESIGN MANUAL EQUATIONS. VERIFY BEFORE MANUFACTURE.',pf?'5. INTERFERENCE FIT INTO HOUSING. FREEZE-FIT OR PRESS WITH A MANDREL.':'5. NO PRESS FIT: SECURE THE BEARING MECHANICALLY OR BY BONDING.'];
  return `<svg xmlns="http://www.w3.org/2000/svg" class="vd" width="420mm" height="297mm" viewBox="0 0 420 297" font-family="Arial Narrow,Arial,Helvetica,sans-serif">
<defs><style>svg.vd .k1{stroke:#000;stroke-width:.5;fill:none}svg.vd .k2{stroke:#000;stroke-width:.25;fill:none}svg.vd .k3{stroke:#000;stroke-width:.25;stroke-dasharray:8 1.5 1.5 1.5;fill:none}svg.vd .k4{stroke:#000;stroke-width:.25;marker-start:url(#vA);marker-end:url(#vA)}svg.vd .k5{stroke:#000;stroke-width:.7;stroke-dasharray:8 2 1.5 2;fill:none}svg.vd text{font-size:3.5px;fill:#000}svg.vd .lb{font-size:2px;fill:#444}svg.vd .tt{font-size:5px;font-weight:bold}</style>
<marker id="vA" viewBox="0 0 10 4" refX="10" refY="2" markerWidth="3.2" markerHeight="1.28" markerUnits="userSpaceOnUse" orient="auto-start-reverse"><path d="M0,0L10,2L0,4z" fill="#000"/></marker>
<pattern id="vh" width="1.6" height="1.6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="1.6" stroke="#000" stroke-width=".2"/></pattern></defs>
<rect width="420" height="297" fill="#fff"/><rect class="k2" x="5" y="5" width="410" height="287"/><rect x="10" y="10" width="400" height="277" fill="none" stroke="#000" stroke-width=".7"/>
<g>
<circle class="k1" cx="${cx1}" cy="${cy}" r="${n(rO)}"/><circle class="k1" cx="${cx1}" cy="${cy}" r="${n(rO-cs)}"/><circle class="k1" cx="${cx1}" cy="${cy}" r="${n(rI)}"/>
<line class="k3" x1="${n(cx1-rO-7)}" y1="${cy}" x2="${n(cx1+rO+7)}" y2="${cy}"/>
<line class="k5" x1="${cx1}" y1="${n(cy-rO-12)}" x2="${cx1}" y2="${n(cy+rO+12)}"/>
<path class="k1" d="M${cx1} ${n(cy-rO-12)}H${cx1+8}" marker-end="url(#vA)"/><path class="k1" d="M${cx1} ${n(cy+rO+12)}H${cx1+8}" marker-end="url(#vA)"/>
<text x="${cx1-4.5}" y="${n(cy-rO-12)}" class="tt">A</text><text x="${cx1-4.5}" y="${n(cy+rO+15)}" class="tt">A</text>
<text x="${cx1}" y="${n(cy+rO+27)}" text-anchor="middle" class="tt">END VIEW</text>
<polygon class="k1" style="fill:url(#vh)" points="${n(x0)},${n(yTI)} ${n(x0)},${n(yTO+cs)} ${n(x0+cs)},${n(yTO)} ${n(x1-cs)},${n(yTO)} ${n(x1)},${n(yTO+cs)} ${n(x1)},${n(yTI)}"/>
<polygon class="k1" style="fill:url(#vh)" points="${n(x0)},${n(yBI)} ${n(x0)},${n(yBO-cs)} ${n(x0+cs)},${n(yBO)} ${n(x1-cs)},${n(yBO)} ${n(x1)},${n(yBO-cs)} ${n(x1)},${n(yBI)}"/>
<line class="k3" x1="${n(x0-9)}" y1="${cy}" x2="${n(x1+9)}" y2="${cy}"/>
<text x="${n(cx2)}" y="${n(yBO+27)}" text-anchor="middle" class="tt">SECTION A–A</text>
${dh(x0,x1,yBO,yBO+11,`${fx(L)} +0/−${fx(tL)}`)}
${dv(yTO,yBO,x1,x1+13,`Ø${fx(OD)} ±${fx(tOD,3)}`)}
${dv(yTI,yBI,x0,x0-13,`Ø${fx(ID)} ±${fx(tID,3)}`)}
${(()=>{const x=x1+27;return `<line class="k2" x1="${n(x1+1)}" y1="${n(yTO)}" x2="${n(x+2)}" y2="${n(yTO)}"/><line class="k2" x1="${n(x1+1)}" y1="${n(yTI)}" x2="${n(x+2)}" y2="${n(yTI)}"/><line class="k4" x1="${n(x)}" y1="${n(yTO)}" x2="${n(x)}" y2="${n(yTI)}"/><text x="${n(x+3)}" y="${n((yTO+yTI)/2+1.2)}">${fx(w)} +0/−${fx(tW,3)}</text>`})()}
<polyline class="k2" marker-start="url(#vA)" points="${n(x0+cs*.4)},${n(yTO+cs*.4)} ${n(x0-6)},${n(yTO-12)} ${n(x0)},${n(yTO-12)}"/>
<text x="${n(x0+1)}" y="${n(yTO-13)}">${fx(ch,1)} × 30° CHAMFER, OD BOTH ENDS</text>
</g>
<g><rect class="k1" x="310" y="16" width="95" height="${6*(fit.length+1)}"/><text x="312" y="20.2" class="tt" style="font-size:3.6px">FIT DATA (mm)</text>${fit.map((r,i)=>`<line class="k2" x1="310" y1="${22+i*6}" x2="405" y2="${22+i*6}"/><text x="312" y="${26.2+i*6}">${r[0]}</text><text x="403" y="${26.2+i*6}" text-anchor="end">${r[1]}</text>`).join('')}</g>
<g>${notes.map((t,i)=>`<text x="14" y="${236+i*4.6}" style="font-size:${i?3:3.8}px;${i?'':'font-weight:bold'}" xml:space="preserve">${e(t)}</text>`).join('')}</g>
<g>${cell(220,245,185,16,'TITLE','INDUSTRIAL BEARING BUSH — '+GRADES[g][0],5)}${cell(220,261,46,12,'MATERIAL',GRADES[g][0].replace('VESCONITE HILUBE','VES. HILUBE'),3.2)}${cell(266,261,46,12,'SCALE',scl)}${cell(312,261,46,12,'SIZE','A3')}${cell(358,261,47,12,'SHEET','1 OF 1')}${cell(220,273,92,14,'DRAWING NO.',e(drg),3.4)}${cell(312,273,46,14,'DATE',e(p.date))}${cell(358,273,47,14,'DRAWN BY',e(p.who),2.8)}</g>
</svg>`;
}
const dlSVG=()=>{const u=URL.createObjectURL(new Blob([LAST.svg],{type:'image/svg+xml'})),a=document.createElement('a');a.href=u;a.download=LAST.drg+'.svg';a.click();setTimeout(()=>URL.revokeObjectURL(u),1000)};
const dlPDF=async()=>{if(!window.jspdf)throw new Error('PDF library not loaded');const u=URL.createObjectURL(new Blob([LAST.svg],{type:'image/svg+xml'})),im=await img(u),cv=document.createElement('canvas');cv.width=3360;cv.height=2376;const x=cv.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,3360,2376);x.drawImage(im,0,0,3360,2376);URL.revokeObjectURL(u);const d=new window.jspdf.jsPDF({unit:'mm',format:'a3',orientation:'landscape'});d.addImage(cv.toDataURL('image/jpeg',.95),'JPEG',0,0,420,297);d.save(LAST.drg+'.pdf')};
function openDrawing(){
  if(!LAST)return;const o=document.createElement('div');o.className='ov';
  o.innerHTML=`<div class="ovb"><strong>${esc(LAST.drg)}</strong><span class="sp"></span><button data-z="-1" aria-label="Zoom out">−</button><button data-z="1" aria-label="Zoom in">+</button><button data-a="pdf">PDF</button><button data-a="svg">SVG</button><button data-a="x">Close</button></div><div class="ovs">${LAST.svg}</div>`;
  document.body.appendChild(o);document.body.style.overflow='hidden';
  const sv=$('svg',o);let wd=Math.min(1400,Math.max(innerWidth*2.4,900));sv.style.width=wd+'px';
  o.onclick=async e=>{const b=e.target.closest('button');if(!b)return;
    if(b.dataset.z){wd=Math.min(3200,Math.max(400,wd*(+b.dataset.z>0?1.3:1/1.3)));sv.style.width=wd+'px'}
    else if(b.dataset.a==='x'){o.remove();document.body.style.overflow=''}
    else if(b.dataset.a==='svg')dlSVG();
    else if(b.dataset.a==='pdf'){b.disabled=true;try{await dlPDF()}catch(x){alert('Could not build the PDF: '+x.message)}b.disabled=false}};
}
function design(v){
  if(!S.feat.pv){location.hash='#/tools';return}
  T3=null;LAST=null;
  const n=(id,l,u,val='')=>`<label>${l} <span class="mut">${u}</span><input id="${id}" type="number" inputmode="decimal" step="any" value="${val}"></label>`;
  v.innerHTML=`<a class="back" href="#/tools">← Tools</a><h1>Industrial bearing</h1><p class="mut">Bearing size, fit, clearance and PV using the equations in the Vesconite design manual (metric, free-standing bush, sizes at 20 °C). A design aid: confirm with Vesconite's own Design a Bearing calculator before ordering.</p>
  <form class="card" id="DF"><div class="g2">${n('d1','Housing diameter','mm')}${n('d2','Shaft diameter','mm')}${n('d3','Bearing length','mm')}
  <label>Grade<select id="d18"><option value="v">Vesconite</option><option value="h">Vesconite Hilube</option><option value="x">Hitemp 150</option></select></label>
  <label>Press fit?<select id="d4"><option value="y">Yes</option><option value="n">No</option></select></label>
  <label>Operating condition<select id="d5"><option value="wet">Immersed in water</option><option value="dry">Dry, oil or grease</option></select></label>
  ${n('d6','Max operating temp','°C')}${n('d7','Min operating temp','°C')}${n('d9','Total mass supported','kg')}${n('d10','Bearings sharing the mass','','1')}</div>
  <label>Motion<select id="d11"><option value="rot">Rotation</option><option value="osc">Oscillation</option><option value="lin">Linear</option></select></label>
  <div class="g2" data-m="rot">${n('d12','Speed','rpm')}</div>
  <div class="g2" data-m="osc" hidden>${n('d13','Swing angle','degrees')}${n('d14','Cycles per minute','')}</div>
  <div class="g2" data-m="lin" hidden>${n('d15','Travel per stroke','mm')}${n('d16','Cycles per minute','')}</div>
  ${n('d17','PV limit for your grade (optional)','MPa·m/min')}</form>
  <div class="card" id="MD" hidden><div class="seg"><button type="button" data-t="3d" class="on">3D model</button><button type="button" data-t="dr">Drawing</button></div><div class="m3" id="m3"></div><div id="mdr" class="mdr" hidden></div>
  <div class="acts"><button type="button" class="btn pri" id="mx">Expand to drawing</button></div><p class="mut" style="margin:0">3D: drag to rotate, pinch or scroll to zoom. Colours are illustrative. The drawing is generated from the sizes below.</p></div>
  <div id="DO"></div>`;
  $('#DF').onsubmit=e=>e.preventDefault();
  $$('#MD .seg button').forEach(b=>b.onclick=()=>{$$('#MD .seg button').forEach(x=>x.classList.toggle('on',x===b));$('#m3').hidden=b.dataset.t!=='3d';$('#mdr').hidden=b.dataset.t!=='dr'});
  $('#mx').onclick=openDrawing;
  const cv=()=>{
    const g=id=>parseFloat($('#'+id).value),H=g('d1'),D=g('d2'),L=g('d3'),O=$('#DO'),mo=$('#d11').value,MD=$('#MD');
    $$('[data-m]').forEach(x=>x.hidden=x.dataset.m!==mo);
    if(!(H>0&&D>0&&L>0)){MD.hidden=true;O.innerHTML='<p class="mut">Enter housing diameter, shaft diameter and bearing length.</p>';return}
    if(H<=D){MD.hidden=true;O.innerHTML='<p class="note bad">The housing diameter must be larger than the shaft diameter.</p>';return}
    const gk=$('#d18').value,pf=$('#d4').value==='y',dry=$('#d5').value==='dry',tx=g('d6'),tn=g('d7'),nb=g('d10')>0?g('d10'):1;
    const press=pf?0.05+0.002*H:0,clo=press*D/H,OD=H+press,c=(0.05+0.01*(OD-D-clo))/1.01,ID=D+clo+c,w=(OD-ID)/2;
    if(!(w>0)){MD.hidden=true;O.innerHTML='<p class="note bad">These sizes leave no bearing wall. Check the diameters.</p>';return}
    const ms=g('d9'),P=ms>0?ms*9.81/nb/(D*L):NaN;
    const V=mo==='rot'?Math.PI*D*g('d12')/1000:mo==='osc'?Math.PI*D/1000*(2*g('d13')/360)*g('d14'):2*g('d15')/1000*g('d16');
    const PV=P*V,lim=g('d17'),wp=w/D*100,ck=[],gr=D>=20&&D<=200?GRV.find(x=>D<=x[0]):null;
    ck.push(wp>=5&&wp<=20?['ok',`Wall thickness is ${fx(wp,1)}% of the shaft diameter (recommended 5–20%).`]:['warn',`Wall thickness is ${fx(wp,1)}% of the shaft diameter, outside the recommended 5–20%.${wp<5?' Thin walls need care when machining and fitting; consider bonding or mechanical securing.':''}`]);
    if(L>D)ck.push(['warn','The bearing is longer than its diameter. Long bearings need additional care when machining and fitting.']);
    if(Number.isFinite(P))ck.push(P<=30?['ok',`Pressure ${fx(P)} MPa is under the 30 MPa maximum design load for static, oscillating or occasional movement. Continuous rotation is limited by PV.`]:['bad',`Pressure ${fx(P)} MPa is over the 30 MPa maximum design load.`]);
    const tl=dry?GRADES[gk][2]:GRADES[gk][1];
    if(Number.isFinite(tx))ck.push(tx<=tl?['ok',`Max temperature ${tx} °C is within the typical ${tl} °C limit for ${GRADES[gk][0].toLowerCase()} ${dry?'dry or lubricated':'immersed'} use.`]:['bad',`Max temperature ${tx} °C is above the typical ${tl} °C limit for ${dry?'dry or lubricated':'immersed'} use. Contact Vesconite about a higher-temperature grade.`]);
    if(pf&&tx>70)ck.push(['warn','Above 70 °C a press fit may loosen. Secure the bearing mechanically or bond it.']);
    if(!pf)ck.push(['warn','No press fit: the bearing must be secured another way (bonding, keeper plate, screws). Outside diameter is taken as the housing diameter.']);
    if(lim>0&&Number.isFinite(PV))ck.push(PV<=lim?['ok',`PV ${fx(PV,1)} is ${Math.round(PV/lim*100)}% of the limit you entered.`]:['bad',`PV ${fx(PV,1)} exceeds the limit you entered (${lim}).`]);
    if(gr&&gr[3]>=w/2)ck.push(['warn','The typical groove depth is half the wall or more. Grooves should be under half the wall thickness; add extra grooves instead of going deeper.']);
    const chn=OD<10?0:OD<=20?0.5:OD<=50?1:OD<=100?1.5:OD<=250?2:3,t20=(x,t)=>x*(1+K*(t-20));
    const rows=[['5–10',7.5],['10–15',12.5],['15–20',17.5],['20–30',25],['30–35',32.5],['35–40',37.5]].map(([b,t])=>`<tr><td>${b} °C</td><td>${fx(t20(OD,t),2)}</td><td>${fx(t20(ID,t),2)}</td><td>${fx((t20(OD,t)-t20(ID,t))/2,2)}</td></tr>`).join('');
    const tOD=tol(OD,.1,.025),tID=tol(ID,.1,.025),tW=tol(w,.5,.025),tL=tol(L,.5,.3),dt=new Date(),drg=`VI-${dt.toISOString().slice(0,10).replace(/-/g,'')}-${Math.round(OD)}-${Math.round(ID)}-${Math.round(L)}`;
    LAST={drg,svg:drawSVG({OD,ID,L,ch:chn||0.5,w,H,D,press,clo,c,g:gk,tOD,tID,tW,tL,pf,drg,date:dt.toLocaleDateString(),who:(ME?.email||'').split('@')[0]})};
    $('#mdr').innerHTML=LAST.svg;MD.hidden=false;
    if(!T3)T3=init3($('#m3'));if(T3)upd3(T3,{OD,ID,L,ch:chn||0.5,g:gk});
    O.innerHTML=`<div class="card"><h2>Bearing dimensions at 20 °C</h2><dl class="spec" style="margin:0">
    <dt>Outside diameter</dt><dd>${fx(OD)} mm ± ${fx(tOD,3)}</dd><dt>Inside diameter</dt><dd>${fx(ID)} mm ± ${fx(tID,3)}</dd>
    <dt>Wall thickness</dt><dd>${fx(w)} mm +0 / −${fx(tW,3)}</dd><dt>Length</dt><dd>${fx(L)} mm +0 / −${fx(tL,2)}</dd>
    <dt>Press fit (interference)</dt><dd>${fx(press,3)} mm</dd><dt>Bore closure</dt><dd>${fx(clo,3)} mm</dd><dt>Assembly clearance</dt><dd>${fx(c,3)} mm</dd><dt>Fitted inside diameter</dt><dd>${fx(D+c,3)} mm</dd>
    <dt>Lead-in chamfer</dt><dd>${chn||'–'} mm × 30°</dd>${gr?`<dt>Typical grooves</dt><dd>${gr[1]} × ${gr[2]} wide × ${gr[3]} deep mm, about ${gr[4]} l/min</dd>`:''}
    ${Number.isFinite(tx)?`<dt>Free-standing ID at ${tx} °C</dt><dd>${fx(t20(ID,tx),2)} mm</dd>`:''}${Number.isFinite(tn)?`<dt>Free-standing ID at ${tn} °C</dt><dd>${fx(t20(ID,tn),2)} mm</dd>`:''}</dl></div>
    <div class="card"><h2>Loading</h2><div class="res"><div><b>${fx(P)}</b><span>MPa pressure</span></div><div><b>${fx(V,1)}</b><span>m/min speed</span></div><div><b>${fx(PV,1)}</b><span>MPa·m/min PV</span></div></div>${Number.isFinite(P)?'':'<p class="mut" style="margin-top:8px">Enter the supported mass to calculate pressure and PV.</p>'}</div>
    <div class="card"><h2>Checks</h2>${ck.map(([k,t])=>`<p class="note ${k}">${k==='ok'?'✓':'⚠'} ${esc(t)}</p>`).join('')}</div>
    <div class="card"><h2>Size to cut at machining temperature</h2><p class="mut">Dimensions above are for a bearing at 20 °C. If you machine it warmer or cooler, cut to these sizes (mm).</p><div style="overflow-x:auto"><table class="tbl"><tr><th>Bearing temp</th><th>OD</th><th>ID</th><th>Wall</th></tr>${rows}</table></div></div>
    <div class="card"><h2>How this is calculated</h2><p class="mut">Press fit = 0.05 + 0.002 × housing Ø. Bore closure = press fit × shaft Ø ÷ housing Ø. Assembly clearance = 0.05 + 0.02 × wall. OD = housing Ø + press fit. ID = shaft Ø + bore closure + assembly clearance. Wall = ½ (OD − ID), solved together with the clearance. Pressure = mass × 9.81 ÷ bearings ÷ (shaft Ø × length). Rotation speed = π × shaft Ø × rpm ÷ 1000; oscillation and linear speeds count each stroke out and back (an assumption). PV = pressure × speed. Thermal change uses 6 × 10⁻⁵ per °C. Tolerances are the standard machining tolerances. Source: Vesconite Pump Bearing Design Manual. Press-fit force and expansion gap are not included.</p></div>
    <button class="btn wide" id="dc" type="button">Copy results</button>`;
    $('#dc').onclick=()=>navigator.clipboard.writeText([`Industrial bearing (${GRADES[gk][0]})`,`Housing ${H} mm, shaft ${D} mm, length ${L} mm, ${pf?'press fit':'no press fit'}`,`OD ${fx(OD)} mm, ID ${fx(ID)} mm, wall ${fx(w)} mm`,`Press fit ${fx(press,3)} mm, bore closure ${fx(clo,3)} mm, assembly clearance ${fx(c,3)} mm`,`P ${fx(P)} MPa, V ${fx(V,1)} m/min, PV ${fx(PV,1)} MPa·m/min`,...ck.map(([k,t])=>(k==='ok'?'OK: ':'CHECK: ')+t)].join('\n')).then(()=>alert('Results copied.'));
  };
  $$('#DF input,#DF select').forEach(i=>{i.addEventListener('input',cv);i.addEventListener('change',cv)});cv();
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
  <section class="card"><h2>Features</h2>${ckb('oem',s.feat.oem,'OEM references')}${ckb('ins',s.feat.ins,'Insights page')}${ckb('qr',s.feat.qr,'Share links and QR codes')}${ckb('pv',s.feat.pv,'Design calculators')}</section>
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
  const ed=can('edit'),m={'':home,library,new:ed?form:home,edit:ed?form:home,app:detail,insights:S.feat.ins?insights:home,oem:S.feat.oem?oem:home,tools,design:S.feat.pv?design:home,admin};
  (m[p]||home)(v,id);
  $$('.tabs a').forEach(a=>a.classList.toggle('on',a.getAttribute('href')==='#/'+(p==='app'||p==='edit'?'library':p==='design'?'tools':p)));
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

/* Pull down to refresh (home-screen app has no browser refresh button) */
(function(){
  const bar=document.createElement('div');bar.id='ptr';bar.textContent='Pull to refresh';document.body.appendChild(bar);
  let y0=0,dy=0,on=false;
  addEventListener('touchstart',e=>{on=scrollY<=0&&e.touches.length===1&&!e.target.closest('.ov,.m3,textarea,input,select');if(on){y0=e.touches[0].clientY;dy=0}},{passive:true});
  addEventListener('touchmove',e=>{if(!on)return;dy=e.touches[0].clientY-y0;if(dy>0){bar.style.transform=`translateY(${Math.min(dy,120)/2-30}px)`;bar.textContent=dy>90?'Release to refresh':'Pull to refresh'}else{on=false;bar.style.transform=''}},{passive:true});
  addEventListener('touchend',()=>{if(on&&dy>90){bar.textContent='Refreshing…';bar.style.transform='translateY(30px)';setTimeout(()=>location.reload(),150)}else bar.style.transform='';on=false},{passive:true});
})();
