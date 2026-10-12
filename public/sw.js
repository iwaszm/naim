const CACHE = 'naim-core-__BUILD_ID__';
const scope = new URL(self.registration.scope);
const local = (path) => new URL(path, scope).href;
const CORE = [
  '', 'manifest.webmanifest', 'icons/naim-192.png', 'icons/naim-512.png',
  'models/face_landmarker.task',
  'vendor/mediapipe/tasks-vision/vision_wasm_internal.js',
  'vendor/mediapipe/tasks-vision/vision_wasm_internal.wasm',
  'vendor/mediapipe/tasks-vision/vision_wasm_module_internal.js',
  'vendor/mediapipe/tasks-vision/vision_wasm_module_internal.wasm',
  'vendor/mediapipe/tasks-vision/vision_wasm_nosimd_internal.js',
  'vendor/mediapipe/tasks-vision/vision_wasm_nosimd_internal.wasm',
];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    const page = await fetch(scope.href, { cache: 'no-store' });
    if (!page.ok) throw new Error('App shell unavailable');
    const html = await page.clone().text();
    const assets = [...html.matchAll(/(?:src|href)="([^"]*\/assets\/[^\"]+)"/g)]
      .map((match) => new URL(match[1], scope).href);
    await cache.put(scope.href, page);
    await cache.addAll([...CORE.slice(1).map(local), ...assets]);
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((key) => key.startsWith('naim-core-') && key !== CACHE).map((key) => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== scope.origin || !url.pathname.startsWith(scope.pathname)) return;
  const path = url.pathname.slice(scope.pathname.length);
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).catch(async () => (await caches.open(CACHE)).match(scope.href)));
    return;
  }
  if (!path.startsWith('assets/') && !path.startsWith('models/face_landmarker.task') && !path.startsWith('vendor/mediapipe/tasks-vision/')) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(request);
    if (cached) return cached;
    const response = await fetch(request);
    if (response.ok) await cache.put(request, response.clone());
    return response;
  })());
});
