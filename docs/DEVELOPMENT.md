# 🏗️ Guía de Desarrollo Técnico

Esta guía explica la arquitectura interna del reproductor y el flujo de despliegue para desarrolladores que deseen profundizar en la lógica del proyecto. Para levantar el entorno local, consulta el [README](../README.md); para contribuir, consulta [CONTRIBUTING.md](../CONTRIBUTING.md).

## 📁 Estructura de Archivos del Repositorio

* `/app/`: Código de la aplicación web que se despliega en producción y beta.
  * `index.html`, `manifest.json`: punto de entrada y manifiesto de la PWA. El `manifest.json` también guarda la versión y el nombre en clave de la app (ver [Versionado](#-versionado-y-actualizaciones)).
  * `sw.js`: estrategias de caché de la PWA y manejo del ciclo de actualización.
  * El registro del Service Worker es un `<script>` al final de `index.html`, con exclusión de entornos de desarrollo local.
  * `/pages/`: fragmentos HTML de las vistas, modales y componentes, enumerados en `pages/manifest.json`. En desarrollo se cargan por separado; en el build se incrustan dentro de `index.html`.
  * `/styles/`: CSS organizado en `base/` (reset, fuentes, temas y variables), `components/` y `layouts/`, unificados desde `main.css`.
  * `/assets/`: fuentes, íconos, íconos propios (`lerma-icons/`) y capturas.
  * `/scripts/`: lógica JavaScript modularizada (ver abajo).
* `/docs/`: documentación técnica del proyecto.
* `build.js`: script de compilación que genera `dist/` (ver [Build y optimización](#-build-y-optimización)).
* `package.json`: dependencias de desarrollo y comandos (`dev`, `build`, `preview`).
* `/.github/workflows/`: workflows de despliegue a `beta` y `prod`.
* `/dist/`: resultado del build. Se genera solo y **no se sube al repositorio**.

### Módulos de JavaScript (`/app/scripts/modules/`)

| Carpeta | Contenido |
|---|---|
| `core/` | Arranque y recepción de archivos compartidos (`share_target.js`) |
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

## 🧱 Build y optimización

Lo que se publica es `dist/`, generado por `build.js` a partir de `app/` (que no se modifica):

```bash
npm run dev       # servidor de desarrollo sobre app/
npm run build     # genera dist/
npm run preview   # sirve dist/ en http://localhost:4173
```

El build hace lo siguiente:

| Paso | Resultado |
|---|---|
| JS | `app.js`, sus módulos e `icons.js` se unen en **un solo** `scripts/app.js` minificado. `sw.js` se minifica aparte (el navegador lo pide directo). |
| Iconos | Los SVG de `assets/lerma-icons/` se incrustan en `app.js` para el componente `<l-icon>`. |
| CSS | Los `@import` de `styles/main.css` se unen en **un solo** `styles/main.css` minificado. |
| HTML | Las vistas de `pages/` se incrustan dentro de `index.html`. Los `<l-icon>` estáticos pasan a `<svg>` directo (se dejan como `<l-icon>` los que tienen `id`, porque el JS les cambia el `name`). Se precargan las fuentes y se minifica. |
| JSON | `manifest.json` y demás se minifican. |

> El `index.html` de `app/` puede conservar sus etiquetas `<script>` de desarrollo: el build quita las que ya no hacen falta en `dist/`.

## 🔢 Versionado y actualizaciones

La versión vive en `app/manifest.json` (los campos `version` y `codename` son extra: los navegadores ignoran lo que no conocen, así que no afectan a la instalación de la PWA):

```json
{ "version": "2.0.5", "codename": "tasmania" }
```

La actualización de la PWA depende de que la versión cambie: `sw.js` define `CACHE_NAME` (hoy `"v2.0.5"`). Al cambiarlo, el navegador detecta un Service Worker nuevo y descarta la caché anterior. Mantén `CACHE_NAME` alineado con la `version` de `manifest.json` en cada release.

## 🔄 Ciclo de Actualización (Skip Waiting)

Para forzar la actualización del Service Worker cuando hay cambios críticos:

1. El navegador detecta un nuevo Service Worker en espera.
2. `banner-updates.js` muestra un aviso en el DOM.
3. Al aceptar, se envía al worker en espera el mensaje `{ action: "skipWaiting" }`.
4. `sw.js` recibe el mensaje y ejecuta `self.skipWaiting()` para activar el nuevo worker de inmediato.

---

## 🌎 Flujo de Despliegue (GitHub Actions)

El despliegue lo hacen dos workflows en `.github/workflows/`. Ambos instalan dependencias (`npm ci`), compilan (`npm run build`) y publican **solo el contenido de `dist/`** en la raíz de una rama, de modo que cada proveedor lee `index.html` directamente ahí. No se suben documentación, scripts ni archivos de desarrollo.

* **Entorno Beta (GitHub Pages):** `deploy-beta.yml` se ejecuta automáticamente al hacer push a `main` (o a mano desde la pestaña *Actions*) y publica `dist/` en la rama `beta`.
* **Entorno de Producción (Netlify):** `deploy-prod.yml` se ejecuta **solo a mano** desde la pestaña *Actions* ("Run workflow") y publica `dist/` en la rama `prod`. No usa tags ni crea releases.

> Los workflows reescriben las ramas `beta` y `prod` completas en cada despliegue (`force_orphan`), por lo que no conservan historial. No edites código en ellas.

Antes de publicar una versión, sube el número en `app/manifest.json` y en `CACHE_NAME` de `app/sw.js`, para que los usuarios con el Service Worker instalado reciban la actualización.