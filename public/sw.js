const CACHE_NAME = 'sla-admin-v1760274401265'; // This will be auto-updated on build
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
        // Skip waiting to activate immediately
        return self.skipWaiting();
      })
  );
});

// Activate event - Claim clients immediately
self.addEventListener('activate', event => {
  console.log('SW: Activating new version');
  event.waitUntil(
    Promise.all([
      // Delete old caches
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
      // Claim all clients immediately
      self.clients.claim()
    ]).then(() => {
      // Notify all clients about the update
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
  
  // Skip service worker for development and external resources
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

  // For HTML files, use network first strategy
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

  // For static assets, use cache first strategy
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

// Push notification event handler
self.addEventListener('push', event => {
  console.log('SW: Push event received:', event);
  
  let notificationData = {
    title: '🚀 New Lead Alert!',
    body: 'A new lead has been added to the system',
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
      timestamp: Date.now()
    }
  };

  // Parse push data if available
  if (event.data) {
    try {
      const pushData = event.data.json();
      notificationData = {
        ...notificationData,
        ...pushData
      };
    } catch (e) {
      console.warn('SW: Could not parse push data:', e);
    }
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, notificationData)
  );
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

// Background sync for offline notifications
self.addEventListener('sync', event => {
  if (event.tag === 'lead-notification-sync') {
    event.waitUntil(
      // Check for pending notifications in IndexedDB or localStorage
      handleBackgroundSync()
    );
  }
});

async function handleBackgroundSync() {
  try {
    // This would check for any pending notifications that need to be sent
    // when the device comes back online
    console.log('SW: Background sync triggered for notifications');
    
    // You could implement logic here to:
    // 1. Check IndexedDB for pending notifications
    // 2. Send notifications that were queued while offline
    // 3. Sync with server for missed notifications
    
    return Promise.resolve();
  } catch (error) {
    console.error('SW: Background sync failed:', error);
    return Promise.reject(error);
  }
}