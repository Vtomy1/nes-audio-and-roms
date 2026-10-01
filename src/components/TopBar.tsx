import React from 'react';
import { Download, RefreshCw, Music2, Cpu } from 'lucide-react';

interface TopBarProps {
  activeTab: 'encoder' | 'header' | 'simulator' | 'export';
  setActiveTab: (tab: 'encoder' | 'header' | 'simulator' | 'export') => void;
  onExportRom: () => void;
  onResetDefaults: () => void;
  romSizeKb: number;
}

export const TopBar: React.FC<TopBarProps> = ({
  activeTab,
  setActiveTab,
  onExportRom,
  onResetDefaults,
  romSizeKb,
}) => {
  return (
    <header className="flex items-center justify-between px-6 py-3.5 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
      {/* Zone 1: Single text element wordmark */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded bg-gradient-to-br from-red-600 to-rose-700 flex items-center justify-center text-white shadow-sm shadow-red-900/40">
          <Cpu className="w-4 h-4" />
        </div>
        <a href="/" className="text-base font-bold tracking-tight text-white font-mono flex items-center gap-2">
          <span>NES Audio &amp; ROM Studio</span>
        </a>
      </div>

      {/* Zone 2: 4 clean text navigation links */}
      <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
        <button
          onClick={() => setActiveTab('encoder')}
          className={`transition-colors flex items-center gap-1.5 py-1 ${
            activeTab === 'encoder'
              ? 'text-red-400 font-semibold border-b-2 border-red-500'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Music2 className="w-3.5 h-3.5" />
          <span>DPCM Audio Encoder</span>
        </button>
        <button
          onClick={() => setActiveTab('header')}
          className={`transition-colors flex items-center gap-1.5 py-1 ${
            activeTab === 'header'
              ? 'text-red-400 font-semibold border-b-2 border-red-500'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Cpu className="w-3.5 h-3.5" />
          <span>ROM Header Matrix</span>
        </button>
        <button
          onClick={() => setActiveTab('simulator')}
          className={`transition-colors flex items-center gap-1.5 py-1 ${
            activeTab === 'simulator'
              ? 'text-red-400 font-semibold border-b-2 border-red-500'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <span>NES CRT Live</span>
        </button>
        <button
          onClick={() => setActiveTab('export')}
          className={`transition-colors flex items-center gap-1.5 py-1 ${
            activeTab === 'export'
              ? 'text-red-400 font-semibold border-b-2 border-red-500'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <span>Assembly &amp; Downloads</span>
        </button>
      </nav>

      {/* Zone 3: 1-2 primary actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={onResetDefaults}
          title="Reset to default NROM settings"
          className="px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-slate-200 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded transition-colors flex items-center gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Reset</span>
        </button>

        <button
          onClick={onExportRom}
          className="px-3.5 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-500 rounded shadow-sm shadow-red-900/30 transition-colors flex items-center gap-1.5 whitespace-nowrap"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export ROM ({romSizeKb} KB)</span>
        </button>
      </div>
    </header>
  );
};
