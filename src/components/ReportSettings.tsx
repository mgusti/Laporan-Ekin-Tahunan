import { useState } from 'react';
import { PaperWidthMm, PhotosPerPage, ReportMetadata } from '../types/ekinerja';

interface ReportSettingsProps {
  metadata: ReportMetadata;
  onChangeMetadata: (patch: Partial<ReportMetadata>) => void;
  onLoadSampleData: () => void;
  onResetAllData: () => void;
  totalPhotos: number;
}

export function ReportSettings({
  metadata,
  onChangeMetadata,
  onLoadSampleData,
  onResetAllData,
  totalPhotos,
}: ReportSettingsProps) {
  const [confirmReset, setConfirmReset] = useState(false);

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-8 space-y-8">
      <div className="border-b border-slate-200 pb-5">
        <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">
          Identitas &amp; Pengaturan Kertas F4
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Lengkapi informasi pegawai untuk sampul dan kop laporan, serta atur tata letak foto pada kertas F4 (PDF).
        </p>
      </div>

      {/* Section 1: Report Identity */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 space-y-5">
        <h2 className="font-display text-base font-semibold text-slate-900">
          Identitas Laporan &amp; Pegawai
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="sm:col-span-3">
            <label htmlFor="set-title" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Judul Laporan Tahunan
            </label>
            <input
              id="set-title"
              type="text"
              value={metadata.reportTitle}
              onChange={(e) => onChangeMetadata({ reportTitle: e.target.value })}
              className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-700/20"
            />
          </div>
          <div>
            <label htmlFor="set-year" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Tahun Laporan
            </label>
            <input
              id="set-year"
              type="number"
              min={2000}
              max={2099}
              value={metadata.year}
              onChange={(e) => {
                const parsed = parseInt(e.target.value, 10);
                if (!Number.isNaN(parsed) && parsed >= 2000 && parsed <= 2099) {
                  onChangeMetadata({ year: parsed });
                }
              }}
              className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-mono tabular-nums text-slate-900 focus:border-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-700/20"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="set-name" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Nama Pegawai / ASN
            </label>
            <input
              id="set-name"
              type="text"
              value={metadata.employeeName}
              onChange={(e) => onChangeMetadata({ employeeName: e.target.value })}
              placeholder="Contoh: Drs. Budi Santoso, M.Si."
              className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-700/20"
            />
          </div>
          <div>
            <label htmlFor="set-nip" className="block text-xs font-semibold text-slate-700 mb-1.5">
              NIP / Nomor Identitas
            </label>
            <input
              id="set-nip"
              type="text"
              value={metadata.nip}
              onChange={(e) => onChangeMetadata({ nip: e.target.value })}
              placeholder="Contoh: 19840512 201001 1 014"
              className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-mono text-slate-900 placeholder:text-slate-400 focus:border-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-700/20"
            />
          </div>
          <div>
            <label htmlFor="set-pos" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Jabatan
            </label>
            <input
              id="set-pos"
              type="text"
              value={metadata.position}
              onChange={(e) => onChangeMetadata({ position: e.target.value })}
              placeholder="Contoh: Analis Kebijakan Ahli Muda"
              className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-700/20"
            />
          </div>
          <div>
            <label htmlFor="set-unit" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Unit Kerja / Instansi
            </label>
            <input
              id="set-unit"
              type="text"
              value={metadata.unit}
              onChange={(e) => onChangeMetadata({ unit: e.target.value })}
              placeholder="Contoh: Dinas Pendidikan Kota Bandung"
              className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-700/20"
            />
          </div>
        </div>

        <div className="border-t border-slate-100 pt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label htmlFor="set-sup-name" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Pejabat Penilai (Opsional)
            </label>
            <input
              id="set-sup-name"
              type="text"
              value={metadata.supervisorName}
              onChange={(e) => onChangeMetadata({ supervisorName: e.target.value })}
              placeholder="Nama atasan penilai"
              className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-700/20"
            />
          </div>
          <div>
            <label htmlFor="set-sup-nip" className="block text-xs font-semibold text-slate-700 mb-1.5">
              NIP Pejabat Penilai (Opsional)
            </label>
            <input
              id="set-sup-nip"
              type="text"
              value={metadata.supervisorNip}
              onChange={(e) => onChangeMetadata({ supervisorNip: e.target.value })}
              placeholder="NIP atasan"
              className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-mono text-slate-900 placeholder:text-slate-400 focus:border-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-700/20"
            />
          </div>
          <div>
            <label htmlFor="set-city" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Kota Penandatanganan
            </label>
            <input
              id="set-city"
              type="text"
              value={metadata.city}
              onChange={(e) => onChangeMetadata({ city: e.target.value })}
              placeholder="Contoh: Jakarta"
              className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-700/20"
            />
          </div>
        </div>
      </section>

      {/* Section 2: F4 Layout Options */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 space-y-5">
        <h2 className="font-display text-base font-semibold text-slate-900">
          Tata Letak Kertas F4 &amp; Struktur Dokumen
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <span className="block text-xs font-semibold text-slate-700 mb-2">
              Dimensi Kertas F4 (Folio)
            </span>
            <div className="grid grid-cols-2 gap-2">
              {([
                { value: 215, label: 'F4 Standar', desc: '215 × 330 mm' },
                { value: 210, label: 'Folio / F4S', desc: '210 × 330 mm' },
              ] as Array<{ value: PaperWidthMm; label: string; desc: string }>).map((opt) => {
                const active = metadata.paperWidthMm === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => onChangeMetadata({ paperWidthMm: opt.value })}
                    className={`rounded-lg border p-3 text-left transition-colors ${
                      active
                        ? 'border-sky-800 bg-sky-50 text-sky-950'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className="block text-sm font-semibold">{opt.label}</span>
                    <span className="block font-mono text-xs tabular-nums text-slate-500 mt-0.5">
                      {opt.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <span className="block text-xs font-semibold text-slate-700 mb-2">
              Jumlah Foto per Halaman F4
            </span>
            <div className="grid grid-cols-3 gap-2">
              {([
                { value: 2, label: '2 Foto', desc: '1×2 Besar' },
                { value: 4, label: '4 Foto', desc: '2×2 Standar' },
                { value: 6, label: '6 Foto', desc: '2×3 Padat' },
              ] as Array<{ value: PhotosPerPage; label: string; desc: string }>).map((opt) => {
                const active = metadata.photosPerPage === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => onChangeMetadata({ photosPerPage: opt.value })}
                    className={`rounded-lg border p-3 text-left transition-colors ${
                      active
                        ? 'border-sky-800 bg-sky-50 text-sky-950'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className="block text-sm font-semibold">{opt.label}</span>
                    <span className="block text-xs text-slate-500 mt-0.5">{opt.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="space-y-3 border-t border-slate-100 pt-4">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={metadata.includeCoverPage}
              onChange={(e) => onChangeMetadata({ includeCoverPage: e.target.checked })}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-sky-900 focus:ring-sky-700"
            />
            <span>
              <span className="block text-sm font-medium text-slate-900">
                Sertakan Halaman Sampul &amp; Tabel Rekapitulasi Tahunan
              </span>
              <span className="block text-xs text-slate-500">
                Menampilkan ringkasan jumlah bukti dukung Januari–Desember serta kolom tanda tangan pada halaman pertama PDF.
              </span>
            </span>
          </label>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={metadata.includeEmptyMonths}
              onChange={(e) => onChangeMetadata({ includeEmptyMonths: e.target.checked })}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-sky-900 focus:ring-sky-700"
            />
            <span>
              <span className="block text-sm font-medium text-slate-900">
                Sertakan Halaman Penanda untuk Bulan Kosong
              </span>
              <span className="block text-xs text-slate-500">
                Jika diaktifkan, bulan yang belum memiliki foto tetap dibuatkan satu halaman keterangan di dalam PDF.
              </span>
            </span>
          </label>
        </div>
      </section>

      {/* Section 3: Data Management */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-base font-semibold text-slate-900">
            Pengelolaan Data Lokal
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Saat ini tersimpan <span className="font-mono tabular-nums font-semibold">{totalPhotos}</span> foto bukti dukung di penyimpanan peramban.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={onLoadSampleData}
            className="rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors"
          >
            Muat Contoh 12 Bulan
          </button>

          {confirmReset ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  onResetAllData();
                  setConfirmReset(false);
                }}
                className="rounded-lg bg-rose-700 px-3.5 py-2 text-xs font-medium text-white hover:bg-rose-800 transition-colors"
              >
                Ya, Hapus Semua
              </button>
              <button
                type="button"
                onClick={() => setConfirmReset(false)}
                className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
              >
                Batal
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmReset(true)}
              className="rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-medium text-rose-700 hover:bg-rose-100 transition-colors"
            >
              Reset Semua Data
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
