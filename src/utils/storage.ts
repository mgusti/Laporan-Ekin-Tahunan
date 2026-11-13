import { DEFAULT_METADATA, EvidenceItem, MONTHS, ReportState } from '../types/ekinerja';

const DB_NAME = 'ekinerja_f4_annual_db';
const DB_VERSION = 1;
const STORE_NAME = 'report_store';
const STATE_KEY = 'current_report';

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function loadReportState(): Promise<ReportState> {
  try {
    const db = await openDatabase();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(STATE_KEY);
      req.onsuccess = () => {
        const result = req.result as ReportState | undefined;
        if (result && result.metadata && Array.isArray(result.items)) {
          resolve({
            metadata: { ...DEFAULT_METADATA, ...result.metadata },
            items: result.items,
          });
        } else {
          resolve({ metadata: { ...DEFAULT_METADATA }, items: [] });
        }
      };
      req.onerror = () => reject(req.error);
    });
  } catch {
    return { metadata: { ...DEFAULT_METADATA }, items: [] };
  }
}

export async function saveReportState(state: ReportState): Promise<void> {
  const db = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.put(state, STATE_KEY);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function clearReportState(): Promise<void> {
  const db = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.delete(STATE_KEY);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export function cleanFileNameToTitle(fileName: string): string {
  const withoutExt = fileName.replace(/\.[^/.]+$/, '');
  const spaced = withoutExt.replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
  if (!spaced) return 'Bukti Dukung Kegiatan';
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

export async function processImageFile(
  file: File,
  maxDimension = 1600,
  quality = 0.86
): Promise<{ dataUrl: string; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Gagal membaca berkas gambar.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Format gambar tidak dapat dimuat.'));
      img.onload = () => {
        let { naturalWidth: width, naturalHeight: height } = img;
        if (width === 0 || height === 0) {
          reject(new Error('Dimensi gambar tidak valid.'));
          return;
        }

        if (width > maxDimension || height > maxDimension) {
          const ratio = Math.min(maxDimension / width, maxDimension / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Gagal memproses kanvas gambar.'));
          return;
        }

        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve({ dataUrl, width, height });
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

function generateSamplePhotoCanvas(
  monthName: string,
  year: number,
  title: string,
  accentHex: string,
  indexLabel: string
): { dataUrl: string; width: number; height: number } {
  const width = 960;
  const height = 640;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // Clean architectural documentary illustration card
  ctx.fillStyle = '#F1F5F9';
  ctx.fillRect(0, 0, width, height);

  // Subtle grid background
  ctx.strokeStyle = '#E2E8F0';
  ctx.lineWidth = 1;
  for (let x = 40; x < width; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 40; y < height; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  // Document card frame inside canvas
  ctx.fillStyle = '#FFFFFF';
  ctx.strokeStyle = '#CBD5E1';
  ctx.lineWidth = 2;
  ctx.fillRect(64, 56, width - 128, height - 112);
  ctx.strokeRect(64, 56, width - 128, height - 112);

  // Top accent bar
  ctx.fillStyle = accentHex;
  ctx.fillRect(64, 56, width - 128, 12);

  // Header text
  ctx.fillStyle = '#0F172A';
  ctx.font = 'bold 24px sans-serif';
  ctx.fillText(`DOKUMENTASI KEGIATAN · ${monthName.toUpperCase()} ${year}`, 104, 122);

  ctx.fillStyle = '#475569';
  ctx.font = '600 18px sans-serif';
  ctx.fillText(`Kode Arsip: ${indexLabel}`, 104, 154);

  // Simulated meeting / activity visual blocks
  ctx.fillStyle = '#F8FAFC';
  ctx.strokeStyle = '#E2E8F0';
  ctx.fillRect(104, 188, 460, 260);
  ctx.strokeRect(104, 188, 460, 260);

  // Bar chart motif inside visual
  const bars = [120, 175, 145, 200, 165, 210];
  bars.forEach((bh, idx) => {
    ctx.fillStyle = idx % 2 === 0 ? accentHex : '#64748B';
    ctx.fillRect(140 + idx * 66, 420 - bh, 40, bh);
  });

  // Side checklist lines
  ctx.fillStyle = '#0F172A';
  ctx.font = 'bold 18px sans-serif';
  ctx.fillText('Ringkasan Pelaksanaan', 596, 216);

  for (let i = 0; i < 4; i++) {
    const y = 250 + i * 50;
    ctx.fillStyle = accentHex;
    ctx.fillRect(596, y, 16, 16);
    ctx.fillStyle = '#CBD5E1';
    ctx.fillRect(628, y + 2, 224, 12);
    ctx.fillStyle = '#E2E8F0';
    ctx.fillRect(628, y + 20, 176, 8);
  }

  // Footer caption inside photo
  ctx.fillStyle = '#0F172A';
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText(title.slice(0, 62), 104, 496);

  ctx.fillStyle = '#64748B';
  ctx.font = '15px sans-serif';
  ctx.fillText('Contoh foto bukti dukung E-Kinerja — ganti dengan foto kegiatan asli Anda.', 104, 526);

  return {
    dataUrl: canvas.toDataURL('image/jpeg', 0.85),
    width,
    height,
  };
}

export function createSampleAnnualReport(year: number): ReportState {
  const sampleTemplates: Array<{ month: number; titles: string[]; accent: string }> = [
    { month: 1, titles: ['Penyusunan Sasaran Kinerja Pegawai (SKP) Awal Tahun', 'Rapat Koordinasi Program Kerja Triwulan I'], accent: '#0F4C81' },
    { month: 2, titles: ['Pelayanan & Verifikasi Berkas Administrasi Masyarakat', 'Sosialisasi Standar Operasional Prosedur Unit Kerja'], accent: '#1D4ED8' },
    { month: 3, titles: ['Evaluasi Capaian Kinerja Triwulan I Tahun Berjalan', 'Pendampingan Digitalisasi Arsip Kepegawaian'], accent: '#0369A1' },
    { month: 4, titles: ['Monitoring & Rekapitulasi Laporan Bulanan Bagian Umum'], accent: '#0F766E' },
    { month: 5, titles: ['Bimbingan Teknis Peningkatan Kompetensi Aparatur', 'Rapat Persiapan Anggaran Semester II'], accent: '#047857' },
    { month: 6, titles: ['Evaluasi Kinerja Semester I & Pelaporan Capaian', 'Inventarisasi Aset dan Sarana Prasarana Kantor'], accent: '#0F4C81' },
    { month: 7, titles: ['Pelaksanaan Program Kerja Awal Semester II', 'Koordinasi Lintas Bidang Terkait Layanan Publik'], accent: '#1E40AF' },
    { month: 8, titles: ['Peringatan Hari Kemerdekaan & Kegiatan Pelayanan Terpadu'], accent: '#B45309' },
    { month: 9, titles: ['Audit Internal & Evaluasi Triwulan III', 'Pemutakhiran Data Sistem Informasi Kinerja'], accent: '#0369A1' },
    { month: 10, titles: ['Rapat Penyusunan Rencana Kerja Tahun Berikutnya'], accent: '#0F766E' },
    { month: 11, titles: ['Finalisasi Realisasi Anggaran dan Kegiatan Lapangan', 'Rekonsiliasi Data Pelaporan Kinerja Akhir Tahun'], accent: '#1D4ED8' },
    { month: 12, titles: ['Penilaian Kinerja Tahunan & Penyerahan Laporan Akhir', 'Arsip Dokumentasi E-Kinerja Satu Tahun Penuh'], accent: '#0F4C81' },
  ];

  const items: EvidenceItem[] = [];
  let counter = 1;

  for (const entry of sampleTemplates) {
    const monthDef = MONTHS.find((m) => m.index === entry.month)!;
    entry.titles.forEach((title, idx) => {
      const code = `EK-${year}-${String(entry.month).padStart(2, '0')}-${String(idx + 1).padStart(2, '0')}`;
      const rendered = generateSamplePhotoCanvas(monthDef.name, year, title, entry.accent, code);
      items.push({
        id: `sample-${entry.month}-${idx}-${Date.now()}-${counter}`,
        month: entry.month,
        title,
        date: `${year}-${String(entry.month).padStart(2, '0')}-${String(10 + idx * 8).padStart(2, '0')}`,
        description: `Dokumentasi pelaksanaan tugas bulan ${monthDef.name} ${year}.`,
        imageDataUrl: rendered.dataUrl,
        imageWidth: rendered.width,
        imageHeight: rendered.height,
        order: idx,
        createdAt: Date.now() + counter,
      });
      counter++;
    });
  }

  return {
    metadata: {
      ...DEFAULT_METADATA,
      year,
      reportTitle: 'Laporan Foto Bukti Dukung E-Kinerja Tahunan',
      employeeName: 'Drs. Budi Santoso, M.Si.',
      nip: '19840512 201001 1 014',
      position: 'Analis Kebijakan Ahli Muda',
      unit: 'Bagian Organisasi & Tata Laksana Sekretariat Daerah',
      supervisorName: 'Dra. Siti Rahmawati, M.M.',
      supervisorNip: '19760819 200212 2 005',
      city: 'Bandung',
      includeCoverPage: true,
      includeEmptyMonths: false,
      photosPerPage: 4,
      paperWidthMm: 215,
    },
    items,
  };
}
