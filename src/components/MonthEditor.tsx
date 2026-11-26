import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ImagePlus,
  Loader2,
  Lock,
  Plus,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import {
  ALL_INDICATORS,
  DEFAULT_INDICATOR,
  EvidenceItem,
  MONTHS,
  validateIndicatorName,
} from '../types/ekinerja';
import { cleanFileNameToTitle, processImageFile } from '../utils/storage';

interface MonthEditorProps {
  year: number;
  monthIndex: number;
  indicators: string[];
  selectedIndicator: string;
  onSelectIndicator: (indicator: string) => void;
  onAddIndicator: (newIndicator: string) => void;
  items: EvidenceItem[];
  onSelectMonth: (month: number) => void;
  onAddItems: (newItems: Omit<EvidenceItem, 'id' | 'order' | 'createdAt'>[]) => void;
  onUpdateItem: (id: string, patch: Partial<EvidenceItem>) => void;
  onUpdateMonthActionPlan: (month: number, indicator: string, actionPlan: string) => void;
  onDeleteItem: (id: string) => void;
  onDeleteMonthItems: (month: number, indicator?: string) => void;
  onMoveItemOrder: (id: string, direction: 'up' | 'down') => void;
  onMoveItemMonth: (id: string, targetMonth: number) => void;
}

export function MonthEditor({
  year,
  monthIndex,
  indicators,
  selectedIndicator,
  onSelectIndicator,
  onAddIndicator,
  items,
  onSelectMonth,
  onAddItems,
  onUpdateItem,
  onUpdateMonthActionPlan,
  onDeleteItem,
  onDeleteMonthItems,
  onMoveItemOrder,
  onMoveItemMonth,
}: MonthEditorProps) {
  const currentMonth = MONTHS.find((m) => m.index === monthIndex) ?? MONTHS[0];

  // Staged single/multi-item form state
  const [draftTitle, setDraftTitle] = useState('');
  const [draftMonth, setDraftMonth] = useState<number>(monthIndex);
  const [draftDesc, setDraftDesc] = useState('');
  const [draftPhotos, setDraftPhotos] = useState<
    Array<{
      dataUrl: string;
      width: number;
      height: number;
      fileName: string;
    }>
  >([]);
  const [lastUploadedCount, setLastUploadedCount] = useState<number | null>(null);

  useEffect(() => {
    setDraftMonth(monthIndex);
    setLastUploadedCount(null);
  }, [monthIndex]);

  const activeIndicatorClean =
    selectedIndicator === ALL_INDICATORS
      ? indicators[0] || DEFAULT_INDICATOR
      : selectedIndicator.trim() || DEFAULT_INDICATOR;
  const lockedMonthActionPlan =
    items
      .find(
        (i) =>
          ((i.indicator ?? '').trim() || DEFAULT_INDICATOR) === activeIndicatorClean &&
          Boolean(i.description?.trim())
      )
      ?.description?.trim() ?? '';
  const isMonthActionPlanLocked = Boolean(lockedMonthActionPlan);

  // Pre-fill Rencana Aksi from existing items in this month & active indicator when switching month/indicator or when items change
  useEffect(() => {
    setDraftDesc(lockedMonthActionPlan);
  }, [monthIndex, activeIndicatorClean, lockedMonthActionPlan]);

  const selectedDraftMonth = MONTHS.find((m) => m.index === draftMonth) ?? currentMonth;

  // Inline new indicator form state
  const [isAddingIndicator, setIsAddingIndicator] = useState(false);
  const [newIndicatorName, setNewIndicatorName] = useState('');
  const [showAllIndicatorsInList, setShowAllIndicatorsInList] = useState(false);
  const [confirmDeleteAllMonth, setConfirmDeleteAllMonth] = useState(false);

  useEffect(() => {
    setConfirmDeleteAllMonth(false);
  }, [monthIndex, selectedIndicator, showAllIndicatorsInList]);

  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const singleFileInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const filteredItems =
    showAllIndicatorsInList || selectedIndicator === ALL_INDICATORS
      ? items
      : items.filter(
          (item) => ((item.indicator ?? '').trim() || DEFAULT_INDICATOR) === activeIndicatorClean
        );

  const handleCreateIndicator = () => {
    const err = validateIndicatorName(newIndicatorName, indicators);
    if (err) {
      setErrorMsg(err);
      return;
    }
    setErrorMsg(null);
    onAddIndicator(newIndicatorName.trim());
    setNewIndicatorName('');
    setIsAddingIndicator(false);
  };

  const handleStageFiles = async (fileList: FileList | File[]) => {
    const files = Array.from(fileList).filter((f) => f.type.startsWith('image/'));
    if (files.length === 0) {
      setErrorMsg('Pilih berkas gambar (JPG, PNG, atau WebP).');
      return;
    }

    setErrorMsg(null);
    setIsProcessing(true);
    try {
      const staged: Array<{
        dataUrl: string;
        width: number;
        height: number;
        fileName: string;
      }> = [];
      for (const file of files) {
        const processed = await processImageFile(file);
        staged.push({
          ...processed,
          fileName: file.name,
        });
      }
      setDraftPhotos(staged);
      setLastUploadedCount(staged.length);
      if (!draftTitle.trim() && staged.length > 0) {
        setDraftTitle(
          staged.length === 1
            ? cleanFileNameToTitle(staged[0].fileName)
            : `${staged.length} Foto Bukti Dukung`
        );
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Gagal memproses foto.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveDraft = (e: React.FormEvent) => {
    e.preventDefault();
    if (draftPhotos.length === 0) {
      setErrorMsg('Silakan pilih atau seret foto bukti dukung terlebih dahulu.');
      return;
    }
    const finalActionPlan = (isMonthActionPlanLocked ? lockedMonthActionPlan : draftDesc).trim();
    if (!finalActionPlan) {
      setErrorMsg('Rencana Aksi wajib diisi.');
      return;
    }
    if (!draftMonth || draftMonth < 1 || draftMonth > 12) {
      setErrorMsg('Bulan wajib dipilih (Januari - Desember).');
      return;
    }

    const activeInd = activeIndicatorClean;
    const customTitle = draftTitle.trim();
    const prepared: Omit<EvidenceItem, 'id' | 'order' | 'createdAt'>[] = draftPhotos.map(
      (photo) => ({
        year,
        month: draftMonth,
        indicator: activeInd,
        title:
          draftPhotos.length === 1
            ? customTitle || cleanFileNameToTitle(photo.fileName)
            : cleanFileNameToTitle(photo.fileName),
        date: undefined,
        description: finalActionPlan,
        imageDataUrl: photo.dataUrl,
        imageWidth: photo.width,
        imageHeight: photo.height,
      })
    );

    const savedCount = prepared.length;
    onAddItems(prepared);
    setDraftTitle('');
    setDraftPhotos([]);
    setLastUploadedCount(savedCount);
    setErrorMsg(null);
    if (singleFileInputRef.current) singleFileInputRef.current.value = '';
  };

  const handleReplacePhoto = async (itemId: string, file: File) => {
    setErrorMsg(null);
    setIsProcessing(true);
    try {
      const processed = await processImageFile(file);
      onUpdateItem(itemId, {
        imageDataUrl: processed.dataUrl,
        imageWidth: processed.width,
        imageHeight: processed.height,
      });
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Gagal mengganti foto.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await handleStageFiles(e.dataTransfer.files);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-8 space-y-8">
      {/* Month Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">
            {currentMonth.name} {year}
          </h1>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-500">
            <span>Bulan ke-{monthIndex} dari 12</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums text-sky-900 font-medium">
              {
                items.filter(
                  (i) => ((i.indicator ?? '').trim() || DEFAULT_INDICATOR) === selectedIndicator
                ).length
              }{' '}
              bukti pada indikator dipilih
            </span>
            {items.length > 0 && (
              <>
                <span aria-hidden="true">·</span>
                <span className="font-mono tabular-nums text-slate-500">
                  total {items.length} bukti bulan ini
                </span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={monthIndex <= 1}
            onClick={() => onSelectMonth(Math.max(1, monthIndex - 1))}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 transition-colors whitespace-nowrap"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Sebelumnya</span>
          </button>
          <button
            type="button"
            disabled={monthIndex >= 12}
            onClick={() => onSelectMonth(Math.min(12, monthIndex + 1))}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 transition-colors whitespace-nowrap"
          >
            <span>Berikutnya</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Input Form: Photo + Indikator Kinerja + Nama Bukti Dukung */}
      <section
        aria-label="Tambah bukti dukung"
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        className={`rounded-xl border bg-white p-5 sm:p-6 transition-colors ${
          isDragOver ? 'border-sky-700 bg-sky-50/40' : 'border-slate-200'
        }`}
      >
        <div className="mb-4">
          <h2 className="font-display text-base font-semibold text-slate-900">
            Tambah Foto &amp; Nama Bukti Dukung
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Pilih atau seret satu maupun banyak foto sekaligus untuk bulan {currentMonth.name}, lengkapi Rencana Aksi, lalu klik Simpan Bukti Dukung.
          </p>
        </div>

        <form onSubmit={handleSaveDraft} className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
          {/* Left: Photo Picker / Multi-Photo Dropzone */}
          <div className="md:col-span-5">
            <input
              ref={singleFileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  void handleStageFiles(e.target.files);
                  e.target.value = '';
                }
              }}
            />

            <button
              type="button"
              onClick={() => singleFileInputRef.current?.click()}
              disabled={isProcessing}
              className={`flex aspect-[4/3] w-full flex-col items-center justify-center gap-2.5 rounded-lg border border-dashed p-4 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-700 ${
                draftPhotos.length > 0
                  ? 'border-sky-700 bg-sky-50/50 hover:bg-sky-50'
                  : lastUploadedCount !== null && lastUploadedCount > 0
                  ? 'border-emerald-500 bg-emerald-50/40 hover:border-sky-700 hover:bg-sky-50/30'
                  : 'border-slate-300 bg-slate-50/80 hover:border-sky-700 hover:bg-sky-50/30'
              }`}
            >
              {isProcessing ? (
                <Loader2 className="h-7 w-7 animate-spin text-sky-800" />
              ) : draftPhotos.length > 0 ? (
                <CheckCircle2 className="h-7 w-7 text-sky-800" />
              ) : lastUploadedCount !== null && lastUploadedCount > 0 ? (
                <CheckCircle2 className="h-7 w-7 text-emerald-600" />
              ) : (
                <ImagePlus className="h-7 w-7 text-slate-400" />
              )}

              <div>
                <span className="block text-sm font-semibold text-slate-800">
                  Pilih atau Seret Foto ke Sini
                </span>
                {draftPhotos.length > 0 ? (
                  <span className="mt-1 inline-block rounded-full bg-sky-900 px-3 py-0.5 text-xs font-semibold text-white">
                    {draftPhotos.length} foto berhasil diupload (Siap disimpan)
                  </span>
                ) : lastUploadedCount !== null && lastUploadedCount > 0 ? (
                  <span className="mt-1 inline-block rounded-full bg-emerald-700 px-3 py-0.5 text-xs font-semibold text-white">
                    Sukses mengunggah {lastUploadedCount} foto!
                  </span>
                ) : (
                  <span className="block text-xs text-slate-500 mt-0.5">
                    Bisa pilih 1 atau banyak foto sekaligus (JPG, PNG, WebP)
                  </span>
                )}
              </div>

              {draftPhotos.length > 0 && (
                <div className="mt-1 flex items-center justify-center gap-1.5 overflow-hidden">
                  {draftPhotos.slice(0, 4).map((p, idx) => (
                    <img
                      key={`${p.fileName}-${idx}`}
                      src={p.dataUrl}
                      alt={p.fileName}
                      referrerPolicy="no-referrer"
                      className="h-11 w-11 rounded border border-slate-300 bg-white object-cover shadow-xs"
                    />
                  ))}
                  {draftPhotos.length > 4 && (
                    <span className="flex h-11 w-11 items-center justify-center rounded border border-slate-300 bg-white font-mono text-xs font-bold text-slate-700">
                      +{draftPhotos.length - 4}
                    </span>
                  )}
                </div>
              )}
            </button>
          </div>

          {/* Right: Metadata Fields */}
          <div className="md:col-span-7 space-y-4">
            {/* Indikator Kinerja Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="draft-indicator"
                  className="block text-xs font-semibold text-slate-700"
                >
                  Indikator Kinerja <span className="text-rose-600">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setIsAddingIndicator((v) => !v)}
                  className="text-xs font-semibold text-sky-800 hover:text-sky-950"
                >
                  {isAddingIndicator ? 'Batal Tambah' : '+ Tambah Indikator Kinerja Baru'}
                </button>
              </div>

              {isAddingIndicator ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newIndicatorName}
                    onChange={(e) => setNewIndicatorName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleCreateIndicator();
                      }
                    }}
                    placeholder="Contoh: Permintaan perbaikan perangkat keras/jaringan"
                    className="flex-1 rounded-lg border border-sky-700 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-700/20"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={handleCreateIndicator}
                    className="rounded-lg bg-sky-900 px-3.5 py-2 text-xs font-medium text-white hover:bg-sky-800 whitespace-nowrap"
                  >
                    Simpan Indikator
                  </button>
                </div>
              ) : (
                <select
                  id="draft-indicator"
                  value={activeIndicatorClean}
                  onChange={(e) => onSelectIndicator(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-sky-50/40 px-3.5 py-2.5 text-sm font-medium text-slate-900 focus:border-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-700/20"
                >
                  {indicators.map((ind) => (
                    <option key={ind} value={ind}>
                      {ind}
                    </option>
                  ))}
                </select>
              )}
              <p className="mt-1 text-[11px] text-slate-500">
                Saat mencetak PDF Januari–Desember, hanya bukti dukung pada Indikator Kinerja yang dipilih ini yang akan dicetak.
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="draft-desc"
                  className="block text-xs font-semibold text-slate-700"
                >
                  Rencana Aksi <span className="text-rose-600">*</span>
                </label>
                {isMonthActionPlanLocked && (
                  <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                    <Lock className="h-3 w-3 text-slate-500" />
                    <span>Terkunci untuk bulan {selectedDraftMonth.name}</span>
                  </span>
                )}
              </div>
              <input
                id="draft-desc"
                type="text"
                required
                readOnly={isMonthActionPlanLocked}
                disabled={isMonthActionPlanLocked}
                value={isMonthActionPlanLocked ? lockedMonthActionPlan : draftDesc}
                onChange={(e) => {
                  if (isMonthActionPlanLocked) return;
                  const val = e.target.value;
                  setDraftDesc(val);
                  if (errorMsg) setErrorMsg(null);
                }}
                placeholder="Masukkan rencana aksi untuk semua foto di bulan ini"
                className={`w-full rounded-lg border px-3.5 py-2.5 text-sm ${
                  isMonthActionPlanLocked
                    ? 'border-slate-200 bg-slate-100 text-slate-600 cursor-not-allowed select-none'
                    : 'border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:border-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-700/20'
                }`}
              />
              <p className="mt-1 text-[11px] text-slate-500">
                {isMonthActionPlanLocked
                  ? `Rencana Aksi bulan ${selectedDraftMonth.name} sudah diinput dan dikunci otomatis untuk seluruh foto di bulan ini.`
                  : `Rencana Aksi ini berlaku untuk seluruh foto bukti dukung pada bulan ${selectedDraftMonth.name} dan akan dikunci setelah diinput.`}
              </p>
            </div>

            <div>
              <label
                htmlFor="draft-title"
                className="block text-xs font-semibold text-slate-700 mb-1.5"
              >
                Nama Bukti Dukung <span className="text-rose-600">*</span>
              </label>
              <input
                id="draft-title"
                type="text"
                required
                value={draftTitle}
                onChange={(e) => setDraftTitle(e.target.value)}
                placeholder={`Contoh: Perbaikan jaringan ruang pelayanan bulan ${selectedDraftMonth.name} ${year}`}
                className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-700/20"
              />
            </div>

            <div>
              <label
                htmlFor="draft-month"
                className="block text-xs font-semibold text-slate-700 mb-1.5"
              >
                Bulan <span className="text-rose-600">*</span>
              </label>
              <select
                id="draft-month"
                required
                value={draftMonth}
                onChange={(e) => {
                  const nextMonth = parseInt(e.target.value, 10);
                  setDraftMonth(nextMonth);
                  onSelectMonth(nextMonth);
                }}
                className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-900 focus:border-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-700/20"
              >
                {MONTHS.map((m) => (
                  <option key={m.index} value={m.index}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            {errorMsg && (
              <p role="alert" className="text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
                {errorMsg}
              </p>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <span className="text-xs text-slate-500">
                Disimpan otomatis ke database MySQL untuk bulan {currentMonth.name} {year}.
              </span>
              <button
                type="submit"
                disabled={isProcessing || draftPhotos.length === 0}
                className="inline-flex items-center gap-2 rounded-lg bg-sky-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-45 transition-colors whitespace-nowrap"
              >
                <Plus className="h-4 w-4" />
                <span>
                  {draftPhotos.length > 1
                    ? `Simpan ${draftPhotos.length} Bukti Dukung`
                    : 'Simpan Bukti Dukung'}
                </span>
              </button>
            </div>
          </div>
        </form>
      </section>

      {/* Evidence List for Selected Month */}
      <section aria-label={`Daftar bukti dukung ${currentMonth.name}`}>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="font-display text-base font-semibold text-slate-900">
              Daftar Foto Bulan {currentMonth.name}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {showAllIndicatorsInList || selectedIndicator === ALL_INDICATORS
                ? `Menampilkan semua indikator kinerja (${filteredItems.length} entri)`
                : `Indikator aktif: ${activeIndicatorClean} (${filteredItems.length} entri)`}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {items.length > 0 && indicators.length > 1 && (
              <div className="flex items-center rounded-lg bg-slate-100 p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setShowAllIndicatorsInList(false);
                    if (selectedIndicator === ALL_INDICATORS) {
                      onSelectIndicator(activeIndicatorClean);
                    }
                  }}
                  className={`rounded-md px-2.5 py-1 font-medium transition-colors ${
                    !showAllIndicatorsInList && selectedIndicator !== ALL_INDICATORS
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Indikator Dipilih ({
                    items.filter(
                      (i) =>
                        ((i.indicator ?? '').trim() || DEFAULT_INDICATOR) === activeIndicatorClean
                    ).length
                  })
                </button>
                <button
                  type="button"
                  onClick={() => setShowAllIndicatorsInList(true)}
                  className={`rounded-md px-2.5 py-1 font-medium transition-colors ${
                    showAllIndicatorsInList || selectedIndicator === ALL_INDICATORS
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Semua Indikator ({items.length})
                </button>
              </div>
            )}

            {filteredItems.length > 0 && (
              confirmDeleteAllMonth ? (
                <div className="flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1">
                  <span className="text-xs font-medium text-rose-800">
                    Hapus {filteredItems.length} foto bulan {currentMonth.name}?
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      onDeleteMonthItems(
                        monthIndex,
                        showAllIndicatorsInList || selectedIndicator === ALL_INDICATORS
                          ? undefined
                          : activeIndicatorClean
                      );
                      setDraftDesc('');
                      setConfirmDeleteAllMonth(false);
                    }}
                    className="rounded-md bg-rose-700 px-2.5 py-1 text-xs font-semibold text-white hover:bg-rose-800 transition-colors"
                  >
                    Ya, Hapus Semua
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteAllMonth(false)}
                    className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    Batal
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmDeleteAllMonth(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Hapus Semua Foto Bulan {currentMonth.name}</span>
                </button>
              )
            )}
          </div>
        </div>

        {filteredItems.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
            <p className="text-sm font-medium text-slate-700">
              Belum ada foto bukti dukung pada bulan {currentMonth.name} {year} untuk indikator{' '}
              <span className="font-semibold text-slate-900">&ldquo;{activeIndicatorClean}&rdquo;</span>.
            </p>
            <p className="mt-1 text-xs text-slate-500 max-w-md mx-auto">
              Unggah foto kegiatan di formulir atas atau seret beberapa gambar sekaligus ke area unggah.
            </p>
            {items.length > 0 && !showAllIndicatorsInList && (
              <button
                type="button"
                onClick={() => setShowAllIndicatorsInList(true)}
                className="mt-4 inline-flex items-center rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
              >
                Lihat {items.length} foto dari indikator lain di bulan ini
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredItems.map((item, idx) => (
              <article
                key={item.id}
                className="rounded-xl border border-slate-200 bg-white overflow-hidden flex flex-col"
              >
                {/* Thumbnail container */}
                <div className="relative aspect-[16/10] bg-slate-100 border-b border-slate-200 flex items-center justify-center p-2">
                  <img
                    src={item.imageDataUrl}
                    alt={item.title || `Bukti dukung ${idx + 1}`}
                    referrerPolicy="no-referrer"
                    className="max-h-full max-w-full object-contain"
                  />
                  <span
                    className="absolute top-2.5 left-2.5 z-10 inline-flex h-7 min-w-7 items-center justify-center rounded-lg border-2 border-white px-2 font-display text-xs font-bold tabular-nums text-white shadow-md"
                    style={{
                      background: 'linear-gradient(135deg, #0F4C81 0%, #0369A1 100%)',
                    }}
                  >
                    {idx + 1}
                  </span>
                </div>

                {/* Editable Fields */}
                <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                  <div className="space-y-2.5">
                    <div>
                      <label
                        htmlFor={`indicator-${item.id}`}
                        className="block text-[11px] font-semibold text-slate-500 mb-1"
                      >
                        Indikator Kinerja
                      </label>
                      <select
                        id={`indicator-${item.id}`}
                        value={(item.indicator ?? '').trim() || DEFAULT_INDICATOR}
                        onChange={(e) => onUpdateItem(item.id, { indicator: e.target.value })}
                        className="w-full rounded-md border border-slate-200 bg-sky-50/40 px-2.5 py-1.5 text-xs font-medium text-slate-900 focus:border-sky-700 focus:outline-none"
                      >
                        {indicators.map((ind) => (
                          <option key={ind} value={ind}>
                            {ind}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label
                          htmlFor={`desc-${item.id}`}
                          className="block text-[11px] font-semibold text-slate-500"
                        >
                          Rencana Aksi (Bulan Ini) <span className="text-rose-600">*</span>
                        </label>
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-500">
                          <Lock className="h-2.5 w-2.5" />
                          <span>Terkunci</span>
                        </span>
                      </div>
                      <input
                        id={`desc-${item.id}`}
                        type="text"
                        readOnly
                        disabled
                        value={item.description ?? ''}
                        className="w-full rounded-md border border-slate-200 bg-slate-100 px-2.5 py-1.5 text-xs font-medium text-slate-600 cursor-not-allowed select-none"
                      />
                    </div>

                    <div className="hidden">
                      <label
                        htmlFor={`title-${item.id}`}
                        className="block text-[11px] font-semibold text-slate-500 mb-1"
                      >
                        Nama Bukti Dukung <span className="text-rose-600">*</span>
                      </label>
                      <input
                        id={`title-${item.id}`}
                        type="text"
                        required
                        value={item.title}
                        onChange={(e) => onUpdateItem(item.id, { title: e.target.value })}
                        placeholder="Masukkan nama bukti dukung"
                        className="w-full rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-sm font-medium text-slate-900 focus:border-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-700/20"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor={`month-${item.id}`}
                        className="block text-[11px] font-semibold text-slate-500 mb-1"
                      >
                        Bulan <span className="text-rose-600">*</span>
                      </label>
                      <select
                        id={`month-${item.id}`}
                        required
                        value={item.month}
                        onChange={(e) =>
                          onMoveItemMonth(item.id, parseInt(e.target.value, 10))
                        }
                        className="w-full rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:border-sky-700 focus:outline-none"
                      >
                        {MONTHS.map((m) => (
                          <option key={m.index} value={m.index}>
                            {m.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div className="flex items-center justify-between border-t border-slate-100 pt-3 mt-1">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        aria-label="Naikkan urutan"
                        disabled={idx === 0}
                        onClick={() => onMoveItemOrder(item.id, 'up')}
                        className="rounded-md border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-50 disabled:opacity-35 disabled:cursor-not-allowed"
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        aria-label="Turunkan urutan"
                        disabled={idx === filteredItems.length - 1}
                        onClick={() => onMoveItemOrder(item.id, 'down')}
                        className="rounded-md border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-50 disabled:opacity-35 disabled:cursor-not-allowed"
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                      </button>
                      <input
                        ref={(el) => {
                          replaceInputRefs.current[item.id] = el;
                        }}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            void handleReplacePhoto(item.id, file);
                            e.target.value = '';
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => replaceInputRefs.current[item.id]?.click()}
                        className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      >
                        <RefreshCw className="h-3 w-3" />
                        <span>Ganti Foto</span>
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => onDeleteItem(item.id)}
                      className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-rose-700 hover:bg-rose-50 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Hapus</span>
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
