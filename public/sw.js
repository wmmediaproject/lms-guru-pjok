// Service Worker: Hanya cache aset statis (CSS, JS, Fonts, Icons), TIDAK cache data API/Supabase/halaman dinamis
const CACHE_NAME = "lms-guru-pjok-static-v1"

// Daftar aset inti yang di-precache saat instalasi
const PRECACHE_ASSETS = [
  "/icon-192.png",
  "/icon-512.png",
  "/icon-maskable-192.png",
  "/icon-maskable-512.png",
]

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => caches.delete(name)),
        ),
      )
      .then(() => self.clients.claim()),
  )
})

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url)

  // Hanya proses permintaan GET dari origin yang sama
  if (event.request.method !== "GET" || url.origin !== self.location.origin) {
    return
  }

  // JANGAN cache rute API, Supabase RPC, dokumen HTML, auth, atau data dinamis
  if (
    url.pathname.startsWith("/api") ||
    url.pathname.startsWith("/auth") ||
    url.pathname.startsWith("/dashboard") ||
    url.pathname.startsWith("/masuk") ||
    event.request.headers.get("accept")?.includes("text/html")
  ) {
    return
  }

  // HANYA cache aset statis Next.js (_next/static) dan file statis publik (gambar, font, css, js)
  const isStaticAsset =
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.endsWith(".png") ||
    url.pathname.endsWith(".jpg") ||
    url.pathname.endsWith(".jpeg") ||
    url.pathname.endsWith(".svg") ||
    url.pathname.endsWith(".webp") ||
    url.pathname.endsWith(".woff2") ||
    url.pathname.endsWith(".woff") ||
    url.pathname.endsWith(".ttf") ||
    url.pathname.endsWith(".ico")

  if (!isStaticAsset) {
    return
  }

  // Strategi Cache-First dengan Network Fallback untuk aset statis
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse
      }

      return fetch(event.request).then((networkResponse) => {
        if (
          !networkResponse ||
          networkResponse.status !== 200 ||
          networkResponse.type !== "basic"
        ) {
          return networkResponse
        }

        const responseToCache = networkResponse.clone()
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache)
        })

        return networkResponse
      })
    }),
  )
})
