const CACHE_NAME = 'sla-admin-v1760274900379';
const urlsToCache = [
  '/',
  '/manifest.json',
  '/fav.png'
];

// Install event - Skip waiting to activate immediately
self.addEventListener('install', event => {
  console.log('SW: Installing new version');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('SW: Opened cache');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        return self.skipWaiting();
      })
  );
});

// Activate event - Claim clients immediately
self.addEventListener('activate', event => {
  console.log('SW: Activating new version');
  event.waitUntil(
    Promise.all([
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME) {
              console.log('SW: Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      self.clients.claim()
    ]).then(() => {
      return self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({
            type: 'SW_UPDATED',
            version: CACHE_NAME
          });
        });
      });
    })
  );
});

// Fetch event - Network first for dynamic content, cache first for static assets
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  if (
    url.pathname.includes('/@') ||
    url.pathname.includes('/node_modules') ||
    url.pathname.includes('/src/') ||
    url.pathname.includes('/api/') ||
    url.origin !== location.origin ||
    event.request.method !== 'GET'
  ) {
    return;
  }

  if (url.pathname === '/' || url.pathname.endsWith('.html')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          return caches.match(event.request);
        })
    );
    return;
  }

  if (
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.jpg') ||
    url.pathname.endsWith('.jpeg') ||
    url.pathname.endsWith('.gif') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.ico') ||
    url.pathname === '/manifest.json'
  ) {
    event.respondWith(
      caches.match(event.request)
        .then(response => {
          if (response) {
            return response;
          }
          return fetch(event.request).then(response => {
            if (response.status === 200) {
              const responseClone = response.clone();
              caches.open(CACHE_NAME).then(cache => {
                cache.put(event.request, responseClone);
              });
            }
            return response;
          });
        })
    );
  }
});

// Handle messages from clients (for manual notifications)
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, options } = event.data;
    
    const notificationOptions = {
      body: options.body || 'A new lead has been added',
      icon: '/fav.png',
      badge: '/fav.png',
      tag: 'lead-notification',
      requireInteraction: true,
      actions: [
        {
          action: 'view',
          title: 'View Lead',
          icon: '/fav.png'
        },
        {
          action: 'dismiss',
          title: 'Dismiss'
        }
      ],
      data: {
        url: '/leads',
        leadId: options.leadId,
        leadName: options.leadName,
        timestamp: Date.now()
      },
      ...options
    };

    self.registration.showNotification(title, notificationOptions);
  }
});

// Notification click event handler
self.addEventListener('notificationclick', event => {
  console.log('SW: Notification clicked:', event);
  
  event.notification.close();

  const notificationData = event.notification.data || {};
  let targetUrl = '/';

  if (event.action === 'view') {
    targetUrl = notificationData.url || '/leads';
  } else if (event.action === 'dismiss') {
    return;
  } else {
    targetUrl = notificationData.url || '/';
  }

  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(windowClients => {
      // Check if there's already a window/tab open with the target URL
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url.includes(targetUrl.split('?')[0]) && 'focus' in client) {
          return client.focus();
        }
      }
      
      // If no window/tab is already open, open a new one
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});