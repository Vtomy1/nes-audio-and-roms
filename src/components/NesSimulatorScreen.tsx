import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, Play, Tv } from 'lucide-react';
import { DpcmConversionResult, NesHeaderConfig } from '../types/nes';
import { previewPlayer } from '../utils/audioPlayer';
import { DPCM_RATES } from '../utils/dpcmConverter';

interface NesSimulatorScreenProps {
  dpcmResult: DpcmConversionResult | null;
  config: NesHeaderConfig;
  onRateChange: (delta: number) => void;
}

export const NesSimulatorScreen: React.FC<NesSimulatorScreenProps> = ({
  dpcmResult,
  config,
  onRateChange,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const [activeButton, setActiveButton] = useState<string | null>(null);
  const [dacLevel, setDacLevel] = useState(64);
  const [vuBars, setVuBars] = useState<number[]>([0, 0, 0, 0, 0, 0, 0, 0]);

  const animationFrameRef = useRef<number | null>(null);
  const stopPlaybackRef = useRef<(() => void) | null>(null);
  const playbackStartTimeRef = useRef<number>(0);

  // Trigger DPCM playback
  const triggerPlay = () => {
    if (!dpcmResult) return;

    if (stopPlaybackRef.current) {
      stopPlaybackRef.current();
    }

    setIsPlaying(true);
    playbackStartTimeRef.current = performance.now();

    const controller = previewPlayer.playPcmData(
      dpcmResult.pcmReconstructed,
      dpcmResult.sampleRateHz,
      () => {
        if (isLooping) {
          triggerPlay();
        } else {
          setIsPlaying(false);
          setDacLevel(64);
          setVuBars([0, 0, 0, 0, 0, 0, 0, 0]);
        }
      }
    );

    stopPlaybackRef.current = controller.stop;
  };

  const stopPlay = () => {
    if (stopPlaybackRef.current) {
      stopPlaybackRef.current();
      stopPlaybackRef.current = null;
    }
    setIsPlaying(false);
    setDacLevel(64);
    setVuBars([0, 0, 0, 0, 0, 0, 0, 0]);
  };

  // Keyboard controls listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return;

      if (e.key === 'z' || e.key === 'Z' || e.key === 'j' || e.key === 'J') {
        setActiveButton('A');
        triggerPlay();
      } else if (e.key === 'x' || e.key === 'X' || e.key === 'k' || e.key === 'K') {
        setActiveButton('B');
        stopPlay();
      } else if (e.key === 'ArrowUp') {
        setActiveButton('UP');
        onRateChange(1);
      } else if (e.key === 'ArrowDown') {
        setActiveButton('DOWN');
        onRateChange(-1);
      } else if (e.key === 'Enter') {
        setActiveButton('START');
        setIsLooping((prev) => !prev);
      }
    };

    const handleKeyUp = () => {
      setActiveButton(null);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [dpcmResult, isLooping]);

  // Real-time animation of CRT display and DAC meter while playing
  useEffect(() => {
    const updateCrtMeters = () => {
      if (isPlaying && dpcmResult) {
        const elapsed = (performance.now() - playbackStartTimeRef.current) / 1000;
        const totalDuration = dpcmResult.durationSeconds;
        const progress = Math.min(1, Math.max(0, (elapsed % totalDuration) / totalDuration));

        const sampleIndex = Math.floor(progress * dpcmResult.pcmReconstructed.length);
        const pcmVal = dpcmResult.pcmReconstructed[sampleIndex] || 0;
        // Convert to 7-bit DAC (0..127)
        const dac = Math.round((pcmVal + 1) * 63.5);
        setDacLevel(dac);

        // Generate lively 8-band pseudo-spectrum for retro display
        const absVal = Math.abs(pcmVal);
        const newBars = [
          Math.min(7, Math.floor(absVal * 10)),
          Math.min(7, Math.floor(absVal * 8.5 + Math.random() * 2)),
          Math.min(7, Math.floor(absVal * 7.5 + Math.random() * 2)),
          Math.min(7, Math.floor(absVal * 6 + Math.random() * 2)),
          Math.min(7, Math.floor(absVal * 5 + Math.random() * 2)),
          Math.min(7, Math.floor(absVal * 4 + Math.random() * 2)),
          Math.min(7, Math.floor(absVal * 3 + Math.random() * 1.5)),
          Math.min(7, Math.floor(absVal * 2 + Math.random() * 1.5)),
        ];
        setVuBars(newBars);
      }
      animationFrameRef.current = requestAnimationFrame(updateCrtMeters);
    };

    animationFrameRef.current = requestAnimationFrame(updateCrtMeters);
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isPlaying, dpcmResult]);

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-5 flex flex-col gap-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
        <div>
          <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
            <Tv className="w-4 h-4 text-rose-500" />
            <span>NES CRT Monitor &amp; Live APU Simulator</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time simulated 6502 assembly execution and 2A03 APU DPCM audio playback.
          </p>
        </div>

        {/* Keyboard instructions badge */}
        <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
          <span className="hidden md:inline">Keys: [Z] Play · [X] Stop · [Enter] Loop · [↑/↓] Rate</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Retro CRT Display Frame */}
        <div className="lg:col-span-8 flex justify-center">
          <div className="relative w-full max-w-[560px] bg-neutral-900 p-4 sm:p-6 rounded-2xl shadow-2xl border-4 border-neutral-800">
            {/* Screen Bezel */}
            <div className="relative w-full aspect-[4/3] bg-[#0c141f] rounded-xl overflow-hidden border-2 border-neutral-700 shadow-inner flex flex-col justify-between p-4 font-mono select-none">
              {/* Scanline CRT overlay */}
              <div
                className="absolute inset-0 pointer-events-none opacity-20"
                style={{
                  backgroundImage:
                    'repeating-linear-gradient(0deg, rgba(0,0,0,0.6) 0px, rgba(0,0,0,0.6) 1px, transparent 1px, transparent 2px)',
                }}
              />

              {/* CRT phosphor subtle glow */}
              <div className="relative z-10">
                {/* Title */}
                <div className="text-center">
                  <div className="text-emerald-400 font-bold text-xs sm:text-sm tracking-wider uppercase drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]">
                    * NES 2A03 DPCM AUDIO PLAYER *
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    MAPPER {config.mapper.toString().padStart(3, '0')} · {config.format} · {config.prgRomSize16k * 16}KB PRG
                  </div>
                </div>

                {/* Hardware Status Table */}
                <div className="mt-4 bg-black/40 border border-emerald-950 p-2.5 rounded text-[11px] text-emerald-300/90 space-y-1">
                  <div className="flex justify-between">
                    <span>APU $4010 [RATE]:</span>
                    <span className="font-bold text-emerald-400">
                      ${dpcmResult?.sampleAddressRegister !== undefined ? dpcmResult.sampleAddressRegister.toString(16).toUpperCase() : '0F'} ({Math.round(dpcmResult?.sampleRateHz || 33144)} Hz)
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>APU $4012 [ADDR]:</span>
                    <span className="font-bold text-emerald-400">
                      ${dpcmResult?.sampleAddressRegister.toString(16).padStart(2, '0').toUpperCase() || '00'} ($C000)
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>APU $4013 [LEN]:</span>
                    <span className="font-bold text-emerald-400">
                      ${dpcmResult?.hardwareLengthRegister.toString(16).padStart(2, '0').toUpperCase() || '00'} ({dpcmResult?.sampleLengthBytes || 0} B)
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>APU $4015 [DMC]:</span>
                    <span className={`font-bold ${isPlaying ? 'text-red-400 animate-pulse' : 'text-slate-500'}`}>
                      {isPlaying ? 'ACTIVE (BIT 4 ON)' : 'IDLE (WAITING)'}
                    </span>
                  </div>
                </div>
              </div>

              {/* VU Meters & 7-Bit DAC Level */}
              <div className="relative z-10 my-2">
                <div className="text-[10px] text-slate-400 mb-1 flex justify-between">
                  <span>SPECTRUM VU BARS</span>
                  <span>7-BIT DAC: {dacLevel} / 127</span>
                </div>

                {/* 8 VU Bars */}
                <div className="grid grid-cols-8 gap-1.5 h-16 items-end bg-black/50 p-2 rounded border border-emerald-950/60">
                  {vuBars.map((height, i) => (
                    <div key={i} className="flex flex-col-reverse gap-0.5 h-full">
                      {[0, 1, 2, 3, 4, 5, 6, 7].map((step) => {
                        const isLit = step <= height;
                        const isHigh = step >= 6;
                        return (
                          <div
                            key={step}
                            className={`w-full h-1 rounded-xs transition-opacity ${
                              isLit
                                ? isHigh
                                  ? 'bg-red-500 shadow-[0_0_4px_rgba(239,68,68,0.8)]'
                                  : 'bg-emerald-400 shadow-[0_0_4px_rgba(52,211,153,0.8)]'
                                : 'bg-slate-900/60 opacity-20'
                            }`}
                          />
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer status text */}
              <div className="relative z-10 flex items-center justify-between text-[10px] text-slate-400 border-t border-emerald-950/80 pt-2">
                <span className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-red-500 animate-ping' : 'bg-slate-700'}`} />
                  <span>{isPlaying ? 'PLAYING AUDIO...' : 'PRESS [A] TO PLAY'}</span>
                </span>
                <span className="text-amber-400 font-bold">
                  {isLooping ? 'LOOP MODE: ON' : 'LOOP: OFF'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Virtual NES Controller */}
        <div className="lg:col-span-4 flex flex-col items-center">
          <div className="w-full max-w-[340px] bg-neutral-800 p-4 rounded-xl border-2 border-neutral-700 shadow-xl flex flex-col gap-4">
            <div className="flex items-center justify-between text-neutral-400 text-xs font-mono font-bold border-b border-neutral-700 pb-2">
              <span className="text-red-500 tracking-wider">Nintendo</span>
              <span className="text-[10px] text-neutral-400">CONTROLLER I</span>
            </div>

            {/* D-Pad and Action Buttons Row */}
            <div className="flex items-center justify-between px-2">
              {/* D-Pad */}
              <div className="grid grid-cols-3 grid-rows-3 w-24 h-24 gap-0.5">
                <div />
                <button
                  onClick={() => onRateChange(1)}
                  className={`bg-neutral-900 hover:bg-neutral-700 rounded-t flex items-center justify-center text-white text-xs font-bold transition-colors ${
                    activeButton === 'UP' ? 'bg-neutral-600' : ''
                  }`}
                  title="Pitch Up"
                >
                  ▲
                </button>
                <div />
                <button
                  onClick={() => onRateChange(-1)}
                  className={`bg-neutral-900 hover:bg-neutral-700 rounded-l flex items-center justify-center text-white text-xs font-bold transition-colors ${
                    activeButton === 'LEFT' ? 'bg-neutral-600' : ''
                  }`}
                >
                  ◀
                </button>
                <div className="bg-neutral-950" />
                <button
                  onClick={() => onRateChange(1)}
                  className={`bg-neutral-900 hover:bg-neutral-700 rounded-r flex items-center justify-center text-white text-xs font-bold transition-colors ${
                    activeButton === 'RIGHT' ? 'bg-neutral-600' : ''
                  }`}
                >
                  ▶
                </button>
                <div />
                <button
                  onClick={() => onRateChange(-1)}
                  className={`bg-neutral-900 hover:bg-neutral-700 rounded-b flex items-center justify-center text-white text-xs font-bold transition-colors ${
                    activeButton === 'DOWN' ? 'bg-neutral-600' : ''
                  }`}
                  title="Pitch Down"
                >
                  ▼
                </button>
                <div />
              </div>

              {/* Action Buttons B and A */}
              <div className="flex items-center gap-3">
                <div className="flex flex-col items-center">
                  <button
                    onClick={stopPlay}
                    className={`w-10 h-10 rounded-full bg-red-700 hover:bg-red-600 border-2 border-red-900 shadow-md flex items-center justify-center text-white text-xs font-bold transition-transform active:scale-95 ${
                      activeButton === 'B' ? 'scale-95 bg-red-600' : ''
                    }`}
                  >
                    B
                  </button>
                  <span className="text-[9px] font-mono text-neutral-400 mt-1">STOP</span>
                </div>

                <div className="flex flex-col items-center">
                  <button
                    onClick={triggerPlay}
                    className={`w-10 h-10 rounded-full bg-red-600 hover:bg-red-500 border-2 border-red-800 shadow-lg shadow-red-950 flex items-center justify-center text-white text-xs font-bold transition-transform active:scale-95 ${
                      activeButton === 'A' ? 'scale-95 bg-red-500 ring-2 ring-red-400' : ''
                    }`}
                  >
                    A
                  </button>
                  <span className="text-[9px] font-mono text-red-400 font-bold mt-1">PLAY</span>
                </div>
              </div>
            </div>

            {/* Select & Start Row */}
            <div className="flex items-center justify-center gap-6 pt-2 border-t border-neutral-700/60">
              <div className="flex flex-col items-center">
                <button
                  onClick={() => setIsLooping((prev) => !prev)}
                  className={`w-12 h-3.5 bg-neutral-950 hover:bg-neutral-700 rounded border border-neutral-600 transition-colors ${
                    isLooping ? 'bg-amber-600 border-amber-500' : ''
                  }`}
                />
                <span className="text-[8px] font-mono text-neutral-400 mt-1">SELECT</span>
              </div>

              <div className="flex flex-col items-center">
                <button
                  onClick={() => setIsLooping((prev) => !prev)}
                  className={`w-12 h-3.5 bg-neutral-950 hover:bg-neutral-700 rounded border border-neutral-600 transition-colors ${
                    activeButton === 'START' ? 'bg-neutral-600' : ''
                  }`}
                />
                <span className="text-[8px] font-mono text-neutral-400 mt-1">START (LOOP)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
