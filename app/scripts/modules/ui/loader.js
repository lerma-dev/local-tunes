export async function loadViews() {
  // En el build (dist/) las vistas ya vienen dentro de index.html:
  // __PAGES_INLINED__ lo define build.js y este bloque se elimina al compilar.
  if (typeof __PAGES_INLINED__ !== 'undefined') return;

  // En desarrollo (app/) se cargan por separado desde pages/
  const app = document.getElementById('app');

  const manifest = await fetch('pages/manifest.json').then(r => r.json());

  const fetches = manifest.map(name =>
    fetch(`pages/${name}.html`).then(res => res.text())
  );

  const htmlFragments = await Promise.all(fetches);
  app.innerHTML = htmlFragments.join('\n');
}