/**
 * Audio playback helper for previewing Original Audio and NES 2A03 DPCM
 */

class NesAudioPreviewPlayer {
  private ctx: AudioContext | null = null;
  private currentSource: AudioBufferSourceNode | null = null;
  private isPlaying: boolean = false;

  private getContext(): AudioContext {
    if (!this.ctx || this.ctx.state === 'closed') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public playPcmData(
    pcm: Float32Array,
    sampleRate: number,
    onEnded?: () => void
  ): { stop: () => void } {
    this.stop();
    const ctx = this.getContext();

    const buffer = ctx.createBuffer(1, pcm.length, sampleRate);
    buffer.getChannelData(0).set(pcm);

    const source = ctx.createBufferSource();
    source.buffer = buffer;

    // Filter to simulate NES audio output circuit (gentle lowpass at 14 kHz)
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 14000;

    source.connect(filter);
    filter.connect(ctx.destination);

    this.currentSource = source;
    this.isPlaying = true;

    source.onended = () => {
      this.isPlaying = false;
      this.currentSource = null;
      if (onEnded) onEnded();
    };

    source.start();

    return {
      stop: () => {
        this.stop();
        if (onEnded) onEnded();
      },
    };
  }

  public stop(): void {
    if (this.currentSource) {
      try {
        this.currentSource.stop();
        this.currentSource.disconnect();
      } catch {
        // already stopped
      }
      this.currentSource = null;
    }
    this.isPlaying = false;
  }

  public getAudioContext(): AudioContext {
    return this.getContext();
  }
}

export const previewPlayer = new NesAudioPreviewPlayer();
