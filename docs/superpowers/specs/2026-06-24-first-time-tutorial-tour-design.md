# First-time User Tutorial (Spotlight Tour) — Design

**Date:** 2026-06-24
**Status:** Approved, ready for implementation plan

## Goal

Give first-time users a guided, step-by-step spotlight tour that explains the
main areas of the KPR Smart Dashboard. The user can skip ("Lewati") at any
time, and the skip/completion is remembered so the tour does not reappear on
later visits. The user can re-open the tour anytime via a button in the
sidebar.

## Requirements

1. **First-time auto-start.** On the first visit (when the persistence flag is
   not set), the tour opens automatically once initial loading finishes.
2. **Skippable.** A "Lewati" action closes the tour at any step. Completing the
   final step ("Selesai") also closes it. Both outcomes persist the same flag.
3. **Remembered.** Once skipped or completed, the tour does not auto-open again
   on reload. Persisted in `localStorage` AND IndexedDB (`setDbValue`), matching
   the persistence pattern used everywhere else in this app.
4. **Re-triggerable.** A "Bantuan / Tutorial" button in the sidebar footer
   re-opens the tour anytime, independent of the persistence flag.

## Architecture

### New component: `src/components/TutorialTour.tsx`

A self-contained, dependency-free overlay component (no tour library).

**Props**
- `steps: TutorialStep[]`
- `isOpen: boolean`
- `onClose: () => void` — called for both "Lewati" and "Selesai".

**Type**
```ts
interface TutorialStep {
  targetId?: string;          // DOM id to spotlight; omit for a centered step
  title: string;
  body: string;
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'center';
}
```

**Behavior**
- Tracks `currentStep` internally; resets to 0 each time `isOpen` flips true.
- **Spotlight cutout:** a positioned div sized to the target element's bounding
  rect with `box-shadow: 0 0 0 9999px rgba(0,0,0,0.65)` to dim everything except
  the target, plus a glowing ring using `--primary` / `--primary-glow`.
- **Tooltip:** a `glass-panel` card placed beside the target per `placement`,
  containing title, body, a step counter (e.g. `3 / 8`), and the controls:
  - **Lewati** (skip) — calls `onClose`.
  - **Kembali** — previous step (hidden/disabled on the first step).
  - **Lanjut →** — next step; on the last step the label becomes **Selesai**
    and it calls `onClose`.
- **Measurement:** measure the target via `document.getElementById` inside
  `useLayoutEffect`, recomputed on step change and on `resize` / `scroll`.
  `scrollIntoView({ block: 'center' })` the target so it is visible.
- **Fallback:** if the target id is missing or has a zero-size rect, render the
  tooltip centered on screen with no cutout. The tour never breaks on a missing
  target.
- **Keyboard:** `Escape` closes (calls `onClose`). Optionally arrow keys for
  prev/next.
- **z-index** above the header (50) and the mobile sidebar drawer (60): use
  `>= 200`.

### Changes to `src/App.tsx`

1. **Highlight targets** — add stable `id` attributes to:
   - the property quick-picker `<select>` in the header → `tour-property-picker`
   - the 5 sidebar nav buttons → `tour-nav-properties`, `tour-nav-calculator`,
     `tour-nav-upfront`, `tour-nav-calendar`, `tour-nav-compare`
   - the export/import button group → `tour-data-io`
   - the theme switcher container → `tour-theme`
2. **State** — `const [tutorialOpen, setTutorialOpen] = useState(false)`.
3. **Auto-start effect** — after `isLoading` becomes `false`, if
   `localStorage.getItem('kpr_tutorial_done') !== 'true'`, set `tutorialOpen`
   true. Runs once (guarded so it does not re-fire on every render).
4. **Open behavior** — when opening the tour (auto or via button), force
   `setSidebarOpen(true)` so sidebar targets exist (opens the mobile drawer).
5. **Close handler** — `handleCloseTutorial`: set `kpr_tutorial_done = 'true'`
   in `localStorage` and `setDbValue('kpr_tutorial_done', true)`, then
   `setTutorialOpen(false)`.
6. **Render** `<TutorialTour steps={TUTORIAL_STEPS} isOpen={tutorialOpen}
   onClose={handleCloseTutorial} />` near the other top-level overlays.

### Re-trigger button

A "Bantuan / Tutorial" button in the sidebar footer (near the theme switcher),
using a lucide icon (`GraduationCap` or `HelpCircle`). On click: open the tour
(reset to step 0) regardless of the persistence flag; on mobile, after opening,
the drawer stays open for the sidebar steps.

## Tour steps (8)

1. **Welcome** (centered, no target) — short intro to the dashboard.
2. `tour-property-picker` — pick/switch the active property here.
3. `tour-nav-properties` — Kelola Properti: add/edit property profiles.
4. `tour-nav-calculator` — Skema & Bunga: configure bank scheme, rate, tenor.
5. `tour-nav-upfront` — Biaya-biaya: upfront costs, taxes, fees.
6. `tour-nav-calendar` — Kalender Cicilan: amortization schedule & extra payments.
7. `tour-nav-compare` — Bandingkan Pilihan: side-by-side comparison.
8. `tour-data-io` + closing note — export/import; all data stored locally in the
   browser. Final step label "Selesai".

(Theme switcher `tour-theme` may be folded into a step or added as a 9th step;
content is explanatory only and switches no tabs.)

## Persistence

- **Key:** `kpr_tutorial_done`, value `'true'`.
- Written to `localStorage` and IndexedDB via `setDbValue`.
- Auto-start reads `localStorage` only (synchronous, available before the async
  IndexedDB load resolves) — consistent with `kpr_sample_notice_dismissed`.

## Out of scope (YAGNI)

- No third-party tour library.
- No per-tab deep sub-tours or tab switching during the tour.
- No analytics/telemetry.
- No multiple flags — a single `kpr_tutorial_done`.

## Testing

This project has no test harness. Manual verification:
- Fresh state (clear `kpr_tutorial_done`) → tour auto-opens after load.
- Lewati at step 2 → closes; reload → does not auto-open.
- Complete to Selesai → closes; reload → does not auto-open.
- Sidebar "Bantuan / Tutorial" button → re-opens from step 0.
- Resize / mobile drawer → spotlight tracks targets; missing target → centered
  fallback.
