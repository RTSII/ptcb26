// Service worker: offline caching for the PTCE 2026 Study App
const CACHE = 'ptce-2026-v2';
const ASSETS = [
  './',
  'index.html',
  'course.html',
  'notes.html',
  'flashcards.html',
  'quiz.html',
  'exam.html',
  'dashboard.html',
  'css/style.css',
  'js/app.js',
  'js/course.js',
  'js/quiz.js',
  'js/exam.js',
  'js/flashcards.js',
  'js/dashboard.js',
  'js/notes.js',
  'data/course.json',
  'data/questions.json',
  'data/flashcards.json',
  'data/notes.json',
  'manifest.json',
  'icon.svg'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Cache-first for app assets; network-first fallback keeps data fresh when online.
self.addEventListener('fetch', (e) => {
  const { request } = e;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // let CDN (fonts) go to network
  e.respondWith(
    caches.match(request).then((cached) => {
      return cached || fetch(request).then((res) => {
        if (res && res.status === 200 && res.type === 'basic') {
          const copy = res.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy));
        }
        return res;
      }).catch(() => cached);
    })
  );
});
