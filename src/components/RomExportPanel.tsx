import React, { useState } from 'react';
import { Download, Copy, Check, FileCode, Binary, HardDrive, Terminal } from 'lucide-react';
import { NesHeaderConfig, DpcmConversionResult } from '../types/nes';
import { buildCompleteNesRom } from '../utils/nesRomBuilder';
import { buildNesHeader } from '../utils/nesHeader';
import { generateDpcmAssembly, generateDpcmCHeader } from '../utils/dpcmConverter';

interface RomExportPanelProps {
  config: NesHeaderConfig;
  dpcmResult: DpcmConversionResult | null;
  audioFileName: string;
}

export const RomExportPanel: React.FC<RomExportPanelProps> = ({
  config,
  dpcmResult,
  audioFileName,
}) => {
  const [activeCodeTab, setActiveCodeTab] = useState<'asm' | 'c' | 'hex'>('asm');
  const [copied, setCopied] = useState(false);

  const baseFileName = audioFileName.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_]/g, '_') || 'audio_sample';

  // Build files
  const headerBytes = buildNesHeader(config);
  const nesRomBytes = dpcmResult ? buildCompleteNesRom(config, dpcmResult) : null;
  const asmCode = dpcmResult ? generateDpcmAssembly(dpcmResult.dmcData, baseFileName) : '; No audio encoded yet';
  const cCode = dpcmResult ? generateDpcmCHeader(dpcmResult.dmcData, dpcmResult, baseFileName) : '// No audio encoded yet';

  // Hex dump string for 16-byte header
  const hexDump = Array.from(headerBytes)
    .map((b, i) => {
      const hex = b.toString(16).padStart(2, '0').toUpperCase();
      const ascii = b >= 32 && b <= 126 ? String.fromCharCode(b) : '.';
      return `0x000${i.toString(16).toUpperCase()}:  ${hex}  (${ascii})  ; Byte ${i}: ${
        i === 0 || i === 1 || i === 2 || i === 3
          ? 'Magic NES^Z'
          : i === 4
          ? `PRG ${config.prgRomSize16k * 16}KB`
          : i === 5
          ? `CHR ${config.chrRomSize8k * 8}KB`
          : i === 6
          ? `Flags 6 (Mapper Low & Mirroring)`
          : i === 7
          ? `Flags 7 (Format & Mapper Mid)`
          : i === 8
          ? `Flags 8 (Mapper High & Submapper)`
          : i === 15
          ? `Flags 15 (Audio Expansion Device)`
          : `Flags ${i}`
      }`;
    })
    .join('\n');

  // Trigger file download helper
  const triggerDownload = (data: Uint8Array, filename: string, mimeType: string = 'application/octet-stream') => {
    const blob = new Blob([data.buffer as ArrayBuffer], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadNesRom = () => {
    if (!nesRomBytes) return;
    triggerDownload(nesRomBytes, `${baseFileName}.nes`);
  };

  const handleDownloadDmc = () => {
    if (!dpcmResult) return;
    triggerDownload(dpcmResult.dmcData, `${baseFileName}.dmc`);
  };

  const handleDownloadHeader = () => {
    triggerDownload(headerBytes, `${baseFileName}.header`);
  };

  const handleDownloadText = (content: string, filename: string) => {
    const encoder = new TextEncoder();
    triggerDownload(encoder.encode(content), filename, 'text/plain');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const activeContent = activeCodeTab === 'asm' ? asmCode : activeCodeTab === 'c' ? cCode : hexDump;

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-5 flex flex-col gap-5">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div>
          <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-sky-400" />
            <span>ROM Assembly, Binary Exports &amp; Source Code</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Download valid, emulator-ready .NES ROMs, raw .DMC chiptune samples, 16-byte headers, and 6502 assembly routines.
          </p>
        </div>

        {/* ROM Size Tag */}
        {nesRomBytes && (
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-slate-400">Total ROM Size:</span>
            <span className="text-emerald-400 font-bold">{(nesRomBytes.length / 1024).toFixed(1)} KB ({nesRomBytes.length} bytes)</span>
          </div>
        )}
      </div>

      {/* Export Action Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Playable .NES ROM */}
        <div className="bg-slate-950/60 border border-red-900/60 hover:border-red-600/80 p-4 rounded-lg flex flex-col justify-between transition-all group">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono font-bold text-red-400 uppercase">.NES ROM</span>
              <Binary className="w-4 h-4 text-red-500" />
            </div>
            <p className="text-xs text-slate-300 font-medium mb-1">Playable NES Game ROM</p>
            <p className="text-[11px] text-slate-500 mb-3">
              Full bootable binary with 16B header, 6502 machine code, and font tiles for FCEUX, Mesen, RetroArch, etc.
            </p>
          </div>
          <button
            onClick={handleDownloadNesRom}
            disabled={!nesRomBytes}
            className="w-full py-2 px-3 text-xs font-semibold text-white bg-red-600 hover:bg-red-500 disabled:bg-slate-800 disabled:text-slate-500 rounded transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download .nes ({nesRomBytes ? (nesRomBytes.length / 1024).toFixed(0) : 0} KB)</span>
          </button>
        </div>

        {/* Raw .DMC Audio Sample */}
        <div className="bg-slate-950/60 border border-slate-800 hover:border-sky-600/80 p-4 rounded-lg flex flex-col justify-between transition-all group">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono font-bold text-sky-400 uppercase">.DMC Sample</span>
              <FileCode className="w-4 h-4 text-sky-400" />
            </div>
            <p className="text-xs text-slate-300 font-medium mb-1">Raw 1-Bit DPCM File</p>
            <p className="text-[11px] text-slate-500 mb-3">
              Standard NES 2A03 delta bytecode. Compatible with FamiTracker, Furnace Tracker, and Dn-FamiTracker.
            </p>
          </div>
          <button
            onClick={handleDownloadDmc}
            disabled={!dpcmResult}
            className="w-full py-2 px-3 text-xs font-semibold text-white bg-sky-700 hover:bg-sky-600 disabled:bg-slate-800 disabled:text-slate-500 rounded transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download .dmc ({dpcmResult?.sampleLengthBytes || 0} B)</span>
          </button>
        </div>

        {/* 16-Byte Header Binary */}
        <div className="bg-slate-950/60 border border-slate-800 hover:border-emerald-600/80 p-4 rounded-lg flex flex-col justify-between transition-all group">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono font-bold text-emerald-400 uppercase">.HEADER Binary</span>
              <Terminal className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-xs text-slate-300 font-medium mb-1">Exact 16-Byte Header</p>
            <p className="text-[11px] text-slate-500 mb-3">
              Standalone 16-byte iNES / NES 2.0 header block to prepended to existing raw PRG/CHR ROM images.
            </p>
          </div>
          <button
            onClick={handleDownloadHeader}
            className="w-full py-2 px-3 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-600 rounded transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download 16-Byte Header</span>
          </button>
        </div>

        {/* Assembly / C Code Export */}
        <div className="bg-slate-950/60 border border-slate-800 hover:border-purple-600/80 p-4 rounded-lg flex flex-col justify-between transition-all group">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono font-bold text-purple-400 uppercase">Assembly Source</span>
              <Terminal className="w-4 h-4 text-purple-400" />
            </div>
            <p className="text-xs text-slate-300 font-medium mb-1">ca65 / cc65 / asm6</p>
            <p className="text-[11px] text-slate-500 mb-3">
              6502 `.byte` data table and register definitions ready to include in your NES homebrew project.
            </p>
          </div>
          <button
            onClick={() => handleDownloadText(asmCode, `${baseFileName}.asm`)}
            disabled={!dpcmResult}
            className="w-full py-2 px-3 text-xs font-semibold text-white bg-purple-700 hover:bg-purple-600 disabled:bg-slate-800 disabled:text-slate-500 rounded transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download .asm</span>
          </button>
        </div>
      </div>

      {/* Code Inspector Tabs */}
      <div className="bg-slate-950 border border-slate-800 rounded-lg overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2 bg-slate-900/80 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveCodeTab('asm')}
              className={`px-3 py-1 text-xs font-mono font-medium rounded transition-colors ${
                activeCodeTab === 'asm'
                  ? 'bg-slate-800 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              6502 Assembly (.asm)
            </button>
            <button
              onClick={() => setActiveCodeTab('c')}
              className={`px-3 py-1 text-xs font-mono font-medium rounded transition-colors ${
                activeCodeTab === 'c'
                  ? 'bg-slate-800 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              C Header (.h)
            </button>
            <button
              onClick={() => setActiveCodeTab('hex')}
              className={`px-3 py-1 text-xs font-mono font-medium rounded transition-colors ${
                activeCodeTab === 'hex'
                  ? 'bg-slate-800 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              16-Byte Header Hex Dump
            </button>
          </div>

          <button
            onClick={() => copyToClipboard(activeContent)}
            className="px-2.5 py-1 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded transition-colors flex items-center gap-1.5"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>

        {/* Code Content */}
        <pre className="p-4 text-xs font-mono text-slate-300 bg-slate-950 overflow-x-auto max-h-72 leading-relaxed">
          <code>{activeContent}</code>
        </pre>
      </div>

      {/* Memory Map Visualizer */}
      <div className="bg-slate-950/40 p-4 rounded border border-slate-800/80">
        <span className="text-xs font-semibold text-slate-200 block mb-2">
          NES CPU Memory Layout Map ($0000 - $FFFF)
        </span>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-xs font-mono">
          <div className="bg-slate-900 border border-slate-800 p-2.5 rounded">
            <div className="text-slate-400 text-[10px]">$0000 - $07FF (2 KB)</div>
            <div className="text-slate-200 font-bold mt-0.5">Internal NES RAM</div>
            <div className="text-[10px] text-slate-500 mt-1">Zero page, stack &amp; audio buffer pointers</div>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-2.5 rounded">
            <div className="text-slate-400 text-[10px]">$4000 - $4017</div>
            <div className="text-sky-300 font-bold mt-0.5">2A03 APU &amp; I/O</div>
            <div className="text-[10px] text-slate-500 mt-1">$4010..$4013 DPCM registers &amp; Joypad 1</div>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-2.5 rounded">
            <div className="text-slate-400 text-[10px]">$8000 - $BFFF (16 KB)</div>
            <div className="text-emerald-300 font-bold mt-0.5">PRG-ROM Bank 0</div>
            <div className="text-[10px] text-slate-500 mt-1">6502 reset bootloader &amp; controller loop</div>
          </div>
          <div className="bg-slate-900 border border-red-900/60 p-2.5 rounded bg-red-950/10">
            <div className="text-red-400 text-[10px]">$C000 - $FFFF (16 KB)</div>
            <div className="text-red-300 font-bold mt-0.5">PRG-ROM Bank 1 + DPCM</div>
            <div className="text-[10px] text-red-400/80 mt-1">
              Sample at ${dpcmResult?.targetMemoryAddress.toString(16).toUpperCase() || 'C000'}, Vectors at $FFFA
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
