# 🏗️ Guía de Desarrollo Técnico

Esta guía explica la arquitectura interna del reproductor y el flujo de integración continua para desarrolladores que deseen profundizar en la lógica del proyecto.

## 📁 Estructura de Archivos del Repositorio

* `/app/`: Contiene el código de la aplicación web que se despliega en producción y beta.
  * `/app/scripts/`: Lógica JavaScript modularizada.
  * `/app/sw.js`: Estrategias de caché de la PWA y manejo del ciclo de actualización.
  * `/app/register_sw.js`: Script de registro automatizado con exclusión de entornos de desarrollo.
* `/docs/`: Documentación técnica avanzada del proyecto.


## 🔊 Procesamiento & Reproducción de Audio
* **Escaner Local:** El reproductor no sube archivos a ningún servidor. Utiliza la API nativa de entrada con la propiedad **`webkitdirectory`** para mapear colecciones enteras de carpetas locales directamente hacia el navegador de forma instantánea.
* **Control de Audio Nativo:** La reproducción de las pistas se gestiona directamente utilizando el elemento nativo de HTML5 **`<audio>`**. Toda la lógica de eventos (reproducción, pausa, cambio de pista, tiempo transcurrido y control de volumen) se manipula mediante JavaScript manipulando las propiedades de este nodo multimedia. 

*Nota: La integración con Web Audio API queda reservada para futuras implementaciones de ecualización o efectos de sonido avanzados.*

## 💾 Persistencia de Datos (IndexedDB)
Para gestionar librerías masivas con rendimiento fluido se utiliza IndexedDB, estructurado en los siguientes almacenes:
* `folders`: Rutas de origen y nombres de los directorios importados por el usuario.
* `songs`: Metadatos completos y referencias binarias de las pistas indexadas.
* `settings`: Estado de las configuraciones y preferencias del reproductor.

## 🔄 Ciclo de Actualización (Skip Waiting)
Para forzar la actualización del Service Worker cuando hay cambios críticos:
1.  El SW detecta una nueva versión.
2.  Se muestra un aviso en el DOM.
3.  Al aceptar, se envía un mensaje `SKIP_WAITING` para activar el nuevo worker inmediatamente.

## 🌎 Flujo de Despliegue Limpio (Subtrees)
Para evitar subir archivos innecesarios de documentación o scripts de arranque al hosting, el despliegue a los servidores se realiza dividiendo el repositorio mediante comandos de árbol (`git subtree push`).

* **Entorno Beta (GitHub Pages):** Se toma únicamente el contenido de la carpeta `/app` y se empuja a la raíz de la rama `beta`.
* **Entorno de Producción (Netlify):** Se toma únicamente el contenido de la carpeta `/app` y se empuja a la raíz de la rama `prod`.

Esto permite que los proveedores de hosting lean el archivo `index.html` directamente en la raíz de sus respectivas ramas, garantizando cargas rápidas y una arquitectura de despliegue impecable.