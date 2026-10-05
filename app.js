'use strict';
const IND=['Agriculture','Construction','Forestry','Hydraulics','Industrial','Marine','Mining','Pumps','Renewable Energy','Transport','Water & Wastewater','Valves'];
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

/* Storage: IndexedDB (photos fit comfortably, unlike localStorage) */
const db=new Promise((ok,no)=>{const r=indexedDB.open('vi2',1);r.onupgradeneeded=()=>r.result.createObjectStore('a',{keyPath:'id'});r.onsuccess=()=>ok(r.result);r.onerror=()=>no(r.error)});
const tx=async(m,f)=>{const d=await db;return new Promise((ok,no)=>{const t=d.transaction('a',m),q=f(t.objectStore('a'));t.oncomplete=()=>ok(q&&q.result);t.onerror=()=>no(t.error)})};
let A=[];
const load=async()=>{A=(await tx('readonly',s=>s.getAll())).sort((a,b)=>b.date.localeCompare(a.date))};
const save=async r=>{await tx('readwrite',s=>s.put(r));await load()};
const remove=async id=>{await tx('readwrite',s=>s.delete(id));await load()};
const norm=r=>({name:r.name,industry:r.industry||'Other',product:r.product,desc:r.desc??r.description,problem:r.problem,solution:r.solution,proof:r.proof??r.outcome,summary:r.summary??r.customerSummary,orig:r.orig??r.original,env:r.env??r.environment,load:r.load,temp:r.temp??r.temperature,lube:r.lube??r.lubrication,customer:r.customer,author:r.author,photos:(r.photos||(r.photo?[r.photo]:[])).map(p=>p.src||p),id:r.id||crypto.randomUUID(),date:r.date||new Date().toISOString()});

/* Record quality: problem, solution, result, customer-safe summary, 1+ photo */
const score=a=>['problem','solution','proof','summary'].filter(k=>a[k]).length+(a.photos.length?1:0);
const grade=a=>{const s=score(a);return s>=4?['Complete','ok']:s>=2?['Needs detail','warn']:['Draft','bad']};
const chip=a=>{const[g,c]=grade(a);return `<span class="chip ${c}">${g}</span>`};
const row=a=>`<a class="row" href="#/app/${a.id}"><div class="th">${a.photos[0]?`<img src="${a.photos[0]}" alt="">`:'▣'}</div><div><strong>${esc(a.name)}</strong><small>${esc([a.industry,a.product].filter(Boolean).join(' · '))}</small></div>${chip(a)}</a>`;
const shrink=f=>new Promise((ok,no)=>{const u=URL.createObjectURL(f),i=new Image();i.onload=()=>{const s=Math.min(1,1400/Math.max(i.width,i.height)),c=document.createElement('canvas');c.width=Math.round(i.width*s);c.height=Math.round(i.height*s);c.getContext('2d').drawImage(i,0,0,c.width,c.height);URL.revokeObjectURL(u);ok(c.toDataURL('image/jpeg',.72))};i.onerror=no;i.src=u});
const img=s=>new Promise(ok=>{const i=new Image();i.onload=()=>ok(i);i.src=s});

/* Views */
function home(v){
  const need=A.filter(a=>!a.proof||!a.photos.length).slice(0,4);
  v.innerHTML=`<section class="hero"><h1>Every installation, on the record.</h1><p>Capture the problem, the fix and the proof while it is fresh. Then turn the best of it into a customer portfolio.</p><div class="acts"><a class="btn pri" href="#/new">Capture application</a><a class="btn" href="#/library">Open library</a></div></section>
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
  if(!a){v.innerHTML='<a class="back" href="#/library">← Library</a><p class="empty">Record not found on this device.</p>';return}
  const spec=[['Environment',a.env],['Load / speed',a.load],['Temperature',a.temp],['Lubrication',a.lube],['Original material',a.orig],['Customer / OEM',a.customer]].filter(x=>x[1]);
  v.innerHTML=`<a class="back" href="#/library">← Library</a>${a.photos.length?`<div class="strip">${a.photos.map(p=>`<img src="${p}" alt="">`).join('')}</div>`:''}<h1>${esc(a.name)}</h1><div class="meta">${chip(a)}<span>${esc(a.industry)}</span>${a.product?`<span>· ${esc(a.product)}</span>`:''}</div><p class="lead">${esc(a.desc)}</p>
  ${spec.length?`<dl class="spec">${spec.map(([k,x])=>`<dt>${k}</dt><dd>${esc(x)}</dd>`).join('')}</dl>`:''}
  ${[['Problem',a.problem],['Solution',a.solution],['Result',a.proof]].map(([k,x])=>`<section class="story"><h3>${k}</h3><p>${x?esc(x):'<span class="mut">Not recorded yet.</span>'}</p></section>`).join('')}
  <div class="acts"><a class="btn pri" href="#/edit/${a.id}">Edit</a><button class="btn bad" id="dl">Delete</button></div>`;
  $('#dl').onclick=async()=>{if(confirm('Delete this application? This cannot be undone.')){await remove(a.id);location.hash='#/library'}};
}
function form(v,id){
  const a=A.find(x=>x.id===id)||{photos:[]};let ph=[...a.photos];
  const f=(k,l,t,ex='')=>`<label>${l}${t==='area'?`<textarea name="${k}" rows="3">${esc(a[k])}</textarea>`:`<input name="${k}" value="${esc(a[k])}" ${ex}>`}</label>`;
  v.innerHTML=`<a class="back" href="#/${id?'app/'+id:'library'}">← Cancel</a><h1>${id?'Edit':'Capture'} application</h1><form id="F">
  ${f('name','Application name','','required')}<label>Industry<input name="industry" list="il" required value="${esc(a.industry)}"><datalist id="il">${IND.map(i=>`<option>${esc(i)}</option>`).join('')}</datalist></label>${f('product','Product / material')}${f('desc','What does it do, and where is it used?','area')}
  <fieldset><legend>Customer story</legend>${f('problem','Problem','area')}${f('solution','Solution','area')}${f('proof','Result / proof','area')}${f('summary','Customer-safe summary','area')}</fieldset>
  <fieldset><legend>Operating conditions</legend>${f('orig','Original material')}${f('env','Environment')}${f('load','Load / movement / speed')}${f('temp','Temperature')}${f('lube','Lubrication')}${f('customer','Customer / OEM')}</fieldset>
  <fieldset><legend>Photos <small id="pc"></small></legend><div class="pg" id="pg"></div><div class="acts"><label class="btn">Take photo<input type="file" accept="image/*" capture="environment" hidden id="p1"></label><label class="btn">Choose photos<input type="file" accept="image/*" multiple hidden id="p2"></label></div></fieldset>
  ${f('author','Recorded by')}<button class="btn pri wide">Save application</button></form>`;
  const rp=()=>{$('#pg').innerHTML=ph.map((p,i)=>`<figure><img src="${p}" alt=""><button type="button" data-i="${i}" aria-label="Remove photo">×</button></figure>`).join('');$('#pc').textContent=`${ph.length}/10`;$$('#pg button').forEach(b=>b.onclick=()=>{ph.splice(+b.dataset.i,1);rp()})};rp();
  const add=async e=>{for(const fl of [...e.target.files]){if(ph.length>=10){alert('Maximum 10 photos per application.');break}try{ph.push(await shrink(fl))}catch{alert('One photo could not be read.')}}e.target.value='';rp()};
  $('#p1').onchange=add;$('#p2').onchange=add;
  $('#F').onsubmit=async e=>{e.preventDefault();const d=Object.fromEntries(new FormData(e.target)),r={...a,...d,photos:ph,id:a.id||crypto.randomUUID(),date:a.date||new Date().toISOString()};try{await save(r);location.hash='#/app/'+r.id}catch{alert('Could not save. Browser storage may be full or blocked.')}};
}
const count=k=>A.reduce((m,a)=>{const x=a[k]||'Unspecified';m[x]=(m[x]||0)+1;return m},{});
const bars=m=>{const e=Object.entries(m).sort((a,b)=>b[1]-a[1]),mx=Math.max(1,...e.map(x=>x[1]));return e.length?e.map(([k,n])=>`<div class="bar"><span>${esc(k)}</span><i style="--w:${n/mx*100}%"></i><b>${n}</b></div>`).join(''):'<p class="empty">No data yet.</p>'};
function insights(v){
  const q=A.reduce((m,a)=>{const g=grade(a)[0];m[g]=(m[g]||0)+1;return m},{});
  v.innerHTML=`<h1>Insights</h1><div class="card"><h2>By industry</h2>${bars(count('industry'))}</div><div class="card"><h2>By product</h2>${bars(count('product'))}</div><div class="card"><h2>Record quality</h2>${bars(q)}</div>`;
}
async function pdf(ids,cust){
  if(!window.jspdf)return alert('The PDF library did not load. Check your connection and try again.');
  const d=new window.jspdf.jsPDF({unit:'mm',format:'a4'});
  d.setFillColor(14,26,32);d.rect(0,0,210,297,'F');d.setTextColor(255);d.setFontSize(32);d.text(d.splitTextToSize('Vesconite application portfolio',160),20,110);d.setFontSize(14);d.setTextColor(224,166,58);d.text(cust||'Selected applications',20,142);d.setTextColor(190);d.setFontSize(10);d.text(new Date().toLocaleDateString(),20,152);
  for(const id of ids){const a=A.find(x=>x.id===id);if(!a)continue;d.addPage();let y=24;d.setTextColor(14,26,32);d.setFontSize(20);const t=d.splitTextToSize(a.name,170);d.text(t,20,y);y+=t.length*8;d.setFontSize(10);d.setTextColor(90,107,115);d.text([a.industry,a.product].filter(Boolean).join('  |  '),20,y);y+=8;
    if(a.photos[0]){const im=await img(a.photos[0]),h=Math.min(80,170*im.height/im.width),w=h*im.width/im.height;d.addImage(a.photos[0],'JPEG',20,y,w,h);y+=h+8}
    for(const[k,x]of[['Overview',a.summary||a.desc],['Problem',a.problem],['Solution',a.solution],['Result',a.proof]]){if(!x)continue;d.setFontSize(11);d.setTextColor(154,98,0);d.text(k,20,y);y+=5;d.setFontSize(10);d.setTextColor(14,26,32);const l=d.splitTextToSize(x,170);d.text(l,20,y);y+=l.length*4.6+6}}
  d.save('Vesconite-portfolio.pdf');
}
function tools(v){
  v.innerHTML=`<h1>Tools</h1>
  <section class="card"><h2>Bearing PV check</h2><p class="mut">A quick estimate from load, size and speed.</p><div class="g2"><label>Radial load (N)<input id="c1" type="number" inputmode="decimal"></label><label>Shaft diameter (mm)<input id="c2" type="number" inputmode="decimal"></label><label>Bearing length (mm)<input id="c3" type="number" inputmode="decimal"></label><label>Speed (rpm)<input id="c4" type="number" inputmode="decimal"></label><label>PV limit from datasheet (optional)<input id="c5" type="number" inputmode="decimal"></label></div><div class="res" id="cr"><p class="mut">Enter load, diameter, length and speed.</p></div></section>
  <section class="card"><h2>Customer portfolio</h2>${A.length?`<p class="mut">Pick applications for a PDF. Customer names, operating notes and recorded-by are never included.</p><label>Prepared for<input id="pc1" placeholder="Customer or company"></label><div class="pick">${A.map(a=>`<label class="ck"><input type="checkbox" value="${a.id}">${esc(a.name)}</label>`).join('')}</div><button class="btn pri wide" id="pdf">Generate PDF</button>`:'<p class="empty">Capture applications first.</p>'}</section>
  <section class="card"><h2>Data</h2><p class="mut">Records live in this browser. Export a backup before changing device or clearing browser data. Backups from the earlier version import too.</p><div class="acts"><button class="btn" id="ex">Export backup</button><label class="btn">Import backup<input type="file" accept=".json,application/json" hidden id="im"></label><button class="btn bad" id="ca">Delete everything</button></div></section>`;
  const cv=()=>{const[Fo,dd,L,n,lim]=['c1','c2','c3','c4','c5'].map(i=>parseFloat($('#'+i).value));if(!(Fo>0&&dd>0&&L>0&&n>=0)){$('#cr').innerHTML='<p class="mut">Enter load, diameter, length and speed.</p>';return}const P=Fo/(dd*L),V=Math.PI*dd*n/60000,PV=P*V;$('#cr').innerHTML=`<div><b>${P.toFixed(2)}</b><span>MPa pressure</span></div><div><b>${V.toFixed(2)}</b><span>m/s speed</span></div><div><b>${PV.toFixed(2)}</b><span>MPa·m/s PV</span></div>`+(lim>0?`<p class="note ${PV<=lim?'ok':'bad'}">${PV<=lim?`Within the limit you entered (${Math.round(PV/lim*100)}% used).`:'Exceeds the limit you entered.'}</p>`:'')+'<p class="mut">Estimate only. Check the grade\'s published limits before specifying.</p>'};
  $$('#c1,#c2,#c3,#c4,#c5').forEach(i=>i.oninput=cv);
  if($('#pdf'))$('#pdf').onclick=()=>{const ids=$$('.pick input:checked').map(x=>x.value);if(!ids.length)return alert('Select at least one application.');pdf(ids,$('#pc1').value.trim())};
  $('#ex').onclick=()=>{const u=URL.createObjectURL(new Blob([JSON.stringify({v:2,apps:A})],{type:'application/json'})),l=document.createElement('a');l.href=u;l.download=`vi-backup-${new Date().toISOString().slice(0,10)}.json`;l.click();setTimeout(()=>URL.revokeObjectURL(u),1000)};
  $('#im').onchange=async e=>{try{const j=JSON.parse(await e.target.files[0].text()),L=Array.isArray(j)?j:j.apps;if(!Array.isArray(L))throw 0;const ok=L.filter(r=>r&&r.name);for(const r of ok)await tx('readwrite',s=>s.put(norm(r)));await load();alert(`Imported ${ok.length} records.`);render()}catch{alert('That file is not a valid backup.')}};
  $('#ca').onclick=async()=>{if(A.length&&confirm(`Delete all ${A.length} applications from this browser? Export a backup first.`)){await tx('readwrite',s=>s.clear());await load();render()}};
}

/* Router and theme */
function render(){
  const[p='',id]=location.hash.slice(2).split('/'),v=$('#v'),m={'':home,library,new:form,edit:form,app:detail,insights,tools};
  (m[p]||home)(v,id);
  $$('.tabs a').forEach(a=>a.classList.toggle('on',a.getAttribute('href')==='#/'+(p==='app'||p==='edit'?'library':p)));
  scrollTo(0,0);
}
const setT=t=>{document.documentElement.dataset.t=t;$('meta[name=theme-color]').content=t==='dark'?'#0b1317':'#e6eaec';try{localStorage.setItem('vi2t',t)}catch{}};
let t0;try{t0=localStorage.getItem('vi2t')}catch{}
setT(t0||(matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light'));
$('#th').onclick=()=>setT(document.documentElement.dataset.t==='dark'?'light':'dark');
addEventListener('hashchange',render);
load().then(render).catch(()=>{$('#v').innerHTML='<p class="empty">Storage is unavailable in this browser mode (private browsing?). Open the app in a normal window.</p>'});
