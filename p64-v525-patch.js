(() => {
  const VERSION='6.1.5';
  const loadSync=(src)=>{ if(document.readyState==='loading') document.write(`<script src="${src}?v=${VERSION}"><\/script>`); else { const s=document.createElement('script'); s.src=`${src}?v=${VERSION}`; s.async=false; document.head.append(s); } };
  const ensure=(src,token)=>{ if(document.querySelector(`script[src*="${token}"]`)) return; const s=document.createElement('script'); s.src=`${src}?v=${VERSION}`; s.async=false; document.head.append(s); };

  // Safari-first boot: keep the proven camera guard and v5.3.3 patch active
  // without depending on the old PWA service-worker injection path.
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

  function installHelpSupport(){
    const button=document.getElementById('settings-support-button');
    const strong=button?.querySelector('strong');
    const copy=button?.querySelector('.settings-copy span');
    if(strong) strong.textContent='Help & Support';
    if(copy) copy.textContent='FAQs and contact support in one place.';
    const title=document.getElementById('settings-support-title');
    if(title) title.textContent='Help & Support';
    const modal=document.querySelector('.settings-support-modal');
    const form=document.getElementById('settings-support-form');
    if(modal && form && !document.getElementById('p64-help-faqs')){
      const faq=document.createElement('div');
      faq.id='p64-help-faqs';
      faq.style.cssText='display:grid;gap:8px;margin:12px 0 16px';
      faq.innerHTML=`
        <details><summary>How do I protect my collection?</summary><p>Use Settings → Backup & Restore and export a backup regularly.</p></details>
        <details><summary>Why is a photo not showing right away?</summary><p>Refresh once and make sure the photo finished uploading before leaving the car screen.</p></details>
        <details><summary>How do Sets work?</summary><p>Create a Set, then assign cars to it and choose their Set Position from Add/Edit.</p></details>
        <details><summary>Having sign-in trouble?</summary><p>Use Forgot Password on the sign-in screen, or send a support request below.</p></details>`;
      form.parentNode.insertBefore(faq,form);
    }
  }

  function finishBoot(){
    setTimeout(()=>{
      ensure('p64-v531-viewer.js','p64-v531-viewer.js');
      ensure('p64-v538-set-flow.js','p64-v538-set-flow.js');
      if(!document.documentElement.dataset.p64SetUiVersion) ensure('p64-v609-set-ui.js','p64-v609-set-ui.js');
      syncVersion();
      installHelpSupport();
      retirePwaLayer();
      setTimeout(syncVersion,250);
      setTimeout(syncVersion,900);
    },0);
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',finishBoot,{once:true}); else finishBoot();
})();
