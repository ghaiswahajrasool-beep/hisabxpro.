import React, { useState } from 'react';
import { formatPKR } from '../utils/cryptoAndFormat';

export interface DonutSlice {
  label: string;
  value: number;
  color: string;
}

interface CategoryDonutChartProps {
  slices: DonutSlice[];
  centerLabel: string;
  emptyText?: string;
}

export const CategoryDonutChart: React.FC<CategoryDonutChartProps> = ({
  slices,
  centerLabel,
  emptyText = 'No expense entries yet to visualize.',
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const total = slices.reduce((acc, s) => acc + s.value, 0);

  if (total <= 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <div className="w-28 h-28 rounded-full border-4 border-dashed border-slate-700/70 flex items-center justify-center mb-3">
          <span className="text-xs text-slate-500 font-mono-num">Rs. 0</span>
        </div>
        <p className="text-sm text-slate-400">{emptyText}</p>
      </div>
    );
  }

  const size = 200;
  const strokeWidth = 24;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let cumulativeOffset = 0;
  const activeSlice = hoveredIdx !== null ? slices[hoveredIdx] : null;

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      <div className="relative w-[196px] h-[196px] shrink-0">
        <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full -rotate-90 overflow-visible">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth={strokeWidth}
          />
          {slices.map((slice, idx) => {
            const pct = slice.value / total;
            const dashLength = Math.max(0, pct * circumference - (slices.length > 1 ? 3 : 0));
            const dashOffset = -cumulativeOffset;
            cumulativeOffset += pct * circumference;
            const isHovered = hoveredIdx === idx;

            return (
              <circle
                key={slice.label}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="transparent"
                stroke={slice.color}
                strokeWidth={isHovered ? strokeWidth + 5 : strokeWidth}
                strokeDasharray={`${dashLength} ${circumference}`}
                strokeDashoffset={dashOffset}
                strokeLinecap="round"
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                onClick={() => setHoveredIdx(hoveredIdx === idx ? null : idx)}
                className="cursor-pointer transition-all duration-200"
                style={{
                  opacity: hoveredIdx !== null && !isHovered ? 0.45 : 1,
                  filter: isHovered ? `drop-shadow(0 0 8px ${slice.color}66)` : 'none',
                }}
              />
            );
          })}
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-5">
          <span className="text-[11px] font-medium text-slate-400 truncate max-w-[120px]">
            {activeSlice ? activeSlice.label : centerLabel}
          </span>
          <span className="text-base font-bold text-white font-mono-num mt-0.5">
            {formatPKR(activeSlice ? activeSlice.value : total)}
          </span>
          {activeSlice && (
            <span className="text-[11px] font-mono-num text-[#F3D474] mt-0.5">
              {Math.round((activeSlice.value / total) * 100)}%
            </span>
          )}
        </div>
      </div>

      <div className="flex-1 w-full space-y-2.5 max-h-[210px] overflow-y-auto pr-1">
        {slices.map((slice, idx) => {
          const pct = Math.round((slice.value / total) * 100);
          const isHovered = hoveredIdx === idx;
          return (
            <button
              key={slice.label}
              type="button"
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              onClick={() => setHoveredIdx(hoveredIdx === idx ? null : idx)}
              className={`w-full flex items-center justify-between gap-3 px-2.5 py-1.5 rounded-lg text-left transition-colors ${
                isHovered ? 'bg-white/10' : 'hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span
                  className="w-2.5 h-2.5 rounded-sm shrink-0"
                  style={{ backgroundColor: slice.color }}
                />
                <span className="text-xs font-medium text-slate-200 truncate">{slice.label}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0 text-xs font-mono-num">
                <span className="text-slate-400">{pct}%</span>
                <span className="text-slate-100 font-semibold">{formatPKR(slice.value)}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export interface MonthlyBarPoint {
  monthLabel: string;
  inflow: number;
  outflow: number;
}

interface MonthlyCashflowBarChartProps {
  data: MonthlyBarPoint[];
}

export const MonthlyCashflowBarChart: React.FC<MonthlyCashflowBarChartProps> = ({ data }) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const maxVal = Math.max(1000, ...data.flatMap((d) => [d.inflow, d.outflow]));

  return (
    <div className="w-full">
      <div className="flex items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-4 text-xs text-slate-300">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
            Inflow (Income + Jama)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-rose-500" />
            Outflow (Expenses + Udhaar)
          </span>
        </div>
        {hoveredIdx !== null && data[hoveredIdx] && (
          <div className="text-xs font-mono-num text-slate-200 hidden sm:block">
            {data[hoveredIdx].monthLabel}:{' '}
            <span className="text-emerald-400">+{formatPKR(data[hoveredIdx].inflow)}</span>
            <span className="mx-1.5 text-slate-500">·</span>
            <span className="text-rose-400">-{formatPKR(data[hoveredIdx].outflow)}</span>
          </div>
        )}
      </div>

      <div className="relative h-52 flex items-end justify-between gap-2 sm:gap-4 pt-6 pb-2 border-b border-slate-800/80">
        {/* Horizontal guide lines */}
        <div className="absolute inset-x-0 top-6 bottom-2 pointer-events-none flex flex-col justify-between">
          {[0, 1, 2, 3].map((line) => (
            <div key={line} className="w-full border-t border-slate-800/60 border-dashed" />
          ))}
        </div>

        {data.map((point, idx) => {
          const inH = Math.max(point.inflow > 0 ? 6 : 2, Math.round((point.inflow / maxVal) * 150));
          const outH = Math.max(point.outflow > 0 ? 6 : 2, Math.round((point.outflow / maxVal) * 150));
          const isHovered = hoveredIdx === idx;

          return (
            <div
              key={point.monthLabel}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              onClick={() => setHoveredIdx(hoveredIdx === idx ? null : idx)}
              className={`relative flex-1 flex flex-col items-center justify-end h-full cursor-pointer rounded-xl px-1 transition-colors ${
                isHovered ? 'bg-white/[0.04]' : ''
              }`}
            >
              {isHovered && (
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-10 px-2.5 py-1 rounded-lg bg-[#0D142B] border border-[#D4AF37]/40 shadow-xl whitespace-nowrap text-[11px] font-mono-num">
                  <div className="text-emerald-400">In: {formatPKR(point.inflow)}</div>
                  <div className="text-rose-400">Out: {formatPKR(point.outflow)}</div>
                </div>
              )}

              <div className="flex items-end gap-1.5 sm:gap-2 h-[155px]">
                <div
                  className="w-3 sm:w-4 rounded-t-md bg-gradient-to-t from-emerald-600/80 to-emerald-400 transition-all duration-300"
                  style={{
                    height: `${inH}px`,
                    boxShadow: isHovered ? '0 0 12px rgba(16,185,129,0.45)' : 'none',
                  }}
                />
                <div
                  className="w-3 sm:w-4 rounded-t-md bg-gradient-to-t from-rose-600/80 to-rose-400 transition-all duration-300"
                  style={{
                    height: `${outH}px`,
                    boxShadow: isHovered ? '0 0 12px rgba(244,63,94,0.45)' : 'none',
                  }}
                />
              </div>
              <span className="mt-2.5 text-[11px] font-medium text-slate-400 whitespace-nowrap">
                {point.monthLabel}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
