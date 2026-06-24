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
    // eslint-disable-next-line react-hooks/set-state-in-effect
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
    // eslint-disable-next-line react-hooks/set-state-in-effect
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
