<template>
  <div class="app" @drop.prevent="onDrop" @dragover.prevent>
    <!-- Barre de titre macOS -->
    <div class="titlebar">
      <div class="titlebar-traffic-lights"></div>
      <span class="titlebar-title">
        {{ currentFileName || 'MyMarkdown' }}
        <span v-if="isDirty" class="dirty-dot">●</span>
      </span>
      <div class="titlebar-actions"></div>
    </div>

    <!-- Contenu principal -->
    <div class="main">
      <Sidebar
        :files="files"
        :currentFile="currentFile"
        :fileTree="fileTree"
        @open-files="openFiles"
        @open-folder="openFolder"
        @select-file="selectFile"
        @new-file="createNewFile"
        @close-file="closeFile"
        @close-folder="closeFolder"
      />

      <div class="editor-area">
        <!-- Tabs -->
        <div v-show="files.length > 0" class="tabs-bar">
          <div
            v-for="file in files"
            :key="file.path"
            class="tab"
            :class="{ active: currentFile === file.path }"
            @click="selectFile(file.path)"
            :title="file.path"
          >
            <svg class="tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
            <span class="tab-name">{{ file.name }}</span>
            <span v-if="currentFile === file.path && isDirty" class="tab-dirty">●</span>
            <span v-else class="tab-clean">●</span>
            <button
              class="tab-close-btn"
              @click.stop="closeFile(file.path)"
              title="Fermer"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- Toolbar -->
        <EditorToolbar
          v-if="currentFile"
          :isDirty="isDirty"
          :editorMode="editorMode"
          @save="saveFile"
          @undo="editorRef?.triggerUndo()"
          @redo="editorRef?.triggerRedo()"
          @copy="editorRef?.triggerCopy()"
          @paste="editorRef?.triggerPaste()"
          @toggle-mode="editorRef?.toggleMode()"
          @export-pdf="exportPDF"
        />

        <div v-if="currentFile" class="editor-with-toc">
          <Editor
            ref="editorRef"
            :content="currentContent"
            @dirty="isDirty = true"
            @mode-change="editorMode = $event"
            @content-update="currentContent = $event"
          />
          <TableOfContents :content="currentContent" />
        </div>
        <div v-else class="welcome">
          <div class="welcome-inner">
            <svg class="welcome-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <polyline points="10 9 9 9 8 9"/>
            </svg>
            <h1>MyMarkdown</h1>
            <p>Éditeur Markdown propulsé par Milkdown &amp; Vue.js</p>
            <div class="welcome-buttons">
              <button @click="openFiles" class="btn-primary">Ouvrir des fichiers</button>
              <button @click="openFolder" class="btn-secondary">Ouvrir un dossier</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <TemplateModal
    :show="showTemplateModal"
    @close="showTemplateModal = false"
    @select="onTemplateSelect"
  />
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import Sidebar from './components/Sidebar.vue';
import Editor from './components/Editor.vue';
import EditorToolbar from './components/EditorToolbar.vue';
import TableOfContents from './components/TableOfContents.vue';
import TemplateModal from './components/TemplateModal.vue';

const files        = ref([]);
const currentFile  = ref(null);
const fileTree     = ref(null);
const currentContent = ref('');
const isDirty      = ref(false);
const editorRef    = ref(null);
const editorMode   = ref('wysiwyg');
const showTemplateModal = ref(false);

const currentFileName = ref(null);

async function updateCurrentFileName() {
  if (!currentFile.value) {
    currentFileName.value = null;
    return;
  }
  currentFileName.value = await window.electronAPI.pathBasename(currentFile.value);
}

async function addFiles(filePaths) {
  const newFiles = await Promise.all(filePaths.map(async (filePath) => {
    const name = await window.electronAPI.pathBasename(filePath);
    return { path: filePath, name };
  }));

  newFiles.forEach(newFile => {
    if (!files.value.find(f => f.path === newFile.path)) {
      files.value.push(newFile);
      if (window.electronAPI.watchFile) {
        window.electronAPI.watchFile(newFile.path);
      }
    }
  });

  if (filePaths.length > 0 && !currentFile.value) {
    selectFile(filePaths[0]);
  }
}

async function openFiles() {
  const selectedFiles = await window.electronAPI.openFiles();
  if (!selectedFiles || selectedFiles.length === 0) return;
  addFiles(selectedFiles);
  await selectFile(selectedFiles[0]);
}

async function openFolder() {
  const folderPath = await window.electronAPI.openFolder();
  if (!folderPath) return;

  // Si un dossier était déjà ouvert, on arrête de le surveiller
  if (fileTree.value) {
    window.electronAPI.unwatchFolder(fileTree.value.path);
  }

  const tree = await window.electronAPI.getTree(folderPath);
  fileTree.value = tree;
  window.electronAPI.watchFolder(folderPath);
}

async function refreshTree() {
  if (!fileTree.value) return;
  const tree = await window.electronAPI.getTree(fileTree.value.path);
  fileTree.value = tree;
}

function onDrop(e) {
  const droppedFiles = Array.from(e.dataTransfer.files)
    .filter(f => f.name.endsWith('.md'))
    // Dans Electron, pour des raisons de sécurité, 'path' n'est plus toujours accessible
    // On utilise electronAPI ou f.path s'il existe (comportement d'Electron classique)
    .map(f => window.electronAPI.getFilePath ? window.electronAPI.getFilePath(f) : f.path)
    .filter(Boolean);
  
  if (droppedFiles.length > 0) {
    addFiles(droppedFiles);
    selectFile(droppedFiles[0]);
  }
}

async function closeFile(path) {
  if (currentFile.value === path && isDirty.value) {
    await saveFile();
  }
  
  const idx = files.value.findIndex(f => f.path === path);
  if (idx !== -1) {
    files.value.splice(idx, 1);
    if (window.electronAPI.unwatchFile) {
      window.electronAPI.unwatchFile(path);
    }
  }

  if (currentFile.value === path) {
    if (files.value.length > 0) {
      const nextIdx = Math.min(idx, files.value.length - 1);
      await selectFile(files.value[nextIdx].path);
    } else {
      currentFile.value = null;
      currentContent.value = '';
      isDirty.value = false;
    }
  }
}

function closeFolder() {
  if (fileTree.value) {
    window.electronAPI.unwatchFolder(fileTree.value.path);
    fileTree.value = null;
  }
}

async function selectFile(filePath) {
  if (isDirty.value) {
    await saveFile();
  }

  // S'assurer que le fichier est ouvert dans un onglet
  if (!files.value.find(f => f.path === filePath)) {
    const name = await window.electronAPI.pathBasename(filePath);
    files.value.push({
      path: filePath,
      name: name
    });
    if (window.electronAPI.watchFile) {
      window.electronAPI.watchFile(filePath);
    }
  }

  currentFile.value = filePath;
  await updateCurrentFileName();
  const content = await window.electronAPI.readFile(filePath);
  currentContent.value = content;
  isDirty.value = false;
}

async function saveFile() {
  if (!currentFile.value) return;
  const content = editorRef.value?.getContent() ?? currentContent.value;
  await window.electronAPI.writeFile(currentFile.value, content);
  isDirty.value = false;
}

async function createNewFile() {
  showTemplateModal.value = true;
}

async function onTemplateSelect(content) {
  showTemplateModal.value = false;
  const filePath = await window.electronAPI.saveNewFile();
  if (!filePath) return;

  await window.electronAPI.writeFile(filePath, content);
  addFiles([filePath]);
  await selectFile(filePath);
}

async function exportPDF() {
  if (!currentFile.value) return;
  const result = await window.electronAPI.exportPDF(currentFile.value);
  if (result.success) {
    alert(`Exportation réussie : ${result.path}`);
  } else if (result.error) {
    alert(`Erreur d'exportation : ${result.error}`);
  }
}

function onKeydown(e) {
  if ((e.metaKey || e.ctrlKey) && e.key === 's') {
    e.preventDefault();
    saveFile();
  }
}

async function handleWikiLink(link) {
  if (!fileTree.value) return;
  const permalink = link.replace('wikilink:', '');

  // Search for the file in the tree
  const findFile = (node, name) => {
    if (node.type === 'file' && node.name.toLowerCase().replace(/\.md$/, '').replace(/ /g, '-') === name) {
      return node.path;
    }
    if (node.children) {
      for (const child of node.children) {
        const found = findFile(child, name);
        if (found) return found;
      }
    }
    return null;
  };

  const filePath = findFile(fileTree.value, permalink);
  if (filePath) {
    await selectFile(filePath);
  } else {
    alert(`Fichier non trouvé : ${permalink}`);
  }
}

onMounted(() => {
  document.addEventListener('keydown', onKeydown);

  // Écouter les clics sur les liens wiki (via un événement global délégué car Milkdown est hors Vue)
  document.addEventListener('click', async (e) => {
    const anchor = e.target.closest('a');
    if (anchor && anchor.getAttribute('href')?.startsWith('wikilink:')) {
      e.preventDefault();
      await handleWikiLink(anchor.getAttribute('href'));
    }
  });
  
  if (window.electronAPI.onFileChanged) {
    window.electronAPI.onFileChanged((_event, filePath, newContent) => {
      if (currentFile.value === filePath) {
        // Obtenir le contenu actuel (sans les retours à la ligne normalisés de macOS/Windows)
        const currentEditorContent = editorRef.value?.getContent() ?? currentContent.value;
        
        // Si le contenu a réellement changé (c'est-à-dire pas suite à notre propre sauvegarde)
        if (newContent !== currentEditorContent) {
          currentContent.value = newContent;
          isDirty.value = false;
        }
      }
    });
  }

  if (window.electronAPI.onTreeChanged) {
    window.electronAPI.onTreeChanged(async () => {
      await refreshTree();

      // Après un rafraîchissement de l'arborescence, on vérifie si les fichiers ouverts existent toujours
      // ou ont été renommés (pas facile à deviner, mais on peut au moins nettoyer ceux qui n'existent plus)
      // Pour l'instant, on se contente de rafraîchir l'arborescence.
      // Une amélioration future serait de suivre les renommages.
    });
  }
});
onUnmounted(() => document.removeEventListener('keydown', onKeydown));
</script>

<style scoped>
.app {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #2e3440;
}

/* ---- Barre de titre ---- */
.titlebar {
  height: 38px;
  background: #2e3440;
  display: flex;
  align-items: center;
  padding: 0 16px;
  -webkit-app-region: drag;
  user-select: none;
  border-bottom: 1px solid #3b4252;
  flex-shrink: 0;
}

.titlebar-traffic-lights {
  width: 72px;
  flex-shrink: 0;
}

.titlebar-title {
  flex: 1;
  text-align: center;
  font-size: 13px;
  color: #d8dee9;
  font-weight: 500;
}

.dirty-dot {
  color: #88c0d0;
  margin-left: 4px;
  font-size: 10px;
  vertical-align: middle;
}

.titlebar-actions {
  width: 72px;
  display: flex;
  justify-content: flex-end;
  -webkit-app-region: no-drag;
}

/* ---- Layout ---- */
.main {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.editor-area {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background: #2e3440;
}

.editor-with-toc {
  flex: 1;
  display: flex;
  overflow: hidden;
}

/* ---- Tabs ---- */
.tabs-bar {
  display: flex;
  align-items: center;
  background: #252932;
  overflow-x: auto;
  flex-shrink: 0;
  -webkit-app-region: no-drag;
}
.tabs-bar::-webkit-scrollbar {
  height: 4px;
}
.tabs-bar::-webkit-scrollbar-thumb {
  background: #4c566a;
  border-radius: 4px;
}

.tab {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 38px;
  padding: 0 12px;
  background: #272c36;
  color: #8490a8;
  border-right: 1px solid #1c1f26;
  cursor: pointer;
  min-width: 120px;
  max-width: 200px;
  transition: background 0.15s, color 0.15s;
  user-select: none;
}
.tab:hover {
  background: #2e3440;
}
.tab.active {
  background: #2e3440;
  color: #eceff4;
  border-top: 2px solid #88c0d0;
}

.tab-icon {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}

.tab-name {
  flex: 1;
  font-size: 13px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tab-dirty {
  color: #88c0d0;
  font-size: 10px;
  margin-left: -4px;
}

.tab-clean {
  color: transparent;
  font-size: 10px;
  margin-left: -4px;
}

.tab-close-btn {
  background: transparent;
  border: none;
  color: inherit;
  cursor: pointer;
  padding: 2px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.15s, background 0.15s;
}
.tab:hover .tab-close-btn {
  opacity: 0.6;
}
.tab.active .tab-close-btn {
  opacity: 0.8;
}
.tab-close-btn:hover {
  opacity: 1 !important;
  background: rgba(255, 255, 255, 0.1);
}
.tab-close-btn svg {
  width: 14px;
  height: 14px;
}

/* ---- Écran d'accueil ---- */
.welcome {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #2e3440;
}

.welcome-inner {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.welcome-icon {
  width: 56px;
  height: 56px;
  color: #4c566a;
  margin-bottom: 8px;
}

.welcome-inner h1 {
  font-size: 2rem;
  color: #eceff4;
  font-weight: 600;
}

.welcome-inner p {
  font-size: 0.95rem;
  color: #616e88;
}

.welcome-buttons {
  display: flex;
  gap: 12px;
  margin-top: 8px;
}

.btn-primary {
  background: #5e81ac;
  color: #eceff4;
  border: none;
  padding: 10px 24px;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.15s;
}
.btn-primary:hover { background: #81a1c1; }

.btn-secondary {
  background: #4c566a;
  color: #eceff4;
  border: none;
  padding: 10px 24px;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.15s;
}
.btn-secondary:hover { background: #616e88; }

.btn-icon {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s;
}
.btn-icon:hover {
  background: #3b4252;
}
</style>
