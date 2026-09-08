(() => {
  const VERSION='6.1.9';
  const loadSync=(src)=>{ if(document.readyState==='loading') document.write(`<script src="${src}?v=${VERSION}"><\/script>`); else { const s=document.createElement('script'); s.src=`${src}?v=${VERSION}`; s.async=false; document.head.append(s); } };
  const ensure=(src,token)=>{ if(document.querySelector(`script[src*="${token}"]`)) return; const s=document.createElement('script'); s.src=`${src}?v=${VERSION}`; s.async=false; document.head.append(s); };

  // Safari-first compatibility bootstrap. Keep only proven runtime helpers here while
  // older PWA registrations are retired and remaining legacy behavior is moved into source.
  loadSync('p64-v612-camera-guard.js');
  loadSync('p64-v525-core.js');

  const syncVersion=()=>document.querySelectorAll('.version-badge').forEach(el=>{el.textContent=`Version ${VERSION}`});

  async function retirePwaLayer(){
    try {
      if(!('serviceWorker' in navigator)) return;
      const hadController=Boolean(navigator.serviceWorker.controller);
      const regs=await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map(r=>r.unregister()));
      if('caches' in window){
        const keys=await caches.keys();
        await Promise.all(keys.filter(k=>!k.startsWith('pocket64-private-photos-v2')).map(k=>caches.delete(k)));
      }
      if(hadController && !sessionStorage.getItem('p64-safari-clean-reload')){
        sessionStorage.setItem('p64-safari-clean-reload','1');
        setTimeout(()=>location.reload(),80);
      }
    } catch(error){ console.warn('Pocket 64 Safari cleanup could not retire old PWA state',error); }
  }

  function finishBoot(){
    setTimeout(()=>{
      ensure('p64-v531-viewer.js','p64-v531-viewer.js');
      ensure('p64-v538-set-flow.js','p64-v538-set-flow.js');
      if(!document.documentElement.dataset.p64SetUiVersion) ensure('p64-v609-set-ui.js','p64-v609-set-ui.js');
      syncVersion();
      retirePwaLayer();
      setTimeout(syncVersion,250);
      setTimeout(syncVersion,900);
    },0);
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',finishBoot,{once:true}); else finishBoot();
})();
