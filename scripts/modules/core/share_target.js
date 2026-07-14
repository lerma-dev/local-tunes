// app/scripts/modules/core/share_target.js
import { openDB, storeName } from "../db/database.js";
import { state } from "../utils/state.js";

const SHARE_FOLDER_NAME = "Compartido";


function parseTitleArtist(fileName) {
  const nameWithoutExt = fileName.replace(/\.[^/.]+$/, "");
  let artist = "Artista Desconocido";
  let title = nameWithoutExt;

  if (nameWithoutExt.includes(" - ")) {
    const [artistPart, titlePart] = nameWithoutExt.split(" - ");
    artist = artistPart.trim();
    title = titlePart.trim();
  }

  return { title, artist };
}

function idbRequestToPromise(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function consumePendingShare() {
  try {
    const db = await openDB();

    const shareRecord = await idbRequestToPromise(
      db.transaction(storeName, "readonly").objectStore(storeName).get("incoming_share")
    );

    if (!shareRecord || !Array.isArray(shareRecord.files) || shareRecord.files.length === 0) {
      return false;
    }

    const libRecord = await idbRequestToPromise(
      db.transaction(storeName, "readonly").objectStore(storeName).get("current_lib")
    );

    const libraryData = libRecord ? libRecord.data : {};
    if (!libraryData[SHARE_FOLDER_NAME]) libraryData[SHARE_FOLDER_NAME] = [];

    const addedSongs = [];
    shareRecord.files.forEach(({ name, blob }) => {
      const { title, artist } = parseTitleArtist(name);
      const isDuplicate = libraryData[SHARE_FOLDER_NAME].some(
        (s) => s.title === title && s.artist === artist
      );
      if (!isDuplicate && blob) {
        const song = { title, artist, file: blob };
        libraryData[SHARE_FOLDER_NAME].push(song);
        addedSongs.push(song);
      }
    });

    // Guardar biblioteca actualizada y limpiar la bandeja de entrada
    const writeTx = db.transaction(storeName, "readwrite");
    writeTx.objectStore(storeName).put({ id: "current_lib", data: libraryData });
    writeTx.objectStore(storeName).delete("incoming_share");
    await new Promise((resolve, reject) => {
      writeTx.oncomplete = resolve;
      writeTx.onerror = () => reject(writeTx.error);
    });

    state.library = libraryData;

    const { renderFolders } = await import("../components/folders.js");
    renderFolders();

    if (addedSongs.length > 0) {
      const { agregarToast } = await import("../components/toast.js");
      agregarToast({
        tipo: "Exito",
        titulo: addedSongs.length === 1 ? "¡Canción recibida!" : "¡Canciones recibidas!",
        descripcion:
          addedSongs.length === 1
            ? `Se agregó "${addedSongs[0].title}" a la carpeta "${SHARE_FOLDER_NAME}".`
            : `Se agregaron ${addedSongs.length} canciones a la carpeta "${SHARE_FOLDER_NAME}".`,
        autoClose: true,
      });

      const { playSong } = await import("../components/player.js");
      const queue = libraryData[SHARE_FOLDER_NAME];
      const firstIndex = queue.indexOf(addedSongs[0]);
      state.currentQueue = queue;
      playSong(firstIndex);
    }

    return true;
  } catch (error) {
    console.error("[ShareTarget] Error al procesar el contenido compartido:", error);
    return false;
  }
}
