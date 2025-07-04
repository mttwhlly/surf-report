// Updated Service Worker - Fixed for missing icons and improved error handling
const CACHE_NAME = 'surf-conditions-v2.0.2';
const DYNAMIC_CACHE = 'surf-dynamic-v2.0.2';

// Only cache files that actually exist - removed problematic icon references
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
  // Icons will be cached dynamically when they exist
];

// Enhanced install event with better error handling
self.addEventListener('install', event => {
  console.log('🔧 Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('📦 Caching core assets...');
        
        // Cache assets individually to handle 404s gracefully
        const cachePromises = STATIC_ASSETS.map(url => 
          fetch(url)
            .then(response => {
              if (response.ok) {
                return cache.put(url, response);
              } else {
                console.warn(`⚠️ Skipping ${url} (${response.status})`);
                return null;
              }
            })
            .catch(error => {
              console.warn(`❌ Failed to cache ${url}:`, error.message);
              return null;
            })
        );
        
        return Promise.allSettled(cachePromises);
      })
      .then(results => {
        const successful = results.filter(r => r.status === 'fulfilled').length;
        console.log(`✅ Successfully cached ${successful}/${STATIC_ASSETS.length} assets`);
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('❌ Service Worker installation failed:', error);
        // Don't fail installation if some assets can't be cached
        return self.skipWaiting();
      })
  );
});

// Enhanced activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('🚀 Service Worker activating...');
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME && cacheName !== DYNAMIC_CACHE) {
              console.log('🗑️ Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Take control of all pages
      self.clients.claim()
    ]).then(() => {
      console.log('✅ Service Worker activated and ready');
    })
  );
});

// Enhanced fetch event with better API and icon handling
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // Handle API requests (surf data)
  if (url.pathname.includes('surfability') || url.hostname.includes('mttwhlly.cc')) {
    event.respondWith(handleAPIRequest(event.request));
    return;
  }
  
  // Handle icon requests specifically
  if (url.pathname.includes('/icons/')) {
    event.respondWith(handleIconRequest(event.request));
    return;
  }
  
  // Handle font requests
  if (url.hostname.includes('fonts.googleapis.com') || url.hostname.includes('fonts.gstatic.com')) {
    event.respondWith(handleFontRequest(event.request));
    return;
  }
  
  // Handle static assets
  event.respondWith(handleStaticAsset(event.request));
});

// API request handler with enhanced fallback
async function handleAPIRequest(request) {
  try {
    // Try network first for fresh data
    const networkResponse = await fetch(request, {
      headers: {
        'Accept': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });
    
    if (networkResponse.ok) {
      // Cache successful API responses
      const cache = await caches.open(DYNAMIC_CACHE);
      await cache.put(request, networkResponse.clone());
      console.log('🌊 Fresh surf data cached');
      return networkResponse;
    } else {
      throw new Error(`API returned ${networkResponse.status}`);
    }
  } catch (error) {
    console.log('📱 Network failed, trying cache...', error.message);
    
    // Try cached version
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      console.log('📦 Serving cached surf data');
      return cachedResponse;
    }
    
    // Ultimate fallback - return demo data
    console.log('🔄 Serving demo surf data');
    return new Response(JSON.stringify({
      location: "St. Augustine, FL",
      timestamp: new Date().toISOString(),
      surfable: true,
      rating: "Demo Mode",
      score: 45,
      goodSurfDuration: "Demo data - API temporarily unavailable",
      details: {
        wave_height_ft: 2.0,
        wave_period_sec: 8.0,
        swell_direction_deg: 90,
        wind_direction_deg: 180,
        wind_speed_kts: 15.0,
        tide_state: "Mid",
        tide_height_ft: 2.0,
        data_source: "Service Worker fallback"
      },
      weather: {
        air_temperature_f: 75,
        water_temperature_f: 72,
        weather_code: 1,
        weather_description: "Partly cloudy"
      },
      tides: {
        current_height_ft: 2.0,
        state: "Mid",
        next_high: { time: "6:30 PM", height: 3.2 },
        next_low: { time: "12:45 AM", height: 0.8 }
      }
    }), {
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'X-SW-Source': 'fallback'
      }
    });
  }
}

// Icon request handler - graceful 404 handling
async function handleIconRequest(request) {
  try {
    // Check cache first for icons
    const cachedIcon = await caches.match(request);
    if (cachedIcon) {
      return cachedIcon;
    }
    
    // Try to fetch from network
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      // Cache successful icon requests
      const cache = await caches.open(DYNAMIC_CACHE);
      await cache.put(request, networkResponse.clone());
      return networkResponse;
    } else {
      // Icon doesn't exist - return placeholder or 404
      console.log(`📎 Icon not found: ${request.url}`);
      return generatePlaceholderIcon(request.url);
    }
  } catch (error) {
    console.log(`❌ Icon request failed: ${request.url}`, error.message);
    return generatePlaceholderIcon(request.url);
  }
}

// Generate placeholder icon for missing icons
function generatePlaceholderIcon(iconUrl) {
  // Extract size from URL (e.g., icon-192.png -> 192)
  const sizeMatch = iconUrl.match(/icon-(\d+)/);
  const size = sizeMatch ? parseInt(sizeMatch[1]) : 192;
  
  // Create simple SVG placeholder
  const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#0077cc;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#003366;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="${size}" height="${size}" fill="url(#grad)"/>
      <path d="M0,${size * 0.6} Q${size * 0.25},${size * 0.4} ${size * 0.5},${size * 0.6} T${size},${size * 0.6} L${size},${size} L0,${size} Z" fill="white" opacity="0.9"/>
      <text x="${size/2}" y="${size * 0.3}" text-anchor="middle" fill="white" font-family="Arial" font-size="${size * 0.1}" font-weight="bold">SURF</text>
      <text x="${size/2}" y="${size * 0.4}" text-anchor="middle" fill="white" font-family="Arial" font-size="${size * 0.06}" font-weight="bold">LAB</text>
    </svg>
  `;
  
  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=31536000'
    }
  });
}

// Font request handler
async function handleFontRequest(request) {
  try {
    // Check cache first
    const cachedFont = await caches.match(request);
    if (cachedFont) {
      return cachedFont;
    }
    
    // Try network with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const networkResponse = await fetch(request, {
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    
    if (networkResponse.ok) {
      // Cache fonts for long term
      const cache = await caches.open(DYNAMIC_CACHE);
      await cache.put(request, networkResponse.clone());
      return networkResponse;
    } else {
      throw new Error(`Font request failed: ${networkResponse.status}`);
    }
  } catch (error) {
    console.log('🔤 Font request failed, using system fonts:', error.message);
    // Return empty response - system fonts will be used
    return new Response('', { status: 404 });
  }
}

// Static asset handler
async function handleStaticAsset(request) {
  try {
    // Cache first strategy for static assets
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Try network
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      // Cache successful responses
      if (shouldCache(request.url)) {
        const cache = await caches.open(DYNAMIC_CACHE);
        await cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    } else {
      throw new Error(`Asset request failed: ${networkResponse.status}`);
    }
  } catch (error) {
    console.log(`📄 Static asset failed: ${request.url}`, error.message);
    
    // For HTML requests, return cached index.html if available
    if (request.headers.get('accept')?.includes('text/html')) {
      const cachedIndex = await caches.match('/index.html');
      if (cachedIndex) {
        return cachedIndex;
      }
    }
    
    return new Response('Resource not available offline', { status: 404 });
  }
}

// Helper function to determine if asset should be cached
function shouldCache(url) {
  const cacheableExtensions = ['.js', '.css', '.html', '.png', '.jpg', '.svg', '.woff2'];
  return cacheableExtensions.some(ext => url.includes(ext));
}

// Enhanced push notification handling
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
    body: data.body || 'Great surf conditions detected! 🏄‍♂️',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-96.png',
    vibrate: [200, 100, 200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: data.primaryKey || 'surf-notification',
      url: data.url || '/'
    },
    actions: [
      {
        action: 'view',
        title: 'Check Conditions',
        icon: '/icons/icon-96.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
        icon: '/icons/icon-96.png'
      }
    ],
    requireInteraction: false,
    tag: 'surf-conditions',
    renotify: false
  };

  event.waitUntil(
    self.registration.showNotification(
      data.title || 'SURF LAB - Great Conditions! 🌊', 
      options
    )
  );
});

// Enhanced notification click handling
self.addEventListener('notificationclick', event => {
  event.notification.close();

  if (event.action === 'view' || !event.action) {
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then(clientList => {
        // Try to focus existing window
        for (const client of clientList) {
          if (client.url === self.registration.scope && 'focus' in client) {
            return client.focus();
          }
        }
        // Open new window if none exists
        if (clients.openWindow) {
          return clients.openWindow('/');
        }
      })
    );
  }
  // Dismiss action does nothing (notification already closed)
});

// Background sync for offline actions
self.addEventListener('sync', event => {
  if (event.tag === 'surf-data-sync') {
    event.waitUntil(
      // Try to fetch fresh data when back online
      fetch('/api/surfability')
        .then(response => response.json())
        .then(data => {
          console.log('🔄 Background sync: Fresh surf data loaded');
          // Could notify all clients of new data
          return self.clients.matchAll().then(clients => {
            clients.forEach(client => {
              client.postMessage({
                type: 'FRESH_DATA',
                data: data
              });
            });
          });
        })
        .catch(error => {
          console.log('🔄 Background sync failed:', error);
        })
    );
  }
});

// Message handling for communication with main app
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({
      version: CACHE_NAME,
      timestamp: new Date().toISOString()
    });
  }
});

console.log('🌊 SURF LAB Service Worker v2.0.0 loaded');
console.log('📦 Enhanced caching with graceful fallbacks');
console.log('🔧 Improved icon and font handling');
console.log('🚀 Ready for PWA installation!');