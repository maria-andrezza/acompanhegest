// AcompanheGest - Service Worker
// Permite que o app funcione offline e tenha experiência nativa

// AcompanheGest - Service Worker Corrigido
const CACHE_NAME = "acompanhegest-v2.1.1"; // Versão incrementada para forçar atualização
const urlsToCache = [
  "/",
  "/login.html",
  "/index.html",
  "/style.css",
  "/auth.js",
  "/script.js",
  "/manifest.json",
  "/offline.html",
  "/icons/favicon.ico",
  "/icons/icon-72.png",
  "/icons/icon-96.png",
  "/icons/icon-128.png",
  "/icons/icon-144.png",
  "/icons/icon-152.png",
  "/icons/icon-192.png",
  "/icons/icon-384.png",
  "/icons/icon-512.png", // MUDADO PARA .PNG para coincidir com sua pasta
];

// Instalação do Service Worker
self.addEventListener("install", (event) => {
  console.log("[Service Worker] Instalando...");
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("[Service Worker] Cacheando arquivos...");
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting()),
  );
});

// Ativação - limpa caches antigos
self.addEventListener("activate", (event) => {
  console.log("[Service Worker] Ativando...");
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log(
                "[Service Worker] Removendo cache antigo:",
                cacheName,
              );
              return caches.delete(cacheName);
            }
          }),
        );
      })
      .then(() => self.clients.claim()),
  );
});
// Ignorar requisições de API
if (event.request.url.includes("/api/")) {
  return fetch(event.request);
}
// Intercepta requisições
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches
      .match(event.request)
      .then((response) => {
        // Cache hit - retorna do cache
        if (response) {
          return response;
        }

        // Clone da requisição
        const fetchRequest = event.request.clone();

        return fetch(fetchRequest).then((response) => {
          // Verifica se é uma resposta válida
          if (
            !response ||
            response.status !== 200 ||
            response.type !== "basic"
          ) {
            return response;
          }

          // Clone da resposta para cache
          const responseToCache = response.clone();

          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });

          return response;
        });
      })
      .catch(() => {
        // Se estiver offline e for uma página, mostra página offline
        if (event.request.destination === "document") {
          return caches.match("/offline.html");
        }

        // Para imagens, retorna um placeholder genérico
        if (event.request.destination === "image") {
          return new Response(
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="#f8a5c2"/><text x="50" y="67" font-size="50" text-anchor="middle" fill="white">🌸</text></svg>',
            { headers: { "Content-Type": "image/svg+xml" } },
          );
        }

        return new Response(
          "Você está offline. Conecte-se à internet para acessar o conteúdo.",
          {
            status: 503,
            statusText: "Offline",
          },
        );
      }),
  );
});

// Notificações push (opcional)
self.addEventListener("push", (event) => {
  const options = {
    body: event.data ? event.data.text() : "Hora de registrar seus dados!",
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-72.png",
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1,
    },
    actions: [
      {
        action: "registrar",
        title: "Registrar Agora",
      },
      {
        action: "fechar",
        title: "Lembrar Depois",
      },
    ],
  };

  event.waitUntil(
    self.registration.showNotification("🌸 AcompanheGest", options),
  );
});

// Clique na notificação
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "registrar") {
    event.waitUntil(clients.openWindow("/index.html?action=registrar"));
  } else if (event.action === "fechar") {
    // Apenas fecha
  } else {
    event.waitUntil(clients.openWindow("/index.html"));
  }
});
