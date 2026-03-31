// AcompanheGest - Service Worker
// Permite que o app funcione offline e tenha experiência nativa

const CACHE_NAME = "acompanhegest-v1.0.0";
const urlsToCache = [
  "/",
  "/login.html",
  "/index.html",
  "/style.css",
  "/auth.js",
  "/script.js",
  "/manifest.json",
  "/offline.html",
];

// Instalação do Service Worker - cache dos arquivos principais
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("Cache aberto: ", CACHE_NAME);
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting()),
  );
});

// Ativação - limpa caches antigos
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log("Removendo cache antigo:", cacheName);
              return caches.delete(cacheName);
            }
          }),
        );
      })
      .then(() => self.clients.claim()),
  );
});

// Intercepta requisições e serve do cache quando offline
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
        return new Response(
          "Você está offline. Abra o app novamente quando tiver internet.",
          {
            status: 503,
            statusText: "Offline",
          },
        );
      }),
  );
});

// Sincronização em background (para quando voltar online)
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-dados") {
    event.waitUntil(sincronizarDados());
  }
});

async function sincronizarDados() {
  // Aqui você pode implementar sincronização com algum servidor
  console.log("Sincronizando dados...");
  // Por enquanto, apenas log
  return Promise.resolve();
}
