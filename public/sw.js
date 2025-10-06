const CACHE_NAME = 'sla-admin-v3'; // Update version number when you make changes
const urlsToCache = [
  '/',
  '/manifest.json',
  '/fav.png'
];

// Install event
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch event - Smart caching strategy
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // Skip service worker for:
  // 1. Vite dev server files (including JS modules)
  // 2. API calls
  // 3. Non-same-origin requests
  if (
    url.pathname.includes('/@') ||           // Vite internal files
    url.pathname.includes('/node_modules') || // Node modules
    url.pathname.endsWith('.js') ||          // JavaScript files
    url.pathname.endsWith('.ts') ||          // TypeScript files
    url.pathname.endsWith('.jsx') ||         // React JSX files
    url.pathname.endsWith('.tsx') ||         // React TSX files
    url.pathname.includes('/api/') ||        // API calls
    url.pathname.includes('/src/') ||        // Source files in dev
    url.origin !== location.origin ||        // External requests
    event.request.method !== 'GET'           // Non-GET requests
  ) {
    // Just pass through to network without caching
    return;
  }

  // Only cache specific static assets
  if (
    url.pathname === '/' ||                  // Root HTML
    url.pathname.endsWith('.html') ||        // HTML files
    url.pathname.endsWith('.css') ||         // CSS files
    url.pathname.endsWith('.png') ||         // Images
    url.pathname.endsWith('.jpg') ||
    url.pathname.endsWith('.jpeg') ||
    url.pathname.endsWith('.gif') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.ico') ||
    url.pathname === '/manifest.json'        // Manifest
  ) {
    event.respondWith(
      caches.match(event.request)
        .then(response => {
          if (response) {
            return response;
          }
          return fetch(event.request).then(response => {
            // Only cache successful responses
            if (response.status === 200) {
              const responseClone = response.clone();
              caches.open(CACHE_NAME).then(cache => {
                cache.put(event.request, responseClone);
              });
            }
            return response;
          });
        })
        .catch(() => {
          // For navigation requests, return cached index.html as fallback
          if (event.request.mode === 'navigate') {
            return caches.match('/');
          }
        })
    );
  }
});

// Activate event
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Handle messages from clients
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Handle background sync (if needed)
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

function doBackgroundSync() {
  // Add any background sync logic here
  return Promise.resolve();
}