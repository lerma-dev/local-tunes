// scripts/modules/components/settings.js
import { state } from "../utils/state.js";
import { setTheme, getStoredTheme } from "../utils/theme.js";
import { setMode, getStoredMode, syncModeIcon } from "../utils/mode.js";
import {
  aplicarDiseñoCompleto,
  sincronizarFondoConCSharp,
} from "../core/windows.core.js";
import {
  exportBackup,
  importBackup,
  checkBackupReminder,
  checkVersionChange,
} from "../utils/backup.js";
import { initVersionApp } from "../utils/version_app.js";
import { agregarToast } from "./toast.js";
import { showModal } from "./modal.js";
let settingsInitialized = false;
let lockedScrollTop = 0;
let hideSectionTimeout = null;
// Debe coincidir con la transición más larga del panel (.settings-panel: 0.38s)
const CLOSE_ANIM_MS = 400;

function lockBodyScroll() {
  const appEl = document.getElementById("app");
  if (!appEl) return;
  lockedScrollTop = appEl.scrollTop;
  appEl.classList.add('no-scroll');
}

function unlockBodyScroll() {
  const appEl = document.getElementById("app");
  if (!appEl) return;
  appEl.classList.remove('no-scroll');
  appEl.scrollTop = lockedScrollTop;
}

function showSettingsSection() {
  const section = document.getElementById("settings_section");
  if (!section) return;
  if (hideSectionTimeout) {
    clearTimeout(hideSectionTimeout);
    hideSectionTimeout = null;
  }
  section.style.display = "block";
}

function hideSettingsSectionAfterAnim() {
  const section = document.getElementById("settings_section");
  if (!section) return;
  if (hideSectionTimeout) clearTimeout(hideSectionTimeout);
  hideSectionTimeout = setTimeout(() => {
    section.style.display = "none";
    hideSectionTimeout = null;
  }, CLOSE_ANIM_MS);
}

function openSettings() {
  showSettingsSection();
  document.getElementById("settings-panel").classList.add("is-open");
  document.getElementById("settings-overlay").classList.add("is-open");
  // Bloquea el scroll del fondo
  lockBodyScroll();
}
export function openSettingsHandler() {
  showSettingsSection();
  document.getElementById("settings-panel").classList.add("is-open");
  document.getElementById("settings-overlay").classList.add("is-open");
  lockBodyScroll();
  checkBackupReminder();
  checkVersionChange();
}

export function initSettings() {
  const titlebarRow = document.getElementById("setting-titlebar-style");
  const titlebarDropdown = document.getElementById("titlebar-style-dropdown");
  const panel = document.getElementById("settings-panel");
  const overlay = document.getElementById("settings-overlay");
  const closeBtn = document.getElementById("settings-close-btn");
  const libraryBtn = document.getElementById("btn_settings_library");
  const aboutMeBtn = document.getElementById("btn_settings_aboutMe");

  window.abrirAjustes = openSettingsHandler;

  initVersionApp();

  if (settingsInitialized) return;
  settingsInitialized = true;

  const sidebarBtn = document.getElementById("setting-btn-sidebar");
  if (sidebarBtn) {
    sidebarBtn.removeEventListener("click", openSettingsHandler);
    sidebarBtn.addEventListener("click", (e) => {
      e.stopImmediatePropagation();
      openSettingsHandler();
    });
  }

  // -- Boton de biblioteca
  libraryBtn.addEventListener("click", () => {
    agregarToast({
      tipo: "Info",
      titulo: "¿Problemas para compartir?",
      descripcion: "La función de compartir archivos en Windows funciona mejor en Microsoft Edge. Si usas otro navegador, usa el botón de importar en la pantalla principal.",
      autoClose: true,
    });
  });

  // -- Boton de acerca de 
  aboutMeBtn.addEventListener("click", () => {
    const version = localStorage.getItem("appVersion") || "0.0.0";
    showModal({
      title: `
      <div text-align: center; display: flex; align-item: center; justify-content: center; gap:4px;>
        <img src='./assets/icons/favicon.svg' alt="icono" style='width: 30px; height: 30px;'>
        Acerca de Local Tunes
      </div>
      `,
      message: `
          <p>Versión: <strong>${version}</strong></p>
          <p style="margin-top: 10px; font-size: 0.9em; opacity: 0.8;">
            © 2026 Hector Lerma. Todos los derechos reservados.
          </p>
          <p style="margin-top: 15px; font-size: 0.85em;">
            Software de propiedad intelectual de Hector Lerma. 
            Uso permitido únicamente para fines de estudio personal y aprendizaje.
          </p>
      `,
      buttons: [
        {
          text: "Cerrar",
          action: null
        }
      ]
    });
  });

  // --- Botón de móvil ---
  const mobileBtn = document.getElementById("settings-btn");
  if (mobileBtn) {
    mobileBtn.removeEventListener("click", openSettingsHandler);
    mobileBtn.addEventListener("click", (e) => {
      e.stopImmediatePropagation();
      openSettingsHandler();
    });
  }

  // --- Cierre y Teclas ---
  function closeSettings() {
    panel.classList.remove("is-open");
    overlay.classList.remove("is-open");
    unlockBodyScroll();
    hideSettingsSectionAfterAnim();
  }
  window.closeSettingsPanel = closeSettings;

  closeBtn.addEventListener("click", closeSettings);
  overlay.addEventListener("click", closeSettings);

  document.addEventListener("keydown", (e) => {
    if (e.altKey && e.key.toLowerCase() === "s") {
      e.preventDefault();
      openSettings();  
    }
    if (e.key === "Escape") {
      closeSettings();
    }
  });

  // --- Toggle: Tema (usa theme.js para leer/guardar) ---
  const toggleTheme = document.getElementById("toggle-theme");
  const themeIcon = document.getElementById("theme-icon");

  const isDarkOnLoad = getStoredTheme() !== "light";
  toggleTheme.checked = isDarkOnLoad;
  themeIcon.setAttribute("name", isDarkOnLoad ? "mode-dark" : "mode-ligth");

  toggleTheme.addEventListener("change", () => {
    const isDark = toggleTheme.checked;
    setTheme(isDark ? "dark" : "light");
    themeIcon.setAttribute("name", isDark ? "mode-dark" : "mode-ligth");
    sincronizarFondoConCSharp();
  });


  state.playMode = getStoredMode();
  syncModeIcon();

  // --- Respaldo: Dropdown custom ---
  const backupRow = document.getElementById("backup-row");
  const backupDropdown = document.getElementById("backup-dropdown");
  const importFileInput = document.getElementById("import-file-input");

  function openBackupDropdown() {
    backupRow.classList.add("is-open");
    backupDropdown.classList.add("is-open");
    backupDropdown.setAttribute("aria-hidden", "false");
  }

  function closeBackupDropdown() {
    backupRow.classList.remove("is-open");
    backupDropdown.classList.remove("is-open");
    backupDropdown.setAttribute("aria-hidden", "true");
  }

  backupRow.addEventListener("click", (e) => {
    if (e.target.closest(".backup-option")) return;
    backupDropdown.classList.contains("is-open")
      ? closeBackupDropdown()
      : openBackupDropdown();
  });

  backupDropdown.querySelectorAll(".backup-option").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const action = btn.dataset.action;
      closeBackupDropdown();
      if (action === "export") {
        await exportBackup();
      } else if (action === "import") {
        importFileInput.click();
      }
    });
  });

  importFileInput.addEventListener("change", async () => {
    const file = importFileInput.files[0];
    if (!file) return;
    await importBackup(file);
    importFileInput.value = "";
  });

  document.addEventListener("click", (e) => {
    if (!backupRow.contains(e.target)) closeBackupDropdown();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeBackupDropdown();
  });

  // --- Toggle: Aleatorio ---
  const toggleShuffle = document.getElementById("toggle-shuffle");
  toggleShuffle.checked = state.playMode === "shuffle";

  toggleShuffle.addEventListener("change", () => {
    const icon = document.getElementById("mode-icon");
    if (toggleShuffle.checked) {
      state.playMode = "shuffle";
      if (toggleRepeat.checked) toggleRepeat.checked = false;
      if (icon) icon.setAttribute("name", "shuffle");
    } else {
      state.playMode = "list";
      if (icon) icon.setAttribute("name", "repeat");
    }
    setMode(state.playMode);
    syncModeIcon();
  });

  // --- Toggle: Repetir ---
  const toggleRepeat = document.getElementById("toggle-repeat");
  toggleRepeat.checked = state.playMode === "repeat-one";

  toggleRepeat.addEventListener("change", () => {
    const icon = document.getElementById("mode-icon");
    if (toggleRepeat.checked) {
      state.playMode = "repeat-one";
      if (toggleShuffle.checked) toggleShuffle.checked = false;
      if (icon) icon.setAttribute("name", "repeat-one");
    } else {
      state.playMode = "list";
      if (icon) icon.setAttribute("name", "repeat");
    }
    setMode(state.playMode);
    syncModeIcon();
  });

  // --- Botón Ecualizador en Ajustes ---
  const eqRow = [...document.querySelectorAll(".settings-row")].find(
    (row) =>
      row.querySelector(".settings-row__label")?.textContent.trim() ===
      "Ecualizador",
  );
  if (eqRow) {
    eqRow.addEventListener("click", () => {
      closeSettings();
      setTimeout(() => {
        import("./equalizer-ui.js").then(({ toggleEQPanel }) =>
          toggleEQPanel(),
        );
      }, 350);
    });
  }

  // --- SELECCIÓN DE ESTILO DE BARRA DE TÍTULO ---
  if (titlebarRow && titlebarDropdown) {
    const esDesarrollo =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";

    // 🚀 CORREGIDO: Detección nativa del motor WebView2 (.NET)
    const esAppNativa = window.chrome?.webview !== undefined;

    // Si no estamos en web local ni corriendo en el cascarón de Windows, se oculta la fila
    if (!esDesarrollo && !esAppNativa) {
      titlebarRow.style.display = "none";
    }

    function openTitlebarDropdown() {
      titlebarRow.classList.add("is-open");
      titlebarDropdown.classList.add("is-open");
      titlebarDropdown.setAttribute("aria-hidden", "false");
    }

    function closeTitlebarDropdown() {
      titlebarRow.classList.remove("is-open");
      titlebarDropdown.classList.remove("is-open");
      titlebarDropdown.setAttribute("aria-hidden", "true");
    }

    titlebarRow.addEventListener("click", (e) => {
      if (e.target.closest(".titlebar-style-option")) return;
      titlebarDropdown.classList.contains("is-open")
        ? closeTitlebarDropdown()
        : openTitlebarDropdown();
    });

    // CONTROL DEL CLICK EN LAS OPCIONES
    titlebarDropdown
      .querySelectorAll(".titlebar-style-option")
      .forEach((btn) => {
        btn.addEventListener("click", () => {
          const estiloSeleccionado = btn.dataset.style;
          closeTitlebarDropdown();

          // Guardar preferencia
          localStorage.setItem("titlebar", estiloSeleccionado);

          // Ejecutar el cambio visual e informar a C# de inmediato
          aplicarDiseñoCompleto(estiloSeleccionado);
        });
      });

    document.addEventListener("click", (e) => {
      if (!titlebarRow.contains(e.target)) closeTitlebarDropdown();
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeTitlebarDropdown();
    });
  }
}
