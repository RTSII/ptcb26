// Service worker: offline caching for the PTCE 2026 Study App
const CACHE = 'ptce-2026-v15';
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

function isJsonData(url) {
  return /\.json$/i.test(url.pathname);
}

// HTML, CSS, and JS (and other non-JSON shell files) prefer the network so a
// normal refresh shows code changes. Fall back to cache only when offline.
function isAppShell(url, request) {
  if (isJsonData(url)) return false;
  if (request.mode === 'navigate' || request.destination === 'document' ||
      request.destination === 'script' || request.destination === 'style') {
    return true;
  }
  return /\.(?:html|css|js)$/i.test(url.pathname) || url.pathname.endsWith('/');
}

function store(request, response) {
  if (!response || response.status !== 200 || response.type !== 'basic') return;
  const copy = response.clone();
  caches.open(CACHE).then((cache) => cache.put(request, copy)).catch(() => {});
}

function networkFirst(request) {
  return fetch(request).then((response) => {
    store(request, response);
    return response;
  }).catch(() => caches.match(request, { ignoreSearch: true }));
}

function cacheFirst(request) {
  return caches.match(request).then((cached) => {
    if (cached) return cached;
    return fetch(request).then((response) => {
      store(request, response);
      return response;
    });
  });
}

self.addEventListener('fetch', (e) => {
  const { request } = e;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // let CDN (fonts) go to network
  // App shell is network-first. Large JSON stays cache-first.
  e.respondWith(isAppShell(url, request) ? networkFirst(request) : cacheFirst(request));
});
