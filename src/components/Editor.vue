<template>
  <div class="editor-wrapper">
    <div ref="rootRef" class="crepe-root"></div>
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
});

const emit = defineEmits(['dirty', 'content-update']);

const rootRef = ref(null);
let crepe = null;
let isInternalUpdate = false;

async function init() {
  if (!rootRef.value) return;
  crepe = new Crepe({
    root: rootRef.value,
    defaultValue: props.content,
  });

  // Adding remark plugins
  crepe.editor
    .config((ctx) => {
      ctx.get(listenerCtx).markdownUpdated((ctx, markdown, prevMarkdown) => {
        if (markdown !== prevMarkdown && !isInternalUpdate) {
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

  await crepe.create();
}

watch(() => props.content, (newContent) => {
  if (crepe && !isInternalUpdate) {
    const currentMarkdown = crepe.getMarkdown();
    if (newContent !== currentMarkdown) {
      isInternalUpdate = true;
      crepe.setMarkdown(newContent);
      // We need to wait for the next tick or use a timeout because setMarkdown might be async or trigger listeners
      setTimeout(() => {
        isInternalUpdate = false;
      }, 50);
    }
  }
});

defineExpose({
  getContent: () => crepe?.getMarkdown() ?? props.content,
  triggerUndo: () => {
    crepe.editor.action((ctx) => {
      const view = ctx.get(editorViewCtx);
      const { state, dispatch } = view;
      undo(state, dispatch);
    });
  },
  triggerRedo: () => {
    crepe.editor.action((ctx) => {
      const view = ctx.get(editorViewCtx);
      const { state, dispatch } = view;
      redo(state, dispatch);
    });
  },
  triggerCopy: () => {
    document.execCommand('copy');
  },
  triggerPaste: () => {
    navigator.clipboard.readText().then(text => {
      if (crepe) {
        crepe.editor.action((ctx) => {
          const view = ctx.get(editorViewCtx);
          const { state, dispatch } = view;
          dispatch(state.tr.insertText(text));
        });
      }
    });
  },
  toggleMode: () => {
    // Crepe doesn't have a simple "raw" toggle like Milkdown v6,
    // but we can emit the mode change to let App.vue handle it if it wants,
    // or we can implement a simple text-only mode.
    // For now, let's just emit to satisfy the interface.
    const newMode = props.editorMode === 'wysiwyg' ? 'source' : 'wysiwyg';
    emit('mode-change', newMode);
  }
});

onMounted(init);
onUnmounted(() => {
    if (crepe) crepe.destroy();
});
</script>

<style scoped>
.editor-wrapper {
  flex: 1;
  background: #2e3440;
}
.crepe-root {
  height: 100%;
}
</style>
