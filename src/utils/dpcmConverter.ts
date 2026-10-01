import { DpcmPlaybackRate, DpcmConversionResult } from '../types/nes';

export const DPCM_RATES: DpcmPlaybackRate[] = [
  { index: 0, hexCode: '$0', ntscHz: 4181.71, palHz: 4177.40, cpuCycles: 428 },
  { index: 1, hexCode: '$1', ntscHz: 4709.93, palHz: 4696.63, cpuCycles: 380 },
  { index: 2, hexCode: '$2', ntscHz: 5264.04, palHz: 5261.41, cpuCycles: 340 },
  { index: 3, hexCode: '$3', ntscHz: 5593.04, palHz: 5579.22, cpuCycles: 320 },
  { index: 4, hexCode: '$4', ntscHz: 6257.95, palHz: 6250.40, cpuCycles: 286 },
  { index: 5, hexCode: '$5', ntscHz: 7046.35, palHz: 7044.95, cpuCycles: 254 },
  { index: 6, hexCode: '$6', ntscHz: 7919.35, palHz: 7917.18, cpuCycles: 226 },
  { index: 7, hexCode: '$7', ntscHz: 8363.42, palHz: 8397.01, cpuCycles: 214 },
  { index: 8, hexCode: '$8', ntscHz: 9419.86, palHz: 9446.63, cpuCycles: 190 },
  { index: 9, hexCode: '$9', ntscHz: 11186.08, palHz: 11233.83, cpuCycles: 160 },
  { index: 10, hexCode: '$A', ntscHz: 12604.04, palHz: 12595.51, cpuCycles: 142 },
  { index: 11, hexCode: '$B', ntscHz: 13982.60, palHz: 14089.89, cpuCycles: 128 },
  { index: 12, hexCode: '$C', ntscHz: 16884.65, palHz: 16965.38, cpuCycles: 106 },
  { index: 13, hexCode: '$D', ntscHz: 21306.82, palHz: 21315.47, cpuCycles: 84 },
  { index: 14, hexCode: '$E', ntscHz: 24857.96, palHz: 25191.02, cpuCycles: 72 },
  { index: 15, hexCode: '$F', ntscHz: 33143.94, palHz: 33252.14, cpuCycles: 54 },
];

export interface DpcmConvertOptions {
  rateIndex: number;          // 0 to 15
  tvSystem: 'ntsc' | 'pal';
  volumeScale: number;        // 0.1 to 2.0 (1.0 = 100%)
  dither: boolean;
  normalize: boolean;
  clampToSingleChunk: boolean; // Clamp to 4081 bytes if true, or pad to NES (L*16)+1
  targetAddress: number;       // default 0xC000
}

/**
 * Resamples an input Float32Array PCM audio buffer to the target NES DPCM frequency
 */
export function resamplePcm(
  source: Float32Array,
  sourceSampleRate: number,
  targetSampleRate: number
): Float32Array {
  if (sourceSampleRate === targetSampleRate) return source;

  const ratio = sourceSampleRate / targetSampleRate;
  const newLength = Math.max(1, Math.round(source.length / ratio));
  const result = new Float32Array(newLength);

  for (let i = 0; i < newLength; i++) {
    const srcIndex = i * ratio;
    const indexLow = Math.floor(srcIndex);
    const indexHigh = Math.min(indexLow + 1, source.length - 1);
    const fraction = srcIndex - indexLow;

    // Linear interpolation
    result[i] = source[indexLow] * (1 - fraction) + source[indexHigh] * fraction;
  }

  return result;
}

/**
 * Converts an AudioBuffer (or Float32Array) to NES 2A03 1-bit DPCM bytes
 */
export function convertAudioToNesDpcm(
  pcmData: Float32Array,
  sourceSampleRate: number,
  options: DpcmConvertOptions
): DpcmConversionResult {
  const rateInfo = DPCM_RATES[options.rateIndex] || DPCM_RATES[15];
  const targetHz = options.tvSystem === 'pal' ? rateInfo.palHz : rateInfo.ntscHz;

  // 1. Resample to NES hardware rate
  const resampled = resamplePcm(pcmData, sourceSampleRate, targetHz);

  // 2. Normalization & Pre-amplification
  let peak = 0;
  for (let i = 0; i < resampled.length; i++) {
    const absVal = Math.abs(resampled[i]);
    if (absVal > peak) peak = absVal;
  }

  const normMultiplier = options.normalize && peak > 0.001 ? (0.98 / peak) * options.volumeScale : options.volumeScale;

  // 3. Map PCM values [-1.0 .. 1.0] to NES 7-bit DAC counter range [0 .. 127]
  const targetLevels = new Float32Array(resampled.length);
  for (let i = 0; i < resampled.length; i++) {
    const val = Math.max(-1, Math.min(1, resampled[i] * normMultiplier));
    // Center at 64, range 0..127
    targetLevels[i] = (val + 1) * 63.5;
  }

  // 4. Delta Modulation algorithm (1-bit step: +2 if bit 1, -2 if bit 0)
  // NES APU DPCM DAC counter is 7 bits (0 to 127). Step size is 2.
  // Bits in byte are output LSB first: bit 0, then 1, ..., bit 7.
  let dacCounter = 64; // Initial DAC level
  const totalBits = targetLevels.length;
  const rawBytesCount = Math.ceil(totalBits / 8);

  // Determine valid NES length: (L * 16) + 1 bytes
  let validBytesCount = rawBytesCount;
  if (options.clampToSingleChunk && validBytesCount > 4081) {
    validBytesCount = 4081;
  }
  // Align to (L * 16) + 1
  const remainder = (validBytesCount - 1) % 16;
  if (remainder !== 0) {
    validBytesCount += (16 - remainder);
  }
  if (validBytesCount < 1) validBytesCount = 1;

  const dmcBytes = new Uint8Array(validBytesCount);
  const pcmReconstructed = new Float32Array(validBytesCount * 8);

  let bitCursor = 0;
  dacCounter = 64;

  for (let b = 0; b < validBytesCount; b++) {
    let byteVal = 0;

    for (let bit = 0; bit < 8; bit++) {
      const sampleIndex = bitCursor;
      const targetLevel = sampleIndex < targetLevels.length ? targetLevels[sampleIndex] : 64;

      let ditherOffset = 0;
      if (options.dither) {
        ditherOffset = (Math.random() - 0.5) * 1.5;
      }

      let bitValue = 0;
      if (targetLevel + ditherOffset >= dacCounter) {
        // Output 1: Increment DAC by 2
        bitValue = 1;
        dacCounter = Math.min(127, dacCounter + 2);
      } else {
        // Output 0: Decrement DAC by 2
        bitValue = 0;
        dacCounter = Math.max(0, dacCounter - 2);
      }

      byteVal |= (bitValue << bit);

      // Reconstructed normalized level [-1.0 .. 1.0]
      pcmReconstructed[bitCursor] = (dacCounter - 64) / 64.0;
      bitCursor++;
    }

    dmcBytes[b] = byteVal;
  }

  // Calculate NES hardware register values:
  // Register $4012 (Sample Address): %11AAAAAA.AA000000 = $C000 + (A * 64)
  const targetAddress = options.targetAddress || 0xc000;
  const sampleAddressReg = Math.max(0, Math.min(255, Math.floor((targetAddress - 0xc000) / 64)));

  // Register $4013 (Sample Length): %LLLLLLLL.0001 = (L * 16) + 1 bytes
  const hardwareLengthReg = Math.max(0, Math.min(255, Math.floor((validBytesCount - 1) / 16)));

  const actualDuration = (validBytesCount * 8) / targetHz;

  return {
    dmcData: dmcBytes,
    sampleLengthBytes: validBytesCount,
    hardwareLengthRegister: hardwareLengthReg,
    sampleAddressRegister: sampleAddressReg,
    targetMemoryAddress: targetAddress,
    durationSeconds: actualDuration,
    sampleRateHz: targetHz,
    pcmReconstructed,
    originalPcm: pcmData,
    originalSampleRate: sourceSampleRate,
    peakVolume: peak,
    bitrateKbps: Math.round((targetHz / 1000) * 10) / 10,
  };
}

/**
 * Generates CA65 / ASM6 / NESASM assembly code from raw DPCM bytes
 */
export function generateDpcmAssembly(
  dmcData: Uint8Array,
  labelName: string = 'dpcm_sample',
  bytesPerLine: number = 16
): string {
  const lines: string[] = [
    `; ========================================================`,
    `; NES 2A03 DPCM Sample Data: ${labelName}`,
    `; Total Length: ${dmcData.length} bytes (${((dmcData.length - 1) / 16)} × 16 + 1)`,
    `; Recommended Target Address: $C000 - $FFC0`,
    `; ========================================================`,
    `.export ${labelName}`,
    `${labelName}:`,
  ];

  for (let i = 0; i < dmcData.length; i += bytesPerLine) {
    const chunk = dmcData.slice(i, Math.min(i + bytesPerLine, dmcData.length));
    const hexValues = Array.from(chunk)
      .map((b) => '$' + b.toString(16).padStart(2, '0').toUpperCase())
      .join(', ');
    lines.push(`  .byte ${hexValues}`);
  }

  lines.push(`${labelName}_end:`);
  return lines.join('\n');
}

/**
 * Generates C Header (cc65 / neslib compatible)
 */
export function generateDpcmCHeader(
  dmcData: Uint8Array,
  result: DpcmConversionResult,
  identifier: string = 'NES_AUDIO'
): string {
  const safeId = identifier.toUpperCase().replace(/[^A-Z0-9_]/g, '_');
  return `/**
 * NES 2A03 DPCM Sample Definition
 * Generated by NES Audio & ROM Header Studio
 */
#ifndef _${safeId}_DMC_H_
#define _${safeId}_DMC_H_

#define ${safeId}_DMC_SIZE       ${dmcData.length}
#define ${safeId}_REG_4010_RATE  0x${result.sampleAddressRegister.toString(16).toUpperCase()}
#define ${safeId}_REG_4012_ADDR  0x${result.sampleAddressRegister.toString(16).padStart(2, '0').toUpperCase()}
#define ${safeId}_REG_4013_LEN   0x${result.hardwareLengthRegister.toString(16).padStart(2, '0').toUpperCase()}
#define ${safeId}_FREQ_HZ        ${Math.round(result.sampleRateHz)}

/* Playback trigger helper for CC65 / Neslib:
   POKE(0x4010, ${result.sampleAddressRegister} | 0x00); // Rate without IRQ/Loop
   POKE(0x4012, 0x${result.sampleAddressRegister.toString(16).padStart(2, '0').toUpperCase()}); // Address ($C000 + A*64)
   POKE(0x4013, 0x${result.hardwareLengthRegister.toString(16).padStart(2, '0').toUpperCase()}); // Length ((L*16)+1)
   POKE(0x4015, 0x1F); // Enable DMC channel (bit 4)
*/

extern const unsigned char ${identifier.toLowerCase()}_dmc[${dmcData.length}];

#endif /* _${safeId}_DMC_H_ */
`;
}
