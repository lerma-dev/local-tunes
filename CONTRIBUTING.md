# 🤝 Contribuyendo a Local Tunes

¡Gracias por querer mejorar el reproductor! Para mantener la estabilidad en los entornos de producción y pruebas, seguimos un flujo de trabajo basado en una rama central de desarrollo y ramas de despliegue automatizadas.

## 🌿 Estructura de Ramas

* **`main`**: Rama principal de desarrollo. Contiene todo el código fuente, scripts de entorno y documentación (`docs/`, `README.md`, etc.). **Todos los Pull Requests deben apuntar aquí.**
* **`beta` (Solo Lectura - GitHub Pages)**: Rama de despliegue para pruebas experimentales. Es un *subtree* de la carpeta `app`. **Protegida.**
* **`prod` (Solo Lectura - Netlify)**: Rama de despliegue estable para producción. Es un *subtree* de la carpeta `app`. **Protegida.**

> [!IMPORTANT]
> Las ramas `beta` y `prod` son de **solo lectura** para los colaboradores y se gestionan exclusivamente mediante los scripts de despliegue del Administrador. No abras Pull Requests hacia ellas.

## 🛠️ ¿Cómo colaborar?

1. **Haz un Fork** del proyecto.
2. **Prepara tu entorno local** siguiendo la sección *Entorno de Desarrollo Local* del [README](README.md) (necesitas Python 3 para levantar el servidor en el puerto 3300).
3. **Crea una rama de trabajo** a partir de `main`:

```bash
git checkout main
git checkout -b feat/mi-nueva-mejora
```

4. **Realiza tus cambios** respetando la estética *Dark Modern* (acentos `#bc13fe`).
5. **Abre un Pull Request (PR)** apuntando siempre a la rama `main` del repositorio original, completando la plantilla que aparece automáticamente.
6. **Espera la revisión del mantenedor.** Puede aceptar el PR, pedir ajustes o rechazarlo.

### Reglas importantes

* **No se hace push directo a `main`.** Todo cambio pasa por Pull Request y revisión.
* **No crees tags ni releases.** Solo el mantenedor los publica y gestiona los despliegues a `beta` y `prod`.
* **No envíes PRs con la sección de términos de contribución sin marcar.** No se aceptarán.

## 📜 Licencia y términos de contribución

Este proyecto es de **código visible con todos los derechos reservados** (consulta [LICENSE.md](LICENSE.md)). Al enviar un Pull Request:

* Declaras que eres el autor del código y que tienes derecho a aportarlo.
* **Conservas la titularidad** de tu contribución y puedes usarla por separado.
* Otorgas al autor del proyecto una licencia mundial, perpetua, irrevocable, no exclusiva y gratuita para usarla, modificarla, sublicenciarla y distribuirla como parte de Local Tunes, incluso con fines comerciales.
* Aceptas que el autor puede **relicenciar** el software, incluida tu contribución, bajo cualquier otra licencia, incluidas licencias de código abierto como MIT.
* No obtienes derechos sobre el resto del software ni puedes distribuirlo.

## 🐞 Reportar fallos y sugerencias

Si no vas a escribir código, puedes abrir un **Issue** en el repositorio o escribir en la sección de mensajes anónimos del portal oficial: **lermatech.onrender.com**.

## 📐 Guía de Estilo

* **Vanilla JS:** Código limpio, modular y directo. Evita añadir librerías o dependencias externas pesadas.
* **Diseño Responsivo:** Enfoque Mobile-First para asegurar que la interfaz se adapte perfectamente tanto a smartphones como a resoluciones de escritorio.
* **Service Worker Seguro:** Verifica que tus modificaciones no interfieran con la lógica de detección de entornos locales en `register_sw.js`.