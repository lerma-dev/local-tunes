// build.js
// ---------------------------------------------------------------------------
// Genera ./dist a partir de ./app con todo optimizado. La carpeta app/ NO se toca.
//
//   npm run build
//
// Resumen de lo que hace:
//   1. Copia app/ a dist/
//   2. JS   -> un solo app.js (módulos + icons.js + iconos SVG incrustados)
//   3. CSS  -> un solo main.css (une los @import) y adapta los selectores de iconos
//   4. HTML -> mete las vistas de pages/ dentro de index.html, cambia los
//              <l-icon> estáticos por <svg>, precarga las fuentes y minifica
//   5. JSON -> minifica manifest.json
// ---------------------------------------------------------------------------

import { build } from "esbuild";
import { minify as minifyHTML } from "html-minifier-terser";
import { cp, rm, mkdir, readFile, writeFile, readdir } from "node:fs/promises";
import path from "node:path";

// ── Rutas ───────────────────────────────────────────────────────────────────
const SRC = "app";
const OUT = "dist";

const src = (...parts) => path.join(SRC, ...parts);
const out = (...parts) => path.join(OUT, ...parts);

// ── Utilidades ──────────────────────────────────────────────────────────────

/** Lista todos los archivos de una carpeta, incluyendo subcarpetas. */
async function walk(dir) {
  const files = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(fullPath)));
    else files.push(fullPath);
  }
  return files;
}

/** Borra un archivo o carpeta sin quejarse si no existe. */
const remove = (target) => rm(target, { recursive: true, force: true });

// ── Iconos ──────────────────────────────────────────────────────────────────

/**
 * Lee assets/lerma-icons/*.svg y devuelve dos mapas { nombre: ... }:
 *   - dataUris: "data:image/svg+xml,..." para el componente <l-icon> (dentro de app.js)
 *   - inline:   { viewBox, inner } para pegar un <svg> directo en el HTML
 */
async function readIcons() {
  const dataUris = {};
  const inline = {};
  const dir = src("assets/lerma-icons");

  for (const file of await readdir(dir)) {
    if (!file.endsWith(".svg")) continue;
    const name = file.slice(0, -4);

    const svg = (await readFile(path.join(dir, file), "utf8"))
      .replace(/^<\?xml[^>]*\?>/, "") // quita el prólogo <?xml ... ?>
      .replace(/\s+/g, " ")
      .trim();

    dataUris[name] = "data:image/svg+xml," + encodeURIComponent(svg);

    // Separa <svg ...> contenido </svg> (sin class/width/height propios)
    const match = svg.match(/^<svg\b([^>]*)>([\s\S]*)<\/svg>$/);
    const viewBox = match && match[1].match(/viewBox="([^"]+)"/);
    if (match && viewBox) {
      inline[name] = {
        viewBox: viewBox[1],
        inner: match[2], 
      };
    }
  }
  return { dataUris, inline };
}

// ── JS ──────────────────────────────────────────────────────────────────────

/**
 * app.js + todos sus módulos + icons.js -> UN solo archivo.
 * Los import() dinámicos de módulos ya incluidos quedan resueltos dentro del bundle.
 */
async function buildAppBundle(dataUris) {
  await build({
    // icons.js se mete siempre (define <l-icon>), aunque app.js no lo importe
    stdin: {
      contents: 'import "./icons.js"; import "./app.js";',
      resolveDir: src("scripts"),
      loader: "js",
    },
    outfile: out("scripts/app.js"),
    bundle: true,
    splitting: false,
    minify: true,
    format: "esm", // index.html lo carga con type="module"
    target: "es2020",
    legalComments: "none",
    define: {
      __PAGES_INLINED__: "true", // el loader ya no hace fetch de pages/
      __ICONS__: JSON.stringify(dataUris), // <l-icon> usa los SVG incrustados
    },
  });
}

/** sw.js y register_sw.js son archivos propios: se minifican sin empaquetar. */
async function buildServiceWorker() {
  await build({
    entryPoints: [src("sw.js")],
    outdir: OUT,
    outbase: SRC,
    minify: true,
    bundle: false,
    target: "es2020",
    legalComments: "none",
  });

  // icons.js ya no existe en dist: no puede estar en la lista de archivos a cachear
  const swPath = out("sw.js");
  const sw = (await readFile(swPath, "utf8"))
    .replace(/"\.\/scripts\/icons\.js",/, "")
    .replace(/,"\.\/scripts\/icons\.js"/, "");
  await writeFile(swPath, sw);
}

/** Quita de dist lo que ya viaja dentro de app.js. */
async function removeBundledFiles() {
  await remove(out("scripts/modules"));
  await remove(out("scripts/icons.js"));
  await remove(out("assets/lerma-icons"));
}

// ── CSS ─────────────────────────────────────────────────────────────────────

const HAS_L_ICON = /(?<![\w-])l-icon(?![\w-])/;
const ALL_L_ICON = /(?<![\w-])l-icon(?![\w-])/g;

// Una regla CSS cuyo selector contiene "l-icon": captura lo que va antes y el selector.
const RULE_WITH_L_ICON = /(^|[{};])([^{};@]*?(?<![\w-])l-icon(?![\w-])[^{};]*)\{/g;

/** Separa "a, b, c" en partes, respetando comas dentro de paréntesis. */
function splitSelectors(selector) {
  const parts = [];
  let depth = 0;
  let current = "";
  for (const ch of selector) {
    if (ch === "(") depth++;
    if (ch === ")") depth--;
    if (ch === "," && depth === 0) {
      parts.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  parts.push(current);
  return parts;
}

/**
 * Cada regla que apunta a <l-icon> se extiende también a <svg class="li">.
 *   .btn l-icon { ... }   ->   .btn l-icon, .btn svg:where(.li) { ... }
 * svg:where(.li) tiene la misma especificidad que l-icon, así que ninguna
 * regla cambia de prioridad.
 */
function expandIconSelectors(css) {
  return css.replace(RULE_WITH_L_ICON, (_match, before, selector) => {
    const expanded = splitSelectors(selector).flatMap((part) =>
      HAS_L_ICON.test(part) ? [part, part.replace(ALL_L_ICON, "svg:where(.li)")] : [part]
    );
    return before + expanded.join(",") + "{";
  });
}

/** Une los @import de main.css en un solo archivo minificado. */
async function buildCss() {
  await build({
    entryPoints: [src("styles/main.css")],
    outfile: out("styles/main.css"),
    bundle: true,
    minify: true,
    external: ["*.ttf", "*.woff", "*.woff2"],
    legalComments: "none",
  });

  const cssPath = out("styles/main.css");
  let css = await readFile(cssPath, "utf8");

  // fonts.css pasa de styles/base/ a styles/: la ruta relativa sube un nivel
  css = css.replaceAll("../../assets/", "../assets/");

  css = expandIconSelectors(css);

  // Estilo base de los <svg class="li">, equivalente al :host de <l-icon> (peso 0)
  css += ":where(svg.li){display:inline-block;width:1em;height:1em;vertical-align:middle;fill:currentColor}";

  await writeFile(cssPath, css);

  // Los CSS sueltos ya no hacen falta
  for (const dir of ["base", "components", "layouts"]) {
    await remove(out("styles", dir));
  }
}

// ── HTML ────────────────────────────────────────────────────────────────────

/** Pega las vistas de pages/ dentro de <div id="app">, en el orden de pages/manifest.json. */
async function inlinePages(html) {
  const names = JSON.parse(await readFile(src("pages/manifest.json"), "utf8"));
  const fragments = await Promise.all(
    names.map((name) => readFile(src("pages", `${name}.html`), "utf8"))
  );

  const placeholder = '<div id="app"></div>';
  if (!html.includes(placeholder)) {
    throw new Error(`No encontré ${placeholder} en index.html`);
  }
  return html.replace(placeholder, () => `<div id="app">${fragments.join("\n")}</div>`);
}

/**
 * <l-icon name="x"> estáticos -> <svg> directo.
 * Se dejan como <l-icon> los que tienen id: el JS les cambia el "name" mientras
 * la app corre (play/pausa, modo de reproducción, tema).
 */
function inlineStaticIcons(html, inlineIcons) {
  let count = 0;

  const result = html.replace(/<l-icon\b([^>]*)>\s*<\/l-icon>/g, (whole, attrs) => {
    if (/\bid\s*=/.test(attrs)) return whole;

    const name = (attrs.match(/\bname\s*=\s*"([^"]+)"/) || [])[1];
    const icon = name && inlineIcons[name];
    if (!icon) return whole;

    const className = (attrs.match(/\bclass\s*=\s*"([^"]*)"/) || [])[1];
    const otherAttrs = attrs
      .replace(/\bname\s*=\s*"[^"]*"/, "")
      .replace(/\bclass\s*=\s*"[^"]*"/, "")
      .trim();

    count++;
    const cls = `li${className ? " " + className : ""}`;
    const extra = otherAttrs ? " " + otherAttrs : "";
    return `<svg class="${cls}" viewBox="${icon.viewBox}" aria-hidden="true" focusable="false"${extra}>${icon.inner}</svg>`;
  });

  console.log(`  · ${count} <l-icon> reemplazados por <svg>`);
  return result;
}

/**
 * Fuentes: se borran los .ttf de dist si ya existe su .woff2, y se precargan
 * (si no, el navegador las descubre hasta terminar de leer el CSS).
 */
async function preloadFonts(html) {
  const fontsDir = out("assets/fonts");
  const files = await readdir(fontsDir).catch(() => []);

  for (const file of files.filter((f) => f.endsWith(".ttf"))) {
    if (files.includes(file.replace(/\.ttf$/, ".woff2"))) {
      await rm(path.join(fontsDir, file));
    }
  }

  const links = files
    .filter((f) => f.endsWith(".woff2"))
    .map((f) => `<link rel="preload" href="./assets/fonts/${f}" as="font" type="font/woff2" crossorigin>`)
    .join("");

  return links ? html.replace("</head>", links + "</head>") : html;
}

/** Arma index.html final (vistas + iconos + precarga de fuentes). */
async function buildIndexHtml(inlineIcons) {
  const indexPath = out("index.html");
  let html = await readFile(indexPath, "utf8");

  // icons.js ahora va dentro de app.js: se quita su <script>
  html = html.replace(/\s*<script[^>]*scripts\/icons\.js[^>]*><\/script>/, "");

  html = await inlinePages(html);
  html = inlineStaticIcons(html, inlineIcons);
  html = await preloadFonts(html);

  await writeFile(indexPath, html);
  await remove(out("pages")); // las vistas ya están dentro de index.html
}

/** Minifica todos los .html de dist. */
async function minifyHtmlFiles() {
  const files = (await walk(OUT)).filter((f) => f.endsWith(".html"));
  for (const file of files) {
    const minified = await minifyHTML(await readFile(file, "utf8"), {
      collapseWhitespace: true,
      conservativeCollapse: true, // deja 1 espacio donde hace falta (no pega textos inline)
      removeComments: true,
      minifyJS: true,
      minifyCSS: true,
    });
    await writeFile(file, minified);
  }
}

// ── JSON ────────────────────────────────────────────────────────────────────

/** Minifica manifest.json */
async function minifyJsonFiles() {
  const files = (await walk(OUT)).filter((f) => f.endsWith(".json"));
  for (const file of files) {
    const data = JSON.parse(await readFile(file, "utf8"));
    await writeFile(file, JSON.stringify(data));
  }
}

// ── Proceso completo ────────────────────────────────────────────────────────

// 1) Copiar todo tal cual; lo que se optimiza se sobreescribe después
await remove(OUT);
await mkdir(OUT, { recursive: true });
await cp(SRC, OUT, { recursive: true });

// 2) JS
const { dataUris, inline } = await readIcons();
await buildAppBundle(dataUris);
await buildServiceWorker();
await removeBundledFiles();

// 3) CSS
await buildCss();

// 4) HTML
await buildIndexHtml(inline);
await minifyHtmlFiles();

// 5) JSON
await minifyJsonFiles();

console.log("✔ Build listo en ./" + OUT);