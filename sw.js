const PRIVATE_PHOTO_CACHE_PREFIX='pocket64-private-photos-v2';
self.addEventListener('install',event=>event.waitUntil(self.skipWaiting()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{
  try{await self.registration.unregister();}catch{}
  try{
    const keys=await caches.keys();
    await Promise.all(keys.filter(key=>!key.startsWith(PRIVATE_PHOTO_CACHE_PREFIX)).map(key=>caches.delete(key)));
  }catch{}
  try{await self.clients.claim();}catch{}
})()));
// Safari-first Pocket 64 no longer uses a service worker for app delivery.
// Keep this tiny retirement worker temporarily so old PWA registrations can
// update once, unregister themselves, and stop controlling future visits.
