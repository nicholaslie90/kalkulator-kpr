import React from 'react';
import { formatRupiah } from '../utils/formatters';

interface DonutChartProps {
  data: { name: string; value: number; color: string }[];
}

export const UpfrontDonutChart: React.FC<DonutChartProps> = ({ data }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  if (total === 0) return null;

  let accumulatedAngle = 0;
  const radius = 50;
  const circumference = 2 * Math.PI * radius;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
      <div style={{ position: 'relative', width: '200px', height: '200px' }}>
        <svg viewBox="0 0 140 140" style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%' }}>
          <circle cx="70" cy="70" r={radius} fill="transparent" stroke="var(--bg-tertiary)" strokeWidth="18" />
          {data.map((item, idx) => {
            const percentage = item.value / total;
            const strokeDashoffset = circumference - percentage * circumference;
            const strokeDasharray = `${circumference} ${circumference}`;
            const rotation = accumulatedAngle * 360;
            accumulatedAngle += percentage;

            return (
              <circle
                key={idx}
                cx="70"
                cy="70"
                r={radius}
                fill="transparent"
                stroke={item.color}
                strokeWidth="18"
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                style={{
                  transform: `rotate(${rotation}deg)`,
                  transformOrigin: '70px 70px',
                  transition: 'stroke-dashoffset 0.5s ease-in-out',
                }}
              />
            );
          })}
          <circle cx="70" cy="70" r="38" fill="var(--bg-secondary)" />
        </svg>
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
          pointerEvents: 'none'
        }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Total Dana</span>
          <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>
            {formatRupiah(total)}
          </div>
        </div>
      </div>

      {/* Legend Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 16px', width: '100%', fontSize: '0.8rem' }}>
        {data.map((item, idx) => {
          if (item.value === 0) return null;
          const pct = ((item.value / total) * 100).toFixed(1);
          return (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: item.color, flexShrink: 0 }}></div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{item.name} ({pct}%)</span>
                <strong style={{ color: 'var(--text-primary)' }}>{formatRupiah(item.value)}</strong>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

interface AreaChartProps {
  schedule: { monthNumber: number; remainingBalance: number; label: string }[];
  fixedMonthsCount: number;
}

export const AmortizationChart: React.FC<AreaChartProps> = ({ schedule, fixedMonthsCount }) => {
  if (schedule.length === 0) return null;

  const width = 600;
  const height = 180;
  const paddingLeft = 15;
  const paddingRight = 15;
  const paddingTop = 15;
  const paddingBottom = 25;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const maxVal = schedule[0].remainingBalance;
  
  // Create points for SVG path
  const points = schedule.map((row) => {
    // x maps from 0 to schedule.length - 1 -> 0 to chartWidth
    const x = paddingLeft + (row.monthNumber / schedule.length) * chartWidth;
    // y maps from maxVal to 0 -> paddingTop to chartHeight + paddingTop
    const y = paddingTop + (1 - row.remainingBalance / maxVal) * chartHeight;
    return { x, y };
  });

  const pathD = points.length > 0 
    ? `M ${points[0].x} ${points[0].y} ` + points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ')
    : '';

  // Filled area path
  const areaD = points.length > 0
    ? `${pathD} L ${points[points.length-1].x} ${height - paddingBottom} L ${points[0].x} ${height - paddingBottom} Z`
    : '';

  // X Coordinate where rate switches from Fixed to Floating
  const fixedRatio = Math.min(1, fixedMonthsCount / schedule.length);
  const transitionX = paddingLeft + fixedRatio * chartWidth;

  return (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      <div style={{ minWidth: '400px', width: '100%', position: 'relative' }}>
        <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
          <defs>
            <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.3" />
              <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line x1={paddingLeft} y1={paddingTop} x2={width - paddingRight} y2={paddingTop} stroke="var(--border-color)" strokeDasharray="3 3" />
          <line x1={paddingLeft} y1={paddingTop + chartHeight / 2} x2={width - paddingRight} y2={paddingTop + chartHeight / 2} stroke="var(--border-color)" strokeDasharray="3 3" />
          <line x1={paddingLeft} y1={height - paddingBottom} x2={width - paddingRight} y2={height - paddingBottom} stroke="var(--border-color)" />

          {/* Area under line */}
          {points.length > 0 && <path d={areaD} fill="url(#areaGrad)" />}

          {/* Main Balance Line */}
          {points.length > 0 && (
            <path
              d={pathD}
              fill="none"
              stroke="var(--primary)"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          )}

          {/* Fixed vs Floating Vertical Line */}
          {fixedMonthsCount > 0 && fixedMonthsCount < schedule.length && (
            <>
              <line 
                x1={transitionX} 
                y1={paddingTop - 5} 
                x2={transitionX} 
                y2={height - paddingBottom} 
                stroke="var(--error)" 
                strokeDasharray="4 4" 
                strokeWidth="1.5"
              />
              {/* Text labels */}
              <text 
                x={transitionX - 6} 
                y={paddingTop + 15} 
                textAnchor="end" 
                fill="var(--text-secondary)" 
                fontSize="8" 
                fontWeight="700"
              >
                Masa Fixed
              </text>
              <text 
                x={transitionX + 6} 
                y={paddingTop + 15} 
                textAnchor="start" 
                fill="var(--error)" 
                fontSize="8" 
                fontWeight="700"
              >
                Floating Rate
              </text>
            </>
          )}

          {/* Time scale markers */}
          <text x={paddingLeft} y={height - 8} fill="var(--text-muted)" fontSize="8" textAnchor="start">
            Awal KPR
          </text>
          
          {fixedMonthsCount > 0 && fixedMonthsCount < schedule.length && (
            <text x={transitionX} y={height - 8} fill="var(--text-muted)" fontSize="8" textAnchor="middle">
              Tahun ke-{Math.round(fixedMonthsCount / 12)}
            </text>
          )}

          <text x={width - paddingRight} y={height - 8} fill="var(--text-muted)" fontSize="8" textAnchor="end">
            Lunas ({schedule.length} bln)
          </text>
        </svg>
      </div>
    </div>
  );
};
