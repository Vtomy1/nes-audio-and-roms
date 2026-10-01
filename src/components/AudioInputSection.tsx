import React, { useRef, useState, useEffect } from 'react';
import { Upload, Mic, Square, Play, Pause, Sparkles, Volume2 } from 'lucide-react';
import { AUDIO_PRESETS } from '../utils/audioPresets';
import { previewPlayer } from '../utils/audioPlayer';

interface AudioInputSectionProps {
  pcmData: Float32Array | null;
  sampleRate: number;
  fileName: string;
  onAudioLoaded: (pcm: Float32Array, sampleRate: number, name: string) => void;
}

export const AudioInputSection: React.FC<AudioInputSectionProps> = ({
  pcmData,
  sampleRate,
  fileName,
  onAudioLoaded,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlayingOriginal, setIsPlayingOriginal] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const waveformCanvasRef = useRef<HTMLCanvasElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const stopPlaybackRef = useRef<(() => void) | null>(null);

  // Draw waveform on canvas whenever pcmData changes
  useEffect(() => {
    const canvas = waveformCanvasRef.current;
    if (!canvas || !pcmData) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    // Draw background grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();

    // Draw waveform
    ctx.strokeStyle = '#38bdf8'; // Sky blue
    ctx.lineWidth = 1.5;
    ctx.beginPath();

    const step = Math.ceil(pcmData.length / width);
    const amp = height / 2;

    for (let x = 0; x < width; x++) {
      let min = 1.0;
      let max = -1.0;
      const start = x * step;
      const end = Math.min(start + step, pcmData.length);

      for (let j = start; j < end; j++) {
        const val = pcmData[j];
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
  }, [pcmData]);

  // Decode file into Float32Array PCM
  const processAudioFile = async (file: File) => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      const audioBuffer = await ctx.decodeAudioData(arrayBuffer);

      // Downmix to mono Float32Array
      const numChannels = audioBuffer.numberOfChannels;
      const length = audioBuffer.length;
      const monoPcm = new Float32Array(length);

      for (let c = 0; c < numChannels; c++) {
        const channelData = audioBuffer.getChannelData(c);
        for (let i = 0; i < length; i++) {
          monoPcm[i] += channelData[i] / numChannels;
        }
      }

      ctx.close();
      onAudioLoaded(monoPcm, audioBuffer.sampleRate, file.name);
    } catch (err) {
      console.error('Error decoding audio:', err);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processAudioFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('audio/')) {
      processAudioFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  // Start / Stop Microphone Recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const arrayBuffer = await audioBlob.arrayBuffer();
        const ctx = previewPlayer.getAudioContext();
        const audioBuffer = await ctx.decodeAudioData(arrayBuffer);

        const monoPcm = new Float32Array(audioBuffer.length);
        const channelData = audioBuffer.getChannelData(0);
        monoPcm.set(channelData);

        onAudioLoaded(monoPcm, audioBuffer.sampleRate, 'mic_recording.wav');

        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);

      timerRef.current = window.setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Microphone error:', err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  // Play Original Audio
  const togglePlayOriginal = () => {
    if (isPlayingOriginal) {
      if (stopPlaybackRef.current) stopPlaybackRef.current();
      setIsPlayingOriginal(false);
    } else if (pcmData) {
      setIsPlayingOriginal(true);
      const controller = previewPlayer.playPcmData(pcmData, sampleRate, () => {
        setIsPlayingOriginal(false);
      });
      stopPlaybackRef.current = controller.stop;
    }
  };

  // Load Preset
  const handleLoadPreset = (presetId: string) => {
    const preset = AUDIO_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;

    const ctx = previewPlayer.getAudioContext();
    const audioBuffer = preset.generator(ctx);
    const monoPcm = new Float32Array(audioBuffer.length);
    monoPcm.set(audioBuffer.getChannelData(0));

    onAudioLoaded(monoPcm, audioBuffer.sampleRate, `${preset.id}.wav`);
  };

  const durationSec = pcmData ? (pcmData.length / sampleRate).toFixed(2) : '0.00';

  return (
    <section className="bg-slate-900/60 border border-slate-800 rounded-lg p-5">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-sky-400" />
            <span>Audio Source Input</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Load an audio clip, record speech/SFX from your mic, or select a classic 8-bit chiptune sound.
          </p>
        </div>

        {/* Quick Chiptune Presets */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs text-slate-500 font-medium flex items-center gap-1 mr-1">
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>Presets:</span>
          </span>
          {AUDIO_PRESETS.slice(0, 4).map((preset) => (
            <button
              key={preset.id}
              onClick={() => handleLoadPreset(preset.id)}
              className="px-2.5 py-1 text-xs text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 rounded transition-colors whitespace-nowrap"
            >
              {preset.name}
            </button>
          ))}
          <button
            onClick={() => handleLoadPreset('synth_speech_power')}
            className="px-2.5 py-1 text-xs text-amber-300 hover:text-amber-200 bg-amber-950/40 hover:bg-amber-900/40 border border-amber-800/50 rounded transition-colors whitespace-nowrap"
          >
            Voice &quot;Power Up!&quot;
          </button>
        </div>
      </div>

      {/* Upload & Record Area */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Dropzone */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className={`md:col-span-5 border-2 border-dashed rounded-lg p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
            isDragging
              ? 'border-sky-400 bg-sky-950/20'
              : 'border-slate-700/80 hover:border-slate-600 bg-slate-950/40'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            onChange={handleFileUpload}
            className="hidden"
          />
          <Upload className="w-6 h-6 text-slate-400 mb-2" />
          <span className="text-xs font-semibold text-slate-200">
            Click to upload audio or drag &amp; drop
          </span>
          <span className="text-[11px] text-slate-500 mt-1">
            WAV, MP3, OGG, FLAC, AIFF (Auto-downmixed to mono)
          </span>
        </div>

        {/* Mic Recording Button */}
        <div className="md:col-span-2 flex flex-col justify-center gap-2">
          {!isRecording ? (
            <button
              onClick={startRecording}
              className="w-full h-full min-h-[90px] border border-slate-700/80 hover:border-red-500/50 bg-slate-950/40 hover:bg-red-950/20 rounded-lg flex flex-col items-center justify-center gap-2 p-3 text-slate-300 hover:text-red-400 transition-colors"
            >
              <Mic className="w-5 h-5 text-red-400" />
              <span className="text-xs font-medium">Record Voice</span>
            </button>
          ) : (
            <button
              onClick={stopRecording}
              className="w-full h-full min-h-[90px] border border-red-500 bg-red-950/40 rounded-lg flex flex-col items-center justify-center gap-2 p-3 text-red-200 animate-pulse transition-colors"
            >
              <Square className="w-5 h-5 text-red-400 fill-red-400" />
              <span className="text-xs font-mono font-semibold">
                Stop ({recordingSeconds}s)
              </span>
            </button>
          )}
        </div>

        {/* Active Audio Waveform & Metadata */}
        <div className="md:col-span-5 bg-slate-950/60 border border-slate-800 rounded-lg p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-xs font-mono font-medium text-slate-300 truncate max-w-[200px]" title={fileName}>
              {fileName}
            </span>

            {/* Zero-Pill Unboxed Metadata with · separator */}
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono tabular-nums">
              <span>{durationSec}s</span>
              <span aria-hidden="true">·</span>
              <span>{Math.round(sampleRate / 1000)} kHz</span>
              <span aria-hidden="true">·</span>
              <span>{pcmData ? `${(pcmData.length * 4 / 1024).toFixed(1)} KB` : '0 KB'}</span>
            </div>
          </div>

          {/* Waveform Canvas */}
          <div className="relative w-full h-14 bg-slate-950 rounded border border-slate-800/80 overflow-hidden flex items-center justify-center">
            {pcmData ? (
              <canvas
                ref={waveformCanvasRef}
                width={420}
                height={56}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-xs text-slate-500">No audio loaded</span>
            )}
          </div>

          <div className="flex items-center justify-between mt-2">
            <button
              onClick={togglePlayOriginal}
              disabled={!pcmData}
              className={`px-3 py-1 text-xs font-medium rounded flex items-center gap-1.5 transition-colors ${
                pcmData
                  ? 'bg-sky-600 hover:bg-sky-500 text-white shadow-sm'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              {isPlayingOriginal ? (
                <>
                  <Pause className="w-3.5 h-3.5" />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  <span>Play Original PCM</span>
                </>
              )}
            </button>
            <span className="text-[11px] text-slate-500">16-bit Full Precision</span>
          </div>
        </div>
      </div>
    </section>
  );
};
