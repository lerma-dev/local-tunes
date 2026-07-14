// app/scripts/modules/components/banner-desktop.js
import { showModal } from "./modal.js";

function toggleBannerVisibility() {
  const banner = document.getElementById("banner-desktop");
  if (!banner) return;

  const isDesktop =
    window.matchMedia("(min-width: 1024px)").matches &&
    !("ontouchstart" in window);
  const isMobile = window.matchMedia(
    "(min-width: 320px) and (max-width: 768px)",
  ).matches;
  const isStandalone = window.matchMedia("(display-mode: standalone)").matches;

  const closedTime = parseInt(localStorage.getItem("banner-closed"));
  const unDiaEnMs = 24 * 60 * 60 * 1000;
  if (closedTime && Date.now() - closedTime < unDiaEnMs) {
    banner.style.display = "none";
    return;
  }

  // Si no cumple las condiciones, ocultar
  if (!isDesktop || isMobile || isStandalone || window.chrome?.webview) {
    banner.style.display = "none";
  } else {
    // Si es desktop y no ha sido cerrado, mostrar
    banner.style.display = "flex";
  }
}

export const initDesktopBanner = () => {
  const banner = document.getElementById("banner-desktop");
  if (!banner) return;

  // Estructura simplificada
  banner.innerHTML = `
    <div class="content-info">
      <div class="icono">
        <l-icon name="desktop-outline"></l-icon>
      </div>
      <div>
        <div class="titulo">¿Prefieres la versión de escritorio?</div>
        <div class="descripcion">Instala nuestra app para una mejor experiencia local.  Haz Click Aquí</div>
      </div>
    </div>
    <button id="btn-close-banner" class="btn_close"> 
      <l-icon name="close"></l-icon> 
    </button>
  `;

  const closeBtn = document.getElementById("btn-close-banner");

  // El banner dispara el modal, pero EXCLUIMOS el botón de cerrar
  banner.addEventListener("click", (e) => {
    // Si el clic fue en el botón de cerrar, no hacemos nada (el listener de abajo lo maneja)
    if (e.target.closest("#btn-close-banner")) return;

    showModal({
      title: "Aviso de seguridad",
      message: `La descarga iniciará en un momento. 
        Windows podría mostrar una advertencia de <strong>'Editor desconocido'</strong>. 
        Para instalarla, haz clic en <strong>'Más información'</strong> y luego en <strong>'Ejecutar de todas formas'</strong>.`,
      buttons: [
        {
          text: "Descargar",
          action: () => {
            window.location.href =
              "https://github.com/lerma-dev/local-tunes/releases/download/v1.6.6/local_tunes_v1.6.6.exe";
          },
        },
        { text: "Cancelar", action: null },
      ],
    });
  });

  closeBtn.addEventListener("click", (e) => {
    e.stopPropagation(); // Evita que se dispare el modal al cerrar
    banner.style.display = "none";
    localStorage.setItem("banner-closed", Date.now().toString());
  });

  toggleBannerVisibility();
  window.addEventListener("resize", toggleBannerVisibility);
};
