/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { TopBar } from './components/TopBar';
import { AudioInputSection } from './components/AudioInputSection';
import { DpcmSettingsPanel } from './components/DpcmSettingsPanel';
import { HeaderBuilder } from './components/HeaderBuilder';
import { NesSimulatorScreen } from './components/NesSimulatorScreen';
import { RomExportPanel } from './components/RomExportPanel';

import { NesHeaderConfig, DpcmConversionResult } from './types/nes';
import { DEFAULT_HEADER_CONFIG, buildNesHeader } from './utils/nesHeader';
import { DpcmConvertOptions, convertAudioToNesDpcm, DPCM_RATES } from './utils/dpcmConverter';
import { AUDIO_PRESETS } from './utils/audioPresets';
import { previewPlayer } from './utils/audioPlayer';
import { buildCompleteNesRom } from './utils/nesRomBuilder';

export default function App() {
  const [activeTab, setActiveTab] = useState<'encoder' | 'header' | 'simulator' | 'export'>('encoder');

  // Audio state
  const [pcmData, setPcmData] = useState<Float32Array | null>(null);
  const [sampleRate, setSampleRate] = useState<number>(44100);
  const [fileName, setFileName] = useState<string>('coin_pickup.wav');

  // Header Config
  const [headerConfig, setHeaderConfig] = useState<NesHeaderConfig>(DEFAULT_HEADER_CONFIG);

  // DPCM Encoder Options
  const [dpcmOptions, setDpcmOptions] = useState<DpcmConvertOptions>({
    rateIndex: 15, // Rate $F (33.14 kHz)
    tvSystem: 'ntsc',
    volumeScale: 1.0,
    dither: true,
    normalize: true,
    clampToSingleChunk: true,
    targetAddress: 0xc000,
  });

  // Load initial preset sound on mount
  useEffect(() => {
    try {
      const initialPreset = AUDIO_PRESETS[0]; // 8-Bit Coin Chime
      const ctx = previewPlayer.getAudioContext();
      const buffer = initialPreset.generator(ctx);
      const mono = new Float32Array(buffer.length);
      mono.set(buffer.getChannelData(0));

      setPcmData(mono);
      setSampleRate(buffer.sampleRate);
      setFileName(`${initialPreset.id}.wav`);
    } catch (err) {
      console.error('Failed to load initial preset sound:', err);
    }
  }, []);

  // Compute DPCM conversion whenever pcmData or options change
  const dpcmResult: DpcmConversionResult | null = useMemo(() => {
    if (!pcmData) return null;
    try {
      return convertAudioToNesDpcm(pcmData, sampleRate, dpcmOptions);
    } catch (err) {
      console.error('DPCM conversion error:', err);
      return null;
    }
  }, [pcmData, sampleRate, dpcmOptions]);

  // Sync TV system between header config and DPCM options
  useEffect(() => {
    if (headerConfig.tvSystem === 'pal' && dpcmOptions.tvSystem !== 'pal') {
      setDpcmOptions((prev) => ({ ...prev, tvSystem: 'pal' }));
    } else if (headerConfig.tvSystem === 'ntsc' && dpcmOptions.tvSystem !== 'ntsc') {
      setDpcmOptions((prev) => ({ ...prev, tvSystem: 'ntsc' }));
    }
  }, [headerConfig.tvSystem, dpcmOptions.tvSystem]);

  // Audio loaded handler
  const handleAudioLoaded = useCallback((pcm: Float32Array, rate: number, name: string) => {
    setPcmData(pcm);
    setSampleRate(rate);
    setFileName(name);
  }, []);

  // Rate change callback from controller
  const handleRateChange = useCallback((delta: number) => {
    setDpcmOptions((prev) => {
      const nextIndex = Math.max(0, Math.min(DPCM_RATES.length - 1, prev.rateIndex + delta));
      return { ...prev, rateIndex: nextIndex };
    });
  }, []);

  // Quick export .nes ROM
  const handleExportRom = () => {
    if (!dpcmResult) return;
    const romBytes = buildCompleteNesRom(headerConfig, dpcmResult);
    const blob = new Blob([romBytes.buffer as ArrayBuffer], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const safeName = fileName.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_]/g, '_') || 'audio_sample';
    link.href = url;
    link.download = `${safeName}.nes`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Reset defaults
  const handleResetDefaults = () => {
    setHeaderConfig(DEFAULT_HEADER_CONFIG);
    setDpcmOptions({
      rateIndex: 15,
      tvSystem: 'ntsc',
      volumeScale: 1.0,
      dither: true,
      normalize: true,
      clampToSingleChunk: true,
      targetAddress: 0xc000,
    });
  };

  // Calculate compiled ROM size in KB
  const romSizeKb = useMemo(() => {
    const prgBytes = headerConfig.prgRomSize16k * 16384;
    const chrBytes = headerConfig.chrRomSize8k * 8192;
    return Math.round((16 + prgBytes + chrBytes) / 1024);
  }, [headerConfig.prgRomSize16k, headerConfig.chrRomSize8k]);

  return (
    <div className="min-h-screen bg-[#070b12] text-slate-200 flex flex-col font-sans selection:bg-red-900 selection:text-white">
      {/* Top Bar with Top Bar Contract compliance */}
      <TopBar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onExportRom={handleExportRom}
        onResetDefaults={handleResetDefaults}
        romSizeKb={romSizeKb}
      />

      {/* Main Container - 1440px max width baseline */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-6">
        {/* Editorial Subheader with unboxed metadata */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 border-b border-slate-800/80 pb-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-mono flex items-center gap-2">
              <span>NES 2A03 Audio to ROM Header Studio</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl text-balance">
              Encode audio waves to 1-bit NES DPCM bytecode, configure byte-for-byte authentic iNES &amp; NES 2.0 ROM headers with audio expansion mappers, and assemble playable NES cartridges.
            </p>
          </div>

          {/* Unboxed Metadata with · separator */}
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400 tabular-nums">
            <span>NES 2.0 &amp; iNES 1.0</span>
            <span aria-hidden="true">·</span>
            <span>2A03 APU DPCM</span>
            <span aria-hidden="true">·</span>
            <span>6502 Machine Code</span>
          </div>
        </div>

        {/* Tab Controls for Mobile / Small Screens */}
        <div className="flex md:hidden items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-lg overflow-x-auto">
          <button
            onClick={() => setActiveTab('encoder')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
              activeTab === 'encoder' ? 'bg-red-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Encoder
          </button>
          <button
            onClick={() => setActiveTab('header')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
              activeTab === 'header' ? 'bg-red-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            ROM Header
          </button>
          <button
            onClick={() => setActiveTab('simulator')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
              activeTab === 'simulator' ? 'bg-red-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            CRT Monitor
          </button>
          <button
            onClick={() => setActiveTab('export')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
              activeTab === 'export' ? 'bg-red-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Assembly &amp; Export
          </button>
        </div>

        {/* Content based on Active Tab */}
        {activeTab === 'encoder' && (
          <div className="flex flex-col gap-6">
            <AudioInputSection
              pcmData={pcmData}
              sampleRate={sampleRate}
              fileName={fileName}
              onAudioLoaded={handleAudioLoaded}
            />
            <DpcmSettingsPanel
              options={dpcmOptions}
              setOptions={setDpcmOptions}
              dpcmResult={dpcmResult}
            />
          </div>
        )}

        {activeTab === 'header' && (
          <HeaderBuilder config={headerConfig} setConfig={setHeaderConfig} />
        )}

        {activeTab === 'simulator' && (
          <NesSimulatorScreen
            dpcmResult={dpcmResult}
            config={headerConfig}
            onRateChange={handleRateChange}
          />
        )}

        {activeTab === 'export' && (
          <RomExportPanel
            config={headerConfig}
            dpcmResult={dpcmResult}
            audioFileName={fileName}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-4 px-6 text-center text-xs text-slate-500 font-mono">
        <span>NES 2A03 Audio &amp; ROM Header Studio · Compliant with NesDev iNES &amp; NES 2.0 Specifications</span>
      </footer>
    </div>
  );
}
