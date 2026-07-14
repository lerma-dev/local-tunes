// app/scripts/modules/components/all-songs.js
import { state } from "../utils/state.js";
import { escapeJS, applyMarqueeIfNeeded } from "../utils/helpers.js";
import { playSong } from "./player.js";
import { toggleFavorite } from "./favorites.js";
import { openSongContextMenu } from "../ui/song-context-menu.js";
import { initMiniVisualizer } from "./mini-visualizer.js";
import { updateActiveSongInList } from "./player.js";

let allSongsListUI, allSongsSearch;
let currentSearchTerm = "";
let currentAllSongs = [];

export function initAllSongs() {
  allSongsListUI = document.getElementById("all-songs-list");
  allSongsSearch = document.getElementById("all-songs-search");

  allSongsSearch.addEventListener("input", (e) => {
    renderAllSongs(e.target.value);
  });
}

// Vuelve a pintar la lista de "Canciones" solo si ya fue inicializada,
// útil para mantenerla sincronizada tras favoritos/edición/borrado.
export function refreshAllSongsView() {
  if (!allSongsListUI) return;
  renderAllSongs(currentSearchTerm);
}

export function renderAllSongs(searchTerm = "") {
  currentSearchTerm = searchTerm;
  allSongsListUI.innerHTML = "";

  // 1. Aplanamos todas las canciones de todas las carpetas en una sola lista
  let allSongs = [];
  for (const folder in state.library) {
    state.library[folder].forEach((song) => {
      allSongs.push({ ...song, folderName: folder });
    });
  }

  // 2. Filtramos por término de búsqueda si existe
  if (searchTerm) {
    allSongs = allSongs.filter(
      (s) =>
        s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.artist.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }

  currentAllSongs = allSongs;

  // 3. Actualizamos stats
  document.getElementById("all-songs-stats-info").textContent =
    `${allSongs.length} canciones`;

  const currentSong = state.currentQueue[state.currentIndex];
  const fragment = document.createDocumentFragment();
  const newTitles = [];

  allSongs.forEach((song) => {
    const isPlaying =
      state.currentIndex !== -1 &&
      currentSong?.title === song.title &&
      currentSong?.folderName === song.folderName;

    const favId = `${song.folderName}-${song.title}`;
    const isFav = state.favorites.includes(favId);
    const lerma = isFav ? "heart" : "heart-outline";
    const classFav = isFav ? "is-fav" : "";

    const escapedFolder = escapeJS(song.folderName);
    const escapedTitle = escapeJS(song.title);

    const li = document.createElement("li");
    li.className = "song-item";
    if (isPlaying) li.classList.add("is-playing");

    li.innerHTML = `
    <div class="song-info-container">
      <div class="album-art-placeholder">
        ${
          isPlaying
            ? `<canvas class="mini-viz" width="80" height="80"></canvas>`
            : `<l-icon name="musical-note"></l-icon>`
        }
      </div>
      <div class="marquee-container" style="overflow:hidden; flex:1;">
        <strong class="marquee-text">${song.title}</strong>
        <span class="song-artist" style="display:block; font-size:0.8em; opacity:0.5;">${song.artist}</span>
      </div>
    </div>
    <button class="fav-btn" onclick="toggleFavorite('${escapedFolder}', '${escapedTitle}', event)">
      <l-icon name="${lerma}" class="${classFav}"></l-icon>
    </button>
    <button class="fav-btn song-ctx-btn" title="Opciones">
      <l-icon name="menu"></l-icon>
    </button>`;

    // Lógica de visualizador
    if (isPlaying) {
      requestAnimationFrame(() => {
        const miniCanvas = li.querySelector(".mini-viz");
        if (miniCanvas) initMiniVisualizer(miniCanvas);
      });
    }

    // Al hacer clic, cargamos todo el array plano (ya filtrado) en la cola
    li.querySelector(".song-info-container").onclick = () => {
      state.currentQueue = allSongs;
      const index = allSongs.findIndex(
        (s) => s.title === song.title && s.folderName === song.folderName,
      );
      playSong(index);
    };

    // Menú contextual (editar / eliminar / agregar a playlist)
    li.querySelector(".song-ctx-btn").addEventListener("click", (e) => {
      openSongContextMenu(e, song, "detail", {
        folderName: song.folderName,
      });
    });

    fragment.appendChild(li);
    newTitles.push(li.querySelector(".marquee-text"));
  });

  allSongsListUI.appendChild(fragment);

  requestAnimationFrame(() => {
    newTitles.forEach((el) => applyMarqueeIfNeeded(el));
    updateActiveSongInList();
  });
}

// Exponer globalmente para uso en onclick HTML
window.toggleFavorite = toggleFavorite;
