// app/scripts/app.js
import { loadViews } from "./modules/ui/loader.js";
import { loadFavorites } from "./modules/components/favorites.js";
import { loadFromDatabase } from "./modules/db/libraryDB.js";
import { saveLibraryToDB, openDB, storeName } from "./modules/db/database.js";
import { initSidebar } from "./modules/ui/sidebar.js";
import { initTabBar } from "./modules/ui/tab-bar.js";
import { applyStoredTheme } from "./modules/utils/theme.js";
import { initPlatformCore } from "./modules/core/index.js";
import { showModal } from "./modules/components/modal.js";
import { consumePendingShare } from "./modules/core/share_target.js";

applyStoredTheme();

(async () => {
  initPlatformCore();
  await loadViews();

  const { initPlayer, togglePlay, playNext, playPrev, mode } =
    await import("./modules/components/player.js");
  const { initFavorites } = await import("./modules/components/favorites.js");
  const { initAllSongs } = await import("./modules/components/all-songs.js");
  const { initVisualizerVar } =
    await import("./modules/components/visualizer.js");
  const { initToast, eliminarToast, agregarToast } =
    await import("./modules/components/toast.js");
  const { initBannerUpdates } =
    await import("./modules/components/banner-updates.js");
  const { initDesktopBanner } =
    await import("./modules/components/banner-desktop.js");
  const { initSongContextMenu } =
    await import("./modules/ui/song-context-menu.js");
  const { initSettings } = await import("./modules/components/settings.js");

  await import("./modules/ui/views.js");
  await import("./modules/ui/modals.js");
  await import("./modules/ui/song-context-menu.js");
  await import("./modules/components/playlists.js");

  initPlayer();
  initFavorites();
  initAllSongs();
  initVisualizerVar();
  initSettings();
  initSongContextMenu();
  // toast
  initToast();
  eliminarToast();
  // Banners de actualizaciones
  initBannerUpdates();
  initDesktopBanner();
  // Sidebar desktop
  initSidebar();
  initTabBar();
  // compartidos
  await consumePendingShare();
  // Cargar database
  await loadFavorites();
  loadFromDatabase();

  const folderInput = document.getElementById("folder-input");
  const clear_db_btn = document.getElementById("clear-db-btn");

  folderInput.onchange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) saveLibraryToDB(files);
  };

  clear_db_btn.onclick = () => {
    showModal({
      title: "¿Estás seguro de que quieres eliminar todo? ",
      message: `Esta acción no se puede deshacer.`,
      buttons: [
        {
          text: "Confirmar",
          action: async () => {
            const db = await openDB();
            await db
              .transaction(storeName, "readwrite")
              .objectStore(storeName)
              .delete("current_lib");
            location.reload();
          },
        },
        {
          text: "Cancelar",
          action: null,
        },
      ],
    });
  };
  // Exponer funciones
  window.togglePlay = togglePlay;
  window.playNext = playNext;
  window.playPrev = playPrev;
  window.mode = mode;
  window.agregarToast = agregarToast;
  window.eliminarToast = eliminarToast;
})();
