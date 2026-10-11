/* Save the current table as a JPG: full table, nothing cut off, nothing wrapped */
let EXP={title:'',sub:'',note:[]};
const expBtn=()=>'<button class="bt s" onclick="saveImg()">Save as JPG</button><div id="xpick"></div>';
const expOpts=R=>{const o=[];for(let a=1;a<=R.total;a+=R.step)o.push([a,Math.min(a+R.step-1,R.total)]);return o};
const b64=b=>new Promise(r=>{const f=new FileReader();f.onload=()=>r(f.result);f.readAsDataURL(b)});
async function saveImg(rg){
  const src=document.querySelector('#app .sc');if(!src)return say('Nothing to save yet.');
  const R=EXP.rank;
  if(R&&!rg){const o=expOpts(R);if(!o.length)return say('Nothing to save yet.');
    if(o.length>1){const h=document.getElementById('xpick');if(h)h.innerHTML='<div class="xpk"><small class="m">Choose which positions to save</small>'+o.map(([a,b])=>`<button type="button" class="x" onclick="saveImg([${a},${b}])">Top ${b}${a>1?' ('+a+'-'+b+')':''}</button>`).join('')+'</div>';return}
    rg=o[0]}
  if(!R)rg=null;
  say('Preparing image...');
  try{
    let css=await (await fetch('/style.css')).text();
    const fonts=[...new Set((css.match(/url\(\/fonts\/[^)]+\)/g)||[]))];
    for(const u of fonts){const p=u.slice(4,-1),d=await b64(await (await fetch(p)).blob());css=css.split(u).join('url('+d+')')}
    const LT=document.documentElement.dataset.theme==='light',P=LT?{bg:'#f3f4f7',tx:'#14161d',mu:'#5a6275',bx:'#ffffff',bd:'#d8dce6',rgb:[243,244,247]}:{bg:'#0c0d12',tx:'#f2f4f8',mu:'#8b93a7',bx:'#14161d',bd:'#262a36',rgb:[12,13,18]};
    const host=document.createElement('div');host.id='xhost';
    host.style.cssText='position:fixed;left:-100000px;top:0;width:max-content';
    const note=(EXP.note||[]).map(([k,v])=>`<span class="xn"><small>${esc(k)}</small>${esc(v)}</span>`).join('');
    host.innerHTML=`<div xmlns="http://www.w3.org/1999/xhtml" id="xroot" data-xt="${LT?'light':'dark'}" style="display:inline-block;background:${P.bg};color:${P.tx};padding:30px 32px 22px;font-family:'MotoGP Text',Arial,sans-serif;font-size:15px;line-height:1.5;box-sizing:border-box"><div class="xh"><div class="br">fRacing <b>LEGENDS</b></div>${EXP.sp?`<div style="font-size:13px;letter-spacing:.16em;text-transform:uppercase;color:${P.mu};font-weight:700;margin-bottom:6px">${esc(EXP.sp)}</div>`:''}<div class="xt">${esc(EXP.title)}</div><div class="xs">${esc(EXP.sub||'')}</div>${note?`<div class="xnn">${note}</div>`:''}</div>${rg?`<div class="xr">Top ${rg[1]}${rg[0]>1?`<small>Positions ${rg[0]}-${rg[1]}</small>`:''}</div>`:''}<div class="xtb"></div><div class="xf">frl1championship.vercel.app</div></div>`;
    const tb=src.cloneNode(true);tb.removeAttribute('data-fit');tb.className='sc';tb.style.cssText='overflow:visible;border-radius:12px';
    tb.removeAttribute('data-vis');const t=tb.querySelector('table');t.style.cssText='width:max-content;zoom:1';
    if(rg)[...t.rows].slice(1).forEach((r,i)=>{if(i+1<rg[0]||i+1>rg[1])r.remove()});
    for(const im of tb.querySelectorAll('img')){const x=await (await fetch(im.getAttribute('src'))).text();im.setAttribute('src','data:image/svg+xml;charset=utf-8,'+encodeURIComponent(x))}
    host.querySelector('.xtb').replaceWith(tb);
    document.body.appendChild(host);
    const root=host.querySelector('#xroot');
    await (document.fonts&&document.fonts.ready);
    await Promise.all([...tb.querySelectorAll('img')].map(im=>im.decode?im.decode().catch(()=>{}):0));
    const W=Math.ceil(Math.max(root.scrollWidth,t.offsetWidth+64,420)),H=Math.ceil(root.getBoundingClientRect().height);
    root.style.width=W+'px';t.style.width='100%';
    const H2=Math.ceil(root.getBoundingClientRect().height);
    const xml=new XMLSerializer().serializeToString(root);
    document.body.removeChild(host);
    const extra=`.xh{margin-bottom:18px}.xh .br{font-family:var(--f-title);font-size:16px;letter-spacing:.04em}.xt{font-family:var(--f-title);font-size:26px;margin-top:6px;line-height:1.2}.xs{font-family:var(--f-ui);font-weight:700;color:#e10600;letter-spacing:.08em;text-transform:uppercase;font-size:13px;margin-top:2px}.xnn{display:flex;gap:10px;flex-wrap:wrap;margin-top:12px}.xn{background:${P.bx};border:1px solid ${P.bd};border-radius:10px;padding:8px 12px;font-size:14px}.xn small{display:block;font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:${P.mu};font-weight:700}.xr{display:flex;align-items:baseline;gap:12px;margin:0 0 12px;padding-left:10px;border-left:4px solid #e10600;font-family:var(--f-title);font-size:24px;letter-spacing:.04em;text-transform:uppercase}.xr small{font-family:var(--f-ui);font-weight:700;font-size:13px;color:${P.mu};letter-spacing:.1em}.xf{margin-top:14px;color:${P.mu};font-size:12px;text-align:right}#xroot[data-xt=light]{--bg:#f3f4f7;--s1:#ffffff;--s2:#eceef3;--ln:#d8dce6;--t:#14161d;--m:#5a6275}#xroot[data-xt=light] .sc{--t:#f2f4f8;--m:#a4acbd;--s1:#0c0d12;--s2:#171a22;--ln:#2a2e3a;color:var(--t);border-color:#2a2e3a;background:linear-gradient(135deg,#000 0%,#ffffff33 33%,#000 66%,#ffffff33 100%),#0c0d12}`;
    const HB=H2+Math.max(300,Math.ceil(H2*.35));/* spare room: the final height is cropped to the real content below */
    const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${HB}"><foreignObject x="0" y="0" width="${W}" height="${HB}"><style><![CDATA[${css}\n${extra}]]></style>${xml}</foreignObject></svg>`;
    const img=new Image();
    await new Promise((ok,no)=>{img.onload=ok;img.onerror=no;img.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg)});
    let k=2;while(W*k*HB*k>36e6&&k>1)k-=.25;
    const cv=document.createElement('canvas');cv.width=Math.round(W*k);cv.height=Math.round(HB*k);const cx=cv.getContext('2d',{willReadFrequently:true});cx.fillStyle=P.bg;cx.fillRect(0,0,cv.width,cv.height);cx.scale(k,k);cx.drawImage(img,0,0,W,HB);
    /* find the last row that has anything drawn on it, so the image is exactly as tall as the content (never cut, no empty space) */
    let last=0;{const ch=120;for(let y=cv.height;y>0&&!last;y-=ch){const y0=Math.max(0,y-ch),d=cx.getImageData(0,y0,cv.width,y-y0).data;for(let r=y-y0-1;r>=0&&!last;r--){const o=r*cv.width*4;for(let x=0;x<cv.width*4;x+=4){if(Math.abs(d[o+x]-P.rgb[0])>10||Math.abs(d[o+x+1]-P.rgb[1])>10||Math.abs(d[o+x+2]-P.rgb[2])>10){last=y0+r+1;break}}}}}
    const outH=last?Math.min(cv.height,last+Math.round(22*k)):Math.min(cv.height,Math.round(H2*k));
    const out=document.createElement('canvas');out.width=cv.width;out.height=outH;const ox=out.getContext('2d');ox.fillStyle=P.bg;ox.fillRect(0,0,out.width,out.height);ox.drawImage(cv,0,0);
    const blob=await new Promise(r=>out.toBlob(r,'image/jpeg',.93));
    const a=document.createElement('a'),nm=((EXP.title||'table')+' '+(EXP.sub||'')+(rg?' top '+rg[1]:'')).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
    a.href=URL.createObjectURL(blob);a.download=nm+'.jpg';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),4000);
    say('Image saved as '+nm+'.jpg');
  }catch(e){const h=document.getElementById('xhost');if(h)h.remove();say('Could not create the image on this browser. Try Chrome.')}
}
