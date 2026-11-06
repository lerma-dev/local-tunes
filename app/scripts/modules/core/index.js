// scripts/modules/core/index.js
import { initTitlebar, sincronizarFondoConCSharp} from "./windows.core.js";

export function initPlatformCore() {
  // Inicializamos la barra de título de inmediato para que se dibuje el HTML
  sincronizarFondoConCSharp();
  initTitlebar();

  const initDesktop = () => {
    if (window.chrome?.webview) {
      console.log("Entorno de escritorio (WebView2 C#) detectado.");
      if (typeof window.modeDesktopActive === "function") {
        window.modeDesktopActive();
      }
    } else {
      console.log("Corriendo en entorno web estándar (Navegador).");
      // destruir barra de título cuando estando en un navegador web estándar
      document.querySelectorAll("#desktop-titlebar").forEach((el) => el.remove());
    }
  };

  // Si la página ya cargó o se está cargando, intentamos disparar el modo escritorio
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initDesktop);
  } else {
    initDesktop();
  }

  // Listener para mensajes desde C#
  if (window.chrome?.webview) {
    window.chrome.webview.addEventListener("message", (event) => {
      const datos = event.data;
      console.log("Mensaje recibido desde C#:", datos);
    });
  }
}
