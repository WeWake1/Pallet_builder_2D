# Pallet Designer — Issue Tracker

Running list from the codebase review (2026-06-05). We work through these one
by one. Status: ⬜ todo · 🟡 in progress / discussing · ✅ done.

## Conceptual / model
- ✅ **Drawing scale & real-world units** — store is now real mm; drawing shown at
  **1:10** (adjustable 1:5–1:25 via Properties ▸ Drawing Scale). Rulers, grid,
  snap, dimension lines, drop & properties all read/write real mm. Scale + real
  page size shown under the artboard. Old paper-mm saves auto-migrate ×10 on load.
  Industry-standard defaults (deck 1200×100×22, block 100×100×78, etc.).
  - ⬜ Follow-up: Final tab / PDF still **auto-fit each view** to its cell (not a
    single shared scale). Dimensions there read real mm, but to make the exported
    sheet truly "to scale" we'd lay all four views out at one common scale.
  - ⬜ Minor: grid major (500mm) emphasis lines don't align — grid renders all-minor.

## 🔴 Data loss
- ✅ **Autosave + crash/refresh recovery** — rolling snapshot to localStorage
  (debounced ~1.5s + flush on tab close); restores on reload and skips the
  landing page when recovered work exists.
- ⬜ **Template dropdown wipes the canvas** — `loadPreset` clears all views with
  only an (unobvious) undo. Add a confirm, and rethink presets (all currently
  produce an empty canvas).
- ⬜ **Final-tab layout/text not saved** — `finalViewConfig` / `finalTextConfig`
  are omitted from saved & exported `.pallet` projects (autosave now includes
  them; explicit Save/Export still need the fix).

## 🟠 Export fidelity (WYSIWYG)
- ⬜ **Callouts** render in the PDF but not in the Final-tab preview.
- ✅ **Dimension lines now auto-measure** — value tracks the line length on resize
  (and reads real mm).
- ⬜ **Three different dimension renderings** (live canvas / Final preview / PDF) —
  unify into one shared renderer.
- ⬜ **PDF text scaling is approximate** for moved/scaled Final-tab text.

## 🟡 Editing model
- ⬜ **Properties-panel edits aren't undoable** (no history capture).
- 🟡 **Number inputs** — component dimensions & position now accept decimals
  (`parseFloat`) and single-object resize keeps 2-decimal precision; annotation
  value/position fields still `parseInt` (to do).
- ⬜ **Multi-select editing half-applied** — width/position/rotation change only
  the first selected component.
- ⬜ **Layer-order changes aren't undoable.**
- ⬜ **Right-click uses stale selection** instead of selecting under the cursor.

## 🟢 Lower priority
- ⬜ **Escape ≠ deselect** (listed in shortcuts modal, not implemented).
- ⬜ **Add-via-click vs drag differ** (centre-board rotation).
- ⬜ **Context-menu / shortcut labels** inconsistent with real bindings.
- ⬜ **Unused spec fields** (reversibility, usage, tolerances) never displayed.
- ⬜ **Lint**: one `any`, a `Math.random()` in render, an unused arg; empty dead
  file `src/renderers/palletRenderer.ts`.

## Mobile (deferred — not a priority yet)
- ⬜ **MobileToolbar "Text" / "More" buttons are dead**; no properties/delete/
  annotations on mobile. Revisit after the desktop experience is solid.
