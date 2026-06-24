# First-time User Tutorial (Spotlight Tour) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a skippable, re-triggerable first-time spotlight tour that walks new users through the dashboard and remembers when they skip/finish it.

**Architecture:** One self-contained, dependency-free overlay component (`TutorialTour.tsx`) renders a dimming spotlight cutout over real DOM elements identified by `id`. `App.tsx` owns the open/close state, auto-starts the tour on first visit, persists a single `kpr_tutorial_done` flag, and exposes a sidebar button to re-open it.

**Tech Stack:** React 19 + TypeScript, Vite, lucide-react icons, inline styles + CSS custom properties (`--primary`, `glass-panel`, etc.). No test framework in this repo — verification is `npm run build` (tsc), `npm run lint`, and manual browser checks.

## Global Constraints

- No new dependencies — pure React + existing lucide-react icons only.
- Match existing style conventions: inline styles, CSS vars (`var(--primary)`, `var(--bg-secondary)`, `var(--text-primary)`, etc.), and the `glass-panel` / `btn` / `btn-primary` / `btn-secondary` / `btn-ghost` classes.
- All UI copy in Indonesian, consistent with the rest of the app.
- Persistence flag key is exactly `kpr_tutorial_done`, value `'true'`; written to BOTH `localStorage` and IndexedDB via `setDbValue('kpr_tutorial_done', true)`.
- Auto-start reads `localStorage` synchronously (like `kpr_sample_notice_dismissed`).
- Tour overlay `z-index >= 200` (above header `z-50` and mobile drawer `z-60`).
- Verification per task: `npm run build` must pass with no TS errors, `npm run lint` must pass.

---

### Task 1: TutorialTour component (types, props, step navigation, spotlight, fallback)

**Files:**
- Create: `src/components/TutorialTour.tsx`

**Interfaces:**
- Consumes: nothing (leaf component).
- Produces:
  - `export interface TutorialStep { targetId?: string; title: string; body: string; placement?: 'top' | 'bottom' | 'left' | 'right' | 'center'; }`
  - `export function TutorialTour(props: { steps: TutorialStep[]; isOpen: boolean; onClose: () => void; }): JSX.Element | null`

- [ ] **Step 1: Create the component file with full implementation**

Create `src/components/TutorialTour.tsx`:

```tsx
import { useState, useEffect, useLayoutEffect, useCallback } from 'react';
import { X, GraduationCap } from 'lucide-react';

export interface TutorialStep {
  targetId?: string;
  title: string;
  body: string;
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'center';
}

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

const PADDING = 8; // breathing room around the spotlighted element

export function TutorialTour({
  steps,
  isOpen,
  onClose,
}: {
  steps: TutorialStep[];
  isOpen: boolean;
  onClose: () => void;
}) {
  const [stepIndex, setStepIndex] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);

  const step = steps[stepIndex];
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === steps.length - 1;

  // Reset to the first step every time the tour is (re)opened.
  useEffect(() => {
    if (isOpen) setStepIndex(0);
  }, [isOpen]);

  // Measure the current target; fall back to centered (rect = null) when the
  // target is missing or has zero size.
  const measure = useCallback(() => {
    if (!isOpen || !step) return;
    const id = step.targetId;
    if (!id) {
      setRect(null);
      return;
    }
    const el = document.getElementById(id);
    if (!el) {
      setRect(null);
      return;
    }
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) {
      setRect(null);
      return;
    }
    setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
  }, [isOpen, step]);

  useLayoutEffect(() => {
    if (!isOpen || !step) return;
    const el = step.targetId ? document.getElementById(step.targetId) : null;
    if (el) el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    // Measure after a tick so smooth-scroll/layout settles.
    const t = setTimeout(measure, 60);
    measure();
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    return () => {
      clearTimeout(t);
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
  }, [isOpen, step, measure]);

  // Escape closes; ArrowRight/ArrowLeft navigate.
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight') setStepIndex((i) => Math.min(i + 1, steps.length - 1));
      else if (e.key === 'ArrowLeft') setStepIndex((i) => Math.max(i - 1, 0));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose, steps.length]);

  if (!isOpen || !step) return null;

  const next = () => {
    if (isLast) onClose();
    else setStepIndex((i) => Math.min(i + 1, steps.length - 1));
  };
  const back = () => setStepIndex((i) => Math.max(i - 1, 0));

  // Tooltip position: beside the rect per placement, else centered.
  const tooltipStyle = computeTooltipStyle(rect, step.placement);

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200 }} role="dialog" aria-modal="true">
      {/* Spotlight cutout (or full dim when no rect) */}
      {rect ? (
        <div
          style={{
            position: 'fixed',
            top: rect.top - PADDING,
            left: rect.left - PADDING,
            width: rect.width + PADDING * 2,
            height: rect.height + PADDING * 2,
            borderRadius: 'var(--radius-md)',
            boxShadow: '0 0 0 9999px rgba(0,0,0,0.65)',
            border: '2px solid var(--primary)',
            outline: '4px solid var(--primary-glow)',
            transition: 'all 0.25s ease',
            pointerEvents: 'none',
          }}
        />
      ) : (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)' }} />
      )}

      {/* Tooltip card */}
      <div
        className="glass-panel animate-fade-in"
        style={{
          position: 'fixed',
          width: 'min(340px, calc(100vw - 32px))',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          ...tooltipStyle,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '34px', height: '34px', borderRadius: 'var(--radius-md)', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <GraduationCap size={18} />
          </div>
          <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', flex: 1 }}>{step.title}</h3>
          <button className="btn btn-ghost" onClick={onClose} aria-label="Lewati tutorial" style={{ padding: '4px', lineHeight: 0 }}>
            <X size={18} />
          </button>
        </div>

        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.55, margin: 0 }}>{step.body}</p>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginTop: '4px' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>{stepIndex + 1} / {steps.length}</span>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button className="btn btn-ghost" onClick={onClose} style={{ fontSize: '0.8rem' }}>Lewati</button>
            {!isFirst && (
              <button className="btn btn-secondary" onClick={back} style={{ fontSize: '0.8rem' }}>Kembali</button>
            )}
            <button className="btn btn-primary" onClick={next} style={{ fontSize: '0.8rem' }}>
              {isLast ? 'Selesai' : 'Lanjut →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Position the tooltip near the target rect, clamped to the viewport. Falls
// back to dead-center when there is no rect (centered step or missing target).
function computeTooltipStyle(rect: Rect | null, placement?: TutorialStep['placement']): React.CSSProperties {
  const margin = 16;
  const tipW = Math.min(340, (typeof window !== 'undefined' ? window.innerWidth : 360) - 32);
  if (!rect || placement === 'center') {
    return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
  }
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  // Default placement: below the target if room, else above.
  const below = rect.top + rect.height + margin + 180 < vh;
  const place = placement ?? (below ? 'bottom' : 'top');
  let top = 0;
  let left = rect.left;

  if (place === 'bottom') top = rect.top + rect.height + margin;
  else if (place === 'top') top = Math.max(margin, rect.top - margin - 180);
  else if (place === 'right') { top = rect.top; left = rect.left + rect.width + margin; }
  else if (place === 'left') { top = rect.top; left = rect.left - tipW - margin; }

  // Clamp horizontally into the viewport.
  left = Math.max(margin, Math.min(left, vw - tipW - margin));
  top = Math.max(margin, Math.min(top, vh - margin - 100));
  return { top, left };
}
```

- [ ] **Step 2: Verify it compiles and lints**

Run: `npm run build && npm run lint`
Expected: PASS — no TypeScript errors, no lint errors. (The component is not yet rendered anywhere; that is fine.)

- [ ] **Step 3: Commit**

```bash
git add src/components/TutorialTour.tsx
git commit -m "feat: TutorialTour spotlight overlay component"
```

---

### Task 2: Define tour steps and add highlight `id`s in App.tsx

**Files:**
- Modify: `src/App.tsx` (add import; add `TUTORIAL_STEPS` constant; add `id` attributes to 8 target elements)

**Interfaces:**
- Consumes: `TutorialStep`, `TutorialTour` from `./components/TutorialTour` (import added here; `TutorialTour` rendered in Task 3).
- Produces: module-level `const TUTORIAL_STEPS: TutorialStep[]`, and these DOM ids present in the tree: `tour-property-picker`, `tour-nav-properties`, `tour-nav-calculator`, `tour-nav-upfront`, `tour-nav-calendar`, `tour-nav-compare`, `tour-theme`, `tour-data-io`.

- [ ] **Step 1: Add the import**

In `src/App.tsx`, add after the existing component imports (near line 13):

```tsx
import { TutorialTour, type TutorialStep } from './components/TutorialTour';
```

- [ ] **Step 2: Add the TUTORIAL_STEPS constant**

In `src/App.tsx`, add at module scope (e.g. just below `DEFAULT_SCENARIOS`, before `function LoadingScreen()`):

```tsx
const TUTORIAL_STEPS: TutorialStep[] = [
  {
    placement: 'center',
    title: 'Selamat Datang di KPR Smart Dashboard 👋',
    body: 'Aplikasi ini membantu Anda menghitung & membandingkan simulasi KPR rumah. Mari kita lihat fitur utamanya sebentar — Anda bisa melewati kapan saja.',
  },
  {
    targetId: 'tour-property-picker',
    placement: 'bottom',
    title: 'Pilih Properti Aktif',
    body: 'Semua perhitungan mengikuti properti yang dipilih di sini. Ganti properti kapan saja untuk melihat simulasi yang berbeda.',
  },
  {
    targetId: 'tour-nav-properties',
    placement: 'right',
    title: 'Kelola Properti',
    body: 'Tambah, ubah, atau hapus profil rumah incaran Anda — lengkap dengan harga, DP, tipe, dan catatan.',
  },
  {
    targetId: 'tour-nav-calculator',
    placement: 'right',
    title: 'Skema & Bunga',
    body: 'Atur skema bank, jenis suku bunga (fixed/berjenjang/floating), serta tenor pinjaman.',
  },
  {
    targetId: 'tour-nav-upfront',
    placement: 'right',
    title: 'Biaya-biaya',
    body: 'Hitung biaya di awal: DP, pajak (BPHTB), provisi, notaris, asuransi, biaya transaksi, hingga renovasi.',
  },
  {
    targetId: 'tour-nav-calendar',
    placement: 'right',
    title: 'Kalender Cicilan',
    body: 'Lihat jadwal angsuran bulan per bulan, simulasikan pelunasan dipercepat, dan proyeksi nilai jual rumah.',
  },
  {
    targetId: 'tour-nav-compare',
    placement: 'right',
    title: 'Bandingkan Pilihan',
    body: 'Sandingkan beberapa properti & skenario DP/tenor berdampingan untuk menemukan pilihan terbaik.',
  },
  {
    targetId: 'tour-theme',
    placement: 'top',
    title: 'Tampilan Terang / Gelap',
    body: 'Ubah tema antarmuka sesuai selera: Terang, mengikuti Sistem, atau Gelap.',
  },
  {
    targetId: 'tour-data-io',
    placement: 'bottom',
    title: 'Data Anda Tersimpan Lokal',
    body: 'Semua data tersimpan di browser ini. Gunakan tombol Export/Import untuk mencadangkan atau memindahkannya ke perangkat lain. Selamat mencoba!',
  },
];
```

- [ ] **Step 3: Add `id` to the property picker `<select>`**

In `src/App.tsx`, on the `<select value={selectedPropertyId || ''}` element (~line 831), add `id="tour-property-picker"` as the first attribute.

- [ ] **Step 4: Add `id`s to the 5 sidebar nav buttons**

On each sidebar nav `<button>` (the ones calling `handleNavClick`), add the matching id:
- `handleNavClick('properties')` button → `id="tour-nav-properties"`
- `handleNavClick('calculator')` button → `id="tour-nav-calculator"`
- `handleNavClick('upfront')` button → `id="tour-nav-upfront"`
- `handleNavClick('calendar')` button → `id="tour-nav-calendar"`
- `handleNavClick('compare')` button → `id="tour-nav-compare"`

- [ ] **Step 5: Add `id` to the export/import group and theme switcher**

- On the `<div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>` that wraps the Download/Upload buttons in the header (~line 856), add `id="tour-data-io"`.
- On the theme switcher's outer wrapper `<div>` — the one immediately inside the `{/* Theme switcher: Light / System / Dark */}` block (the `<div>` that contains the `<span>Tampilan</span>` and the buttons row, ~line 987) — add `id="tour-theme"`.

- [ ] **Step 6: Verify build and lint**

Run: `npm run build && npm run lint`
Expected: PASS. `TUTORIAL_STEPS` is defined and used by the import type; if lint flags `TUTORIAL_STEPS` as unused, that resolves in Task 3 where it is passed to `<TutorialTour>`. To avoid an interim unused-var error, complete Task 3 in the same session before relying on a green lint, OR temporarily it is acceptable since the next task wires it. Prefer running build/lint after Task 3.

- [ ] **Step 7: Commit**

```bash
git add src/App.tsx
git commit -m "feat: tour step definitions + highlight ids on dashboard targets"
```

---

### Task 3: Wire state, auto-start, persistence, and render the tour in App.tsx

**Files:**
- Modify: `src/App.tsx` (add state, effect, close handler, render `<TutorialTour>`)

**Interfaces:**
- Consumes: `TutorialTour`, `TUTORIAL_STEPS`, existing `setDbValue` (imported at line 5), `isLoading`, `setSidebarOpen`.
- Produces: `tutorialOpen` state + `openTutorial()` / `handleCloseTutorial()` used by Task 4's sidebar button.

- [ ] **Step 1: Add tutorial state and an auto-start guard**

In the `App` component body, add alongside the other `useState` hooks (e.g. just after the `deleteConfirmId` state ~line 352):

```tsx
  // First-time tutorial spotlight tour.
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const [tutorialAutoChecked, setTutorialAutoChecked] = useState(false);
```

- [ ] **Step 2: Add the open + close handlers**

Add these handlers in the component body (e.g. near the other handlers, after the export/import handlers ~line 675):

```tsx
  // Open the tour (auto or via sidebar button). Ensure the sidebar is open so
  // its nav items can be spotlighted (this opens the mobile drawer too).
  const openTutorial = () => {
    setSidebarOpen(true);
    setTutorialOpen(true);
  };

  // Closing via "Lewati" or "Selesai" both persist the flag so it does not
  // auto-open again. Persist to localStorage AND IndexedDB like everything else.
  const handleCloseTutorial = () => {
    setTutorialOpen(false);
    localStorage.setItem('kpr_tutorial_done', 'true');
    setDbValue('kpr_tutorial_done', true);
  };
```

- [ ] **Step 3: Add the auto-start effect**

Add this effect after the data-loading effect (after the big `loadState` `useEffect`, ~line 536):

```tsx
  // Auto-open the tour once on first visit, after initial loading completes.
  useEffect(() => {
    if (isLoading || tutorialAutoChecked) return;
    setTutorialAutoChecked(true);
    if (localStorage.getItem('kpr_tutorial_done') !== 'true') {
      setSidebarOpen(true);
      setTutorialOpen(true);
    }
  }, [isLoading, tutorialAutoChecked]);
```

- [ ] **Step 4: Render the tour**

Add the component just before the closing `</div>` of the root layout — e.g. right after the delete-property confirmation dialog block (~line 1336), still inside the outer `<div>`:

```tsx
      {/* First-time / on-demand tutorial spotlight tour */}
      <TutorialTour steps={TUTORIAL_STEPS} isOpen={tutorialOpen} onClose={handleCloseTutorial} />
```

- [ ] **Step 5: Verify build and lint**

Run: `npm run build && npm run lint`
Expected: PASS — no TS/lint errors. `TUTORIAL_STEPS`, `openTutorial`, `handleCloseTutorial`, `tutorialOpen` are all now referenced. (`openTutorial` is referenced by Task 4; if lint flags it unused here, complete Task 4 before final lint — or temporarily it is wired in the same session.)

- [ ] **Step 6: Manual verification**

Run: `npm run dev`, open the app in a browser.
- In DevTools console run `localStorage.removeItem('kpr_tutorial_done')` then reload.
Expected: after the loading screen, the tour auto-opens at the Welcome step; Lanjut/Kembali navigate; the spotlight ring tracks the picker and sidebar items; Lewati closes it. Reload → it does NOT auto-open again.

- [ ] **Step 7: Commit**

```bash
git add src/App.tsx
git commit -m "feat: auto-start, persist, and render first-time tutorial tour"
```

---

### Task 4: Add the "Bantuan / Tutorial" re-trigger button in the sidebar

**Files:**
- Modify: `src/App.tsx` (add icon import; add button in sidebar footer)

**Interfaces:**
- Consumes: `openTutorial()` from Task 3.
- Produces: a sidebar button that re-opens the tour on demand.

- [ ] **Step 1: Add the icon import**

In `src/App.tsx`, add `GraduationCap` to the existing `lucide-react` import block (the one with `Home, Calculator, ...`):

```tsx
  GraduationCap,
```

- [ ] **Step 2: Add the button in the sidebar footer**

In the sidebar footer column (the `<div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>` that holds the active-property summary and theme switcher, ~line 969), add this button as the FIRST child (above the active-property summary block):

```tsx
            <button
              className="btn btn-secondary"
              style={{ justifyContent: 'flex-start', padding: '10px 12px', fontSize: '0.85rem' }}
              onClick={openTutorial}
              title="Buka kembali tutorial penggunaan"
            >
              <GraduationCap size={16} />
              <span>Bantuan / Tutorial</span>
            </button>
```

- [ ] **Step 3: Verify build and lint**

Run: `npm run build && npm run lint`
Expected: PASS — no unused-var warnings now that `openTutorial` is referenced.

- [ ] **Step 4: Manual verification**

Run: `npm run dev`.
- With `kpr_tutorial_done` already set (tour does not auto-open), click "Bantuan / Tutorial" in the sidebar.
Expected: the tour opens at step 1 again. On mobile, the drawer opens and sidebar items are spotlighted.

- [ ] **Step 5: Commit**

```bash
git add src/App.tsx
git commit -m "feat: sidebar 'Bantuan / Tutorial' button to re-open the tour"
```

---

## Self-Review

**Spec coverage:**
- Req 1 (first-time auto-start) → Task 3 Step 3. ✓
- Req 2 (skippable; Lewati & Selesai both close) → Task 1 (buttons) + Task 3 (handler). ✓
- Req 3 (remembered; localStorage + IndexedDB) → Task 3 Step 2 `handleCloseTutorial`. ✓
- Req 4 (re-triggerable via sidebar) → Task 4. ✓
- 9-step tour content → Task 2 `TUTORIAL_STEPS` (Welcome + 8 targets = 9 steps). ✓
- Spotlight + centered fallback → Task 1. ✓
- z-index >= 200 → Task 1 (root `zIndex: 200`). ✓
- Open forces sidebar open → Task 3 `openTutorial` + auto-start effect. ✓

**Placeholder scan:** No TBD/TODO; all steps contain concrete code or exact edits. Lint-ordering caveats in Tasks 2/3 are explicitly resolved by completing the dependent task in the same session.

**Type consistency:** `TutorialStep` fields (`targetId`, `title`, `body`, `placement`) match between Task 1 definition and Task 2 usage. `TutorialTour` props (`steps`, `isOpen`, `onClose`) match between Task 1 and Task 3 render. Handler names `openTutorial` / `handleCloseTutorial` consistent across Tasks 3–4. All 8 `targetId`s in `TUTORIAL_STEPS` (Task 2 Step 2) have a matching `id` added in Task 2 Steps 3–5.
