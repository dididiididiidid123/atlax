self.addEventListener('push', event => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { message: event.data?.text() || 'Periksa jadwal kewajiban pajak Anda.' };
  }
  const title = payload.title || 'Pengingat pajak ATLAX';
  const options = {
    body: payload.message || 'Periksa jadwal kewajiban pajak Anda.',
    tag: payload.tag || 'atlax-tax-reminder',
    renotify: false,
    data: { url: payload.url || './' }
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const destination = new URL(event.notification.data?.url || './', self.location.origin).href;
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of windows) {
      if (client.url.startsWith(self.location.origin)) {
        if (client.url !== destination && 'navigate' in client) await client.navigate(destination);
        await client.focus();
        return;
      }
    }
    await self.clients.openWindow(destination);
  })());
});
