const CACHE_NAME = 'sla-admin-v1760278557370';
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

// Fetch event
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

// Handle messages from clients (CRITICAL FOR NOTIFICATIONS)
self.addEventListener('message', event => {
  console.log('SW: Message received:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, options } = event.data;
    
    console.log('SW: Showing notification:', title, options);
    
    const notificationOptions = {
      body: options.body || 'A new lead has been added',
      icon: options.icon || '/fav.png',
      badge: options.badge || '/fav.png',
      tag: options.tag || 'lead-notification',
      requireInteraction: options.requireInteraction !== false,
      actions: options.actions || [
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
        timestamp: Date.now(),
        ...options.data
      },
      ...options
    };

    // Show the notification
    event.waitUntil(
      self.registration.showNotification(title, notificationOptions)
        .then(() => {
          console.log('SW: Notification shown successfully');
          
          // Notify all clients that notification was shown
          return self.clients.matchAll().then(clients => {
            clients.forEach(client => {
              client.postMessage({
                type: 'NOTIFICATION_SHOWN',
                title: title,
                timestamp: Date.now()
              });
            });
          });
        })
        .catch(error => {
          console.error('SW: Error showing notification:', error);
        })
    );
  }
});

// Notification click event handler
self.addEventListener('notificationclick', event => {
  console.log('SW: Notification clicked:', event.notification.tag);
  
  event.notification.close();

  const notificationData = event.notification.data || {};
  let targetUrl = '/';

  if (event.action === 'view') {
    targetUrl = notificationData.url || '/leads';
  } else if (event.action === 'dismiss') {
    console.log('SW: Notification dismissed');
    return;
  } else {
    // Default click action
    targetUrl = notificationData.url || '/leads';
  }

  console.log('SW: Opening/focusing window with URL:', targetUrl);

  event.waitUntil(
    self.clients.matchAll({ 
      type: 'window',
      includeUncontrolled: true 
    }).then(windowClients => {
      console.log('SW: Found', windowClients.length, 'window clients');
      
      // Check if there's already a window/tab open
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        console.log('SW: Checking client:', client.url);
        
        if (client.url.includes(window.location.origin) && 'focus' in client) {
          console.log('SW: Focusing existing window');
          
          // Send message to client to navigate to the target URL
          client.postMessage({
            type: 'NAVIGATE_TO',
            url: targetUrl
          });
          
          return client.focus();
        }
      }
      
      // If no window/tab is already open, open a new one
      if (self.clients.openWindow) {
        console.log('SW: Opening new window');
        return self.clients.openWindow(targetUrl);
      }
    }).catch(error => {
      console.error('SW: Error handling notification click:', error);
    })
  );
});

// Push event handler (for future push notifications)
self.addEventListener('push', event => {
  console.log('SW: Push event received');
  
  if (event.data) {
    try {
      const pushData = event.data.json();
      console.log('SW: Push data:', pushData);
      
      const title = pushData.title || 'New Notification';
      const options = {
        body: pushData.body || 'You have a new notification',
        icon: '/fav.png',
        badge: '/fav.png',
        tag: pushData.tag || 'push-notification',
        data: pushData.data || {}
      };
      
      event.waitUntil(
        self.registration.showNotification(title, options)
      );
    } catch (error) {
      console.error('SW: Error handling push event:', error);
    }
  }
});

// Listen for navigation messages from notification clicks
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'NAVIGATE_TO') {
    // This is handled by the client side
    console.log('SW: Navigation message received for URL:', event.data.url);
  }
});

console.log('SW: Service worker loaded and ready');