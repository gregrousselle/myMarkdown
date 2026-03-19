# AGENTS.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

MyMarkdown is a desktop Markdown editor built with **Electron + Vue 3 + Milkdown Crepe**, bundled by **Vite**. The UI is in French and uses a **Nord** dark color theme (`#2e3440` background family).

## Commands

* **Dev (full app):** `npm run dev` — starts Vite dev server on port 5173, then launches Electron once the server is ready (uses `concurrently` + `wait-on`).

* **Dev (renderer only):** `npm run vite:dev` — starts only the Vite dev server (no Electron shell).

* **Dev (Electron only):** `npm run electron:dev` — launches Electron, expects Vite already running on localhost:5173.

* **Build:** `npm run build` — Vite production build to `dist/`.

There are no test or lint scripts configured.

## Architecture

The app follows Electron's two-process model:

### Main process (`index.js`)

Manages the `BrowserWindow`, native file dialogs, and all filesystem operations. In dev it loads `http://localhost:5173`; in production it loads `dist/index.html`. All Node/OS capabilities are exposed to the renderer exclusively through **IPC handlers** (`ipcMain.handle`):

* `dialog:open-folder`, `dialog:open-files`, `dialog:save-new-file` — native file/folder dialogs

* `fs:read-dir`, `fs:read-file`, `fs:write-file` — synchronous filesystem I/O

### Preload bridge (`preload.js`)

Exposes a `window.electronAPI` object to the renderer via `contextBridge`. The renderer never accesses Node APIs directly (`contextIsolation: true`).

### Renderer (`src/`)

A Vue 3 app (Composition API, `<script setup>`) mounted on `#app`.

* **`App.vue`** — Root component. Owns all file state (open files list, current file, dirty flag). Handles tab bar, drag-and-drop of `.md` files, and `⌘S` keyboard shortcut. Auto-saves when switching files.

* **`Editor.vue`** — Dual-mode editor: WYSIWYG via **Milkdown Crepe** (`@milkdown/crepe` with `frame-dark` theme) or raw text via a `<textarea>`. Exposes `getContent()`, `toggleMode()`, `triggerUndo/Redo/Copy/Paste` through `defineExpose`. Uses a `_replacing` flag to suppress dirty events during programmatic content replacement.

* **`EditorToolbar.vue`** — Stateless toolbar emitting events (`save`, `undo`, `redo`, `copy`, `paste`, `toggle-mode`).

* **`Sidebar.vue`** — Resizable file list panel (drag handle, min 180px / max 600px). Collapsible via toggle button.

### Key patterns

* File state is managed entirely in `App.vue`; child components communicate via props/events.

* The editor content is retrieved imperatively via `editorRef.getContent()` at save time, not through two-way binding.

* Milkdown Crepe is destroyed and recreated when toggling between WYSIWYG and raw text modes.

