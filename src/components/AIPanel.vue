<template>
  <div class="ai-panel">
    <div class="panel-header">
      <h3>Assistant SDD</h3>
      <button class="settings-btn" @click="$emit('open-settings')" title="Paramètres IA">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="3"></circle>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
        </svg>
      </button>
    </div>

    <div class="panel-body">
      <div class="actions">
        <button class="action-btn" @click="generateTests" :disabled="loading">
          🧪 Générer Tests Gherkin
        </button>
        <button class="action-btn" @click="checkConsistency" :disabled="loading">
          🔍 Analyse Cohérence
        </button>
      </div>

      <div v-if="loading" class="loading">
        Analyse en cours...
      </div>

      <div v-if="result" class="result-area">
        <div class="result-header">
          <span>Résultat</span>
          <button @click="copyResult" title="Copier">📋</button>
        </div>
        <pre class="result-text">{{ result }}</pre>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { aiService } from '../services/aiService';

const props = defineProps({
  content: String
});

const loading = ref(false);
const result = ref('');

async function generateTests() {
  if (!props.content) return;
  loading.value = true;
  result.value = '';
  try {
    result.value = await aiService.generateGherkin(props.content);
  } catch (e) {
    result.value = `Erreur: ${e.message}`;
  } finally {
    loading.value = false;
  }
}

async function checkConsistency() {
  if (!props.content) return;
  loading.value = true;
  result.value = '';
  try {
    result.value = await aiService.checkConsistency(props.content);
  } catch (e) {
    result.value = `Erreur: ${e.message}`;
  } finally {
    loading.value = false;
  }
}

function copyResult() {
  navigator.clipboard.writeText(result.value);
}
</script>

<style scoped>
.ai-panel {
  width: 300px;
  background: #252932;
  border-left: 1px solid #3b4252;
  display: flex;
  flex-direction: column;
}

.panel-header {
  padding: 12px;
  border-bottom: 1px solid #3b4252;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.panel-header h3 {
  margin: 0;
  font-size: 0.9rem;
  color: #81a1c1;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.settings-btn {
  background: transparent;
  border: none;
  color: #4c566a;
  cursor: pointer;
  padding: 4px;
}
.settings-btn:hover { color: #d8dee9; }
.settings-btn svg { width: 16px; height: 16px; }

.panel-body {
  padding: 12px;
  flex: 1;
  overflow-y: auto;
}

.actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}

.action-btn {
  background: #3b4252;
  color: #d8dee9;
  border: 1px solid #4c566a;
  padding: 8px;
  border-radius: 4px;
  text-align: left;
  cursor: pointer;
  font-size: 13px;
  transition: background 0.2s;
}
.action-btn:hover:not(:disabled) {
  background: #434c5e;
  border-color: #5e81ac;
}
.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.loading {
  color: #88c0d0;
  font-size: 13px;
  text-align: center;
  margin: 20px 0;
}

.result-area {
  background: #2e3440;
  border: 1px solid #3b4252;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
}

.result-header {
  padding: 6px 8px;
  background: #3b4252;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 11px;
  color: #d8dee9;
}

.result-header button {
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 12px;
}

.result-text {
  padding: 10px;
  font-size: 12px;
  white-space: pre-wrap;
  word-break: break-word;
  color: #eceff4;
  margin: 0;
  max-height: 400px;
  overflow-y: auto;
  font-family: 'Fira Code', monospace;
}
</style>
