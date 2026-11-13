import { DEFAULT_METADATA, EvidenceItem, ReportMetadata, ReportState } from '../types/ekinerja';

const DB_NAME = 'ekinerja_f4_annual_db';
const DB_VERSION = 1;
const STORE_NAME = 'report_store';
const STATE_KEY = 'current_report';

// Tracks image signatures already stored in MySQL so subsequent metadata edits don't re-upload base64 images
const syncedImageSignatures = new Map<string, string>();

function getImageSignature(dataUrl: string): string {
  return `${dataUrl.length}:${dataUrl.slice(0, 32)}:${dataUrl.slice(-32)}`;
}

function openLegacyIndexedDb(): Promise<IDBDatabase> {
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

async function loadLegacyIndexedDbState(): Promise<ReportState | null> {
  try {
    const db = await openLegacyIndexedDb();
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
          resolve(null);
        }
      };
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

export async function loadReportState(): Promise<ReportState> {
  try {
    const res = await fetch('/api/report', { method: 'GET' });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    const data = (await res.json()) as {
      metadata: ReportMetadata | null;
      items: EvidenceItem[];
    };

    const items = Array.isArray(data.items) ? data.items : [];
    const metadata = data.metadata
      ? { ...DEFAULT_METADATA, ...data.metadata }
      : { ...DEFAULT_METADATA };

    // If MySQL has no evidence items yet, check if browser IndexedDB has existing items to migrate
    if (items.length === 0) {
      const legacy = await loadLegacyIndexedDbState();
      if (legacy && legacy.items.length > 0) {
        const migratedState: ReportState = {
          metadata: {
            ...metadata,
            ...legacy.metadata,
            employeeName: legacy.metadata.employeeName || metadata.employeeName,
            nip: legacy.metadata.nip || metadata.nip,
            position: legacy.metadata.position || metadata.position,
            unit: legacy.metadata.unit || metadata.unit,
            city: legacy.metadata.city || metadata.city,
          },
          items: legacy.items,
        };
        await saveReportState(migratedState);
        return migratedState;
      }
    }

    syncedImageSignatures.clear();
    for (const item of items) {
      syncedImageSignatures.set(item.id, getImageSignature(item.imageDataUrl));
    }

    return { metadata, items };
  } catch (err) {
    console.error('Gagal memuat dari database MySQL, beralih ke cadangan lokal:', err);
    const legacy = await loadLegacyIndexedDbState();
    return legacy ?? { metadata: { ...DEFAULT_METADATA }, items: [] };
  }
}

export async function saveReportState(state: ReportState): Promise<void> {
  const payloadItems = state.items.map((item) => {
    const sig = getImageSignature(item.imageDataUrl);
    const isAlreadySynced = syncedImageSignatures.get(item.id) === sig;
    return {
      ...item,
      imageDataUrl: isAlreadySynced ? '__KEEP__' : item.imageDataUrl,
    };
  });

  const res = await fetch('/api/report', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      metadata: state.metadata,
      items: payloadItems,
    }),
  });

  if (!res.ok) {
    throw new Error(`Gagal menyimpan ke database MySQL (HTTP ${res.status})`);
  }

  const nextMap = new Map<string, string>();
  for (const item of state.items) {
    nextMap.set(item.id, getImageSignature(item.imageDataUrl));
  }
  syncedImageSignatures.clear();
  for (const [k, v] of nextMap) {
    syncedImageSignatures.set(k, v);
  }
}

export async function clearReportState(): Promise<void> {
  syncedImageSignatures.clear();
  await fetch('/api/report', { method: 'DELETE' });
  try {
    const db = await openLegacyIndexedDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(STATE_KEY);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {
    // Ignore legacy IndexedDB cleanup errors
  }
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

export function getEmployeeIdentityMetadata(year: number): Partial<ReportMetadata> {
  return {
    year,
    reportTitle: 'Laporan Foto Bukti Dukung E-Kinerja Tahunan',
    employeeName: 'Muhammad Gusti Kurniawan, S.Kom',
    nip: '199308262025211037',
    position: 'Penata Layanan Operasional',
    unit: 'RSUD H. Abdul Manap Kota Jambi',
    supervisorName: '',
    supervisorNip: '',
    city: 'Jambi',
  };
}
