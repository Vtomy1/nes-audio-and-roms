import { NesHeaderConfig, HeaderByteInfo, NesMapperInfo } from '../types/nes';

export const POPULAR_MAPPERS: NesMapperInfo[] = [
  {
    id: 0,
    name: 'NROM (Mapper 000)',
    boardClass: 'NROM-128 / NROM-256',
    defaultPrgK: 32,
    defaultChrK: 8,
    description: 'Standard homebrew & basic early titles (Super Mario Bros., Donkey Kong). Ideal for standalone DPCM audio players.',
  },
  {
    id: 1,
    name: 'MMC1 / SxROM (Mapper 001)',
    boardClass: 'SAROM, SBROM, SCROM, SEROM, SGROM, SKROM, SLROM, SNROM',
    defaultPrgK: 128,
    defaultChrK: 128,
    description: 'Nintendo multi-memory controller (Zelda, Metroid, Mega Man 2). Bank-switching for PRG & CHR.',
  },
  {
    id: 2,
    name: 'UNROM / UOROM (Mapper 002)',
    boardClass: 'UxROM',
    defaultPrgK: 128,
    defaultChrK: 0,
    description: 'Discrete logic switchable PRG banks + 8KB CHR-RAM. Common for chiptune and demo ROMs (Castlevania, Contra).',
  },
  {
    id: 3,
    name: 'CNROM (Mapper 003)',
    boardClass: 'CNROM',
    defaultPrgK: 32,
    defaultChrK: 32,
    description: 'Discrete logic 8KB CHR bank switching (Gradius, Adventure Island).',
  },
  {
    id: 4,
    name: 'MMC3 / TxROM (Mapper 004)',
    boardClass: 'TLROM, TSROM, TKROM, TNROM',
    defaultPrgK: 256,
    defaultChrK: 128,
    description: 'Advanced IRQ counter, scanline timing & large PRG banks (Super Mario Bros. 3, Mega Man 3-6).',
  },
  {
    id: 5,
    name: 'MMC5 / ExROM (Mapper 005)',
    boardClass: 'ELROM, EKROM, ETROM, EWROM',
    audioExpansion: 'MMC5 Expansion Sound (2 extra Square channels + 8-bit PCM DAC)',
    defaultPrgK: 512,
    defaultChrK: 256,
    description: 'Ultimate enhancement chip with built-in hardware 8-bit PCM audio channel and 2 extra square wave generators (Castlevania III US).',
  },
  {
    id: 19,
    name: 'Namco 163 (Mapper 019)',
    boardClass: 'Namco 106/163',
    audioExpansion: 'Namco 163 Wavetable Synth (1 to 8 internal 4-bit wavetable audio channels)',
    defaultPrgK: 256,
    defaultChrK: 128,
    description: 'Famicom expansion chip with up to 8 custom wavetable audio channels (Final Lap, Megami Tensei II).',
  },
  {
    id: 20,
    name: 'Famicom Disk System (Mapper 020)',
    boardClass: 'FDS RAM Adapter',
    audioExpansion: 'FDS Custom Wavetable Synth with hardware Frequency Modulation (FM)',
    defaultPrgK: 32,
    defaultChrK: 0,
    description: 'Nintendo FDS sound synthesis with 64-step wavetable and frequency modulation table.',
  },
  {
    id: 24,
    name: 'Konami VRC6a (Mapper 024)',
    boardClass: 'VRC6a',
    audioExpansion: 'VRC6 Audio (2 extra 8-duty Pulse channels + 1 Sawtooth channel)',
    defaultPrgK: 256,
    defaultChrK: 256,
    description: 'Konami custom audio chip producing rich bass saw and dual pulse chiptunes (Akumajou Densetsu / Castlevania III JP).',
  },
  {
    id: 26,
    name: 'Konami VRC6b (Mapper 026)',
    boardClass: 'VRC6b',
    audioExpansion: 'VRC6 Audio (2 extra 8-duty Pulse channels + 1 Sawtooth channel)',
    defaultPrgK: 256,
    defaultChrK: 256,
    description: 'Alternate pinout of VRC6 used in Madara and Esper Dream 2.',
  },
  {
    id: 69,
    name: 'Sunsoft 5B (Mapper 069)',
    boardClass: 'FME-7 with Sunsoft 5B',
    audioExpansion: 'Sunsoft 5B Sound (YM2149 / AY-3-8910 derivative: 3 square channels + white noise)',
    defaultPrgK: 256,
    defaultChrK: 256,
    description: 'High-end Yamaha-style SSG audio synthesis chip (Gimmick!).',
  },
  {
    id: 85,
    name: 'Konami VRC7 (Mapper 085)',
    boardClass: 'VRC7',
    audioExpansion: 'VRC7 FM Synth (6 channels of 2-operator FM synthesis, derived from Yamaha YM2413 OPLL)',
    defaultPrgK: 256,
    defaultChrK: 256,
    description: 'Legendary 6-channel FM synthesizer chip on Famicom (Lagrange Point).',
  },
];

export const EXPANSION_AUDIO_DEVICES = [
  { id: 0x00, name: 'Standard Controller (No audio expansion)', label: 'Standard 2A03 APU' },
  { id: 0x20, name: 'Konami VRC6 Sound Chip', label: 'VRC6 Audio' },
  { id: 0x21, name: 'Konami VRC7 FM Sound Chip', label: 'VRC7 FM Audio' },
  { id: 0x22, name: 'Sunsoft 5B SSG Sound Chip', label: 'Sunsoft 5B Audio' },
  { id: 0x23, name: 'Namco 163 Wavetable Sound Chip', label: 'Namco 163 Audio' },
  { id: 0x24, name: 'Nintendo MMC5 Audio Expansion', label: 'MMC5 8-bit PCM + Pulse' },
  { id: 0x25, name: 'Famicom Disk System Audio', label: 'FDS FM Wavetable' },
];

export const DEFAULT_HEADER_CONFIG: NesHeaderConfig = {
  format: 'NES2.0',
  prgRomSize16k: 2, // 32 KB PRG
  chrRomSize8k: 1,  // 8 KB CHR
  mapper: 0,        // NROM
  submapper: 0,
  mirroring: 'horizontal',
  hasBattery: false,
  hasTrainer: false,
  isFourScreen: false,
  isVsUnisystem: false,
  isPlayChoice10: false,
  prgRamSize8k: 0,
  prgNvramShift: 0,
  prgRamShift: 0,
  chrRamShift: 0,
  chrNvramShift: 0,
  tvSystem: 'ntsc',
  expansionAudioDevice: 0x00,
};

/**
 * Encodes a NesHeaderConfig into a strict 16-byte Uint8Array
 */
export function buildNesHeader(config: NesHeaderConfig): Uint8Array {
  const header = new Uint8Array(16);

  // Bytes 0-3: Identification "NES\x1A"
  header[0] = 0x4e; // 'N'
  header[1] = 0x45; // 'E'
  header[2] = 0x53; // 'S'
  header[3] = 0x1a; // MS-DOS EOF

  // Byte 4: PRG-ROM size (LSB in 16KB units)
  header[4] = config.prgRomSize16k & 0xff;

  // Byte 5: CHR-ROM size (LSB in 8KB units)
  header[5] = config.chrRomSize8k & 0xff;

  // Byte 6: Flags 6
  let flags6 = 0;
  if (config.mirroring === 'vertical') flags6 |= 0x01;
  if (config.hasBattery) flags6 |= 0x02;
  if (config.hasTrainer) flags6 |= 0x04;
  if (config.isFourScreen) flags6 |= 0x08;
  flags6 |= (config.mapper & 0x0f) << 4; // Mapper D0..D3
  header[6] = flags6;

  // Byte 7: Flags 7
  let flags7 = 0;
  if (config.isVsUnisystem) flags7 |= 0x01;
  if (config.isPlayChoice10) flags7 |= 0x02;
  if (config.format === 'NES2.0') {
    flags7 |= 0x08; // Bits 2-3 = 10 in binary (0x08) indicates NES 2.0
  }
  flags7 |= config.mapper & 0xf0; // Mapper D4..D7
  header[7] = flags7;

  if (config.format === 'NES2.0') {
    // Byte 8: Mapper MSB (D8..D11) & Submapper
    const mapperMsb = (config.mapper >> 8) & 0x0f;
    const submapper = config.submapper & 0x0f;
    header[8] = mapperMsb | (submapper << 4);

    // Byte 9: PRG-ROM / CHR-ROM size MSBs
    const prgMsb = (config.prgRomSize16k >> 8) & 0x0f;
    const chrMsb = (config.chrRomSize8k >> 8) & 0x0f;
    header[9] = prgMsb | (chrMsb << 4);

    // Byte 10: PRG-RAM / PRG-NVRAM size (log2 shift: 64 << shift)
    header[10] = (config.prgRamShift & 0x0f) | ((config.prgNvramShift & 0x0f) << 4);

    // Byte 11: CHR-RAM / CHR-NVRAM size
    header[11] = (config.chrRamShift & 0x0f) | ((config.chrNvramShift & 0x0f) << 4);

    // Byte 12: CPU/PPU timing
    let timingByte = 0;
    if (config.tvSystem === 'pal') timingByte = 1;
    else if (config.tvSystem === 'multi') timingByte = 2;
    else if (config.tvSystem === 'dendy') timingByte = 3;
    header[12] = timingByte;

    // Byte 13: System Type (0 = standard NES/Famicom)
    header[13] = 0x00;

    // Byte 14: Miscellaneous ROMs
    header[14] = 0x00;

    // Byte 15: Default Expansion Device (Audio or peripherals)
    header[15] = config.expansionAudioDevice & 0x3f;
  } else {
    // Standard iNES 1.0 format
    // Byte 8: PRG-RAM size in 8KB units (0 means 8KB for compatibility)
    header[8] = config.prgRamSize8k & 0xff;

    // Byte 9: TV system (0: NTSC, 1: PAL)
    header[9] = config.tvSystem === 'pal' ? 1 : 0;

    // Byte 10: TV system, PRG-RAM presence (Unofficial/Rarely used, keep 0)
    header[10] = 0x00;

    // Bytes 11-15: Zero padding (cleans up any DiskDude pollution)
    header[11] = 0;
    header[12] = 0;
    header[13] = 0;
    header[14] = 0;
    header[15] = 0;
  }

  return header;
}

/**
 * Deconstructs 16 header bytes into detailed, human-readable breakdowns
 */
export function getHeaderByteBreakdown(header: Uint8Array, config: NesHeaderConfig): HeaderByteInfo[] {
  const bytes: HeaderByteInfo[] = [];

  const descriptions = [
    { label: 'Magic Identification [0]', cat: 'magic' as const, desc: "Magic byte 'N' (0x4E). Header identifier." },
    { label: 'Magic Identification [1]', cat: 'magic' as const, desc: "Magic byte 'E' (0x45). Header identifier." },
    { label: 'Magic Identification [2]', cat: 'magic' as const, desc: "Magic byte 'S' (0x53). Header identifier." },
    { label: 'Magic EOF Terminator [3]', cat: 'magic' as const, desc: 'MS-DOS End-Of-File marker 0x1A. Standard NES identifier terminator.' },
    { label: 'PRG-ROM Size [4]', cat: 'prg_chr' as const, desc: `${header[4]} × 16 KB = ${header[4] * 16} KB Program ROM.` },
    { label: 'CHR-ROM Size [5]', cat: 'prg_chr' as const, desc: `${header[5]} × 8 KB = ${header[5] * 8} KB Character ROM (${header[5] === 0 ? 'Using CHR-RAM' : 'Pattern table graphics'}).` },
    { label: 'Flags 6 (Mirroring & Mapper Low) [6]', cat: 'flags' as const, desc: `Mapper low nibble: ${(header[6] >> 4) & 0x0f}, Mirroring: ${header[6] & 1 ? 'Vertical' : 'Horizontal'}, Battery: ${header[6] & 2 ? 'Yes' : 'No'}, Trainer: ${header[6] & 4 ? '512B' : 'None'}.` },
    { label: 'Flags 7 (Format & Mapper Mid) [7]', cat: 'flags' as const, desc: `Format: ${(header[7] & 0x0c) === 0x08 ? 'NES 2.0' : 'iNES 1.0'}, Mapper mid nibble: ${(header[7] >> 4) & 0x0f}, VS: ${header[7] & 1 ? 'Yes' : 'No'}.` },
    {
      label: config.format === 'NES2.0' ? 'Mapper High & Submapper [8]' : 'PRG-RAM Size [8]',
      cat: 'mapper' as const,
      desc: config.format === 'NES2.0'
        ? `Submapper: ${(header[8] >> 4) & 0x0f}, Mapper high nibble: ${header[8] & 0x0f}. Total Mapper = ${config.mapper}.`
        : `PRG-RAM Size: ${header[8] || 1} × 8 KB = ${(header[8] || 1) * 8} KB.`,
    },
    {
      label: config.format === 'NES2.0' ? 'PRG/CHR ROM Size MSB [9]' : 'TV System [9]',
      cat: 'timing' as const,
      desc: config.format === 'NES2.0'
        ? `PRG size MSB: ${header[9] & 0x0f}, CHR size MSB: ${(header[9] >> 4) & 0x0f}.`
        : `TV System: ${header[9] & 1 ? 'PAL' : 'NTSC'}.`,
    },
    {
      label: config.format === 'NES2.0' ? 'PRG-RAM / NVRAM Size [10]' : 'Unofficial Flags 10 [10]',
      cat: 'flags' as const,
      desc: config.format === 'NES2.0'
        ? `PRG RAM: ${header[10] & 0x0f ? 64 << (header[10] & 0x0f) : 0} bytes, NVRAM: ${header[10] >> 4 ? 64 << (header[10] >> 4) : 0} bytes.`
        : 'TV system / PRG-RAM presence (rarely used in iNES 1.0).',
    },
    {
      label: config.format === 'NES2.0' ? 'CHR-RAM / NVRAM Size [11]' : 'Reserved [11]',
      cat: 'flags' as const,
      desc: config.format === 'NES2.0'
        ? `CHR RAM: ${header[11] & 0x0f ? 64 << (header[11] & 0x0f) : 0} bytes, NVRAM: ${header[11] >> 4 ? 64 << (header[11] >> 4) : 0} bytes.`
        : 'Reserved zero padding.',
    },
    {
      label: config.format === 'NES2.0' ? 'CPU / PPU Timing [12]' : 'Reserved [12]',
      cat: 'timing' as const,
      desc: config.format === 'NES2.0'
        ? `Timing mode: ${['NTSC (60 Hz)', 'PAL (50 Hz)', 'Multi-region', 'Dendy'][header[12] & 3] || 'NTSC'}.`
        : 'Reserved zero padding.',
    },
    {
      label: config.format === 'NES2.0' ? 'System Type [13]' : 'Reserved [13]',
      cat: 'flags' as const,
      desc: config.format === 'NES2.0' ? 'System type (0 = Standard NES/Famicom, 1 = Vs. System, 2 = PlayChoice-10, 3 = Extended).' : 'Reserved zero padding.',
    },
    {
      label: config.format === 'NES2.0' ? 'Miscellaneous ROMs [14]' : 'Reserved [14]',
      cat: 'flags' as const,
      desc: config.format === 'NES2.0' ? `Miscellaneous ROM count: ${header[14] & 3}.` : 'Reserved zero padding.',
    },
    {
      label: config.format === 'NES2.0' ? 'Default Expansion Device [15]' : 'Reserved [15]',
      cat: 'expansion' as const,
      desc: config.format === 'NES2.0'
        ? `Expansion Device: 0x${header[15].toString(16).padStart(2, '0').toUpperCase()} (${EXPANSION_AUDIO_DEVICES.find((d) => d.id === (header[15] & 0x3f))?.name || 'Standard 2A03'})`
        : 'Reserved zero padding.',
    },
  ];

  for (let i = 0; i < 16; i++) {
    const val = header[i] ?? 0;
    bytes.push({
      index: i,
      label: descriptions[i]?.label || `Byte ${i}`,
      value: val,
      hex: '0x' + val.toString(16).padStart(2, '0').toUpperCase(),
      binary: val.toString(2).padStart(8, '0'),
      category: descriptions[i]?.cat || 'padding',
      description: descriptions[i]?.desc || 'Reserved',
    });
  }

  return bytes;
}

/**
 * Parses any 16-byte or full .nes buffer into a NesHeaderConfig
 */
export function parseNesHeader(buffer: ArrayBuffer | Uint8Array): {
  config: NesHeaderConfig;
  isValid: boolean;
  warnings: string[];
} {
  const bytes = buffer instanceof Uint8Array ? buffer.slice(0, 16) : new Uint8Array(buffer, 0, 16);
  const warnings: string[] = [];

  // Check magic "NES\x1A"
  if (bytes[0] !== 0x4e || bytes[1] !== 0x45 || bytes[2] !== 0x53 || bytes[3] !== 0x1a) {
    return {
      config: DEFAULT_HEADER_CONFIG,
      isValid: false,
      warnings: ['Invalid NES header magic string. Expected ASCII "NES" followed by 0x1A.'],
    };
  }

  const isNes2 = (bytes[7] & 0x0c) === 0x08;

  let mapper = (bytes[6] >> 4) | (bytes[7] & 0xf0);
  let submapper = 0;

  if (isNes2) {
    mapper |= (bytes[8] & 0x0f) << 8;
    submapper = (bytes[8] >> 4) & 0x0f;
  } else {
    // Check for "DiskDude!" or other legacy dirty headers in bytes 7-15
    const hasDirtyPadding = bytes.slice(12, 16).some((b) => b !== 0);
    if (hasDirtyPadding && !isNes2) {
      warnings.push('Legacy iNES 1.0 header contained dirty padding bytes (DiskDude artifact). Sanitized to standard zero padding.');
      // If dirty, high nibble in byte 7 was sometimes corrupted
      mapper = mapper & 0x0f;
    }
  }

  const prgRom16k = isNes2 ? bytes[4] | ((bytes[9] & 0x0f) << 8) : bytes[4];
  const chrRom8k = isNes2 ? bytes[5] | (((bytes[9] >> 4) & 0x0f) << 8) : bytes[5];

  let mirroring: NesHeaderConfig['mirroring'] = 'horizontal';
  if (bytes[6] & 0x08) {
    mirroring = 'four_screen';
  } else if (bytes[6] & 0x01) {
    mirroring = 'vertical';
  }

  let tvSystem: NesHeaderConfig['tvSystem'] = 'ntsc';
  if (isNes2) {
    const tvCode = bytes[12] & 0x03;
    if (tvCode === 1) tvSystem = 'pal';
    else if (tvCode === 2) tvSystem = 'multi';
    else if (tvCode === 3) tvSystem = 'dendy';
  } else {
    if (bytes[9] & 0x01) tvSystem = 'pal';
  }

  const config: NesHeaderConfig = {
    format: isNes2 ? 'NES2.0' : 'iNES',
    prgRomSize16k: prgRom16k || 1,
    chrRomSize8k: chrRom8k,
    mapper,
    submapper,
    mirroring,
    hasBattery: Boolean(bytes[6] & 0x02),
    hasTrainer: Boolean(bytes[6] & 0x04),
    isFourScreen: Boolean(bytes[6] & 0x08),
    isVsUnisystem: Boolean(bytes[7] & 0x01),
    isPlayChoice10: Boolean(bytes[7] & 0x02),
    prgRamSize8k: isNes2 ? 0 : bytes[8],
    prgRamShift: isNes2 ? bytes[10] & 0x0f : 0,
    prgNvramShift: isNes2 ? (bytes[10] >> 4) & 0x0f : 0,
    chrRamShift: isNes2 ? bytes[11] & 0x0f : 0,
    chrNvramShift: isNes2 ? (bytes[11] >> 4) & 0x0f : 0,
    tvSystem,
    expansionAudioDevice: isNes2 ? bytes[15] & 0x3f : 0x00,
  };

  return {
    config,
    isValid: true,
    warnings,
  };
}
