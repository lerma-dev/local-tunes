// app/register_sw.js
const hostname = window.location.hostname;
const isLocal = hostname === "localhost" || hostname === "127.0.0.1";
if (isLocal) {
  console.info("Service Worker: Desactivado en entorno local.");
} else if ("serviceWorker" in navigator) {
  /*
    Registro del Service Worker 
    Recarga automática cuando el nuevo SW toma el control
  */
  navigator.serviceWorker.register("./sw.js");
  
  let refreshing = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (!refreshing) {
      refreshing = true;
      window.location.reload();
    }
  });
}