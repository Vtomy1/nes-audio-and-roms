import { AudioPreset } from '../types/nes';

export const AUDIO_PRESETS: AudioPreset[] = [
  {
    id: 'coin_pickup',
    name: '8-Bit Coin Chime',
    category: 'sfx',
    description: 'Classic dual-frequency square wave coin chime (B5 followed by E6).',
    durationSec: 0.35,
    generator: (ctx: AudioContext): AudioBuffer => {
      const sampleRate = ctx.sampleRate;
      const length = Math.floor(sampleRate * 0.35);
      const buffer = ctx.createBuffer(1, length, sampleRate);
      const data = buffer.getChannelData(0);

      const t1 = Math.floor(length * 0.28);
      for (let i = 0; i < length; i++) {
        const t = i / sampleRate;
        const freq = i < t1 ? 987.77 : 1318.51; // B5 then E6
        // Square wave with slight decay
        const phase = (t * freq) % 1;
        const rawSquare = phase < 0.5 ? 0.7 : -0.7;
        const decay = Math.max(0, 1 - (i / length) * 0.9);
        data[i] = rawSquare * decay;
      }
      return buffer;
    },
  },
  {
    id: 'retro_jump',
    name: 'Retro 8-Bit Jump',
    category: 'sfx',
    description: 'Upward pitch sweep pulse wave iconic for 8-bit platformers.',
    durationSec: 0.3,
    generator: (ctx: AudioContext): AudioBuffer => {
      const sampleRate = ctx.sampleRate;
      const length = Math.floor(sampleRate * 0.3);
      const buffer = ctx.createBuffer(1, length, sampleRate);
      const data = buffer.getChannelData(0);

      let phase = 0;
      for (let i = 0; i < length; i++) {
        const progress = i / length;
        const freq = 130 + Math.pow(progress, 1.8) * 580; // Sweeps 130 Hz -> 710 Hz
        phase += (freq / sampleRate);
        const wave = (phase % 1) < 0.25 ? 0.8 : -0.8; // 25% duty cycle
        const env = Math.sin(progress * Math.PI);
        data[i] = wave * env;
      }
      return buffer;
    },
  },
  {
    id: 'orchestra_hit',
    name: 'NES Orchestral Hit',
    category: 'synth',
    description: 'Heavy synthesized brass chord hit popular in late-80s arcade and NES soundtracks.',
    durationSec: 0.45,
    generator: (ctx: AudioContext): AudioBuffer => {
      const sampleRate = ctx.sampleRate;
      const length = Math.floor(sampleRate * 0.45);
      const buffer = ctx.createBuffer(1, length, sampleRate);
      const data = buffer.getChannelData(0);

      // Minor chord: C4 (261.63), Eb4 (311.13), G4 (392.00), C5 (523.25)
      const freqs = [261.63, 311.13, 392.0, 523.25];
      for (let i = 0; i < length; i++) {
        const t = i / sampleRate;
        const env = Math.exp(-t * 8.5);
        let sum = 0;
        for (const f of freqs) {
          const square = ((t * f) % 1 < 0.5 ? 1 : -1) * 0.25;
          sum += square;
        }
        data[i] = sum * env;
      }
      return buffer;
    },
  },
  {
    id: 'chiptune_arp',
    name: 'Fast Chiptune Arp',
    category: 'synth',
    description: 'Rapid 3-note arpeggio common in Sunsoft and Konami Famicom soundtracks.',
    durationSec: 0.4,
    generator: (ctx: AudioContext): AudioBuffer => {
      const sampleRate = ctx.sampleRate;
      const length = Math.floor(sampleRate * 0.4);
      const buffer = ctx.createBuffer(1, length, sampleRate);
      const data = buffer.getChannelData(0);

      // C major triad: C5 (523.25), E5 (659.25), G5 (783.99) cycling at 50 Hz
      const triad = [523.25, 659.25, 783.99];
      for (let i = 0; i < length; i++) {
        const t = i / sampleRate;
        const step = Math.floor(t * 30) % 3;
        const freq = triad[step];
        const phase = (t * freq) % 1;
        const wave = phase < 0.5 ? 0.75 : -0.75;
        const env = Math.max(0, 1 - (i / length) * 0.85);
        data[i] = wave * env;
      }
      return buffer;
    },
  },
  {
    id: 'retro_kick',
    name: 'NES DPCM Kick Drum',
    category: 'drums',
    description: 'Punchy low-frequency downward sweep tailored for DPCM drum playback.',
    durationSec: 0.25,
    generator: (ctx: AudioContext): AudioBuffer => {
      const sampleRate = ctx.sampleRate;
      const length = Math.floor(sampleRate * 0.25);
      const buffer = ctx.createBuffer(1, length, sampleRate);
      const data = buffer.getChannelData(0);

      let phase = 0;
      for (let i = 0; i < length; i++) {
        const progress = i / length;
        const freq = 180 * Math.exp(-progress * 14) + 42; // Fast drop to 42 Hz
        phase += freq / sampleRate;
        const sine = Math.sin(phase * 2 * Math.PI);
        const dist = Math.tanh(sine * 2.2); // Saturated punch
        const env = Math.max(0, 1 - progress);
        data[i] = dist * env * 0.85;
      }
      return buffer;
    },
  },
  {
    id: 'snare_noise',
    name: '8-Bit Snare Clap',
    category: 'drums',
    description: 'Combination of body tone and white noise burst simulating 2A03 noise channel.',
    durationSec: 0.28,
    generator: (ctx: AudioContext): AudioBuffer => {
      const sampleRate = ctx.sampleRate;
      const length = Math.floor(sampleRate * 0.28);
      const buffer = ctx.createBuffer(1, length, sampleRate);
      const data = buffer.getChannelData(0);

      for (let i = 0; i < length; i++) {
        const t = i / sampleRate;
        const noise = (Math.random() * 2 - 1) * 0.7;
        const tone = Math.sin(2 * Math.PI * 185 * t) * Math.exp(-t * 30) * 0.6;
        const env = Math.exp(-t * 14);
        data[i] = (noise * 0.65 + tone) * env;
      }
      return buffer;
    },
  },
  {
    id: 'synth_speech_power',
    name: 'Speech: "Power Up!"',
    category: 'speech',
    description: 'Synthesized robotic voice speech formant saying "Power Up!"',
    durationSec: 0.55,
    generator: (ctx: AudioContext): AudioBuffer => {
      const sampleRate = ctx.sampleRate;
      const length = Math.floor(sampleRate * 0.55);
      const buffer = ctx.createBuffer(1, length, sampleRate);
      const data = buffer.getChannelData(0);

      // Formant synthesis
      for (let i = 0; i < length; i++) {
        const t = i / sampleRate;
        // Pitch pulse at ~120 Hz rising to ~160 Hz
        const pitch = 120 + (t / 0.55) * 40;
        const pulse = (t * pitch) % 1 < 0.1 ? 1 : 0;
        // Formant filters F1 ~ 700Hz, F2 ~ 1800Hz
        const f1 = Math.sin(2 * Math.PI * 720 * t);
        const f2 = Math.sin(2 * Math.PI * 1850 * t);
        const speech = pulse * (f1 * 0.6 + f2 * 0.4);
        const env = Math.sin((t / 0.55) * Math.PI);
        data[i] = speech * env * 0.8;
      }
      return buffer;
    },
  },
];
