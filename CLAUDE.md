# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository layout

This repo contains two independent npm projects (no root `package.json` or workspace config — each is built and run from its own directory):

- **`pallet-designer/`** — the actual product. A client-side 2D pallet specification-sheet designer (React 19 + Vite + Fabric.js v6). **Nearly all work happens here.**
- **`my-app/`** — an unmodified `create-next-app` starter (Next.js 16). Not used by the product; ignore unless explicitly asked.

## Commands (run inside `pallet-designer/`)

```bash
npm install
npm run dev        # Vite dev server with HMR
npm run build      # tsc -b (typecheck) && vite build → dist/
npm run lint       # eslint .
npm run preview    # serve the production build
```

- There is **no test runner** configured. `npm run build` runs `tsc -b` first, so it doubles as the typecheck/correctness gate — run it after non-trivial changes.
- Vite builds with `base: './'` (relative asset paths), so `dist/` is a portable static bundle deployable to any host.
- Path alias `@/` → `pallet-designer/src/` (set in `vite.config.ts` and tsconfigs).

## Architecture (pallet-designer)

A specification sheet describes one pallet across **four views** — `top`, `side`, `end`, `bottom` (the `ViewType` union). Each view is its own 2D scene of *components* (boards/blocks) and *annotations* (text / dimension / callout).

### State: one Zustand store is the source of truth
`src/store/useStore.ts` holds the entire app state and every mutation; types live in `src/types/index.ts`.
- `components` and `annotations` are both `Record<ViewType, [...]>` — every view has its own array, and almost every action operates on `canvas.activeView`.
- Undo/redo (`history.past`/`future`) snapshots **both** `components` and `annotations` together. Undoable mutations push the prior snapshot before `set`; high-frequency updates during drag/resize deliberately do **not** — history is captured once per gesture on Fabric's `object:modified` event via `captureHistory()`.
- Selection is multi-component (`selectedComponentIds: string[]`) plus a single `selectedAnnotationId`. Grouping is modeled by a shared `groupId` on items, not by Fabric groups.
- Prefer the exported selector hooks (`useActiveViewComponents`, `useSelectedComponent`, `useSelectedAnnotation`, `useCanUndo`, …) over re-deriving from raw state.

### Rendering: the store is mirrored into Fabric.js imperatively
`src/hooks/useFabricCanvas.ts` (~1900 lines) is the heart of the app and the trickiest file — the bridge between the declarative Zustand store and an imperative Fabric.js canvas. A set of `useEffect`s diff the store against canvas objects and add/update/remove Fabric shapes; Fabric event handlers (`object:modified`, `selection:*`, mouse events) write back into the store.
- Each Fabric object carries a custom `data` field (`{ id, type, isGrid, isLabel, isAnnotation, … }`) mapping it back to a store entity — use `getObjectData`/`setObjectData`.
- A module-level `globalFabricCanvas` (via `getGlobalFabricCanvas()`) exposes the live canvas to export code.
- Guard refs (`isUpdatingSelectionRef`, `isDraggingRef`, `isScalingRef`) prevent feedback loops between Fabric events and store-driven re-syncs. Be careful adding effects that both read and write selection/position.
- The empty, untracked `src/renderers/` dir is **not** the renderer — rendering lives in this hook (and, separately, in `pdfExport.ts`).

### Units & coordinates
- The store keeps everything in **millimeters**; the canvas draws at `CANVAS_SCALE = 2` px/mm. Convert with `mmToPixels`/`pixelsToMm` (`src/utils/helpers.ts`) — never hard-code the factor.
- A component's `position` is its **top-left** in mm, but Fabric shapes draw with center origin, so conversions add `width/2` and `length/2`. `getCrispPosition` nudges centers onto half-pixel boundaries so odd-width parts (e.g. 14.5 mm) don't render blurry.
- `dimensions` is `{ width, thickness, length }`; on the top/bottom canvas the footprint is `width × length` (thickness applies to side/end views and the spec sheet).

### Two editor modes (`canvas.editorMode`)
- **`'views'`** (`components/Canvas/MultiViewCanvas.tsx`): edit one view at a time on a **portrait** A4 artboard. Owns palette drag-drop, keyboard shortcuts, context menu, rulers, and zoom/pan.
- **`'final'`** (`components/Canvas/FinalCanvas.tsx`): composes all four views plus a spec box onto a **landscape** A4 template — the print/export layout. Per-view placement/scale persists in `finalViewConfig` and text tweaks in `finalTextConfig`. It registers its own image-export function into the store via `setFinalCanvasExportFn`.

A4 is 210×297 mm; `A4_WIDTH_PX`/`A4_HEIGHT_PX` are the px equivalents at `CANVAS_SCALE`.

### Keyboard shortcuts
All global shortcuts live in one `keydown` handler in `MultiViewCanvas.tsx` and read fresh state via `useStore.getState()` (not closures). `1`–`4` switch views; Ctrl/Cmd+Z and +Shift+Z/+Y undo/redo; C/X/V/D copy/cut/paste/duplicate (paste targets the cursor position); A select-all-in-view; G / Shift+G group/ungroup; Ctrl+`[`/`]` (± Shift) layer ordering; Delete/Backspace. Keep `components/UI/KeyboardShortcutsModal.tsx` in sync with this handler.

### Persistence & export
- `src/utils/projectStorage.ts`: saves recent projects to localStorage and imports/exports `.pallet` files (JSON of a partial `AppState`). It validates and **sanitizes** loaded state (e.g. backfills missing view arrays) — preserve those guards when changing the state shape.
- Single-component copy/paste also works **across browser tabs** via the `palletDesigner.clipboard.component` localStorage key.
- `src/utils/pdfExport.ts` → `exportToPDF(options)` (called from `Header.tsx`): builds an A4 PDF with jsPDF by re-drawing each view onto an off-screen Fabric `StaticCanvas`. This re-implements component/annotation drawing independently of `useFabricCanvas`, so visual changes often must be mirrored in both places. (`html2canvas` is a dependency but currently unused in source.)

### UI shell & conventions
- `App.tsx` shows `LandingPage` first, then the editor: `Header` + left `Sidebar` (palette) + canvas + right `PropertiesPanel`; on mobile (`isMobileDevice()`) the side panels give way to `MobileToolbar`. Each region is wrapped in an `ErrorBoundary`.
- Tailwind CSS v4 via `@tailwindcss/vite` (config-less; theme tokens are CSS variables in `src/index.css`). shadcn/ui "new-york" style is configured (`components.json`); compose classes with `cn()` from `src/lib/utils.ts`.
- Branding defaults to "Ambica Patterns India Pvt Ltd" in the store's `initialBranding`.
