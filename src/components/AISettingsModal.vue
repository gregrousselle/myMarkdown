<template>
  <div v-if="show" class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content">
      <div class="modal-header">
        <h2>Configuration IA</h2>
        <button class="close-btn" @click="$emit('close')">&times;</button>
      </div>

      <div class="modal-body">
        <div class="form-group">
          <label>Fournisseur</label>
          <select v-model="config.provider">
            <option value="ollama">Ollama (Local)</option>
            <option value="openai">OpenAI</option>
            <option value="anthropic">Anthropic</option>
          </select>
        </div>

        <div v-if="config.provider === 'ollama'" class="form-group">
          <label>URL de base</label>
          <input v-model="config.baseUrl" placeholder="http://localhost:11434" />
        </div>

        <div v-if="config.provider !== 'ollama'" class="form-group">
          <label>Clé API</label>
          <input v-model="config.apiKey" type="password" placeholder="sk-..." />
        </div>

        <div class="form-group">
          <label>Modèle</label>
          <input v-model="config.model" :placeholder="defaultModel" />
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn-secondary" @click="$emit('close')">Annuler</button>
        <button class="btn-primary" @click="save">Enregistrer</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue';
import { aiService } from '../services/aiService';

const props = defineProps({
  show: Boolean
});

const emit = defineEmits(['close']);

const config = ref({ ...aiService.config });

const defaultModel = computed(() => {
  if (config.value.provider === 'openai') return 'gpt-4o';
  if (config.value.provider === 'anthropic') return 'claude-3-5-sonnet-20240620';
  return 'llama3';
});

watch(() => props.show, (newVal) => {
  if (newVal) {
    config.value = { ...aiService.config };
  }
});

function save() {
  aiService.saveConfig(config.value);
  emit('close');
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.modal-content {
  background: #2e3440;
  border-radius: 8px;
  width: 400px;
  box-shadow: 0 10px 25px rgba(0,0,0,0.5);
  border: 1px solid #3b4252;
}

.modal-header {
  padding: 16px;
  border-bottom: 1px solid #3b4252;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.2rem;
  color: #eceff4;
}

.close-btn {
  background: transparent;
  border: none;
  color: #d8dee9;
  font-size: 24px;
  cursor: pointer;
}

.modal-body {
  padding: 16px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  color: #d8dee9;
  font-size: 14px;
}

.form-group input, .form-group select {
  width: 100%;
  padding: 8px;
  background: #3b4252;
  border: 1px solid #4c566a;
  border-radius: 4px;
  color: #eceff4;
}

.modal-footer {
  padding: 16px;
  border-top: 1px solid #3b4252;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.btn-primary {
  background: #5e81ac;
  color: #eceff4;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
}

.btn-secondary {
  background: #4c566a;
  color: #eceff4;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
}
</style>
