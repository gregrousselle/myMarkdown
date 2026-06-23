<template>
  <div class="editor-wrapper">
    <div v-if="hasError && editorMode === 'wysiwyg'" class="editor-error-container">
      <div class="error-box">
        <svg class="error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <h3>Impossible d'afficher la vue formatée</h3>
        <p class="error-msg">{{ errorMessage || 'Une erreur inconnue est survenue lors de l\'initialisation de l\'éditeur.' }}</p>
        <p class="error-hint">Le fichier contient peut-être du Markdown complexe ou non géré par Milkdown. Vous pouvez basculer en mode source (texte brut) pour le consulter et le corriger.</p>
        <button class="btn-fallback" @click="fallbackToSource">Basculer en mode source (texte brut)</button>
      </div>
    </div>

    <div v-show="editorMode === 'wysiwyg' && !hasError" ref="rootRef" class="crepe-root" @scroll="onWysiwygScroll"></div>
    <textarea
      v-if="editorMode === 'source'"
      ref="sourceRef"
      class="source-editor"
      :value="content"
      @input="onSourceInput"
      @scroll="onSourceScroll"
    ></textarea>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { Crepe } from '@milkdown/crepe';
import { listener, listenerCtx } from '@milkdown/plugin-listener';
import { remarkPluginsCtx, editorViewCtx } from '@milkdown/core';
import { undo, redo } from '@milkdown/prose/history';
import remarkFrontmatter from 'remark-frontmatter';
import remarkWikiLink from 'remark-wiki-link';
import '@milkdown/crepe/theme/common/style.css';
import '@milkdown/crepe/theme/frame-dark.css';

const props = defineProps({
  content: { type: String, default: '' },
  editorMode: { type: String, default: 'wysiwyg' },
  scrollPos: { type: Number, default: 0 }
});

const emit = defineEmits(['dirty', 'content-update', 'mode-change', 'scroll']);

const rootRef = ref(null);
const sourceRef = ref(null);
let crepe = null;
let isInternalUpdate = false;
const isReady = ref(false);
let pendingContent = null;
const hasError = ref(false);
const errorMessage = ref('');

function fallbackToSource() {
  emit('mode-change', 'source');
}

const normalize = (str) => (str || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();

async function init() {
  if (!rootRef.value) return;
  isReady.value = false;
  pendingContent = null;

  crepe = new Crepe({
    root: rootRef.value,
    defaultValue: props.content,
  });

  const restoreScroll = () => {
    if (props.editorMode === 'wysiwyg' && rootRef.value) {
      rootRef.value.scrollTop = props.scrollPos;
    } else if (props.editorMode === 'source' && sourceRef.value) {
      sourceRef.value.scrollTop = props.scrollPos;
    }
  };

  // Adding remark plugins
  crepe.editor
    .config((ctx) => {
      ctx.get(listenerCtx).markdownUpdated((ctx, markdown, prevMarkdown) => {
        if (markdown !== prevMarkdown && !isInternalUpdate && isReady.value) {
          emit('content-update', markdown);
          emit('dirty');
        }
      });

      ctx.update(remarkPluginsCtx, (prev) => [
        ...prev,
        { plugin: remarkFrontmatter },
        {
          plugin: remarkWikiLink,
          options: { hrefTemplate: (permalink) => `wikilink:${permalink}` }
        }
      ]);
    })
    .use(listener);

  try {
    await crepe.create();
    isReady.value = true;
    hasError.value = false;
    errorMessage.value = '';

    // Initial scroll restoration
    setTimeout(restoreScroll, 50);

    if (pendingContent !== null) {
      if (normalize(pendingContent) !== normalize(crepe.getMarkdown())) {
        isInternalUpdate = true;
        crepe.setMarkdown(pendingContent);
        setTimeout(() => {
          isInternalUpdate = false;
        }, 100);
      }
      pendingContent = null;
    }
  } catch (err) {
    console.error('Failed to create Crepe editor:', err);
    hasError.value = true;
    errorMessage.value = err.message || String(err);
  }
}

watch(() => props.content, (newContent) => {
  if (!isReady.value) {
    pendingContent = newContent;
    return;
  }

  if (crepe && !isInternalUpdate) {
    try {
      const currentMarkdown = crepe.getMarkdown();
      if (normalize(newContent) !== normalize(currentMarkdown)) {
        isInternalUpdate = true;
        crepe.setMarkdown(newContent);
        // We need to wait for the next tick or use a timeout because setMarkdown might be async or trigger listeners
        // Also, Crepe might be doing internal processing, so we keep isInternalUpdate for a bit.
        setTimeout(() => {
          isInternalUpdate = false;
        }, 100);
      }
      // Reset error state on successful update
      hasError.value = false;
      errorMessage.value = '';
    } catch (err) {
      console.error('Error updating Crepe markdown:', err);
      hasError.value = true;
      errorMessage.value = err.message || String(err);
    }
  }
});

defineExpose({
  getContent: () => {
    if (!isReady.value || !crepe) return props.content;
    try {
      return crepe.getMarkdown();
    } catch (err) {
      console.error('Error getting Crepe markdown:', err);
      return props.content;
    }
  },
  triggerUndo: () => {
    if (!isReady.value || !crepe) return;
    try {
      crepe.editor.action((ctx) => {
        const view = ctx.get(editorViewCtx);
        const { state, dispatch } = view;
        undo(state, dispatch);
      });
    } catch (err) {
      console.error('Error triggering undo:', err);
    }
  },
  triggerRedo: () => {
    if (!isReady.value || !crepe) return;
    try {
      crepe.editor.action((ctx) => {
        const view = ctx.get(editorViewCtx);
        const { state, dispatch } = view;
        redo(state, dispatch);
      });
    } catch (err) {
      console.error('Error triggering redo:', err);
    }
  },
  triggerCopy: () => {
    document.execCommand('copy');
  },
  triggerPaste: () => {
    if (!isReady.value || !crepe) return;
    navigator.clipboard.readText().then(text => {
      if (crepe && isReady.value) {
        try {
          crepe.editor.action((ctx) => {
            const view = ctx.get(editorViewCtx);
            const { state, dispatch } = view;
            dispatch(state.tr.insertText(text));
          });
        } catch (err) {
          console.error('Error triggering paste:', err);
        }
      }
    });
  },
  toggleMode: () => {
    const newMode = props.editorMode === 'wysiwyg' ? 'source' : 'wysiwyg';
    emit('mode-change', newMode);
  }
});

function onSourceInput(e) {
  emit('content-update', e.target.value);
  emit('dirty');
}

function onWysiwygScroll(e) {
  emit('scroll', e.target.scrollTop);
}

function onSourceScroll(e) {
  emit('scroll', e.target.scrollTop);
}

watch(() => props.editorMode, () => {
  setTimeout(() => {
    if (props.editorMode === 'wysiwyg' && rootRef.value) {
      rootRef.value.scrollTop = props.scrollPos;
    } else if (props.editorMode === 'source' && sourceRef.value) {
      sourceRef.value.scrollTop = props.scrollPos;
    }
  }, 50);
});

onMounted(init);
onUnmounted(() => {
  isReady.value = false;
  pendingContent = null;
  if (crepe) {
    try {
      crepe.destroy();
    } catch (err) {
      console.error('Error destroying Crepe editor:', err);
    }
    crepe = null;
  }
});
</script>

<style scoped>
.editor-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #2e3440;
  overflow: hidden;
  height: 100%;
}
.crepe-root {
  flex: 1;
  overflow-y: auto;
  width: 100%;
}
.source-editor {
  width: 100%;
  height: 100%;
  background: #2e3440;
  color: #eceff4;
  border: none;
  padding: 2rem;
  font-family: 'Fira Code', monospace;
  font-size: 14px;
  line-height: 1.6;
  outline: none;
  resize: none;
}
.editor-error-container {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  width: 100%;
  background: #2e3440;
  padding: 2rem;
  color: #eceff4;
}
.error-box {
  max-width: 500px;
  background: #3b4252;
  border-radius: 8px;
  padding: 2.5rem 2rem;
  text-align: center;
  border: 1px solid #bf616a;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
}
.error-icon {
  width: 48px;
  height: 48px;
  color: #bf616a;
  margin-bottom: 1rem;
}
.error-box h3 {
  font-size: 18px;
  margin-bottom: 0.5rem;
  color: #eceff4;
}
.error-msg {
  font-family: 'Fira Code', monospace;
  background: #2e3440;
  padding: 0.75rem 1rem;
  border-radius: 4px;
  font-size: 13px;
  color: #d8dee9;
  margin: 1.25rem 0;
  text-align: left;
  word-break: break-word;
  max-height: 150px;
  overflow-y: auto;
  border-left: 3px solid #bf616a;
}
.error-hint {
  font-size: 13px;
  color: #a3be8c;
  line-height: 1.5;
  margin-bottom: 1.5rem;
}
.btn-fallback {
  background: #bf616a;
  color: #eceff4;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  font-weight: 500;
  transition: background 0.15s;
}
.btn-fallback:hover {
  background: #d08770;
}
</style>

<style>
/* Global Milkdown Crepe overrides to match Nord dark theme */
.crepe-root .milkdown {
  background: #2e3440 !important;
  color: #eceff4 !important;
  --crepe-color-background: #2e3440 !important;
  --crepe-color-on-background: #eceff4 !important;
  --crepe-color-selected: #4c566a !important;
  --crepe-font-default: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
  --crepe-font-title: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
}

.crepe-root .milkdown-root,
.crepe-root .editor {
  background: transparent !important;
}

/* Ensure the ProseMirror editor fills the container and is readable */
.crepe-root .milkdown .ProseMirror {
  min-height: 100%;
  outline: none;
  padding: 2rem;
  color: #eceff4 !important;
  font-size: 15px;
  line-height: 1.6;
}
</style>
