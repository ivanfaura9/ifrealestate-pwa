// Service Worker para IF Real Estate PWA
// Maneja Web Push: muestra notificación + abre URL al hacer click

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: "IF Real Estate", body: event.data ? event.data.text() : "" };
  }

  const title = data.title || "IF Real Estate";
  const options = {
    body: data.body || "",
    icon: data.icon || "icons/icon-192.png",
    badge: "icons/icon-96.png",
    tag: data.tag || "lead",
    data: { url: data.url || "/" },
    requireInteraction: false,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // Si ya hay una ventana abierta, focusearla y navegar
      for (const client of clientList) {
        if ("focus" in client) {
          client.focus();
          if ("navigate" in client) client.navigate(targetUrl);
          return;
        }
      }
      // Si no, abrir nueva
      if (self.clients.openWindow) return self.clients.openWindow(targetUrl);
    })
  );
});
