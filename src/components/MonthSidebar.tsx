import { Check, Minus, Plus } from 'lucide-react';
import { MONTHS } from '../types/ekinerja';

interface MonthSidebarProps {
  year: number;
  onYearChange: (year: number) => void;
  selectedMonth: number;
  onSelectMonth: (month: number) => void;
  monthCounts: Map<number, number>;
  totalPhotos: number;
  totalPages: number;
  paperWidthMm: 215 | 210;
}

export function MonthSidebar({
  year,
  onYearChange,
  selectedMonth,
  onSelectMonth,
  monthCounts,
  totalPhotos,
  totalPages,
  paperWidthMm,
}: MonthSidebarProps) {
  const filledMonths = MONTHS.filter((m) => (monthCounts.get(m.index) ?? 0) > 0).length;

  return (
    <aside className="w-full lg:w-[272px] shrink-0 border-b lg:border-b-0 lg:border-r border-slate-200 bg-white flex flex-col">
      {/* Year Input Block */}
      <div className="border-b border-slate-200 p-4">
        <label
          htmlFor="report-year-input"
          className="block text-xs font-semibold text-slate-600 mb-2"
        >
          Tahun Laporan
        </label>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            aria-label="Kurangi tahun laporan"
            onClick={() => onYearChange(Math.max(2000, year - 1))}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-700"
          >
            <Minus className="h-4 w-4" />
          </button>
          <input
            id="report-year-input"
            type="number"
            min={2000}
            max={2099}
            value={year}
            onChange={(e) => {
              const parsed = parseInt(e.target.value, 10);
              if (!Number.isNaN(parsed) && parsed >= 2000 && parsed <= 2099) {
                onYearChange(parsed);
              }
            }}
            className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-center font-mono text-base font-semibold tabular-nums text-slate-900 focus:border-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-700/20"
          />
          <button
            type="button"
            aria-label="Tambah tahun laporan"
            onClick={() => onYearChange(Math.min(2099, year + 1))}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-700"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* 12 Months Navigation */}
      <div className="p-3 flex-1 overflow-y-auto">
        <div className="px-2 pb-2 flex items-center justify-between text-xs font-semibold text-slate-500">
          <span>Periode Bulanan</span>
          <span className="font-mono tabular-nums">{filledMonths}/12 terisi</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-1 gap-1">
          {MONTHS.map((month) => {
            const count = monthCounts.get(month.index) ?? 0;
            const isSelected = selectedMonth === month.index;
            return (
              <button
                key={month.index}
                type="button"
                onClick={() => onSelectMonth(month.index)}
                className={`flex items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-700 ${
                  isSelected
                    ? 'bg-sky-50 text-sky-950 font-semibold'
                    : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <span className="flex items-center gap-2.5 min-w-0">
                  <span className="font-mono text-xs tabular-nums text-slate-400 w-5 shrink-0">
                    {String(month.index).padStart(2, '0')}
                  </span>
                  <span className="truncate">{month.name}</span>
                </span>

                <span className="flex items-center gap-1.5 shrink-0">
                  {count > 0 && (
                    <Check
                      className={`h-3.5 w-3.5 ${
                        isSelected ? 'text-sky-800' : 'text-emerald-600'
                      }`}
                      aria-hidden="true"
                    />
                  )}
                  <span
                    className={`font-mono text-xs tabular-nums ${
                      count > 0
                        ? isSelected
                          ? 'text-sky-900 font-medium'
                          : 'text-slate-700'
                        : 'text-slate-400'
                    }`}
                  >
                    {count}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Annual Summary Readout */}
      <div className="border-t border-slate-200 bg-slate-50/70 p-4 text-xs text-slate-600 space-y-1.5">
        <div className="flex items-center justify-between">
          <span>Total Bukti Dukung</span>
          <span className="font-mono font-semibold tabular-nums text-slate-900">
            {totalPhotos} foto
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span>Estimasi Dokumen PDF</span>
          <span className="font-mono font-semibold tabular-nums text-slate-900">
            {totalPages} hal. F4
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span>Ukuran Kertas</span>
          <span className="font-mono tabular-nums text-slate-700">
            {paperWidthMm} × 330 mm
          </span>
        </div>
      </div>
    </aside>
  );
}
