import { useMemo, useState } from 'react';
import { Download, Loader2, ZoomIn, ZoomOut } from 'lucide-react';
import { EvidenceItem, MONTHS, PhotosPerPage, ReportMetadata } from '../types/ekinerja';
import {
  buildAnnualPages,
  F4Page,
  filterItemsByIndicator,
  formatIndonesianDate,
  getEndOfDecemberDateLabel,
} from '../utils/pdfLayout';

interface DocumentPreviewProps {
  metadata: ReportMetadata;
  items: EvidenceItem[];
  onChangeSelectedIndicator: (indicator: string) => void;
  onChangePhotosPerPage: (count: PhotosPerPage) => void;
  onDownloadPdf: () => void;
  isExporting: boolean;
  onGoToEditor: () => void;
}

export function DocumentPreview({
  metadata,
  items,
  onChangeSelectedIndicator,
  onChangePhotosPerPage,
  onDownloadPdf,
  isExporting,
  onGoToEditor,
}: DocumentPreviewProps) {
  const [zoom, setZoom] = useState<number>(0.78);
  const [filterTarget, setFilterTarget] = useState<string>('all');

  const indicatorItems = useMemo(
    () => filterItemsByIndicator(items, metadata.selectedIndicator),
    [items, metadata.selectedIndicator]
  );
  const allPages = useMemo(() => buildAnnualPages(metadata, items), [metadata, items]);

  const visiblePages = useMemo(() => {
    if (filterTarget === 'all') return allPages;
    if (filterTarget === 'cover') return allPages.filter((p) => p.type === 'cover');
    const monthNum = parseInt(filterTarget, 10);
    if (!Number.isNaN(monthNum)) {
      return allPages.filter((p) => p.type !== 'cover' && p.month.index === monthNum);
    }
    return allPages;
  }, [allPages, filterTarget]);

  // Base visual width at zoom=1 corresponds to 790px (~215mm screen scale)
  const baseWidthPx = Math.round((metadata.paperWidthMm / 215) * 780);
  const pageWidthPx = Math.round(baseWidthPx * zoom);
  const pageHeightPx = Math.round((pageWidthPx * 330) / metadata.paperWidthMm);

  const identityParts: string[] = [`Tahun Laporan: ${metadata.year}`];
  if (metadata.employeeName.trim()) identityParts.push(metadata.employeeName.trim());
  if (metadata.nip.trim()) identityParts.push(`NIP. ${metadata.nip.trim()}`);
  if (metadata.unit.trim()) identityParts.push(metadata.unit.trim());

  const renderPageHeader = (subtitle: string) => (
    <div style={{ marginBottom: `${Math.round(14 * zoom)}px` }}>
      <div
        className="font-bold uppercase tracking-tight text-slate-900"
        style={{ fontSize: `${12.5 * zoom}px`, lineHeight: 1.25 }}
      >
        {metadata.reportTitle || 'Laporan Foto Bukti Dukung E-Kinerja Tahunan'}
      </div>
      <div
        className="text-slate-600 truncate"
        style={{ fontSize: `${9.5 * zoom}px`, marginTop: `${2 * zoom}px` }}
      >
        {identityParts.join('  |  ')}
      </div>
      <div
        style={{
          height: `${Math.max(1.5, 2 * zoom)}px`,
          backgroundColor: '#0F4C81',
          marginTop: `${6 * zoom}px`,
          marginBottom: `${8 * zoom}px`,
        }}
      />
      <div
        className="font-bold text-[#0F4C81] truncate"
        style={{ fontSize: `${11.5 * zoom}px` }}
      >
        {subtitle}
        {metadata.selectedIndicator.trim()
          ? `  ·  Indikator: ${metadata.selectedIndicator.trim()}`
          : ''}
      </div>
    </div>
  );

  const renderPageFooter = (pageNumber: number, totalPages: number) => (
    <div
      className="mt-auto border-t border-slate-300 flex items-center justify-between text-slate-500"
      style={{
        paddingTop: `${6 * zoom}px`,
        fontSize: `${8.5 * zoom}px`,
      }}
    >
      <span>
        Laporan E-Kinerja Tahun {metadata.year} · Kertas F4 ({metadata.paperWidthMm} × 330 mm)
      </span>
      <span className="font-mono tabular-nums">
        Halaman {pageNumber} dari {totalPages}
      </span>
    </div>
  );

  const renderCoverPage = (page: Extract<F4Page, { type: 'cover' }>) => (
    <div className="flex flex-col h-full">
      <div
        style={{
          height: `${Math.max(4, 7 * zoom)}px`,
          backgroundColor: '#0F4C81',
          marginBottom: `${18 * zoom}px`,
        }}
      />

      <div
        className="font-bold text-[#0F4C81] tracking-wide"
        style={{ fontSize: `${10.5 * zoom}px`, marginBottom: `${6 * zoom}px` }}
      >
        DOKUMEN ARSIP BUKTI DUKUNG KINERJA PEGAWAI
      </div>

      <div
        className="font-bold text-slate-900 leading-tight"
        style={{ fontSize: `${21 * zoom}px`, marginBottom: `${6 * zoom}px` }}
      >
        {metadata.reportTitle || 'Laporan Foto Bukti Dukung E-Kinerja Tahunan'}
      </div>

      <div
        className="font-semibold text-slate-700"
        style={{ fontSize: `${14.5 * zoom}px`, marginBottom: `${16 * zoom}px` }}
      >
        Periode Pelaporan: Januari – Desember {metadata.year}
      </div>

      {/* Identity Table Box */}
      <div
        className="border border-slate-300 bg-slate-50"
        style={{
          padding: `${12 * zoom}px ${14 * zoom}px`,
          marginBottom: `${18 * zoom}px`,
          fontSize: `${10.5 * zoom}px`,
        }}
      >
        {[
          ['Nama Pegawai', metadata.employeeName.trim() || '—'],
          ['NIP / Identitas', metadata.nip.trim() || '—'],
          ['Jabatan', metadata.position.trim() || '—'],
          ['Unit Kerja / Instansi', metadata.unit.trim() || '—'],
          ['Indikator Kinerja', metadata.selectedIndicator.trim() || '—'],
        ].map(([label, val]) => (
          <div
            key={label}
            className="flex items-baseline"
            style={{ padding: `${3 * zoom}px 0` }}
          >
            <span className="font-semibold text-slate-600 shrink-0" style={{ width: `${140 * zoom}px` }}>
              {label}
            </span>
            <span className="text-slate-500 mr-2">:</span>
            <span className="text-slate-900 font-medium truncate">{val}</span>
          </div>
        ))}
      </div>

      {/* Monthly Summary Table */}
      <div
        className="font-bold text-slate-900"
        style={{ fontSize: `${12 * zoom}px`, marginBottom: `${8 * zoom}px` }}
      >
        Rekapitulasi Bukti Dukung Bulanan ({page.totalPhotos} Foto)
      </div>

      <div className="border border-slate-300 overflow-hidden" style={{ fontSize: `${10 * zoom}px` }}>
        <div
          className="grid grid-cols-12 bg-[#0F4C81] text-white font-semibold"
          style={{ padding: `${7 * zoom}px ${10 * zoom}px` }}
        >
          <div className="col-span-1">No.</div>
          <div className="col-span-5">Bulan Pelaporan</div>
          <div className="col-span-3 text-right">Jumlah Foto</div>
          <div className="col-span-3 text-right">Halaman</div>
        </div>
        {page.summaryRows.map((row, idx) => (
          <div
            key={row.month.index}
            className={`grid grid-cols-12 border-t border-slate-200 ${
              idx % 2 === 1 ? 'bg-slate-50' : 'bg-white'
            }`}
            style={{ padding: `${6.2 * zoom}px ${10 * zoom}px` }}
          >
            <div className="col-span-1 font-mono tabular-nums text-slate-500">
              {String(idx + 1).padStart(2, '0')}
            </div>
            <div className="col-span-5 font-semibold text-slate-900">
              {row.month.name} {metadata.year}
            </div>
            <div
              className={`col-span-3 text-right font-mono tabular-nums ${
                row.count > 0 ? 'text-slate-900' : 'text-slate-400'
              }`}
            >
              {row.count > 0 ? `${row.count} Foto` : 'Belum ada foto'}
            </div>
            <div className="col-span-3 text-right font-mono tabular-nums text-slate-600">
              {row.pageRangeLabel}
            </div>
          </div>
        ))}
      </div>

      {/* Signature block */}
      <div
        className="grid grid-cols-2 gap-8 mt-auto pt-8"
        style={{ fontSize: `${10 * zoom}px`, marginBottom: `${14 * zoom}px` }}
      >
        <div>
          {metadata.supervisorName.trim() && (
            <>
              <div className="text-slate-600">Mengetahui,</div>
              <div className="text-slate-600">Pejabat Penilai Kinerja,</div>
              <div style={{ height: `${38 * zoom}px` }} />
              <div className="font-bold text-slate-900">{metadata.supervisorName.trim()}</div>
              {metadata.supervisorNip.trim() && (
                <div className="text-slate-600 font-mono" style={{ fontSize: `${9 * zoom}px` }}>
                  NIP. {metadata.supervisorNip.trim()}
                </div>
              )}
            </>
          )}
        </div>
        <div>
          <div className="text-slate-600">
            {metadata.city.trim() ? `${metadata.city.trim()}, ` : ''}{getEndOfDecemberDateLabel(metadata.year)}
          </div>
          <div className="text-slate-600">Pegawai Yang Melaporkan,</div>
          <div style={{ height: `${38 * zoom}px` }} />
          <div className="font-bold text-slate-900">
            {metadata.employeeName.trim() || '( ........................................ )'}
          </div>
          {metadata.nip.trim() && (
            <div className="text-slate-600 font-mono" style={{ fontSize: `${9 * zoom}px` }}>
              NIP. {metadata.nip.trim()}
            </div>
          )}
        </div>
      </div>

      {renderPageFooter(page.pageNumber, page.totalPages)}
    </div>
  );

  const renderMonthPhotosPage = (page: Extract<F4Page, { type: 'month-photos' }>) => {
    const suffix =
      page.monthTotalPages > 1
        ? ` (Bagian ${page.monthPageIndex} dari ${page.monthTotalPages})`
        : '';

    const gridColsClass = metadata.photosPerPage === 2 ? 'grid-cols-1' : 'grid-cols-2';
    const gridRowsClass =
      metadata.photosPerPage === 6 ? 'grid-rows-3' : 'grid-rows-2';

    return (
      <div className="flex flex-col h-full">
        {renderPageHeader(`Bulan: ${page.month.name} ${metadata.year}${suffix}`)}

        <div
          className={`flex-1 grid ${gridColsClass} ${gridRowsClass} min-h-0`}
          style={{
            gap: `${14 * zoom}px`,
            marginBottom: `${12 * zoom}px`,
          }}
        >
          {page.items.map((item, idx) => (
            <div
              key={item.id}
              className="border border-slate-300 bg-white flex flex-col min-h-0 overflow-hidden"
            >
              <div
                className="flex-1 bg-slate-50 flex items-center justify-center min-h-0"
                style={{ padding: `${6 * zoom}px` }}
              >
                <img
                  src={item.imageDataUrl}
                  alt={item.title}
                  referrerPolicy="no-referrer"
                  className="max-h-full max-w-full object-contain"
                />
              </div>
              <div
                className="border-t border-slate-200 bg-white shrink-0"
                style={{ padding: `${6 * zoom}px ${8 * zoom}px` }}
              >
                <div
                  className="font-bold text-slate-900 line-clamp-2"
                  style={{ fontSize: `${9.8 * zoom}px`, lineHeight: 1.3 }}
                >
                  {page.startItemNumber + idx}. {item.title || 'Bukti Dukung E-Kinerja'}
                </div>
                {(item.date || item.description) && (
                  <div
                    className="text-slate-500 truncate"
                    style={{ fontSize: `${8.4 * zoom}px`, marginTop: `${2 * zoom}px` }}
                  >
                    {[
                      item.date ? formatIndonesianDate(item.date) : '',
                      item.description?.trim() ?? '',
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {renderPageFooter(page.pageNumber, page.totalPages)}
      </div>
    );
  };

  const renderEmptyMonthPage = (page: Extract<F4Page, { type: 'month-empty' }>) => (
    <div className="flex flex-col h-full">
      {renderPageHeader(`Bulan: ${page.month.name} ${metadata.year}`)}

      <div
        className="border border-slate-300 bg-slate-50 text-center"
        style={{ padding: `${48 * zoom}px ${24 * zoom}px`, marginTop: `${24 * zoom}px` }}
      >
        <div className="font-bold text-slate-700" style={{ fontSize: `${12.5 * zoom}px` }}>
          Tidak Ada Dokumentasi Foto pada Bulan {page.month.name} {metadata.year}
        </div>
        <div className="text-slate-400 mt-1" style={{ fontSize: `${10 * zoom}px` }}>
          Belum terdapat bukti dukung foto yang dilampirkan untuk periode bulan ini.
        </div>
      </div>

      {renderPageFooter(page.pageNumber, page.totalPages)}
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      {/* Preview Toolbar */}
      <div className="border-b border-slate-200 bg-white px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
          <span className="font-semibold text-slate-900">
            Pratinjau 1 PDF Setahun ({metadata.year})
          </span>
          <span aria-hidden="true">·</span>
          <span className="font-mono tabular-nums">{allPages.length} Halaman</span>
          <span aria-hidden="true">·</span>
          <span className="font-mono tabular-nums">
            F4 ({metadata.paperWidthMm} × 330 mm)
          </span>
          <span aria-hidden="true">·</span>
          <span className="font-mono tabular-nums">{indicatorItems.length} Foto</span>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Indicator selector for printing */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-600 whitespace-nowrap">
              Indikator Cetak:
            </span>
            <select
              aria-label="Pilih Indikator Kinerja yang dicetak"
              value={metadata.selectedIndicator}
              onChange={(e) => onChangeSelectedIndicator(e.target.value)}
              className="max-w-[260px] rounded-lg border border-sky-700/40 bg-sky-50/60 px-2.5 py-1.5 text-xs font-semibold text-sky-950 focus:border-sky-700 focus:outline-none"
            >
              {metadata.indicators.map((ind) => {
                const count = filterItemsByIndicator(items, ind).length;
                return (
                  <option key={ind} value={ind}>
                    {ind} ({count} foto)
                  </option>
                );
              })}
            </select>
          </div>

          {/* Month jump filter */}
          <select
            aria-label="Filter halaman pratinjau"
            value={filterTarget}
            onChange={(e) => setFilterTarget(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:border-sky-700 focus:outline-none"
          >
            <option value="all">Semua Halaman ({allPages.length})</option>
            {metadata.includeCoverPage && <option value="cover">Halaman Sampul</option>}
            {MONTHS.map((m) => (
              <option key={m.index} value={String(m.index)}>
                Bulan {m.name}
              </option>
            ))}
          </select>

          {/* Grid density segmented buttons */}
          <div className="flex items-center rounded-lg bg-slate-100 p-0.5">
            {([2, 4, 6] as PhotosPerPage[]).map((count) => (
              <button
                key={count}
                type="button"
                onClick={() => onChangePhotosPerPage(count)}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap ${
                  metadata.photosPerPage === count
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {count} Foto/Hal
              </button>
            ))}
          </div>

          {/* Zoom controls */}
          <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-1.5 py-1">
            <button
              type="button"
              aria-label="Perkecil pratinjau"
              onClick={() => setZoom((z) => Math.max(0.45, Number((z - 0.1).toFixed(2))))}
              className="p-1 text-slate-600 hover:text-slate-900"
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </button>
            <span className="font-mono text-xs tabular-nums text-slate-700 w-10 text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              type="button"
              aria-label="Perbesar pratinjau"
              onClick={() => setZoom((z) => Math.min(1.15, Number((z + 0.1).toFixed(2))))}
              className="p-1 text-slate-600 hover:text-slate-900"
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </button>
          </div>

          <button
            type="button"
            onClick={onDownloadPdf}
            disabled={isExporting || allPages.length === 0}
            className="inline-flex items-center gap-1.5 rounded-lg bg-sky-900 px-3.5 py-1.5 text-xs font-medium text-white hover:bg-sky-800 disabled:opacity-50 transition-colors whitespace-nowrap"
          >
            {isExporting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Download className="h-3.5 w-3.5" />
            )}
            <span>Unduh PDF</span>
          </button>
        </div>
      </div>

      {/* Scrollable F4 Desk */}
      <div className="flex-1 overflow-auto bg-slate-200/75 p-6 sm:p-10">
        {visiblePages.length === 0 ? (
          <div className="mx-auto max-w-md rounded-xl border border-slate-200 bg-white p-8 text-center">
            <p className="text-sm font-semibold text-slate-800">
              Tidak ada halaman pada filter ini
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Tambahkan foto bukti dukung pada bulan terkait atau pilih &ldquo;Semua Halaman&rdquo;.
            </p>
            <div className="mt-4 flex justify-center gap-2">
              {filterTarget !== 'all' && (
                <button
                  type="button"
                  onClick={() => setFilterTarget('all')}
                  className="rounded-lg border border-slate-200 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Tampilkan Semua
                </button>
              )}
              <button
                type="button"
                onClick={onGoToEditor}
                className="rounded-lg bg-sky-900 px-3.5 py-2 text-xs font-medium text-white hover:bg-sky-800"
              >
                Input Bukti Dukung
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-8">
            {visiblePages.map((page) => (
              <div
                key={`${page.type}-${page.pageNumber}`}
                className="bg-white shadow-md border border-slate-300 shrink-0"
                style={{
                  width: `${pageWidthPx}px`,
                  height: `${pageHeightPx}px`,
                  padding: `${Math.round(38 * zoom)}px ${Math.round(38 * zoom)}px ${Math.round(32 * zoom)}px`,
                }}
              >
                {page.type === 'cover' && renderCoverPage(page)}
                {page.type === 'month-photos' && renderMonthPhotosPage(page)}
                {page.type === 'month-empty' && renderEmptyMonthPage(page)}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
