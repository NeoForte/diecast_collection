(() => {
  const VERSION='6.2.0';
  const loadSync=(src)=>{ if(document.readyState==='loading') document.write(`<script src="${src}?v=${VERSION}"><\/script>`); else { const s=document.createElement('script'); s.src=`${src}?v=${VERSION}`; s.async=false; document.head.append(s); } };
  const ensure=(src,token)=>{ if(document.querySelector(`script[src*="${token}"]`)) return; const s=document.createElement('script'); s.src=`${src}?v=${VERSION}`; s.async=false; document.head.append(s); };

  // Transitional bootstrap for the first v6.2 hardening checkpoint.
  // Runtime behavior now lives under stable source-module names rather than
  // release-number filenames. This bootstrap remains only to preserve the
  // proven load order while we migrate behavior into app.js/app-services.
  loadSync('camera-safety.js');
  loadSync('editor-viewer-core.js');

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
      ensure('photo-viewer.js','photo-viewer.js');
      ensure('set-flow.js','set-flow.js');
      if(!document.documentElement.dataset.p64SetUiVersion) ensure('set-ui.js','set-ui.js');
      retirePwaLayer();
    },0);
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',finishBoot,{once:true}); else finishBoot();
})();
