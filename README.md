# 🎵 Local Tunes — Modern Web Music Player (PWA)

Un reproductor de música web de alto rendimiento diseñado para gestionar librerías masivas de forma local, local-first y 100% libre de publicidad o telemetría.

## 🌐 Accede a la Aplicación & Descargas

<a href="https://local-tunes.netlify.app">
  <img src="https://img.shields.io/badge/Get_it_on-Netlify-00ad9f?style=for-the-badge&logo=netlify&logoColor=white" alt="Get it on Netlify">
</a>

<a href="https://lerma-dev.github.io/local-tunes/">
  <img src="https://img.shields.io/badge/Get_it_on-GitHub_Pages-bc13fe?style=for-the-badge&logo=github&logoColor=white" alt="Get it on GitHub Pages">
</a>

<a href="https://github.com/lerma-dev/local-tunes-desktop/releases/download/v1.0.0/local-tunes-v1.0.0-Universal.exe">
  <img src="https://img.shields.io/badge/Dowload_for-WINDOWS-0078D4?style=for-the-badge&logoColor=white&labelColor=555555" alt="Download for Windows">
</a>

---

- 🚀 **Producción (Estable):** Rama `prod` (Desplegado automáticamente en `Netlify`).
- 🧪 **Beta (Experimental):** Rama `beta` (Desplegado automáticamente en `GitHub Pages`).

> <br> ⚡ **Entorno Local Automatizado:**
> El script `register_sw.js` detecta automáticamente mediante el `hostname` si estás trabajando en un entorno de desarrollo local (`localhost`, `127.0.0.1`, etc.) para deshabilitar el Service Worker en tiempo de ejecución. **Ya no es necesario comentar la etiqueta script.**
> <br>

---

## 🚀 Características Principales

- **Alto Rendimiento:** Implementación de **Virtual Scrolling** (Intersection Observer) para renderizar miles de canciones con 0% de lag.
- **Persistencia Local:** Base de datos **IndexedDB** para almacenar metadatos. Tu librería carga al instante desde el primer segundo.
- **Carga por Directorios:** Integración con **`webkitdirectory`** para importar colecciones y carpetas completas de música locales de forma inmediata.
- **Privacidad Absoluta:** Filosofía _local-first_. Todo el procesamiento ocurre de forma interna en el navegador; ningún dato o archivo se transfiere a servidores externos.
- **Experiencia de Usuario Avanzada:**
  - Visualizador de audio en tiempo real basado en frecuencias.
  - Sistema de favoritos persistente.
  - Buscador inteligente e instantáneo.
  - Animaciones de texto (Marquee) dinámicas para títulos largos.
- **Ecosistema PWA:** Completamente instalable como aplicación nativa en Android y entornos de escritorio.

## 🛠️ Tecnologías Utilizadas

- **Vanilla JS:** Código limpio y directo, sin frameworks pesados para garantizar la máxima velocidad de ejecución.
- **IndexedDB:** Almacenamiento NoSQL nativo del navegador.
- **Web Audio API:** Procesamiento avanzado de sonido y ecualización.
- **CSS3 Moderno:** UI responsiva con variables nativas y soporte completo para modo oscuro.

---

## 📦 Entorno de Desarrollo Local

### 1. Clonar el repositorio

```bash
git clone https://github.com/lerma-dev/local-tunes.git
cd local-tunes
code .
```

### Pre-requisitos

> [!IMPORTANT]
> Antes de iniciar, necesitas tener instalado **Python 3**. Si no lo tienes, lo puedes instalar rápidamente con un solo comando desde tu terminal:
>
> - **Windows:**
>   `winget install Python.Python.3`
> - **Linux (Ubuntu/Debian):**
>   `sudo apt update && sudo apt install -y python3`
> - **macOS (Homebrew):**
>   `brew install python`

**Verifica que se instaló correctamente:**

```bash
# Para Linux/MacOS
python3 --version
# Para Windows
py --version
```

---

### 2. Inicia el servidor según tu sistema operativo:

- **Windows (CMD)**

```bash
start_app
```

- **Windows (Git Bash / PowerShell)**

```bash
./start_app.sh
# O tambien
./start_app.bat
```

- **Linux / macOS**
  Asegúrate de dar permisos de ejecución la primera vez:

```bash
chmod +x start_app.sh
./start_app.sh
```

### 3. Método Manual (Python)

- **Si prefieres no usar scripts, ejecuta el servidor nativo:**

**En windows**

```bash
py -m http.server 3300 --directory app
```

**En Mac/linux**

```bash
python3 -m http.server 3300 --directory app
```

### 4. Accede a la App:

Abre tu navegador en http://localhost:3300.

> **Nota:** Los scripts `.bat` y `.sh` lanzarán la aplicación directamente en http://localhost:3300. Los logs del servidor se guardan automáticamente en un archivo `server.log`; si prefieres ver la salida en tiempo real en la terminal, puedes ejecutar el comando manualmente.

---

## 🤝 Contribuir

Las contribuciones se reciben **solo mediante Pull Request** hacia la rama `main`. Lee la guía completa en [CONTRIBUTING.md](CONTRIBUTING.md). Solo el mantenedor crea tags, releases y despliegues a `beta` y `prod`.

Para reportar un fallo o sugerir una idea sin código, abre un Issue o escribe en el portal: **lermatech.onrender.com**.

## 🖥️ Versión de escritorio

Local Tunes también tiene una app nativa para Windows que embebe esta interfaz web: [lerma-dev/local-tunes-desktop](https://github.com/lerma-dev/local-tunes-desktop). Si quieres trabajar en ella en modo Debug, necesitas tener este servidor corriendo en el puerto `3300`.

## 📄 Licencia

Copyright © 2026 lerma.dev (Héctor Lerma). **Todos los derechos reservados.**

El código puede visualizarse y hacerse *fork* únicamente con fines de estudio personal, aprendizaje y para proponer contribuciones mediante Pull Request. Está prohibida su distribución, su uso comercial, su redistribución modificada y la publicación de releases o instaladores. Consulta los detalles completos en [LICENSE.md](LICENSE.md).

© 2026 lerma-dev (Héctor Lerma)