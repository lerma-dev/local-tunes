// app/sw.js
const CACHE_NAME = "music-v2.0.0";
const APP_VERSION = CACHE_NAME.replace("music-v", "");
const SHARE_DB_NAME = "MusicAppDB";
const SHARE_STORE_NAME = "library_meta";

const ASSETS = [
  "./",
  "./index.html",
  "./styles/main.css",
  "./scripts/app.js",
  "./scripts/icons.js",
  "./assets/lerma-icons/help.svg",
  "./manifest.json",
];

//insatalacion
self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)));
});

//activacion - limpieza de caches antiguas
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => {
        return Promise.all(
          keys.map((key) => {
            if (key !== CACHE_NAME) {
              return caches.delete(key);
            }
          }),
        );
      })
      .then(() => {
        // Notificar a todos los clientes inmediatamente
        return self.clients.matchAll({
          includeUncontrolled: true,
          type: "window",
        });
      })
      .then((clients) => {
        clients.forEach((client) =>
          client.postMessage({
            action: "setVersion",
            version: APP_VERSION,
          }),
        );
      }),
  );
  return self.clients.claim();
});

// fetch - estrategia cache-first
self.addEventListener("fetch", (e) => {

  const requestUrl = new URL(e.request.url);
  if (e.request.method === "POST" && requestUrl.pathname.endsWith("/share-to-localtunes")) {
    e.respondWith(handleShareTarget(e.request));
    return;
  }

  // EXCEPCIÓN: No cachear nunca el archivo de verificación de Google
  if (e.request.url.includes('.well-known/assetlinks.json')) {
    return; // Esto hace que el navegador use la red directamente
  }
  e.respondWith(
    caches.match(e.request).then((res) => {
      return (
        res ||
        fetch(e.request).then((newRes) => {
          // cachear si la respuesta es válida
          if (!newRes || newRes.status !== 200) return newRes;

          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, newRes.clone());
            return newRes;
          });
        })
      );
    }),
  );
});

async function handleShareTarget(request) {
  try {
    const formData = await request.formData();
    const sharedFiles = formData
      .getAll("audio")
      .filter((f) => f instanceof File && /\.(mp3|wav|ogg|m4a)$/i.test(f.name));

    if (sharedFiles.length > 0) {
      const db = await openShareDB();
      await new Promise((resolve, reject) => {
        const tx = db.transaction(SHARE_STORE_NAME, "readwrite");
        tx.objectStore(SHARE_STORE_NAME).put({
          id: "incoming_share",
          // El File es un Blob válido para structured clone en IndexedDB
          files: sharedFiles.map((f) => ({ name: f.name, type: f.type, blob: f })),
          receivedAt: Date.now(),
        });
        tx.oncomplete = resolve;
        tx.onerror = () => reject(tx.error);
      });
    }
  } catch (error) {
    console.error("[SW][ShareTarget] Error al procesar el contenido compartido:", error);
  }

  return Response.redirect(new URL("./index.html", self.registration.scope).href, 303);
}

function openShareDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(SHARE_DB_NAME, 1);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(SHARE_STORE_NAME)) {
        db.createObjectStore(SHARE_STORE_NAME, { keyPath: "id" });
      }
    };
    request.onsuccess = (e) => resolve(e.target.result);
    request.onerror = (e) => reject(e.target.result);
  });
}

self.addEventListener("message", (event) => {
  if (event.data && event.data.action === "skipWaiting") {
    self.skipWaiting();
  }
});
