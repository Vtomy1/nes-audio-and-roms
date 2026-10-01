import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause, Cpu, Sliders, Activity, Info } from 'lucide-react';
import { DPCM_RATES, DpcmConvertOptions } from '../utils/dpcmConverter';
import { DpcmConversionResult } from '../types/nes';
import { previewPlayer } from '../utils/audioPlayer';

interface DpcmSettingsPanelProps {
  options: DpcmConvertOptions;
  setOptions: React.Dispatch<React.SetStateAction<DpcmConvertOptions>>;
  dpcmResult: DpcmConversionResult | null;
}

export const DpcmSettingsPanel: React.FC<DpcmSettingsPanelProps> = ({
  options,
  setOptions,
  dpcmResult,
}) => {
  const [isPlayingDpcm, setIsPlayingDpcm] = useState(false);
  const dpcmWaveformCanvasRef = useRef<HTMLCanvasElement>(null);
  const stopPlaybackRef = useRef<(() => void) | null>(null);

  // Draw reconstructed DPCM waveform
  useEffect(() => {
    const canvas = dpcmWaveformCanvasRef.current;
    if (!canvas || !dpcmResult) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    // Centerline
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();

    const pcm = dpcmResult.pcmReconstructed;
    const step = Math.ceil(pcm.length / width);
    const amp = height / 2;

    ctx.strokeStyle = '#ef4444'; // Retro NES Red
    ctx.lineWidth = 1.5;
    ctx.beginPath();

    for (let x = 0; x < width; x++) {
      let min = 1.0;
      let max = -1.0;
      const start = x * step;
      const end = Math.min(start + step, pcm.length);

      for (let j = start; j < end; j++) {
        const val = pcm[j];
        if (val < min) min = val;
        if (val > max) max = val;
      }

      if (min === 1.0) min = 0;
      if (max === -1.0) max = 0;

      const yLow = (1 + min) * amp;
      const yHigh = (1 + max) * amp;

      if (x === 0) {
        ctx.moveTo(x, yLow);
      } else {
        ctx.lineTo(x, yLow);
        ctx.lineTo(x, yHigh);
      }
    }

    ctx.stroke();
  }, [dpcmResult]);

  const togglePlayDpcm = () => {
    if (isPlayingDpcm) {
      if (stopPlaybackRef.current) stopPlaybackRef.current();
      setIsPlayingDpcm(false);
    } else if (dpcmResult) {
      setIsPlayingDpcm(true);
      const controller = previewPlayer.playPcmData(
        dpcmResult.pcmReconstructed,
        dpcmResult.sampleRateHz,
        () => {
          setIsPlayingDpcm(false);
        }
      );
      stopPlaybackRef.current = controller.stop;
    }
  };

  const currentRate = DPCM_RATES[options.rateIndex] || DPCM_RATES[15];
  const currentHz = options.tvSystem === 'pal' ? currentRate.palHz : currentRate.ntscHz;

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-5 flex flex-col gap-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
        <div>
          <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-red-500" />
            <span>NES 2A03 DPCM Hardware Encoder</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            1-bit Delta Pulse Code Modulation synthesis with authentic 7-bit DAC counter quantization.
          </p>
        </div>

        {/* Live Registers Card */}
        {dpcmResult && (
          <div className="flex items-center gap-2 font-mono text-xs">
            <span className="text-slate-400">$4010:</span>
            <span className="text-emerald-400 font-semibold">{currentRate.hexCode}</span>
            <span className="text-slate-600">·</span>
            <span className="text-slate-400">$4012:</span>
            <span className="text-emerald-400 font-semibold">${dpcmResult.sampleAddressRegister.toString(16).padStart(2, '0').toUpperCase()}</span>
            <span className="text-slate-600">·</span>
            <span className="text-slate-400">$4013:</span>
            <span className="text-emerald-400 font-semibold">${dpcmResult.hardwareLengthRegister.toString(16).padStart(2, '0').toUpperCase()}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Controls Column */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          {/* Rate Selector */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-200">
                NES Hardware Sample Rate ($4010 Bits 0-3)
              </label>
              <span className="text-xs font-mono text-sky-400 font-semibold">
                {currentRate.hexCode} ({Math.round(currentHz)} Hz · {currentRate.cpuCycles} CPU cycles)
              </span>
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
              {DPCM_RATES.map((rate) => {
                const hz = options.tvSystem === 'pal' ? rate.palHz : rate.ntscHz;
                const isSelected = options.rateIndex === rate.index;
                return (
                  <button
                    key={rate.index}
                    onClick={() => setOptions((prev) => ({ ...prev, rateIndex: rate.index }))}
                    className={`py-1.5 px-1 rounded text-center transition-colors border ${
                      isSelected
                        ? 'bg-red-600 border-red-500 text-white font-bold shadow-sm shadow-red-900/40'
                        : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:bg-slate-800/80 hover:text-white'
                    }`}
                  >
                    <div className="text-[11px] font-mono leading-none">{rate.hexCode}</div>
                    <div className="text-[9px] text-slate-400 mt-1 leading-none">
                      {Math.round(hz / 100) / 10}k
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Region, Dither & Normalization */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* TV Timing */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Clock Timing
              </label>
              <div className="flex items-center gap-1 p-1 bg-slate-950 border border-slate-800 rounded">
                <button
                  onClick={() => setOptions((prev) => ({ ...prev, tvSystem: 'ntsc' }))}
                  className={`flex-1 py-1 text-xs font-medium rounded transition-colors ${
                    options.tvSystem === 'ntsc'
                      ? 'bg-slate-800 text-white font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  NTSC (60Hz)
                </button>
                <button
                  onClick={() => setOptions((prev) => ({ ...prev, tvSystem: 'pal' }))}
                  className={`flex-1 py-1 text-xs font-medium rounded transition-colors ${
                    options.tvSystem === 'pal'
                      ? 'bg-slate-800 text-white font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  PAL (50Hz)
                </button>
              </div>
            </div>

            {/* Dither Switch */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Triangular Dithering
              </label>
              <button
                onClick={() => setOptions((prev) => ({ ...prev, dither: !prev.dither }))}
                className={`w-full py-1.5 px-3 text-xs font-medium rounded border transition-colors flex items-center justify-between ${
                  options.dither
                    ? 'bg-sky-950/40 border-sky-600/60 text-sky-200 font-semibold'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>Anti-Whine Dither</span>
                <span className="font-mono text-[11px]">{options.dither ? 'ON' : 'OFF'}</span>
              </button>
            </div>

            {/* Normalization */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Peak Normalizer
              </label>
              <button
                onClick={() => setOptions((prev) => ({ ...prev, normalize: !prev.normalize }))}
                className={`w-full py-1.5 px-3 text-xs font-medium rounded border transition-colors flex items-center justify-between ${
                  options.normalize
                    ? 'bg-emerald-950/40 border-emerald-600/60 text-emerald-200 font-semibold'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>Normalize 0dB</span>
                <span className="font-mono text-[11px]">{options.normalize ? 'ON' : 'OFF'}</span>
              </button>
            </div>
          </div>

          {/* Volume Gain Slider & Hardware Address */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-950/40 p-3 rounded border border-slate-800/80">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-slate-300">Pre-Amp Gain Boost</span>
                <span className="text-xs font-mono text-slate-400">{Math.round(options.volumeScale * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.2"
                max="2.0"
                step="0.05"
                value={options.volumeScale}
                onChange={(e) => setOptions((prev) => ({ ...prev, volumeScale: parseFloat(e.target.value) }))}
                className="w-full accent-red-500 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-slate-300">CPU Target Address</span>
                <span className="text-xs font-mono text-emerald-400">
                  ${options.targetAddress.toString(16).toUpperCase()}
                </span>
              </div>
              <select
                value={options.targetAddress}
                onChange={(e) => setOptions((prev) => ({ ...prev, targetAddress: parseInt(e.target.value, 16) }))}
                className="w-full bg-slate-900 border border-slate-700/80 text-xs font-mono rounded px-2.5 py-1 text-slate-200 focus:outline-none focus:border-red-500"
              >
                <option value="0xC000">$C000 (Standard Start of DMC Memory)</option>
                <option value="0xC400">$C400 (Offset +1KB)</option>
                <option value="0xC800">$C800 (Offset +2KB)</option>
                <option value="0xD000">$D000 (Offset +4KB)</option>
                <option value="0xE000">$E000 (Upper Bank)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Reconstructed Waveform & Playback Column */}
        <div className="lg:col-span-5 bg-slate-950/80 border border-slate-800 rounded-lg p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-red-500" />
                <span>Reconstructed 1-Bit DPCM</span>
              </span>

              {dpcmResult && (
                <div className="flex items-center gap-1 text-[11px] text-slate-400 font-mono">
                  <span>{dpcmResult.sampleLengthBytes} bytes</span>
                  <span>·</span>
                  <span>{dpcmResult.durationSeconds.toFixed(2)}s</span>
                </div>
              )}
            </div>

            {/* DPCM Reconstructed Waveform */}
            <div className="relative w-full h-20 bg-slate-950 rounded border border-slate-800 overflow-hidden flex items-center justify-center">
              {dpcmResult ? (
                <canvas
                  ref={dpcmWaveformCanvasRef}
                  width={340}
                  height={80}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-xs text-slate-500">Awaiting audio input</span>
              )}
            </div>

            {/* Hardware Register Explanation */}
            <div className="mt-3 p-2.5 rounded bg-slate-900/60 border border-slate-800 text-[11px] text-slate-300 font-mono space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-400">$4010 Playback Rate:</span>
                <span className="text-slate-200 font-bold">{currentRate.hexCode} ({Math.round(currentHz)} Hz)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">$4012 Address Offset:</span>
                <span className="text-slate-200 font-bold">${dpcmResult?.sampleAddressRegister.toString(16).padStart(2, '0').toUpperCase()} (${options.targetAddress.toString(16).toUpperCase()})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">$4013 Sample Length:</span>
                <span className="text-slate-200 font-bold">${dpcmResult?.hardwareLengthRegister.toString(16).padStart(2, '0').toUpperCase()} ({dpcmResult?.sampleLengthBytes} B)</span>
              </div>
            </div>
          </div>

          {/* Action button */}
          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
            <button
              onClick={togglePlayDpcm}
              disabled={!dpcmResult}
              className={`px-4 py-2 text-xs font-semibold rounded flex items-center gap-2 transition-colors ${
                dpcmResult
                  ? 'bg-red-600 hover:bg-red-500 text-white shadow-md shadow-red-900/30'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              {isPlayingDpcm ? (
                <>
                  <Pause className="w-3.5 h-3.5" />
                  <span>Stop DPCM</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  <span>Play Reconstructed 1-Bit DPCM</span>
                </>
              )}
            </button>

            <span className="text-[11px] text-slate-500 flex items-center gap-1">
              <Info className="w-3 h-3" />
              <span>Authentic 7-bit DAC</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
