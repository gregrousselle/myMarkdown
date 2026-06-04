<template>
  <div class="search-panel">
    <div class="search-header">
      <input
        ref="searchInput"
        v-model="query"
        type="text"
        placeholder="Rechercher dans le dossier..."
        @input="onInput"
        class="search-input"
      />
      <button v-if="query" @click="clearSearch" class="clear-btn">✕</button>
    </div>

    <div class="search-results">
      <div v-if="loading" class="status-msg">Recherche...</div>
      <div v-else-if="results.length > 0">
        <div v-for="file in results" :key="file.path" class="file-result">
          <div class="file-name" @click="selectFile(file.path)">
            <svg class="file-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
            {{ file.name }}
          </div>
          <div class="matches">
            <div
              v-for="match in file.matches"
              :key="match.index"
              class="match-line"
              @click="selectFile(file.path)"
            >
              <span class="line-num">{{ match.index + 1 }}:</span>
              <span class="line-text">{{ truncate(match.line) }}</span>
            </div>
          </div>
        </div>
      </div>
      <div v-else-if="query.length >= 2" class="status-msg">Aucun résultat</div>
      <div v-else class="status-msg">Tapez au moins 2 caractères</div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
  folderPath: String
});

const emit = defineEmits(['select-file']);

const query = ref('');
const results = ref([]);
const loading = ref(false);
const searchInput = ref(null);

let timeout = null;

function onInput() {
  clearTimeout(timeout);
  if (query.value.length < 2) {
    results.value = [];
    return;
  }

  loading.value = true;
  timeout = setTimeout(async () => {
    results.value = await window.electronAPI.search(props.folderPath, query.value);
    loading.value = false;
  }, 300);
}

function clearSearch() {
  query.value = '';
  results.value = [];
}

function selectFile(path) {
  emit('select-file', path);
}

function truncate(text) {
  const q = query.value.toLowerCase();
  const index = text.toLowerCase().indexOf(q);
  if (index === -1) return text.slice(0, 50);

  const start = Math.max(0, index - 20);
  const end = Math.min(text.length, index + q.length + 30);
  let result = text.slice(start, end);
  if (start > 0) result = '...' + result;
  if (end < text.length) result = result + '...';
  return result;
}

defineExpose({
  focus: () => searchInput.value?.focus()
});
</script>

<style scoped>
.search-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #252932;
}

.search-header {
  padding: 12px;
  position: relative;
  border-bottom: 1px solid #3b4252;
}

.search-input {
  width: 100%;
  background: #2e3440;
  border: 1px solid #4c566a;
  border-radius: 4px;
  color: #eceff4;
  padding: 6px 24px 6px 8px;
  font-size: 13px;
  outline: none;
}
.search-input:focus {
  border-color: #88c0d0;
}

.clear-btn {
  position: absolute;
  right: 20px;
  top: 50%;
  transform: translateY(-50%);
  background: transparent;
  border: none;
  color: #616e88;
  cursor: pointer;
  padding: 4px;
}
.clear-btn:hover {
  color: #d8dee9;
}

.search-results {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
}

.status-msg {
  padding: 12px;
  color: #616e88;
  font-size: 13px;
  text-align: center;
}

.file-result {
  margin-bottom: 8px;
}

.file-name {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  font-size: 13px;
  color: #d8dee9;
  cursor: pointer;
  transition: background 0.15s;
}
.file-name:hover {
  background: #2e3440;
}

.file-icon {
  width: 14px;
  height: 14px;
  color: #81a1c1;
}

.matches {
  padding-left: 34px;
}

.match-line {
  padding: 4px 8px;
  font-size: 12px;
  color: #8490a8;
  cursor: pointer;
  border-radius: 4px;
  margin-right: 8px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.match-line:hover {
  background: #2e3440;
  color: #eceff4;
}

.line-num {
  color: #4c566a;
  margin-right: 6px;
  font-family: monospace;
}
</style>
