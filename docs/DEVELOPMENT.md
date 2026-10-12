# 🏗️ Guía de Desarrollo Técnico

Esta guía explica la arquitectura interna del reproductor y el flujo de despliegue para desarrolladores que deseen profundizar en la lógica del proyecto. Para levantar el entorno local, consulta el [README](../README.md); para contribuir, consulta [CONTRIBUTING.md](../CONTRIBUTING.md).

## 📁 Estructura de Archivos del Repositorio

* `/app/`: Código de la aplicación web que se despliega en producción y beta.
  * `index.html`, `manifest.json`: punto de entrada y manifiesto de la PWA.
  * `version.json`: versión y nombre en clave de la app (ver [Versionado](#-versionado-y-actualizaciones)).
  * `sw.js`: estrategias de caché de la PWA y manejo del ciclo de actualización.
  * `register_sw.js`: registro del Service Worker, con exclusión de entornos de desarrollo local.
  * `/pages/`: fragmentos HTML de las vistas, modales y componentes, enumerados en `pages/manifest.json`.
  * `/styles/`: CSS organizado en `base/` (reset, fuentes, temas y variables), `components/` y `layouts/`, unificados desde `main.css`.
  * `/assets/`: fuentes, íconos, íconos propios (`lerma-icons/`) y capturas.
  * `/scripts/`: lógica JavaScript modularizada (ver abajo).
* `/docs/`: documentación técnica del proyecto.
* `start_app.sh` / `start_app.bat`: scripts para levantar el servidor local en el puerto 3300.

### Módulos de JavaScript (`/app/scripts/modules/`)

| Carpeta | Contenido |
|---|---|
| `core/` | Arranque, integración con la app de escritorio (`windows.core.js`) y recepción de archivos compartidos (`share_target.js`) |
| `components/` | Reproductor, canciones, carpetas, favoritos, playlists, ecualizador, visualizadores, ajustes, toasts y banners |
| `db/` | Acceso a IndexedDB (`database.js`, `libraryDB.js`) |
| `ui/` | Vistas, sidebar, tab bar, modales, menú contextual de canciones y loader |
| `utils/` | Estado global, temas, respaldo, versión y utilidades |

## 🔊 Procesamiento & Reproducción de Audio

* **Escáner local:** El reproductor no sube archivos a ningún servidor. Utiliza la propiedad **`webkitdirectory`** de los inputs de archivo para mapear colecciones enteras de carpetas locales directamente hacia el navegador.
* **Reproducción:** Las pistas se reproducen con el elemento nativo de HTML5 `<audio id="audio-engine">`. La lógica de eventos (reproducción, pausa, cambio de pista, tiempo y volumen) se maneja con JavaScript sobre las propiedades de este nodo.
* **Web Audio API:** Ya está integrada. El **visualizador** (`visualizer.js`) usa un `AudioContext` con un `AnalyserNode` para leer las frecuencias en tiempo real, y el **ecualizador** (`equalizer.js`) usa filtros `BiquadFilter`.

## 💾 Persistencia de Datos (IndexedDB)

La base de datos se llama **`MusicAppDB`** (versión 1) y tiene un único almacén, **`library_meta`**, con `id` como clave. Cada tipo de dato se guarda como un registro con su propio `id`; entre ellos:

* `current_lib`: la biblioteca de canciones actual.
* `songs_favs`: la lista de favoritos.
* `incoming_share`: archivos recibidos mediante la función de compartir (*share target*) de la PWA.
* Las playlists también se guardan en este almacén.

> El Service Worker (`sw.js`) usa el mismo nombre de base de datos y de almacén para guardar los archivos compartidos. Si cambias `MusicAppDB` o `library_meta`, actualiza también `sw.js`.

## 🔢 Versionado y actualizaciones

La versión vive en `app/version.json`:

```json
{ "version": "2.0.2", "codename": "tasmania" }
```

Hay dos mecanismos de actualización, y ambos dependen de que la versión cambie:

1. **PWA (navegador):** `sw.js` define `CACHE_NAME` (hoy `"v2.0.2"`). Al cambiarlo, el navegador detecta un Service Worker nuevo y descarta la caché anterior. Mantén `CACHE_NAME` alineado con `version.json` en cada release.
2. **App de escritorio:** la app de [local-tunes-desktop](https://github.com/lerma-dev/local-tunes-desktop) lee `version.json` desde la raíz de la rama `beta` y **vuelve a descargar toda la interfaz solo cuando la versión remota es distinta de la local**. Si publicas cambios en `beta` sin cambiar la versión, los usuarios de escritorio no los recibirán.

## 🔄 Ciclo de Actualización (Skip Waiting)

Para forzar la actualización del Service Worker cuando hay cambios críticos:

1. El navegador detecta un nuevo Service Worker en espera.
2. `banner-updates.js` muestra un aviso en el DOM.
3. Al aceptar, se envía al worker en espera el mensaje `{ action: "skipWaiting" }`.
4. `sw.js` recibe el mensaje y ejecuta `self.skipWaiting()` para activar el nuevo worker de inmediato.

## 🖥️ Integración con la app de escritorio

La interfaz detecta si corre dentro del contenedor de escritorio (WebView2) comprobando `window.chrome.webview`. Esa lógica está en `core/windows.core.js` y permite:

* **Web → escritorio:** enviar con `window.chrome.webview.postMessage` comandos como cerrar, minimizar, maximizar, arrastrar la ventana, cambiar entre barra personalizada y nativa, sincronizar el color de fondo y mostrar el menú de sistema.
* **Escritorio → web:** `app.js` expone `window.togglePlay`, `window.playNext` y `window.playPrev`, que usa el menú de la bandeja del sistema. **No cambies estos nombres** sin actualizar también la app de escritorio.

## 🌎 Flujo de Despliegue Limpio (Subtrees)

Para evitar subir archivos innecesarios de documentación o scripts de arranque al hosting, el despliegue se hace dividiendo el repositorio mediante `git subtree push`. Solo el mantenedor realiza estos despliegues.

* **Entorno Beta (GitHub Pages):** se toma únicamente el contenido de `/app` y se empuja a la raíz de la rama `beta`.
* **Entorno de Producción (Netlify):** se toma únicamente el contenido de `/app` y se empuja a la raíz de la rama `prod`.

Esto permite que cada proveedor de hosting lea `index.html` directamente en la raíz de su rama.