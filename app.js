import {initializeApp} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import {getAuth,onAuthStateChanged,signInWithEmailAndPassword,createUserWithEmailAndPassword,signOut,sendPasswordResetEmail,sendEmailVerification,updateProfile,reload} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import {initializeFirestore,collection,doc,getDoc,getDocs,setDoc,deleteDoc,updateDoc,query,orderBy,limit,onSnapshot,where,arrayUnion,arrayRemove} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

const C=window.VI_CONFIG||{};
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const IND='Agriculture,Construction,Forestry,Hydraulics,Industrial,Marine,Mining,Pumps,Renewable Energy,Transport,Water & Wastewater,Valves'.split(',').join('\n');
const SECS=['Overview','Problem','Solution','Result'];
const DS={pri:'#0f3f4a',amb:'#c9861a',r:10,font:'cond',mode:'auto',company:'Vesconite',footer:'',pdfAcc:'#c9861a',cover:'dark',logo:true,pp:1,secs:SECS,feat:{oem:true,ins:true,qr:true,pv:true},bk:{every:7,last:''},dg:{mode:'ask',last:''},ind:IND,dw:{logo:'',logoR:1,showLogo:true,company:'VESCONITE',title:'INDUSTRIAL BEARING BUSH',prefix:'VI',rev:'A',paper:'a3',who:'auto',whoText:'',fit:true,notes:true,noteText:'1. ALL DIMENSIONS IN mm, FOR A FREE-STANDING BUSH AT 20 °C.\n2. TOLERANCES: OD AND ID ±0.1% (MIN ±0.025); WALL +0/−0.5% (MIN −0.025);\n    LENGTH +0/−0.5% (MIN −0.3). STANDARD VESCONITE MACHINING TOLERANCES.\n3. CONTROL WALL THICKNESS AND OUTSIDE DIAMETER WHEN MACHINING.\n4. SIZES FROM THE VESCONITE DESIGN MANUAL EQUATIONS. VERIFY BEFORE MANUFACTURE.\n5. {FIT}'}};
DS.dsc={v:{c:'#8a8d91',a:.3},h:{c:'#efe6cf',a:.6},h10:{c:'#e6dcc0',a:.55},h20:{c:'#ddd0ab',a:.55},s:{c:'#7fa3b8',a:.35},t150:{c:'#d9822b',a:.3},t160:{c:'#c9472b',a:.3},t230:{c:'#8f2d2d',a:.3},f:{c:'#3d3d42',a:.3},n:{c:'#d8d2c4',a:.55},pc:{c:'#c5ccd2',a:.55}};
let S={...DS},MYN='',ME=null,ROLE=null,A=[],O=[],P=[],ready=false,au,db;
try{P=JSON.parse(localStorage.getItem('vi4p')||'[]')}catch{}
const can=k=>k==='edit'?['admin','editor'].includes(ROLE):ROLE==='admin';
const dc=(n,i)=>doc(db,n,i),col=n=>collection(db,n);
const byDate=(x,y)=>(y.date||'').localeCompare(x.date||'');
const T=(p,ms=40000)=>Promise.race([p,new Promise((_,no)=>setTimeout(()=>no(new Error('Timed out. Check your connection and try again. If it keeps happening, check that the Firestore database exists and the rules are published.')),ms))]);
const clean=o=>JSON.parse(JSON.stringify(o));
const LIBS={three:['https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js','https://cdn.jsdelivr.net/npm/three@0.128.0/build/three.min.js'],qr:['https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js','https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js']},LP={};
const lib=k=>LP[k]||(LP[k]=(async()=>{for(const u of LIBS[k]){try{await new Promise((ok,no)=>{const s=document.createElement('script');s.src=u;s.onload=ok;s.onerror=no;document.head.appendChild(s)});return}catch{}}delete LP[k];throw new Error('Could not load the '+k+' library. Check your connection.')})());
const OKR=['admin','editor','viewer'];
const cacheSave=()=>{try{localStorage.setItem('vi4d',JSON.stringify({uid:ME&&ME.uid,role:ROLE,nm:MYN,A,O}))}catch{}};
const cacheGet=()=>{try{return JSON.parse(localStorage.getItem('vi4d')||'null')}catch{return null}};
const log=(action,target='',detail='')=>{if(!ME||!db)return;setDoc(dc('activity',crypto.randomUUID()),{t:new Date().toISOString(),uid:ME.uid,email:ME.email||'',name:MYN||'',action,target:String(target||''),detail:String(detail||'')}).catch(()=>{})};
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
const mergeS=d=>({...DS,...d,feat:{...DS.feat,...(d.feat||{})},dw:{...DS.dw,...(d.dw||{})},bk:{...DS.bk,...(d.bk||{})},dg:{...DS.dg,...(d.dg||{})},dsc:{...DS.dsc,...(d.dsc||{})}});
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
const DOMAINS=['vesconite.com','vesconite.co.za'];
const okDomain=e=>DOMAINS.includes(((e||'').toLowerCase().split('@')[1]||'').trim());
const busy=(b,t)=>{b.disabled=true;b.dataset.l=b.innerHTML;b.innerHTML=`<span class="spn"></span>${t}`;return()=>{b.disabled=false;b.innerHTML=b.dataset.l}};
const authErr=x=>({'vi/domain':'Sign-up is limited to @vesconite.com and @vesconite.co.za email addresses.','auth/invalid-credential':'Wrong email or password.','auth/wrong-password':'Wrong email or password.','auth/user-not-found':'Wrong email or password.','auth/invalid-email':'That email address does not look right.','auth/email-already-in-use':'An account with that email already exists. Sign in instead, or use Forgot password.','auth/weak-password':'Choose a password of at least 6 characters.','auth/too-many-requests':'Too many attempts. Wait a few minutes and try again.','auth/network-request-failed':'No connection. Check your internet and try again.'}[x&&x.code]||String((x&&x.message)||x).replace('Firebase: ',''));
async function notifyAdmin(u,name){   /* optional email to the admins through EmailJS (see README); silent when not configured */
  const E=C.emailjs;if(!E||!E.service||!E.template||!E.key)return;
  try{await fetch('https://api.emailjs.com/api/v1.0/email/send',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({service_id:E.service,template_id:E.template,user_id:E.key,template_params:{name:name||'(no name given)',email:u.email||'',when:new Date().toLocaleString(),link:location.href.split('#')[0]+'#/admin'}})})}catch{}
}
/* ---------- Weekly digest to the admins (EmailJS, see README). Runs from an admin's browser: no server needed. ---------- */
const dgOn=()=>{const E=C.emailjs;return !!(E&&E.service&&E.digest&&E.key)};
const dgDue=()=>{if(!can('admin')||!dgOn()||!S.dg||S.dg.mode==='off')return false;const l=S.dg.last?Date.parse(S.dg.last):0;return !l||Date.now()-l>7*864e5};
async function dgBuild(days=7){
  const cs=new Date(Date.now()-days*864e5).toISOString(),ds=cs.slice(0,10);
  const[m,q]=await Promise.all([getDocs(col('members')),getDocs(query(col('activity'),orderBy('t','desc'),limit(500)))]);
  const mem=m.docs.map(d=>d.data()),act=q.docs.map(d=>d.data()).filter(x=>x.t>=cs);
  const admins=[...new Set(mem.filter(x=>x.role==='admin'&&x.email).map(x=>x.email))],pend=mem.filter(x=>x.role==='pending');
  const nw=A.filter(a=>(a.date||'')>=ds).sort(byDate),by={};nw.forEach(a=>{const k=(a.author||'').trim()||'Not recorded';by[k]=(by[k]||0)+1});
  const top=Object.entries(by).sort((a,b)=>b[1]-a[1]).slice(0,5),who=new Set(act.map(x=>x.name||x.email).filter(Boolean));
  const skip=['Opened data sheet','Made drawing PDF','Downloaded STEP'],cnt={};act.filter(x=>!skip.includes(x.action)).forEach(x=>cnt[x.action]=(cnt[x.action]||0)+1);
  const L=[`${S.company} Intelligence: weekly digest`,`${new Date(cs).toLocaleDateString()} to ${new Date().toLocaleDateString()}`,'',
    `Applications in the library: ${A.length}`,`New this week: ${nw.length}`];
  nw.slice(0,10).forEach(a=>L.push(`  - ${a.name} (${a.industry||'Other'})${a.author?' by '+a.author:''}`));if(nw.length>10)L.push(`  ...and ${nw.length-10} more`);
  if(top.length){L.push('','Top contributors');top.forEach(([k,n])=>L.push(`  - ${k}: ${n}`))}
  L.push('',`Team members active: ${who.size}`);
  const ce=Object.entries(cnt).sort((a,b)=>b[1]-a[1]).slice(0,8);if(ce.length){L.push('','What people did');ce.forEach(([k,n])=>L.push(`  - ${k}: ${n}`))}
  L.push('',pend.length?`Waiting for approval: ${pend.length} (${pend.slice(0,5).map(x=>x.name||x.email).join(', ')}${pend.length>5?', ...':''})`:'Nobody is waiting for approval.');
  L.push('',`Open the app: ${location.href.split('#')[0]}`);
  return{admins:admins.length?admins:[ME.email].filter(Boolean),subject:`${S.company} Intelligence weekly digest: ${nw.length} new application${nw.length===1?'':'s'}`,message:L.join('\n')};
}
async function dgSend(btn){
  if(!dgOn())return alert('The digest email is not set up yet. See the README: add the digest template ID to config.js.');
  const done=btn?busy(btn,'Sending…'):()=>{};
  try{const E=C.emailjs,d=await dgBuild(),now=new Date().toISOString();
    await setDoc(dc('settings','app'),{dg:{...S.dg,last:now}},{merge:true});S.dg={...S.dg,last:now};try{localStorage.setItem('vi4s',JSON.stringify(S))}catch{}
    let ok=0;for(const to of d.admins){const r=await fetch('https://api.emailjs.com/api/v1.0/email/send',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({service_id:E.service,template_id:E.digest,user_id:E.key,template_params:{to_email:to,subject:d.subject,message:d.message,company:S.company}})});if(r.ok)ok++}
    log('Sent weekly digest',`${ok} of ${d.admins.length} admins`);done();return ok}
  catch(x){done();alert('Could not send the digest: '+(x.message||x));return 0}
}
function login(v,mode='in'){
  const up=mode==='up',fg=mode==='fg';
  v.innerHTML=`<h1>${up?'Create account':fg?'Reset password':'Sign in'}</h1><form id="LF" novalidate>${up?'<label>Full name<input name="n" required autocomplete="name" maxlength="60"></label>':''}<label>Email<input name="e" type="email" required autocomplete="username" placeholder="you@vesconite.com"></label>${fg?'':`<label>Password<input name="p" type="password" required minlength="6" autocomplete="${up?'new-password':'current-password'}"></label>`}<p class="note" id="LM" role="status" aria-live="polite" hidden></p><button class="btn pri wide" id="LB">${up?'Create account':fg?'Send reset link':'Sign in'}</button></form>
  <p style="margin:14px 0 0">${mode==='in'?'<a href="#" data-m="fg">Forgot password?</a><br><a href="#" data-m="up">New here? Create an account</a>':'<a href="#" data-m="in">Back to sign in</a>'}</p>
  <p class="mut" style="margin-top:14px">${up?'Sign-up is open to @vesconite.com and @vesconite.co.za email addresses. We will email you a link to verify your address, then an admin approves your access.':'New accounts need approval from an admin before they can see any data.'}</p>`;
  $$('[data-m]').forEach(a=>a.onclick=e=>{e.preventDefault();login(v,a.dataset.m)});
  const msg=(t,k)=>{const m=$('#LM');m.hidden=!t;m.textContent=t||'';m.className='note '+(k||'')};
  $('#LF').onsubmit=async e=>{e.preventDefault();const f=new FormData(e.target),em=(f.get('e')||'').trim(),p=f.get('p')||'',nm=(f.get('n')||'').trim();
    if(!em||(!fg&&p.length<6)||(up&&!nm)){msg(up&&!nm?'Enter your full name.':!em?'Enter your email address.':'Enter your password (at least 6 characters).','bad');return}
    msg('');const done=busy($('#LB'),up?'Creating account…':fg?'Sending…':'Signing in…');
    try{
      if(fg){await sendPasswordResetEmail(au,em);msg('If an account exists for that email, a reset link is on its way. Check your inbox and spam folder.','ok');done();return}
      if(up){if(!okDomain(em))throw{code:'vi/domain'};try{localStorage.setItem('vi4pn',nm)}catch{}const cr=await createUserWithEmailAndPassword(au,em,p);updateProfile(cr.user,{displayName:nm}).catch(()=>{});sendEmailVerification(cr.user).catch(()=>{});return}
      await signInWithEmailAndPassword(au,em,p);
    }catch(x){msg(authErr(x),'bad');done()}
  };
}
function verify(v){
  v.innerHTML=`<h1>Check your email</h1><p class="lead">We sent a verification link to <b>${esc(ME.email)}</b>. Open it, then press Continue. If it is not there after a minute or two, look in your spam folder.</p><p class="note" id="VM" hidden></p><button class="btn pri wide" id="vc">I have verified, continue</button><button class="btn wide" id="vr" style="margin-top:10px">Send the email again</button><button class="btn wide" id="so" style="margin-top:10px">Sign out</button>`;
  const msg=(t,k)=>{const m=$('#VM');m.hidden=!t;m.textContent=t||'';m.className='note '+(k||'')};
  $('#so').onclick=()=>signOut(au);
  $('#vc').onclick=async()=>{const done=busy($('#vc'),'Checking…');msg('');try{await reload(ME);await ME.getIdToken(true);if(!ME.emailVerified){msg('Not verified yet. Open the link in the email first.','bad');done();return}await boot(ME)}catch(x){msg(authErr(x),'bad');done()}};
  $('#vr').onclick=async()=>{const done=busy($('#vr'),'Sending…');msg('');try{await sendEmailVerification(ME);msg('Sent. Check your inbox and spam folder.','ok')}catch(x){msg(authErr(x),'bad')}done()};
}
function blocked(v){v.innerHTML=`<h1>Access is limited</h1><p class="lead">Sign-up is open to @vesconite.com and @vesconite.co.za email addresses. Your account (${esc(ME.email)}) is not one of them, so it cannot be approved. Ask an admin if you think this is a mistake.</p><button class="btn" id="so">Sign out</button>`;$('#so').onclick=()=>signOut(au)}
function pending(v){v.innerHTML=`<h1>Waiting for approval</h1><p class="lead">Your account (${esc(ME.email)}) is created. An admin needs to give you access.</p><button class="btn" id="so">Sign out</button>`;$('#so').onclick=()=>signOut(au)}
const dgSnoozed=()=>{try{return Date.now()<(+localStorage.getItem('vi4dgs')||0)}catch{return false}};
const bkDue=()=>{if(!can('admin')||!S.bk||!(S.bk.every>0))return false;let sn=0;try{sn=+localStorage.getItem('vi4bks')||0}catch{}if(Date.now()<sn)return false;const l=S.bk.last?Date.parse(S.bk.last):0;return !l||Date.now()-l>S.bk.every*864e5};
async function exportBackup(btn,label='Export backup'){
  if(btn)btn.textContent='Preparing…';
  try{const apps=[];for(const a of A){const{thumb,...r}=a;r.photos=await Promise.all(a.photos.map(getFile));apps.push(r)}
    const u=URL.createObjectURL(new Blob([JSON.stringify({v:4,apps})],{type:'application/json'})),l=document.createElement('a');l.href=u;l.download=`vi-backup-${new Date().toISOString().slice(0,10)}.json`;l.click();setTimeout(()=>URL.revokeObjectURL(u),1000);
    log('Exported backup');S.bk={...S.bk,last:new Date().toISOString()};try{localStorage.setItem('vi4s',JSON.stringify(S));localStorage.removeItem('vi4bks')}catch{}
    setDoc(dc('settings','app'),{bk:S.bk},{merge:true}).catch(()=>{});return true}
  catch(x){alert(x.message);return false}finally{if(btn)btn.textContent=label}
}
async function saveName(n,btn){n=(n||'').trim().slice(0,60);if(!n){alert('Enter your name.');return false}const done=btn?busy(btn,'Saving…'):()=>{};try{await updateDoc(dc('members',ME.uid),{name:n});MYN=n;cacheSave();done();if(btn)btn.textContent='Saved ✓';return true}catch(x){alert(x.message);done();return false}}
function home(v){
  const need=A.filter(a=>!a.proof||!a.photos.length).slice(0,4);
  v.innerHTML=`${!MYN?`<section class="card bkb"><b>What should we call you?</b><p class="mut">Your name shows next to your applications and on the leaderboard.</p><div class="acts"><input id="hn" placeholder="Full name" maxlength="60" style="flex:1;min-width:160px"><button class="btn pri" id="hns" type="button">Save</button></div></section>`:''}<a class="card bkb" id="cun" href="#/chats" ${cCount()?'':'hidden'}><b>You have unread messages</b><p class="mut">Open Chats to read them.</p></a>${dgDue()&&S.dg.mode==='ask'&&!dgSnoozed()?`<section class="card bkb"><b>Weekly digest is ready</b><p class="mut">${S.dg.last?'Last sent '+new Date(S.dg.last).toLocaleDateString()+'.':'None sent yet.'} Email a summary of the week to all admins.</p><div class="acts"><button class="btn pri" id="dgn">Send to admins</button><button class="btn" id="dgp">Preview</button><button class="btn" id="dgs">Not now</button></div></section>`:''}${bkDue()?`<section class="card bkb"><b>Time for a backup</b><p class="mut">${S.bk.last?'Last backup was '+new Date(S.bk.last).toLocaleDateString()+'.':'No backup has been taken yet.'} Download one now so nothing is lost.</p><div class="acts"><button class="btn pri" id="bkn">Back up now</button><button class="btn" id="bks">Remind me tomorrow</button></div></section>`:''}<section class="hero"><h1>Every installation, on the record.</h1><p>Capture the problem, the fix and the proof while it is fresh. Then turn the best of it into a customer portfolio.</p><div class="acts">${can('edit')?'<a class="btn pri" href="#/new">Capture application</a>':''}<a class="btn" href="#/library">Open library</a>${S.feat.ins?'<a class="btn" href="#/insights">Insights</a>':''}</div></section>
  <div class="stats"><div><b>${A.length}</b><span>applications</span></div><div><b>${new Set(A.map(a=>a.industry)).size}</b><span>industries</span></div><div><b>${A.reduce((n,a)=>n+a.photos.length,0)}</b><span>photos</span></div></div>
  ${A.length?charts():''}<h2>Needs evidence</h2>${need.length?`<div class="list">${need.map(row).join('')}</div>`:`<p class="empty">${A.length?'Every record has a result and a photo.':'Nothing captured yet. Start with your best-known installation.'}</p>`}
  ${A.length?`<h2>Recent</h2><div class="list">${A.slice(0,3).map(row).join('')}</div>`:''}`;
  eggTap(v);
  const hs=$('#hns');if(hs)hs.onclick=async()=>{if(await saveName($('#hn').value,hs))home(v)};
  const dn=$('#dgn');if(dn){dn.onclick=async()=>{if(await dgSend(dn))home(v)};$('#dgp').onclick=async()=>{try{alert((await dgBuild()).message)}catch(x){alert(x.message)}};$('#dgs').onclick=()=>{try{localStorage.setItem('vi4dgs',Date.now()+864e5)}catch{}home(v)}}
  if(dgDue()&&S.dg.mode==='auto'&&!window.__dga){window.__dga=1;dgSend()}
  const bn=$('#bkn');if(bn){bn.onclick=async()=>{if(await exportBackup(bn,'Back up now'))home(v)};$('#bks').onclick=()=>{try{localStorage.setItem('vi4bks',Date.now()+864e5)}catch{}home(v)}}
}
/* ---------- Trophies for Bush Hop ---------- */
const TSVG={"pump":"<rect x=\"4\" y=\"52\" width=\"56\" height=\"5\" rx=\"2\" fill=\"#2f3a43\"/><rect x=\"38\" y=\"28\" width=\"20\" height=\"18\" rx=\"3\" fill=\"#2f7de1\"/><rect x=\"34\" y=\"34\" width=\"6\" height=\"6\" fill=\"#6d7a86\"/><rect x=\"19\" y=\"12\" width=\"10\" height=\"14\" fill=\"#aab4bd\"/><rect x=\"16\" y=\"9\" width=\"16\" height=\"5\" rx=\"1.5\" fill=\"#6d7a86\"/><rect x=\"2\" y=\"34\" width=\"12\" height=\"9\" fill=\"#6d7a86\"/><circle cx=\"24\" cy=\"38\" r=\"15\" fill=\"#aab4bd\"/><circle cx=\"24\" cy=\"38\" r=\"9\" fill=\"#6d7a86\"/><circle cx=\"24\" cy=\"38\" r=\"3.5\" fill=\"#2f3a43\"/><rect x=\"14\" y=\"50\" width=\"20\" height=\"3\" fill=\"#2f3a43\"/>","propeller":"<g transform=\"translate(32 32)\"><g transform=\"rotate(0)\"><path d=\"M0 -4 C 11 -9 13 -22 4 -29 C -5 -25 -9 -12 0 -4Z\" fill=\"#e0a526\" stroke=\"#a06c10\" stroke-width=\"1.2\"/></g><g transform=\"rotate(120)\"><path d=\"M0 -4 C 11 -9 13 -22 4 -29 C -5 -25 -9 -12 0 -4Z\" fill=\"#e0a526\" stroke=\"#a06c10\" stroke-width=\"1.2\"/></g><g transform=\"rotate(240)\"><path d=\"M0 -4 C 11 -9 13 -22 4 -29 C -5 -25 -9 -12 0 -4Z\" fill=\"#e0a526\" stroke=\"#a06c10\" stroke-width=\"1.2\"/></g><circle r=\"6.5\" fill=\"#2f3a43\"/><circle r=\"2.6\" fill=\"#aab4bd\"/></g>","excavator":"<rect x=\"4\" y=\"46\" width=\"36\" height=\"11\" rx=\"5.5\" fill=\"#2f3a43\"/><circle cx=\"10\" cy=\"51.5\" r=\"3\" fill=\"#6d7a86\"/><circle cx=\"34\" cy=\"51.5\" r=\"3\" fill=\"#6d7a86\"/><rect x=\"8\" y=\"33\" width=\"28\" height=\"13\" rx=\"2\" fill=\"#e0a526\"/><path d=\"M10 33V23H24V33Z\" fill=\"#8fd0ff\" stroke=\"#2f3a43\" stroke-width=\"1.6\"/><path d=\"M30 36L44 14L56 22\" fill=\"none\" stroke=\"#e0a526\" stroke-width=\"5\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><path d=\"M56 22L52 38\" stroke=\"#e0a526\" stroke-width=\"4\" stroke-linecap=\"round\"/><path d=\"M44 40L58 37L58 47L47 49Z\" fill=\"#6d7a86\" stroke=\"#2f3a43\" stroke-width=\"1.6\"/>","drill":"<path d=\"M36 58H62\" stroke=\"#8a5a2b\" stroke-width=\"3\"/><g transform=\"rotate(-12 46 30)\"><rect x=\"42\" y=\"3\" width=\"8\" height=\"48\" rx=\"2\" fill=\"#6d7a86\"/><rect x=\"45\" y=\"10\" width=\"2\" height=\"40\" fill=\"#aab4bd\"/><path d=\"M43 51L46 60L49 51Z\" fill=\"#2f3a43\"/></g><rect x=\"4\" y=\"48\" width=\"34\" height=\"9\" rx=\"4.5\" fill=\"#2f3a43\"/><rect x=\"8\" y=\"36\" width=\"28\" height=\"12\" rx=\"2\" fill=\"#e0a526\"/><rect x=\"11\" y=\"27\" width=\"10\" height=\"9\" fill=\"#8fd0ff\" stroke=\"#2f3a43\" stroke-width=\"1.4\"/>","waterjet":"<path d=\"M0 50Q8 46 16 50T32 50T48 50T64 50V64H0Z\" fill=\"#2f7de1\" opacity=\".45\"/><path d=\"M4 18H36L44 34H4Z\" fill=\"#6d7a86\"/><rect x=\"14\" y=\"24\" width=\"28\" height=\"16\" rx=\"3\" fill=\"#aab4bd\"/><circle cx=\"23\" cy=\"32\" r=\"6\" fill=\"#2f3a43\"/><path d=\"M19 29L27 35M19 35L27 29\" stroke=\"#aab4bd\" stroke-width=\"1.2\"/><path d=\"M42 26L53 30V38L42 42Z\" fill=\"#e0a526\"/><path d=\"M53 34Q59 30 62 20M53 34H63M53 34Q59 40 62 48\" stroke=\"#8fd0ff\" stroke-width=\"3\" fill=\"none\" stroke-linecap=\"round\"/>","vane":"<rect x=\"29\" y=\"1\" width=\"7\" height=\"7\" fill=\"#6d7a86\"/><rect x=\"29\" y=\"56\" width=\"7\" height=\"7\" fill=\"#6d7a86\"/><circle cx=\"32\" cy=\"32\" r=\"26\" fill=\"#aab4bd\"/><circle cx=\"32\" cy=\"32\" r=\"21\" fill=\"#2f3a43\"/><circle cx=\"28\" cy=\"34\" r=\"11\" fill=\"#e0a526\" stroke=\"#a06c10\" stroke-width=\"1.2\"/><path d=\"M39 34L52 31M28 23L30 12M17 34L11 33M28 45L32 52\" stroke=\"#efe6cf\" stroke-width=\"3.2\" stroke-linecap=\"round\"/><circle cx=\"28\" cy=\"34\" r=\"3.2\" fill=\"#2f3a43\"/>","conveyor":"<path d=\"M14 42L9 60M50 42L55 60\" stroke=\"#2f3a43\" stroke-width=\"3.5\" stroke-linecap=\"round\"/><rect x=\"5\" y=\"35\" width=\"54\" height=\"11\" rx=\"5.5\" fill=\"#2f3a43\"/><circle cx=\"11\" cy=\"40.5\" r=\"5\" fill=\"#6d7a86\"/><circle cx=\"53\" cy=\"40.5\" r=\"5\" fill=\"#6d7a86\"/><path d=\"M14 35L18 26L26 23L31 35Z\" fill=\"#8a5a2b\"/><path d=\"M30 35L33 21L42 19L47 35Z\" fill=\"#6b4a26\"/><path d=\"M45 35L48 28L55 28L58 35Z\" fill=\"#a4733a\"/>","seeder":"<path d=\"M8 8H56L48 26H16Z\" fill=\"#3a9a5b\"/><rect x=\"6\" y=\"5\" width=\"52\" height=\"5\" rx=\"2.5\" fill=\"#2f3a43\"/><path d=\"M20 26V45M32 26V45M44 26V45\" stroke=\"#6d7a86\" stroke-width=\"3.5\"/><g fill=\"#aab4bd\" stroke=\"#2f3a43\" stroke-width=\"1.6\"><circle cx=\"20\" cy=\"49\" r=\"6.5\"/><circle cx=\"32\" cy=\"49\" r=\"6.5\"/><circle cx=\"44\" cy=\"49\" r=\"6.5\"/></g><path d=\"M2 59H62\" stroke=\"#8a5a2b\" stroke-width=\"3\"/><g fill=\"#e0a526\"><circle cx=\"12\" cy=\"56\" r=\"1.6\"/><circle cx=\"26\" cy=\"57\" r=\"1.6\"/><circle cx=\"38\" cy=\"56\" r=\"1.6\"/><circle cx=\"52\" cy=\"57\" r=\"1.6\"/></g>","crusher":"<path d=\"M18 4L22 10L27 4L34 6L38 10L36 15H20Z\" fill=\"#8a5a2b\"/><rect x=\"6\" y=\"14\" width=\"40\" height=\"46\" rx=\"3\" fill=\"#2f3a43\"/><path d=\"M12 16H20V54H12Z\" fill=\"#aab4bd\"/><path d=\"M38 16H45L32 54H24Z\" fill=\"#e0a526\"/><path d=\"M45 40L58 46M45 52L58 46\" stroke=\"#aab4bd\" stroke-width=\"3.5\" stroke-linecap=\"round\"/><circle cx=\"54\" cy=\"22\" r=\"8\" fill=\"#aab4bd\" stroke=\"#2f3a43\" stroke-width=\"2\"/><circle cx=\"54\" cy=\"22\" r=\"2.5\" fill=\"#2f3a43\"/>","rudder":"<rect x=\"29\" y=\"3\" width=\"6\" height=\"22\" rx=\"2\" fill=\"#aab4bd\"/><rect x=\"25\" y=\"12\" width=\"14\" height=\"3.5\" fill=\"#6d7a86\"/><path d=\"M24 22H40Q49 38 40 58H24Q15 38 24 22Z\" fill=\"#2f7de1\" stroke=\"#2f3a43\" stroke-width=\"1.8\"/><path d=\"M32 25V56\" stroke=\"#8fd0ff\" stroke-width=\"1.6\"/><rect x=\"22\" y=\"31\" width=\"20\" height=\"3.5\" fill=\"#2f3a43\"/><rect x=\"22\" y=\"45\" width=\"20\" height=\"3.5\" fill=\"#2f3a43\"/><path d=\"M0 54Q8 50 16 54T32 54T48 54T64 54V64H0Z\" fill=\"#2f7de1\" opacity=\".55\"/>","pelton":"<circle cx=\"36\" cy=\"34\" r=\"16\" fill=\"none\" stroke=\"#aab4bd\" stroke-width=\"2.5\"/><g transform=\"rotate(0 36 34)\"><ellipse cx=\"36\" cy=\"12\" rx=\"5.5\" ry=\"8\" fill=\"#e0a526\" stroke=\"#a06c10\" stroke-width=\"1.2\"/></g><g transform=\"rotate(45 36 34)\"><ellipse cx=\"36\" cy=\"12\" rx=\"5.5\" ry=\"8\" fill=\"#e0a526\" stroke=\"#a06c10\" stroke-width=\"1.2\"/></g><g transform=\"rotate(90 36 34)\"><ellipse cx=\"36\" cy=\"12\" rx=\"5.5\" ry=\"8\" fill=\"#e0a526\" stroke=\"#a06c10\" stroke-width=\"1.2\"/></g><g transform=\"rotate(135 36 34)\"><ellipse cx=\"36\" cy=\"12\" rx=\"5.5\" ry=\"8\" fill=\"#e0a526\" stroke=\"#a06c10\" stroke-width=\"1.2\"/></g><g transform=\"rotate(180 36 34)\"><ellipse cx=\"36\" cy=\"12\" rx=\"5.5\" ry=\"8\" fill=\"#e0a526\" stroke=\"#a06c10\" stroke-width=\"1.2\"/></g><g transform=\"rotate(225 36 34)\"><ellipse cx=\"36\" cy=\"12\" rx=\"5.5\" ry=\"8\" fill=\"#e0a526\" stroke=\"#a06c10\" stroke-width=\"1.2\"/></g><g transform=\"rotate(270 36 34)\"><ellipse cx=\"36\" cy=\"12\" rx=\"5.5\" ry=\"8\" fill=\"#e0a526\" stroke=\"#a06c10\" stroke-width=\"1.2\"/></g><g transform=\"rotate(315 36 34)\"><ellipse cx=\"36\" cy=\"12\" rx=\"5.5\" ry=\"8\" fill=\"#e0a526\" stroke=\"#a06c10\" stroke-width=\"1.2\"/></g><circle cx=\"36\" cy=\"34\" r=\"7\" fill=\"#6d7a86\"/><circle cx=\"36\" cy=\"34\" r=\"2.6\" fill=\"#2f3a43\"/><path d=\"M2 8L24 15\" stroke=\"#8fd0ff\" stroke-width=\"4.5\" stroke-linecap=\"round\"/><circle cx=\"6\" cy=\"16\" r=\"1.8\" fill=\"#8fd0ff\"/><circle cx=\"12\" cy=\"20\" r=\"1.5\" fill=\"#8fd0ff\"/>","wind":"<path d=\"M30 28L27 60H37L34 28Z\" fill=\"#aab4bd\"/><rect x=\"16\" y=\"60\" width=\"32\" height=\"3.5\" rx=\"1.5\" fill=\"#3a9a5b\"/><g transform=\"rotate(0 32 25)\"><path d=\"M30.2 22L32 1.5L33.8 22Z\" fill=\"#efe6cf\" stroke=\"#6d7a86\" stroke-width=\".9\"/></g><g transform=\"rotate(120 32 25)\"><path d=\"M30.2 22L32 1.5L33.8 22Z\" fill=\"#efe6cf\" stroke=\"#6d7a86\" stroke-width=\".9\"/></g><g transform=\"rotate(240 32 25)\"><path d=\"M30.2 22L32 1.5L33.8 22Z\" fill=\"#efe6cf\" stroke=\"#6d7a86\" stroke-width=\".9\"/></g><circle cx=\"32\" cy=\"25\" r=\"4\" fill=\"#6d7a86\"/><circle cx=\"32\" cy=\"25\" r=\"1.6\" fill=\"#aab4bd\"/>","tractor":"<path d=\"M12 38V14H32V38Z\" fill=\"#3a9a5b\"/><path d=\"M15 17H29V31H15Z\" fill=\"#8fd0ff\"/><path d=\"M32 28H50L57 38V48H32Z\" fill=\"#3a9a5b\"/><rect x=\"47\" y=\"16\" width=\"3.5\" height=\"14\" fill=\"#2f3a43\"/><circle cx=\"20\" cy=\"46\" r=\"14\" fill=\"#2f3a43\"/><circle cx=\"20\" cy=\"46\" r=\"8\" fill=\"#e0a526\"/><circle cx=\"20\" cy=\"46\" r=\"3\" fill=\"#2f3a43\"/><circle cx=\"51\" cy=\"53\" r=\"8\" fill=\"#2f3a43\"/><circle cx=\"51\" cy=\"53\" r=\"4\" fill=\"#e0a526\"/>","mixer":"<rect x=\"3\" y=\"47\" width=\"58\" height=\"5\" fill=\"#2f3a43\"/><path d=\"M42 47V27H52L59 38V47Z\" fill=\"#e0a526\"/><path d=\"M45 30H51L55 38H45Z\" fill=\"#8fd0ff\"/><g transform=\"rotate(-16 22 34)\"><ellipse cx=\"22\" cy=\"34\" rx=\"20\" ry=\"12.5\" fill=\"#aab4bd\" stroke=\"#2f3a43\" stroke-width=\"1.6\"/><path d=\"M6 30Q12 42 19 29T34 38\" stroke=\"#e0a526\" stroke-width=\"2.6\" fill=\"none\"/></g><g fill=\"#2f3a43\"><circle cx=\"13\" cy=\"54\" r=\"6\"/><circle cx=\"31\" cy=\"54\" r=\"6\"/><circle cx=\"50\" cy=\"54\" r=\"6\"/></g><g fill=\"#6d7a86\"><circle cx=\"13\" cy=\"54\" r=\"2.5\"/><circle cx=\"31\" cy=\"54\" r=\"2.5\"/><circle cx=\"50\" cy=\"54\" r=\"2.5\"/></g>","valve":"<rect x=\"1\" y=\"34\" width=\"62\" height=\"14\" fill=\"#6d7a86\"/><rect x=\"5\" y=\"29\" width=\"7\" height=\"24\" fill=\"#aab4bd\"/><rect x=\"52\" y=\"29\" width=\"7\" height=\"24\" fill=\"#aab4bd\"/><ellipse cx=\"32\" cy=\"42\" rx=\"15\" ry=\"15\" fill=\"#aab4bd\" stroke=\"#2f3a43\" stroke-width=\"1.6\"/><rect x=\"25\" y=\"22\" width=\"14\" height=\"14\" fill=\"#6d7a86\"/><rect x=\"30.5\" y=\"9\" width=\"3\" height=\"15\" fill=\"#2f3a43\"/><ellipse cx=\"32\" cy=\"9\" rx=\"15\" ry=\"4\" fill=\"none\" stroke=\"#d0503a\" stroke-width=\"3.2\"/><path d=\"M17 9H47\" stroke=\"#d0503a\" stroke-width=\"2\"/>","cylinder":"<rect x=\"10\" y=\"26\" width=\"34\" height=\"15\" rx=\"3\" fill=\"#2f7de1\"/><rect x=\"16\" y=\"26\" width=\"3.5\" height=\"15\" fill=\"#8fd0ff\"/><rect x=\"35\" y=\"26\" width=\"3.5\" height=\"15\" fill=\"#8fd0ff\"/><rect x=\"42\" y=\"31\" width=\"16\" height=\"5\" fill=\"#aab4bd\"/><circle cx=\"59\" cy=\"33.5\" r=\"4.6\" fill=\"none\" stroke=\"#aab4bd\" stroke-width=\"3\"/><circle cx=\"6\" cy=\"33.5\" r=\"4.6\" fill=\"none\" stroke=\"#aab4bd\" stroke-width=\"3\"/><rect x=\"16\" y=\"19\" width=\"6\" height=\"8\" fill=\"#6d7a86\"/><rect x=\"33\" y=\"19\" width=\"6\" height=\"8\" fill=\"#6d7a86\"/>","wagon":"<rect x=\"2\" y=\"57\" width=\"60\" height=\"3\" fill=\"#6d7a86\"/><rect x=\"6\" y=\"20\" width=\"52\" height=\"30\" rx=\"2.5\" fill=\"#d0503a\"/><path d=\"M14 20V50M23 20V50M32 20V50M41 20V50M50 20V50\" stroke=\"#a53c2b\" stroke-width=\"2\"/><rect x=\"6\" y=\"50\" width=\"52\" height=\"3.5\" fill=\"#2f3a43\"/><rect x=\"1\" y=\"43\" width=\"6\" height=\"3.5\" fill=\"#2f3a43\"/><rect x=\"57\" y=\"43\" width=\"6\" height=\"3.5\" fill=\"#2f3a43\"/><g fill=\"#2f3a43\"><circle cx=\"16\" cy=\"54\" r=\"4.8\"/><circle cx=\"48\" cy=\"54\" r=\"4.8\"/></g><g fill=\"#aab4bd\"><circle cx=\"16\" cy=\"54\" r=\"1.8\"/><circle cx=\"48\" cy=\"54\" r=\"1.8\"/></g>","logs":"<circle cx=\"16\" cy=\"52\" r=\"9.5\" fill=\"#b07a3f\" stroke=\"#7a4f22\" stroke-width=\"1.6\"/><circle cx=\"16\" cy=\"52\" r=\"5.5\" fill=\"none\" stroke=\"#7a4f22\" stroke-width=\"1.1\"/><circle cx=\"16\" cy=\"52\" r=\"1.7\" fill=\"#7a4f22\"/><circle cx=\"35\" cy=\"52\" r=\"9.5\" fill=\"#b07a3f\" stroke=\"#7a4f22\" stroke-width=\"1.6\"/><circle cx=\"35\" cy=\"52\" r=\"5.5\" fill=\"none\" stroke=\"#7a4f22\" stroke-width=\"1.1\"/><circle cx=\"35\" cy=\"52\" r=\"1.7\" fill=\"#7a4f22\"/><circle cx=\"54\" cy=\"52\" r=\"9.5\" fill=\"#b07a3f\" stroke=\"#7a4f22\" stroke-width=\"1.6\"/><circle cx=\"54\" cy=\"52\" r=\"5.5\" fill=\"none\" stroke=\"#7a4f22\" stroke-width=\"1.1\"/><circle cx=\"54\" cy=\"52\" r=\"1.7\" fill=\"#7a4f22\"/><circle cx=\"25.5\" cy=\"36\" r=\"9.5\" fill=\"#b07a3f\" stroke=\"#7a4f22\" stroke-width=\"1.6\"/><circle cx=\"25.5\" cy=\"36\" r=\"5.5\" fill=\"none\" stroke=\"#7a4f22\" stroke-width=\"1.1\"/><circle cx=\"25.5\" cy=\"36\" r=\"1.7\" fill=\"#7a4f22\"/><circle cx=\"44.5\" cy=\"36\" r=\"9.5\" fill=\"#b07a3f\" stroke=\"#7a4f22\" stroke-width=\"1.6\"/><circle cx=\"44.5\" cy=\"36\" r=\"5.5\" fill=\"none\" stroke=\"#7a4f22\" stroke-width=\"1.1\"/><circle cx=\"44.5\" cy=\"36\" r=\"1.7\" fill=\"#7a4f22\"/><path d=\"M9 4Q3 22 15 28M55 4Q61 22 49 28\" stroke=\"#6d7a86\" stroke-width=\"4.5\" fill=\"none\" stroke-linecap=\"round\"/><rect x=\"14\" y=\"1\" width=\"36\" height=\"8\" rx=\"2.5\" fill=\"#e0a526\"/>","clarifier":"<circle cx=\"32\" cy=\"32\" r=\"28\" fill=\"#5aa9e6\" stroke=\"#6d7a86\" stroke-width=\"4\"/><circle cx=\"32\" cy=\"32\" r=\"19\" fill=\"none\" stroke=\"#8fd0ff\" stroke-width=\"1.6\" stroke-dasharray=\"3 3\"/><path d=\"M32 32L55 23M32 32L9 41\" stroke=\"#2f3a43\" stroke-width=\"3.2\" stroke-linecap=\"round\"/><path d=\"M52 18L58 28M12 36L6 46\" stroke=\"#2f3a43\" stroke-width=\"2.4\" stroke-linecap=\"round\"/><rect x=\"4\" y=\"29\" width=\"56\" height=\"6\" fill=\"#aab4bd\" stroke=\"#2f3a43\" stroke-width=\"1.2\"/><circle cx=\"32\" cy=\"32\" r=\"6\" fill=\"#2f3a43\"/><circle cx=\"32\" cy=\"32\" r=\"2.2\" fill=\"#e0a526\"/>","gold":"<defs><linearGradient id=\"tg1\" x1=\"0\" x2=\"1\"><stop offset=\"0\" stop-color=\"#b8841a\"/><stop offset=\".45\" stop-color=\"#ffe9a0\"/><stop offset=\"1\" stop-color=\"#a5720f\"/></linearGradient></defs><path d=\"M14 26V52A18 6.5 0 0 0 50 52V26Z\" fill=\"url(#tg1)\" stroke=\"#8a5d0a\" stroke-width=\"1.2\"/><path d=\"M14 40V45A18 6.5 0 0 0 50 45V40A18 6.5 0 0 1 14 40Z\" fill=\"#fff3c4\" opacity=\".55\"/><ellipse cx=\"32\" cy=\"26\" rx=\"18\" ry=\"6.5\" fill=\"#ffe9a0\" stroke=\"#8a5d0a\" stroke-width=\"1.2\"/><ellipse cx=\"32\" cy=\"26\" rx=\"11\" ry=\"3.8\" fill=\"#2f3a43\"/><path d=\"M20 14L24 4L32 11L40 4L44 14Z\" fill=\"#e0a526\" stroke=\"#a06c10\" stroke-width=\"1.2\"/><circle cx=\"24\" cy=\"4\" r=\"1.8\" fill=\"#fff3c4\"/><circle cx=\"40\" cy=\"4\" r=\"1.8\" fill=\"#fff3c4\"/><circle cx=\"32\" cy=\"2.5\" r=\"1.8\" fill=\"#fff3c4\"/>"};
const TROPHIES=[{"id":"pump","name":"Centrifugal pump","ind":"Pumps","k":"score","v":5,"blurb":"Pump bearings run wet and need no grease.","hint":"Reach a score of 5 in one run"},{"id":"propeller","name":"Propeller","ind":"Marine","k":"score","v":10,"blurb":"Propeller shafts turn on water-lubricated bearings.","hint":"Reach a score of 10 in one run"},{"id":"excavator","name":"Excavator","ind":"Construction","k":"score","v":15,"blurb":"Boom, arm and bucket pins take heavy shock loads.","hint":"Reach a score of 15 in one run"},{"id":"drill","name":"Crawler drill","ind":"Mining","k":"score","v":20,"blurb":"Drill rig pivots work in dust, grit and mud.","hint":"Reach a score of 20 in one run"},{"id":"waterjet","name":"Hamilton waterjet","ind":"Marine","k":"score","v":25,"blurb":"Waterjet bearings live in the water they pump.","hint":"Reach a score of 25 in one run"},{"id":"vane","name":"Vane motor","ind":"Hydraulics","k":"score","v":30,"blurb":"Vane motors need bushes that cope with speed and fluid.","hint":"Reach a score of 30 in one run"},{"id":"conveyor","name":"Conveyor","ind":"Industrial","k":"score","v":35,"blurb":"Conveyor pulleys and idlers run for years with no service.","hint":"Reach a score of 35 in one run"},{"id":"seeder","name":"Drill seeder","ind":"Agriculture","k":"score","v":40,"blurb":"Seeder wheels and discs work in dirt without grease.","hint":"Reach a score of 40 in one run"},{"id":"crusher","name":"Double toggle jaw crusher","ind":"Mining","k":"score","v":50,"blurb":"Crusher pivots take brutal shock and abrasive dust.","hint":"Reach a score of 50 in one run"},{"id":"rudder","name":"Rudder","ind":"Marine","k":"coins","v":12,"blurb":"Rudder stock and pintle bearings sit in the propeller wash.","hint":"Collect 12 green coins in one run"},{"id":"pelton","name":"Pelton wheel","ind":"Renewable Energy","k":"coins","v":20,"blurb":"Hydro turbines use bushes that run submerged.","hint":"Collect 20 green coins in one run"},{"id":"wind","name":"Wind turbine","ind":"Renewable Energy","k":"plays","v":10,"blurb":"Pitch and yaw pivots face weather and slow movement.","hint":"Play 10 games"},{"id":"tractor","name":"Tractor","ind":"Agriculture","k":"plays","v":25,"blurb":"Linkage and implement pivots stay greaseless in the field.","hint":"Play 25 games"},{"id":"mixer","name":"Concrete mixer","ind":"Construction","k":"score","v":60,"blurb":"Drum rollers and pivots live in abrasive slurry.","hint":"Reach a score of 60 in one run"},{"id":"valve","name":"Gate valve","ind":"Valves","k":"score","v":70,"blurb":"Valve stems and trunnions work in water and chemicals.","hint":"Reach a score of 70 in one run"},{"id":"cylinder","name":"Hydraulic cylinder","ind":"Hydraulics","k":"score","v":80,"blurb":"Cylinder eyes and glands carry large, slow loads.","hint":"Reach a score of 80 in one run"},{"id":"wagon","name":"Rail wagon","ind":"Transport","k":"score","v":90,"blurb":"Wagon bushes handle load, vibration and weather.","hint":"Reach a score of 90 in one run"},{"id":"logs","name":"Log grapple","ind":"Forestry","k":"score","v":100,"blurb":"Forestry grapples pivot in bark, mud and grit.","hint":"Reach a score of 100 in one run"},{"id":"clarifier","name":"Clarifier","ind":"Water & Wastewater","k":"score","v":125,"blurb":"Treatment plant bearings run submerged for years.","hint":"Reach a score of 125 in one run"},{"id":"gold","name":"Golden Hilube bush","ind":"Hilube Legend","k":"score","v":150,"blurb":"The ultimate trophy. Self-lubricating, long-lasting, legendary.","hint":"Reach a score of 150 in one run"}];
const tsvg=(id,sz=64)=>`<svg viewBox="0 0 64 64" width="${sz}" height="${sz}" aria-hidden="true">${TSVG[id]||''}</svg>`;
let MYT={};try{MYT=JSON.parse(localStorage.getItem('vi4tr')||'{}')}catch{}
const trSave=()=>{try{localStorage.setItem('vi4tr',JSON.stringify(MYT))}catch{}};
async function trophies(v,id){
  const mine=!id||id===ME.uid;let T=mine?MYT:{},nm=mine?(MYN||'You'):'Player',best=0,plays=0;
  v.innerHTML=`<a class="back" href="#/">← Back</a><h1>Trophy cabinet</h1><p class="mut">Loading…</p>`;
  try{const d=await getDoc(dc('scores',mine?ME.uid:id));if(d.exists()){const r=d.data();T=r.trophies||{};nm=r.name||nm;best=r.best||0;plays=r.plays||0;if(mine){MYT={...MYT,...T};T=MYT;trSave()}}}catch{}
  const n=TROPHIES.filter(t=>T[t.id]).length;
  const last=TROPHIES.filter(t=>T[t.id]).sort((p,q)=>T[q.id]>T[p.id]?1:-1)[0]||TROPHIES.find(t=>!T[t.id]),C=2*Math.PI*30;
  v.innerHTML=`<a class="back" href="#/" id="tbk">← Back to game</a><div class="cabh"><svg viewBox="0 0 70 70" width="74" height="74"><circle cx="35" cy="35" r="30" fill="none" stroke="var(--line)" stroke-width="7"/><circle cx="35" cy="35" r="30" fill="none" stroke="#e8a914" stroke-width="7" stroke-linecap="round" stroke-dasharray="${(C*n/TROPHIES.length).toFixed(1)} ${C.toFixed(1)}" transform="rotate(-90 35 35)"/><text x="35" y="41" text-anchor="middle" font-size="18" font-weight="800" fill="currentColor">${n}</text></svg><div><h1>${mine?'Your trophies':esc(nm)+"'s trophies"}</h1><p class="mut">${n} of ${TROPHIES.length}${best?` · best ${best}`:''}${plays?` · ${plays} games`:''}</p></div></div>
  <div class="cabd" id="cabd"></div>
  <div class="cab">${TROPHIES.map(t=>{const got=T[t.id];return `<button class="tr ${got?'got':'lk'}" data-t="${t.id}" aria-label="${got?esc(t.name):'Locked trophy'}"><span class="tm">${got?tsvg(t.id,40):'<i>?</i>'}</span></button>`}).join('')}</div>`;
  document.getElementById('tbk').onclick=()=>setTimeout(playBush,60);
  const show=id=>{const t=TROPHIES.find(z=>z.id===id),got=T[id];document.getElementById('cabd').innerHTML=`<div class="tm ${got?'on':''}">${got?tsvg(id,52):'<i>?</i>'}</div><div><b>${got?esc(t.name):'Locked'}</b>${got?`<small class="ti">${esc(t.ind)}</small>`:''}<small>${got?esc(t.blurb):esc(t.hint)}</small>${got?`<small class="td">Won ${new Date(got).toLocaleDateString()}</small>`:''}</div>`;v.querySelectorAll('.cab .tr').forEach(b=>b.classList.toggle('sel',b.dataset.t===id))};
  v.querySelectorAll('.cab .tr').forEach(b=>b.onclick=()=>show(b.dataset.t));show(last.id);
}
/* ---------- Easter egg: Bush Hop. Click the industries counter on Home 7 times in a row. ---------- */
function playBush(){
  if(document.getElementById('bgame'))return;
  const root=document.createElement('div');root.id='bgame';
  root.innerHTML='<canvas></canvas><button class="bgx" aria-label="Close">✕</button><button class="bgm" aria-label="Sound"></button><button class="bgt" aria-label="Leaderboard">🏆</button><button class="bgc" aria-label="Trophy cabinet">🏅</button><div class="bglb" hidden></div>';
  document.body.appendChild(root);
  const cv=root.querySelector('canvas'),x=cv.getContext('2d'),bm=root.querySelector('.bgm');
  const PW=54,FL=44,GRAV=1500,HOP=-450;
  let cw=0,ch=0,sc=1,W=420,ox=0,dpr=Math.min(devicePixelRatio||1,2),raf=0,last=0,t=0,alive=true;
  const fit=()=>{cw=innerWidth;ch=innerHeight;cv.width=Math.round(cw*dpr);cv.height=Math.round(ch*dpr);sc=ch/640;W=Math.min(cw/sc,440);ox=(cw/sc-W)/2};
  fit();addEventListener('resize',fit);
  /* sprite: the Hilube bush from the refresh icon */
  const notch=Array.from({length:6},(_,k)=>{const a=(90+k*60)*Math.PI/180;return `<circle cx="${(30+16*Math.cos(a)).toFixed(2)}" cy="${(20+5.1*Math.sin(a)).toFixed(2)}" r="1.9" fill="#2a2e33"/>`}).join('');
  const lines=[210,250,290,330].map(a=>{const r=a*Math.PI/180,px=(30+16*Math.cos(r)).toFixed(2),py=(20+5.1*Math.sin(r)).toFixed(2);return `<line x1="${px}" y1="${py}" x2="${px}" y2="${(+py+11).toFixed(2)}" stroke="#555b63" stroke-width="1.6"/>`}).join('');
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 84" width="120" height="168"><defs><linearGradient id="a" x1="0" x2="1"><stop offset="0" stop-color="#cdc3a8"/><stop offset=".45" stop-color="#fffaf0"/><stop offset="1" stop-color="#c6bca0"/></linearGradient><linearGradient id="b" x1="0" x2="1"><stop offset="0" stop-color="#3a50b4"/><stop offset=".45" stop-color="#7389ee"/><stop offset="1" stop-color="#32459b"/></linearGradient><clipPath id="c"><ellipse cx="30" cy="20" rx="16" ry="5.1"/></clipPath></defs><path d="M10 20V68A20 6.4 0 0 0 50 68V20Z" fill="url(#a)" stroke="#b9ae90" stroke-width=".7"/><path d="M10 40V48A20 6.4 0 0 0 50 48V40A20 6.4 0 0 1 10 40Z" fill="url(#b)"/><ellipse cx="30" cy="20" rx="20" ry="6.4" fill="#fffaf0" stroke="#b9ae90" stroke-width=".7"/><ellipse cx="30" cy="20" rx="16" ry="5.1" fill="#23272c"/><g clip-path="url(#c)">${lines}</g>${notch}</svg>`;
  const img=new Image();img.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);
  const TI={};TROPHIES.forEach(t=>{const i=new Image();i.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="128" height="128">${TSVG[t.id]}</svg>`);TI[t.id]=i});
  /* sound */
  let ac=null,mute=false;try{mute=localStorage.getItem('vi4gm')==='1'}catch{}
  const icon=()=>{bm.textContent=mute?'🔇':'🔊'};icon();
  const beep=(f,d,ty='square',v=.05,f2,dl=0)=>{if(mute)return;try{ac=ac||new(window.AudioContext||window.webkitAudioContext)();const s=ac.currentTime+dl,o=ac.createOscillator(),g=ac.createGain();o.type=ty;o.frequency.setValueAtTime(f,s);if(f2)o.frequency.exponentialRampToValueAtTime(f2,s+d);g.gain.setValueAtTime(v,s);g.gain.exponentialRampToValueAtTime(.0001,s+d);o.connect(g);g.connect(ac.destination);o.start(s);o.stop(s+d)}catch{}};
  const buzz=n=>{try{navigator.vibrate&&navigator.vibrate(n)}catch{}};
  /* state */
  let best=0;try{best=+localStorage.getItem('vi4g')||0}catch{}
  const B={x:96,y:300,vy:0,rot:0,sq:0,spin:0};
  const uname=()=>(ME&&(MYN||ME.displayName||(ME.email||'').split('@')[0]))||'Player';
  let plays=0,myRank=0;const lbEl=root.querySelector('.bglb');
  const lbLoad=async()=>{const q=await getDocs(query(col('scores'),orderBy('best','desc'),limit(25)));return q.docs.map(d=>({id:d.id,...d.data()}))};
  const rankMe=async()=>{try{const l=await lbLoad(),i=l.findIndex(r=>r.id===ME.uid);myRank=i>=0?i+1:0}catch{}};
  if(ME&&db)getDoc(dc('scores',ME.uid)).then(d=>{if(d.exists()){const r=d.data();best=Math.max(best,r.best||0);plays=r.plays||0;MYT={...(r.trophies||{}),...MYT};trSave()}rankMe()}).catch(()=>{});
  const submit=()=>{if(!ME||!db)return;plays++;setDoc(dc('scores',ME.uid),{uid:ME.uid,name:uname(),email:ME.email||'',best,plays,trophies:MYT,tc:Object.keys(MYT).length,t:new Date().toISOString()},{merge:true}).then(rankMe).catch(()=>{})};
  const saveTr=()=>{trSave();if(!ME||!db)return;setDoc(dc('scores',ME.uid),{uid:ME.uid,name:uname(),email:ME.email||'',best,plays,trophies:MYT,tc:Object.keys(MYT).length,t:new Date().toISOString()},{merge:true}).catch(()=>{})};
  const showLb=async()=>{lbEl.hidden=false;lbEl.innerHTML='<div class="lbh"><b>🏆 Leaderboard</b><button class="lbx" aria-label="Back">✕</button></div><p class="lbm">Loading…</p>';lbEl.querySelector('.lbx').onclick=()=>{lbEl.hidden=true};
    try{const l=await lbLoad();lbEl.querySelector('.lbm').outerHTML=l.length?`<ol>${l.map((r,i)=>`<li class="${r.id===ME?.uid?'me':''}" data-u="${r.id}"><i>${i+1}</i><span>${esc(r.name||r.email||'Player')}</span><em>🏅${r.tc||Object.keys(r.trophies||{}).length}</em><b>${r.best||0}</b><small>${r.plays||0} plays</small></li>`).join('')}</ol>`:'<p class="lbm">No scores yet. Be the first!</p>'}catch{lbEl.querySelector('.lbm').textContent='Leaderboard unavailable. Ask the admin to publish the latest Firestore rules.'}};
  root.querySelector('.bgt').addEventListener('click',e=>{e.stopPropagation();showLb()});
  lbEl.addEventListener('click',e=>{const li=e.target.closest('li[data-u]');if(li){close();location.hash='#/trophies/'+li.dataset.u}});
  root.querySelector('.bgc').addEventListener('click',e=>{e.stopPropagation();close();location.hash='#/trophies'});
  let shT=0,st='idle',pipes=[],coins=[],parts=[],pops=[],score=0,cn=0,shield=false,inv=0,shake=0,flash=0,floorX=0,deadT=0,deadMsg='',newBest=false,combo=0,tro=null,ban=null,runT=[],offered={},gap=200,speed=150,sky=0,since=0,star=[];
  for(let i=0;i<40;i++)star.push([Math.random()*440,Math.random()*300,Math.random()*1.6+.4,Math.random()*6]);
  const bld=[];for(let i=0,px=0;i<40;i++){const w=44+Math.random()*50,h=60+Math.random()*130;bld.push({x:px,w,h,st:Math.random()<.3,l:Math.random()});px+=w+4}
  const bw=bld[bld.length-1].x+bld[bld.length-1].w+4;
  const hex=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)),mix=(a,b,k)=>{const A=hex(a),Bb=hex(b);return `rgb(${A.map((v,i)=>Math.round(v+(Bb[i]-v)*k)).join(',')})`};
  const rnd=(a,b)=>a+Math.random()*(b-a),clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
  const puff=(px,py,n,cols,sp=120,life=.6,r=3)=>{for(let i=0;i<n;i++){const a=Math.random()*6.283,s=Math.random()*sp;parts.push({x:px,y:py,vx:Math.cos(a)*s,vy:Math.sin(a)*s-30,l:rnd(.5,1)*life,m:life,c:cols[i%cols.length],r:rnd(r*.6,r*1.4),g:300})}};
  const pop=(txt,px,py,c='#fff')=>pops.push({txt,x:px,y:py,l:1,c});
  const reset=()=>{tro=null;ban=null;runT=[];offered={};pipes=[];coins=[];parts=[];pops=[];score=0;cn=0;shield=false;shT=0;inv=0;shake=0;combo=0;B.y=300;B.vy=0;B.rot=0;B.spin=0;newBest=false;since=0;st='idle'};
  const dueT=()=>{if(st==='dead')return null;return TROPHIES.find(t=>!MYT[t.id]&&!offered[t.id]&&(t.k==='score'?score>=t.v:t.k==='coins'?cn>=t.v:(plays>=t.v&&score>=3)))||null};
  /* The trophy sits in the centre of a gap, like a coin, but it is bigger and only appears once its goal is reached. */
  const spawnT=(T,np)=>{offered[T.id]=1;tro={id:T.id,st:'edge',p:np,off:0,ph:rnd(0,6)}};
  const tpos=q=>q.p?{x:q.p.x+PW/2,y:q.p.cy+q.off}:{x:q.x,y:q.y+(q.st==='wave'?Math.sin(t*2.6+q.ph)*q.amp:0)};
  const addPipe=px=>{const prev=pipes[pipes.length-1],lo=gap/2+70,hi=640-FL-gap/2-60;let gy=rnd(lo,hi);if(prev)gy=clamp(gy,prev.gy-150,prev.gy+150);gy=clamp(gy,lo,hi);const mv=score>=8&&Math.random()<.55;pipes.push({x:px,gy,mv,ph:rnd(0,6),amp:mv?Math.min(48,10+score*1.4):0,pass:false,cy:gy});const np=pipes[pipes.length-1],dt_=dueT();if(dt_&&!tro)spawnT(dt_,np,px);if(!(tro&&tro.p===np)&&Math.random()<.65)coins.push({p:np,t:rnd(0,6),got:false})};
  const medal=s=>s>=100?['HILUBE LEGEND','#7fd0ff']:s>=50?['GOLD','#ffd23f']:s>=25?['SILVER','#d6dde3']:s>=10?['BRONZE','#d98a4a']:null;
  const MS={5:'Smooth running!',10:'Low friction!',15:'No wear here!',20:'Self-lubricating!',30:'Hilube hero!',40:'Zero maintenance!',50:'Unstoppable bush!',75:'Bearing royalty!',100:'LEGEND!'};
  const flap=()=>{
    if(st==='dead'){if(t-deadT>.75){reset();flap()}return}
    if(st==='idle'){st='run';addPipe(W+130)}
    B.vy=HOP;B.sq=1;puff(B.x,B.y+26,7,['#fffaf0','#e8dfc6','#cfd6dc'],90,.45,3);beep(420,.12,'square',.05,700);buzz(6);
  };
  const die=()=>{
    if(inv>0)return;
    if(shield){shield=false;shT=0;inv=1.4;shake=.25;flash=.5;B.vy=HOP*.8;puff(B.x,B.y,22,['#7fd0ff','#fff','#b6e6ff'],220,.7,4);pop('SHIELD POP!',B.x,B.y-40,'#7fd0ff');beep(300,.25,'sawtooth',.08,120);buzz(30);return}
    st='dead';deadT=t;shake=.5;flash=.8;B.vy=-280;B.spin=rnd(-9,9);buzz([40,40,80]);beep(180,.4,'sawtooth',.11,40);
    puff(B.x,B.y,26,['#fffaf0','#c6bca0','#3a50b4','#23272c'],300,.9,4);
    deadMsg=['Seized!','Needs more grease!','Out of tolerance!','Shaft happens!','Bush-ted!','Wear and tear!'][Math.floor(Math.random()*6)];
    if(score>best){best=score;newBest=score>0;try{localStorage.setItem('vi4g',String(best))}catch{}}submit();
  };
  const update=dt=>{
    t+=dt;sky+=(Math.min(score/40,1)*2-sky)*Math.min(1,dt*1.5);
    speed=150+Math.min(score,45)*2.4;gap=Math.max(148,205-score*1.3);
    const dead=st==='dead';
    if(st==='idle'){B.y=300+Math.sin(t*3.2)*9;B.rot=Math.sin(t*3.2)*.08;floorX=(floorX+speed*.6*dt)%48}
    else{
      B.vy+=GRAV*dt;B.y+=B.vy*dt;
      if(dead){B.rot+=B.spin*dt}else{B.rot+=(clamp(B.vy/650,-.55,1.1)-B.rot)*Math.min(1,dt*10);floorX=(floorX+speed*dt)%48}
      if(B.y<26&&!dead){B.y=26;B.vy=Math.max(B.vy,0)}
      if(B.y>640-FL-26){B.y=640-FL-26;if(!dead){die();if(st==='dead'){B.vy=-220}}else{B.vy=0;B.spin*=.8}}
      if(!dead){
        const sp=speed*dt;pipes.forEach(p=>{p.x-=sp;p.cy=p.gy+(p.mv?Math.sin(t*1.7+p.ph)*p.amp:0)});
        if(pipes.length&&pipes[0].x<-PW-30)pipes.shift();coins=coins.filter(c=>c.p.x>-60&&!c.got);
        const lp=pipes[pipes.length-1];if(!lp||lp.x<W-(235+Math.min(score,30)))addPipe(W+60);
        if(inv>0)inv-=dt;if(shield){shT-=dt;if(shT<=0){shield=false;shT=0;pop('Shield expired',B.x,B.y-44,'#9fb4c4');beep(300,.2,'triangle',.05,160)}}
        const hx=B.x-13,hy=B.y-21,hw=26,hh=42;
        for(const p of pipes){
          if(!p.pass&&p.x+PW<B.x-10){p.pass=true;score++;beep(880,.09,'triangle',.07,1250);pop('+1',B.x+30,B.y-30);
            if(MS[score]){pop(MS[score],W/2,200,'#ffd23f');flash=.35;buzz(25);for(let i=0;i<40;i++)parts.push({x:W/2+rnd(-30,30),y:210,vx:rnd(-260,260),vy:rnd(-380,-60),l:rnd(.8,1.5),m:1.5,c:['#ffd23f','#35b34a','#7fd0ff','#ff6b6b','#fff'][i%5],r:rnd(2,4.5),g:520});[0,.1,.2].forEach((d,i)=>beep(520+i*180,.18,'triangle',.07,undefined,d))}}
          const top=p.cy-gap/2,bot=p.cy+gap/2,hit=(rx,ry,rw,rh)=>hx<rx+rw&&hx+hw>rx&&hy<ry+rh&&hy+hh>ry;
          if(hit(p.x,0,PW,top-22)||hit(p.x-8,top-22,PW+16,22)||hit(p.x-8,bot,PW+16,22)||hit(p.x,bot+22,PW,640)){die();break}}
        if(tro&&!tro.p)tro.x-=sp*(tro.st==='dash'?1.7:1);
        if(tro&&(tro.p?tro.p.x<-90:tro.x<-70)){delete offered[tro.id];tro=null}
        if(tro&&st!=='dead'){const q=tro,pp=tpos(q);if(Math.hypot(B.x-pp.x,B.y-pp.y)<34){const T=TROPHIES.find(z=>z.id===q.id);tro=null;MYT[T.id]=new Date().toISOString();runT.push(T);saveTr();ban={t:T,l:2.2};flash=.15;buzz([30,40,30,40,80]);puff(pp.x,pp.y,26,['#ffd23f','#fff3c4','#7fd0ff','#ff6b6b','#35b34a'],300,.9,3.5);[0,.09,.18,.27,.4].forEach((d,k)=>beep(523*[1,1.25,1.5,2,2.5][k],.2,'triangle',.08,undefined,d))}}
        if(st!=='dead')for(const c of coins){const cx=c.p.x+PW/2,cy=c.p.cy;if(!c.got&&Math.hypot(B.x-cx,B.y-cy)<30){c.got=true;cn++;combo++;beep(1046,.07,'square',.05);beep(1568,.12,'square',.05,undefined,.07);puff(cx,cy,12,['#35b34a','#b6f0bf','#fff'],170,.55,3);pop(combo>1?`+1 x${combo}`:'+1',cx,cy-20,'#8ff0a4');
          if(cn%10===0){shield=true;shT=5;pop('SHIELD! 5 seconds',W/2,250,'#7fd0ff');beep(660,.3,'triangle',.07,1320)}}}
      }
    }
    for(const p of parts){p.l-=dt;p.vy+=p.g*dt;p.x+=p.vx*dt;p.y+=p.vy*dt}parts=parts.filter(p=>p.l>0);
    for(const p of pops){p.l-=dt*.8;p.y-=40*dt}pops=pops.filter(p=>p.l>0);
    if(ban){ban.l-=dt;if(ban.l<=0)ban=null}
    B.sq=Math.max(0,B.sq-dt*4.5);shake=Math.max(0,shake-dt);flash=Math.max(0,flash-dt*1.6);
    if(shield&&Math.random()<.5)parts.push({x:B.x+rnd(-18,18),y:B.y+rnd(-24,24),vx:rnd(-20,20),vy:rnd(-30,10),l:.5,m:.5,c:'#9edcff',r:2,g:0});
  };
  const roundRect=(px,py,w,h,r)=>{x.beginPath();x.moveTo(px+r,py);x.arcTo(px+w,py,px+w,py+h,r);x.arcTo(px+w,py+h,px,py+h,r);x.arcTo(px,py+h,px,py,r);x.arcTo(px,py,px+w,py,r);x.closePath()};
  const text=(s,px,py,size,col='#fff',al='center',lw=5)=>{x.font=`800 ${size}px system-ui,-apple-system,Segoe UI,sans-serif`;x.textAlign=al;x.lineJoin='round';x.lineWidth=lw;x.strokeStyle='rgba(8,20,32,.85)';x.strokeText(s,px,py);x.fillStyle=col;x.fillText(s,px,py)};
  const draw=()=>{
    x.setTransform(dpr,0,0,dpr,0,0);x.fillStyle='#050a10';x.fillRect(0,0,cw,ch);
    x.setTransform(dpr*sc,0,0,dpr*sc,ox*sc*dpr,0);
    const sx=shake>0?rnd(-1,1)*shake*26:0,sy=shake>0?rnd(-1,1)*shake*26:0;x.save();x.translate(sx,sy);
    x.beginPath();x.rect(-30,-30,W+60,700);x.clip();
    const p1=Math.min(sky,1),p2=Math.max(0,sky-1),top=sky<1?mix('#5fc3e6','#5b3f8c',p1):mix('#5b3f8c','#070b22',p2),bot=sky<1?mix('#e8f6fa','#f4a261',p1):mix('#f4a261','#243a73',p2);
    const g=x.createLinearGradient(0,0,0,640);g.addColorStop(0,top);g.addColorStop(1,bot);x.fillStyle=g;x.fillRect(-30,-30,W+60,700);
    const night=Math.max(0,sky-1.05);
    if(night>0){x.globalAlpha=night;star.forEach(s=>{x.globalAlpha=night*(.5+.5*Math.sin(t*2+s[3]));x.fillStyle='#fff';x.fillRect(s[0]%W,s[1],s[2],s[2])});x.globalAlpha=1}
    /* sun / moon */
    const sunY=120+sky*95;x.fillStyle=sky>1.4?'#f4f0d8':sky>.8?'#ffd9a0':'#fff6c8';x.beginPath();x.arc(W*.78,sunY,28,0,6.283);x.fill();
    /* skyline */
    const off=(t*speed*.18)%bw,bc=mix('#3d6577','#0a1030',Math.min(sky/2,1));
    for(let rep=-1;rep<2;rep++)for(const b of bld){const bx=b.x-off+rep*bw;if(bx>W+10||bx+b.w<-10)continue;x.fillStyle=bc;x.fillRect(bx,640-FL-b.h,b.w,b.h);
      if(b.st){x.fillRect(bx+b.w*.65,640-FL-b.h-34,10,36);if(st!=='dead'||true)for(let k=0;k<3;k++){const pt=(t*.5+k*.33+b.l)%1;x.globalAlpha=.4*(1-pt);x.fillStyle='#e8eef2';x.beginPath();x.arc(bx+b.w*.65+5+pt*18,640-FL-b.h-34-pt*46,5+pt*9,0,6.283);x.fill()}x.globalAlpha=1}
      if(night>0){x.fillStyle='#ffd77a';x.globalAlpha=night*.8;for(let wy=640-FL-b.h+10;wy<640-FL-14;wy+=18)for(let wx=bx+7;wx<bx+b.w-9;wx+=14)if(((wx*7+wy*3+b.l*50)|0)%3)x.fillRect(wx,wy,5,7);x.globalAlpha=1}}
    /* shafts */
    for(const p of pipes){const top=p.cy-gap/2,bot=p.cy+gap/2;
      const rod=(y0,y1)=>{const gr=x.createLinearGradient(p.x,0,p.x+PW,0);gr.addColorStop(0,'#58626b');gr.addColorStop(.3,'#dfe4e8');gr.addColorStop(.55,'#a4aeb7');gr.addColorStop(1,'#4d565f');x.fillStyle=gr;x.fillRect(p.x,y0,PW,y1-y0);x.fillStyle='rgba(255,255,255,.18)';for(let yy=y0+10-(y0%36);yy<y1;yy+=36)if(yy>y0)x.fillRect(p.x,yy,PW,2)};
      const collar=cy=>{const gr=x.createLinearGradient(p.x-8,0,p.x+PW+8,0);gr.addColorStop(0,'#3d464e');gr.addColorStop(.35,'#c3cbd2');gr.addColorStop(1,'#39424a');x.fillStyle=gr;roundRect(p.x-8,cy,PW+16,22,4);x.fill();x.fillStyle='#35b34a';x.fillRect(p.x-8,cy+8,PW+16,6);x.fillStyle='rgba(0,0,0,.35)';[p.x-2,p.x+PW+2].forEach(bx=>{x.beginPath();x.arc(bx,cy+4,1.6,0,6.283);x.arc(bx,cy+18,1.6,0,6.283);x.fill()})};
      rod(-10,top-22);collar(top-22);rod(bot+22,640-FL);collar(bot)}
    /* coins */
    for(const c of coins){if(c.got)continue;const cx=c.p.x+PW/2,cy=c.p.cy+Math.sin(t*4+c.t)*4,sw=Math.abs(Math.cos(t*3+c.t))*.8+.2;x.save();x.translate(cx,cy);x.scale(sw,1);x.fillStyle='#1f8f36';x.beginPath();x.arc(0,0,13,0,6.283);x.fill();x.fillStyle='#35b34a';x.beginPath();x.arc(0,0,10.5,0,6.283);x.fill();x.restore();x.fillStyle='#fff';x.font='800 12px system-ui,sans-serif';x.textAlign='center';x.fillText('V',cx,cy+4)}
    if(tro){const q=tro,pp=tpos(q),pu=.5+.5*Math.sin(t*5);x.save();x.translate(pp.x,pp.y);if(q.st==='dash'){x.strokeStyle='rgba(255,226,120,.55)';x.lineWidth=3;x.lineCap='round';for(let k=0;k<3;k++){x.beginPath();x.moveTo(26+k*4,-9+k*9);x.lineTo(60+k*10,-9+k*9);x.stroke()}}
      const gl=x.createRadialGradient(0,0,4,0,0,34);gl.addColorStop(0,`rgba(255,226,120,${.5+.25*pu})`);gl.addColorStop(1,'rgba(255,226,120,0)');x.fillStyle=gl;x.beginPath();x.arc(0,0,34,0,6.283);x.fill();x.fillStyle='#15222c';x.strokeStyle='#ffd23f';x.lineWidth=2.5;x.beginPath();x.arc(0,0,20,0,6.283);x.fill();x.stroke();const im_=TI[q.id];if(im_&&im_.complete)x.drawImage(im_,-15,-15,30,30);x.restore()}
    /* floor: hazard conveyor */
    const fy=640-FL;x.fillStyle='#252c33';x.fillRect(-30,fy,W+60,FL+30);x.fillStyle='#ffc61a';for(let i=-2;i<W/24+3;i++){const bx=i*48-floorX;x.beginPath();x.moveTo(bx,fy+6);x.lineTo(bx+24,fy+6);x.lineTo(bx+12,fy+26);x.lineTo(bx-12,fy+26);x.closePath();x.fill()}x.fillStyle='#10151a';x.fillRect(-30,fy,W+60,6);
    /* particles */
    for(const p of parts){x.globalAlpha=clamp(p.l/p.m,0,1);x.fillStyle=p.c;x.beginPath();x.arc(p.x,p.y,p.r,0,6.283);x.fill()}x.globalAlpha=1;
    /* bush */
    if(!(inv>0&&Math.floor(t*16)%2)){x.save();x.translate(B.x,B.y);x.rotate(B.rot);x.scale(1-.2*B.sq,1+.26*B.sq);x.shadowColor='rgba(0,0,0,.35)';x.shadowBlur=10;x.shadowOffsetY=4;if(img.complete)x.drawImage(img,-21,-30,42,59);else{x.fillStyle='#fffaf0';x.fillRect(-16,-24,32,48)}x.restore();
      if(shield&&!(shT<1.5&&Math.floor(t*10)%2)){x.save();x.translate(B.x,B.y);const k=1+Math.sin(t*6)*.04;x.scale(k,k);const sg=x.createRadialGradient(0,0,18,0,0,40);sg.addColorStop(0,'rgba(127,208,255,.05)');sg.addColorStop(1,'rgba(127,208,255,.55)');x.fillStyle=sg;x.strokeStyle='rgba(200,236,255,.95)';x.lineWidth=2;x.beginPath();x.arc(0,0,38,0,6.283);x.fill();x.stroke();x.restore()}}
    for(const p of pops){x.globalAlpha=clamp(p.l*1.4,0,1);text(p.txt,p.x,p.y,p.txt.length>6?22:20,p.c,'center',4)}x.globalAlpha=1;
    if(flash>0){x.fillStyle=`rgba(255,255,255,${flash*.5})`;x.fillRect(-30,-30,W+60,700)}
    x.restore();
    /* HUD */
    if(ban){const k=clamp(Math.min(ban.l,2.2-ban.l)*5,0,1);x.save();x.globalAlpha=k*.88;x.translate(0,(1-k)*30);x.fillStyle='rgba(8,20,32,.9)';roundRect(W/2-128,492,256,50,14);x.fill();x.strokeStyle='#ffd23f';x.lineWidth=2;x.stroke();x.fillStyle='#15222c';x.beginPath();x.arc(W/2-102,517,19,0,6.283);x.fill();x.stroke();const bi=TI[ban.t.id];if(bi&&bi.complete)x.drawImage(bi,W/2-116,503,28,28);text('TROPHY UNLOCKED',W/2+16,510,10,'#ffd23f','center',2);text(ban.t.name,W/2+16,530,ban.t.name.length>17?13:15,'#fff','center',3);x.restore()}
    if(st!=='idle'){text(String(score),W/2,92,64,'#fff','center',8);
      x.font='700 15px system-ui,sans-serif';x.textAlign='left';text(`Coins ${cn%10}/10`,14,625-FL,13,'#8ff0a4','left',3);if(shield)text(`SHIELD ${Math.ceil(shT)}s`,W-14,625-FL,13,shT<2?'#ffb86b':'#7fd0ff','right',3);
      text(`Best ${best}`,W/2,122,14,'#fff','center',3)}
    if(st==='idle'){text('BUSH HOP',W/2,150,50,'#ffd23f','center',8);text('Tap to hop. Dodge the shafts.',W/2,190,17,'#fff','center',4);text('Green coins: 10 = 5s shield.',W/2,214,15,'#cfeeff','center',4);text(best?`Best ${best}`:'',W/2,246,18,'#fff','center',4);text(`🏅 ${Object.keys(MYT).length}/${TROPHIES.length} trophies`,W/2,276,16,'#ffd23f','center',4);const a=.55+.45*Math.sin(t*4);x.globalAlpha=a;text('TAP TO START',W/2,420,24,'#fff','center',5);x.globalAlpha=1}
    if(st==='dead'&&t-deadT>.5){const k=clamp((t-deadT-.5)*4,0,1);x.globalAlpha=k;x.fillStyle='rgba(8,20,32,.72)';roundRect(W/2-150,170,300,250,18);x.fill();x.strokeStyle='#ffd23f';x.lineWidth=3;x.stroke();
      text(deadMsg,W/2,214,28,'#ffd23f','center',5);text(String(score),W/2,292,66,'#fff','center',8);text(newBest?'NEW BEST!':`Best ${best}`+(myRank?`  ·  Rank #${myRank}`:''),W/2,324,18,newBest?'#8ff0a4':'#cfeeff','center',4);
      const m=medal(score);if(m)text(m[0],W/2,358,20,m[1],'center',4);else text('Reach 10 for bronze',W/2,358,15,'#aab8c4','center',3);
      if(runT.length)text(`🏅 ${runT.length>1?runT.length+' new trophies':runT[0].name}`,W/2,382,15,'#ffd23f','center',3);if(t-deadT>.75){x.globalAlpha=k*(.6+.4*Math.sin(t*5));text('TAP TO RETRY',W/2,408,20,'#fff','center',4)}x.globalAlpha=1}
  };
  const loop=ts=>{if(!alive)return;const dt=Math.min(.033,(ts-(last||ts))/1000||.016);last=ts;update(dt);draw();raf=requestAnimationFrame(loop)};
  const close=()=>{alive=false;cancelAnimationFrame(raf);removeEventListener('resize',fit);removeEventListener('keydown',key);try{ac&&ac.close()}catch{}root.remove()};
  const key=e=>{if(e.code==='Escape'){close()}else if(e.code==='Space'||e.code==='ArrowUp'||e.code==='KeyW'){e.preventDefault();if(!e.repeat)flap()}else if(e.code==='KeyM'){bm.click()}};
  addEventListener('keydown',key);
  root.addEventListener('pointerdown',e=>{if(e.target.closest('button,.bglb'))return;e.preventDefault();flap()});
  root.addEventListener('touchstart',e=>{if(!e.target.closest('button,.bglb'))e.preventDefault()},{passive:false});
  root.querySelector('.bgx').addEventListener('click',e=>{e.stopPropagation();close()});
  bm.onclick=()=>{mute=!mute;try{localStorage.setItem('vi4gm',mute?'1':'0')}catch{}icon();if(!mute)beep(660,.1,'triangle',.06)};
  reset();raf=requestAnimationFrame(loop);
}
function eggTap(v){
  const el=v.querySelector('.stats div:nth-child(2)');if(!el)return;let n=0,tm=0;
  el.style.cursor='pointer';el.style.userSelect='none';el.style.webkitUserSelect='none';el.style.webkitTapHighlightColor='transparent';
  el.addEventListener('click',e=>{e.stopPropagation();const now=Date.now();if(now-tm>1500)n=0;tm=now;n++;
    const b=el.querySelector('b');if(b&&b.animate)b.animate([{transform:'scale(1)'},{transform:'scale(1.18)'},{transform:'scale(1)'}],{duration:140});
    if(n>=7){n=0;try{navigator.vibrate&&navigator.vibrate([20,30,20])}catch{}playBush()}});
  v.addEventListener('click',()=>{n=0});
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
  <div class="acts"><button class="btn" id="spf">${P.includes(a.id)?`Open customer portfolio (${P.length})`:P.length?`Add to customer portfolio (${P.length})`:'Start customer portfolio'}</button>${P.length&&!P.includes(a.id)?'<button class="btn" id="npf">Start a new portfolio</button>':''}<button class="btn" id="spd">Share PDF</button><a class="btn" href="#/chatnew/${a.id}">Message</a>${can('edit')?`<a class="btn pri" href="#/edit/${a.id}">Edit</a>${S.feat.qr?'<button class="btn" id="sh">Share / QR</button>':''}`:''}${can('edit')?'<button class="btn bad" id="dl">Delete</button>':''}</div>`;
  if(a.photos.length)lazyImgs($('#st'),a.photos);
  $('#spf').onclick=()=>{if(!P.includes(a.id))P.push(a.id);savePf();location.hash='#/portfolio'};if($('#npf'))$('#npf').onclick=()=>{P=[a.id];savePf();location.hash='#/portfolio'};
  const link=`${location.origin}${location.pathname}#/share/${a.id}`,show=()=>{const q=$('#qr');q.hidden=false;q.innerHTML=`<h2>Customer-safe link</h2><div id="qc"></div><p class="mut" style="word-break:break-all">${esc(link)}</p><p class="mut">Shows only the overview, problem, solution, result and photos.</p><div class="acts"><button class="btn" id="cp">Copy link</button><button class="btn bad" id="us">Stop sharing</button></div>`;lib('qr').then(()=>new QRCode($('#qc'),{text:link,width:200,height:200})).catch(()=>{});$('#cp').onclick=()=>navigator.clipboard.writeText(link).then(()=>alert('Link copied.'));$('#us').onclick=async()=>{try{a.shared=false;await save(a);await deleteDoc(dc('shared',a.id));log('Stopped sharing',a.name);q.hidden=true}catch(x){alert(x.message)}}};
  $('#spd').onclick=async()=>{const b=$('#spd');if(b._b){await deliver(b._b,b._n);return}b.disabled=true;b.textContent='Building…';
    try{const r=await pdf([a.id],{cust:'',intro:''});b._b=r.blob;b._n=`${S.company}-${(a.name||'application').replace(/[^\w]+/g,'-').replace(/^-|-$/g,'')}.pdf`;b.textContent='Open PDF';log('Made application PDF',a.name)}catch(x){alert('Could not build the PDF: '+(x.message||x));b.textContent='Share PDF'}b.disabled=false};
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
  const f=(k,l,t,ex='')=>`<label>${l}${t==='area'?`<textarea name="${k}" rows="3">${esc(a[k])}</textarea>`:`<input name="${k}" value="${esc(a[k]||(k==='author'&&!id?MYN:''))}" ${ex}>`}</label>`;
  v.innerHTML=`<a class="back" href="#/${id?'app/'+id:'library'}">← Cancel</a><h1>${id?'Edit':'Capture'} application</h1><form id="F">
  ${f('name','Application name','','required')}${indSelect(a.industry,'indSel','indOther','indOtherW')}${f('product','Product / material')}${f('desc','What does it do, and where is it used?','area')}
  <fieldset><legend>Customer story</legend>${f('problem','Problem','area')}${f('solution','Solution','area')}${f('proof','Result / proof','area')}${f('summary','Customer-safe summary','area')}</fieldset>
  <fieldset><legend>Operating conditions</legend>${f('orig','Original material')}${f('env','Environment')}${f('load','Load / movement / speed')}${f('temp','Temperature')}${f('lube','Lubrication')}${f('customer','Customer / OEM')}</fieldset>
  <fieldset><legend>Photos <small id="pc"></small></legend><div class="pg" id="pg"></div><div class="acts"><label class="btn">Take photo<input type="file" accept="image/*" capture="environment" hidden id="p1"></label><label class="btn">Choose photos<input type="file" accept="image/*" multiple hidden id="p2"></label></div></fieldset>
  ${f('author','Recorded by')}<button class="btn pri wide">Save application</button></form>`;
  const rp=()=>{$('#pg').innerHTML=ph.map((p,i)=>`<figure><img src="${p.src}" alt=""><button type="button" data-i="${i}" aria-label="Remove photo">×</button></figure>`).join('');$('#pc').textContent=`${ph.length}/10`;$$('#pg button').forEach(b=>b.onclick=()=>{const[x]=ph.splice(+b.dataset.i,1);if(x.ref)removed.push(x.ref);rp()})};rp();
  const add=async e=>{for(const fl of [...e.target.files]){if(ph.length>=10){alert('Maximum 10 photos per application.');break}try{ph.push({src:await shrink(fl)})}catch{alert('One photo could not be read.')}}e.target.value='';rp()};
  $('#p1').onchange=add;$('#p2').onchange=add;indBind('indSel','indOtherW');
  $('#F').onsubmit=async e=>{e.preventDefault();const b=e.submitter,d=Object.fromEntries(new FormData(e.target));if(d.industry==='__other'){d.industry=($('#indOther').value||'').trim();if(!d.industry){alert('Type the new industry name.');return}}b.disabled=true;b.textContent='Saving…';const r={...a,...d,id:a.id||crypto.randomUUID(),date:a.date||new Date().toISOString(),uid:a.uid||ME?.uid||'',byEmail:a.byEmail||ME?.email||'',byName:a.byName||MYN||''};try{await T(commit(r,ph,(d,t)=>{b.textContent=d<t?`Uploading photos ${d}/${t}…`:'Saving record…'}),90000);await Promise.all(removed.map(delFile));log(a.id?'Edited application':'Created application',r.name);location.hash='#/app/'+r.id}catch(x){b.disabled=false;b.textContent='Save application';alert('Could not save: '+(x.message||x))}};
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
function insights(v){const q=A.reduce((m,a)=>{const g=grade(a)[0];m[g]=(m[g]||0)+1;return m},{});v.innerHTML=`<h1>Insights</h1><div class="card"><h2>By industry</h2>${bars(count('industry'))}</div><div class="card"><h2>By product</h2>${bars(count('product'))}</div><div class="card"><h2>Record quality</h2>${bars(q)}</div>${can('admin')?'<div class="card" id="UT"><h2>Applications by user</h2><p class="mut">Loading…</p></div>':''}`;
  if(can('admin'))getDocs(col('members')).then(m=>{
    const U={};m.docs.forEach(d=>{const e=d.data().email||'';U['u:'+d.id]={name:d.data().name||'',email:e,n:0,last:'',role:d.data().role,au:{}}});
    A.forEach(a=>{const k=a.uid&&U['u:'+a.uid]?'u:'+a.uid:'a:'+((a.author||'').trim()||'Not recorded');const u=U[k]||(U[k]={name:k.slice(2),email:'',n:0,last:'',role:'',au:{}});u.n++;if((a.date||'')>u.last)u.last=a.date;if(a.author&&a.uid)u.au[a.author]=(u.au[a.author]||0)+1});
    const rows=Object.values(U).map(u=>{const top=Object.entries(u.au).sort((x,y)=>y[1]-x[1])[0];return{...u,name:u.name||(top?top[0]:(u.email.split('@')[0]||'?'))}}).sort((x,y)=>y.n-x.n||x.name.localeCompare(y.name)),mx=Math.max(1,...rows.map(r=>r.n));
    $('#UT').innerHTML=`<h2>Applications by user</h2><p class="mut" style="margin:0 0 8px">Only admins see this. Older records without a saved user are grouped by their "Recorded by" name.</p>${rows.map(r=>`<div class="ur"><div><b>${esc(r.name)}</b><small>${esc(r.email||'no account')}${r.role?` · ${esc(r.role)}`:''}${r.last?` · last ${new Date(r.last).toLocaleDateString()}`:''}</small></div><strong>${r.n}</strong><i style="width:${Math.round(r.n/mx*100)}%"></i></div>`).join('')||'<p class="mut">No users yet.</p>'}`}).catch(()=>{const e=$('#UT');if(e)e.innerHTML='<h2>Applications by user</h2><p class="mut">Could not load users.</p>'})}

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
  ${S.feat.pv?'<section class="card"><h2>Design</h2><a class="row" href="#/design"><div class="th">◉</div><div><strong>Design a bearing</strong><small>Industrial, pump, marine rudder and marine stern</small></div><span class="chip ok">Open</span></a><a class="row" href="#/quickdraw" style="margin-top:8px"><div class="th">✎</div><div><strong>QuickDraw</strong><small>Type sizes, get a full drawing and PDF</small></div><span class="chip ok">Open</span></a><a class="row" href="#/freezer" style="margin-top:8px"><div class="th">❄</div><div><strong>Freezer shrink time</strong><small>How long to cool a bush so it slides into the housing</small></div><span class="chip ok">Open</span></a></section>':''}
  <section class="card"><h2>Data sheets</h2><a class="row" href="#/datasheets"><div class="th">▤</div><div><strong>Vesconite data sheets</strong><small>${DSH.length} materials, each with its PDF</small></div><span class="chip ok">Open</span></a></section>
  <section class="card"><h2>Customer portfolio</h2><a class="row" href="#/portfolio"><div class="th">▣</div><div><strong>Make a customer proposal</strong><small>${P.length?`${P.length} application${P.length>1?'s':''} selected`:'Pick applications and make a PDF'}</small></div><span class="chip ok">Open</span></a></section>
  <section class="card"><h2>Account</h2><p class="mut">Signed in as ${esc(ME.email)} (${ROLE}).</p><div class="g2"><label>Your name<input id="myn" value="${esc(MYN)}" maxlength="60" placeholder="Full name"></label><div style="display:flex;align-items:flex-end"><button class="btn" id="mys" type="button">Save name</button></div></div><button class="btn" id="so" style="margin-top:12px">Sign out</button></section>`;
  $('#mys').onclick=()=>saveName($('#myn').value,$('#mys'));
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
function recGroove(type,D,wall,L,mode){
  const st=mode==='stern',t=st?(D>=60&&D<=800?GRS.find(x=>D<=x[0]):null):(D>=20&&D<=200?GRV.find(x=>D<=x[0]):null);if(!t)return null;
  const fr=mode==='rud'?1/3:1/2,w=t[2];let d=t[3],lim=false;if(d>wall*fr-0.3){d=Math.max(0.5,Math.floor((wall*fr-0.3)*10)/10);lim=true}
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
  return g==="h"?{c:0xf4efe3,t:null,rough:.62}:{c:0x40454b,t:null,rough:.72};
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
  const{OD,ID,L,ch,w,H,D,press,clo,c,g,tOD,tID,tW,tL,pf,drg,G,fl,dw,logo,gz}=p,q=p.q,e=esc,Dm=fl.on?fl.FD:OD,imp=!!p.imp,fL=(x,d=2)=>imp?fx(x/25.4,d+1):fx(x,d);
  const sa=[5,2,1,.5,.2,.1,.05,.02,.01],extra=fl.on?20:24+String(q?q.lab.W:`WALL ${fL(w)} +0/−${fL(tW,3)}`).length*1.6,fitS=x=>x*Dm<=118&&x*L<=125&&80+x*(Dm/2+L)+(fl.on?52:46)+extra<=334,s=q&&q.scale>0?q.scale:(sa.find(fitS)||.01),scl=s>=1?`${s}:1`:`1:${Math.round(1/s)}`;
  const cy=118,cx1=80,rO=OD*s/2,rI=ID*s/2,rF=fl.on?fl.FD*s/2:rO,cs=ch>0?Math.min(Math.max(ch*s,.8),(rO-rI)*.8):0,cx2=cx1+rF+(fl.on?52:46)+L*s/2,x0=cx2-L*s/2,x1=cx2+L*s/2,xF=x1-(fl.on?fl.T*s:0);
  const yTO=cy-rO,yTI=cy-rI,yBI=cy+rI,yBO=cy+rO,yTF=cy-rF,yBF=cy+rF,hh=L/2,n=v=>+v.toFixed(2),pts=a=>a.map(q=>n(q[0])+','+n(q[1])).join(' ');
  const dh=(a,b,yr,y,t)=>{const k=y>yr?1:-1;return `<line class="k2" x1="${n(a)}" y1="${n(yr+k)}" x2="${n(a)}" y2="${n(y+k*2)}"/><line class="k2" x1="${n(b)}" y1="${n(yr+k)}" x2="${n(b)}" y2="${n(y+k*2)}"/><line class="k4" x1="${n(a)}" y1="${n(y)}" x2="${n(b)}" y2="${n(y)}"/><text x="${n((a+b)/2)}" y="${n(y-1.2)}" text-anchor="middle">${e(t)}</text>`};
  const dv=(a,b,xr,x,t)=>{const k=x>xr?1:-1;return `<line class="k2" x1="${n(xr+k)}" y1="${n(a)}" x2="${n(x+k*2)}" y2="${n(a)}"/><line class="k2" x1="${n(xr+k)}" y1="${n(b)}" x2="${n(x+k*2)}" y2="${n(b)}"/><line class="k4" x1="${n(x)}" y1="${n(a)}" x2="${n(x)}" y2="${n(b)}"/><text transform="translate(${n(x-2.6)} ${n((a+b)/2)}) rotate(-90)" text-anchor="middle">${e(t)}</text>`};
  const cell=(x,y,wd,h,l,t,sz=3.6)=>`<rect class="k1" x="${x}" y="${y}" width="${wd}" height="${h}"/><text class="lb" x="${x+1}" y="${y+2.6}">${l}</text><text x="${x+1.5}" y="${y+h-1.7}" style="font-size:${Math.min(sz,(wd-3)/Math.max(1,String(t).replace(/&[#a-z0-9]+;/g,"x").length*.5)).toFixed(2)}px">${t}</text>`;
  const inner=(th,sgn)=>{const a=[];for(let k=0;k<=160;k++)a.push([x0+(x1-x0)*k/160,(sgn<0?yTI:yBI)+(sgn<0?-1:1)*gz(th,-hh+L*k/160)*s]);return a};
  const topOut=fl.on?[[x0,yTO+cs],[x0+cs,yTO],[xF,yTO],[xF,yTF],[x1,yTF]]:[[x0,yTO+cs],[x0+cs,yTO],[x1-cs,yTO],[x1,yTO+cs]];
  const botOut=fl.on?[[x0,yBO-cs],[x0+cs,yBO],[xF,yBO],[xF,yBF],[x1,yBF]]:[[x0,yBO-cs],[x0+cs,yBO],[x1-cs,yBO],[x1,yBO-cs]];
  const ti=inner(Math.PI/2,-1),bi=inner(3*Math.PI/2,1),topP=[...topOut,...ti.slice().reverse()],botP=[...botOut,...bi.slice().reverse()];
  const idEnd=G.type==='none'?`<circle class="k1" cx="${cx1}" cy="${cy}" r="${n(rI)}"/>`:`<path class="k1" d="M${Array.from({length:720},(_,k)=>{const t=2*Math.PI*k/720,r=rI+gz(t,hh)*s;return n(cx1+r*Math.cos(t))+','+n(cy-r*Math.sin(t))}).join('L')}Z"/>`;
  const lab=q?q.lab:{OD:`OD Ø${fL(OD)} ±${fL(tOD,3)}`,ID:`ID Ø${fL(ID)} ±${fL(tID,3)}`,L:`${fL(L)} +0/−${fL(tL)}`,W:`WALL ${fL(w)} +0/−${fL(tW,3)}`,FD:`Ø${fL(fl.FD)}`,T:`${fL(fl.T)}`};
  const gw=G.type==='none'?0:grooveWidth(G.d,G.r);
  const ex=p.ex||0,fit=[[p.Hmin>0?'HOUSING Ø MAX':'HOUSING Ø',fL(H)]];if(p.Hmin>0)fit.push(['HOUSING Ø MIN',fL(p.Hmin)]);fit.push(['SHAFT Ø',fL(D)],['PRESS FIT',pf&&!(p.gap>0)?fL(press,3):'NONE'],['BORE CLOSURE',fL(clo,3)],['ASSEMBLY CLEARANCE',fL(c,3)]);if(ex>0)fit.push(['ADDITIONAL CLEARANCE',fL(ex,3)]);if(p.gap>0)fit.push(['EXPANSION GAP',fL(p.gap,2)]);fit.push(['FITTED INSIDE Ø',fL(D+c+ex,3)]);if(!q)fit.push(['BEARING OUTSIDE Ø (OD)',`${fL(OD)} ±${fL(tOD,3)}`],['BEARING INSIDE Ø (ID)',`${fL(ID)} ±${fL(tID,3)}`],['WALL THICKNESS',`${fL(w)} +0/−${fL(tW,3)}`]);else fit.push(['WALL',fL(w)]);
  if(fl.on)fit.push(['FLANGE Ø',fL(fl.FD)],['FLANGE THICKNESS',fL(fl.T)]);
  if(G.type!=='none'){fit.push(['GROOVE TYPE',GTYPES[G.type]],['GROOVE QTY',String(G.n)],['GROOVE DEPTH',fL(G.d)],['GROOVE RADIUS',fL(G.r)],['GROOVE WIDTH',fL(gw)]);if(G.type==='spiral')fit.push(['SPIRAL PITCH',fL(G.pitch)]);if(G.type==='blind')fit.push(['GROOVE LENGTH',fL(G.len)])}
  const fitSentence=pf?'INTERFERENCE FIT INTO HOUSING. FREEZE-FIT OR PRESS WITH A MANDREL.':'NO PRESS FIT: SECURE THE BEARING MECHANICALLY OR BY BONDING.';
  const notes=dw.notes?['NOTES',...(imp?dw.noteText.replace(/ALL DIMENSIONS IN mm/i,'ALL DIMENSIONS IN INCHES'):dw.noteText).replace('{FIT}',fitSentence).split('\n').slice(0,11)]:[];
  const title=q?q.title:(p.tt||dw.title||'BEARING')+(fl.on?' (FLANGED)':'')+' — '+GRADES[g][0],fitRows=q?q.table:fit;
  const lgBox=logo&&dw.showLogo?(()=>{const wd=Math.min(38,12*logo.r),ht=wd/logo.r;return `<image href="${logo.u}" xlink:href="${logo.u}" x="${n(220+(42-wd)/2)}" y="${n(245+(16-ht)/2)}" width="${n(wd)}" height="${n(ht)}" preserveAspectRatio="xMidYMid meet"/>`})():`<text x="241" y="254.5" text-anchor="middle" style="font-size:3.4px;font-weight:bold">${e(dw.company)}</text>`;
  const rowH=4.8;
  let gdim='',call='',det='';
  if(G.type!=='none'&&G.d>0&&G.r>0){
    const R=G.r,cd=G.d-R,gw2=grooveWidth(G.d,R),lead=G.pitch>0?G.pitch:100,prof=x=>{const q2=R*R-x*x;if(q2<0)return 0;const z=cd+Math.sqrt(q2);return z>0?Math.min(z,G.d):0};
    const tipY=yTI-G.d*s,fitT=(t,sp)=>t.length*1.8<=Math.min(L*s-4,sp-2),dyl=yTI+rI*.62,roomy=rI>=17;
    let pxs=[cx2],tgt=cx2,cmx=cx2;
    if(G.type==='blind')pxs=[cx2-G.len*s/2,cx2+G.len*s/2];
    if(G.type==='spiral'){const sp=lead/G.n;if(sp<L*.9&&sp*s>=6){pxs=[cx2-sp*s,cx2];cmx=cx2-sp*s/2;tgt=cx2}}
    if(roomy&&G.type==='blind'&&G.len*s>=8){const t=`${fL(G.len)} LONG`;gdim=dh(pxs[0],pxs[1],yTI,dyl,fitT(t,G.len*s)?t:fL(G.len))}
    if(roomy&&G.type==='spiral'&&pxs.length===2){const sp=lead/G.n,t=`${fL(sp,1)} SPACING`;gdim=dh(pxs[0],pxs[1],yTI,dyl,fitT(t,sp*s)?t:fL(sp,1))}
    call=`<line class="k2" marker-start="url(#vA)" x1="${n(tgt)}" y1="${n(tipY)}" x2="${n(cmx)}" y2="${n(yTI+2.4)}"/><circle class="k1" cx="${n(cmx)}" cy="${n(yTI+4.9)}" r="2.6" style="fill:#fff"/><text x="${n(cmx)}" y="${n(yTI+6.1)}" text-anchor="middle" style="font-size:3.2px;font-weight:bold">B</text>`;
    const py=dw.fit?16+rowH*(fitRows.length+1)+7:16,sd=Math.min(32/gw2,18/G.d),bw=Math.max(30,gw2*sd+12),cxm=372,xl=cxm-bw/2,xr=cxm+bw/2,y0=py+20,dd=G.d*sd,yb=y0+dd+5,hw=gw2/2*sd;
    const pr=[];for(let i=0;i<=24;i++){const x=-gw2/2+gw2*i/24;pr.push([cxm+x*sd,y0+prof(x)*sd])}
    const poly=[[xl,y0],[cxm-hw,y0],...pr,[cxm+hw,y0],[xr,y0],[xr,yb],[xl,yb]];
    const xp=-.45*gw2/2,P=[cxm+xp*sd,y0+prof(xp)*sd];
    const lines=[`${G.n} × ${GTYPES[G.type]} GROOVE${G.n>1?'S':''}`,`DEPTH ${fL(G.d)}   RADIUS R${fL(R)}`,`WIDTH AT SURFACE ${fL(gw2)}`];
    if(G.type==='spiral')lines.push(`PITCH (LEAD) ${fL(lead)}`,`${G.n} START${G.n>1?'S':''}, AXIAL SPACING ${fL(lead/G.n,1)}`);
    else if(G.type==='blind')lines.push(`LENGTH ${fL(G.len)} (BETWEEN END`,`RADIUS CENTRES), CLOSED ENDS`);
    else lines.push('FULL LENGTH, OPEN BOTH ENDS');
    const ty=yb+8,ph=ty+lines.length*3.6+1-py;
    det=`<g><rect class="k1" x="338" y="${n(py)}" width="68" height="${n(ph)}"/><text x="340" y="${n(py+4)}" class="sm" style="font-weight:bold;font-size:3px">DETAIL B — GROOVE SECTION</text><text x="340" y="${n(py+8)}" class="sm" style="font-size:2.4px">SCALE ${sd>=1?fx(sd,1)+':1':'1:'+fx(1/sd,1)}  (NOT TO DRAWING SCALE)</text>
<polygon class="k1" style="fill:url(#vh)" points="${pts(poly)}"/>
${dh(cxm-hw,cxm+hw,y0,y0-6,fL(gw2))}
<line class="k6" x1="${n(cxm)}" y1="${n(y0+dd)}" x2="${n(xr)}" y2="${n(y0+dd)}"/>${dv(y0,y0+dd,xr,xr+8,fL(G.d))}
<polyline class="k2" marker-start="url(#vA)" points="${n(P[0])},${n(P[1])} ${n(xl-2)},${n(P[1]+4)}"/><text x="${n(xl-3)}" y="${n(P[1]+5.2)}" text-anchor="end" style="font-size:3px">R${fL(R)}</text>
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
<line class="k3" x1="${n(x0-9)}" y1="${cy}" x2="${n(x1+4)}" y2="${cy}"/>
<text x="${n(cx2)}" y="${n(yBF+27)}" text-anchor="middle" class="tt">SECTION A–A</text>
${dh(x0,x1,yBF,yBF+11,lab.L)}
${dv(yTI,yBI,x0,x0-13,lab.ID)}
${fl.on?dv(yTO,yBO,x0,x0-27,lab.OD)+dv(yTF,yBF,x1,x1+13,lab.FD)+dh(xF,x1,yTF,yTF-11,lab.T):dv(yTO,yBO,x1,x1+11,lab.OD)+(()=>{const x=x1+20;return `<line class="k2" x1="${n(x1+1)}" y1="${n(yTO)}" x2="${n(x+2)}" y2="${n(yTO)}"/><line class="k2" x1="${n(x1+1)}" y1="${n(yTI)}" x2="${n(x+2)}" y2="${n(yTI)}"/><line class="k4" x1="${n(x)}" y1="${n(yTO)}" x2="${n(x)}" y2="${n(yTI)}"/><text x="${n(x+3)}" y="${n((yTO+yTI)/2+1.2)}" style="font-size:3px">${e(lab.W)}</text>`})()}
${cs>0?`<polyline class="k2" marker-start="url(#vA)" points="${n(x0+cs*.4)},${n(yTO+cs*.4)} ${n(x0-6)},${n(fl.on?yTF-21:yTO-12)} ${n(x0)},${n(fl.on?yTF-21:yTO-12)}"/>
<text x="${n(x0+1)}" y="${n(fl.on?yTF-22:yTO-13)}">${e(q&&q.chText?q.chText:`${fL(ch,1)} × 30° CHAMFER, OD LEAD-IN`)}</text>`:''}
${gdim}${call}
</g>
${dw.fit?`<g><rect class="k1" x="338" y="16" width="68" height="${n(rowH*(fitRows.length+1)+1)}"/><text x="340" y="20" class="sm" style="font-weight:bold;font-size:3px">FIT AND FEATURE DATA (${imp?'in':'mm'})</text>${fitRows.map((r,i)=>`<line class="k2" x1="338" y1="${n(21+i*rowH)}" x2="406" y2="${n(21+i*rowH)}"/><text class="sm" x="340" y="${n(24.4+i*rowH)}">${e(String(r[0]).slice(0,24))}</text><text class="sm" x="404" y="${n(24.4+i*rowH)}" text-anchor="end">${e(String(r[1]).slice(0,28))}</text>`).join('')}</g>`:''}
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

/* ---------- STEP (ISO 10303-21, AP214) export. Solid B-rep that opens in common CAD programs: the outside is made of true planes, cylinders and cones (with seam edges), and when grooves exist the bore is a closed skin of small flat faces on real line edges. ---------- */
function stepFile(p){
  const rO=p.OD/2,rI=p.ID/2,L=p.L,fl=p.fl&&p.fl.on,rF=fl?p.fl.FD/2:rO,T=fl?p.fl.T:0,G=p.G||{type:'none'},gz=p.gz,hh=L/2,hasG=G.type!=='none'&&typeof gz==='function';
  const c=Math.max(0,Math.min(p.ch||0,(rO-rI)*.8,(L-T)*.4));
  const OP=[];if(c>0)OP.push([rO-c,0],[rO,c]);else OP.push([rO,0]);
  if(fl)OP.push([rO,L-T],[rF,L-T],[rF,L]);else if(c>0)OP.push([rO,L-c],[rO-c,L]);else OP.push([rO,L]);
  const r6=x=>{x=Math.round(x*1e6)/1e6;return Object.is(x,-0)?0:x},fm=x=>{const s=r6(x).toFixed(6).replace(/0+$/,'');return s};
  const E=[];let n=0;const add=s=>{E.push(`#${++n}=${s};`);return n};
  const PC=new Map(),DC=new Map(),VC=new Map(),LC=new Map(),CC=new Map();
  const cp=(x,y,z)=>{const k=fm(x)+','+fm(y)+','+fm(z);let i=PC.get(k);if(!i){i=add(`CARTESIAN_POINT('',(${k}))`);PC.set(k,i)}return i};
  const di=(x,y,z)=>{const m=Math.hypot(x,y,z)||1,k=fm(x/m)+','+fm(y/m)+','+fm(z/m);let i=DC.get(k);if(!i){i=add(`DIRECTION('',(${k}))`);DC.set(k,i)}return i};
  const ax=(o,d,r)=>add(`AXIS2_PLACEMENT_3D('',#${cp(...o)},#${di(...d)},#${di(...r)})`);
  const vt=(x,y,z)=>{x=r6(x);y=r6(y);z=r6(z);const k=x+','+y+','+z;let v=VC.get(k);if(!v){const pid=cp(x,y,z);v={id:add(`VERTEX_POINT('',#${pid})`),pid,p:[x,y,z]};VC.set(k,v)}return v};
  const ln=(a,b)=>{const lo=a.id<b.id?a:b,hi=lo===a?b:a,k=lo.id+'_'+hi.id;let e=LC.get(k);
    if(!e){const d=[hi.p[0]-lo.p[0],hi.p[1]-lo.p[1],hi.p[2]-lo.p[2]],len=Math.hypot(...d),ve=add(`VECTOR('',#${di(...d)},${fm(len)})`),li=add(`LINE('',#${lo.pid},#${ve})`);e=add(`EDGE_CURVE('',#${lo.id},#${hi.id},#${li},.T.)`);LC.set(k,e)}
    return[e,a===lo?'.T.':'.F.']};
  const ce=(r,z)=>{const k=fm(r)+'_'+fm(z);let o=CC.get(k);if(!o){const v=vt(r,0,z),ci=add(`CIRCLE('',#${ax([0,0,z],[0,0,1],[1,0,0])},${fm(r)})`);o={v,e:add(`EDGE_CURVE('',#${v.id},#${v.id},#${ci},.T.)`)};CC.set(k,o)}return o};
  const loop=it=>add(`EDGE_LOOP('',(${it.map(([e,s])=>'#'+add(`ORIENTED_EDGE('',*,*,#${e},${s})`)).join(',')}))`);
  const faces=[];
  const face=(outer,inner,surf,sense)=>faces.push(add(`ADVANCED_FACE('',(#${add(`FACE_OUTER_BOUND('',#${loop(outer)},.T.)`)}${inner?`,#${add(`FACE_BOUND('',#${loop(inner)},.T.)`)}`:''}),#${surf},${sense})`));
  /* ID ring at the two ends: circle, or a polygon when grooves exist */
  let rows=null;
  if(hasG){
    const gw=grooveWidth(G.d,G.r),R=G.r,cdp=G.d-R;let ys,angs=[];
    if(G.type==='spiral'){const nr=Math.min(48,Math.max(24,Math.ceil(L/(gw/2.5)))),Nt=Math.max(72,Math.min(180,Math.floor(9000/(2*(nr-1)))));ys=Array.from({length:nr+1},(_,j)=>-hh+L*j/nr);for(let i=0;i<Nt;i++)angs.push(2*Math.PI*i/Nt)}
    else{
      if(G.type==='long')ys=[-hh,hh];
      else{const s=new Set([-hh,hh,0]),hl=(G.len||0)/2;for(let k=0;k<=14;k++){const d=hl+R*k/14;[d,-d].forEach(v=>{if(Math.abs(v)<hh-1e-9)s.add(r6(v))})}ys=[...s].sort((a,b)=>a-b)}
      const M=G.type==='long'?12:8,sec=2*Math.PI/G.n,t0=Math.PI/2,ph=Math.min(sec/2*.999,gw/2/rI);
      for(let k=0;k<G.n;k++){const th=t0+k*sec;for(let j=0;j<=M;j++)angs.push(th-ph+2*ph*j/M);if(cdp>0)angs.push(th-ph-.002,th+ph+.002)}
      const m=Math.ceil(2*Math.PI/(4*Math.PI/180));for(let i=0;i<m;i++)angs.push(2*Math.PI*i/m);
    }
    const norm=a=>{a=a%(2*Math.PI);return a<0?a+2*Math.PI:a};
    angs=[...new Set(angs.map(a=>Math.round(norm(a)*1e7)/1e7))].sort((a,b)=>a-b).filter((a,i,s)=>i===0||a-s[i-1]>2e-6);
    if(angs.length>1&&2*Math.PI-angs[angs.length-1]+angs[0]<2e-6)angs.pop();
    rows=ys.map(y=>{const rr=angs.map(t=>rI+gz(t,y));return{z:y+hh,rr,vs:angs.map((t,i)=>vt(rr[i]*Math.cos(t),rr[i]*Math.sin(t),y+hh))}});
  }
  const inner0=hasG?rows[0].vs:null,inner1=hasG?rows[rows.length-1].vs:null;
  const Z=[[0,0,1]],ringLoop=(vs,rev)=>{const N=vs.length,it=[];for(let i=0;i<N;i++){const a=vs[i],b=vs[(i+1)%N];it.push(ln(a,b))}return rev?it.map(([e,s])=>[e,s==='.T.'?'.F.':'.T.']).reverse():it};
  const plane=(z,sg)=>add(`PLANE('',#${ax([0,0,z],[0,0,sg],[1,0,0])})`);
  /* bottom end face (normal -z) */
  {const oc=ce(OP[0][0],0);face([[oc.e,'.F.']],hasG?ringLoop(inner0,false):[[ce(rI,0).e,'.T.']],plane(0,-1),'.T.')}
  /* outside: planes, cylinders and cones between consecutive outer nodes */
  for(let i=0;i<OP.length-1;i++){const a=OP[i],b=OP[i+1];
    if(a[1]===b[1]){const big=Math.max(a[0],b[0]),sm=Math.min(a[0],b[0]),dn=b[0]>a[0],bo=ce(big,a[1]),so=ce(sm,a[1]);face([[bo.e,dn?'.F.':'.T.']],[[so.e,dn?'.T.':'.F.']],plane(a[1],dn?-1:1),'.T.')}
    else{const c0=ce(a[0],a[1]),c1=ce(b[0],b[1]),up=ln(c0.v,c1.v),dw=ln(c1.v,c0.v),it=[[c0.e,'.T.'],up,[c1.e,'.F.'],dw];let sf;
      if(a[0]===b[0])sf=add(`CYLINDRICAL_SURFACE('',#${ax([0,0,0],[0,0,1],[1,0,0])},${fm(a[0])})`);
      else{const al=Math.atan(Math.abs(b[0]-a[0])/(b[1]-a[1])).toFixed(8);sf=b[0]>a[0]?add(`CONICAL_SURFACE('',#${ax([0,0,a[1]],[0,0,1],[1,0,0])},${fm(a[0])},${al})`):add(`CONICAL_SURFACE('',#${ax([0,0,b[1]],[0,0,-1],[1,0,0])},${fm(b[0])},${al})`)}
      face(it,null,sf,'.T.')}}
  /* top end face (normal +z) */
  {const oc=ce(OP[OP.length-1][0],L);face([[oc.e,'.T.']],hasG?ringLoop(inner1,true):[[ce(rI,L).e,'.F.']],plane(L,1),'.T.')}
  /* bore */
  if(!hasG){const c0=ce(rI,0),c1=ce(rI,L),up=ln(c0.v,c1.v),dw=ln(c1.v,c0.v);face([[c0.e,'.F.'],up,[c1.e,'.T.'],dw],null,add(`CYLINDRICAL_SURFACE('',#${ax([0,0,0],[0,0,1],[1,0,0])},${fm(rI)})`),'.F.')}
  else{
    const poly=vs=>{const N=vs.length;let nx=0,ny=0,nz=0;for(let i=0;i<N;i++){const a=vs[i].p,b=vs[(i+1)%N].p;nx+=(a[1]-b[1])*(a[2]+b[2]);ny+=(a[2]-b[2])*(a[0]+b[0]);nz+=(a[0]-b[0])*(a[1]+b[1])}
      const m=Math.hypot(nx,ny,nz)||1,nv=[nx/m,ny/m,nz/m],o=vs[0].p,e1=[vs[1].p[0]-o[0],vs[1].p[1]-o[1],vs[1].p[2]-o[2]],dt=e1[0]*nv[0]+e1[1]*nv[1]+e1[2]*nv[2],rf=[e1[0]-dt*nv[0],e1[1]-dt*nv[1],e1[2]-dt*nv[2]];
      const pl=add(`PLANE('',#${ax(o,nv,rf)})`);face(vs.map((a,i)=>ln(a,vs[(i+1)%N])),null,pl,'.T.')};
    for(let j=0;j<rows.length-1;j++){const A=rows[j],B=rows[j+1],N=A.vs.length,flat=A.rr.every((r,i)=>Math.abs(r-B.rr[i])<1e-9);
      for(let i=0;i<N;i++){const i2=(i+1)%N,a=A.vs[i],b=A.vs[i2],cc=B.vs[i2],d=B.vs[i];if(flat)poly([a,d,cc,b]);else{poly([a,d,cc]);poly([a,cc,b])}}}
  }
  const nm=String(p.name||'BUSH').replace(/[^\x20-\x7E]/g,'').replace(/'/g,"''")||'BUSH';
  const shell=add(`CLOSED_SHELL('',(${faces.map(x=>'#'+x).join(',')}))`),brep=add(`MANIFOLD_SOLID_BREP('${nm}',#${shell})`);
  const len=add("(LENGTH_UNIT()NAMED_UNIT(*)SI_UNIT(.MILLI.,.METRE.))"),ang=add("(NAMED_UNIT(*)PLANE_ANGLE_UNIT()SI_UNIT($,.RADIAN.))"),sa=add("(NAMED_UNIT(*)SI_UNIT($,.STERADIAN.)SOLID_ANGLE_UNIT())");
  const unc=add(`UNCERTAINTY_MEASURE_WITH_UNIT(LENGTH_MEASURE(1.E-05),#${len},'distance_accuracy_value','confusion accuracy')`);
  const ctx=add(`(GEOMETRIC_REPRESENTATION_CONTEXT(3)GLOBAL_UNCERTAINTY_ASSIGNED_CONTEXT((#${unc}))GLOBAL_UNIT_ASSIGNED_CONTEXT((#${len},#${ang},#${sa}))REPRESENTATION_CONTEXT('Context3d','3D Context with UNIT and UNCERTAINTY'))`);
  const a0=ax([0,0,0],[0,0,1],[1,0,0]),rep=add(`ADVANCED_BREP_SHAPE_REPRESENTATION('',(#${a0},#${brep}),#${ctx})`);
  const ac=add("APPLICATION_CONTEXT('core data for automotive mechanical design processes')"),pc=add(`PRODUCT_CONTEXT('',#${ac},'mechanical')`),pr=add(`PRODUCT('${nm}','${nm}','',(#${pc}))`);
  const pf=add(`PRODUCT_DEFINITION_FORMATION('','',#${pr})`),pdc=add(`PRODUCT_DEFINITION_CONTEXT('part definition',#${ac},'design')`),pd=add(`PRODUCT_DEFINITION('design','',#${pf},#${pdc})`),pds=add(`PRODUCT_DEFINITION_SHAPE('','',#${pd})`);
  add(`SHAPE_DEFINITION_REPRESENTATION(#${pds},#${rep})`);add(`APPLICATION_PROTOCOL_DEFINITION('international standard','automotive_design',2000,#${ac})`);add(`PRODUCT_RELATED_PRODUCT_CATEGORY('part','',(#${pr}))`);
  return `ISO-10303-21;\nHEADER;\nFILE_DESCRIPTION(('Vesco Intelligence bush, solid B-rep${hasG?', grooves as flat faces':''}'),'2;1');\nFILE_NAME('${nm}.step','${new Date().toISOString().slice(0,19)}',('Vesco Intelligence'),(''),'Vesco Intelligence','Vesco Intelligence','');\nFILE_SCHEMA(('AUTOMOTIVE_DESIGN { 1 0 10303 214 1 1 1 1 }'));\nENDSEC;\nDATA;\n${E.join('\n')}\nENDSEC;\nEND-ISO-10303-21;\n`;
}
const stepDownload=()=>{if(!LAST||!LAST.step)return;deliver(new Blob([stepFile(LAST.step)],{type:'application/octet-stream'}),LAST.drg+'.step');log('Downloaded STEP',LAST.drg)};

/* Files: iOS home-screen apps cannot download directly, so use the share sheet when available */
async function deliver(blob,name,o={}){
  if(!o.noChat&&ME&&OKR.includes(ROLE)&&db&&!o.chosen){return sheet(`<h2>${esc(name)}</h2><div class="acts" style="flex-direction:column;align-items:stretch"><button class="btn pri" id="dgo">Open / share</button><button class="btn" id="dgc">Send to chat</button><button class="btn" id="dgx">Cancel</button></div>`,(w,x)=>{$('#dgx',w).onclick=x;$('#dgo',w).onclick=()=>{x();deliver(blob,name,{chosen:1})};$('#dgc',w).onclick=()=>{x();cShare(blob,name)}})}
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
/* ---------- Design a bearing: industrial, pump, marine rudder and marine stern calculators ---------- */
const MODES={ind:'Industrial',pump:'Pump',rud:'Marine rudder',stern:'Marine stern'};
const GRS=[[79,7,7,4,12],[119,7,9,5,18],[159,7,10,6,24],[199,7,12,7,30],[249,7,12,8,38],[299,7,14,8,45],[349,8,15,8,53],[399,8,15,8,60],[499,9,15,9,75],[599,10,18,9,90],[699,11,18,9,105],[800,12,18,9,120]];  /* stern tube: shaft Ø max, grooves, width, depth, water l/min */
const DV={},UQ={'mm':'L','°C':'T','kg':'M','MPa·m/min':'PV'},UC={L:{u:'mm',i:'in',to:x=>x*25.4,from:x=>x/25.4,d:4},T:{u:'°C',i:'°F',to:x=>(x-32)*5/9,from:x=>x*9/5+32,d:1},M:{u:'kg',i:'lb',to:x=>x*.45359237,from:x=>x/.45359237,d:2},PV:{u:'MPa·m/min',i:'psi·ft/min',to:x=>x/475.86,from:x=>x*475.86,d:0}};
/* All sizes from the Vesconite size-calculation equations (metric). Industrial and pump share one set; rudder and stern use the marine set. */
function bearCalc(mode,i){
  const{H,D,L,pf,tx,tn,gk}=i,mar=mode==='rud'||mode==='stern',Hn=i.Hmin>0?i.Hmin:H;
  let std=0.05+0.002*H,add=0;
  if(mar){if(Number.isFinite(tn)){if(tn<=-10)std=0.05+0.0034*H;else if(tn<-5)std=0.05+(0.002+0.0014*(-5-tn)/5)*H}}
  else if(Number.isFinite(tn)&&tn<5)add=(5-tn)*0.000054*H;
  const hot=Number.isFinite(tx)&&tx>70,forced=pf&&hot,press=pf&&!hot?std+add:0,gap=hot?0.1+H*Math.PI*(tx-25)*K:0;
  const ex=Number.isFinite(tx)&&tx>50?(H*H-D*D)*(tx-50)*K/D:0,clo=press*D/H,OD=H+press;
  const c=mar?(mode==='rud'?0.2+0.0015*D:0.2+0.002*D):(0.05+0.01*(OD-D-clo-ex))/1.01;
  const ID=D+clo+c+ex,w=(OD-ID)/2,iMin=press,iMax=pf&&!hot?OD-Hn:0;
  const E=gk==='h'?2200:2300,mu=gk==='h'?0.10:0.15,ro=OD/2,ri=ID/2,pr=press>0&&w>0?E*(press/2)/(ro*((ro*ro+ri*ri)/(ro*ro-ri*ri)-0.4)):0;
  return{press,std,add,clo,OD,c,ex,ID,w,gap,iMin,iMax,forced,hot,Hn,force:pr*mu*Math.PI*OD*L/1000,odCold:OD*(1-K*50)};
}
function design(v,id){
  if(!S.feat.pv){location.hash='#/tools';return}
  let mode=MODES[id]?id:'ind';if(!MODES[id]){try{const m=localStorage.getItem('vi4m');if(MODES[m])mode=m}catch{}}
  try{localStorage.setItem('vi4m',mode)}catch{}
  const mar=mode==='rud'||mode==='stern',pump=mode==='pump',load=!mar;
  let im=false;try{im=localStorage.getItem('vi4u_'+mode)==='i'}catch{}
  const g=id=>{const e=$('#'+id);if(!e)return NaN;const x=parseFloat(e.value);if(!e.dataset.q||!im)return x;if(e.dataset.mv!==undefined&&e.value===e.dataset.dv)return +e.dataset.mv;return UC[e.dataset.q].to(x)};
  const put=(id,x)=>{const e=$('#'+id);if(!e)return;delete e.dataset.mv;delete e.dataset.dv;if(x==null||!Number.isFinite(+x)){e.value='';return}const q=e.dataset.q;if(q&&im){e.value=+UC[q].from(+x).toFixed(UC[q].d);e.dataset.mv=x;e.dataset.dv=e.value}else e.value=+(+x).toFixed(6)};
  const dL=(x,d=2)=>fx(im?x/25.4:x,im?d+1:d),uL=()=>im?'in':'mm',tF=c=>{const x=im?c*9/5+32:c;return `${Math.abs(x-Math.round(x))<.05?Math.round(x):x.toFixed(1)} ${im?'°F':'°C'}`};
  const nP=x=>fx(im?x*145.038:x,im?0:2),nV=x=>fx(im?x*3.28084:x,1),nPV=x=>fx(im?x*475.86:x,im?0:1),pM=x=>`${nP(x)} ${im?'psi':'MPa'}`,vS=x=>`${nV(x)} ${im?'ft/min':'m/min'}`,pvS=x=>`${nPV(x)} ${im?'psi·ft/min':'MPa·m/min'}`,fcS=x=>im?`${fx(x*224.809,0)} lbf`:`${fx(x,1)} kN`,flS=x=>im?`${fx(x*.264172,2)} US gal/min`:`${x} l/min`;
  T3=null;T3L=false;LAST=null;
  if(!S.dw.logo)repoLogo().then(r=>{if(r&&!window.__rl){window.__rl=r;if($('#DF'))$('#DF').dispatchEvent(new Event('input'))}});
  const n=(id,l,u,val='',att='')=>{const q=UQ[u];return `<label>${l} <span class="mut" ${q?`data-u="${q}"`:''}>${q&&im?UC[q].i:u}</span><input id="${id}" type="number" inputmode="decimal" step="any" value="${val}" ${q?`data-q="${q}"`:''} ${att}></label>`};
  const intro={ind:'Bearing size, fit, clearance, grooves and PV for general industrial applications, using the equations in the Vesconite design manual (metric, free-standing bush, sizes at 20 °C).',
    pump:'Bearing and wear-ring sizes for pumps. Vesconite does not publish separate pump equations, so this uses the industrial size equations with the pump inputs (rotation only, wear ring option).',
    rud:'Rudder bearing sizes from the Vesconite marine equations: press fit from the minimum operating temperature, assembly clearance 0.2 mm + 0.0015 × shaft diameter. Rudder bearings generally need no grooves.',
    stern:'Water-lubricated stern tube and strut bearing sizes from the Vesconite marine equations: assembly clearance 0.2 mm + 0.002 × shaft diameter, with the manual\'s groove table. Do not grease these bearings.'}[mode];
  v.innerHTML=`<a class="back" href="#/tools">← Tools</a><h1>Design a bearing</h1>
  <div class="seg un" id="UN"><button type="button" data-u="m" class="${im?'':'on'}">Metric · mm, °C</button><button type="button" data-u="i" class="${im?'on':''}">Imperial · in, °F</button></div>
  <div class="dts" id="MS">${Object.entries(MODES).map(([k,l])=>`<a href="#/design/${k}" class="dt dt-${k} ${k===mode?'on':''}"><i>${{ind:'⚙️',pump:'💧',rud:'🧭',stern:'⚓'}[k]}</i><span>${l.replace('Marine ','Marine<br>')}</span></a>`).join('')}</div>
  <p class="mut">${intro} A design aid: confirm with Vesconite's own Design a Bearing calculator before ordering.</p>
  <form class="card" id="DF"><div class="g2">${mar?`${n('d1','Maximum housing size','mm')}${n('d33','Minimum housing size','mm')}`:n('d1','Housing diameter','mm')}${n('d2','Shaft diameter','mm')}${n('d3','Bearing length (overall)','mm')}
  <label>Grade<select id="d18"><option value="v">Vesconite</option><option value="h" ${mar||pump?'selected':''}>Vesconite Hilube</option></select></label>
  <label>Press fit?<select id="d4"><option value="y">Yes</option><option value="n">No</option></select></label>
  ${pump?`<label>Wear ring?<select id="d34"><option value="n">No</option><option value="y">Yes</option></select></label>`:''}
  ${mode==='ind'?`<label>Operating condition<select id="d5"><option value="wet">Immersed in water</option><option value="dry">Dry, oil or grease</option></select></label>`:''}
  ${n('d6','Max operating temp','°C')}${n('d7','Min operating temp','°C')}${load?`${n('d9','Total mass supported','kg')}${n('d10','Bearings sharing the mass','','1')}`:''}</div>
  ${mode==='ind'?`<label>Motion<select id="d11"><option value="rot">Rotation</option><option value="osc">Oscillation</option><option value="lin">Linear</option></select></label>`:''}
  ${load?`<div class="g2" data-m="rot">${n('d12',pump?'Rotation':'Speed','rpm')}</div>
  <div class="g2" data-m="osc" hidden>${n('d13','Swing angle','degrees')}${n('d14','Cycles per minute','')}</div>
  <div class="g2" data-m="lin" hidden>${n('d15','Travel per stroke','mm')}${n('d16','Cycles per minute','')}</div>
  ${n('d17','PV limit for your grade (optional)','MPa·m/min')}`:''}
  <h3 style="margin-top:6px">Flange</h3><label>Flanged bearing?<select id="d30"><option value="n">No</option><option value="y">Yes</option></select></label>
  <div class="g2" data-f hidden>${n('d31','Flange diameter','mm')}${n('d32','Flange thickness','mm')}</div>
  <h3 style="margin-top:6px">Grooves</h3><label>Groove type<select id="d20"><option value="none">None</option><option value="spiral">Spiral</option><option value="blind">Blind radial</option><option value="long">Longitudinal</option></select></label>
  <div data-g hidden><div class="g2">${n('d21','Number of grooves','')}${n('d22','Groove depth','mm')}${n('d23','Groove radius','mm')}
  <div data-gt="spiral" hidden>${n('d24','Spiral pitch (advance per turn)','mm')}</div><div data-gt="blind" hidden>${n('d25','Groove length','mm')}</div></div>
  <div id="GR" class="note-box"></div></div></form>
  <div class="card" id="MD" hidden><div class="seg"><button type="button" data-t="3d" class="on">3D model</button><button type="button" data-t="dr">Drawing</button></div><div class="m3" id="m3"></div><div id="mdr" class="mdr" hidden></div>
  <div class="acts"><button type="button" class="btn pri" id="mx">Expand to drawing</button><button type="button" class="btn" id="mc">Cutaway view</button><button type="button" class="btn" id="mstep">STEP file</button></div><p class="mut" style="margin:0">3D: drag to rotate, pinch or scroll to zoom. The drawing is generated from the sizes below.</p><p class="mut" id="stn" style="margin:6px 0 0"></p></div>
  <div id="DO"></div>`;
  Object.entries(DV[mode]||{}).forEach(([k,x])=>{const e=$('#'+k);if(!e||x===undefined)return;if(e.dataset.q&&x!=='')put(k,+x);else e.value=x});
  $('#DF').onsubmit=e=>e.preventDefault();
  $$('#MD .seg button').forEach(b=>b.onclick=()=>{$$('#MD .seg button').forEach(x=>x.classList.toggle('on',x===b));$('#m3').hidden=b.dataset.t!=='3d';$('#mdr').hidden=b.dataset.t!=='dr'});
  $('#mx').onclick=openDrawing;$('#mstep').onclick=stepDownload;
  $('#mc').onclick=()=>{if(T3){T3.cut=!T3.cut;$('#mc').textContent=T3.cut?'Full view':'Cutaway view';if(T3.last)upd3(T3,T3.last)}};
  const setU=u=>{const ni=u==='i';if(ni===im)return;const vals=$$('#DF input[data-q]').map(e=>[e.id,e.value===''?null:g(e.id)]);im=ni;try{localStorage.setItem('vi4u_'+mode,u)}catch{}vals.forEach(([id,x])=>put(id,x));$$('#DF [data-u]').forEach(s=>{s.textContent=im?UC[s.dataset.u].i:UC[s.dataset.u].u});$$('#UN button').forEach(b=>b.classList.toggle('on',b.dataset.u===u));$('#GR').dataset.h='';cv()};
  $$('#UN button').forEach(b=>b.onclick=()=>setU(b.dataset.u));
  let lastGt='none',autoDone=false;
  const cv=()=>{
    $$('#DF input,#DF select').forEach(e=>{(DV[mode]=DV[mode]||{})[e.id]=e.dataset.q&&e.value!==''?String(+g(e.id).toFixed(6)):e.value});
    const H=g('d1'),D=g('d2'),L=g('d3'),O=$('#DO'),mo=mode==='ind'?$('#d11').value:'rot',MD=$('#MD'),fl0=$('#d30').value==='y',gt=$('#d20').value;
    $$('[data-m]').forEach(x=>x.hidden=x.dataset.m!==mo);$$('[data-f]').forEach(x=>x.hidden=!fl0);$$('[data-g]').forEach(x=>x.hidden=gt==='none');$$('[data-gt]').forEach(x=>x.hidden=x.dataset.gt!==gt);
    const bad=m=>{MD.hidden=true;O.innerHTML=m};
    if(!(H>0&&D>0&&L>0))return bad(`<p class="mut">Enter ${mar?'the maximum housing size, ':'the housing diameter, '}shaft diameter and bearing length.</p>`);
    const Hmin=mar?g('d33'):NaN;
    if(mar&&Hmin>0&&Hmin>H)return bad('<p class="note bad">The minimum housing size cannot be larger than the maximum housing size.</p>');
    if(H<=D)return bad('<p class="note bad">The housing diameter must be larger than the shaft diameter.</p>');
    const gk=$('#d18').value,pf=$('#d4').value==='y',dry=mode==='ind'&&$('#d5').value==='dry',wr=pump&&$('#d34').value==='y',tx=g('d6'),tn=g('d7'),nb=load&&g('d10')>0?g('d10'):1;
    const R=bearCalc(mode,{H,Hmin,D,L,pf,tx,tn,gk}),{press,clo,OD,c,ex,ID,w,gap}=R;
    if(!(w>0))return bad('<p class="note bad">These sizes leave no bearing wall. Check the diameters.</p>');
    const fl={on:fl0,FD:g('d31'),T:g('d32')};
    if(fl0){if(!(fl.FD>OD&&fl.T>0))return bad('<p class="note bad">Enter a flange diameter larger than the bearing outside diameter ('+dL(OD)+' '+uL()+') and a flange thickness.</p>');if(fl.T>=L)return bad('<p class="note bad">The flange thickness must be less than the overall bearing length.</p>')}
    const G={type:gt,n:g('d21'),d:g('d22'),r:g('d23'),pitch:g('d24'),len:g('d25')},rec=gt!=='none'?recGroove(gt,D,w,L,mode):null;
    if(gt!==lastGt){lastGt=gt;autoDone=false}
    if(gt!=='none'&&rec&&!autoDone){autoDone=true;let ch=false;const set=(id,x)=>{if(!(+$('#'+id).value>0)&&x!=null){put(id,x);ch=true}};set('d21',rec.n);set('d22',rec.d);set('d23',rec.r);if(gt==='spiral')set('d24',rec.pitch);if(gt==='blind')set('d25',rec.len);if(ch)return cv()}
    const tblTxt=mode==='stern'?'The manual\'s stern tube groove table covers shaft diameters of 60–800 mm.':'The manual\'s groove table covers shaft diameters of 20–200 mm.';
    const grHtml=gt==='none'?'':rec?`<p class="mut" style="margin:6px 0">Recommended for a ${dL(D,0)} ${uL()} shaft: ${gt==='spiral'||gt==='blind'?'width, depth and radius from the manual\'s groove table; count, pitch and length are suggested starting points. ':''}<b>${rec.n} grooves, depth ${dL(rec.d,1)} ${uL()}, radius ${dL(rec.r,1)} ${uL()}</b> (about ${dL(grooveWidth(rec.d,rec.r),1)} ${uL()} wide)${gt==='spiral'?`, pitch ${dL(rec.pitch,0)} ${uL()}`:''}${gt==='blind'?`, length ${dL(rec.len,0)} ${uL()}`:''}. Water flow about ${flS(rec.q)}.${rec.lim?` Depth reduced to keep it under ${mode==='rud'?'a third':'half'} of the wall.`:''}</p><button type="button" class="btn" id="ra">Apply recommendation</button>`:`<p class="mut">${tblTxt} Enter your own values.</p>`;
    if($('#GR').dataset.h!==grHtml){$('#GR').dataset.h=grHtml;$('#GR').innerHTML=grHtml}
    if(rec&&$('#ra'))$('#ra').onclick=()=>{const set=(id,x)=>put(id,x);set('d21',rec.n);set('d22',rec.d);set('d23',rec.r);if(gt==='spiral')set('d24',rec.pitch);if(gt==='blind')set('d25',rec.len);cv()};
    const gOK=gt==='none'||(G.n>0&&G.d>0&&G.r>0&&(gt!=='spiral'||G.pitch>0)&&(gt!=='blind'||G.len>0));
    const Gu=gOK?G:{type:'none'},gz=grooveFn(Gu,ID/2),gw=gOK&&gt!=='none'?grooveWidth(G.d,G.r):0;
    const ms=load?g('d9'):NaN,P=ms>0?ms*9.81/nb/(D*L):NaN;
    const V=!load?NaN:mo==='rot'?Math.PI*D*g('d12')/1000:mo==='osc'?Math.PI*D/1000*(2*g('d13')/360)*g('d14'):2*g('d15')/1000*g('d16');
    let frac=0;if(gOK&&gt!=='none'){const circ=Math.PI*ID;frac=gt==='long'?G.n*gw/circ:gt==='blind'?G.n*gw*Math.min(G.len,L)/(circ*L):gw/((G.pitch/G.n)*circ/Math.hypot(circ,G.pitch))}
    frac=Math.min(frac,0.9);const Pe=P/(1-frac),PV=Pe*V,lim=load?g('d17'):NaN,wp=w/D*100,ck=[];
    ck.push(wp>=5&&wp<=20?['ok',`Wall thickness is ${fx(wp,1)}% of the shaft diameter (recommended 5–20%).`]:['warn',`Wall thickness is ${fx(wp,1)}% of the shaft diameter, outside the recommended 5–20%.${wp<5?' Thin-walled bearing: please contact Vesconite. Thin walls need care when machining and fitting; consider bonding or mechanical securing.':''}`]);
    if(mode==='stern')ck.push(L/D>=4?['ok',`Length is ${fx(L/D,1)} × the shaft diameter (traditionally 4 ×; shorter bearings are often adequate).`]:['ok',`Length is ${fx(L/D,1)} × the shaft diameter. Stern tube bearings are traditionally 4 × the shaft diameter; shorter bearings are often adequate.`]);
    else if(L>D)ck.push(['warn','The bearing is longer than its diameter. Long bearings need additional care when machining and fitting.']);
    if(Number.isFinite(Pe))ck.push(Pe<=30?['ok',`Pressure ${pM(Pe)} is under the ${pM(30)} maximum design load for static, oscillating or occasional movement. Continuous rotation is limited by PV.`]:['bad',`Pressure ${pM(Pe)} is over the ${pM(30)} maximum design load.`]);
    if(mar)ck.push(['ok',`Maximum static design load is ${pM(30)} when the bearing is supported in a rigid housing. Water-lubricated PV limit is ${pvS(200)}.`]);
    const tl=dry?GRADES[gk][2]:GRADES[gk][1];
    if(Number.isFinite(tx))ck.push(tx<=tl?['ok',`Max temperature ${tF(tx)} is within the typical ${tF(tl)} limit for ${GRADES[gk][0].toLowerCase()} ${dry?'dry or lubricated':'immersed'} use.`]:['bad',`Max temperature ${tF(tx)} is above the typical ${tF(tl)} limit for ${dry?'dry or lubricated':'immersed'} use. Contact Vesconite about a higher-temperature grade.`]);
    if(mode==='stern'&&tx>55)ck.push(['warn',`Engine cooling water supplied to stern tube bearings should not exceed ${tF(55)}, to avoid long-term hydrolytic degradation.`]);
    if(R.forced)ck.push(['warn',`Above ${tF(70)} no interference fit is used. Secure the bearing mechanically or bond it, and leave an expansion gap of ${dL(gap,2)} ${uL()} (measured round the circumference, for example at the joint of a split bearing).`]);
    if(!pf)ck.push(['warn','No press fit: the bearing must be secured another way (bonding, keeper plate, screws). Outside diameter is taken as the housing diameter.']);
    if(mar&&pf&&R.iMax>0&&!R.hot)ck.push(['ok',`Housing tolerance: interference runs from ${dL(R.iMin,3)} ${uL()} (largest housing) to ${dL(R.iMax,3)} ${uL()} (smallest housing). Size is based on the maximum housing size.`]);
    if(!mar&&pf&&R.add>0)ck.push(['ok',`Minimum temperature below ${tF(5)}: an extra ${dL(R.add,3)} ${uL()} press fit is added.`]);
    if(mar&&pf&&Number.isFinite(tn)&&tn<-5)ck.push(['ok',`Minimum temperature ${tF(tn)}: press fit uses the cold-service coefficient${tn<=-10?' (0.0034 × housing)':` (interpolated between ${tF(-5)} and ${tF(-10)})`}.`]);
    if(ex>0)ck.push(['ok',`Above ${tF(50)} extra clearance of ${dL(ex,3)} ${uL()} is added to the inside diameter.`]);
    if(wr)ck.push(['warn','Wear ring: the assembled clearance shown follows the bearing equation. Pump makers usually specify their own running clearance for wear rings, so check it against the pump drawing.']);
    if(lim>0&&Number.isFinite(PV))ck.push(PV<=lim?['ok',`PV ${nPV(PV)} is ${Math.round(PV/lim*100)}% of the limit you entered.`]:['bad',`PV ${nPV(PV)} exceeds the limit you entered (${nPV(lim)}).`]);
    if(gt!=='none'&&!gOK)ck.push(['warn','Enter the groove number, depth and radius (and pitch or length) to include grooves.']);
    const gf=mode==='rud'?3:2;
    if(gOK&&gt!=='none'){
      ck.push(G.d<w/gf?['ok',`Groove depth ${dL(G.d)} ${uL()} is under ${mode==='rud'?'a third':'half'} of the wall thickness (${dL(w/gf)} ${uL()}).`]:['bad',`Groove depth ${dL(G.d)} ${uL()} is ${mode==='rud'?'a third':'half'} of the wall thickness or more. Keep it under ${dL(w/gf)} ${uL()} and add extra grooves instead.`]);
      if(G.d<2.5)ck.push(['warn',`The manual prefers grooves deeper than ${dL(2.5,1)} ${uL()} to avoid blockage by sand or coarse debris.`]);
      if(G.r<G.d/2)ck.push(['warn','Groove radius is small for this depth, giving a narrow slot. A radius of at least half the depth is usual.']);
      ck.push(['ok',`Grooves remove about ${fx(frac*100,0)}% of the bore surface${frac>0&&Number.isFinite(Pe)?`, so contact pressure on the remaining surface is about ${pM(Pe)}.`:'.'}`]);
      if(gt==='long'&&G.n*gw>Math.PI*ID*0.5)ck.push(['warn','Grooves take up more than half the bore circumference.']);
      if(mode==='stern')ck.push(['ok','Stern tube grooves: use round-based grooves with chamfered edges, and keep one clear of the 6 o\'clock position. Do not grease water-lubricated bearings.']);
    }
    if(mode==='rud'&&gt==='none')ck.push(['ok','Rudder bearings generally do not need grooves. Occasional greasing is beneficial; grooves for grease may be added to a depth of up to a third of the wall.']);
    if(fl0)ck.push(['ok','Flange: overall length includes the flange thickness. Flange sizes are as entered; the manual gives no flange sizing rule.']);
    const chn=OD<10?0:OD<=20?0.5:OD<=50?1:OD<=100?1.5:OD<=250?2:3,t20=(x,t)=>x*(1+K*(t-20)),gr=mode==='stern'?(D>=60&&D<=800?GRS.find(x=>D<=x[0]):null):(D>=20&&D<=200?GRV.find(x=>D<=x[0]):null);
    const rows=[[5,10],[10,15],[15,20],[20,30],[30,35],[35,40]].map(([a,b])=>{const t=(a+b)/2;return `<tr><td>${im?`${fx(a*1.8+32,0)}–${fx(b*1.8+32,0)} °F`:`${a}–${b} °C`}</td><td>${dL(t20(OD,t),2)}</td><td>${dL(t20(ID,t),2)}</td><td>${dL((t20(OD,t)-t20(ID,t))/2,2)}</td></tr>`}).join('');
    const tOD=tol(OD,.1,.025),tID=tol(ID,.1,.025),tW=tol(w,.5,.025),tL=tol(L,.5,.3),dt=new Date(),drg=`${S.dw.prefix||'VI'}-${dt.toISOString().slice(0,10).replace(/-/g,'')}-${Math.round(OD)}-${Math.round(ID)}-${Math.round(L)}`;
    const logo=S.dw.logo?{u:S.dw.logo,r:S.dw.logoR||1}:window.__rl||null,tt={ind:'',pump:wr?'PUMP WEAR RING':'PUMP BEARING',rud:'RUDDER BEARING',stern:'STERN TUBE BEARING'}[mode];
    LAST={drg,step:{name:'BEARING-BUSH',OD,ID,L,ch:chn||0.5,fl,G:Gu,gz},svg:drawSVG({OD,ID,L,ch:chn||0.5,w,H,D,press,clo,c,ex,gap,Hmin:mar&&Hmin>0?Hmin:0,tt,g:gk,tOD,tID,tW,tL,pf:pf&&!R.hot,imp:im,drg,G:Gu,fl,dw:S.dw,logo,gz,date:dt.toLocaleDateString(),who:S.dw.who==='custom'?S.dw.whoText:(ME?.email||'').split('@')[0]})};
    $('#mdr').innerHTML=LAST.svg;MD.hidden=false;$('#stn').textContent='STEP file (always in millimetres) contains: the bush body'+(fl0?', flange':'')+(chn?', chamfer':'')+(gOK&&gt!=='none'?`, and ${G.n} ${GTYPES[gt].toLowerCase()} groove${G.n>1?'s':''} (depth ${fx(G.d)}, radius R${fx(G.r)}).`:'. No grooves are set.');
    PEND3={OD,ID,L,ch:chn||0.5,g:gk,fl,gz,G:Gu};if(T3)upd3(T3,PEND3);else if(!T3L){T3L=true;lib('three').then(()=>{T3=init3($('#m3'));if(T3&&PEND3)upd3(T3,PEND3)}).catch(()=>{$('#m3').innerHTML='<p class="empty" style="margin:12px">The 3D viewer could not load. Check your connection.</p>'})}
    const ifit=!pf||R.hot?`${dL(0,3)} ${uL()} (no press fit)`:mar&&R.iMax>R.iMin+1e-9?`${dL(R.iMin,3)} – ${dL(R.iMax,3)} ${uL()}`:`${dL(press,3)} ${uL()}`;
    O.innerHTML=`<div class="card"><h2>Your results</h2><p class="mut" style="margin:0 0 6px">Bearing at ${tF(20)}, free-standing.${Number.isFinite(tx)||Number.isFinite(tn)?` Sized for ${Number.isFinite(tn)?tF(tn):'–'} to ${Number.isFinite(tx)?tF(tx):'–'}.`:''}</p><dl class="spec" style="margin:0">
    <dt>Outside diameter</dt><dd>${dL(OD)} ${uL()} ± ${dL(tOD,3)}</dd><dt>Inside diameter</dt><dd>${dL(ID)} ${uL()} ± ${dL(tID,3)}</dd>
    <dt>Wall thickness</dt><dd>${dL(w)} ${uL()} +0 / −${dL(tW,3)}</dd><dt>Length</dt><dd>${dL(L)} ${uL()} +0 / −${dL(tL,2)}</dd>
    ${fl0?`<dt>Flange</dt><dd>Ø${dL(fl.FD)} × ${dL(fl.T)} ${uL()} thick</dd>`:''}
    ${load?`<dt>Loading pressure P</dt><dd>${Number.isFinite(Pe)?pM(Pe):'–'}</dd><dt>Shaft surface speed V</dt><dd>${Number.isFinite(V)?vS(V):'–'}</dd><dt>PV</dt><dd>${Number.isFinite(PV)?pvS(PV):'–'}</dd>`:''}
    <dt>Expansion gap</dt><dd>${gap>0?dL(gap,2)+' '+uL():'–'}</dd><dt>Interference fit</dt><dd>${ifit}</dd><dt>Bore closure</dt><dd>${dL(clo,3)} ${uL()}</dd>
    <dt>Additional clearance</dt><dd>${dL(ex,3)} ${uL()}</dd><dt>Assembled clearance</dt><dd>${dL(c,3)} ${uL()}</dd><dt>Fitted inside diameter</dt><dd>${dL(D+c+ex,3)} ${uL()}</dd>
    <dt>Press fit force (estimate)</dt><dd>${R.force>0?fcS(R.force):'–'}</dd><dt>Outside diameter after cooling with dry ice</dt><dd>${dL(R.odCold,2)} ${uL()}</dd>
    <dt>Lead-in chamfer</dt><dd>${chn?dL(chn,2)+' '+uL():'–'} × 30°</dd>${gOK&&gt!=='none'?`<dt>Grooves</dt><dd>${GTYPES[gt].toLowerCase()}, ${G.n} × ${dL(gw,1)} ${uL()} wide × ${dL(G.d)} ${uL()} deep (R${dL(G.r)})${gt==='spiral'?`, pitch ${dL(G.pitch,0)} ${uL()}`:''}${gt==='blind'?`, ${dL(G.len,0)} ${uL()} long`:''}</dd>`:gr?`<dt>Typical grooves (manual)</dt><dd>${gr[1]} × ${dL(gr[2],1)} wide × ${dL(gr[3],1)} deep ${uL()}, about ${flS(gr[4])}</dd>`:''}
    ${Number.isFinite(tx)?`<dt>Free-standing ID at ${tF(tx)}</dt><dd>${dL(t20(ID,tx),2)} ${uL()}</dd>`:''}${Number.isFinite(tn)?`<dt>Free-standing ID at ${tF(tn)}</dt><dd>${dL(t20(ID,tn),2)} ${uL()}</dd>`:''}</dl></div>
    ${load?`<div class="card"><h2>Loading</h2><div class="res"><div><b>${nP(Pe)}</b><span>${im?'psi':'MPa'} pressure</span></div><div><b>${nV(V)}</b><span>${im?'ft/min':'m/min'} speed</span></div><div><b>${nPV(PV)}</b><span>${im?'psi·ft/min':'MPa·m/min'} PV</span></div></div>${Number.isFinite(P)?'':'<p class="mut" style="margin-top:8px">Enter the supported mass to calculate pressure and PV.</p>'}</div>`:''}
    <div class="card"><h2>Checks</h2>${ck.map(([k,t])=>`<p class="note ${k}">${k==='ok'?'✓':'⚠'} ${esc(t)}</p>`).join('')}</div>
    <div class="card"><h2>Size to cut at machining temperature</h2><p class="mut">Dimensions above are for a bearing at ${tF(20)}. If you machine it warmer or cooler, cut to these sizes (${uL()}). When machining, control the wall thickness and outside diameter.</p><div style="overflow-x:auto"><table class="tbl"><tr><th>Bearing temp</th><th>OD</th><th>ID</th><th>Wall</th></tr>${rows}</table></div></div>
    <div class="card"><h2>How this is calculated</h2><p class="mut">${im?'<b>Sizes are calculated in millimetres and shown in inches here. The constants in the formulas below (0.05, 0.2 and so on) are in millimetres.</b> ':''}${mar?`Press fit = 0.05 + 0.002 × housing Ø (minimum temperature above −5 °C) or 0.05 + 0.0034 × housing Ø (below −10 °C, interpolated between), using the maximum housing size. Bore closure = press fit × housing Ø ÷ shaft Ø. Assembly clearance = ${mode==='rud'?'0.2 + 0.0015':'0.2 + 0.002'} × shaft Ø. OD = housing Ø + press fit. ID = shaft Ø + bore closure + assembly clearance + additional clearance.`:`Press fit = 0.05 + 0.002 × housing Ø, plus (5 − min temperature) × 0.000054 × housing Ø below 5 °C. Bore closure = press fit × housing Ø ÷ shaft Ø. Assembly clearance = 0.05 + 0.02 × wall, solved together with the wall. OD = housing Ø + press fit. ID = shaft Ø + bore closure + assembly clearance + additional clearance.`} Additional clearance above 50 °C = (housing Ø² − shaft Ø²) × (max temp − 50) × 0.00006 ÷ shaft Ø. Above 70 °C there is no press fit and the expansion gap = 0.1 + housing Ø × π × (max temp − 25) × 0.00006. Wall = ½ (OD − ID). ${load?'Pressure = mass × 9.81 ÷ bearings ÷ (shaft Ø × length), divided by the share of bore left after grooving. Rotation speed = π × shaft Ø × rpm ÷ 1000; oscillation and linear speeds count each stroke out and back (an assumption). PV = pressure × speed. ':''}Thermal change uses 6 × 10⁻⁵ per °C. Tolerances are the standard machining tolerances. Press fit force is an estimate of mine, not a Vesconite figure: contact pressure from a thick-walled ring in a rigid housing (modulus ${gk==='h'?'2.2':'2.3'} GPa, Poisson 0.4) times a friction coefficient of ${gk==='h'?'0.10':'0.15'} on the contact area. Dry-ice size assumes a 50 °C drop in bearing temperature (the manual quotes 40–60 °C). Groove sizes come from the manual's ${mode==='stern'?'stern tube':'general'} groove table; the groove area share is an estimate.${mode==='pump'?' Pump: Vesconite publishes no separate pump equations, so the industrial equations are used.':''} Sources: Vesconite size-calculation pages${mar?' and the Vesconite Rudder and Stern Tube Bearing Design Manual':''}.</p></div>
    <button class="btn wide" id="dc" type="button">Copy results</button>`;
    $('#dc').onclick=()=>navigator.clipboard.writeText([`${MODES[mode]} bearing (${GRADES[gk][0]})`,`${mar?`Housing ${dL(H)} max${Hmin>0?` / ${dL(Hmin)} min`:''}`:`Housing ${dL(H)}`} ${uL()}, shaft ${dL(D)} ${uL()}, length ${dL(L)} ${uL()}, ${pf?'press fit':'no press fit'}${fl0?`, flange Ø${dL(fl.FD)} x ${dL(fl.T)} ${uL()}`:''}`,`OD ${dL(OD)} ${uL()}, ID ${dL(ID)} ${uL()}, wall ${dL(w)} ${uL()}`,`Interference ${ifit}, bore closure ${dL(clo,3)} ${uL()}, additional clearance ${dL(ex,3)} ${uL()}, assembled clearance ${dL(c,3)} ${uL()}, fitted ID ${dL(D+c+ex,3)} ${uL()}`,gap>0?`Expansion gap ${dL(gap,2)} ${uL()}`:'',gOK&&gt!=='none'?`Grooves: ${GTYPES[gt]}, ${G.n} x depth ${dL(G.d)}, radius ${dL(G.r)} ${uL()}`:'No grooves',load?`P ${pM(Pe)}, V ${vS(V)}, PV ${pvS(PV)}`:'',...ck.map(([k,t])=>(k==='ok'?'OK: ':'CHECK: ')+t)].filter(Boolean).join('\n')).then(()=>alert('Results copied.'));
  };
  $$('#DF input').forEach(i=>i.addEventListener('input',cv));$$('#DF select').forEach(i=>{i.addEventListener('input',cv);i.addEventListener('change',cv)});cv();
}

/* ---------- Freezer shrink: how long to cool a bush so it slides into the housing ---------- */
const FZP={fr:['Home freezer, still air',-18,8],fan:['Fan-cooled freezer',-25,20],deep:['Deep freezer, still air',-40,8],dry:['Dry ice in a cooler',-78,12]};
const FZV={};   /* remembered inputs, kept in millimetres and °C */
function fzMk(w,T0){   /* 1-D wall with both faces exposed (implicit finite volume); returns a stepper */
  const k=.3,rho=1380,cp=1300,N=30,dx=w/2000/N,Cc=rho*cp*dx,G=k/dx,T=new Array(N).fill(T0),b=new Array(N),cc=new Array(N),dd=new Array(N);
  return{mean:()=>T.reduce((s,x)=>s+x,0)/N,step(dt,Ta,h){const Gs=1/(dx/(2*k)+1/h),q=Cc/dt;
    for(let i=0;i<N;i++){b[i]=q+(i?G:0)+(i<N-1?G:Gs);dd[i]=q*T[i]+(i===N-1?Gs*Ta:0)}
    cc[0]=-G/b[0];dd[0]=dd[0]/b[0];for(let i=1;i<N;i++){const m=b[i]+G*cc[i-1];cc[i]=i<N-1?-G/m:0;dd[i]=(dd[i]+G*dd[i-1])/m}
    T[N-1]=dd[N-1];for(let i=N-2;i>=0;i--)T[i]=dd[i]-cc[i]*T[i+1]}};
}
function fzSim(w,h,T0,Ta,tMax){   /* volume-average bush temperature against time in the cold */
  const m=fzMk(w,T0),out={t:[0],m:[T0]};let t=0,dt=.5;
  while(t<tMax){m.step(dt,Ta,h);t+=dt;out.t.push(t);out.m.push(m.mean());dt=Math.min(dt*1.03,30);if(t>60&&Math.abs(out.m[out.m.length-1]-Ta)<.01*Math.abs(T0-Ta))break}
  return out;
}
const fzAt=(o,t)=>{const a=o.t;if(t<=0)return o.m[0];if(t>=a[a.length-1])return o.m[o.m.length-1];let lo=0,hi=a.length-1;while(hi-lo>1){const m=(lo+hi)>>1;a[m]<=t?lo=m:hi=m}const f=(t-a[lo])/(a[hi]-a[lo]);return o.m[lo]+(o.m[hi]-o.m[lo])*f};
const fzTime=s=>s<90?`${Math.round(s)} s`:s<5400?`${Math.round(s/60)} min`:`${Math.floor(s/3600)} h ${String(Math.round(s%3600/60)).padStart(2,'0')} min`;
function freezer(v){
  if(!S.feat.pv){location.hash='#/tools';return}
  let im=false;try{im=localStorage.getItem('vi4u_frz')==='i'}catch{}
  const g=id=>{const e=$('#'+id);if(!e)return NaN;const x=parseFloat(e.value);if(!e.dataset.q||!im)return x;if(e.dataset.mv!==undefined&&e.value===e.dataset.dv)return +e.dataset.mv;return UC[e.dataset.q].to(x)};
  const put=(id,x)=>{const e=$('#'+id);if(!e)return;delete e.dataset.mv;delete e.dataset.dv;if(x==null||!Number.isFinite(+x)){e.value='';return}const q=e.dataset.q;if(q&&im){e.value=+UC[q].from(+x).toFixed(UC[q].d);e.dataset.mv=x;e.dataset.dv=e.value}else e.value=+(+x).toFixed(6)};
  const dL=(x,d=2)=>fx(im?x/25.4:x,im?d+1:d),uL=()=>im?'in':'mm',tF=c=>`${fx(im?c*9/5+32:c,0)} ${im?'°F':'°C'}`;
  const n=(id,l,u,val='')=>{const q=UQ[u];return `<label>${l} <span class="mut" data-u="${q}">${im?UC[q].i:u}</span><input id="${id}" type="number" inputmode="decimal" step="any" value="${val}" data-q="${q}"></label>`};
  v.innerHTML=`<a class="back" href="#/tools">← Tools</a><h1>Freezer shrink time</h1>
  <div class="seg un" id="UN"><button type="button" data-u="m" class="${im?'':'on'}">Metric · mm, °C</button><button type="button" data-u="i" class="${im?'on':''}">Imperial · in, °F</button></div>
  <p class="mut">Works out how long to leave a Vesconite or Vesconite Hilube bush in a freezer so that it shrinks enough to slide into its housing, and how long you have to fit it once it is out. Based on the published expansion of 6 × 10⁻⁵ per °C. The cooling time is an estimate: always measure the cooled bush before fitting.</p>
  <form class="card" id="FF"><div class="g2">${n('f1','Bearing outside diameter at 20 °C','mm')}${n('f2','Housing bore diameter','mm')}${n('f3','Bearing wall thickness','mm')}${n('f4','Clearance you want when sliding in','mm','0.10')}${n('f5','Starting (room) temperature','°C','20')}</div>
  <label>Cooling method<select id="f6">${Object.entries(FZP).map(([k,x])=>`<option value="${k}">${x[0]}</option>`).join('')}</select></label>
  <div class="g2">${n('f7','Cold temperature','°C','-18')}</div>
  <p class="mut" style="margin:0">Assumes the bush stands free with cold air all round it, inside and out. A bush in a bag, a box or stacked takes longer.</p></form>
  <div id="FO"></div>`;
  Object.entries(FZV).forEach(([k,x])=>{const e=$('#'+k);if(!e)return;if(e.dataset.q&&x!=='')put(k,+x);else e.value=x});
  $('#FF').onsubmit=e=>e.preventDefault();
  const cv=()=>{
    $$('#FF input,#FF select').forEach(e=>{FZV[e.id]=e.dataset.q&&e.value!==''?String(+g(e.id).toFixed(6)):e.value});
    const O=$('#FO'),OD=g('f1'),H=g('f2'),w=g('f3'),c=g('f4')||0,T0=g('f5'),Tc=g('f7'),hc=FZP[$('#f6').value][2],bad=m=>{O.innerHTML=m};
    if(!(OD>0&&H>0&&w>0&&Number.isFinite(T0)&&Number.isFinite(Tc)))return bad('<p class="mut">Enter the bearing outside diameter, housing bore, wall thickness and temperatures.</p>');
    if(w*2>=OD)return bad('<p class="note bad">The wall thickness must be less than half the outside diameter.</p>');
    if(Tc>=T0)return bad('<p class="note bad">The cold temperature must be below the starting temperature.</p>');
    const AL=6e-5,shr=m=>OD*AL*(20-m),itf=OD-H,need=itf+c,maxS=shr(Tc),ck=[];
    const sim=fzSim(w,hc,T0,Tc,172800),tEnd=sim.t[sim.t.length-1],startS=shr(T0);
    if(itf<=0)ck.push(['ok',`The bush at ${tF(20)} is already ${dL(-itf,3)} ${uL()} smaller than the bore, so it needs no cooling.`]);
    if(need<=startS&&itf>0)ck.push(['ok','It already slides in at the starting temperature with the clearance you asked for.']);
    const reach=need<=maxS*.985;
    let tReq=null;if(need>startS&&reach){for(let i=0;i<sim.t.length;i++){if(shr(sim.m[i])>=need){tReq=sim.t[i];break}}}
    const tRec=tReq!=null?Math.max(tReq*1.2,tReq+300):null,Tneed=20-need/(OD*AL);
    let win=null;
    if(tRec!=null){const m=fzMk(w,T0);let t=0,dt=.5;while(t<tRec){const d=Math.min(dt,tRec-t);m.step(d,Tc,hc);t+=d;dt=Math.min(dt*1.03,30)}
      t=0;dt=.5;win=1800;while(t<1800){m.step(dt,T0,10);t+=dt;dt=Math.min(dt*1.03,10);if(shr(m.mean())<itf){win=t;break}}}
    if(tReq==null&&need>startS){ck.push(reach?['warn','This takes longer than 48 hours. Use a colder method.']:['bad',`${tF(Tc)} is not cold enough. At full soak the bush shrinks only ${dL(maxS,3)} ${uL()}, and you need ${dL(need,3)} ${uL()}. Use a colder method (for example dry ice), reduce the interference, or warm the housing as well.`])}
    if(Tneed<-80&&tReq!=null)ck.push(['warn','The temperature needed is below dry ice (−78 °C). Check the sizes.']);
    if(tReq!=null&&Tneed<-18&&Tc>-30)ck.push(['warn','Average bush temperature needed is quite cold for this method.']);
    if(win!=null)ck.push(['ok',`Fit window: about ${fzTime(win)} after taking it out of the cold before the bush has warmed back up to the bore size (still air at ${tF(T0)}, bush soaked for the recommended time). Have the housing, tools and an assistant ready, and fit it in one go.`]);
    ck.push(['ok','Measure the cooled bush with a micrometer before fitting. A bush that is not fully soaked is colder outside than inside, so the true diameter is the one to trust.']);
    ck.push(['ok','Hilube and standard Vesconite share the same expansion value here. Condensation or frost forms on cold parts: wipe the bush dry before pressing, and never use dry ice or liquid nitrogen without protective gloves and eye protection.']);
    /* table */
    const tmax=tReq!=null?Math.min(tEnd,Math.max(tRec*1.4,tReq+1800)):Math.min(tEnd,7200),base=[2,5,10,15,20,30,45,60,90,120,180,240,360,480,720,1080,1440].map(x=>x*60).filter(x=>x<=tmax);
    const tl=[...new Set([...base,...(tRec!=null?[Math.round(tRec)]:[])])].sort((x,y)=>x-y);
    const rows=tl.map(t=>{const m=fzAt(sim,t),s=shr(m),cl=H-(OD-s),ok=cl>=c-1e-9,rec=tRec!=null&&Math.abs(t-Math.round(tRec))<1;return `<tr ${rec?'style="font-weight:700"':''}><td>${fzTime(t)}${rec?' ◀ recommended':''}</td><td>${tF(m)}</td><td>${dL(s,3)}</td><td>${dL(cl,3)}</td><td>${ok?'✓':''}</td></tr>`}).join('');
    /* chart */
    const W=330,Hh=190,pl=44,pr=10,pt=10,pb=30,xm=Math.max(tmax,60),ym=Math.max(maxS,need,.001)*1.05,X=t=>pl+(W-pl-pr)*t/xm,Y=s=>pt+(Hh-pt-pb)*(1-s/ym);
    const pts=[];for(let i=0;i<=120;i++){const t=xm*i/120;pts.push(`${X(t).toFixed(1)},${Y(Math.max(0,shr(fzAt(sim,t)))).toFixed(1)}`)}
    const xu=xm>=7200?3600:600,xl=xm>=7200?'h':'min',tk=[];for(let t=0;t<=xm;t+=xu)tk.push(t);
    const yt=[0,1,2,3,4].map(i=>ym*i/4);
    const chart=`<svg viewBox="0 0 ${W} ${Hh}" style="width:100%;max-width:520px;font:10px system-ui,sans-serif" role="img" aria-label="Bush shrink against time in the cold">
      ${yt.map(y=>`<line x1="${pl}" x2="${W-pr}" y1="${Y(y).toFixed(1)}" y2="${Y(y).toFixed(1)}" stroke="currentColor" opacity=".12"/><text x="${pl-4}" y="${(Y(y)+3).toFixed(1)}" text-anchor="end" fill="currentColor" opacity=".7">${dL(y,2)}</text>`).join('')}
      ${tk.map(t=>`<text x="${X(t).toFixed(1)}" y="${Hh-14}" text-anchor="middle" fill="currentColor" opacity=".7">${xl==='h'?t/3600:t/60}</text>`).join('')}
      <text x="${(pl+W-pr)/2}" y="${Hh-2}" text-anchor="middle" fill="currentColor" opacity=".7">time in the cold (${xl})</text>
      <text x="10" y="${(pt+Hh-pb)/2}" transform="rotate(-90 10 ${(pt+Hh-pb)/2})" text-anchor="middle" fill="currentColor" opacity=".7">OD shrink (${uL()})</text>
      ${need>0?`<line x1="${pl}" x2="${W-pr}" y1="${Y(need).toFixed(1)}" y2="${Y(need).toFixed(1)}" stroke="#c9861a" stroke-width="1.5" stroke-dasharray="5 3"/><text x="${W-pr}" y="${(Y(need)-4).toFixed(1)}" text-anchor="end" fill="#c9861a" font-weight="700">shrink needed ${dL(need,3)}</text>`:''}
      ${tRec!=null&&tRec<=xm?`<line x1="${X(tRec).toFixed(1)}" x2="${X(tRec).toFixed(1)}" y1="${pt}" y2="${Hh-pb}" stroke="#1e78e6" stroke-dasharray="3 3"/>`:''}
      <polyline points="${pts.join(' ')}" fill="none" stroke="#1e78e6" stroke-width="2.2"/></svg>`;
    O.innerHTML=`<div class="card"><h2>Your result</h2>
      <div class="res">${tReq!=null?`<div><b>${fzTime(tRec)}</b><span>recommended time in the cold</span></div><div><b>${fzTime(tReq)}</b><span>minimum to just slide in</span></div><div><b>${win!=null?fzTime(win):'–'}</b><span>time to fit after removal</span></div>`:need<=startS?`<div><b>0</b><span>no cooling needed</span></div>`:`<div><b>–</b><span>not reachable</span></div>`}</div>
      <dl class="spec" style="margin:10px 0 0"><dt>Interference at ${tF(20)}</dt><dd>${dL(itf,3)} ${uL()}</dd><dt>Clearance wanted</dt><dd>${dL(c,3)} ${uL()}</dd><dt>Shrink needed</dt><dd>${dL(need,3)} ${uL()}</dd><dt>Average bush temperature needed</dt><dd>${tF(Tneed)}</dd><dt>Most it can shrink at ${tF(Tc)}</dt><dd>${dL(maxS,3)} ${uL()}</dd><dt>Fully soaked (99%) after</dt><dd>${tEnd>=172800?'over 48 h':fzTime(tEnd)}</dd></dl></div>
      <div class="card"><h2>Shrink over time</h2>${chart}<div style="overflow-x:auto"><table class="tbl"><tr><th>Time in cold</th><th>Bush avg temp</th><th>OD shrink (${uL()})</th><th>Clearance (${uL()})</th><th>Slides in</th></tr>${rows}</table></div></div>
      <div class="card"><h2>Notes</h2>${ck.map(([k,t])=>`<p class="note ${k}">${k==='ok'?'✓':'⚠'} ${esc(t)}</p>`).join('')}</div>
      <div class="card"><h2>How this is calculated</h2><p class="mut">Shrink = OD × 6 × 10⁻⁵ × (20 °C − bush temperature). Interference = bush OD − housing bore, so the bush must shrink by the interference plus the clearance you want. The cooling time comes from a heat-flow model of the bush wall (thermal conductivity 0.3 W/m·K, density 1.38 g/cm³ from the data sheet, specific heat assumed 1,300 J/kg·K) with air-film coefficients of 8 W/m²K for still air, 20 for fan-cooled air and 12 for a dry ice cooler. The recommended time is the time to reach the needed shrink plus 20% (at least 5 more minutes). The fit window uses 10 W/m²K for room air. These coefficients are estimates and real freezers vary, so treat the times as a guide and confirm by measurement.</p></div>`;
  };
  const preset=()=>{const p=FZP[$('#f6').value];put('f7',p[1])};
  $('#f6').onchange=()=>{preset();cv()};
  const setU=u=>{const ni=u==='i';if(ni===im)return;const vals=$$('#FF input[data-q]').map(e=>[e.id,e.value===''?null:g(e.id)]);im=ni;try{localStorage.setItem('vi4u_frz',u)}catch{}vals.forEach(([id,x])=>put(id,x));$$('#FF [data-u]').forEach(s=>{s.textContent=im?UC[s.dataset.u].i:UC[s.dataset.u].u});$$('#UN button').forEach(b=>b.classList.toggle('on',b.dataset.u===u));cv()};
  $$('#UN button').forEach(b=>b.onclick=()=>setU(b.dataset.u));
  $$('#FF input,#FF select').forEach(e=>{e.addEventListener('input',cv)});
  cv();
}

/* ---------- QuickDraw: type the sizes, get a full drawing and PDF. Every field is editable. ---------- */
const nz=x=>Number.isFinite(x)&&x>0?x:0;
const tolStr=(p,m)=>{p=nz(p);m=nz(m);return !p&&!m?'':p===m?`±${fx(p,3)}`:`+${fx(p,3)}/−${fx(m,3)}`};
const QNOTES='1. ALL DIMENSIONS IN mm UNLESS STATED OTHERWISE.\n2. TOLERANCES AS SHOWN ON THE DIMENSIONS.\n3. REMOVE BURRS AND BREAK SHARP EDGES.';
function quickdraw(v){
  T3=null;LAST=null;let edited=false,im=false;try{im=localStorage.getItem('vi4u_qd')==='i'}catch{}
  const fq=(x,d=2)=>fx(im?x/25.4:x,im?d+1:d),uu=()=>im?'in':'mm';
  const num=(id,l,u='',val='',q='L')=>`<label>${l} <span class="mut" ${q&&u?'data-u="L"':''}>${q&&u?(im?'in':'mm'):u}</span><input id="${id}" type="number" inputmode="decimal" step="any" value="${val}" ${q?`data-q="${q}"`:''}></label>`;
  const txt=(id,l,val='',ph='')=>`<label>${l}<input id="${id}" value="${esc(val)}" placeholder="${esc(ph)}"></label>`;
  const today=new Date().toLocaleDateString(),dw=S.dw;
  v.innerHTML=`<a class="back" href="#/tools">← Tools</a><h1>QuickDraw</h1><div class="seg un" id="UN"><button type="button" data-u="m" class="${im?'':'on'}">Metric · mm</button><button type="button" data-u="i" class="${im?'on':''}">Imperial · in</button></div><p class="mut">Type the sizes and get a full engineering drawing you can export to PDF. Every field below can be edited, including the dimension text, data table and notes.</p>
  <form class="card" id="QF">
  <h2>Part</h2><div class="g2">${txt('qName','Part name / title','BEARING BUSH')}${txt('qMat','Material / grade','VESCONITE')}${txt('qDrg','Drawing number','','Auto')}${txt('qRev','Revision',dw.rev)}${txt('qCo','Company (when no logo)',dw.company)}${txt('qWho','Drawn by',(ME?.email||'').split('@')[0])}${txt('qDate','Date',today)}
  <label>Paper size<select id="qPaper"><option value="a3">A3</option><option value="a4" ${dw.paper==='a4'?'selected':''}>A4</option></select></label>
  <label>Scale<select id="qScale"><option value="0">Auto</option><option value="5">5:1</option><option value="2">2:1</option><option value="1">1:1</option><option value="0.5">1:2</option><option value="0.2">1:5</option><option value="0.1">1:10</option><option value="0.05">1:20</option></select></label></div>
  <h2>Sizes <span class="mut" style="font:400 14px var(--f2)"><span id="qhu">${im?'in':'mm'}</span>, with tolerances</span></h2>
  <div class="g2">${num('qOD','Outside diameter (OD)')}<div class="g2" style="grid-column:1/-1;margin-top:-6px">${num('qODp','OD tolerance +')}${num('qODm','OD tolerance −')}</div>
  ${num('qID','Inside diameter (ID)')}<div class="g2" style="grid-column:1/-1;margin-top:-6px">${num('qIDp','ID tolerance +')}${num('qIDm','ID tolerance −')}</div>
  ${num('qL','Length (overall)')}<div class="g2" style="grid-column:1/-1;margin-top:-6px">${num('qLp','Length tolerance +')}${num('qLm','Length tolerance −')}</div></div>
  <div class="acts" style="margin-top:0"><button type="button" class="btn" id="qstd">Fill standard Vesconite tolerances</button></div>
  <label>Shape<select id="qFl"><option value="n">Straight</option><option value="y">Flanged</option></select></label>
  <div data-qf hidden><div class="g2">${num('qFD','Flange OD')}${num('qT','Flange length (thickness)')}${num('qFDp','Flange OD tolerance +')}${num('qFDm','Flange OD tolerance −')}${num('qTp','Flange length tolerance +')}${num('qTm','Flange length tolerance −')}</div></div>
  <div class="g2">${num('qCh','OD chamfer size (0 = none)')}</div>
  <h2>Grooves <span class="mut" style="font:400 14px var(--f2)">optional</span></h2>
  <label>Groove type<select id="qG"><option value="none">None</option><option value="spiral">Spiral</option><option value="blind">Blind radial</option><option value="long">Longitudinal</option></select></label>
  <div data-qg hidden><div class="g2">${num('qGn','Number of grooves','','','')}${num('qGd','Groove depth','mm')}${num('qGr','Groove radius','mm')}<div data-qgt="spiral" hidden>${num('qGp','Spiral pitch','mm')}</div><div data-qgt="blind" hidden>${num('qGl','Groove length','mm')}</div></div>
  <div class="acts" style="margin-top:0"><button type="button" class="btn" id="qrec">Suggest from the manual's table</button></div></div>
  <details class="card" style="margin:14px 0"><summary class="btn">Edit dimension text</summary><p class="mut" style="margin:10px 0">Leave blank to use the text made from your sizes and tolerances.</p><div class="g2">${txt('qlOD','OD text')}${txt('qlID','ID text')}${txt('qlL','Length text')}${txt('qlFD','Flange OD text')}${txt('qlT','Flange length text')}${txt('qlW','Wall text')}${txt('qlCh','Chamfer note')}</div></details>
  <h2>Data table</h2><p class="mut" style="margin:0 0 6px">One row per line as LABEL | VALUE. It updates from your sizes until you edit it.</p><textarea id="qTab" rows="7"></textarea>
  <div class="acts" style="margin-top:6px"><button type="button" class="btn" id="qtr">Reset table</button></div>
  <h2>Notes</h2><textarea id="qNotes" rows="5">${esc(QNOTES)}</textarea>
  <div style="margin-top:8px"><label class="ck"><input type="checkbox" id="qLg" ${dw.showLogo?'checked':''}>Show logo</label><label class="ck"><input type="checkbox" id="qSt" checked>Show data table</label><label class="ck"><input type="checkbox" id="qSn" checked>Show notes</label></div>
  </form><div id="QM"></div>
  <div class="card" id="QP" hidden><div class="mdr" id="QV"></div><div class="acts"><button type="button" class="btn pri" id="qx">Expand to drawing</button><button type="button" class="btn" id="qp">Make PDF</button><button type="button" class="btn" id="qs">SVG</button><button type="button" class="btn" id="qstp">STEP file</button></div><p class="mut" style="margin:0">Make PDF, wait for it to change to Open PDF, then tap again to open or save it. </p><p class="mut" id="qsn" style="margin:6px 0 0"></p></div>`;
  const gv=id=>$('#'+id).value,gn=id=>{const e=$('#'+id),x=parseFloat(e.value);if(!e.dataset.q||!im)return x;if(e.dataset.mv!==undefined&&e.value===e.dataset.dv)return +e.dataset.mv;return x*25.4};
  const put=(id,x)=>{const e=$('#'+id);if(!e)return;delete e.dataset.mv;delete e.dataset.dv;if(x==null||!Number.isFinite(+x)){e.value='';return}if(e.dataset.q&&im){e.value=+(+x/25.4).toFixed(4);e.dataset.mv=x;e.dataset.dv=e.value}else e.value=+(+x).toFixed(6)};
  const tS=(p,m)=>{p=nz(p);m=nz(m);return !p&&!m?'':p===m?`±${fq(p,3)}`:`+${fq(p,3)}/−${fq(m,3)}`};
  let lastQ='none',autoQ=false;
  const gen=()=>{
    const fl0=gv('qFl')==='y',gt=gv('qG');
    $$('[data-qf]').forEach(x=>x.hidden=!fl0);$$('[data-qg]').forEach(x=>x.hidden=gt==='none');$$('[data-qgt]').forEach(x=>x.hidden=x.dataset.qgt!==gt);
    const OD=gn('qOD'),ID=gn('qID'),L=gn('qL'),M=$('#QM'),P=$('#QP'),stop=m=>{P.hidden=true;M.innerHTML=m};
    if(!(OD>0&&ID>0&&L>0))return stop('<p class="mut">Enter the outside diameter, inside diameter and length to see the drawing.</p>');
    if(OD<=ID)return stop('<p class="note bad">The outside diameter must be larger than the inside diameter.</p>');
    const w=(OD-ID)/2,fl={on:fl0,FD:gn('qFD'),T:gn('qT')};
    if(gt!==lastQ){lastQ=gt;autoQ=false}
    if(gt!=='none'&&!autoQ){const rc=recGroove(gt,ID,w,L);if(rc){autoQ=true;let ch=false;const set=(id,x)=>{if(!(+$('#'+id).value>0)&&x!=null){put(id,x);ch=true}};set('qGn',rc.n);set('qGd',rc.d);set('qGr',rc.r);if(gt==='spiral')set('qGp',rc.pitch);if(gt==='blind')set('qGl',rc.len);if(ch)return gen()}}
    if(fl0&&!(fl.FD>OD&&fl.T>0&&fl.T<L))return stop('<p class="note bad">For a flanged part, enter a flange OD larger than the OD and a flange length shorter than the overall length.</p>');
    const G={type:gt,n:gn('qGn'),d:gn('qGd'),r:gn('qGr'),pitch:gn('qGp'),len:gn('qGl')},gOK=gt==='none'||(G.n>0&&G.d>0&&G.r>0&&(gt!=='spiral'||G.pitch>0)&&(gt!=='blind'||G.len>0)),Gu=gOK?G:{type:'none'};
    const ch=nz(gn('qCh')),warn=[];
    if(gt!=='none'&&!gOK)warn.push('Enter the groove number, depth and radius (and pitch or length) to draw the grooves.');
    if(gOK&&gt!=='none'&&G.d>=w/2)warn.push(`Groove depth ${fq(G.d)} ${uu()} is half the wall (${fq(w)} ${uu()}) or more.`);
    if(ch>0&&ch>=w)warn.push('The chamfer is as large as the wall thickness.');
    M.innerHTML=warn.map(t=>`<p class="note warn">⚠ ${esc(t)}</p>`).join('');
    const tx=(base,p,m,pre='')=>`${pre}${fq(base)}${tS(p,m)?' '+tS(p,m):''}`;
    const lab={OD:gv('qlOD').trim()||tx(OD,gn('qODp'),gn('qODm'),'Ø'),ID:gv('qlID').trim()||tx(ID,gn('qIDp'),gn('qIDm'),'Ø'),L:gv('qlL').trim()||tx(L,gn('qLp'),gn('qLm')),W:gv('qlW').trim()||`(${fq(w)})`,FD:gv('qlFD').trim()||tx(fl.FD,gn('qFDp'),gn('qFDm'),'Ø'),T:gv('qlT').trim()||tx(fl.T,gn('qTp'),gn('qTm'))};
    const auto=[['OUTSIDE Ø',lab.OD.replace(/^Ø/,'')],['INSIDE Ø',lab.ID.replace(/^Ø/,'')],['LENGTH',lab.L],['WALL (REF)',fq(w)]];
    if(fl0)auto.push(['FLANGE Ø',lab.FD.replace(/^Ø/,'')],['FLANGE LENGTH',lab.T]);
    if(ch>0)auto.push(['OD CHAMFER',fq(ch,2)]);
    if(Gu.type!=='none'){auto.push(['GROOVE TYPE',GTYPES[gt]],['GROOVE QTY',String(G.n)],['GROOVE DEPTH',fq(G.d)],['GROOVE RADIUS',fq(G.r)],['GROOVE WIDTH',fq(grooveWidth(G.d,G.r))]);if(gt==='spiral')auto.push(['SPIRAL PITCH',fq(G.pitch)]);if(gt==='blind')auto.push(['GROOVE LENGTH',fq(G.len)])}
    if(!edited)$('#qTab').value=auto.map(r=>r.join(' | ')).join('\n');
    const table=gv('qTab').split('\n').map(l=>l.trim()).filter(Boolean).slice(0,20).map(l=>{const k=l.indexOf('|');return k<0?[l,'']:[l.slice(0,k).trim(),l.slice(k+1).trim()]});
    const name=gv('qName').trim()||'BEARING BUSH',mat=gv('qMat').trim()||'—',date=gv('qDate'),
      drg=gv('qDrg').trim()||`QD-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${Math.round(OD)}-${Math.round(ID)}-${Math.round(L)}`,
      dwq={...S.dw,company:gv('qCo'),rev:gv('qRev'),paper:gv('qPaper'),showLogo:$('#qLg').checked,fit:$('#qSt').checked,notes:$('#qSn').checked,noteText:gv('qNotes')},
      logo=S.dw.logo?{u:S.dw.logo,r:S.dw.logoR||1}:window.__rl||null;
    LAST={drg,paper:gv('qPaper'),step:{name:name.replace(/\s+/g,'-'),OD,ID,L,ch,fl,G:Gu,gz:grooveFn(Gu,ID/2)},svg:drawSVG({OD,ID,L,ch,w,g:'v',pf:true,drg,G:Gu,fl,dw:dwq,logo,gz:grooveFn(Gu,ID/2),date,who:gv('qWho'),q:{lab,table,title:name+(fl0?' (FLANGED)':''),material:mat,scale:parseFloat(gv('qScale'))||0,chText:gv('qlCh').trim()||(ch>0?`${fq(ch,2)} × 45° CHAMFER`:'')},imp:im})};
    $('#QV').innerHTML=LAST.svg;P.hidden=false;$('#qsn').textContent='STEP file (always in millimetres) contains: the bush body'+(fl0?', flange':'')+(ch>0?', chamfer':'')+(Gu.type!=='none'?`, and ${G.n} ${GTYPES[gt].toLowerCase()} groove${G.n>1?'s':''} (depth ${fx(G.d)}, radius R${fx(G.r)}).`:'. No grooves are set.');const pb=$('#qp');pb._b=null;pb.textContent='Make PDF';
  };
  if(!S.dw.logo&&!window.__rl)repoLogo().then(r=>{if(r){window.__rl=r;gen()}});
  $('#QF').onsubmit=e=>e.preventDefault();
  $('#qTab').addEventListener('input',e=>{if(e.isTrusted)edited=true});
  $('#qtr').onclick=()=>{edited=false;gen()};
  $('#qstd').onclick=()=>{const OD=gn('qOD'),ID=gn('qID'),L=gn('qL'),set=(id,x)=>put(id,x?+x.toFixed(3):null);if(OD>0){set('qODp',tol(OD,.1,.025));set('qODm',tol(OD,.1,.025))}if(ID>0){set('qIDp',tol(ID,.1,.025));set('qIDm',tol(ID,.1,.025))}if(L>0){set('qLp',0);set('qLm',tol(L,.5,.3))}gen()};
  $('#qrec').onclick=()=>{const ID=gn('qID'),OD=gn('qOD'),L=gn('qL'),gt=gv('qG'),rc=ID>0&&OD>ID?recGroove(gt,ID,(OD-ID)/2,L):null;if(!rc){alert('Enter the OD, ID and length first. The manual\'s groove table covers shaft diameters of 20–200 mm.');return}const set=(id,x)=>put(id,x);set('qGn',rc.n);set('qGd',rc.d);set('qGr',rc.r);if(gt==='spiral')set('qGp',rc.pitch);if(gt==='blind')set('qGl',rc.len);gen()};
  const setU=u=>{const ni=u==='i';if(ni===im)return;const vals=$$('#QF input[data-q]').map(e=>[e.id,e.value===''?null:gn(e.id)]);im=ni;try{localStorage.setItem('vi4u_qd',u)}catch{}vals.forEach(([id,x])=>put(id,x));$$('#QF [data-u]').forEach(x=>x.textContent=im?'in':'mm');$('#qhu').textContent=im?'in':'mm';$$('#UN button').forEach(b=>b.classList.toggle('on',b.dataset.u===u));gen()};
  $$('#UN button').forEach(b=>b.onclick=()=>setU(b.dataset.u));
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
  <section class="card"><h2>Backups</h2><p class="mut">Get a reminder on the Home screen when a backup is due. Last backup: <b id="bkl">${s.bk&&s.bk.last?new Date(s.bk.last).toLocaleString():'never'}</b>.</p><label>Remind me to back up<select name="bkEvery">${[[0,'Never'],[1,'Every day'],[7,'Every week'],[14,'Every 2 weeks'],[30,'Every month']].map(([n,t])=>`<option value="${n}" ${+(s.bk&&s.bk.every)===n?'selected':''}>${t}</option>`).join('')}</select></label></section>
  <section class="card"><h2>Weekly digest</h2><p class="mut">${dgOn()?'Emails every admin a summary of the last 7 days: new applications, top contributors, activity and who is waiting for approval.':'Not set up yet. Add the digest template ID to config.js (see README).'} Last sent: <b>${s.dg&&s.dg.last?new Date(s.dg.last).toLocaleString():'never'}</b>.</p><label>When a digest is due<select name="dgMode">${[['ask','Ask me on the Home screen'],['auto','Send automatically when an admin opens the app'],['off','Off']].map(([k,t])=>`<option value="${k}" ${(s.dg&&s.dg.mode||'ask')===k?'selected':''}>${t}</option>`).join('')}</select></label><div class="acts"><button type="button" class="btn" id="dgv">Preview</button><button type="button" class="btn" id="dgx">Send now</button></div></section>
  <section class="card"><h2>Industries</h2><p class="mut">One per line. Used as suggestions when capturing and adding OEM references.</p><textarea name="ind" rows="8">${esc(s.ind)}</textarea></section>
  <button class="btn pri wide">Save settings</button></form>
  <section class="card"><h2>Team</h2><p class="mut">New sign-ups start as Pending and cannot see anything until you set a role. Viewer reads, Editor adds and edits, Admin manages everything.</p><div id="tm"><p class="mut">Loading…</p></div></section>
  <section class="card"><h2>Activity log</h2><p class="mut">Only admins can see this. Newest first.</p><input id="alf" type="search" placeholder="Filter by person or action"><div class="lg" id="ALL"><p class="mut">Loading…</p></div><div class="acts"><button type="button" class="btn" id="alm">Load more</button><button type="button" class="btn bad" id="alc">Clear log</button></div></section>
  <section class="card"><h2>Data</h2><p class="mut">Back up before big changes. Backups from the earlier version import too.</p><div class="acts"><button class="btn" id="ex">Export backup</button><label class="btn">Import backup<input type="file" accept=".json,application/json" hidden id="im"></label><button class="btn bad" id="ca">Delete everything</button></div><h3 style="margin-top:14px">Sample data</h3><p class="mut">Adds 10 example applications with photos and every field filled in, to try the app. They are marked as samples and can be removed in one tap.</p><div class="acts"><button type="button" class="btn" id="sl">Load 10 sample applications</button><button type="button" class="btn bad" id="sr">Remove sample applications</button></div></section>`;
  const read=()=>{const f=new FormData($('#AF'));return{...S,pri:f.get('pri'),amb:f.get('amb'),r:+f.get('r'),font:f.get('font'),mode:f.get('mode'),company:f.get('company').trim()||'Vesconite',footer:f.get('footer').trim(),pdfAcc:f.get('pdfAcc'),cover:f.get('cover'),logo:f.has('logo'),pp:+f.get('pp'),secs:f.getAll('secs'),feat:{oem:f.has('oem'),ins:f.has('ins'),qr:f.has('qr'),pv:f.has('pv')},ind:f.get('ind'),bk:{...S.bk,every:+f.get('bkEvery')},dg:{...S.dg,mode:f.get('dgMode')||'ask'},dw:{...S.dw,logo:dwLogo.u||'',logoR:dwLogo.r||1,company:f.get('dw_company').trim(),title:f.get('dw_title').trim(),prefix:f.get('dw_prefix').trim(),rev:f.get('dw_rev').trim(),paper:f.get('dw_paper'),who:f.get('dw_who'),whoText:f.get('dw_whoText').trim(),showLogo:f.has('dw_showLogo'),fit:f.has('dw_fit'),notes:f.has('dw_notes'),noteText:f.get('dw_noteText')},dsc:Object.fromEntries(DSH.map(d=>[d.id,{c:f.get('dsc_'+d.id)||'#888888',a:(+f.get('dsa_'+d.id))/100}]))}};
  const lgShow=()=>{$('#lgp').innerHTML=dwLogo.u?`<img src="${dwLogo.u}" alt="" style="max-height:48px;background:#fff;padding:4px;border-radius:6px;vertical-align:middle"> Uploaded logo is used on drawings and documents.`:'No uploaded logo. The logo file in your repo is used instead.'};lgShow();
  $('#lgf').onchange=async e=>{const f=e.target.files[0];if(!f)return;try{const u=URL.createObjectURL(f),im=await img(u);URL.revokeObjectURL(u);let m=500,out;do{const k=Math.min(1,m/Math.max(im.width,im.height)),cv=document.createElement('canvas');cv.width=Math.round(im.width*k);cv.height=Math.round(im.height*k);cv.getContext('2d').drawImage(im,0,0,cv.width,cv.height);out={u:cv.toDataURL('image/png'),r:cv.width/cv.height};m-=140}while(out.u.length>450000&&m>100);dwLogo=out;lgShow()}catch{alert('That image could not be read.')}e.target.value=''};
  $('#lgx').onclick=()=>{dwLogo={u:'',r:1};lgShow()};
  $('#dgv').onclick=async()=>{try{alert((await dgBuild()).message)}catch(x){alert(x.message)}};$('#dgx').onclick=async e=>{const n=await dgSend(e.target);if(n)alert(`Digest sent to ${n} admin${n===1?'':'s'}.`)};
  $('#AF').addEventListener('input',()=>apply(read()));
  $$('[data-p]').forEach(b=>b.onclick=()=>{const p=PRE[+b.dataset.p];$('[name=pri]').value=p[1];$('[name=amb]').value=p[2];$('[name=pdfAcc]').value=p[2];apply(read())});
  $('#AF').onsubmit=async e=>{e.preventDefault();try{const n=read();await setDoc(dc('settings','app'),clean(n));log('Changed settings');S=n;try{localStorage.setItem('vi4s',JSON.stringify(S))}catch{}apply(S);alert('Settings saved for everyone.')}catch(x){alert('Could not save: '+x.message)}};
  const loadTeam=()=>getDocs(col('members')).then(q=>{$('#tm').innerHTML=q.docs.map(d=>{const m=d.data();return `<label class="ck"><span class="em">${m.name?`<b>${esc(m.name)}</b> `:''}${esc(m.email)} <button type="button" class="lnk" data-nm="${d.id}" data-n="${esc(m.name||'')}">${m.name?'rename':'add name'}</button></span><select data-u="${d.id}" data-e="${esc(m.email)}" data-r="${m.role}" ${d.id===ME.uid?'disabled':''}>${['pending','viewer','editor','admin'].map(r=>`<option ${r===m.role?'selected':''}>${r}</option>`).join('')}</select>${d.id===ME.uid?'':`<button type="button" class="btn bad" data-rm="${d.id}" data-e="${esc(m.email)}" style="min-height:34px;padding:0 10px;margin-left:8px">Remove</button>`}</label>`}).join('');$$('#tm [data-rm]').forEach(b=>b.onclick=async()=>{if(!confirm(`Remove ${b.dataset.e}? They lose access to the app. To delete their sign-in completely, also remove them in Firebase > Authentication > Users.`))return;try{await deleteDoc(dc('members',b.dataset.rm));log('Removed user',b.dataset.e);loadTeam();notifCheck()}catch(x){alert(x.message)}});$$('#tm [data-nm]').forEach(b=>b.onclick=async()=>{const n=prompt('Name for this person:',b.dataset.n);if(n===null)return;try{await updateDoc(dc('members',b.dataset.nm),{name:n.trim().slice(0,60)});if(b.dataset.nm===ME.uid){MYN=n.trim();cacheSave()}loadTeam()}catch(x){alert(x.message)}});$$('#tm select').forEach(s=>s.onchange=async()=>{try{await updateDoc(dc('members',s.dataset.u),{role:s.value});log('Changed role',s.dataset.e,`${s.dataset.r} → ${s.value}`);s.dataset.r=s.value}catch(x){alert(x.message)}})}).catch(x=>{$('#tm').textContent=x.message});loadTeam();
  let ACT=[],lim=100;const prevSeen=localStorage.getItem('vi4seen')||'';
  const fmt=t=>{const d=new Date(t);return d.toLocaleDateString()+' '+d.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})};
  const drawAct=()=>{const f=$('#alf').value.toLowerCase(),l=ACT.filter(x=>!f||[x.email,x.action,x.target,x.detail].join(' ').toLowerCase().includes(f));
    $('#ALL').innerHTML=l.length?l.map(x=>`<div class="lr${x.t>prevSeen&&x.uid!==ME.uid?' nw':''}"><b>${esc(x.action)}${x.target?': '+esc(x.target):''}</b><small>${esc(x.name||(x.email||'').split('@')[0])} · ${fmt(x.t)}${x.detail?' · '+esc(x.detail):''}</small></div>`).join(''):'<p class="empty">No activity yet.</p>'};
  const loadAct=async()=>{try{const q=await getDocs(query(col('activity'),orderBy('t','desc'),limit(lim)));ACT=q.docs.map(d=>({id:d.id,...d.data()}));drawAct();return true}catch(x){$('#ALL').innerHTML=`<p class="note bad">Could not load the log: ${esc(x.message)} Publish the latest firestore.rules in Firebase.</p>`;return false}};
  const drawNotif=async()=>{try{const m=await getDocs(col('members')),pend=m.docs.filter(d=>d.data().role==='pending'),nw=ACT.filter(x=>x.t>prevSeen&&x.uid!==ME.uid).length;
    $('#NT').innerHTML=`<h2>Notifications</h2>${pend.length?pend.map(d=>`<div class="nrow"><span><b>${esc(d.data().name||d.data().email)}</b><small class="mut" style="display:block">${d.data().name?esc(d.data().email)+' · ':''}is waiting for access</small></span><button type="button" class="btn" data-ap="${d.id}:viewer">Viewer</button><button type="button" class="btn" data-ap="${d.id}:editor">Editor</button></div>`).join(''):'<p class="mut">Nobody is waiting for access.</p>'}<p style="margin:12px 0 0">${nw?`<b>${nw}</b> change${nw>1?'s':''} by other people since your last visit, highlighted in the log below.`:'No new changes by other people since your last visit.'}</p>`;
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
  $('#ex').onclick=async e=>{if(await exportBackup(e.target)){const l=$('#bkl');if(l)l.textContent=new Date(S.bk.last).toLocaleString()}};
  $('#im').onchange=async e=>{try{const j=JSON.parse(await e.target.files[0].text()),L=(Array.isArray(j)?j:j.apps).filter(r=>r&&r.name);let n=0;for(const r of L){const x=norm(r),items=x.src.map(src=>({src}));delete x.src;await commit(x,items);n++}log('Imported backup','',`${n} records`);alert(`Imported ${n} records.`);render()}catch(x){alert('That file is not a valid backup.')}};
  $('#sl').onclick=async e=>{const b=e.currentTarget;b.disabled=true;try{const r=await fetch('samples.json');if(!r.ok)throw new Error('samples.json was not found. Upload it next to index.html in your repo.');const Ls=await r.json();let n=0;
    for(const x of Ls){b.textContent=`Loading ${++n} of ${Ls.length}…`;const{photos,...f}=x;await commit({...f,id:crypto.randomUUID(),date:new Date(Date.now()-n*86400000).toISOString(),sample:true,photos:[]},photos.map(src=>({src})))}
    log('Loaded sample applications','',`${Ls.length} records`);alert(`Added ${Ls.length} sample applications.`);render()}catch(x){alert(x.message)}b.disabled=false;b.textContent='Load 10 sample applications'};
  $('#sr').onclick=async()=>{const ss=A.filter(a=>a.sample);if(!ss.length)return alert('There are no sample applications.');if(!confirm(`Remove the ${ss.length} sample applications?`))return;try{for(const a of ss)await remove(a);log('Removed sample applications');render()}catch(x){alert(x.message)}};
  $('#ca').onclick=async()=>{if(confirm(`Delete all ${A.length} applications and ${O.length} OEM references? Export a backup first.`)&&confirm('This cannot be undone. Delete everything?')){try{for(const a of A)await remove(a);for(const o of O){await delFile(o.pdf);await deleteDoc(dc('oem',o.id))}log('Deleted all data');await load();render()}catch(x){alert(x.message)}}};
}

/* ---------- Router ---------- */
const splOff=()=>{const s=$('#spl');if(!s||s.dataset.x)return;s.dataset.x=1;setTimeout(()=>{s.classList.add('off');setTimeout(()=>s.remove(),500)},Math.max(0,900-performance.now()))};setTimeout(splOff,9000);
function render(){
  const[p='',id]=location.hash.slice(2).split('/'),v=$('#v');
  if(!ready&&p!=='share')return;splOff();if(MG.mu){MG.mu();MG.mu=null}MG.cur=null;document.body.classList.toggle('chatpage',p==='chat');
  apply(S);document.body.classList.toggle('bare',p==='share'||!ME||['pending','verify','blocked'].includes(ROLE));
  $('#ad').hidden=!(ME&&can('del'));
  if(p==='share')return share(v,id);
  if(!ME)return login(v);
  if(ROLE==='verify')return verify(v);
  if(ROLE==='blocked')return blocked(v);
  if(!['admin','editor','viewer'].includes(ROLE))return pending(v);
  const ed=can('edit'),m={'':home,library,new:ed?form:home,edit:ed?form:home,app:detail,insights:S.feat.ins?insights:home,oem:S.feat.oem?oem:home,tools,design:S.feat.pv?design:home,quickdraw:S.feat.pv?quickdraw:home,datasheets,datasheet,portfolio,freezer:S.feat.pv?freezer:home,trophies,chats,chat,chatnew,admin};
  (m[p]||home)(v,id);
  $$('.tabs a').forEach(a=>a.classList.toggle('on',a.getAttribute('href')==='#/'+(p==='app'||p==='edit'?'library':p==='design'||p==='quickdraw'||p==='datasheets'||p==='datasheet'||p==='portfolio'?'tools':p==='chat'||p==='chatnew'?'chats':p)));
  $('.tabs .add').hidden=!ed;scrollTo(0,0);
}
const soft=()=>{const p=location.hash.slice(2).split('/')[0];if(['','library','oem','insights'].includes(p))render()};
async function refresh(u){
  const[m0]=await Promise.all([getDoc(dc('members',u.uid)),load().catch(()=>0)]);let m=m0;
  if(!m.exists()){
    let nm=u.displayName||'';try{nm=localStorage.getItem('vi4pn')||nm}catch{}
    const rec={email:(u.email||'').toLowerCase(),name:nm};let made=false;
    try{await setDoc(dc('members',u.uid),{...rec,role:'admin'});made=true}catch{}
    if(!made){
      if(!okDomain(u.email)){ROLE='blocked';MYN='';return}
      if(!u.emailVerified){ROLE='verify';MYN='';return}
      await setDoc(dc('members',u.uid),{...rec,role:'pending'});notifyAdmin(u,nm);try{localStorage.removeItem('vi4pn')}catch{}
    }
    m=await getDoc(dc('members',u.uid));await load().catch(()=>0)}
  MYN=m.data().name||'';ROLE=m.data().role;if(!OKR.includes(ROLE)){A=[];O=[]}cacheSave();
}
/* ---------- Chats: private messages between staff, about an application or not. Rules keep each chat readable only by the people in it. ---------- */
const MG={list:[],un:null,mu:null,cur:null,mem:null,first:true,ms:[],blobs:new Map(),pend:null};
const cnm=()=>MYN||(ME&&ME.email||'').split('@')[0]||'Someone';
const cUnread=c=>!!c.lastAt&&c.lastBy!==ME.uid&&c.lastAt>((c.seen||{})[ME.uid]||'');
const cCount=()=>MG.list.filter(cUnread).length;
const cWho=(c,u)=>(c.mn&&c.mn[u])||'Someone';
const cTitle=c=>c.name||(c.members.filter(u=>u!==ME.uid).map(u=>cWho(c,u)).join(', ')||'Just you');
const cTime=t=>{if(!t)return'';const d=new Date(t);return d.toDateString()===new Date().toDateString()?d.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}):d.toLocaleDateString([],{day:'numeric',month:'short'})};
const ini=s=>(String(s).trim().split(/\s+/).slice(0,2).map(w=>w[0]||'').join('')||'?').toUpperCase();
const cSize=n=>n>1048576?(n/1048576).toFixed(1)+' MB':Math.max(1,Math.round(n/1024))+' KB';
const CMAX=8*1048576;
function cBadge(){const n=cCount(),b=$('#t-chat b');if(b){b.hidden=!n;b.textContent=n>9?'9+':n}try{if(navigator.setAppBadge){n?navigator.setAppBadge(n):navigator.clearAppBadge()}}catch{}}
function toast(t,href){const o=document.createElement('div');o.className='tst';o.textContent=t;o.onclick=()=>{o.remove();if(href)location.hash=href};document.body.appendChild(o);setTimeout(()=>o.remove(),6000)}
function sheet(html,wire){const o=document.createElement('div');o.className='cmo';o.innerHTML=`<div>${html}</div>`;document.body.appendChild(o);const x=()=>o.remove();o.onclick=e=>{if(e.target===o)x()};wire&&wire(o,x);return x}
function chatStart(){
  if(MG.un||!ME||!db||!OKR.includes(ROLE))return;MG.first=true;
  MG.un=onSnapshot(query(col('chats'),where('members','array-contains',ME.uid)),snap=>{
    const old=new Map(MG.list.map(c=>[c.id,c.lastAt]));
    MG.list=snap.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>(b.lastAt||b.created||'').localeCompare(a.lastAt||a.created||''));
    if(!MG.first)MG.list.forEach(c=>{if(cUnread(c)&&c.id!==MG.cur&&old.get(c.id)!==c.lastAt)toast(`${cWho(c,c.lastBy)}${c.name?' in '+c.name:''}: ${c.lastText||''}`,'#/chat/'+c.id)});
    MG.first=false;cBadge();
    const p=location.hash.slice(2).split('/')[0];
    if(p==='chats')chats($('#v'));else if(p==='chat'&&MG.cur){chatHead();cSeen()}else if(p===''&&$('#cun'))$('#cun').hidden=!cCount();
  },e=>console.warn('chats',e.message));
}
function chatStop(){if(MG.un)MG.un();MG.un=null;MG.list=[];MG.first=true;cBadge()}
/* attachments are stored as base64 chunks under the chat itself, so only people in the chat can read them */
async function cPut(cid,blob){
  const s=await new Promise((ok,no)=>{const r=new FileReader();r.onload=()=>ok(r.result);r.onerror=()=>no(new Error('Could not read the file'));r.readAsDataURL(blob)}),id=crypto.randomUUID(),n=Math.ceil(s.length/CH);
  await Promise.all(Array.from({length:n},(_,i)=>setDoc(doc(db,'chats',cid,'files',`${id}_${i}`),{by:ME.uid,d:s.slice(i*CH,(i+1)*CH)})));return{id,n}}
async function cGet(cid,a){
  if(MG.blobs.has(a.id))return MG.blobs.get(a.id);
  const parts=await Promise.all([...Array(a.n).keys()].map(i=>getDoc(doc(db,'chats',cid,'files',`${a.id}_${i}`)))),b=await (await fetch(parts.map(d=>d.data().d).join(''))).blob();MG.blobs.set(a.id,b);return b}
async function cPrep(file){   /* photos are shrunk before sending; returns {blob,name,type,th} */
  if(!/^image\/(jpeg|png|webp|heic|heif|gif)$/i.test(file.type)||/gif/i.test(file.type))return{blob:file,name:file.name,type:file.type||'application/octet-stream'};
  try{const u=URL.createObjectURL(file),im=await img(u);URL.revokeObjectURL(u);
    const mk=(m,q)=>{const k=Math.min(1,m/Math.max(im.width,im.height)),c=document.createElement('canvas');c.width=Math.round(im.width*k);c.height=Math.round(im.height*k);const g=c.getContext('2d');g.fillStyle='#fff';g.fillRect(0,0,c.width,c.height);g.drawImage(im,0,0,c.width,c.height);return c.toDataURL('image/jpeg',q)};
    const big=mk(1600,.82),th=mk(240,.6);return{blob:await (await fetch(big)).blob(),name:file.name.replace(/\.\w+$/,'')+'.jpg',type:'image/jpeg',th}}
  catch{return{blob:file,name:file.name,type:file.type||'application/octet-stream'}}}
async function cSend(cid,text,sys,file){
  const now=new Date().toISOString(),m={from:ME.uid,n:cnm(),text:text||'',t:now};if(sys)m.sys=true;
  if(file){if(file.blob.size>CMAX)throw new Error(`That file is ${cSize(file.blob.size)}. The limit is ${cSize(CMAX)}.`);const f=await cPut(cid,file.blob);m.att={id:f.id,n:f.n,name:file.name,type:file.type,size:file.blob.size};if(file.th)m.att.th=file.th}
  await setDoc(doc(db,'chats',cid,'msgs',crypto.randomUUID()),m);
  const last=text?text.slice(0,120):m.att?(m.att.type.startsWith('image/')?'📷 Photo':'📎 '+m.att.name.slice(0,80)):'';
  await updateDoc(dc('chats',cid),{lastAt:now,lastBy:ME.uid,lastText:last,['seen.'+ME.uid]:now});
}
function cSeen(){
  const c=MG.list.find(x=>x.id===MG.cur);if(!c||!cUnread(c)||document.hidden)return;
  const now=new Date().toISOString();updateDoc(dc('chats',c.id),{['seen.'+ME.uid]:c.lastAt>now?c.lastAt:now}).catch(()=>{});
}
async function cMembers(){
  if(!MG.mem)try{const q=await getDocs(col('members'));MG.mem=q.docs.map(d=>({id:d.id,...d.data()})).filter(m=>OKR.includes(m.role)).map(m=>({id:m.id,name:m.name||(m.email||'').split('@')[0],email:m.email||''}))}catch{MG.mem=[]}
  return MG.mem.filter(m=>m.id!==ME.uid);
}
async function cEnsure(sel,name,a){   /* open the matching chat or create it; sel = ids of the other people */
  const all=await cMembers(),ids=[ME.uid,...sel],key=[...ids].sort().join(),aid=a?a.id:'';
  let c=MG.list.find(x=>(x.appId||'')===aid&&[...x.members].sort().join()===key&&!x.name);
  if(!c){const mn={[ME.uid]:cnm()};all.forEach(m=>{if(sel.includes(m.id))mn[m.id]=m.name});const id=crypto.randomUUID(),now=new Date().toISOString();
    const d={members:ids,mn,name:sel.length>1?(name||'').trim().slice(0,60):'',appId:aid,appName:a?a.name:'',by:ME.uid,created:now,seen:{[ME.uid]:now}};await setDoc(dc('chats',id),d);c={id,...d}}
  return c}
function chats(v){
  const L=MG.list;
  v.innerHTML=`<div class="chh"><h1>Chats</h1><a class="btn pri" href="#/chatnew">New chat</a></div>${L.length?`<div class="cl">${L.map(c=>{const t=cTitle(c),u=cUnread(c);return `<a class="row crow${u?' un':''}" href="#/chat/${c.id}"><div class="av${c.members.length>2||c.name?' gr':''}">${esc(ini(t))}</div><div><strong>${esc(t)}</strong>${c.appName?`<small class="mut">About: ${esc(c.appName)}</small>`:''}<small>${c.lastAt?`${c.lastBy===ME.uid?'You: ':c.members.length>2?esc(cWho(c,c.lastBy).split(' ')[0])+': ':''}${esc(c.lastText||'')}`:'No messages yet'}</small></div><div class="ct">${esc(cTime(c.lastAt))}${u?'<i class="dot"></i>':''}</div></a>`}).join('')}</div>`:'<p class="empty">No chats yet. Start one here, or open an application and tap Message.</p>'}<p class="mut">Chats are private to the people in them. Admins cannot read them in the app.</p>`;
}
const cPick=(list,sel,box,onch)=>{const q=(box.q&&box.q.value||'').toLowerCase(),l=list.filter(m=>!q||(m.name+' '+m.email).toLowerCase().includes(q));
  box.el.innerHTML=l.length?l.map(m=>`<button type="button" class="row pick${sel.has(m.id)?' on':''}" data-u="${m.id}"><div class="av">${esc(ini(m.name))}</div><div><strong>${esc(m.name)}</strong><small>${esc(m.email)}</small></div><span class="tick">${sel.has(m.id)?'✓':'+'}</span></button>`).join(''):'<p class="mut">Nobody found.</p>';
  $$('[data-u]',box.el).forEach(b=>b.onclick=()=>{const u=b.dataset.u;sel.has(u)?sel.delete(u):sel.add(u);cPick(list,sel,box,onch);onch&&onch()})};
async function chatnew(v,appId){
  const a=appId?A.find(x=>x.id===appId):null,sel=new Set();
  v.innerHTML='<p class="empty">Loading…</p>';const all=await cMembers();
  v.innerHTML=`<a class="back" href="#/${a?'app/'+a.id:'chats'}">← ${a?'Application':'Chats'}</a><h1>New chat</h1>${a?`<div class="card cab2"><small class="mut">About this application</small><b>${esc(a.name)}</b> <span class="mut">${esc(a.industry||'')}</span></div>`:''}
  <label>To<input id="cq" type="search" placeholder="Search people"></label><div id="cp" class="cpk"></div><p class="mut" id="cs">Choose one person, or several for a group chat.</p>
  <label id="cgl" hidden>Group name (optional)<input id="cg" maxlength="60" placeholder="e.g. Pump project"></label>
  <label>Message<textarea id="cm" rows="3" maxlength="2000" placeholder="${a?'Write about this application…':'Write a message…'}"></textarea></label>
  <div class="acts"><button class="btn pri" id="cgo">Send</button></div>`;
  const box={el:$('#cp'),q:$('#cq')},onch=()=>{$('#cgl').hidden=sel.size<2;$('#cs').textContent=sel.size?`${sel.size} selected${sel.size>1?' (group chat)':''}`:'Choose one person, or several for a group chat.'};
  cPick(all,sel,box,onch);$('#cq').oninput=()=>cPick(all,sel,box,onch);
  $('#cgo').onclick=async()=>{const text=$('#cm').value.trim();if(!sel.size)return alert('Choose at least one person.');if(!text)return alert('Write a message first.');
    const b=$('#cgo'),done=busy(b,'Sending…');
    try{const c=await cEnsure([...sel],$('#cg').value,a);await cSend(c.id,text);done();location.hash='#/chat/'+c.id}catch(x){done();alert('Could not send: '+(x.message||x))}};
}
function chatHead(){
  const c=MG.list.find(x=>x.id===MG.cur),h=$('#cht');if(!h)return;
  if(!c){h.innerHTML=MG.first?'<b>Loading…</b>':'<b>Chat not found</b><small>It may not exist, or you are not in it.</small>';return}
  h.innerHTML=`<b>${esc(cTitle(c))}</b><small>${esc(c.members.map(u=>u===ME.uid?'You':cWho(c,u)).join(', '))}</small>${c.appName?`<a class="lnk" href="#/app/${c.appId}">About: ${esc(c.appName)}</a>`:''}`;
}
function drawMsgs(){
  const el=$('#mg');if(!el)return;const c=MG.list.find(x=>x.id===MG.cur),near=innerHeight+scrollY>=document.body.scrollHeight-160||!el.dataset.d;let day='',last='';
  el.innerHTML=MG.ms.length?MG.ms.map(m=>{const d=new Date(m.t),ds=d.toDateString(),h=ds!==day?`<div class="mday">${esc(d.toLocaleDateString([],{weekday:'long',day:'numeric',month:'long'}))}</div>`:'';day=ds;
    if(m.sys){last='';return h+`<div class="msys">${esc(m.text)}</div>`}
    const me=m.from===ME.uid,nm=!me&&c&&c.members.length>2&&last!==m.from?`<small>${esc(m.n||'')}</small>`:'';last=m.from;
    if(m.del)return h+`<div class="mb${me?' me':''} gone">${nm}This message was deleted<time>${esc(d.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}))}</time></div>`;
    const a=m.att,at=a?(a.th?`<img class="ai" data-a="${m.id}" src="${a.th}" alt="${esc(a.name)}">`:`<button type="button" class="afile" data-a="${m.id}"><span>${/pdf/i.test(a.type)?'PDF':'FILE'}</span><b>${esc(a.name)}</b><small>${esc(cSize(a.size||0))}</small></button>`):'';
    return h+`<div class="mb${me?' me':''}">${nm}${at}${m.text?`<div class="mt">${esc(m.text)}</div>`:''}<time>${m.edited?'edited · ':''}${esc(d.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}))}${me?` <button type="button" class="mx" data-x="${m.id}" aria-label="Message options">⋯</button>`:''}</time></div>`}).join(''):'<p class="mut" style="text-align:center">No messages yet.</p>';
  el.dataset.d=1;if(near)scrollTo(0,document.body.scrollHeight);
}
async function cOpenAtt(m){
  const a=m.att;if(!a)return;let b;try{b=await cGet(MG.cur,a)}catch(x){return alert('Could not load the file: '+(x.message||x))}
  if(/^image\//.test(a.type)){const u=URL.createObjectURL(b);sheet(`<img class="aview" src="${u}" alt=""><div class="acts"><button class="btn pri" id="asv">Save / share</button><button class="btn" id="ax">Close</button></div>`,(o,x)=>{$('#ax',o).onclick=()=>{URL.revokeObjectURL(u);x()};$('#asv',o).onclick=()=>deliver(b,a.name,{noChat:true})})}
  else deliver(b,a.name,{noChat:true});
}
function cMsgMenu(m){
  const c=MG.list.find(x=>x.id===MG.cur);
  sheet(`<h2>Message</h2><div class="acts" style="flex-direction:column;align-items:stretch"><button class="btn" id="me">Edit</button><button class="btn bad" id="md">Delete</button><button class="btn" id="mc">Cancel</button></div>`,(o,x)=>{
    $('#mc',o).onclick=x;
    $('#me',o).onclick=()=>{x();sheet(`<h2>Edit message</h2><textarea id="et" rows="4" maxlength="2000">${esc(m.text||'')}</textarea><div class="acts"><button class="btn pri" id="es">Save</button><button class="btn" id="ec">Cancel</button></div>`,(o2,x2)=>{
      $('#ec',o2).onclick=x2;$('#es',o2).onclick=async()=>{const t=$('#et',o2).value.trim();if(!t&&!m.att)return alert('A message cannot be empty. Delete it instead.');const done=busy($('#es',o2),'Saving…');
        try{await updateDoc(doc(db,'chats',MG.cur,'msgs',m.id),{text:t,edited:true});if(c&&c.lastAt===m.t)await updateDoc(dc('chats',MG.cur),{lastText:t.slice(0,120)||(m.att?'📎 '+m.att.name.slice(0,80):'')});x2()}catch(e){done();alert('Could not save: '+(e.message||e))}}})};
    $('#md',o).onclick=async()=>{if(!confirm('Delete this message for everyone in the chat?'))return;
      try{await updateDoc(doc(db,'chats',MG.cur,'msgs',m.id),{del:true,text:'',att:null,edited:false});
        if(m.att)for(let i=0;i<m.att.n;i++)deleteDoc(doc(db,'chats',MG.cur,'files',`${m.att.id}_${i}`)).catch(()=>{});
        if(c&&c.lastAt===m.t)await updateDoc(dc('chats',MG.cur),{lastText:'Message deleted'});x()}catch(e){alert('Could not delete: '+(e.message||e))}}})
}
function cOptions(){
  const id=MG.cur,c=MG.list.find(x=>x.id===id);if(!c)return;
  sheet(`<h2>${esc(cTitle(c))}</h2><div class="acts" style="flex-direction:column;align-items:stretch"><button class="btn" id="oa">Add people</button>${c.members.length>2||c.name?'<button class="btn" id="orn">Rename group</button>':''}<button class="btn bad" id="ol">Leave chat</button><button class="btn" id="oc">Close</button></div>`,(o,x)=>{
    $('#oc',o).onclick=x;$('#oa',o).onclick=()=>{x();cAdd()};
    if($('#orn',o))$('#orn',o).onclick=async()=>{const n=prompt('Group name',c.name||'');if(n===null)return;x();try{await updateDoc(dc('chats',id),{name:n.trim().slice(0,60)})}catch(e){alert(e.message)}};
    $('#ol',o).onclick=async()=>{if(!confirm('Leave this chat? You will no longer see it or its messages.'))return;
      try{await cSend(id,`${cnm()} left the chat`,true);await updateDoc(dc('chats',id),{members:arrayRemove(ME.uid)});x();location.hash='#/chats'}catch(e){alert('Could not leave: '+(e.message||e))}}})
}
async function cAdd(){
  const id=MG.cur,c=MG.list.find(x=>x.id===id);if(!c)return;const all=(await cMembers()).filter(m=>!c.members.includes(m.id)),sel=new Set();
  sheet(`<h2>Add people</h2><p class="mut">They will be able to read the earlier messages in this chat.</p>${all.length?`<input id="aq" type="search" placeholder="Search people"><div id="ap" class="cpk"></div>`:'<p class="empty">Everyone is already in this chat.</p>'}<div class="acts"><button class="btn pri" id="aok"${all.length?'':' hidden'}>Add</button><button class="btn" id="ax">Close</button></div>`,(o,x)=>{
    const box={el:$('#ap',o),q:$('#aq',o)};if(all.length){cPick(all,sel,box);$('#aq',o).oninput=()=>cPick(all,sel,box)}
    $('#ax',o).onclick=x;
    $('#aok',o).onclick=async()=>{if(!sel.size)return;const b=$('#aok',o),done=busy(b,'Adding…'),add=all.filter(m=>sel.has(m.id)),up={members:arrayUnion(...add.map(m=>m.id))};add.forEach(m=>up['mn.'+m.id]=m.name);
      try{await updateDoc(dc('chats',id),up);await cSend(id,`${cnm()} added ${add.map(m=>m.name).join(', ')}`,true);x()}catch(e){done();alert('Could not add: '+(e.message||e))}}})
}
function chat(v,id){
  MG.cur=id;MG.ms=[];MG.pend=null;
  v.innerHTML=`<div class="chv"><div class="chb"><a class="back" href="#/chats" aria-label="Back to chats">←</a><div class="cht" id="cht"></div><button class="btn" id="cad" type="button">Options</button></div><div class="msgs" id="mg"><p class="mut" style="text-align:center">Loading…</p></div><div class="pnd" id="pnd" hidden></div><form class="cmp" id="cf"><label class="btn attb" aria-label="Attach a file">📎<input type="file" id="cfi" hidden></label><textarea id="ci" rows="1" maxlength="2000" placeholder="Message"></textarea><button class="btn pri" id="csd">Send</button></form></div>`;
  chatHead();cSeen();
  MG.mu=onSnapshot(query(collection(db,'chats',id,'msgs'),orderBy('t','desc'),limit(200)),snap=>{MG.ms=snap.docs.map(d=>({id:d.id,...d.data()})).reverse();drawMsgs();cSeen()},e=>{const m=$('#mg');if(m)m.innerHTML=`<p class="note bad">Could not open this chat: ${esc(e.message)}. Check that the latest firestore.rules are published.</p>`});
  const ci=$('#ci'),grow=()=>{ci.style.height='auto';ci.style.height=Math.min(ci.scrollHeight,120)+'px'};ci.oninput=grow;
  const showP=()=>{const p=MG.pend,el=$('#pnd');el.hidden=!p;if(p)el.innerHTML=`${p.th?`<img src="${p.th}" alt="">`:'<span class="pf">FILE</span>'}<div><b>${esc(p.name)}</b><small>${esc(cSize(p.blob.size))}</small></div><button type="button" class="btn" id="pdx" aria-label="Remove attachment">✕</button>`;if(p)$('#pdx').onclick=()=>{MG.pend=null;showP()}};
  $('#cfi').onchange=async e=>{const f=e.target.files[0];e.target.value='';if(!f)return;MG.pend=await cPrep(f);if(MG.pend.blob.size>CMAX){alert(`That file is ${cSize(MG.pend.blob.size)}. The limit is ${cSize(CMAX)}.`);MG.pend=null}showP()};
  const go=async()=>{const t=ci.value.trim(),f=MG.pend;if(!t&&!f)return;const b=$('#csd'),done=busy(b,f?'Uploading…':'Sending…');
    try{await cSend(id,t,false,f);ci.value='';grow();MG.pend=null;showP()}catch(x){alert('Could not send: '+(x.message||x))}done()};
  $('#cf').onsubmit=e=>{e.preventDefault();go()};
  ci.onkeydown=e=>{if(e.key==='Enter'&&!e.shiftKey&&matchMedia('(pointer:fine)').matches){e.preventDefault();go()}};
  $('#cad').onclick=cOptions;
  $('#mg').onclick=e=>{const x=e.target.closest('[data-x]'),a=e.target.closest('[data-a]');const m=MG.ms.find(z=>z.id===(x?x.dataset.x:a&&a.dataset.a));if(!m)return;x?cMsgMenu(m):cOpenAtt(m)};
}
/* "Send to chat" for anything the app generates (PDFs, drawings, data sheets) */
async function cShare(blob,name){
  if(blob.size>CMAX)return alert(`That file is ${cSize(blob.size)}. Chats take files up to ${cSize(CMAX)}.`);
  const all=await cMembers(),sel={c:null,u:null};
  sheet(`<h2>Send to chat</h2><p class="mut">${esc(name)} · ${esc(cSize(blob.size))}</p><input id="sq" type="search" placeholder="Search chats and people"><div id="sl" class="cpk"></div><label>Note (optional)<input id="sn" maxlength="300"></label><div class="acts"><button class="btn pri" id="sok" disabled>Send</button><button class="btn" id="sx">Cancel</button></div>`,(o,x)=>{
    const draw=()=>{const q=($('#sq',o).value||'').toLowerCase(),cs=MG.list.filter(c=>!q||cTitle(c).toLowerCase().includes(q)),ps=all.filter(m=>!q||(m.name+' '+m.email).toLowerCase().includes(q));
      $('#sl',o).innerHTML=(cs.length?'<small class="mut">Chats</small>'+cs.map(c=>`<button type="button" class="row pick${sel.c===c.id?' on':''}" data-c="${c.id}"><div class="av${c.members.length>2||c.name?' gr':''}">${esc(ini(cTitle(c)))}</div><div><strong>${esc(cTitle(c))}</strong>${c.appName?`<small>About: ${esc(c.appName)}</small>`:''}</div><span class="tick">${sel.c===c.id?'✓':'+'}</span></button>`).join(''):'')+(ps.length?'<small class="mut">New chat with</small>'+ps.map(m=>`<button type="button" class="row pick${sel.u===m.id?' on':''}" data-p="${m.id}"><div class="av">${esc(ini(m.name))}</div><div><strong>${esc(m.name)}</strong><small>${esc(m.email)}</small></div><span class="tick">${sel.u===m.id?'✓':'+'}</span></button>`).join(''):'');
      $$('[data-c]',o).forEach(b=>b.onclick=()=>{sel.c=b.dataset.c;sel.u=null;$('#sok',o).disabled=false;draw()});$$('[data-p]',o).forEach(b=>b.onclick=()=>{sel.u=b.dataset.p;sel.c=null;$('#sok',o).disabled=false;draw()})};
    draw();$('#sq',o).oninput=draw;$('#sx',o).onclick=x;
    $('#sok',o).onclick=async()=>{const b=$('#sok',o),done=busy(b,'Sending…');
      try{const c=sel.c?MG.list.find(z=>z.id===sel.c):await cEnsure([sel.u],'',null);await cSend(c.id,$('#sn',o).value.trim(),false,{blob,name,type:blob.type||'application/octet-stream'});x();toast(`Sent to ${cTitle(c)}. Tap to open.`,'#/chat/'+c.id)}
      catch(e){done();alert('Could not send: '+(e.message||e))}}})
}
async function boot(u){
  ME=u;
  if(!u){chatStop();ROLE=null;A=[];O=[];try{localStorage.removeItem('vi4d')}catch{}ready=true;render();return}
  const c=cacheGet();
  if(c&&c.uid===u.uid&&OKR.includes(c.role)){ROLE=c.role;MYN=c.nm||'';A=c.A||[];O=c.O||[];ready=true;render();notifCheck();chatStart();refresh(u).then(()=>{soft();notifCheck();chatStart()}).catch(()=>{});return}   /* show cached data instantly, refresh in the background */
  ROLE=null;await refresh(u);ready=true;render();notifCheck();chatStart();
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
/* Pull down to refresh: a small Hilube bush (50 x 40 x 60 mm, longitudinal grooves) that hops */
(function(){
  const el=document.createElement('div');el.id='ptr';el.setAttribute('aria-hidden','true');
  const notch=Array.from({length:6},(_,k)=>{const t=(90+k*60)*Math.PI/180;return `<circle cx="${(30+16*Math.cos(t)).toFixed(2)}" cy="${(20+5.1*Math.sin(t)).toFixed(2)}" r="1.9" fill="#2a2e33"/>`}).join('');
  const lines=[210,250,290,330].map(a=>{const t=a*Math.PI/180,x=(30+16*Math.cos(t)).toFixed(2),y=(20+5.1*Math.sin(t)).toFixed(2);return `<line x1="${x}" y1="${y}" x2="${x}" y2="${(+y+11).toFixed(2)}" stroke="#555b63" stroke-width="1.6"/>`}).join('');
  el.innerHTML=`<div class="pb"><svg viewBox="0 0 60 84" width="50" height="70"><defs><linearGradient id="pbg" x1="0" x2="1"><stop offset="0" stop-color="#cdc3a8"/><stop offset=".45" stop-color="#fffaf0"/><stop offset="1" stop-color="#c6bca0"/></linearGradient><linearGradient id="pbl" x1="0" x2="1"><stop offset="0" stop-color="#3a50b4"/><stop offset=".45" stop-color="#7389ee"/><stop offset="1" stop-color="#32459b"/></linearGradient><clipPath id="pbc"><ellipse cx="30" cy="20" rx="16" ry="5.1"/></clipPath></defs><path d="M10 20V68A20 6.4 0 0 0 50 68V20Z" fill="url(#pbg)" stroke="#b9ae90" stroke-width=".7"/><path d="M10 40V48A20 6.4 0 0 0 50 48V40A20 6.4 0 0 1 10 40Z" fill="url(#pbl)"/><ellipse cx="30" cy="20" rx="20" ry="6.4" fill="#fffaf0" stroke="#b9ae90" stroke-width=".7"/><ellipse cx="30" cy="20" rx="16" ry="5.1" fill="#23272c"/><g clip-path="url(#pbc)">${lines}</g>${notch}</svg></div><i class="ps"></i>`;
  document.body.appendChild(el);
  const pb=el.querySelector('.pb');let y0=0,dy=0,on=false;
  const pull=d=>{const q=Math.min(d,130);el.style.transform=`translate(-50%,${q*.78-84}px)`;pb.style.transform=`rotate(${Math.sin(q/15)*12}deg) scale(${.72+Math.min(q,90)/320})`;el.classList.toggle('ready',d>90)};
  const rest=()=>{el.style.transform='';pb.style.transform='';el.classList.remove('ready')};
  addEventListener('touchstart',e=>{on=scrollY<=0&&e.touches.length===1&&!e.target.closest('.ov,#bgame,.m3,textarea,input,select');if(on){y0=e.touches[0].clientY;dy=0}},{passive:true});
  addEventListener('touchmove',e=>{if(!on)return;dy=e.touches[0].clientY-y0;if(dy>0)pull(dy);else{on=false;rest()}},{passive:true});
  addEventListener('touchend',()=>{if(on&&dy>90){el.classList.remove('ready');el.classList.add('go');el.style.transform='translate(-50%,26px)';pb.style.transform='';setTimeout(()=>location.reload(),1200)}else rest();on=false},{passive:true});
})();

setInterval(()=>{if(!document.hidden)notifCheck()},60000);document.addEventListener('visibilitychange',()=>{if(!document.hidden)notifCheck()});
