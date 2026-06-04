<template>
  <aside 
    class="sidebar" 
    :class="{ closed: !isOpen, 'is-resizing': isResizing }" 
    :style="{ width: isOpen ? sidebarWidth + 'px' : '50px' }"
  >
    <div class="sidebar-header">
      <div class="header-left">
        <button @click="isOpen = !isOpen" class="btn-icon toggle-btn" title="Afficher/Masquer la barre latérale">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            <line x1="9" y1="3" x2="9" y2="21"/>
          </svg>
        </button>
        <span v-show="isOpen" class="folder-name">{{ activeTab === 'files' ? 'Fichiers' : 'Recherche' }}</span>
      </div>
      <div v-show="isOpen" class="sidebar-actions">
        <button
          @click="activeTab = 'files'"
          class="btn-icon"
          :class="{ active: activeTab === 'files' }"
          title="Fichiers"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/>
            <polyline points="13 2 13 9 20 9"/>
          </svg>
        </button>
        <button
          @click="activeTab = 'search'"
          class="btn-icon"
          :class="{ active: activeTab === 'search' }"
          title="Rechercher"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
        </button>
        <div class="toolbar-sep-v"></div>
        <button @click="$emit('open-folder')" class="btn-icon" title="Ouvrir un dossier">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
          </svg>
        </button>
        <button @click="$emit('open-files')" class="btn-icon" title="Ouvrir un ou plusieurs fichiers">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
          </svg>
        </button>
        <button
          @click="$emit('new-file')"
          class="btn-icon"
          title="Nouveau fichier"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        </button>
      </div>
    </div>

    <div v-show="isOpen" class="sidebar-content">
      <template v-if="activeTab === 'files'">
      <!-- Folder Tree Section -->
      <div v-if="fileTree" class="sidebar-section">
        <div class="section-header">
          <span class="section-title">DOSSIER : {{ fileTree.name }}</span>
          <button @click="$emit('close-folder')" class="btn-icon-sm" title="Fermer le dossier">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div class="tree-container">
          <FileTreeItem
            :item="fileTree"
            :currentFile="currentFile"
            @select-file="$emit('select-file', $event)"
          />
        </div>
      </div>

      <!-- Opened Files Section -->
      <div class="sidebar-section">
        <div class="section-header">
          <span class="section-title">Fichiers ouverts</span>
        </div>
        <div class="sidebar-files">
          <p v-if="files.length === 0" class="empty-state">
            Aucun fichier ouvert
          </p>
          <div
            v-for="file in files"
            :key="file.path"
            @click="$emit('select-file', file.path)"
            class="file-item"
            :class="{ active: currentFile === file.path }"
            :title="file.name"
          >
            <svg class="file-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
            <span class="file-name">{{ file.name }}</span>
            <button
              @click.stop="$emit('close-file', file.path)"
              class="file-close-btn"
              title="Fermer le fichier"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
      </template>
      <template v-else>
        <SearchPanel
          v-if="fileTree"
          :folderPath="fileTree.path"
          @select-file="$emit('select-file', $event)"
        />
        <div v-else class="empty-state">
          Ouvrez un dossier pour effectuer une recherche globale.
        </div>
      </template>
    </div>
    
    <!-- Poignée de redimensionnement -->
    <div v-show="isOpen" class="resizer" @mousedown.prevent="startResize"></div>
  </aside>
</template>

<script setup>
import { ref } from 'vue';
import FileTreeItem from './FileTreeItem.vue';
import SearchPanel from './SearchPanel.vue';

defineProps({
  files:       { type: Array,  default: () => [] },
  currentFile: { type: String, default: null },
  fileTree:    { type: Object, default: null },
});

defineEmits(['open-files', 'open-folder', 'select-file', 'new-file', 'close-file', 'close-folder']);

const sidebarWidth = ref(230);
const isResizing = ref(false);
const isOpen = ref(true);
const activeTab = ref('files');

const startResize = (e) => {
  isResizing.value = true;
  document.addEventListener('mousemove', doResize);
  document.addEventListener('mouseup', stopResize);
  document.body.style.cursor = 'col-resize';
  document.body.style.userSelect = 'none'; // Empêche la sélection de texte pendant le redimensionnement
};

const doResize = (e) => {
  if (!isResizing.value) return;
  // e.clientX donne la position de la souris par rapport au bord gauche de l'écran (qui correspond au bord gauche de la sidebar)
  let newWidth = e.clientX;
  if (newWidth < 180) newWidth = 180; // Largeur minimale
  if (newWidth > 600) newWidth = 600; // Largeur maximale
  sidebarWidth.value = newWidth;
};

const stopResize = () => {
  isResizing.value = false;
  document.removeEventListener('mousemove', doResize);
  document.removeEventListener('mouseup', stopResize);
  document.body.style.cursor = '';
  document.body.style.userSelect = '';
};
</script>

<style scoped>
.sidebar {
  /* La largeur est contrôlée par le style lié :style="width: ..." */
  background: #272c36;
  border-right: 1px solid #3b4252;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  position: relative;
  will-change: width;
  transition: width 0.2s cubic-bezier(0.2, 0.8, 0.2, 1);
  overflow: hidden;
}

.sidebar.is-resizing {
  transition: none;
}

.resizer {
  position: absolute;
  top: 0;
  right: -3px;
  width: 6px;
  height: 100%;
  cursor: col-resize;
  z-index: 10;
  transition: background 0.2s;
}
.resizer:hover, .resizer:active {
  background: rgba(136, 192, 208, 0.5); /* Indicateur visuel du redimensionnement au survol */
}

.sidebar-header {
  padding: 10px 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #3b4252;
  min-height: 48px;
}

.sidebar.closed .sidebar-header {
  padding: 10px 0;
  justify-content: center;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
  overflow: hidden;
  flex: 1;
}

.sidebar.closed .header-left {
  flex: none;
  justify-content: center;
}

.folder-name {
  font-size: 11px;
  font-weight: 700;
  color: #616e88;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}

.sidebar-content {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.sidebar-section {
  display: flex;
  flex-direction: column;
}

.section-header {
  padding: 12px 12px 6px 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.section-title {
  font-size: 10px;
  font-weight: 700;
  color: #4c566a;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.btn-icon-sm {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 2px;
  border-radius: 4px;
  color: #4c566a;
  display: flex;
  align-items: center;
  transition: background 0.15s, color 0.15s;
}
.btn-icon-sm svg { width: 12px; height: 12px; }
.btn-icon-sm:hover { background: #3b4252; color: #d8dee9; }

.tree-container {
  padding: 4px 0;
}

.sidebar-actions {
  display: flex;
  gap: 2px;
  flex-shrink: 0;
}

.btn-icon {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  color: #616e88;
  display: flex;
  align-items: center;
  transition: background 0.15s, color 0.15s;
}
.btn-icon svg { width: 15px; height: 15px; }
.btn-icon:hover { background: #3b4252; color: #d8dee9; }
.btn-icon.active { color: #88c0d0; }

.toolbar-sep-v {
  width: 1px;
  height: 14px;
  background: #3b4252;
  margin: 0 4px;
}

.sidebar-files {
  flex: 1;
  overflow-y: auto;
  padding: 6px 0;
}

.empty-state {
  padding: 16px 14px;
  font-size: 12px;
  color: #4c566a;
  line-height: 1.5;
}

.file-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: transparent;
  border: none;
  cursor: pointer;
  color: #8490a8;
  font-size: 13px;
  text-align: left;
  transition: background 0.12s, color 0.12s;
  border-radius: 0;
}
.file-item:hover { background: #2e3440; color: #d8dee9; }
.file-item.active { background: #3b4252; color: #eceff4; }

.file-icon {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}

.file-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-close-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  color: inherit;
  opacity: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  border-radius: 4px;
  transition: opacity 0.15s, background 0.15s;
}
.file-item:hover .file-close-btn {
  opacity: 0.6;
}
.file-item.active .file-close-btn {
  opacity: 0.8;
}
.file-close-btn:hover {
  opacity: 1 !important;
  background: rgba(255, 255, 255, 0.1);
}
.file-close-btn svg {
  width: 14px;
  height: 14px;
}
</style>
