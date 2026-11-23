'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ToolDef } from '@/data/toolsRegistry';
import { Volume2, Mic, Play, Pause, Square, Download, Activity, Monitor, Radio } from 'lucide-react';

export default function MediaEngine({ tool }: { tool: ToolDef }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [frequency, setFrequency] = useState(440); // 440 Hz standard A
  const [waveType, setWaveType] = useState<OscillatorType>('sine');
  const [bpm, setBpm] = useState(120);
  const [refreshRate, setRefreshRate] = useState<number | null>(null);
  const [recording, setRecording] = useState(false);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [testColorIndex, setTestColorIndex] = useState(0);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscRef = useRef<OscillatorNode | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (oscRef.current) {
        oscRef.current.stop();
        oscRef.current.disconnect();
      }
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close();
      }
    };
  }, []);

  // Screen Refresh Rate (Hz) Measurement
  useEffect(() => {
    if (tool.slug.includes('refresh-rate') || tool.slug.includes('screen')) {
      let frameCount = 0;
      let startTime = performance.now();
      let reqId: number;

      const checkFps = (time: number) => {
        frameCount++;
        if (time - startTime >= 1000) {
          const fps = Math.round((frameCount * 1000) / (time - startTime));
          setRefreshRate(fps);
          frameCount = 0;
          startTime = time;
        }
        reqId = requestAnimationFrame(checkFps);
      };
      reqId = requestAnimationFrame(checkFps);
      return () => cancelAnimationFrame(reqId);
    }
  }, [tool.slug]);

  // Audio Tone Generator toggle
  const toggleTone = () => {
    if (isPlaying) {
      oscRef.current?.stop();
      oscRef.current?.disconnect();
      setIsPlaying(false);
    } else {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = waveType;
      osc.frequency.setValueAtTime(frequency, ctx.currentTime);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      oscRef.current = osc;
      setIsPlaying(true);
    }
  };

  // Channel stereo test
  const playStereoTest = (channel: 'left' | 'right') => {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const panner = ctx.createStereoPanner();
    panner.pan.value = channel === 'left' ? -1 : 1;
    osc.frequency.value = 440;
    osc.connect(panner);
    panner.connect(ctx.destination);
    osc.start();
    setTimeout(() => {
      osc.stop();
      ctx.close();
    }, 1500);
  };

  // Voice recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setRecordedAudioUrl(url);
      };

      recorder.start();
      setRecording(true);
    } catch {
      alert('Microphone permission required for recording.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  const testColors = ['#ff0000', '#00ff00', '#0000ff', '#ffffff', '#000000'];

  return (
    <div className="p-6 md:p-8 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xl space-y-6">
      {/* 1. Tone / Frequency Generator */}
      {tool.slug.includes('tone') || tool.slug.includes('frequency') || tool.slug.includes('binaural') || tool.slug.includes('noise') ? (
        <div className="space-y-6">
          <div className="p-8 rounded-2xl bg-neutral-900 text-white flex flex-col items-center justify-center text-center space-y-3">
            <Radio className="w-8 h-8 text-blue-400" />
            <div className="text-4xl font-mono font-bold">{frequency} Hz</div>
            <div className="text-xs text-neutral-400">Current Frequency Tone</div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
                Frequency (20 Hz - 20,000 Hz)
              </label>
              <input
                type="range"
                min={20}
                max={2000}
                value={frequency}
                onChange={(e) => {
                  setFrequency(Number(e.target.value));
                  if (oscRef.current) oscRef.current.frequency.value = Number(e.target.value);
                }}
                className="w-full"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {(['sine', 'square', 'sawtooth', 'triangle'] as OscillatorType[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setWaveType(t)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition ${
                    waveType === t
                      ? 'bg-blue-600 text-white'
                      : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                  }`}
                >
                  {t} Wave
                </button>
              ))}
            </div>

            <button
              onClick={toggleTone}
              className={`px-6 py-3 rounded-xl text-white font-semibold text-sm flex items-center gap-2 shadow-md transition ${
                isPlaying ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              {isPlaying ? 'Stop Audio Tone' : 'Play Audio Tone'}
            </button>
          </div>
        </div>
      ) : tool.slug.includes('refresh-rate') ? (
        /* 2. Refresh Rate Tester */
        <div className="p-12 rounded-2xl bg-neutral-900 text-white flex flex-col items-center justify-center text-center space-y-4">
          <Monitor className="w-12 h-12 text-blue-400" />
          <div className="text-6xl font-mono font-extrabold text-blue-400">
            {refreshRate ? `${refreshRate} Hz` : 'Detecting...'}
          </div>
          <div className="text-xs text-neutral-400 max-w-sm">
            Accurately measured using high-precision hardware requestAnimationFrame timestamp profiling.
          </div>
        </div>
      ) : tool.slug.includes('dead-pixel') ? (
        /* 3. Dead Pixel Tester */
        <div className="space-y-4">
          <div
            className="w-full h-64 rounded-2xl border border-neutral-300 dark:border-neutral-700 cursor-pointer flex items-center justify-center text-center p-4 transition-colors"
            style={{ backgroundColor: testColors[testColorIndex] }}
            onClick={() => setTestColorIndex((i) => (i + 1) % testColors.length)}
          >
            <span
              className={`text-xs font-semibold px-3 py-1.5 rounded-full ${
                testColors[testColorIndex] === '#000000'
                  ? 'bg-white text-black'
                  : 'bg-black text-white'
              }`}
            >
              Click box to cycle test screen colors ({testColors[testColorIndex]})
            </span>
          </div>
        </div>
      ) : tool.slug.includes('speaker') || tool.slug.includes('stereo') ? (
        /* 4. Stereo Left / Right Audio Tester */
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={() => playStereoTest('left')}
            className="p-8 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-100 flex flex-col items-center gap-3 hover:scale-105 transition"
          >
            <Volume2 className="w-8 h-8 text-blue-600" />
            <span className="font-bold">Test Left Channel Only</span>
          </button>
          <button
            onClick={() => playStereoTest('right')}
            className="p-8 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-900 dark:text-indigo-100 flex flex-col items-center gap-3 hover:scale-105 transition"
          >
            <Volume2 className="w-8 h-8 text-indigo-600" />
            <span className="font-bold">Test Right Channel Only</span>
          </button>
        </div>
      ) : (
        /* 5. Voice / Audio Recorder */
        <div className="space-y-4 text-center">
          <div className="p-8 rounded-2xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 flex flex-col items-center justify-center space-y-4">
            <div
              className={`w-16 h-16 rounded-full flex items-center justify-center ${
                recording ? 'bg-red-500 text-white animate-pulse' : 'bg-blue-100 text-blue-600'
              }`}
            >
              <Mic className="w-8 h-8" />
            </div>

            <div className="flex gap-4">
              {!recording ? (
                <button
                  onClick={startRecording}
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition"
                >
                  Start Recording
                </button>
              ) : (
                <button
                  onClick={stopRecording}
                  className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-xs transition"
                >
                  Stop Recording
                </button>
              )}
            </div>

            {recordedAudioUrl && (
              <div className="pt-4 flex flex-col items-center gap-3 w-full max-w-md">
                <audio src={recordedAudioUrl} controls className="w-full" />
                <a
                  href={recordedAudioUrl}
                  download="recorded-audio.webm"
                  className="text-xs text-blue-600 font-semibold flex items-center gap-1 hover:underline"
                >
                  <Download className="w-3.5 h-3.5" /> Download Audio File
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
