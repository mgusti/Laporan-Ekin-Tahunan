import { jsPDF } from 'jspdf';
import {
  ALL_INDICATORS,
  EvidenceItem,
  formatIndicatorLabel,
  MONTHS,
  ReportMetadata,
} from '../types/ekinerja';
import {
  buildAnnualPages,
  F4Page,
  getEndOfDecemberDateLabel,
  getReportTitleForFilter,
} from './pdfLayout';

const F4_HEIGHT_MM = 330;
const MARGIN_X = 16;
const MARGIN_TOP = 16;
const MARGIN_BOTTOM = 14;

function drawHeader(
  doc: jsPDF,
  metadata: ReportMetadata,
  pageWidth: number,
  subtitleLine: string,
  actionPlan?: string
) {
  const contentWidth = pageWidth - MARGIN_X * 2;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11.5);
  doc.setTextColor(15, 23, 42);
  doc.text(
    metadata.reportTitle || `Laporan Foto Bukti Dukung E-Kinerja Tahun ${metadata.year}`,
    MARGIN_X,
    MARGIN_TOP + 2
  );

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  const identityParts: string[] = [];
  if (metadata.employeeName.trim()) identityParts.push(metadata.employeeName.trim());
  if (metadata.nip.trim()) identityParts.push(`NIP. ${metadata.nip.trim()}`);
  if (metadata.unit.trim()) identityParts.push(metadata.unit.trim());

  const headerLine = identityParts.join(' | ');
  const wrappedIdentity = doc.splitTextToSize(headerLine, contentWidth);
  doc.text(wrappedIdentity[0] ?? '', MARGIN_X, MARGIN_TOP + 7);

  // Subtle rule
  doc.setDrawColor(15, 76, 129);
  doc.setLineWidth(0.6);
  doc.line(MARGIN_X, MARGIN_TOP + 10.5, pageWidth - MARGIN_X, MARGIN_TOP + 10.5);

  // Section subtitle (Indikator or Bulan · Indikator)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 76, 129);
  const fullSubtitle =
    doc.splitTextToSize(subtitleLine, contentWidth)[0] ?? subtitleLine;
  doc.text(fullSubtitle, MARGIN_X, MARGIN_TOP + 16);

  // Rencana Aksi right below Indikator
  if (actionPlan?.trim()) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.8);
    doc.setTextColor(51, 65, 85);
    const actionLine =
      doc.splitTextToSize(`Rencana Aksi: ${actionPlan.trim()}`, contentWidth)[0] ?? '';
    doc.text(actionLine, MARGIN_X, MARGIN_TOP + 21);
  }
}

function drawFooter(
  doc: jsPDF,
  metadata: ReportMetadata,
  pageWidth: number,
  pageNumber: number,
  totalPages: number
) {
  const footerY = F4_HEIGHT_MM - MARGIN_BOTTOM + 4;
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.line(MARGIN_X, footerY - 5, pageWidth - MARGIN_X, footerY - 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(
    `Laporan E-Kinerja Tahun ${metadata.year} · Kertas F4 (${metadata.paperWidthMm} × 330 mm)`,
    MARGIN_X,
    footerY
  );
  doc.text(`Halaman ${pageNumber} dari ${totalPages}`, pageWidth - MARGIN_X, footerY, {
    align: 'right',
  });
}

function drawCoverPage(
  doc: jsPDF,
  metadata: ReportMetadata,
  page: Extract<F4Page, { type: 'cover' }>
) {
  const pageWidth = metadata.paperWidthMm;
  const contentWidth = pageWidth - MARGIN_X * 2;
  let y = MARGIN_TOP + 8;

  // Institutional top bar
  doc.setFillColor(15, 76, 129);
  doc.rect(MARGIN_X, y, contentWidth, 2.2, 'F');
  y += 12;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 76, 129);
  doc.text('DOKUMEN ARSIP BUKTI DUKUNG KINERJA PEGAWAI', MARGIN_X, y);
  y += 8;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(15, 23, 42);
  const titleLines = doc.splitTextToSize(
    metadata.reportTitle || 'Laporan Foto Bukti Dukung E-Kinerja Tahunan',
    contentWidth
  );
  doc.text(titleLines, MARGIN_X, y);
  y += titleLines.length * 7.5 + 2;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(51, 65, 85);
  doc.text(`Periode Pelaporan: Januari – Desember ${metadata.year}`, MARGIN_X, y);
  y += 10;

  // Identity block box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.35);
  doc.rect(MARGIN_X, y, contentWidth, 43.5, 'FD');

  const metaRows: Array<[string, string]> = [
    ['Nama Pegawai', metadata.employeeName.trim() || '—'],
    ['NIP / Identitas', metadata.nip.trim() || '—'],
    ['Jabatan', metadata.position.trim() || '—'],
    ['Unit Kerja / Instansi', metadata.unit.trim() || '—'],
    [
      'Indikator Kinerja',
      metadata.selectedIndicator === ALL_INDICATORS
        ? `Semua Indikator (${metadata.indicators.length} Indikator)`
        : metadata.selectedIndicator.trim() || '—',
    ],
  ];

  let rowY = y + 7.5;
  metaRows.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.text(label, MARGIN_X + 5, rowY);
    doc.text(':', MARGIN_X + 46, rowY);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    const valClip = doc.splitTextToSize(value, contentWidth - 56)[0] ?? '—';
    doc.text(valClip, MARGIN_X + 50, rowY);
    rowY += 7.5;
  });

  y += 52;

  // Summary Table Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`Rekapitulasi Bukti Dukung Bulanan (${page.totalPhotos} Foto)`, MARGIN_X, y);
  y += 5;

  // Table header bar
  const col1W = 16;
  const col2W = 72;
  const col3W = 48;
  const col4W = contentWidth - col1W - col2W - col3W;
  const rowH = 9.2;

  doc.setFillColor(15, 76, 129);
  doc.rect(MARGIN_X, y, contentWidth, rowH, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(255, 255, 255);
  doc.text('No.', MARGIN_X + 4, y + 6);
  doc.text('Bulan Pelaporan', MARGIN_X + col1W + 3, y + 6);
  doc.text('Jumlah Bukti Foto', MARGIN_X + col1W + col2W + col3W - 4, y + 6, { align: 'right' });
  doc.text('Halaman Dokumen', MARGIN_X + contentWidth - 4, y + 6, { align: 'right' });
  y += rowH;

  page.summaryRows.forEach((row, idx) => {
    if (idx % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(MARGIN_X, y, contentWidth, rowH, 'F');
    }
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.25);
    doc.line(MARGIN_X, y + rowH, MARGIN_X + contentWidth, y + rowH);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.text(String(idx + 1).padStart(2, '0'), MARGIN_X + 4, y + 6);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`${row.month.name} ${metadata.year}`, MARGIN_X + col1W + 3, y + 6);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(row.count > 0 ? 15 : 148, row.count > 0 ? 23 : 163, row.count > 0 ? 42 : 184);
    doc.text(
      row.count > 0 ? `${row.count} Foto` : 'Belum ada foto',
      MARGIN_X + col1W + col2W + col3W - 4,
      y + 6,
      { align: 'right' }
    );

    doc.text(row.pageRangeLabel, MARGIN_X + contentWidth - 4, y + 6, { align: 'right' });
    y += rowH;
  });

  // Table outer border
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.35);
  doc.rect(MARGIN_X, y - rowH * 13, contentWidth, rowH * 13);

  // Signature block at bottom of cover page
  const sigY = Math.max(y + 16, F4_HEIGHT_MM - MARGIN_BOTTOM - 54);
  const leftSigX = MARGIN_X + 4;
  const rightSigX = MARGIN_X + contentWidth / 2 + 10;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);

  if (metadata.supervisorName.trim()) {
    doc.text('Mengetahui,', leftSigX, sigY);
    doc.text('Pejabat Penilai Kinerja,', leftSigX, sigY + 5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(metadata.supervisorName.trim(), leftSigX, sigY + 28);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    if (metadata.supervisorNip.trim()) {
      doc.text(`NIP. ${metadata.supervisorNip.trim()}`, leftSigX, sigY + 33);
    }
  }

  const cityPrefix = metadata.city.trim() ? `${metadata.city.trim()}, ` : '';
  doc.setTextColor(51, 65, 85);
  doc.text(`${cityPrefix}${getEndOfDecemberDateLabel(metadata.year)}`, rightSigX, sigY);
  doc.text('Pegawai Yang Melaporkan,', rightSigX, sigY + 5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(metadata.employeeName.trim() || '( ........................................ )', rightSigX, sigY + 28);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  if (metadata.nip.trim()) {
    doc.text(`NIP. ${metadata.nip.trim()}`, rightSigX, sigY + 33);
  }

  drawFooter(doc, metadata, pageWidth, page.pageNumber, page.totalPages);
}

function drawPhotoCard(
  doc: jsPDF,
  item: EvidenceItem,
  indexNumber: number,
  x: number,
  y: number,
  w: number,
  h: number
) {
  // Card border
  doc.setDrawColor(203, 213, 225);
  doc.setFillColor(248, 250, 252);
  doc.setLineWidth(0.35);
  doc.rect(x, y, w, h, 'FD');

  const imgPad = 2.5;
  const imgBoxX = x + imgPad;
  const imgBoxY = y + imgPad;
  const imgBoxW = w - imgPad * 2;
  const imgBoxH = h - imgPad * 2;

  // Fit image inside imgBox preserving aspect ratio
  const imgRatio = item.imageWidth / Math.max(1, item.imageHeight);
  const boxRatio = imgBoxW / Math.max(1, imgBoxH);

  let drawW = imgBoxW;
  let drawH = imgBoxH;
  if (imgRatio > boxRatio) {
    drawW = imgBoxW;
    drawH = imgBoxW / imgRatio;
  } else {
    drawH = imgBoxH;
    drawW = imgBoxH * imgRatio;
  }

  const drawX = imgBoxX + (imgBoxW - drawW) / 2;
  const drawY = imgBoxY + (imgBoxH - drawH) / 2;

  try {
    doc.addImage(item.imageDataUrl, 'JPEG', drawX, drawY, drawW, drawH, undefined, 'MEDIUM');
  } catch {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text('Gambar tidak dapat dirender', imgBoxX + imgBoxW / 2, imgBoxY + imgBoxH / 2, {
      align: 'center',
    });
  }

  // Top-left number badge on each photo
  const label = String(indexNumber);
  const badgeH = 7;
  const badgeW = Math.max(7, 4.6 + label.length * 2.2);
  const badgeX = x + 3;
  const badgeY = y + 3;
  const radius = 1.8;

  // Subtle shadow behind badge
  doc.setFillColor(15, 23, 42);
  doc.roundedRect(badgeX + 0.25, badgeY + 0.3, badgeW, badgeH, radius, radius, 'F');

  // Deep navy rounded badge with white border ring
  doc.setFillColor(15, 76, 129);
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(0.5);
  doc.roundedRect(badgeX, badgeY, badgeW, badgeH, radius, radius, 'FD');

  // Centered white number
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.2);
  doc.setTextColor(255, 255, 255);
  doc.text(label, badgeX + badgeW / 2, badgeY + badgeH / 2 + 1.1, {
    align: 'center',
  });
}

function drawMonthPhotosPage(
  doc: jsPDF,
  metadata: ReportMetadata,
  page: Extract<F4Page, { type: 'month-photos' }>,
  isSingleMonthFilter: boolean
) {
  const pageWidth = metadata.paperWidthMm;
  const contentWidth = pageWidth - MARGIN_X * 2;
  const monthSuffix =
    page.monthTotalPages > 1 ? ` (Bagian ${page.monthPageIndex} dari ${page.monthTotalPages})` : '';
  const indicatorText = `Indikator: ${page.indicator.trim() || '—'}`;
  const subtitleLine = isSingleMonthFilter
    ? `${indicatorText}${monthSuffix}`
    : `Bulan: ${page.month.name}${monthSuffix} · ${indicatorText}`;

  drawHeader(
    doc,
    metadata,
    pageWidth,
    subtitleLine,
    page.actionPlan
  );

  const gridTop = page.actionPlan?.trim() ? MARGIN_TOP + 25.5 : MARGIN_TOP + 22;
  const gridBottom = F4_HEIGHT_MM - MARGIN_BOTTOM - 8;
  const gridHeight = gridBottom - gridTop;

  let cols = 2;
  let rows = 2;
  if (metadata.photosPerPage === 2) {
    cols = 1;
    rows = 2;
  } else if (metadata.photosPerPage === 6) {
    cols = 2;
    rows = 3;
  }

  const gapX = 6;
  const gapY = 6;
  const cardW = (contentWidth - gapX * (cols - 1)) / cols;
  const cardH = (gridHeight - gapY * (rows - 1)) / rows;

  page.items.forEach((item, idx) => {
    const col = idx % cols;
    const row = Math.floor(idx / cols);
    const x = MARGIN_X + col * (cardW + gapX);
    const y = gridTop + row * (cardH + gapY);
    drawPhotoCard(doc, item, page.startItemNumber + idx, x, y, cardW, cardH);
  });

  drawFooter(doc, metadata, pageWidth, page.pageNumber, page.totalPages);
}

function drawEmptyMonthPage(
  doc: jsPDF,
  metadata: ReportMetadata,
  page: Extract<F4Page, { type: 'month-empty' }>,
  isSingleMonthFilter: boolean
) {
  const pageWidth = metadata.paperWidthMm;
  const contentWidth = pageWidth - MARGIN_X * 2;
  const indicatorText = `Indikator: ${page.indicator.trim() || '—'}`;
  const subtitleLine = isSingleMonthFilter
    ? indicatorText
    : `Bulan: ${page.month.name} · ${indicatorText}`;
  drawHeader(doc, metadata, pageWidth, subtitleLine);

  const boxY = MARGIN_TOP + 34;
  doc.setDrawColor(203, 213, 225);
  doc.setFillColor(248, 250, 252);
  doc.rect(MARGIN_X, boxY, contentWidth, 64, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(71, 85, 105);
  doc.text(`Tidak Ada Dokumentasi Foto pada Bulan ${page.month.name} ${metadata.year}`, pageWidth / 2, boxY + 28, {
    align: 'center',
  });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184);
  doc.text('Belum terdapat bukti dukung foto yang dilampirkan untuk periode bulan ini.', pageWidth / 2, boxY + 36, {
    align: 'center',
  });

  drawFooter(doc, metadata, pageWidth, page.pageNumber, page.totalPages);
}

export async function generateAndDownloadAnnualPdf(
  metadata: ReportMetadata,
  items: EvidenceItem[],
  onProgress?: (current: number, total: number) => void,
  filterTarget: string = 'all'
): Promise<{ fileName: string; totalPages: number }> {
  const allPages = buildAnnualPages(metadata, items);
  let pages = allPages;
  let selectedMonthIndex: number | null = null;

  if (filterTarget === 'cover') {
    pages = allPages.filter((p) => p.type === 'cover');
  } else if (filterTarget !== 'all') {
    const monthNum = parseInt(filterTarget, 10);
    if (!Number.isNaN(monthNum) && monthNum >= 1 && monthNum <= 12) {
      selectedMonthIndex = monthNum;
      pages = allPages.filter((p) => p.type !== 'cover' && p.month.index === monthNum);
    }
  }

  if (pages.length === 0) {
    throw new Error('Tidak ada halaman untuk diekspor. Tambahkan minimal satu foto bukti dukung atau aktifkan halaman sampul.');
  }

  const isSingleMonthFilter = selectedMonthIndex !== null;
  const effectiveMetadata: ReportMetadata = {
    ...metadata,
    reportTitle: getReportTitleForFilter(
      metadata.reportTitle,
      metadata.year,
      selectedMonthIndex
    ),
  };

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [effectiveMetadata.paperWidthMm, F4_HEIGHT_MM],
    compress: true,
  });

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    if (i > 0) {
      doc.addPage([effectiveMetadata.paperWidthMm, F4_HEIGHT_MM], 'portrait');
    }

    if (page.type === 'cover') {
      drawCoverPage(doc, effectiveMetadata, page);
    } else if (page.type === 'month-photos') {
      drawMonthPhotosPage(doc, effectiveMetadata, page, isSingleMonthFilter);
    } else {
      drawEmptyMonthPage(doc, effectiveMetadata, page, isSingleMonthFilter);
    }

    onProgress?.(i + 1, pages.length);
    // Yield to browser event loop between pages for smooth UI progress
    await new Promise((r) => setTimeout(r, 8));
  }

  const cleanName = effectiveMetadata.employeeName
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  const cleanIndicator = formatIndicatorLabel(effectiveMetadata.selectedIndicator)
    .trim()
    .slice(0, 40)
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  const monthLabel = selectedMonthIndex
    ? `Bulan_${MONTHS.find((m) => m.index === selectedMonthIndex)?.name ?? selectedMonthIndex}`
    : '';
  const suffixParts = [monthLabel, cleanName, cleanIndicator].filter(Boolean);
  const fileName =
    suffixParts.length > 0
      ? `Laporan_EKinerja_F4_${effectiveMetadata.year}_${suffixParts.join('_')}.pdf`
      : `Laporan_EKinerja_F4_${effectiveMetadata.year}.pdf`;

  doc.save(fileName);
  return { fileName, totalPages: pages.length };
}
