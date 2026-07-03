// scripts/modules/core/windows.core.js
let isDesktop = false;
let titlebar = null;
let isMaximized = false;
let clickInBar = false;
let isDragging = false;
let isMouseDown = false;
let dragSent = false;
let startX, startY;

function sendCommand(accion) {
  if (window.chrome?.webview?.postMessage) {
    const payload = JSON.stringify({ action: accion });
    window.chrome.webview.postMessage(payload);
    console.log("Comando Enviado:", payload);
  } else {
    console.warn("WebView2 no disponible para enviar:", accion);
  }
}

function renderTitleBar() {
  titlebar = document.getElementById("desktop-titlebar");
  if (!titlebar) return;

  const actionText = isMaximized ? "Restore" : "Maximize";
  const iconName = isMaximized ? "restore" : "maximize";

  titlebar.innerHTML = `
  <div class="title-container">
    <img src="./assets/icons/favicon.ico" class="logo-titlebar" alt="Logo" /> 
    <div class="title">Local Tunes</div>
  </div>
  <div class="window-controls">
    <button onclick="window.abrirAjustes()" class="ctrl-btn btn-settings" title="Ajustes (Alt + S)">
      <l-icon name="settings-outline"></l-icon>
    </button>
    <div class="line"></div>
    <button onclick="window.sendCommand('minimize')" class="ctrl-btn btn-minimize" title="Minimize">
      <l-icon name="chevron-down"></l-icon>
    </button>
    <button onclick="toggleMaximize()" class="ctrl-btn btn-maximize" title="${actionText}">
      <l-icon name="${iconName}"></l-icon>
    </button>
    <button onclick="window.sendCommand('close')" class="ctrl-btn btn-close" title="Close">
      <l-icon name="close"></l-icon>
    </button>
  </div>
  `;
}

function toggleMaximize() {
  isMaximized = !isMaximized;
  window.sendCommand("maximize");
  renderTitleBar();
}

export function sincronizarFondoConCSharp() {
  const estiloComputado = getComputedStyle(document.documentElement);
  const colorBgHex = estiloComputado
    .getPropertyValue("--bg-titlebar-custom")
    .trim();

  if (window.chrome?.webview?.postMessage) {
    window.chrome.webview.postMessage(
      JSON.stringify({
        action: "sync_background_color",
        color: colorBgHex,
      }),
    );
  }
}

export function initTitlebar() {
  window.sendCommand = sendCommand;
  window.toggleMaximize = toggleMaximize;
  renderTitleBar();
  document.addEventListener("mouseup", () => {
    isMouseDown = false;
    isDragging = false;
    dragSent = false; // Reset total al soltar el botón
  });
  document.addEventListener("click", (e) => {
    // Si estamos arrastrando, no cerramos
    if (isDragging) return;

    if (window.chrome?.webview?.postMessage) {
      sendCommand("close_menu");
    }
  });
  if (titlebar) {
    titlebar.classList.remove("custom", "native");
    titlebar.addEventListener("mousedown", (e) => {
      if (e.target.closest(".ctrl-btn") || e.target.closest(".logo-titlebar"))
        return;
      if (e.button !== 0) return;

      isMouseDown = true; // Empezó la presión
      isDragging = false;
      startX = e.clientX;
      startY = e.clientY;
    });

    titlebar.addEventListener("mousemove", (e) => {
      // Si movemos el mouse más de 5px, entonces es un arrastre real
      if (isMouseDown && !dragSent) {
        if (
          Math.abs(e.clientX - startX) > 5 ||
          Math.abs(e.clientY - startY) > 5
        ) {
          isDragging = true;
          dragSent = true; // Bloquea cualquier otro envío hasta el próximo mousedown
          sendCommand("start_drag");
        }
      }
    });

    titlebar.addEventListener("mouseup", () => {
      isMouseDown = false;
      isDragging = false;
    });

    titlebar.addEventListener("contextmenu", (e) => {
      if (e.target.closest(".ctrl-btn") || e.target.closest(".logo-titlebar")) {
        return;
      }
      e.preventDefault();

      if (window.chrome?.webview?.postMessage) {
        const payload = JSON.stringify({
          action: "show_system_menu",
          screenX: e.screenX,
          screenY: e.screenY,
        });
        window.chrome.webview.postMessage(payload);
      }
    });
  }

  // Detectamos si estamos dentro del WebView2 de Microsoft
  if (window.chrome?.webview) {
    window.modeDesktopActive = () => {
      isDesktop = true;

      const settingsPanel = document.getElementById("setting-titlebar-style");
      if (settingsPanel) settingsPanel.style.display = "flex";

      const diseñoGuardado = localStorage.getItem("titlebar") || "custom";
      const verificarWebview = () => {
        const sidebarBottom = document.getElementById("sidebar-bottom");

        if (sidebarBottom) {
          aplicarDiseñoCompleto(diseñoGuardado);
          clearInterval(intentoSincronizacion);
        }
      };
      verificarWebview();

      const intentoSincronizacion = setInterval(verificarWebview, 30);
      setTimeout(() => clearInterval(intentoSincronizacion), 1500);
    };
  } else {
    const verificarWeb = () => {
      const sidebarBottom = document.getElementById("sidebar-bottom");
      if (sidebarBottom) {
        sidebarBottom.style.display = "flex";
        clearInterval(intentoWeb);
      }
    };
    verificarWeb();
    const intentoWeb = setInterval(verificarWeb, 30);
    setTimeout(() => clearInterval(intentoWeb), 1000);
  }
}

function actualizarModoUI(isCustom) {
  const root = document.getElementById("footer-settings");
  root.classList.toggle("is-custom-bar", isCustom);
}

export function aplicarDiseñoCompleto(estilo) {
  if (!titlebar) {
    titlebar = document.getElementById("desktop-titlebar");
    if (!titlebar) return;
  }

  localStorage.setItem("titlebar", estilo);
  const sidebarBottom = document.getElementById("sidebar-bottom");
  const settingBtn = document.getElementById("settings-btn");

  if (estilo === "native") {
    titlebar.classList.remove("custom", "native");
    titlebar.style.display = "none";

    if (sidebarBottom) {
      sidebarBottom.style.display = "flex";
    }
    if (settingBtn) {
      settingBtn.style.display = "flex";
    }

    sendCommand("native_bar");
    actualizarModoUI(false);
    return;
  }

  sendCommand("custom_bar");
  actualizarModoUI(true);

  titlebar.style.display = "flex";
  if (sidebarBottom) {
    sidebarBottom.style.display = "none";
  }

  if (settingBtn) {
    settingBtn.style.display = "none";
  }

  titlebar.classList.remove("custom", "native");
  titlebar.classList.add(estilo);
}
