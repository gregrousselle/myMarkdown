<!--
  Editor.vue — bascule entre WYSIWYG (Milkdown Crepe) et texte brut (textarea)
-->
<template>
  <div class="editor-wrapper">

    <!-- Mode WYSIWYG : Milkdown Crepe -->
    <div v-if="mode === 'wysiwyg'" ref="rootRef" class="crepe-root"></div>

    <!-- Mode texte brut : textarea -->
    <textarea
      v-else
      ref="textareaRef"
      class="text-editor"
      v-model="rawText"
      @input="emit('dirty')"
      spellcheck="false"
    />

  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { Crepe } from '@milkdown/crepe';
import { replaceAll } from '@milkdown/kit/utils';
import { editorViewCtx, commandsCtx } from '@milkdown/kit/core';
import { undo, redo } from '@milkdown/kit/prose/history';
import { gfm } from '@milkdown/kit/preset/gfm';
import { slashFactory, SlashProvider } from '@milkdown/kit/plugin/slash';
import {
  wrapInHeadingCommand,
  wrapInBulletListCommand,
  wrapInOrderedListCommand,
  wrapInBlockquoteCommand,
  createCodeBlockCommand,
  insertHrCommand,
} from '@milkdown/kit/preset/commonmark';
import '@milkdown/crepe/theme/common/style.css';
import '@milkdown/crepe/theme/frame-dark.css';

const slash = slashFactory('myMarkdown');

const props = defineProps({
  content: { type: String, default: '' },
});

const emit = defineEmits(['dirty', 'mode-change']);

const rootRef = ref(null);
const textareaRef = ref(null);
const mode = ref('wysiwyg');
const rawText = ref(props.content);
let crepe = null;
let _replacing = false;

function callCmd(cmd, arg) {
  crepe?.editor.action((ctx) => {
    ctx.get(commandsCtx).call(cmd.key, arg);
  });
}

function buildSlashMenu(editorView) {
  const menu = document.createElement('div');
  menu.className = 'slash-dropdown';
  const items = [
    { label: 'Titre 1',          icon: 'H1',  action: () => callCmd(wrapInHeadingCommand, 1) },
    { label: 'Titre 2',          icon: 'H2',  action: () => callCmd(wrapInHeadingCommand, 2) },
    { label: 'Titre 3',          icon: 'H3',  action: () => callCmd(wrapInHeadingCommand, 3) },
    { label: 'Liste à puces',    icon: '•',   action: () => callCmd(wrapInBulletListCommand) },
    { label: 'Liste numérotée',  icon: '1.',  action: () => callCmd(wrapInOrderedListCommand) },
    { label: 'Citation',         icon: '"',   action: () => callCmd(wrapInBlockquoteCommand) },
    { label: 'Bloc de code',     icon: '</>',  action: () => callCmd(createCodeBlockCommand) },
    { label: 'Séparateur',       icon: '―',   action: () => callCmd(insertHrCommand) },
  ];
  items.forEach(({ label, icon, action }) => {
    const item = document.createElement('div');
    item.className = 'slash-item';
    item.innerHTML = `<span class="slash-icon">${icon}</span><span>${label}</span>`;
    item.addEventListener('mousedown', (e) => {
      e.preventDefault();
      const { state, dispatch } = editorView;
      const { from } = state.selection;
      dispatch(state.tr.delete(from - 1, from));
      action();
    });
    menu.appendChild(item);
  });
  return menu;
}

async function initCrepe(content) {
  if (!rootRef.value) return;
  crepe = new Crepe({ root: rootRef.value, defaultValue: content });
  crepe.editor.use(gfm);
  crepe.editor.use(slash);
  crepe.editor.config((ctx) => {
    ctx.set(slash.key, {
      view(editorView) {
        const provider = new SlashProvider({ content: buildSlashMenu(editorView) });
        return {
          update: (view, prevState) => provider.update(view, prevState),
          destroy: () => provider.destroy(),
        };
      },
    });
  });
  crepe.on((listener) => {
    listener.markdownUpdated(() => {
      if (!_replacing) emit('dirty');
    });
  });
  await crepe.create();
}

onMounted(() => initCrepe(props.content));

onUnmounted(() => {
  crepe?.destroy();
  crepe = null;
});

async function toggleMode() {
  if (mode.value === 'wysiwyg') {
    rawText.value = crepe?.getMarkdown() ?? rawText.value;
    await crepe?.destroy();
    crepe = null;
    mode.value = 'text';
  } else {
    mode.value = 'wysiwyg';
    await nextTick();
    await initCrepe(rawText.value);
  }
}

watch(mode, (val) => emit('mode-change', val));

// Rechargement du contenu lors du changement de fichier sélectionné
watch(
  () => props.content,
  (newContent) => {
    rawText.value = newContent;
    if (mode.value === 'wysiwyg' && crepe) {
      _replacing = true;
      crepe.editor.action(replaceAll(newContent));
      Promise.resolve().then(() => { _replacing = false; });
    }
  }
);

function triggerUndo() {
  if (mode.value === 'wysiwyg' && crepe) {
    crepe.editor.action((ctx) => {
      const view = ctx.get(editorViewCtx);
      undo(view.state, view.dispatch);
    });
  } else if (textareaRef.value) {
    textareaRef.value.focus();
    document.execCommand('undo');
  }
}

function triggerRedo() {
  if (mode.value === 'wysiwyg' && crepe) {
    crepe.editor.action((ctx) => {
      const view = ctx.get(editorViewCtx);
      redo(view.state, view.dispatch);
    });
  } else if (textareaRef.value) {
    textareaRef.value.focus();
    document.execCommand('redo');
  }
}

function triggerCopy() {
  document.execCommand('copy');
}

async function triggerPaste() {
  try {
    const text = await navigator.clipboard.readText();
    if (mode.value === 'text' && textareaRef.value) {
      const el = textareaRef.value;
      el.focus();
      const start = el.selectionStart;
      const end = el.selectionEnd;
      rawText.value = rawText.value.slice(0, start) + text + rawText.value.slice(end);
      await nextTick();
      el.selectionStart = el.selectionEnd = start + text.length;
      emit('dirty');
    } else if (mode.value === 'wysiwyg' && crepe) {
      crepe.editor.action((ctx) => {
        const view = ctx.get(editorViewCtx);
        view.focus();
        const { tr, selection } = view.state;
        view.dispatch(tr.insertText(text, selection.from, selection.to));
      });
      emit('dirty');
    }
  } catch {
    // Clipboard non accessible
  }
}

function getContent() {
  if (mode.value === 'wysiwyg') return crepe?.getMarkdown() ?? rawText.value;
  return rawText.value;
}

defineExpose({ getContent, toggleMode, triggerUndo, triggerRedo, triggerCopy, triggerPaste });
</script>

<style>
/* Surcharge de la couleur de fond et de la police Milkdown Crepe */
.crepe-root .milkdown {
  --crepe-color-background: #2e3440;
  --crepe-color-selected: #6b6c8a;
  --crepe-font-default: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --crepe-font-title: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

/* Conteneur principal */
.editor-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #2e3440;
  overflow: hidden;
}

/* Espace de saisie WYSIWYG */
.crepe-root {
  flex: 1;
  overflow-y: auto;
  width: 100%;
  padding: 24px 0;
}

/* Hauteur minimale de l'éditeur ProseMirror */
.crepe-root .milkdown .ProseMirror {
  min-height: calc(100vh - 160px);
}

/* S'assure que le fond du milkdown s'aligne avec le thème sombre */
.crepe-root .milkdown-root,
.crepe-root .editor {
  background: transparent;
}

/* Menu slash flottant */
.slash-dropdown {
  background: #3b4252;
  border: 1px solid #4c566a;
  border-radius: 6px;
  padding: 4px;
  min-width: 200px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
  z-index: 100;
}

.slash-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 10px;
  border-radius: 4px;
  cursor: pointer;
  color: #d8dee9;
  font-size: 13px;
}

.slash-item:hover {
  background: #434c5e;
}

.slash-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  font-size: 11px;
  font-weight: 700;
  color: #88c0d0;
}

/* Zone de texte brut */
.text-editor {
  flex: 1;
  width: 100%;
  background: #2e3440;
  color: #d8dee9;
  border: none;
  outline: none;
  resize: none;
  padding: 32px 40px;
  font-family: 'SF Mono', 'Fira Code', Menlo, Monaco, 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.8;
  tab-size: 2;
}
</style>


