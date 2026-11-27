import {
  ALL_INDICATORS,
  DEFAULT_INDICATOR,
  EvidenceItem,
  MONTHS,
  MonthDefinition,
  ReportMetadata,
} from '../types/ekinerja';

export function filterItemsByIndicator(
  items: EvidenceItem[],
  selectedIndicator: string,
  year?: number
): EvidenceItem[] {
  const target = (selectedIndicator ?? '').trim() || DEFAULT_INDICATOR;
  return items.filter((item) => {
    if (year !== undefined && (Number(item.year) || 2026) !== year) {
      return false;
    }
    if (target === ALL_INDICATORS) {
      return true;
    }
    return ((item.indicator ?? '').trim() || DEFAULT_INDICATOR) === target;
  });
}

export function getReportTitleForFilter(
  baseTitle: string,
  year: number,
  monthIndex?: number | null
): string {
  const cleanBase = baseTitle.trim();
  const isDefaultTitle =
    !cleanBase || /^laporan foto bukti dukung e-kinerja/i.test(cleanBase);

  if (monthIndex) {
    const monthObj = MONTHS.find((m) => m.index === monthIndex);
    if (monthObj) {
      if (isDefaultTitle) {
        return `Laporan Foto Bukti Dukung E-Kinerja Bulan ${monthObj.name} ${year}`;
      }
      if (/tahunan/i.test(cleanBase)) {
        return `${cleanBase.replace(/tahunan/i, `Bulan ${monthObj.name}`)} ${year}`;
      }
      return `${cleanBase} Bulan ${monthObj.name} ${year}`;
    }
  }

  if (isDefaultTitle) {
    return `Laporan Foto Bukti Dukung E-Kinerja Tahun ${year}`;
  }
  if (/tahunan/i.test(cleanBase)) {
    return cleanBase.replace(/tahunan/i, `Tahun ${year}`);
  }
  return `${cleanBase} Tahun ${year}`;
}

export interface CoverSummaryRow {
  month: MonthDefinition;
  count: number;
  pageRangeLabel: string;
}

export type F4Page =
  | {
      type: 'cover';
      pageNumber: number;
      totalPages: number;
      summaryRows: CoverSummaryRow[];
      totalPhotos: number;
    }
  | {
      type: 'month-photos';
      pageNumber: number;
      totalPages: number;
      month: MonthDefinition;
      monthPageIndex: number;
      monthTotalPages: number;
      startItemNumber: number;
      items: EvidenceItem[];
    }
  | {
      type: 'month-empty';
      pageNumber: number;
      totalPages: number;
      month: MonthDefinition;
    };

export function groupItemsByMonth(items: EvidenceItem[]): Map<number, EvidenceItem[]> {
  const map = new Map<number, EvidenceItem[]>();
  for (const m of MONTHS) {
    map.set(m.index, []);
  }
  for (const item of items) {
    const arr = map.get(item.month);
    if (arr) {
      arr.push(item);
    }
  }
  for (const [key, arr] of map.entries()) {
    arr.sort((a, b) => a.order - b.order || a.createdAt - b.createdAt);
    map.set(key, arr);
  }
  return map;
}

type RawMonthPage =
  | Omit<Extract<F4Page, { type: 'month-photos' }>, 'pageNumber' | 'totalPages'>
  | Omit<Extract<F4Page, { type: 'month-empty' }>, 'pageNumber' | 'totalPages'>;

export function buildAnnualPages(metadata: ReportMetadata, items: EvidenceItem[]): F4Page[] {
  const isAllIndicators = metadata.selectedIndicator === ALL_INDICATORS;
  const filteredItems = filterItemsByIndicator(items, metadata.selectedIndicator, metadata.year);
  const grouped = groupItemsByMonth(filteredItems);
  const rawPages: RawMonthPage[] = [];
  const monthPageRanges = new Map<number, { start: number; end: number }>();

  let currentPageCursor = metadata.includeCoverPage ? 2 : 1;

  for (const month of MONTHS) {
    const monthItems = grouped.get(month.index) ?? [];
    if (monthItems.length === 0) {
      if (metadata.includeEmptyMonths) {
        monthPageRanges.set(month.index, { start: currentPageCursor, end: currentPageCursor });
        rawPages.push({
          type: 'month-empty',
          month,
        });
        currentPageCursor += 1;
      }
      continue;
    }

    const perPage = metadata.photosPerPage;
    const startPage = currentPageCursor;

    // Order items by indicator sequence when printing all indicators so related photos stay adjacent while sharing pages
    let orderedMonthItems = monthItems;
    if (isAllIndicators) {
      const indicatorOrder = [...metadata.indicators];
      for (const item of monthItems) {
        const ind = (item.indicator ?? '').trim() || DEFAULT_INDICATOR;
        if (!indicatorOrder.includes(ind)) {
          indicatorOrder.push(ind);
        }
      }
      orderedMonthItems = [...monthItems].sort((a, b) => {
        const indA = (a.indicator ?? '').trim() || DEFAULT_INDICATOR;
        const indB = (b.indicator ?? '').trim() || DEFAULT_INDICATOR;
        const idxA = indicatorOrder.indexOf(indA);
        const idxB = indicatorOrder.indexOf(indB);
        if (idxA !== idxB) return idxA - idxB;
        return a.order - b.order || a.createdAt - b.createdAt;
      });
    }

    const monthTotalPages = Math.ceil(orderedMonthItems.length / perPage);

    for (let i = 0; i < monthTotalPages; i++) {
      const slice = orderedMonthItems.slice(i * perPage, (i + 1) * perPage);
      rawPages.push({
        type: 'month-photos',
        month,
        monthPageIndex: i + 1,
        monthTotalPages,
        startItemNumber: i * perPage + 1,
        items: slice,
      });
      currentPageCursor += 1;
    }

    monthPageRanges.set(month.index, { start: startPage, end: currentPageCursor - 1 });
  }

  const finalPages: F4Page[] = [];
  const totalPages = (metadata.includeCoverPage ? 1 : 0) + rawPages.length;

  if (metadata.includeCoverPage) {
    const summaryRows: CoverSummaryRow[] = MONTHS.map((month) => {
      const count = (grouped.get(month.index) ?? []).length;
      const range = monthPageRanges.get(month.index);
      let pageRangeLabel = '—';
      if (range) {
        pageRangeLabel = range.start === range.end ? `Hal. ${range.start}` : `Hal. ${range.start}–${range.end}`;
      }
      return { month, count, pageRangeLabel };
    });

    finalPages.push({
      type: 'cover',
      pageNumber: 1,
      totalPages: Math.max(1, totalPages),
      summaryRows,
      totalPhotos: filteredItems.length,
    });
  }

  rawPages.forEach((page, idx) => {
    const pageNumber = (metadata.includeCoverPage ? 2 : 1) + idx;
    finalPages.push({
      ...page,
      pageNumber,
      totalPages: Math.max(1, totalPages),
    } as F4Page);
  });

  return finalPages;
}

export function formatIndonesianDate(dateStr?: string): string {
  if (!dateStr) return '';
  const parsed = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return dateStr;
  const monthName = MONTHS[parsed.getMonth()]?.name ?? '';
  return `${parsed.getDate()} ${monthName} ${parsed.getFullYear()}`;
}

export function getEndOfDecemberDateLabel(year: number): string {
  return `31 Desember ${year}`;
}
