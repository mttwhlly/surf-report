const CACHE_NAME = 'surf-conditions-v1.6.0';
const DYNAMIC_CACHE = 'surf-dynamic-v1.6.0';

// Only cache files that actually exist
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/css/animations.css',
  '/css/components.css',
  '/css/styles.css',
  '/js/app.js',
  '/js/blob-background.js',
  '/js/swell-animation.js',
  '/js/tide-visualizer.js',
  '/js/visualizations.js',
  '/js/waves.js',
  '/js/wind-animation.js',
  '/manifest.json'
  // Removed icon references until they're generated
];

// Install event - cache static assets with error handling
self.addEventListener('install', event => {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Caching static assets');
        // Cache each asset individually to handle 404s gracefully
        return Promise.allSettled(
          STATIC_ASSETS.map(url => 
            cache.add(url).catch(error => {
              console.warn(`Failed to cache ${url}:`, error);
              return null;
            })
          )
        );
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('Service Worker activating...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME && cacheName !== DYNAMIC_CACHE) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - network first for API, cache first for static assets
self.addEventListener('fetch', event => {
  if (event.request.url.includes('surfability')) {
    // Network first for API calls with fallback to demo data
    event.respondWith(
      fetch(event.request)
        .then(response => {
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(DYNAMIC_CACHE)
              .then(cache => cache.put(event.request, responseClone));
          }
          return response;
        })
        .catch(error => {
          console.log('API fetch failed, returning demo data:', error);
          // Return demo data when API fails
          return new Response(JSON.stringify({
            location: "St. Augustine, FL",
            timestamp: new Date().toISOString(),
            surfable: true,
            rating: "Marginal",
            score: 45,
            goodSurfDuration: "Demo mode - API unavailable",
            details: {
              wave_height_ft: 1.5,
              wave_period_sec: 6,
              swell_direction_deg: 90,
              wind_direction_deg: 117,
              wind_speed_kts: 22.9,
              tide_state: "High",
              data_source: "Service Worker fallback"
            }
          }), {
            headers: { 
              'Content-Type': 'application/json',
              'Cache-Control': 'no-cache'
            }
          });
        })
    );
  } else {
    // Cache first for static assets with network fallback
    event.respondWith(
      caches.match(event.request)
        .then(response => {
          if (response) {
            return response;
          }
          
          return fetch(event.request)
            .then(fetchResponse => {
              // Only cache successful responses for known file types
              if (fetchResponse.ok && 
                  (event.request.url.endsWith('.js') || 
                   event.request.url.endsWith('.css') || 
                   event.request.url.endsWith('.html'))) {
                const responseClone = fetchResponse.clone();
                caches.open(DYNAMIC_CACHE)
                  .then(cache => cache.put(event.request, responseClone));
              }
              return fetchResponse;
            })
            .catch(error => {
              console.log('Static asset fetch failed:', error);
              // For icon requests, return a placeholder
              if (event.request.url.includes('/icons/')) {
                return new Response('', { status: 404 });
              }
              throw error;
            });
        })
    );
  }
});

// Push notification event
self.addEventListener('push', event => {
  let data = {};
  
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body || 'Great surf conditions detected!',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-96.png',
    vibrate: [100, 50, 100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: data.primaryKey || 'surf-notification'
    },
    actions: [
      {
        action: 'view',
        title: 'View Conditions',
        icon: '/icons/icon-96.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icons/icon-96.png'
      }
    ],
    requireInteraction: true,
    tag: 'surf-conditions'
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Surf Conditions', options)
  );
});

// Notification click event
self.addEventListener('notificationclick', event => {
  event.notification.close();

  if (event.action === 'view' || !event.action) {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Background sync event
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync') {
    event.waitUntil(
      console.log('Background sync triggered')
    );
  }
});