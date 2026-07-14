// app/scripts/modules/components/folder.js
import { state } from "../utils/state.js";
import { openDB, storeName } from "../db/database.js";
import { showDetailView } from "../ui/views.js";
import { applyMarqueeIfNeeded } from "../utils/helpers.js";
import { showModal } from "./modal.js";

const detectedFoldersDiv = document.getElementById("detected-folders");
const loadingOverlay = document.getElementById("loading-overlay");

export function renderFolders() {
  detectedFoldersDiv.innerHTML = "";
  const folderKeys = Object.keys(state.library);
  const Titles = [];

  if (folderKeys.length === 0) {
    detectedFoldersDiv.innerHTML = `
      <p style="grid-column: 1/-1; text-align: center; opacity: 0.5; padding: 20px;">
        No hay carpetas.
      </p>
  `;
    loadingOverlay.style.display = "none";
    return;
  }

  folderKeys.forEach((name) => {
    const card = document.createElement("div");
    card.className = "folder-card-grid marquee-container";
    card.innerHTML = `
      <button class="delete-folder-btn" onclick="deleteFolder('${name}', event)">
        <l-icon name="trash-outline"></l-icon>
      </button>
      <div style="font-size:2rem;"><l-icon name="folder-open"></l-icon></div>
      <div class="f-name-wrapper">
        <div class="f-name marquee-text">${name}</div>
      </div>
      <div class="f-count">${state.library[name].length} canciones</div>
    `;

    card.onclick = () => showDetailView(name);
    detectedFoldersDiv.appendChild(card);
    Titles.push(card.querySelector(".marquee-text"));
  });

  requestAnimationFrame(() => {
    setTimeout(() => {
      loadingOverlay.style.display = "none";
    }, 300);
    Titles.forEach((el) => applyMarqueeIfNeeded(el));
  });
}

export async function deleteFolder(folderName, event) {
  event.stopPropagation();

  showModal({
    title: "Eliminar carpeta",
    message: `¿Estás seguro de que quieres eliminar "${folderName}"? Esta acción no se puede deshacer.`,
    buttons: [
      {
        text: "Confirmar",
        action: async () => {
          delete state.library[folderName];
          const db = await openDB();
          await db
            .transaction(storeName, "readwrite")
            .objectStore(storeName)
            .put({ id: "current_lib", data: state.library });
          renderFolders();
        }
      },
      {
        text: "Cancelar",
        action: null,
      },
    ],
  });
}

// Exponer globalmente para uso en onclick HTML
window.deleteFolder = deleteFolder;
