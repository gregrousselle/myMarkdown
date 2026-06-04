<template>
  <div v-if="show" class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content">
      <div class="modal-header">
        <h3>Nouveau document à partir d'un modèle</h3>
        <button @click="$emit('close')" class="close-btn">✕</button>
      </div>

      <div class="template-grid">
        <div class="template-card empty" @click="selectTemplate(null)">
          <div class="card-icon">📄</div>
          <div class="card-info">
            <div class="card-name">Document vide</div>
            <div class="card-desc">Commencer de zéro</div>
          </div>
        </div>

        <div
          v-for="tpl in templates"
          :key="tpl.name"
          class="template-card"
          @click="selectTemplate(tpl)"
        >
          <div class="card-icon">📝</div>
          <div class="card-info">
            <div class="card-name">{{ tpl.name }}</div>
            <div class="card-desc">Modèle pré-rempli</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

defineProps({
  show: Boolean
});

const emit = defineEmits(['close', 'select']);
const templates = ref([]);

onMounted(async () => {
  templates.value = await window.electronAPI.getTemplates();
});

function selectTemplate(tpl) {
  emit('select', tpl ? tpl.content : '# Nouveau document\n\n');
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.modal-content {
  background: #2e3440;
  width: 500px;
  border-radius: 8px;
  border: 1px solid #4c566a;
  box-shadow: 0 10px 25px rgba(0,0,0,0.5);
  overflow: hidden;
}

.modal-header {
  padding: 16px;
  border-bottom: 1px solid #3b4252;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.modal-header h3 {
  margin: 0;
  font-size: 16px;
  color: #eceff4;
}

.close-btn {
  background: transparent;
  border: none;
  color: #616e88;
  cursor: pointer;
  font-size: 18px;
}

.template-grid {
  padding: 16px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  max-height: 400px;
  overflow-y: auto;
}

.template-card {
  background: #3b4252;
  padding: 16px;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 12px;
  transition: background 0.15s, transform 0.1s;
  border: 1px solid transparent;
}
.template-card:hover {
  background: #434c5e;
  border-color: #88c0d0;
  transform: translateY(-2px);
}
.template-card:active {
  transform: translateY(0);
}

.template-card.empty {
  background: #2e3440;
  border: 1px dashed #4c566a;
}
.template-card.empty:hover {
  border-color: #88c0d0;
  background: #3b4252;
}

.card-icon {
  font-size: 24px;
}

.card-info {
  display: flex;
  flex-direction: column;
}

.card-name {
  font-size: 14px;
  font-weight: 600;
  color: #d8dee9;
}

.card-desc {
  font-size: 11px;
  color: #616e88;
}
</style>
