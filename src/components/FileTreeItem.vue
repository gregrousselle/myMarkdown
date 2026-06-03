<template>
  <div class="tree-item">
    <div
      class="tree-row"
      :class="{ active: currentFile === item.path, 'is-dir': item.type === 'directory' }"
      :style="{ paddingLeft: depth * 12 + 'px' }"
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

      <span class="item-name">{{ item.name }}</span>
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
import { ref } from 'vue';

const props = defineProps({
  item: { type: Object, required: true },
  depth: { type: Number, default: 0 },
  currentFile: { type: String, default: null }
});

const emit = defineEmits(['select-file']);

const isOpen = ref(true);

function handleClick() {
  if (props.item.type === 'directory') {
    isOpen.value = !isOpen.value;
  } else {
    emit('select-file', props.item.path);
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
</style>
