import React, { useState } from 'react';
import { Cpu, ShieldCheck, AlertCircle, FileSearch, Layers, Zap } from 'lucide-react';
import { NesHeaderConfig, HeaderByteInfo } from '../types/nes';
import {
  buildNesHeader,
  getHeaderByteBreakdown,
  parseNesHeader,
  POPULAR_MAPPERS,
  EXPANSION_AUDIO_DEVICES,
} from '../utils/nesHeader';

interface HeaderBuilderProps {
  config: NesHeaderConfig;
  setConfig: React.Dispatch<React.SetStateAction<NesHeaderConfig>>;
}

export const HeaderBuilder: React.FC<HeaderBuilderProps> = ({ config, setConfig }) => {
  const [selectedByteIndex, setSelectedByteIndex] = useState<number>(6);
  const [importNotice, setImportNotice] = useState<{ message: string; type: 'success' | 'warn' } | null>(null);

  const headerBytes = buildNesHeader(config);
  const breakdownList = getHeaderByteBreakdown(headerBytes, config);
  const selectedByte = breakdownList[selectedByteIndex] || breakdownList[6];

  // Handle ROM file import & header inspection
  const handleNesFileDrop = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const buffer = await file.arrayBuffer();
    const result = parseNesHeader(buffer);

    if (!result.isValid) {
      setImportNotice({
        message: 'Invalid NES file: Magic "NES\\x1A" not found.',
        type: 'warn',
      });
      return;
    }

    setConfig(result.config);
    if (result.warnings.length > 0) {
      setImportNotice({
        message: `Header imported with fixes: ${result.warnings.join(' ')}`,
        type: 'warn',
      });
    } else {
      setImportNotice({
        message: `Successfully parsed ${file.name} header (${result.config.format}, Mapper ${result.config.mapper}).`,
        type: 'success',
      });
    }
  };

  // Toggle a single bit on the currently selected byte
  const toggleBit = (bitIndex: number) => {
    const currentVal = headerBytes[selectedByteIndex];
    const newVal = currentVal ^ (1 << bitIndex);

    // Update config accordingly depending on byte index
    if (selectedByteIndex === 4) {
      setConfig((prev) => ({ ...prev, prgRomSize16k: Math.max(1, newVal) }));
    } else if (selectedByteIndex === 5) {
      setConfig((prev) => ({ ...prev, chrRomSize8k: newVal }));
    } else if (selectedByteIndex === 6) {
      const bit0 = Boolean(newVal & 1);
      const bit1 = Boolean(newVal & 2);
      const bit2 = Boolean(newVal & 4);
      const bit3 = Boolean(newVal & 8);
      const lowMapper = (newVal >> 4) & 0x0f;

      setConfig((prev) => ({
        ...prev,
        mirroring: bit3 ? 'four_screen' : bit0 ? 'vertical' : 'horizontal',
        hasBattery: bit1,
        hasTrainer: bit2,
        isFourScreen: bit3,
        mapper: (prev.mapper & 0xfff0) | lowMapper,
      }));
    } else if (selectedByteIndex === 7) {
      const bit0 = Boolean(newVal & 1);
      const bit1 = Boolean(newVal & 2);
      const midMapper = (newVal >> 4) & 0x0f;
      const isNes2 = (newVal & 0x0c) === 0x08;

      setConfig((prev) => ({
        ...prev,
        isVsUnisystem: bit0,
        isPlayChoice10: bit1,
        format: isNes2 ? 'NES2.0' : 'iNES',
        mapper: (prev.mapper & 0xff0f) | (midMapper << 4),
      }));
    } else if (selectedByteIndex === 8 && config.format === 'NES2.0') {
      const highMapper = newVal & 0x0f;
      const sub = (newVal >> 4) & 0x0f;
      setConfig((prev) => ({
        ...prev,
        submapper: sub,
        mapper: (prev.mapper & 0x00ff) | (highMapper << 8),
      }));
    } else if (selectedByteIndex === 15 && config.format === 'NES2.0') {
      setConfig((prev) => ({
        ...prev,
        expansionAudioDevice: newVal & 0x3f,
      }));
    }
  };

  const getByteBgColor = (byte: HeaderByteInfo, isSelected: boolean) => {
    if (isSelected) return 'border-red-500 bg-red-950/40 text-red-200';
    switch (byte.category) {
      case 'magic':
        return 'border-sky-800/80 bg-sky-950/30 text-sky-300';
      case 'prg_chr':
        return 'border-emerald-800/80 bg-emerald-950/30 text-emerald-300';
      case 'flags':
        return 'border-amber-800/80 bg-amber-950/30 text-amber-300';
      case 'mapper':
        return 'border-purple-800/80 bg-purple-950/30 text-purple-300';
      case 'expansion':
        return 'border-rose-800/80 bg-rose-950/30 text-rose-300';
      default:
        return 'border-slate-800 bg-slate-950/40 text-slate-400';
    }
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-5 flex flex-col gap-5">
      {/* Header title & import */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div>
          <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-emerald-400" />
            <span>NES ROM 16-Byte Header Matrix</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Full iNES 1.0 &amp; NES 2.0 bitfield inspector, audio expansion mapper configuration, and ROM validator.
          </p>
        </div>

        {/* ROM Header Importer */}
        <div className="flex items-center gap-2">
          <label className="px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-950 hover:bg-slate-800 border border-slate-700/80 rounded cursor-pointer transition-colors flex items-center gap-1.5">
            <FileSearch className="w-3.5 h-3.5 text-sky-400" />
            <span>Inspect .NES ROM</span>
            <input
              type="file"
              accept=".nes,.bin"
              onChange={handleNesFileDrop}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {importNotice && (
        <div
          className={`p-3 rounded text-xs flex items-center gap-2 ${
            importNotice.type === 'success'
              ? 'bg-emerald-950/50 text-emerald-300 border border-emerald-800/60'
              : 'bg-amber-950/50 text-amber-300 border border-amber-800/60'
          }`}
        >
          {importNotice.type === 'success' ? (
            <ShieldCheck className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{importNotice.message}</span>
        </div>
      )}

      {/* 16-Byte Interactive Visual Grid */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-200">
            16-Byte Header Memory Map (Click byte to inspect bitfields)
          </span>
          {/* Zero-Pill Unboxed Metadata with · separator */}
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono">
            <span>Format: {config.format}</span>
            <span aria-hidden="true">·</span>
            <span>Mapper: {config.mapper}</span>
            <span aria-hidden="true">·</span>
            <span>Submapper: {config.submapper}</span>
          </div>
        </div>

        <div className="grid grid-cols-4 sm:grid-cols-8 lg:grid-cols-16 gap-1.5 font-mono">
          {breakdownList.map((byte) => {
            const isSelected = byte.index === selectedByteIndex;
            return (
              <button
                key={byte.index}
                onClick={() => setSelectedByteIndex(byte.index)}
                className={`p-2 rounded border text-center transition-all ${getByteBgColor(
                  byte,
                  isSelected
                )}`}
              >
                <div className="text-[10px] text-slate-400 leading-none">
                  [${byte.index.toString(16).toUpperCase()}]
                </div>
                <div className="text-xs font-bold my-1 leading-none">
                  {byte.hex.replace('0x', '')}
                </div>
                <div className="text-[9px] text-slate-400 truncate leading-none" title={byte.label}>
                  {byte.index === 15 ? 'EXP' : byte.index >= 0 && byte.index <= 3 ? 'MAG' : byte.index === 4 ? 'PRG' : byte.index === 5 ? 'CHR' : `F${byte.index}`}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Inspector for Selected Byte */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2 mb-3">
          <div>
            <span className="text-xs font-mono text-red-400 font-semibold mr-2">
              Byte {selectedByte.index} (0x{selectedByte.index.toString(16).toUpperCase()}):
            </span>
            <span className="text-xs font-semibold text-slate-200">{selectedByte.label}</span>
          </div>

          <div className="flex items-center gap-3 font-mono text-xs">
            <span className="text-slate-400">Hex:</span>
            <span className="text-emerald-400 font-bold">{selectedByte.hex}</span>
            <span className="text-slate-600">·</span>
            <span className="text-slate-400">Dec:</span>
            <span className="text-emerald-400 font-bold">{selectedByte.value}</span>
            <span className="text-slate-600">·</span>
            <span className="text-slate-400">Bin:</span>
            <span className="text-emerald-400 font-bold">{selectedByte.binary}</span>
          </div>
        </div>

        <p className="text-xs text-slate-300 mb-3">{selectedByte.description}</p>

        {/* 8-Bit Interactive Toggles */}
        <div className="border border-slate-800 rounded bg-slate-950 p-2.5">
          <div className="text-[11px] font-mono text-slate-400 mb-1.5 flex justify-between">
            <span>Bit 7 (MSB)</span>
            <span>Bit 0 (LSB)</span>
          </div>
          <div className="grid grid-cols-8 gap-1 font-mono text-center">
            {[7, 6, 5, 4, 3, 2, 1, 0].map((bit) => {
              const isSet = Boolean((selectedByte.value >> bit) & 1);
              return (
                <button
                  key={bit}
                  onClick={() => toggleBit(bit)}
                  className={`py-2 px-1 rounded border transition-colors ${
                    isSet
                      ? 'bg-red-600 border-red-500 text-white font-bold'
                      : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
                  }`}
                >
                  <div className="text-xs">{isSet ? '1' : '0'}</div>
                  <div className="text-[9px] text-slate-400 mt-1">b{bit}</div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* High-Level ROM Configuration Form */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Specification Format */}
        <div className="bg-slate-950/40 p-3 rounded border border-slate-800/80">
          <label className="text-xs font-semibold text-slate-200 block mb-1">
            Header Specification Standard
          </label>
          <div className="flex items-center gap-1 p-1 bg-slate-950 border border-slate-800 rounded">
            <button
              onClick={() => setConfig((prev) => ({ ...prev, format: 'NES2.0' }))}
              className={`flex-1 py-1.5 text-xs font-medium rounded transition-colors ${
                config.format === 'NES2.0'
                  ? 'bg-red-600 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              NES 2.0 (Modern)
            </button>
            <button
              onClick={() => setConfig((prev) => ({ ...prev, format: 'iNES' }))}
              className={`flex-1 py-1.5 text-xs font-medium rounded transition-colors ${
                config.format === 'iNES'
                  ? 'bg-slate-800 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              iNES 1.0 (Legacy)
            </button>
          </div>
          <span className="text-[11px] text-slate-500 mt-1.5 block">
            NES 2.0 supports submappers, exact RAM/NVRAM sizes, and expansion sound devices.
          </span>
        </div>

        {/* Mapper Selection */}
        <div className="bg-slate-950/40 p-3 rounded border border-slate-800/80">
          <label className="text-xs font-semibold text-slate-200 block mb-1">
            Mapper &amp; Board Class
          </label>
          <select
            value={config.mapper}
            onChange={(e) => {
              const mapperId = parseInt(e.target.value, 10);
              const info = POPULAR_MAPPERS.find((m) => m.id === mapperId);
              setConfig((prev) => ({
                ...prev,
                mapper: mapperId,
                prgRomSize16k: info ? Math.round(info.defaultPrgK / 16) : prev.prgRomSize16k,
                chrRomSize8k: info ? Math.round(info.defaultChrK / 8) : prev.chrRomSize8k,
              }));
            }}
            className="w-full bg-slate-900 border border-slate-700/80 text-xs rounded px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-red-500"
          >
            {POPULAR_MAPPERS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} {m.audioExpansion ? '★ Extra Audio' : ''}
              </option>
            ))}
          </select>
          <span className="text-[11px] text-slate-400 mt-1.5 block truncate">
            {POPULAR_MAPPERS.find((m) => m.id === config.mapper)?.description || 'Custom mapper'}
          </span>
        </div>

        {/* Audio Expansion Device (Byte 15) */}
        <div className="bg-slate-950/40 p-3 rounded border border-slate-800/80">
          <label className="text-xs font-semibold text-slate-200 block mb-1 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Expansion Audio Chip (Byte 15)</span>
          </label>
          <select
            value={config.expansionAudioDevice}
            disabled={config.format !== 'NES2.0'}
            onChange={(e) =>
              setConfig((prev) => ({
                ...prev,
                expansionAudioDevice: parseInt(e.target.value, 10),
              }))
            }
            className={`w-full bg-slate-900 border border-slate-700/80 text-xs rounded px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-red-500 ${
              config.format !== 'NES2.0' ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {EXPANSION_AUDIO_DEVICES.map((dev) => (
              <option key={dev.id} value={dev.id}>
                {dev.label}
              </option>
            ))}
          </select>
          <span className="text-[11px] text-slate-500 mt-1.5 block">
            Byte 15 signals emulator sound chips (VRC6, VRC7 FM, Sunsoft 5B, MMC5 PCM).
          </span>
        </div>

        {/* PRG-ROM Size */}
        <div className="bg-slate-950/40 p-3 rounded border border-slate-800/80">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-slate-200">PRG-ROM Size</span>
            <span className="text-xs font-mono text-emerald-400">{config.prgRomSize16k * 16} KB</span>
          </div>
          <select
            value={config.prgRomSize16k}
            onChange={(e) =>
              setConfig((prev) => ({
                ...prev,
                prgRomSize16k: parseInt(e.target.value, 10),
              }))
            }
            className="w-full bg-slate-900 border border-slate-700/80 text-xs rounded px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-red-500"
          >
            <option value="1">16 KB (1 Bank · NROM-128)</option>
            <option value="2">32 KB (2 Banks · NROM-256)</option>
            <option value="4">64 KB (4 Banks)</option>
            <option value="8">128 KB (8 Banks · UNROM / MMC1)</option>
            <option value="16">256 KB (16 Banks · MMC3)</option>
            <option value="32">512 KB (32 Banks · MMC5)</option>
          </select>
        </div>

        {/* CHR-ROM Size */}
        <div className="bg-slate-950/40 p-3 rounded border border-slate-800/80">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-slate-200">CHR-ROM / CHR-RAM</span>
            <span className="text-xs font-mono text-emerald-400">
              {config.chrRomSize8k === 0 ? 'CHR-RAM (0 KB)' : `${config.chrRomSize8k * 8} KB`}
            </span>
          </div>
          <select
            value={config.chrRomSize8k}
            onChange={(e) =>
              setConfig((prev) => ({
                ...prev,
                chrRomSize8k: parseInt(e.target.value, 10),
              }))
            }
            className="w-full bg-slate-900 border border-slate-700/80 text-xs rounded px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-red-500"
          >
            <option value="0">0 KB (CHR-RAM · UxROM)</option>
            <option value="1">8 KB (1 Bank · Standard NROM)</option>
            <option value="2">16 KB (2 Banks)</option>
            <option value="4">32 KB (4 Banks · CNROM)</option>
            <option value="16">128 KB (16 Banks · MMC3)</option>
            <option value="32">256 KB (32 Banks)</option>
          </select>
        </div>

        {/* Mirroring */}
        <div className="bg-slate-950/40 p-3 rounded border border-slate-800/80">
          <label className="text-xs font-semibold text-slate-200 block mb-1">
            Nametable Mirroring
          </label>
          <div className="grid grid-cols-3 gap-1 p-1 bg-slate-950 border border-slate-800 rounded">
            {(['horizontal', 'vertical', 'four_screen'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setConfig((prev) => ({ ...prev, mirroring: m }))}
                className={`py-1 text-xs font-medium rounded capitalize transition-colors ${
                  config.mirroring === m
                    ? 'bg-slate-800 text-white font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {m === 'four_screen' ? '4-Screen' : m}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
