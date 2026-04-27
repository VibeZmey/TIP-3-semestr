const CACHE_NAME = 'notes-cache-v3';
const DYNAMIC_CACHE_NAME = 'dynamic-content-v1';

const ASSETS = [
    './',
    './index.html',
    './app.js',
    './manifest.json',
    './content/home.html',
    './content/about.html',
    './icons/favicon-16x16.png',
    './icons/favicon-32x32.png',
    './icons/favicon.ico',
    './icons/favicon-192x192.png'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(ASSETS))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys
                    .filter(key => key !== CACHE_NAME && key !== DYNAMIC_CACHE_NAME)
                    .map(key => caches.delete(key))
            );
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', event => {
    const request = event.request;
    const url = new URL(request.url);

    if (url.origin !== location.origin || request.method !== 'GET') return;

    if (request.mode === 'navigate') {
        event.respondWith(
            fetch(request).catch(() =>
                caches.match('./index.html').then(cached => cached || caches.match('./'))
            )
        );
        return;
    }

    if (url.pathname.startsWith('/content/')) {
        event.respondWith(
            fetch(request)
                .then(networkRes => {
                    const resClone = networkRes.clone();
                    caches.open(DYNAMIC_CACHE_NAME).then(cache => {
                        cache.put(request, resClone);
                    });
                    return networkRes;
                })
                .catch(() =>
                    caches.match(request).then(cached => cached || caches.match('./content/home.html'))
                )
        );
        return;
    }

    event.respondWith(
        caches.match(request).then(cached => cached || fetch(request))
    );
});

self.addEventListener('push', (event) => {
    let data = { title: 'Новое уведомление', body: '', reminderId: null };

    if (event.data) {
        data = event.data.json();
    }

    const options = {
        body: data.body,
        icon: './icons/favicon-192x192.png',
        badge: './icons/favicon-48x48.png',
        data: { reminderId: data.reminderId || null }
    };

    if (data.reminderId) {
        options.actions = [
            { action: 'snooze', title: 'Отложить на 5 минут' }
        ];
    }

    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

self.addEventListener('notificationclick', (event) => {
    const notification = event.notification;
    const action = event.action;

    if (action === 'snooze') {
        const reminderId = notification.data?.reminderId;

        event.waitUntil(
            fetch(`http://localhost:3001/snooze?reminderId=${reminderId}`, { method: 'POST' })
                .then(() => notification.close())
                .catch(err => console.error('Snooze failed:', err))
        );
    } else {
        notification.close();
    }
});