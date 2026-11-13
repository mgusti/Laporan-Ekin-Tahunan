import React, { useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  ImagePlus,
  Loader2,
  Plus,
  RefreshCw,
  Trash2,
  Upload,
} from 'lucide-react';
import { EvidenceItem, MONTHS } from '../types/ekinerja';
import { cleanFileNameToTitle, processImageFile } from '../utils/storage';

interface MonthEditorProps {
  year: number;
  monthIndex: number;
  items: EvidenceItem[];
  onSelectMonth: (month: number) => void;
  onAddItems: (newItems: Omit<EvidenceItem, 'id' | 'order' | 'createdAt'>[]) => void;
  onUpdateItem: (id: string, patch: Partial<EvidenceItem>) => void;
  onDeleteItem: (id: string) => void;
  onMoveItemOrder: (id: string, direction: 'up' | 'down') => void;
  onMoveItemMonth: (id: string, targetMonth: number) => void;
}

export function MonthEditor({
  year,
  monthIndex,
  items,
  onSelectMonth,
  onAddItems,
  onUpdateItem,
  onDeleteItem,
  onMoveItemOrder,
  onMoveItemMonth,
}: MonthEditorProps) {
  const currentMonth = MONTHS.find((m) => m.index === monthIndex) ?? MONTHS[0];

  // Staged single-item form state
  const [draftTitle, setDraftTitle] = useState('');
  const [draftDate, setDraftDate] = useState('');
  const [draftDesc, setDraftDesc] = useState('');
  const [draftPhoto, setDraftPhoto] = useState<{
    dataUrl: string;
    width: number;
    height: number;
    fileName: string;
  } | null>(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const singleFileInputRef = useRef<HTMLInputElement>(null);
  const batchFileInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const handleStageSinglePhoto = async (file: File) => {
    setErrorMsg(null);
    setIsProcessing(true);
    try {
      const processed = await processImageFile(file);
      setDraftPhoto({
        ...processed,
        fileName: file.name,
      });
      if (!draftTitle.trim()) {
        setDraftTitle(cleanFileNameToTitle(file.name));
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Gagal memproses foto.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBatchFiles = async (fileList: FileList | File[]) => {
    const files = Array.from(fileList).filter((f) => f.type.startsWith('image/'));
    if (files.length === 0) {
      setErrorMsg('Pilih berkas gambar (JPG, PNG, atau WebP).');
      return;
    }

    // If exactly 1 file and user dropped it while no draft photo exists, add immediately if draftTitle empty?
    // Even better: if user drops multiple files (or uses batch upload), add them directly so they appear immediately!
    // If 1 file is selected via the single-form picker, stage it so user can review/edit Nama Bukti Dukung before saving.
    setErrorMsg(null);
    setIsProcessing(true);
    try {
      const prepared: Omit<EvidenceItem, 'id' | 'order' | 'createdAt'>[] = [];
      for (const file of files) {
        const processed = await processImageFile(file);
        prepared.push({
          month: monthIndex,
          title: cleanFileNameToTitle(file.name),
          date: draftDate || undefined,
          description: undefined,
          imageDataUrl: processed.dataUrl,
          imageWidth: processed.width,
          imageHeight: processed.height,
        });
      }
      onAddItems(prepared);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Gagal mengunggah beberapa foto.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveDraft = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draftPhoto) {
      setErrorMsg('Silakan pilih foto bukti dukung terlebih dahulu.');
      return;
    }
    const finalTitle = draftTitle.trim() || cleanFileNameToTitle(draftPhoto.fileName);
    onAddItems([
      {
        month: monthIndex,
        title: finalTitle,
        date: draftDate || undefined,
        description: draftDesc.trim() || undefined,
        imageDataUrl: draftPhoto.dataUrl,
        imageWidth: draftPhoto.width,
        imageHeight: draftPhoto.height,
      },
    ]);
    setDraftTitle('');
    setDraftDate('');
    setDraftDesc('');
    setDraftPhoto(null);
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
      const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith('image/'));
      if (files.length === 1 && !draftPhoto) {
        await handleStageSinglePhoto(files[0]);
      } else if (files.length > 0) {
        await handleBatchFiles(files);
      } else {
        setErrorMsg('Hanya berkas gambar (JPG, PNG, WebP) yang didukung.');
      }
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
          <div className="mt-1 flex items-center gap-2 text-sm text-slate-500">
            <span>Bulan ke-{monthIndex} dari 12</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums text-slate-700">
              {items.length} bukti dukung
            </span>
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

      {/* Input Form: Photo + Nama Bukti Dukung */}
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
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="font-display text-base font-semibold text-slate-900">
              Tambah Foto &amp; Nama Bukti Dukung
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Isi satu per satu dengan nama kegiatan, atau unggah banyak foto sekaligus untuk bulan {currentMonth.name}.
            </p>
          </div>

          <div>
            <input
              ref={batchFileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  void handleBatchFiles(e.target.files);
                  e.target.value = '';
                }
              }}
            />
            <button
              type="button"
              onClick={() => batchFileInputRef.current?.click()}
              disabled={isProcessing}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors whitespace-nowrap"
            >
              <Upload className="h-3.5 w-3.5" />
              <span>Unggah Banyak Foto Sekaligus</span>
            </button>
          </div>
        </div>

        <form onSubmit={handleSaveDraft} className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
          {/* Left: Photo Picker / Preview */}
          <div className="md:col-span-5">
            <input
              ref={singleFileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  void handleStageSinglePhoto(file);
                }
              }}
            />

            {draftPhoto ? (
              <div className="relative rounded-lg border border-slate-200 bg-slate-50 overflow-hidden">
                <div className="aspect-[4/3] w-full flex items-center justify-center p-2">
                  <img
                    src={draftPhoto.dataUrl}
                    alt={draftTitle || 'Pratinjau foto bukti dukung'}
                    referrerPolicy="no-referrer"
                    className="max-h-full max-w-full object-contain rounded"
                  />
                </div>
                <div className="flex items-center justify-between border-t border-slate-200 bg-white px-3 py-2 text-xs">
                  <span className="truncate text-slate-600 max-w-[180px]">
                    {draftPhoto.fileName}
                  </span>
                  <button
                    type="button"
                    onClick={() => singleFileInputRef.current?.click()}
                    className="font-medium text-sky-800 hover:text-sky-900 whitespace-nowrap"
                  >
                    Ganti Foto
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => singleFileInputRef.current?.click()}
                disabled={isProcessing}
                className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-2.5 rounded-lg border border-dashed border-slate-300 bg-slate-50/80 p-4 text-center hover:border-sky-700 hover:bg-sky-50/30 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-700"
              >
                {isProcessing ? (
                  <Loader2 className="h-7 w-7 animate-spin text-sky-800" />
                ) : (
                  <ImagePlus className="h-7 w-7 text-slate-400" />
                )}
                <div>
                  <span className="block text-sm font-medium text-slate-800">
                    Pilih atau Seret Foto ke Sini
                  </span>
                  <span className="block text-xs text-slate-500 mt-0.5">
                    JPG, PNG, atau WebP · Otomatis disesuaikan untuk F4
                  </span>
                </div>
              </button>
            )}
          </div>

          {/* Right: Metadata Fields */}
          <div className="md:col-span-7 space-y-4">
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
                value={draftTitle}
                onChange={(e) => setDraftTitle(e.target.value)}
                placeholder={`Contoh: Rapat Koordinasi Bulanan ${currentMonth.name} ${year}`}
                className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-700/20"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="draft-date"
                  className="block text-xs font-semibold text-slate-700 mb-1.5"
                >
                  Tanggal Kegiatan (Opsional)
                </label>
                <input
                  id="draft-date"
                  type="date"
                  value={draftDate}
                  onChange={(e) => setDraftDate(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-mono text-slate-900 focus:border-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-700/20"
                />
              </div>
              <div>
                <label
                  htmlFor="draft-desc"
                  className="block text-xs font-semibold text-slate-700 mb-1.5"
                >
                  Keterangan Singkat (Opsional)
                </label>
                <input
                  id="draft-desc"
                  type="text"
                  value={draftDesc}
                  onChange={(e) => setDraftDesc(e.target.value)}
                  placeholder="Lokasi atau ringkasan hasil"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-700/20"
                />
              </div>
            </div>

            {errorMsg && (
              <p role="alert" className="text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
                {errorMsg}
              </p>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <span className="text-xs text-slate-500">
                Disimpan otomatis ke arsip bulan {currentMonth.name} {year}.
              </span>
              <button
                type="submit"
                disabled={isProcessing || !draftPhoto}
                className="inline-flex items-center gap-2 rounded-lg bg-sky-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-45 transition-colors whitespace-nowrap"
              >
                <Plus className="h-4 w-4" />
                <span>Simpan Bukti Dukung</span>
              </button>
            </div>
          </div>
        </form>
      </section>

      {/* Evidence List for Selected Month */}
      <section aria-label={`Daftar bukti dukung ${currentMonth.name}`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-base font-semibold text-slate-900">
            Daftar Foto Bulan {currentMonth.name}
          </h2>
          <span className="font-mono text-xs tabular-nums text-slate-500">
            {items.length} entri
          </span>
        </div>

        {items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
            <p className="text-sm font-medium text-slate-700">
              Belum ada foto bukti dukung untuk bulan {currentMonth.name} {year}.
            </p>
            <p className="mt-1 text-xs text-slate-500 max-w-md mx-auto">
              Unggah foto kegiatan di formulir atas atau seret beberapa gambar sekaligus ke area unggah.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {items.map((item, idx) => (
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
                  <span className="absolute top-2.5 left-2.5 rounded bg-slate-900/80 px-2 py-0.5 font-mono text-xs font-medium tabular-nums text-white">
                    #{idx + 1}
                  </span>
                </div>

                {/* Editable Fields */}
                <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                  <div className="space-y-2.5">
                    <div>
                      <label
                        htmlFor={`title-${item.id}`}
                        className="block text-[11px] font-semibold text-slate-500 mb-1"
                      >
                        Nama Bukti Dukung
                      </label>
                      <input
                        id={`title-${item.id}`}
                        type="text"
                        value={item.title}
                        onChange={(e) => onUpdateItem(item.id, { title: e.target.value })}
                        placeholder="Masukkan nama bukti dukung"
                        className="w-full rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-sm font-medium text-slate-900 focus:border-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-700/20"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label
                          htmlFor={`date-${item.id}`}
                          className="block text-[11px] font-semibold text-slate-500 mb-1"
                        >
                          Tanggal
                        </label>
                        <input
                          id={`date-${item.id}`}
                          type="date"
                          value={item.date ?? ''}
                          onChange={(e) =>
                            onUpdateItem(item.id, { date: e.target.value || undefined })
                          }
                          className="w-full rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-mono text-slate-700 focus:border-sky-700 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor={`month-${item.id}`}
                          className="block text-[11px] font-semibold text-slate-500 mb-1"
                        >
                          Pindah Bulan
                        </label>
                        <select
                          id={`month-${item.id}`}
                          value={item.month}
                          onChange={(e) =>
                            onMoveItemMonth(item.id, parseInt(e.target.value, 10))
                          }
                          className="w-full rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 focus:border-sky-700 focus:outline-none"
                        >
                          {MONTHS.map((m) => (
                            <option key={m.index} value={m.index}>
                              {m.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor={`desc-${item.id}`}
                        className="block text-[11px] font-semibold text-slate-500 mb-1"
                      >
                        Keterangan (Opsional)
                      </label>
                      <input
                        id={`desc-${item.id}`}
                        type="text"
                        value={item.description ?? ''}
                        onChange={(e) =>
                          onUpdateItem(item.id, {
                            description: e.target.value || undefined,
                          })
                        }
                        placeholder="Catatan tambahan singkat"
                        className="w-full rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-700 focus:border-sky-700 focus:outline-none"
                      />
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
                        disabled={idx === items.length - 1}
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
