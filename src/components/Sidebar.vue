<template>
  <aside class="sidebar">
    <div class="sidebar-header">
      <span class="folder-name">Fichiers ouverts</span>
      <div class="sidebar-actions">
        <button @click="$emit('open-files')" class="btn-icon" title="Ouvrir un ou plusieurs fichiers">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
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

    <div class="sidebar-files">
      <p v-if="files.length === 0" class="empty-state">
        Ouvrez des fichiers ou glissez-les ici pour commencer
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
  </aside>
</template>

<script setup>
defineProps({
  files:       { type: Array,  default: () => [] },
  currentFile: { type: String, default: null },
});

defineEmits(['open-files', 'select-file', 'new-file', 'close-file']);
</script>

<style scoped>
.sidebar {
  width: 230px;
  background: #272c36;
  border-right: 1px solid #3b4252;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}

.sidebar-header {
  padding: 10px 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #3b4252;
  min-height: 40px;
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
