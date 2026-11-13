export interface MonthDefinition {
  index: number; // 1 to 12
  name: string;
  shortName: string;
}

export const MONTHS: MonthDefinition[] = [
  { index: 1, name: 'Januari', shortName: 'Jan' },
  { index: 2, name: 'Februari', shortName: 'Feb' },
  { index: 3, name: 'Maret', shortName: 'Mar' },
  { index: 4, name: 'April', shortName: 'Apr' },
  { index: 5, name: 'Mei', shortName: 'Mei' },
  { index: 6, name: 'Juni', shortName: 'Jun' },
  { index: 7, name: 'Juli', shortName: 'Jul' },
  { index: 8, name: 'Agustus', shortName: 'Agu' },
  { index: 9, name: 'September', shortName: 'Sep' },
  { index: 10, name: 'Oktober', shortName: 'Okt' },
  { index: 11, name: 'November', shortName: 'Nov' },
  { index: 12, name: 'Desember', shortName: 'Des' },
];

export interface EvidenceItem {
  id: string;
  month: number; // 1..12
  title: string; // Nama Bukti Dukung
  description?: string; // Uraian singkat (opsional)
  date?: string; // Tanggal kegiatan (opsional)
  imageDataUrl: string;
  imageWidth: number;
  imageHeight: number;
  order: number;
  createdAt: number;
}

export type PhotosPerPage = 2 | 4 | 6;
export type PaperWidthMm = 215 | 210;

export interface ReportMetadata {
  year: number;
  reportTitle: string;
  employeeName: string;
  nip: string;
  position: string;
  unit: string;
  supervisorName: string;
  supervisorNip: string;
  city: string;
  includeCoverPage: boolean;
  includeEmptyMonths: boolean;
  photosPerPage: PhotosPerPage;
  paperWidthMm: PaperWidthMm;
}

export interface ReportState {
  metadata: ReportMetadata;
  items: EvidenceItem[];
}

export const DEFAULT_METADATA: ReportMetadata = {
  year: new Date().getFullYear(),
  reportTitle: 'Laporan Foto Bukti Dukung E-Kinerja Tahunan',
  employeeName: '',
  nip: '',
  position: '',
  unit: '',
  supervisorName: '',
  supervisorNip: '',
  city: '',
  includeCoverPage: true,
  includeEmptyMonths: false,
  photosPerPage: 4,
  paperWidthMm: 215,
};
