export const initVersionApp = () => {
  /*
    Obtener version de localStorage para mostrarla en ajustes
    y en localhost muestra 0.0.0 para marcar que es modo desarrollo
    Determinar canal de la app según el hostname
  */
  const tag_version = document.getElementById("version_app");
  const hostname = window.location.hostname;
  const isLocal =
    hostname === "music.test" ||
    hostname === "localhost" ||
    hostname === "127.0.0.1";

  const appendWaterMark = (text) => {
    // Crear marca de agua para Beta y Dev
    const badge = document.createElement("span");
    badge.className = "waterMark";
    badge.textContent = text;
    document.body.appendChild(badge);
  };

  // Función interna para actualizar el texto
  const updateDisplay = (version) => {
    let appChannel = "Stable";

    if (hostname.includes("github.io")) {
      appChannel = "Beta";
      appendWaterMark(`Beta v${version}`);
    } else if (isLocal) {
      appChannel = "Dev";
      appendWaterMark("Dev Mode");
    }

    if (tag_version) {
      tag_version.textContent = `Mi Música v${version} (${appChannel})`;
    }
  };

  // 1. Carga inicial
  const appVersion = localStorage.getItem("appVersion") ?? "0.0.0";
  updateDisplay(appVersion);

  // 2. Listener para actualizar cuando el Service Worker responda
  window.addEventListener("versionUpdated", (event) => {
    const newVersion = event.detail;
    updateDisplay(newVersion);
  });
};
