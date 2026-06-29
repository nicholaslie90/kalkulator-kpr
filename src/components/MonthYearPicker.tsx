import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { getMonthNameIndonesian } from '../utils/formatters';

interface MonthYearPickerProps {
  value: string; // "YYYY-MM"
  onChange: (value: string) => void;
}

const MONTH_ABBR = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
const YEARS_PER_PAGE = 12;

const parseValue = (value: string): { year: number; month: number } | null => {
  if (!value) return null;
  const [y, m] = value.split('-').map(Number);
  if (!y || !m) return null;
  return { year: y, month: m - 1 }; // month 0-indexed
};

export const MonthYearPicker: React.FC<MonthYearPickerProps> = ({ value, onChange }) => {
  const parsed = parseValue(value);
  const today = new Date();

  const [open, setOpen] = useState(false);
  const [view, setView] = useState<'month' | 'year'>('month');
  const [viewYear, setViewYear] = useState(parsed?.year ?? today.getFullYear());
  // First year shown in the year-grid page
  const [yearPageStart, setYearPageStart] = useState(
    (parsed?.year ?? today.getFullYear()) - 5
  );

  const containerRef = useRef<HTMLDivElement>(null);

  const openPicker = () => {
    // Sync the internal view to the current value each time the popover opens
    const y = parseValue(value)?.year ?? today.getFullYear();
    setViewYear(y);
    setYearPageStart(y - 5);
    setView('month');
    setOpen(true);
  };

  // Close on outside click / Escape
  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  const label = useMemo(() => {
    if (!parsed) return 'Pilih bulan & tahun';
    return `${getMonthNameIndonesian(parsed.month)} ${parsed.year}`;
  }, [parsed]);

  const selectMonth = (monthIndex: number) => {
    const mm = String(monthIndex + 1).padStart(2, '0');
    onChange(`${viewYear}-${mm}`);
    setOpen(false);
  };

  const selectYear = (year: number) => {
    setViewYear(year);
    setView('month');
  };

  const goToThisMonth = () => {
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    onChange(`${today.getFullYear()}-${mm}`);
    setOpen(false);
  };

  const years = useMemo(
    () => Array.from({ length: YEARS_PER_PAGE }, (_, i) => yearPageStart + i),
    [yearPageStart]
  );

  const cellBase: React.CSSProperties = {
    border: '1px solid transparent',
    background: 'transparent',
    borderRadius: 'var(--radius-md)',
    padding: '10px 0',
    fontSize: '0.9rem',
    fontWeight: 600,
    cursor: 'pointer',
    color: 'var(--text-primary)',
    transition: 'background var(--transition-fast), color var(--transition-fast)',
  };

  const isSelectedMonth = (i: number) =>
    parsed && parsed.year === viewYear && parsed.month === i;
  const isCurrentMonth = (i: number) =>
    viewYear === today.getFullYear() && i === today.getMonth();

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      {/* Trigger */}
      <button
        type="button"
        className="input-field"
        onClick={() => (open ? setOpen(false) : openPicker())}
        aria-haspopup="dialog"
        aria-expanded={open}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          textAlign: 'left',
          cursor: 'pointer',
          gap: '8px',
        }}
      >
        <span style={{ color: parsed ? 'var(--text-primary)' : 'var(--text-muted)' }}>
          {label}
        </span>
        <Calendar size={18} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
      </button>

      {/* Popover */}
      {open && (
        <div
          role="dialog"
          className="animate-fade-in"
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            right: 0,
            zIndex: 50,
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--card-shadow)',
            padding: '12px',
          }}
        >
          {/* Header: year navigation */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '10px',
            }}
          >
            <button
              type="button"
              aria-label={view === 'month' ? 'Tahun sebelumnya' : 'Halaman sebelumnya'}
              onClick={() =>
                view === 'month'
                  ? setViewYear((y) => y - 1)
                  : setYearPageStart((s) => s - YEARS_PER_PAGE)
              }
              style={{
                ...cellBase,
                padding: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-tertiary)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <ChevronLeft size={20} />
            </button>

            <button
              type="button"
              onClick={() => setView((v) => (v === 'month' ? 'year' : 'month'))}
              style={{
                ...cellBase,
                padding: '6px 14px',
                fontSize: '1rem',
                color: 'var(--primary)',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-tertiary)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              {view === 'month' ? viewYear : `${years[0]} – ${years[years.length - 1]}`}
            </button>

            <button
              type="button"
              aria-label={view === 'month' ? 'Tahun berikutnya' : 'Halaman berikutnya'}
              onClick={() =>
                view === 'month'
                  ? setViewYear((y) => y + 1)
                  : setYearPageStart((s) => s + YEARS_PER_PAGE)
              }
              style={{
                ...cellBase,
                padding: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-tertiary)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <ChevronRight size={20} />
            </button>
          </div>

          {/* Body: month grid or year grid */}
          {view === 'month' ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
              {MONTH_ABBR.map((m, i) => {
                const selected = isSelectedMonth(i);
                const current = isCurrentMonth(i);
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => selectMonth(i)}
                    style={{
                      ...cellBase,
                      background: selected ? 'var(--primary)' : 'transparent',
                      color: selected ? '#ffffff' : 'var(--text-primary)',
                      border: current && !selected ? '1px solid var(--primary)' : '1px solid transparent',
                    }}
                    onMouseEnter={(e) => {
                      if (!selected) e.currentTarget.style.background = 'var(--bg-tertiary)';
                    }}
                    onMouseLeave={(e) => {
                      if (!selected) e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    {m}
                  </button>
                );
              })}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
              {years.map((y) => {
                const selected = parsed?.year === y;
                const current = y === today.getFullYear();
                return (
                  <button
                    key={y}
                    type="button"
                    onClick={() => selectYear(y)}
                    style={{
                      ...cellBase,
                      background: selected ? 'var(--primary)' : 'transparent',
                      color: selected ? '#ffffff' : 'var(--text-primary)',
                      border: current && !selected ? '1px solid var(--primary)' : '1px solid transparent',
                    }}
                    onMouseEnter={(e) => {
                      if (!selected) e.currentTarget.style.background = 'var(--bg-tertiary)';
                    }}
                    onMouseLeave={(e) => {
                      if (!selected) e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    {y}
                  </button>
                );
              })}
            </div>
          )}

          {/* Footer */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              marginTop: '10px',
              paddingTop: '10px',
              borderTop: '1px solid var(--border-color)',
            }}
          >
            <button
              type="button"
              onClick={goToThisMonth}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--primary)',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
                padding: '4px 8px',
                borderRadius: 'var(--radius-sm)',
              }}
            >
              Bulan Ini
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
