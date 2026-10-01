/**
 * NES ROM & Audio Specification Types
 * Supports iNES 1.0 and NES 2.0 (official NesDev specification)
 */

export type NesRomFormat = 'iNES' | 'NES2.0';

export type MirroringType = 'horizontal' | 'vertical' | 'four_screen' | 'single_screen';

export type TvSystem = 'ntsc' | 'pal' | 'multi' | 'dendy';

export interface NesHeaderConfig {
  format: NesRomFormat;
  prgRomSize16k: number; // In 16KB units (e.g. 1 = 16KB, 2 = 32KB)
  chrRomSize8k: number;  // In 8KB units (0 = CHR RAM)
  mapper: number;        // Mapper number 0 - 4095
  submapper: number;     // Submapper 0 - 15 (NES 2.0)
  mirroring: MirroringType;
  hasBattery: boolean;   // Battery-backed PRG RAM
  hasTrainer: boolean;   // 512-byte trainer at $7000-$71FF
  isFourScreen: boolean; // Four-screen VRAM
  isVsUnisystem: boolean;
  isPlayChoice10: boolean;
  prgRamSize8k: number;  // In 8KB units (iNES Byte 8)
  // NES 2.0 specifics
  prgNvramShift: number; // 64 << shift bytes
  prgRamShift: number;   // 64 << shift bytes
  chrRamShift: number;
  chrNvramShift: number;
  tvSystem: TvSystem;
  expansionAudioDevice: number; // Byte 15 in NES 2.0
}

export interface HeaderByteInfo {
  index: number;
  label: string;
  value: number;
  hex: string;
  binary: string;
  category: 'magic' | 'prg_chr' | 'flags' | 'mapper' | 'timing' | 'expansion' | 'padding';
  description: string;
}

export interface NesMapperInfo {
  id: number;
  name: string;
  boardClass: string;
  audioExpansion?: string;
  defaultPrgK: number;
  defaultChrK: number;
  description: string;
}

export interface DpcmPlaybackRate {
  index: number;
  hexCode: string;
  ntscHz: number;
  palHz: number;
  cpuCycles: number;
}

export interface DpcmConversionResult {
  dmcData: Uint8Array;
  sampleLengthBytes: number;
  hardwareLengthRegister: number; // $4013 value: (length / 16) - 1 or clamped
  sampleAddressRegister: number;  // $4012 value: (address - $C000) / 64
  targetMemoryAddress: number;    // e.g. 0xC000
  durationSeconds: number;
  sampleRateHz: number;
  pcmReconstructed: Float32Array; // Reconstructed PCM waveform for preview
  originalPcm: Float32Array;      // Normalized mono PCM
  originalSampleRate: number;
  peakVolume: number;
  bitrateKbps: number;
}

export interface AudioPreset {
  id: string;
  name: string;
  category: 'sfx' | 'drums' | 'speech' | 'synth';
  description: string;
  durationSec: number;
  generator: (ctx: AudioContext) => AudioBuffer;
}
