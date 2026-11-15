import { useCallback, useEffect, useMemo, useState } from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';
import { DocumentPreview } from './components/DocumentPreview';
import { MonthEditor } from './components/MonthEditor';
import { MonthSidebar } from './components/MonthSidebar';
import { ReportSettings } from './components/ReportSettings';
import { TopBar, WorkspaceTab } from './components/TopBar';
import {
  DEFAULT_INDICATOR,
  DEFAULT_METADATA,
  EvidenceItem,
  MONTHS,
  ReportMetadata,
  ReportState,
} from './types/ekinerja';
import { generateAndDownloadAnnualPdf } from './utils/pdfGenerator';
import {
  buildAnnualPages,
  filterItemsByIndicator,
  groupItemsByMonth,
} from './utils/pdfLayout';
import {
  clearReportState,
  getEmployeeIdentityMetadata,
  loadReportState,
  saveReportState,
} from './utils/storage';

interface NoticeBanner {
  type: 'success' | 'error';
  message: string;
}

export default function App() {
  const [state, setState] = useState<ReportState>({
    metadata: { ...DEFAULT_METADATA },
    items: [],
  });
  const [isLoaded, setIsLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('editor');
  const [selectedMonth, setSelectedMonth] = useState<number>(1);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState<{ current: number; total: number } | null>(
    null
  );
  const [notice, setNotice] = useState<NoticeBanner | null>(null);

  useEffect(() => {
    let active = true;
    loadReportState().then((loaded) => {
      if (active) {
        setState(loaded);
        setIsLoaded(true);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    const timer = window.setTimeout(() => {
      void saveReportState(state);
    }, 180);
    return () => window.clearTimeout(timer);
  }, [state, isLoaded]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 6000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const selectedIndicatorItems = useMemo(
    () => filterItemsByIndicator(state.items, state.metadata.selectedIndicator),
    [state.items, state.metadata.selectedIndicator]
  );

  const groupedByMonthAll = useMemo(() => groupItemsByMonth(state.items), [state.items]);
  const groupedByMonthIndicator = useMemo(
    () => groupItemsByMonth(selectedIndicatorItems),
    [selectedIndicatorItems]
  );

  const monthCounts = useMemo(() => {
    const map = new Map<number, number>();
    for (const m of MONTHS) {
      map.set(m.index, (groupedByMonthIndicator.get(m.index) ?? []).length);
    }
    return map;
  }, [groupedByMonthIndicator]);

  const annualPages = useMemo(
    () => buildAnnualPages(state.metadata, state.items),
    [state.metadata, state.items]
  );

  const selectedMonthItems = groupedByMonthAll.get(selectedMonth) ?? [];

  const handleUpdateMetadata = useCallback((patch: Partial<ReportMetadata>) => {
    setState((prev) => ({
      ...prev,
      metadata: { ...prev.metadata, ...patch },
    }));
  }, []);

  const handleAddIndicator = useCallback((newIndicatorRaw: string) => {
    const trimmed = newIndicatorRaw.trim();
    if (!trimmed) return;
    setState((prev) => {
      const exists = prev.metadata.indicators.includes(trimmed);
      const nextIndicators = exists
        ? prev.metadata.indicators
        : [...prev.metadata.indicators, trimmed];
      return {
        ...prev,
        metadata: {
          ...prev.metadata,
          indicators: nextIndicators,
          selectedIndicator: trimmed,
        },
      };
    });
    setNotice({
      type: 'success',
      message: `Indikator kinerja "${trimmed}" berhasil dipilih.`,
    });
  }, []);

  const handleEditIndicator = useCallback((oldIndicator: string, newIndicatorRaw: string) => {
    const trimmed = newIndicatorRaw.trim();
    if (!trimmed) return;
    setState((prev) => {
      const nextIndicators = prev.metadata.indicators.map((ind) =>
        ind === oldIndicator ? trimmed : ind
      );
      const nextSelected =
        prev.metadata.selectedIndicator === oldIndicator
          ? trimmed
          : prev.metadata.selectedIndicator;
      return {
        ...prev,
        metadata: {
          ...prev.metadata,
          indicators: nextIndicators,
          selectedIndicator: nextSelected,
        },
        items: prev.items.map((item) =>
          ((item.indicator ?? '').trim() || DEFAULT_INDICATOR) === oldIndicator
            ? { ...item, indicator: trimmed }
            : item
        ),
      };
    });
    setNotice({
      type: 'success',
      message: `Indikator kinerja berhasil diubah menjadi "${trimmed}".`,
    });
  }, []);

  const handleDeleteIndicator = useCallback((targetIndicator: string) => {
    setState((prev) => {
      if (prev.metadata.selectedIndicator === targetIndicator) {
        return prev;
      }
      const nextIndicators = prev.metadata.indicators.filter((ind) => ind !== targetIndicator);
      if (nextIndicators.length === 0) {
        nextIndicators.push(prev.metadata.selectedIndicator || DEFAULT_INDICATOR);
      }
      const fallbackIndicator = prev.metadata.selectedIndicator || nextIndicators[0];

      return {
        ...prev,
        metadata: {
          ...prev.metadata,
          indicators: nextIndicators,
        },
        items: prev.items.map((item) =>
          ((item.indicator ?? '').trim() || DEFAULT_INDICATOR) === targetIndicator
            ? { ...item, indicator: fallbackIndicator }
            : item
        ),
      };
    });
    setNotice({
      type: 'success',
      message: `Indikator kinerja "${targetIndicator}" telah dihapus.`,
    });
  }, []);

  const handleDeleteAllOtherIndicators = useCallback(() => {
    setState((prev) => {
      const activeInd = prev.metadata.selectedIndicator || DEFAULT_INDICATOR;
      return {
        ...prev,
        metadata: {
          ...prev.metadata,
          indicators: [activeInd],
          selectedIndicator: activeInd,
        },
        items: prev.items.map((item) => ({
          ...item,
          indicator: activeInd,
        })),
      };
    });
    setNotice({
      type: 'success',
      message: 'Semua indikator lain telah dihapus, menyisakan indikator yang aktif dicetak.',
    });
  }, []);

  const handleAddItems = useCallback(
    (newEntries: Omit<EvidenceItem, 'id' | 'order' | 'createdAt'>[]) => {
      setState((prev) => {
        const currentMonthItems = prev.items.filter((i) => i.month === selectedMonth);
        let nextOrder =
          currentMonthItems.length > 0
            ? Math.max(...currentMonthItems.map((i) => i.order)) + 1
            : 0;
        const now = Date.now();
        const created: EvidenceItem[] = newEntries.map((entry, idx) => ({
          ...entry,
          indicator:
            entry.indicator?.trim() || prev.metadata.selectedIndicator || DEFAULT_INDICATOR,
          id: `ev-${now}-${idx}-${Math.random().toString(36).slice(2, 7)}`,
          order: nextOrder + idx,
          createdAt: now + idx,
        }));
        return {
          ...prev,
          items: [...prev.items, ...created],
        };
      });
    },
    [selectedMonth]
  );

  const handleUpdateItem = useCallback((id: string, patch: Partial<EvidenceItem>) => {
    setState((prev) => ({
      ...prev,
      items: prev.items.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    }));
  }, []);

  const handleDeleteItem = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      items: prev.items.filter((item) => item.id !== id),
    }));
  }, []);

  const handleMoveItemOrder = useCallback((id: string, direction: 'up' | 'down') => {
    setState((prev) => {
      const target = prev.items.find((i) => i.id === id);
      if (!target) return prev;
      const targetInd = (target.indicator ?? '').trim() || DEFAULT_INDICATOR;
      const siblings = prev.items
        .filter(
          (i) =>
            i.month === target.month &&
            ((i.indicator ?? '').trim() || DEFAULT_INDICATOR) === targetInd
        )
        .sort((a, b) => a.order - b.order || a.createdAt - b.createdAt);

      const idx = siblings.findIndex((i) => i.id === id);
      const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (idx < 0 || swapIdx < 0 || swapIdx >= siblings.length) return prev;

      const reordered = [...siblings];
      const [removed] = reordered.splice(idx, 1);
      reordered.splice(swapIdx, 0, removed);

      const orderMap = new Map<string, number>();
      reordered.forEach((item, index) => orderMap.set(item.id, index));

      return {
        ...prev,
        items: prev.items.map((item) =>
          orderMap.has(item.id) ? { ...item, order: orderMap.get(item.id)! } : item
        ),
      };
    });
  }, []);

  const handleMoveItemMonth = useCallback((id: string, targetMonth: number) => {
    setState((prev) => {
      const targetMonthItems = prev.items.filter((i) => i.month === targetMonth);
      const nextOrder =
        targetMonthItems.length > 0
          ? Math.max(...targetMonthItems.map((i) => i.order)) + 1
          : 0;
      return {
        ...prev,
        items: prev.items.map((item) =>
          item.id === id ? { ...item, month: targetMonth, order: nextOrder } : item
        ),
      };
    });
  }, []);

  const handleLoadSampleData = useCallback(() => {
    const identityMetadata = getEmployeeIdentityMetadata(state.metadata.year);
    setState((prev) => ({
      ...prev,
      metadata: {
        ...prev.metadata,
        ...identityMetadata,
      },
    }));
    setNotice({
      type: 'success',
      message: 'Identitas laporan & pegawai berhasil dimuat.',
    });
  }, [state.metadata.year]);

  const handleResetAllData = useCallback(() => {
    void clearReportState();
    setState({
      metadata: { ...DEFAULT_METADATA, year: state.metadata.year },
      items: [],
    });
    setNotice({
      type: 'success',
      message: 'Seluruh data laporan telah dikosongkan.',
    });
  }, [state.metadata.year]);

  const handleDownloadPdf = useCallback(async () => {
    if (isExporting) return;
    setIsExporting(true);
    setExportProgress(null);
    setNotice(null);

    try {
      const result = await generateAndDownloadAnnualPdf(
        state.metadata,
        state.items,
        (current, total) => setExportProgress({ current, total })
      );
      setNotice({
        type: 'success',
        message: `Berhasil mengunduh ${result.fileName} (${result.totalPages} halaman F4 · Indikator: ${state.metadata.selectedIndicator}).`,
      });
    } catch (err) {
      setNotice({
        type: 'error',
        message:
          err instanceof Error
            ? err.message
            : 'Terjadi kesalahan saat menyusun dokumen PDF F4.',
      });
    } finally {
      setIsExporting(false);
      setExportProgress(null);
    }
  }, [isExporting, state.metadata, state.items]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <div className="h-16 border-b border-slate-200 bg-white px-6 flex items-center justify-between">
          <div className="h-5 w-40 rounded bg-slate-200 animate-pulse" />
          <div className="h-9 w-36 rounded-lg bg-slate-200 animate-pulse" />
        </div>
        <div className="flex-1 flex">
          <div className="hidden lg:block w-[288px] border-r border-slate-200 bg-white p-4 space-y-3">
            <div className="h-14 rounded-lg bg-slate-100 animate-pulse" />
            <div className="h-96 rounded-lg bg-slate-100 animate-pulse" />
          </div>
          <div className="flex-1 p-8 space-y-6">
            <div className="h-12 w-64 rounded bg-slate-200 animate-pulse" />
            <div className="h-64 rounded-xl bg-white border border-slate-200 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <TopBar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onDownloadPdf={handleDownloadPdf}
        isExporting={isExporting}
        exportProgress={exportProgress}
        canExport={annualPages.length > 0}
      />

      {notice && (
        <div
          role="status"
          className={`border-b px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3 text-xs font-medium ${
            notice.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          <div className="flex items-center gap-2">
            {notice.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-700 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 text-rose-700 shrink-0" />
            )}
            <span>{notice.message}</span>
          </div>
          <button
            type="button"
            aria-label="Tutup pemberitahuan"
            onClick={() => setNotice(null)}
            className="rounded p-1 hover:bg-black/5"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <div className="flex-1 flex flex-col lg:flex-row min-h-0">
        {activeTab === 'editor' && (
          <MonthSidebar
            year={state.metadata.year}
            onYearChange={(year) => handleUpdateMetadata({ year })}
            indicators={state.metadata.indicators}
            selectedIndicator={state.metadata.selectedIndicator}
            onSelectIndicator={(selectedIndicator) =>
              handleUpdateMetadata({ selectedIndicator })
            }
            onAddIndicator={handleAddIndicator}
            selectedMonth={selectedMonth}
            onSelectMonth={setSelectedMonth}
            monthCounts={monthCounts}
            totalPhotos={selectedIndicatorItems.length}
            totalAllIndicatorPhotos={state.items.length}
            totalPages={annualPages.length}
            paperWidthMm={state.metadata.paperWidthMm}
          />
        )}

        <main className="flex-1 min-w-0 flex flex-col">
          {activeTab === 'editor' && (
            <MonthEditor
              year={state.metadata.year}
              monthIndex={selectedMonth}
              indicators={state.metadata.indicators}
              selectedIndicator={state.metadata.selectedIndicator}
              onSelectIndicator={(selectedIndicator) =>
                handleUpdateMetadata({ selectedIndicator })
              }
              onAddIndicator={handleAddIndicator}
              items={selectedMonthItems}
              onSelectMonth={setSelectedMonth}
              onAddItems={handleAddItems}
              onUpdateItem={handleUpdateItem}
              onDeleteItem={handleDeleteItem}
              onMoveItemOrder={handleMoveItemOrder}
              onMoveItemMonth={handleMoveItemMonth}
            />
          )}

          {activeTab === 'settings' && (
            <ReportSettings
              metadata={state.metadata}
              items={state.items}
              onChangeMetadata={handleUpdateMetadata}
              onAddIndicator={handleAddIndicator}
              onEditIndicator={handleEditIndicator}
              onDeleteIndicator={handleDeleteIndicator}
              onDeleteAllOtherIndicators={handleDeleteAllOtherIndicators}
              onLoadSampleData={handleLoadSampleData}
              onResetAllData={handleResetAllData}
              totalPhotos={state.items.length}
            />
          )}

          {activeTab === 'preview' && (
            <DocumentPreview
              metadata={state.metadata}
              items={state.items}
              onChangeSelectedIndicator={(selectedIndicator) =>
                handleUpdateMetadata({ selectedIndicator })
              }
              onChangePhotosPerPage={(photosPerPage) =>
                handleUpdateMetadata({ photosPerPage })
              }
              onDownloadPdf={handleDownloadPdf}
              isExporting={isExporting}
              onGoToEditor={() => setActiveTab('editor')}
            />
          )}
        </main>
      </div>
    </div>
  );
}
