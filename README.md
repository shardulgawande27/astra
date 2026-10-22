# Astra

A personal, frontend-only knowledge base for DSA, JavaScript, and React interview questions — with multiple solutions per question and a trace-driven dry-run visualizer.

## Run

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # Vitest unit tests (trace generators, validation, merge, storage)
npm run typecheck  # tsc --noEmit
npm run build      # typecheck + production build into dist/
npm run preview    # serve the production build
```

## How data is stored

- All questions (with their solutions embedded) live in `localStorage` under `astra:data`, wrapped in the same versioned envelope used for exports: `{ app: "astra", version: 1, exportedAt, questions }`.
- Every change is saved automatically; other open tabs stay in sync via the `storage` event.
- Sample questions are seeded **once** on first launch. The `astra:meta` flag records this, so deleting samples (or everything) never restores them. They can be re-added on demand from Settings → Load samples (only missing ones are added).
- If stored data is unreadable, it is copied to `astra:data:backup-<timestamp>` instead of being overwritten.
- Theme preference lives in `astra:settings`.

## JSON import / export

- **Export all** (Settings) or **export one question** (download icon on a question page) produces the versioned envelope above.
- **Import** validates the file first (structure, enums, ids, dates, URLs, visualizer references), reports errors with paths, and shows a summary (new vs. conflicting ids) before anything is saved. You then choose:
  - **Merge** — keep existing questions; for id conflicts either overwrite with the imported copy or keep yours.
  - **Replace** — discard current data (requires a second confirmation).

## Dry Run Studio

Astra never executes user code (no `eval`). Each visualizer in `src/visualizer/generators/` is a deterministic trace generator paired with its own reference implementation; every step is a full snapshot (`TraceStep`) of the highlighted line, variables, array/map/stack state, comparison, and result, so stepping backwards is always consistent.

Built-in visualizers: Two Sum (brute force, hash map), Binary Search, Two Pointers (pair sum in sorted array), Sliding Window (max sum of size k), Stack (valid parentheses, push/pop/peek).

A solution links to a visualizer via `solution.dryRun = { visualizerId, input }`. Solutions without one show an explanation and let you preview or attach a compatible visualizer.

### Adding a visualizer

1. Create `src/visualizer/generators/<name>.ts` using `defineVisualizer({ id, code, fields, defaultInput, parse, generate, ... })` and push snapshots with `TraceBuilder`.
2. Register it in `src/visualizer/registry.ts`.
3. The registry test automatically checks that its default input runs, is deterministic, and only references real code lines.

## Project layout

```
src/
  types/            Question, Solution, Example, DryRunConfig, export envelope
  lib/              storage, validation, merge, stats, filters, download, formatting
  data/             bundled sample questions
  store/            React contexts (questions, settings)
  visualizer/       trace types, builder, input parsing, generators, registry
  components/       ui kit, layout, code viewer/editor, questions, solutions, studio, settings
  pages/            Dashboard, QuestionLibrary, QuestionDetail, QuestionFormPage, DryRunStudio, SettingsPage
```
