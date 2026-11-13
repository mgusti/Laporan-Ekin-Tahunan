import { Download, Loader2 } from 'lucide-react';

export type WorkspaceTab = 'editor' | 'settings' | 'preview';

interface TopBarProps {
  activeTab: WorkspaceTab;
  onTabChange: (tab: WorkspaceTab) => void;
  onDownloadPdf: () => void;
  isExporting: boolean;
  exportProgress: { current: number; total: number } | null;
  canExport: boolean;
}

export function TopBar({
  activeTab,
  onTabChange,
  onDownloadPdf,
  isExporting,
  exportProgress,
  canExport,
}: TopBarProps) {
  const navItems: Array<{ id: WorkspaceTab; label: string }> = [
    { id: 'editor', label: 'Input Bukti Dukung' },
    { id: 'settings', label: 'Identitas & F4' },
    { id: 'preview', label: 'Pratinjau Dokumen' },
  ];

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-8 border-b border-slate-200 bg-white px-4 sm:px-6">
      <button
        type="button"
        onClick={() => onTabChange('editor')}
        className="font-display text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-700 rounded"
      >
        Arsip E-Kinerja F4
      </button>

      <nav aria-label="Navigasi utama" className="flex items-center gap-6 overflow-x-auto">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onTabChange(item.id)}
              className={`relative py-5 text-sm font-medium transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-700 ${
                isActive
                  ? 'text-sky-900 font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {item.label}
              {isActive && (
                <span className="absolute inset-x-0 bottom-0 h-0.5 bg-sky-800" />
              )}
            </button>
          );
        })}
      </nav>

      <div className="flex items-center shrink-0">
        <button
          type="button"
          onClick={onDownloadPdf}
          disabled={isExporting || !canExport}
          className="inline-flex items-center gap-2 rounded-lg bg-sky-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-50 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-700 focus-visible:ring-offset-2"
        >
          {isExporting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>
                {exportProgress
                  ? `Menyusun ${exportProgress.current}/${exportProgress.total}`
                  : 'Menyusun PDF...'}
              </span>
            </>
          ) : (
            <>
              <Download className="h-4 w-4" />
              <span>Unduh PDF (F4)</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
}
