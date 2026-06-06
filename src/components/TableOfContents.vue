<template>
  <div class="toc">
    <div class="toc-header">Sommaire</div>
    <div v-if="items.length === 0" class="toc-empty">Aucun titre</div>
    <ul v-else class="toc-list">
      <li
        v-for="item in items"
        :key="item.id"
        :class="['toc-item', `level-${item.level}`]"
        @click="scrollTo(item.id)"
      >
        {{ item.text }}
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue';

const props = defineProps({
  content: String
});

const items = ref([]);

function parseToC(content) {
  const lines = content.split('\n');
  const headings = [];
  lines.forEach(line => {
    const match = line.match(/^(#{1,6})\s+(.*)$/);
    if (match) {
      headings.push({
        level: match[1].length,
        text: match[2],
        id: match[2].toLowerCase().replace(/[^\w]+/g, '-')
      });
    }
  });
  return headings;
}

watch(() => props.content, (newContent) => {
  items.value = parseToC(newContent);
}, { immediate: true });

function scrollTo(id) {
  // Find the heading in the document
  const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
  for (const heading of headings) {
    // Check if the heading text matches the ID
    const headingId = heading.textContent.toLowerCase().replace(/[^\w]+/g, '-');
    if (headingId === id) {
      // Find the scrollable container. Crepe uses an internal div for scrolling.
      const scrollContainer = heading.closest('.milkdown');
      if (scrollContainer) {
        // We use scrollIntoView on the heading itself
        heading.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        heading.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      break;
    }
  }
}
</script>

<style scoped>
.toc {
  width: 200px;
  background: #2e3440;
  border-left: 1px solid #3b4252;
  padding: 16px;
  overflow-y: auto;
  flex-shrink: 0;
}

.toc-header {
  font-size: 12px;
  text-transform: uppercase;
  color: #4c566a;
  letter-spacing: 1px;
  margin-bottom: 12px;
  font-weight: 700;
}

.toc-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.toc-item {
  font-size: 13px;
  color: #81a1c1;
  cursor: pointer;
  padding: 4px 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: color 0.15s;
}

.toc-item:hover {
  color: #88c0d0;
}

.toc-item.level-1 { font-weight: 600; }
.toc-item.level-2 { padding-left: 12px; }
.toc-item.level-3 { padding-left: 24px; font-size: 12px; }
.toc-item.level-4 { padding-left: 36px; font-size: 12px; }

.toc-empty {
  font-size: 12px;
  color: #4c566a;
  font-style: italic;
}
</style>
