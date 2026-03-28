const CACHE_NAME = 'newgen-cache-v10';
const urlsToCache = [
    '/',
    '/index.html',
    '/main.css',
    '/ui.js',
    '/api.js',
    '/auth.js',
    '/ai.js',
    '/profile.html',
    '/history.html',
    '/about.html',
    '/services.html',
    '/contact.html',
    '/manifest.json'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(urlsToCache))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName); // ลบแคชเวอร์ชันเก่าทิ้ง
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', event => {
    // ถ้าเป็นการเรียก /api/ ให้พยายามดึงข้อมูลจาก Server แต่ถ้าไม่เน็ตหลุด ให้ส่ง Response กลับบอก Offline
    if (event.request.url.includes('/api/')) {
        event.respondWith(
            fetch(event.request).catch(() => {
                return new Response(JSON.stringify({
                    error: "ไม่สามารถเชื่อมต่ออินเทอร์เน็ตได้ (ออฟไลน์)"
                }), {
                    status: 503,
                    headers: { 'Content-Type': 'application/json' }
                });
            })
        );
        return;
    }

    // สำหรับไฟล์เว็บ HTML/CSS/JS ให้ดึงจาก Cache ก่อน ถ้าไม่มีก็ไปดึงจากเน็ตแล้วจำเข้า Cache (Dynamic Caching)
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                if (response) return response;
                return fetch(event.request).then(fetchRes => {
                    return caches.open(CACHE_NAME).then(cache => {
                        // ไม่แคชผลลัพธ์จาก Chrome Extension หรือโดเมนอื่นที่ไม่ใช่ของเราเพื่อป้องกันขยะ
                        if (event.request.url.startsWith(self.location.origin)) {
                            cache.put(event.request, fetchRes.clone());
                        }
                        return fetchRes;
                    });
                });
            }).catch(() => {
                // ในกรณีออฟไลน์ และเป็นการเปิดหน้าเว็บ ให้เด้งกลับไปที่หน้าแรก (Index) หรือแคชที่หลงเหลือ
                if (event.request.headers.get('accept') && event.request.headers.get('accept').includes('text/html')) {
                    return caches.match('/');
                }
            })
    );
});
