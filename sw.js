/* eslint-disable no-restricted-globals */
const CACHE_NAME = 'quattro-luncher-cache'
const offlineURL = '/'
const installFiles = [
  '/',
  '/index.html',
  '/?source=pwa',
  '/manifest.json',
  '/img/icons/icon-72x72.png',
  '/img/icons/icon-96x96.png',
  '/img/icons/icon-128x128.png',
  '/img/icons/icon-144x144.png',
  '/img/icons/icon-152x152.png',
  '/img/icons/icon-192x192.png',
  '/img/icons/icon-384x384.png',
  '/img/icons/icon-512x512.png',
  '/favicon.ico',
]

function installStaticFiles() {
  return caches.open(CACHE_NAME).then(cache => {
    console.info('[ServiceWorker] Cache Opened')
    // cache essential files
    return cache.addAll(installFiles)
  })
}

function clearOldCache() {
  return caches.keys().then(keylist => {
    return Promise.all(keylist.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))
  })
}

self.addEventListener('install', event => {
  console.debug('[ServiceWorker] [INSTALL]')
  event.waitUntil(installStaticFiles().then(() => self.skipWaiting()))
})

self.addEventListener('activate', event => {
  console.debug(`[ServiceWorker] [ACTIVATE]`)

  event.waitUntil(clearOldCache().then(() => self.clients.claim()))
})

// self.addEventListener('fetch', event => {
//   const req = event.request
//   const url = new URL(req.url)
//   console.debug(`[ServiceWorker] [FETCH] ${req.method}: ${url.href}`)
//   event.respondWith(
//     caches.match(event.request).then(response => {
//       if (response) {
//         console.info('[ServiceWorker] [FETCH] Cache used', response)
//         return response
//       }
//       if (/^(app|vendor)\.[a-z0-9]+\.bundle\.js$/.test(url.pathname)) {
//         return fetch(req).then(resp => {
//           console.info(`[ServiceWorker] [FETCH] Add Cache`, url.pathname)
//           caches.open(CACHE_NAME).then(cache => cache.add(url.pathname))

//           return resp
//         })
//       }
//       return fetch(response)
//     }),
//   )
// })
