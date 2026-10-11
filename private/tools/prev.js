/* Saves a small preview of the poster canvas so the Tools menu can show the latest result. */
(function(){
  var id=location.pathname.split('/').slice(-2)[0],K='f1c-prev:'+id,t,dirty=false;
  function cv(){return document.getElementById('cv')||document.getElementById('c')||document.querySelector('canvas')}
  function snap(){
    if(!dirty)return;
    try{
      var c=cv();if(!c||!c.width||!c.height)return;
      var w=420,h=Math.round(w*c.height/c.width),s=document.createElement('canvas');
      s.width=w;s.height=h;var x=s.getContext('2d');x.fillStyle='#000';x.fillRect(0,0,w,h);x.drawImage(c,0,0,w,h);
      localStorage.setItem(K,s.toDataURL('image/jpeg',.72));dirty=false;
    }catch(e){}
  }
  function later(){dirty=true;clearTimeout(t);t=setTimeout(snap,1500)}
  ['pointerup','change','input','keyup'].forEach(function(e){document.addEventListener(e,later,true)});
  addEventListener('pagehide',snap);
  document.addEventListener('visibilitychange',function(){if(document.hidden)snap()});
  window.__snapPrev=snap;
})();
