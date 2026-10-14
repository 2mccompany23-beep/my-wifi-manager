// 2MC SpotCloud — Service Worker PWA & Web Push Notifications
const CACHE_NAME = '2mc-spotcloud-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Écouteur des Notifications Push reçues en arrière-plan
self.addEventListener('push', (event) => {
  let data = {
    title: '🔔 2MC SpotCloud',
    body: 'Nouvelle activité enregistrée sur le Hotspot.',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    data: { url: '/#finances' }
  };

  if (event.data) {
    try {
      const parsed = event.data.json();
      data = { ...data, ...parsed };
    } catch (e) {
      data.body = event.data.text() || data.body;
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || '/icon-192.png',
    badge: data.badge || '/icon-192.png',
    vibrate: [250, 100, 250, 100, 250],
    tag: data.tag || `sale-notification-${Date.now()}`,
    renotify: true,
    requireInteraction: true,
    data: data.data || { url: '/#finances' },
    actions: [
      { action: 'view_sales', title: '💰 Voir les Ventes' },
      { action: 'close', title: 'Fermer' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Clic sur la notification -> ouvre ou focus l'application sur la page des ventes
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url && 'focus' in client) {
          if ('navigate' in client && targetUrl !== '/') {
            client.navigate(targetUrl);
          }
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
