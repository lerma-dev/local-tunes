# 🤝 Contribuyendo a Local Tunes

¡Gracias por querer mejorar el reproductor! Para mantener la estabilidad en los entornos de producción y pruebas, seguimos un flujo de trabajo basado en una rama central de desarrollo y ramas de despliegue automatizadas.

## 🌿 Estructura de Ramas

* **`main`**: Rama principal de desarrollo. Contiene todo el código fuente, scripts de entorno y documentación (`docs/`, `README.md`, etc.). **Todos los Pull Requests deben apuntar aquí.**
* **`beta` (Solo Lectura - GitHub Pages)**: Rama de despliegue para pruebas experimentales. Es un *subtree* de la carpeta `app`. **Protegida.**
* **`prod` (Solo Lectura - Netlify)**: Rama de despliegue estable para producción. Es un *subtree* de la carpeta `app`. **Protegida.**

> [!IMPORTANT]
> Las ramas `beta` y `prod` son de **solo lectura** para los colaboradores y se gestionan exclusivamente mediante los scripts de despliegue del Administrador. No abras Pull Requests hacia ellas.
## 🛠️ ¿Cómo colaborar?

1.  **Haz un Fork** del proyecto.
2. **Crea una rama de trabajo** a partir de `main`:
```bash
git checkout main
git checkout -b feat/mi-nueva-mejora
```
3.  **Realiza tus cambios** respetando la estética *Dark Modern* (acentos `#bc13fe`).
4.  **Abre un Pull Request (PR)** apuntando siempre a la rama main del repositorio original.

## Guía de Estilo
* **Vanilla JS:** Código limpio, modular y directo. Evita añadir librerías o dependencias externas pesadas.

* **Diseño Responsivo:** Enfoque Mobile-First para asegurar que la interfaz se adapte perfectamente tanto a smartphones como a resoluciones de escritorio.

* **Service Worker Seguro:** Verifica que tus modificaciones no interfieran con la lógica de detección de entornos locales en register_sw.js.