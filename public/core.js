/* fRacing Legends - shared data & helpers */
let S;try{S=JSON.parse(localStorage.getItem('f1c-mm'))}catch(e){}
S=S||{ev:[],dr:[],tm:[],rc:[]};['ev','dr','tm','rc'].forEach(k=>S[k]=S[k]||[]);
let TSP='',TSL='',TEV=null;const ADMIN=location.pathname.indexOf('/owner')==0;let SYNC='local',BASE=0,pushT;
const loc=()=>{try{localStorage.setItem('f1c-mm',JSON.stringify(S));localStorage.setItem('f1c-hub',JSON.stringify(hub()))}catch(e){}};
const save=()=>{loc();if(ADMIN&&SYNC=='cloud'){clearTimeout(pushT);pushT=setTimeout(doPush,300)}};
async function doPush(){try{const r=await fetch('/api/state',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({s:S,base:BASE})});
if(r.status==401)return say('Session expired. Open the owner menu again and enter the code.');if(!r.ok)return say('Could not save to the shared database. Try again.');
const j=await r.json();BASE=j.ts;if(j.merged){S=j.s;loc();if(typeof render=='function')render()}}catch(e){say('No connection. Changes are saved only in this browser for now.')}}
async function load(){try{const r=await fetch('/api/state',{cache:'no-store',credentials:'same-origin'});if(!r.ok)return;const j=await r.json();SYNC='cloud';BASE=j.ts;
if(j.s){S=j.s;['ev','dr','tm','rc'].forEach(k=>S[k]=S[k]||[]);loc()}else if(ADMIN&&(S.ev.length||S.dr.length||S.tm.length||S.rc.length))await doPush()}catch(e){}}
const READY=load();
const $=s=>document.querySelector(s),say=t=>{const m=$('#msg');if(m){m.textContent=t;m.classList.remove('pop');void m.offsetWidth;m.classList.add('pop')}};
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const CL=['ROOKIE CLASS','CLASS D','CLASS C','CLASS B','CLASS A','CLASS PRO'],TY=['Soft','Medium','Hard','Inter','Wet'];
const NM={q0:'Qualifying 1',q1:'Qualifying 2',q2:'Qualifying 3',sp:'Sprint Race',fe:'Race'};
const PF=[25,18,15,12,10,8,6,4,2,1],PS=[8,7,6,5,4,3,2,1],SL=[['d1','Driver 1'],['d2','Driver 2'],['r1','Reserve 1'],['r2','Reserve 2']];
const SC=[['r','Races','RACES'],['po','Pole','POLE'],['w','Wins','WINS'],['pd','Podium','PODIUM'],['dr','Driver of the Race','DOTR'],['gp','Gained Position','GAINED'],['sp','Sprint','SPRINT'],['sw','Sprint Wins','S.WINS'],['dnf','DNF','DNF'],['dsq','DSQ','DSQ'],['dns','DNS','DNS'],['fl','Fastest Lap','FL'],['p','Points','PTS'],['t','Title','TITLE']];
const uid=()=>Math.random().toString(36).slice(2,8);
const contrast=h=>{const n=parseInt((h||'#000').slice(1),16);return((n>>16)*.3+(n>>8&255)*.59+(n&255)*.11)>150?'#111':'#fff'};
const dn=d=>(S.dr.find(x=>x.did==d)||{}).name||'';
const nmLabel=d=>S.dr.filter(x=>x.name.toLowerCase()==d.name.toLowerCase()).length>1?d.name+' ('+d.did+')':d.name;
const sn=n=>{const p=(n||'').split(' ');return p.length>1?p[0]+' '+p[p.length-1][0]+'.':n};
const fcode=c=>{c=String(c||'').trim();const m=[...c].map(ch=>ch.codePointAt(0)).filter(x=>x>=127462&&x<=127487);return m.length==2?m.map(x=>String.fromCharCode(x-127397)).join('').toLowerCase():c.toLowerCase()};
/* flat flag image, scaled to the country's own width:height ratio and fitted inside a mw x mh box */
const flagImg=(c,mw,mh)=>{mw=mw||64;mh=mh||44;const k=fcode(c),f=typeof FLAGS!=='undefined'&&FLAGS[k];if(!f)return`<span class=fb0>${esc(c||'')}</span>`;let h=mh,w=h*f[0];if(w>mw){w=mw;h=w/f[0]}return`<img class=flag src="/flags/${k}.svg" width="${Math.round(w)}" height="${Math.round(h)}" alt="${esc(f[1])}">`};
const fl=c=>flagImg(c,32,22);
const evT=e=>S.tm.filter(t=>t.ev==e.id),evD=e=>[...new Set(evT(e).flatMap(t=>t.d.filter(Boolean)))];
const isOpen=e=>e.reg!==false,isFull=e=>evT(e).length>=e.quota;
const regTxt=e=>!isOpen(e)?'Registration Closed':isFull(e)?'Registration Full':'Registration Open';
const tmO=(e,d)=>evT(e).find(t=>t.d.slice(0,2).includes(d))||evT(e).find(t=>t.d.includes(d))||{},txT=t=>(t&&(t.tx||t.col))||'#8b93a7',txD=(t,d)=>txT(t),tc=(e,d)=>txD(tmO(e,d),d),noOf=(e,d)=>(tmO(e,d).num||{})[d]||'-';
const get=(r,s)=>s[0]=='q'?r.q[+s[1]]:r[s];
const lastQi=r=>{for(let i=2;i>=0;i--)if(r.q[i]&&r.q[i].length)return i;return -1};/* lap time format: m.ss,hh (example 1.23,45). Older saved times like 1:23.456 are converted on display. */
const fmtLT=v=>{v=String(v||'').trim();if(/^(\d{1,2}\.)?\d{2},\d{2}$/.test(v))return v;const m=v.match(/^(?:(\d{1,2}):)?(\d{1,2})\.(\d{1,3})$/);if(!m)return v;let t=Math.round((+m[1]||0)*6000+(+m[2])*100+Math.round(+('0.'+m[3])*100));const mi=Math.floor(t/6000),se=Math.floor(t%6000/100),hh=t%100,p2=n=>String(n).padStart(2,'0');return(m[1]!=null?mi+'.':'')+(m[1]!=null?p2(se):se<10?p2(se):se)+','+p2(hh)};
const okLT=v=>/^(\d{1,2}\.)?\d{2},\d{2}$/.test(v);
const poleLT=r=>{const i=lastQi(r);return i<0?'':fmtLT((r.lt||{})['q'+i]||'')};
/* starting grid: last qualifying session first, then drivers who dropped out in earlier sessions, in the order of the session they last took part in */
const gridQ=r=>{const seen=new Set(),o=[];for(let i=2;i>=0;i--)(r.q[i]||[]).forEach(x=>{if(!seen.has(x.did)){seen.add(x.did);o.push(x)}});return o};
const lastQ=r=>{const q=r.q.filter(a=>a.length);return q.length?q[q.length-1]:[]};
const opt=(a,sel)=>a.map(([v,t])=>`<option value="${esc(v)}" ${v==sel?'selected':''}>${esc(t)}</option>`).join('');
const chips=a=>`<div class=ch>${a.map(([t,h,on])=>`<a href="${h}" class="${on?'on':''}">${t}</a>`).join('')}</div>`;
const tbl=(h,rows,fit,vis)=>`<div class="sc${vis&&rows.length>vis?' sv':''}"${fit?` data-fit="${fit}"`:''}${vis&&rows.length>vis?` data-vis="${vis}"`:''}><table><tr>${h.map(x=>`<th>${x}</th>`).join('')}</tr>${rows.map(r=>`<tr>${r.map(x=>`<td>${x}</td>`).join('')}</tr>`).join('')}</table></div>`;
const hx=v=>{v=(v||'').trim().replace(/^#/,'');if(/^[0-9a-f]{3}$/i.test(v))v=v.split('').map(c=>c+c).join('');return /^[0-9a-f]{6}$/i.test(v)?'#'+v.toLowerCase():''};
const colorField=(id,label,val)=>`<label>${label}</label><div class=cp><input id=${id} type=color value="${val}" oninput="$('#${id}_h').value=this.value"><input id=${id}_h value="${val}" placeholder="#E10600" maxlength=7 oninput="const c=hx(this.value);if(c)$('#${id}').value=c"></div>`;
const colorVal=id=>hx(($('#'+id+'_h')||{value:''}).value);
const normWA=v=>{let s=(v||'').trim();const pl=s.startsWith('+');s=s.replace(/\D/g,'');if(!s)return'';if(pl)s='+'+s;else if(s.startsWith('00'))s='+'+s.slice(2);else if(s.startsWith('0'))s='+62'+s.slice(1);else if(s.startsWith('62'))s='+'+s;else s='+62'+s;const n=s.replace(/\D/g,'').length;return n>=8&&n<=15?s:''};
const waLink=n=>n?`<a href="https://wa.me/${n.replace(/\D/g,'')}" target=_blank rel=noopener style="text-decoration:underline">${esc(n)}</a>`:'-';
const sUrl=u=>{u=String(u||'').trim();return /^https?:\/\//i.test(u)?u:(/^[a-z][a-z0-9+.-]*:/i.test(u)?'#':'https://'+u)};
const szv=(z,k,d)=>{const v=+(z||{})[k];return v>=20&&v<=120?v:d};
function hdrBar(o){const z=o.sz,hl=szv(z,'league',44),hf=szv(z,'fed',44),hs=szv(z,'sp',44),sep=o.sep=='x'?'<span class=hsx>&times;</span>':'<span class=hdv></span>';
if(o.home)o={logo:o.logo,sz:z,home:1};
return`<div class=hd><div class=hlf><a class=hlo href="#/">${o.logo?`<img class=hlg style="height:${hl}px" src="${esc(o.logo)}" alt="">`:'<div class=br>fRacing <b>LEGENDS</b></div>'}</a>${o.sp?`${sep}<img class=hsp2 style="height:${hs}px" src="${esc(o.sp)}" alt="">`:''}</div><div class=hrt>${o.fed?`<img class=hfd style="height:${hf}px" src="${esc(o.fed)}" alt=""><span class=hdv></span>`:''}<button type=button id=hmb class=hmb aria-label="Menu" onclick="toggleMenu()"><i></i><i></i><i></i></button></div></div>`}
let LASTK='';const pgKey=()=>location.hash+'|'+(typeof at!=='undefined'?at:'');
function pgAnim(force){const a=$('#app');if(!a)return;const k=pgKey(),n=force||k!==LASTK;LASTK=k;a.classList.remove('pg','pf');if(!n)return;void a.offsetWidth;a.classList.add(n?'pg':'pf')}
function hdrHtml(T,bk,sp,sl){const c=S.cfg||{},L=(c.pt||[]),mi=(i,t,b)=>`<div class=mi style="--i:${i}"><button type=button class=mh onclick="mnAcc(this)"><span>${t}</span><i class=cv></i></button><div class=mb><div><div class=mc>${b}</div></div></div></div>`,
lk=a=>a&&a.length?`<div class=lks>${a.map(x=>`<a href="${esc(sUrl(x.u))}" target=_blank rel=noopener><span>${esc(x.n)}</span><b>&#8599;</b></a>`).join('')}</div>`:'<p class=m>Coming soon.</p>',
pg=L.length?`<div class=pgr>${L.map(x=>x.u?`<a href="${esc(sUrl(x.u))}" target=_blank rel=noopener title="${esc(x.n||'')}"><img src="${esc(x.l)}" alt="${esc(x.n||'')}"></a>`:`<span title="${esc(x.n||'')}"><img src="${esc(x.l)}" alt="${esc(x.n||'')}"></span>`).join('')}</div>`:'<p class=m>Coming soon.</p>';
const ev=TEV,zz=c.sz||{},hb=ev?hdrBar({logo:ev.elogo||c.logo,fed:c.fed,sp:ev.slogo||sl,sz:{league:+ev.esz||zz.league,fed:zz.fed,sp:+ev.ssz||zz.sp},sep:c.sep}):hdrBar({home:1,logo:c.logo,sz:{league:zz.league}});
return hb+(T?`<div class=hsb>${bk?`<a class=bk href="${bk}">&larr;</a>`:''}<div class=hst>${sp?`<small class=hsp>${esc(sp)}</small>`:''}<h1>${esc(T)}</h1></div></div>`:'')+`<div class=mn id=mn onclick="if(event.target===this)toggleMenu()"><div class=mw>${mi(1,'Our Partners',pg)}${mi(2,'Visit Our Social Media',lk(c.social))}${mi(3,'Join Our Community',lk(c.comm))}</div></div>`}
function toggleMenu(){const m=$('#mn'),b=$('#hmb');if(!m)return;const o=!m.classList.contains('open');m.classList.toggle('open',o);if(b)b.classList.toggle('open',o);document.body.style.overflow=o?'hidden':''}
function mnAcc(b){const i=b.parentNode,o=i.classList.contains('open');i.parentNode.querySelectorAll('.mi.open').forEach(x=>x.classList.remove('open'));if(!o)i.classList.add('open')}
function mount(T,bk,tabs,body,A){const sp=TSP,sl=TSL;TSP='';TSL='';document.body.style.overflow='';try{EXP.sp=sp}catch(_){}A=A||'#e10600';const r=document.documentElement.style;r.setProperty('--a',A);r.setProperty('--ac',contrast(A));
if(ADMIN){$('#tb').className='tb';$('#tb').innerHTML=(bk?`<a class=bk href="${bk}">&larr;</a>`:'')+(T?`<h1>${sp?`<small class=hsp>${esc(sp)}</small>`:''}${esc(T)}</h1>`:'<div class=br>fRacing <b>LEGENDS</b></div>')}else{$('#tb').className='tb2';$('#tb').innerHTML=hdrHtml(T,bk,sp,sl);TEV=null}
$('#bar').innerHTML=tabs?tabs.map(([n,h,on])=>`<a href="${h}" class="${on?'on':''}">${n}</a>`).join(''):'';$('#bar').style.display=tabs?'flex':'none';$('#app').innerHTML=body;pgAnim();requestAnimationFrame(fitTables)}
/* zoom wide tables out so everything fits on screen (data-fit = smallest allowed zoom) */
function fitTables(){document.querySelectorAll('.sc[data-fit]').forEach(sc=>{const t=sc.querySelector('table');if(!t)return;t.style.zoom='';t.style.width='';sc.classList.add('fit');t.style.width='max-content';const nat=t.offsetWidth,av=sc.clientWidth,mn=parseFloat(sc.dataset.fit)||.3;let z=av>0&&nat>0?Math.min(1,av/nat):1;if(z<mn)z=mn;if(z<1){t.style.zoom=z}else{t.style.zoom='';t.style.width=''}
const vis=parseInt(sc.dataset.vis)||0;sc.style.maxHeight='';if(vis&&t.rows.length>vis+1){const st=sc.scrollTop;sc.scrollTop=0;const nx=t.rows[vis+1];sc.style.maxHeight=Math.ceil(nx.getBoundingClientRect().top-sc.getBoundingClientRect().top)+'px';sc.scrollTop=st}})}
addEventListener('resize',fitTables);if(document.fonts&&document.fonts.ready)document.fonts.ready.then(fitTables);
/* tyre colours: Soft red, Medium yellow, Hard white, Inter green, Wet blue */
const TYC={Soft:'#e10600',Medium:'#ffd100',Hard:'#f2f2f2',Inter:'#1fb84a',Wet:'#1f78ff'};
const tyDot=(t,sz)=>{if(!t)return'';sz=sz||22;return`<span class=td style="--tc:${TYC[t]||'#888'};width:${sz}px;height:${sz}px;font-size:${Math.round(sz*.56)}px;color:${t=='Hard'?'#111':'#fff'}">${esc(t[0])}</span>`};
const tyLogo=(t,sz)=>{sz=sz||16;const c=TYC[t]||'#888';return`<svg class=tl width="${sz}" height="${sz}" viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#0e0f14" stroke="#3a3f4f" stroke-width="1"/><circle cx="12" cy="12" r="7.6" fill="none" stroke="${c}" stroke-width="3.4"/><circle cx="12" cy="12" r="3.6" fill="#2b2e3a"/></svg>`};
const tyFull=t=>`<span class=tf>${tyLogo(t)}${esc(t)}</span>`;
/* in-page tab links replace history so Back never "undoes" a tab tap */
document.addEventListener('click',e=>{const a=e.target.closest&&e.target.closest('a[href^="#"]');if(a){e.preventDefault();location.replace(a.getAttribute('href'))}});
const Z=()=>({r:0,po:0,w:0,pd:0,dr:0,gp:0,sp:0,sw:0,dnf:0,dsq:0,dns:0,fl:0,p:0,t:0});
const addAll=(a,b,noT)=>{Object.keys(a).forEach(k=>{if(!(noT&&k=='t'))a[k]+=b[k]||0})};
/* points system per event (Manager > Events > Points system); default = F1 style */
const ptsE=e=>{const o=e.pts||{},ok=a=>Array.isArray(a)&&a.length;return{fe:ok(o.fe)?o.fe:PF,sp:ok(o.sp)?o.sp:PS,pole:+o.pole||0,fl:+o.fl||0,flTop:+o.flTop||0,dr:+o.dr||0}};
const ptsTxt=e=>{const t=ptsE(e),b=[];if(t.pole)b.push('Pole +'+t.pole);if(t.fl)b.push('Fastest Lap +'+t.fl+(t.flTop?' (top '+t.flTop+')':''));if(t.dr)b.push('Driver of the Race +'+t.dr);return'Race: '+t.fe.join('-')+' | Sprint: '+t.sp.join('-')+(b.length?' | Bonus: '+b.join(', '):'')};
function stats(e,only,sf){const PT=ptsE(e);const m={},g=d=>m[d]=m[d]||Z();evD(e).forEach(g);
(only||S.rc.filter(r=>r.ev==e.id)).forEach(r=>{const q=gridQ(r),seen=new Set(),inFe=new Set(r.fe.map(x=>x.did));if(q[0]&&(!sf||sf=='q'+lastQi(r))){g(q[0].did).po++;g(q[0].did).p+=PT.pole}
[['sp',PT.sp],['fe',PT.fe]].forEach(([k,P])=>{if(sf&&sf!=k)return;r[k].forEach((x,i)=>{const s=g(x.did);if(!(sf&&k=='sp'&&inFe.has(x.did)))seen.add(x.did);if(k=='sp')s.sp++;
if(x.st){const f=x.st.toLowerCase();if(f in s)s[f]++}else{s.p+=P[i]||0;if(k=='fe'){if(!i)s.w++;if(i<3)s.pd++}else if(!i)s.sw++;const gi=q.findIndex(y=>y.did==x.did)+1;if(gi)s.gp+=gi-(i+1)}});
if(r.fl[k]){const d=r.fl[k],f=g(d);f.fl++;const fi=r[k].findIndex(x=>x.did==d);if(PT.fl&&fi>=0&&!r[k][fi].st&&(!PT.flTop||fi<PT.flTop))f.p+=PT.fl}if(r.dr[k]){g(r.dr[k]).dr++;g(r.dr[k]).p+=PT.dr}});seen.forEach(d=>g(d).r++)});
if(e.done&&!only){const t=Object.keys(m).sort((a,b)=>m[b].p-m[a].p||m[b].w-m[a].w)[0];if(t&&m[t].p>0)m[t].t=1}return m}
/* team of a driver in one round (set per round in Manager), else the registered team */
/* team of a driver in one session of one round: session setting, else round setting, else the registered team */
const tmR=(e,d,r,ses)=>{const id=(r&&ses&&r.ts&&r.ts[ses]&&r.ts[ses][d])||(r&&r.tm&&r.tm[d]),t=id&&evT(e).find(x=>x.id==id);return t||tmO(e,d)};
const tcR=(e,d,r,ses)=>txD(tmR(e,d,r,ses),d),noR=(e,d,r,ses)=>(tmR(e,d,r,ses).num||{})[d]||noOf(e,d);
/* latest team a driver raced for (shown in driver standings) */
const drvTm=(e,d)=>{const rs=S.rc.filter(r=>r.ev==e.id);for(let i=rs.length-1;i>=0;i--){const r=rs[i];for(const k of ['fe','sp','q2','q1','q0']){if((k[0]=='q'?r.q[+k[1]]:r[k]).some(x=>x.did==d))return tmR(e,d,r,k)}}return tmO(e,d)};
function dItems(e,only){const m=stats(e,only);return Object.keys(m).map(d=>{const t=drvTm(e,d);return{k:d,n:dn(d),t:t.name||'-',c:t.col||'#8b93a7',c2:t.col2||'',tx:txD(t,d),tt:txT(t),v:m[d]}})}
function tItems(e,only){const m=stats(e,only),o={};evT(e).forEach(t=>o[t.id]={n:t.name,t:'',c:t.col||'#8b93a7',c2:t.col2||'',tx:txT(t),v:Z()});
(only||S.rc.filter(r=>r.ev==e.id)).forEach(r=>{['q'+lastQi(r),'sp','fe'].forEach(k=>{const mr=stats(e,[r],k);Object.keys(mr).forEach(d=>{const t=tmR(e,d,r,k);if(t.id&&o[t.id])addAll(o[t.id].v,mr[d],1)})})});
if(e.done){const top=Object.values(o).sort((a,b)=>b.v.p-a.v.p||b.v.w-a.v.w)[0];if(top&&top.v.p>0)top.v.t=1}return Object.values(o)}
/* Legends Point (LP) system */
const CAT=['Open Wheel','GT Racing','Prototype Racing','Touring Car Racing','Cup Racing','Production Car Racing','Stock Car Racing','Rally','Rally-Raid','Rallycross','Off-Road Racing','Drag Racing','Drifting','Karting','Electric Racing','Endurance Racing','Hill Climb','Time Attack','Autocross','Truck Racing','Historic Racing'];
const CATOLD={F1:'Open Wheel',F3:'Open Wheel',GT3:'GT Racing',GT4:'GT Racing','MX-5':'Cup Racing',GR86:'Cup Racing'},catOf=e=>CAT.includes(e.cat)?e.cat:(CATOLD[e.cat]||CAT[0]);
const catM=e=>{const v=parseFloat(((S.cm||{})[e.cls]));return v>=0?v:1};
const LCL=[['Rookie'],['D'],['C'],['B'],['A'],['Pro']],LCD={D:100,C:200,B:250,A:300,Pro:450},ltOf=n=>{const v=parseFloat((S.lt||{})[n]);return v>0?v:LCD[n]},lcOf=lp=>{let c='Rookie';LCL.slice(1).forEach(([n])=>{if(lp>=ltOf(n))c=n});return c};
function lpBoard(){const d={};S.ev.forEach(e=>{const m=catM(e);dItems(e).forEach(x=>{const a=d[x.k]=d[x.k]||{k:x.k,n:x.n,t:'-',c:x.c,c2:x.c2,tx:x.tx,tt:x.tt,v:Z(),lpm:0};addAll(a.v,x.v);a.lpm+=(x.v.pd*10+x.v.w*20)*m;if(x.t!='-'){a.t=x.t;a.c=x.c;a.c2=x.c2;a.tx=x.tx;a.tt=x.tt}})});
return Object.values(d).map(a=>(a.lp=Math.round(a.lpm*10)/10,a.cls=lcOf(a.lp),a.wr=a.v.r>0?Math.round(a.v.w/a.v.r*10000)/100:0,a)).sort((a,b)=>b.lp-a.lp||b.v.w-a.v.w||b.v.pd-a.v.pd||a.n.localeCompare(b.n))}
function board(){const d={},t={};S.ev.forEach(e=>{dItems(e).forEach(x=>{const a=d[x.k]=d[x.k]||{n:x.n,t:'-',c:x.c,c2:x.c2,tx:x.tx,tt:x.tt,v:Z(),ev:0};addAll(a.v,x.v);a.ev++;if(x.t!='-'){a.t=x.t;a.c=x.c;a.c2=x.c2;a.tx=x.tx;a.tt=x.tt}});
tItems(e).forEach(x=>{const k=x.n.toLowerCase(),a=t[k]=t[k]||{n:x.n,t:'',c:x.c,c2:x.c2,tx:x.tx,v:Z()};addAll(a.v,x.v);a.c=x.c;a.c2=x.c2;a.tx=x.tx})});return{d:Object.values(d),t:Object.values(t)}}
function hub(){const B=board(),by=(a,b)=>b.v.p-a.v.p;return{t:Date.now(),teams:B.t.sort(by).map(x=>({name:x.n,col:x.c,col2:x.c2,pts:x.v.p})),drivers:B.d.sort(by).map(x=>({name:x.n,team:x.t,col:x.c,col2:x.c2,pts:x.v.p}))}}
function chkLic(n,d,w){n=n.trim().replace(/\s+/g,' ');d=d.trim();const k=n.split(' ').length,wa=normWA(w);
if(!n||k<2||k>3)return{err:'Name must be 2 to 3 words.'};if(!/^\d{4}$/.test(d))return{err:'DID must be exactly 4 digits.'};if(S.dr.some(x=>x.did==d))return{err:'This DID is already taken.'};
if(!wa)return{err:'Enter a valid WhatsApp number (e.g. 0812-3456-7890 or +62 812 3456 7890).'};return{item:{did:d,name:n,wa}}}
function addLic(n,d,w){const c=chkLic(n,d,w);if(c.err)return c.err;S.dr.push(c.item);save();return''}
async function sendReg(kind,item){try{const r=await fetch('/api/register',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({kind,item})});const j=await r.json().catch(()=>({}));if(r.ok)return'';return j.err||'Could not send. Try again.'}catch(e){return'No connection. Try again.'}}
async function addLicP(n,d,w){await READY;const c=chkLic(n,d,w);if(c.err)return c.err;
if(SYNC!='cloud'){S.dr.push(c.item);save();return''}const e=await sendReg('driver',c.item);await load();return e}
let TF=null;
function teamForm(e,t){TF={e,t:t||null,prev:{},dflt:{}};const x=t||{},V=k=>esc(x[k]||'');
return`<div class=f><label>Team name</label><input id=tn value="${V('name')}">${e.soc?`<label>Team social account</label><input id=ts value="${V('soc')}">`:''}<label>Team Principal name</label><input id=tp value="${V('tp')}"><label>Team Principal WhatsApp</label><input id=tpw inputmode=tel placeholder="0812-3456-7890" value="${V('tpw')}"><label>Team Owner name</label><input id=ow value="${V('ow')}"><label>Team Owner WhatsApp</label><input id=oww inputmode=tel placeholder="0812-3456-7890" value="${V('oww')}">${colorField('tcl','Main Color',x.col||'#e10600')}${colorField('tcl2','Second Color',x.col2||'#ffffff')}${ADMIN?colorField('ttx','Team & driver text color',x.tx||x.col||'#e10600'):''}${SL.map(([id,l])=>`<label>${l}${id[0]=='r'?' (optional)':''}</label><div class=pk><input id=q_${id} placeholder="Search name or DID" oninput=pfAll()><div class=sg id=sg_${id}></div><select id=${id} onchange=pfAll()></select><input id=n_${id} inputmode=numeric maxlength=2 placeholder="Race number (1-99) - required" hidden></div>`).join('')}</div>`}
function pickD(id,did){$('#'+id).value=did;$('#q_'+id).value='';pfAll()}
function pfAll(init){const e=TF.e,cur={};SL.forEach(([id],i)=>{const s=$('#'+id);cur[id]=init?((TF.t&&TF.t.d[i])||''):(s?s.value:'')});
const taken=new Set(S.tm.filter(t=>t.ev==e.id&&(!TF.t||t.id!=TF.t.id)).flatMap(t=>t.d.slice(0,2)));
SL.forEach(([id])=>{const q=($('#q_'+id).value||'').trim().toLowerCase(),used=new Set(SL.filter(([k])=>k!=id).map(([k])=>cur[k]).filter(Boolean));
const L=S.dr.filter(d=>d.did==cur[id]||(!taken.has(d.did)&&!used.has(d.did)&&(!q||d.name.toLowerCase().includes(q)||d.did.includes(q))));
if(!cur[id]&&/^\d{4}$/.test(q)&&L.length==1)cur[id]=L[0].did;
$('#'+id).innerHTML=opt([['','Select driver']].concat(L.map(d=>[d.did,nmLabel(d)])),cur[id]);
const sg=$('#sg_'+id);if(sg)sg.innerHTML=(q&&!cur[id])?(L.length?L.slice(0,6).map(d=>`<button type=button class=sgb onclick="pickD('${id}','${d.did}')">${esc(nmLabel(d))}${ADMIN?' <span class=m>'+d.did+'</span>':''}</button>`).join(''):'<span class=m>No driver found</span>'):'';
const n=$('#n_'+id);n.hidden=!cur[id];if(TF.prev[id]!==cur[id]){n.value=(init&&cur[id]&&TF.t&&TF.t.num&&TF.t.num[cur[id]])||'';TF.prev[id]=cur[id]}})}
function saveTeam(admin){const e=TF.e,old=TF.t,v=i=>($('#'+i)||{value:''}).value.trim(),d=SL.map(([id])=>$('#'+id).value),num={},er=m=>{say(m);return false};
if(!v('tn')||!v('tp')||!v('ow'))return er('Fill in team name, Team Principal and Team Owner.');
const w1=normWA(v('tpw')),w2=normWA(v('oww'));if(!w1||!w2)return er('Enter valid WhatsApp numbers for Team Principal and Team Owner.');
const c1=colorVal('tcl'),c2=colorVal('tcl2');if(!c1||!c2)return er('Enter valid hex colors, e.g. #E10600.');
let tx='';if(admin){tx=colorVal('ttx');if(!tx)return er('Enter a valid team text color, e.g. #FFFFFF.');if(tx===c1)tx=''}
if(!d[0]||!d[1])return er('Driver 1 and Driver 2 are required.');
const f=d.filter(Boolean);if(new Set(f).size<f.length)return er('A driver cannot be selected twice.');
const others=S.tm.filter(t=>t.ev==e.id&&(!old||t.id!=old.id));
if(f.some(x=>others.some(t=>t.d.slice(0,2).includes(x))))return er('Some drivers are already a regular driver in another team.');
if(others.some(t=>t.name.toLowerCase()==v('tn').toLowerCase()))return er('Team name is already taken.');
const usedBy=(dd)=>new Set(others.flatMap(t=>Object.entries(t.num||{}).filter(([k])=>k!=dd).map(([k,v])=>v)));const mine=new Set();
for(const [id,l] of SL){const dd=$('#'+id).value,val=$('#n_'+id).value.trim();if(!dd)continue;
if(!/^\d{1,2}$/.test(val)||+val<1)return er('Race number (1-99) is required for '+l+'.');if(usedBy(dd).has(String(+val))||mine.has(String(+val)))return er('Race number '+(+val)+' is already taken.');mine.add(String(+val));num[dd]=String(+val)}
if(!admin){if(!isOpen(e))return er('Registration is closed.');if(!old&&isFull(e))return er('Team slots are full.')}
const o={id:old?old.id:uid(),ev:e.id,name:v('tn'),soc:v('ts'),tp:v('tp'),tpw:w1,ow:v('ow'),oww:w2,col:c1,col2:c2,d,num};if(admin){o.tx=tx;delete o.dtx;if(old)delete old.dtx}
if(!admin&&!old&&SYNC=='cloud')return sendReg('team',o).then(async m=>{await load();if(m){say(m);return false}return true});
if(old)Object.assign(old,o);else S.tm.push(o);save();return true}

/* tyre stock: 1 tyre per calendar race, set separately for Qualifying (q) and Race (r) */
const TC=['Soft','Medium','Hard'];
const calN=e=>+e.cal||10;
const defAl=n=>{const h=Math.floor(n/3);return{Soft:n-2*h,Medium:h,Hard:h}};
const alloc=e=>({q:e.tq||defAl(calN(e)),r:e.tr||defAl(calN(e))});
const extra=(e,d,k,c)=>((((e.ty||{})[d]||{})[k]||{})[c])||0;
const tyHid=(e,d)=>!!((e.th||{})[d]);
const tyLim=(e,k,c)=>alloc(e)[k][c]||0;
const tyTot=(e,d,k,c)=>tyLim(e,k,c)+extra(e,d,k,c);
const qMode=(e,r)=>r.qm||e.qm||'one';
function tyUsed(e,d){const u={q:{Soft:0,Medium:0,Hard:0},r:{Soft:0,Medium:0,Hard:0}};
S.rc.filter(r=>r.ev==e.id).forEach(r=>{const f=r.fe.find(x=>x.did==d);if(f&&f.tyre in u.r)u.r[f.tyre]++;
const ts=r.q.map(s=>s.find(x=>x.did==d)).filter(Boolean).map(x=>x.tyre).filter(t=>t in u.q);
if(qMode(e,r)=='each')ts.forEach(t=>u.q[t]++);else if(ts.length)u.q[ts[ts.length-1]]++});return u}
const RSL=4,rsSlot=(e,x,r,s)=>{const tid=x.rt||tmR(e,x.did,r,s).id||'',t=evT(e).find(z=>z.id==tid)||{},d=t.d||[],n=+x.rn||(d[2]==x.did?1:d[3]==x.did?2:0);return tid+'|'+(n||'u'+x.did)},
rsKeys=(e,r,skip)=>{const k=new Set();['sp','fe'].forEach(s=>{if(skip&&skip==s)return;(r[s]||[]).forEach(x=>{if(x.rs&&x.did)k.add(rsSlot(e,x,r,s))})});return k},
rsCount=(e,skipRid)=>{const c={};S.rc.filter(r=>r.ev==e.id&&r.id!=skipRid).forEach(r=>rsKeys(e,r).forEach(k=>c[k]=(c[k]||0)+1));return c};
function tyCheck(e,dids,k){for(const d of dids){const u=tyUsed(e,d);for(const c of TC)if(u[k][c]>tyTot(e,d,k,c))return dn(d)+' has no '+c+' tyres left for '+(k=='q'?'Qualifying':'Race')+'. Add supply in the Tyres tab.'}return''}

/* FLIP move animation, driven frame by frame: items slide from the old spot to the new one,
   the moved item is lifted and highlighted, and the screen follows the moved item.
   o.map(newIndex)->oldIndex (optional), o.key (data-fk of the moved item) or o.idx (its new index) */
function flipMove(sel,fn,o){o=o||{};const de=document.documentElement,app=document.getElementById('app'),y0=scrollY,h0=app?app.offsetHeight:0;
const els=[...document.querySelectorAll(sel)],tops=els.map(e=>e.getBoundingClientRect().top+y0),ks=els.map(e=>e.dataset.fk);
de.style.scrollBehavior='auto';if(app)app.style.minHeight=h0+'px';
fn();
scrollTo(0,y0);
const nw=[...document.querySelectorAll(sel)];let mv=null,mdy=0;const mov=[];
nw.forEach((e,i)=>{const oi=o.map?o.map(i):ks.indexOf(e.dataset.fk);if(oi==null||oi<0||oi>=tops.length)return;const isM=o.key!=null?e.dataset.fk===o.key:i===o.idx;const dy=tops[oi]-(e.getBoundingClientRect().top+y0);if(isM){mv=e;mdy=dy}if(Math.abs(dy)>=1)mov.push([e,dy,isM])});
const fin=()=>{de.style.scrollBehavior='';if(app)app.style.minHeight='';mov.forEach(([e])=>{e.style.transform='';e.style.position='';e.style.zIndex='';e.style.willChange=''})};
if(!mv){fin();return}
mv.classList.remove('mvd');void mv.offsetWidth;mv.classList.add('mvd');
const vis=mv.getBoundingClientRect(),want=mdy!==0&&vis.top+mdy>=60&&vis.top+mdy<innerHeight-vis.height-20;
/* the moved item starts where it was; the page scrolls by the same distance it travels so it stays put on screen */
const maxS=Math.max(0,de.scrollHeight-innerHeight),target=Math.min(maxS,Math.max(0,y0-mdy)),
sd=(want||true)?target-y0:0;
if(!mov.length){fin();return}
mov.forEach(([e,dy,isM])=>{e.style.position='relative';e.style.zIndex=isM?3:1;e.style.willChange='transform';e.style.transform='translateY('+dy+'px)'});
const D=Math.min(900,420+Math.abs(mdy)*.35),t0=performance.now(),ease=t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;
(function step(now){const t=Math.min(1,(now-t0)/D),k=ease(t);mov.forEach(([e,dy])=>{e.style.transform='translateY('+(dy*(1-k)).toFixed(2)+'px)'});scrollTo(0,y0+sd*k);if(t<1)requestAnimationFrame(step);else fin()})(t0);
}
