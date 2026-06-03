<template>
  <div class="tree-item">
    <div
      class="tree-row"
      :class="{
        active: currentFile === item.path,
        'is-dir': item.type === 'directory',
        'is-dragging': isDragging,
        'drag-over': isDragOver
      }"
      :style="{ paddingLeft: depth * 12 + 'px' }"
      draggable="true"
      @dragstart.stop="onDragStart"
      @dragend.stop="onDragEnd"
      @dragover.prevent.stop="onDragOver"
      @dragleave.stop="onDragLeave"
      @drop.stop="onDrop"
      @click="handleClick"
    >
      <span v-if="item.type === 'directory'" class="chevron" :class="{ open: isOpen }">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="9 18 15 12 9 6"/>
        </svg>
      </span>

      <svg v-if="item.type === 'directory'" class="item-icon dir-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
      </svg>
      <svg v-else class="item-icon file-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
      </svg>

      <input
        v-if="isEditing"
        ref="editInput"
        v-model="editName"
        class="edit-input"
        @blur="finishRename"
        @keydown.enter="finishRename"
        @keydown.esc="cancelRename"
        @click.stop
      />
      <span v-else class="item-name">{{ item.name }}</span>

      <div class="row-actions" v-if="!isEditing">
        <button class="btn-action" @click.stop="startRename" title="Renommer">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        </button>
        <button class="btn-action" @click.stop="confirmDelete" title="Supprimer">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
          </svg>
        </button>
      </div>
    </div>

    <div v-if="item.type === 'directory' && isOpen" class="tree-children">
      <FileTreeItem
        v-for="child in item.children"
        :key="child.path"
        :item="child"
        :depth="depth + 1"
        :currentFile="currentFile"
        @select-file="$emit('select-file', $event)"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick } from 'vue';

const props = defineProps({
  item: { type: Object, required: true },
  depth: { type: Number, default: 0 },
  currentFile: { type: String, default: null }
});

const emit = defineEmits(['select-file']);

const isOpen = ref(true);
const isEditing = ref(false);
const editName = ref('');
const editInput = ref(null);
const isDragging = ref(false);
const isDragOver = ref(false);

function handleClick() {
  if (props.item.type === 'directory') {
    isOpen.value = !isOpen.value;
  } else {
    emit('select-file', props.item.path);
  }
}

async function startRename() {
  editName.value = props.item.name;
  isEditing.value = true;
  await nextTick();
  editInput.value?.focus();
  editInput.value?.select();
}

async function finishRename() {
  if (!isEditing.value) return;
  const newName = editName.value.trim();
  if (newName && newName !== props.item.name) {
    const oldPath = props.item.path;
    const parentPath = await window.electronAPI.pathDirname(oldPath);
    const newPath = await window.electronAPI.pathJoin(parentPath, newName);

    const result = await window.electronAPI.renameFile(oldPath, newPath);
    if (!result.success) {
      alert(`Erreur lors du renommage : ${result.error}`);
    }
  }
  isEditing.value = false;
}

function cancelRename() {
  isEditing.value = false;
}

async function confirmDelete() {
  if (confirm(`Voulez-vous vraiment supprimer "${props.item.name}" ?`)) {
    const result = await window.electronAPI.deleteFile(props.item.path);
    if (!result.success) {
      alert(`Erreur lors de la suppression : ${result.error}`);
    }
  }
}

// --- Drag & Drop ---

function onDragStart(e) {
  isDragging.value = true;
  e.dataTransfer.setData('application/my-markdown-path', props.item.path);
  e.dataTransfer.effectAllowed = 'move';
}

function onDragEnd() {
  isDragging.value = false;
}

function onDragOver(e) {
  if (props.item.type === 'directory') {
    isDragOver.value = true;
    e.dataTransfer.dropEffect = 'move';
  }
}

function onDragLeave() {
  isDragOver.value = false;
}

async function onDrop(e) {
  isDragOver.value = false;
  const sourcePath = e.dataTransfer.getData('application/my-markdown-path');
  if (!sourcePath) return;

  // Ne pas déplacer sur soi-même
  if (sourcePath === props.item.path) return;

  // Destination : soit ce dossier, soit le dossier parent de ce fichier
  let targetFolder = props.item.path;
  if (props.item.type !== 'directory') {
    targetFolder = await window.electronAPI.pathDirname(props.item.path);
  }

  const fileName = await window.electronAPI.pathBasename(sourcePath);
  const newPath = await window.electronAPI.pathJoin(targetFolder, fileName);

  if (sourcePath === newPath) return;

  const result = await window.electronAPI.renameFile(sourcePath, newPath);
  if (!result.success) {
    alert(`Erreur lors du déplacement : ${result.error}`);
  }
}
</script>

<style scoped>
.tree-item {
  user-select: none;
}

.tree-row {
  display: flex;
  align-items: center;
  padding: 4px 8px;
  cursor: pointer;
  color: #8490a8;
  font-size: 13px;
  transition: background 0.12s, color 0.12s;
  gap: 6px;
}

.tree-row:hover {
  background: #2e3440;
  color: #d8dee9;
}

.tree-row.is-dragging {
  opacity: 0.5;
}

.tree-row.drag-over {
  background: #3b4252;
  box-shadow: inset 0 0 0 1px #88c0d0;
}

.tree-row.active {
  background: #3b4252;
  color: #eceff4;
}

.chevron {
  width: 14px;
  height: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s;
}

.chevron.open {
  transform: rotate(90deg);
}

.chevron svg {
  width: 12px;
  height: 12px;
}

.item-icon {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}

.dir-icon {
  color: #81a1c1;
}

.file-icon {
  color: #88c0d0;
}

.item-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.edit-input {
  flex: 1;
  background: #3b4252;
  border: 1px solid #88c0d0;
  color: #eceff4;
  font-size: 13px;
  padding: 1px 4px;
  border-radius: 2px;
  outline: none;
  min-width: 0;
}

.row-actions {
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.15s;
}

.tree-row:hover .row-actions {
  opacity: 1;
}

.btn-action {
  background: transparent;
  border: none;
  cursor: pointer;
  color: #616e88;
  padding: 2px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-action:hover {
  background: #4c566a;
  color: #d8dee9;
}

.btn-action svg {
  width: 12px;
  height: 12px;
}
</style>
