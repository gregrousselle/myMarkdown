<template>
  <div class="toolbar">
    <div class="toolbar-left">
      <button @mousedown.prevent @click="$emit('save')" class="toolbar-btn" :class="{ 'btn-active': isDirty }" title="Sauvegarder (⌘S)">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
          <polyline points="17 21 17 13 7 13 7 21"/>
          <polyline points="7 3 7 8 15 8"/>
        </svg>
      </button>
      <div class="toolbar-sep"></div>
      <button @mousedown.prevent @click="$emit('undo')" class="toolbar-btn" title="Annuler (⌘Z)">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M3 7v6h6"/>
          <path d="M3 13C5.8 7 10 5 15 6a9 9 0 0 1 6 9"/>
        </svg>
      </button>
      <button @mousedown.prevent @click="$emit('redo')" class="toolbar-btn" title="Rétablir (⌘⇧Z)">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 7v6h-6"/>
          <path d="M21 13C18.2 7 14 5 9 6a9 9 0 0 0-6 9"/>
        </svg>
      </button>
      <div class="toolbar-sep"></div>
      <button @mousedown.prevent @click="$emit('copy')" class="toolbar-btn" title="Copier (⌘C)">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
        </svg>
      </button>
      <button @mousedown.prevent @click="$emit('paste')" class="toolbar-btn" title="Coller (⌘V)">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
          <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
        </svg>
      </button>
    </div>
    <div class="toolbar-right">
      <button
        @mousedown.prevent
        @click="$emit('toggle-mode')"
        class="toolbar-btn toolbar-btn-mode"
        :title="editorMode === 'wysiwyg' ? 'Passer en mode texte brut' : 'Passer en mode formaté'"
      >
        <template v-if="editorMode === 'wysiwyg'">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="16 18 22 12 16 6"/>
            <polyline points="8 6 2 12 8 18"/>
          </svg>
          Texte brut
        </template>
        <template v-else>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
          Formaté
        </template>
      </button>
    </div>
  </div>
</template>

<script setup>
defineProps({
  isDirty: {
    type: Boolean,
    default: false
  },
  editorMode: {
    type: String,
    default: 'wysiwyg'
  }
});

defineEmits(['save', 'undo', 'redo', 'copy', 'paste', 'toggle-mode']);
</script>

<style scoped>
/* ---- Toolbar ---- */
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 10px;
  background: #272c36;
  border-bottom: 1px solid #3b4252;
  flex-shrink: 0;
}

.toolbar-left,
.toolbar-right {
  display: flex;
  align-items: center;
  gap: 2px;
}

.toolbar-sep {
  width: 1px;
  height: 16px;
  background: #3b4252;
  margin: 0 4px;
}

.toolbar-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  background: transparent;
  border: none;
  color: #616e88;
  padding: 5px 7px;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: background 0.12s, color 0.12s;
  -webkit-app-region: no-drag;
}
.toolbar-btn svg {
  width: 15px;
  height: 15px;
  flex-shrink: 0;
}
.toolbar-btn:hover {
  background: #3b4252;
  color: #d8dee9;
}
.toolbar-btn.btn-active {
  color: #88c0d0;
}
.toolbar-btn-mode {
  padding: 5px 12px;
  background: #3b4252;
  color: #8490a8;
}
.toolbar-btn-mode:hover {
  background: #434c5e;
  color: #d8dee9;
}
</style>
