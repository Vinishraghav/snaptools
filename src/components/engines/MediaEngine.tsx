'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ToolDef } from '@/data/toolsRegistry';
import { Volume2, Mic, Play, Pause, Download, Monitor, Radio, Upload, Film, Camera } from 'lucide-react';

export default function MediaEngine({ tool }: { tool: ToolDef }) {
  const slug = tool.slug;
  const [isPlaying, setIsPlaying] = useState(false);
  const [frequency, setFrequency] = useState(440);
  const [waveType, setWaveType] = useState<OscillatorType>('sine');
  const [bpm, setBpm] = useState(120);
  const [tapTimes, setTapTimes] = useState<number[]>([]);
  const [refreshRate, setRefreshRate] = useState<number | null>(null);
  const [recording, setRecording] = useState(false);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [testColorIndex, setTestColorIndex] = useState(0);

  // Subtitle converter state
  const [subtitleText, setSubtitleText] = useState(
    '1\n00:00:01,000 --> 00:00:04,500\nWelcome to SnapTools client-side media suite.\n\n2\n00:00:05,000 --> 00:00:08,000\nAll processing happens inside your browser.'
  );

  // Media file player & frame grabber state
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [muted, setMuted] = useState<boolean>(false);
  const [videoRotate, setVideoRotate] = useState<number>(0);
  const [frameUrl, setFrameUrl] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscRef = useRef<OscillatorNode | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    return () => {
      if (oscRef.current) {
        try {
          oscRef.current.stop();
          oscRef.current.disconnect();
        } catch {
          // already stopped
        }
      }
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close();
      }
    };
  }, []);

  useEffect(() => {
    if (slug.includes('refresh-rate') || slug.includes('screen-refresh')) {
      let frameCount = 0;
      let startTime = performance.now();
      let reqId: number;
      const checkFps = (time: number) => {
        frameCount++;
        if (time - startTime >= 1000) {
          setRefreshRate(Math.round((frameCount * 1000) / (time - startTime)));
          frameCount = 0;
          startTime = time;
        }
        reqId = requestAnimationFrame(checkFps);
      };
      reqId = requestAnimationFrame(checkFps);
      return () => cancelAnimationFrame(reqId);
    }
  }, [slug]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackSpeed;
      videoRef.current.muted = muted;
    }
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackSpeed;
      audioRef.current.muted = muted;
    }
  }, [playbackSpeed, muted]);

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

  const handleTapBpm = () => {
    const now = performance.now();
    const recent = [...tapTimes.filter((t) => now - t < 4000), now].slice(-8);
    setTapTimes(recent);
    if (recent.length >= 2) {
      const diffs = recent.slice(1).map((t, i) => t - recent[i]);
      const avg = diffs.reduce((a, b) => a + b, 0) / diffs.length;
      if (avg > 0) setBpm(Math.round(60000 / avg));
    }
  };

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
        setRecordedAudioUrl(URL.createObjectURL(audioBlob));
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

  const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setMediaFile(f);
    setMediaUrl(URL.createObjectURL(f));
    setFrameUrl(null);
  };

  const grabVideoFrame = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx?.drawImage(video, 0, 0);
    setFrameUrl(canvas.toDataURL('image/png'));
  };

  const convertedSubtitle = slug.includes('srt-to-vtt')
    ? `WEBVTT\n\n${subtitleText.replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, '$1.$2')}`
    : subtitleText.replace(/^WEBVTT\s*/i, '').replace(/(\d{2}:\d{2}:\d{2})\.(\d{3})/g, '$1,$2');

  const isTone = slug.includes('tone') || slug.includes('frequency') || slug.includes('binaural') || slug.includes('noise');
  const isRefresh = slug.includes('refresh-rate');
  const isDeadPixel = slug.includes('dead-pixel');
  const isSpeaker = slug.includes('speaker') || slug.includes('stereo');
  const isMetronome = slug.includes('metronome') || slug.includes('bpm');
  const isSubtitle = slug.includes('srt') || slug.includes('vtt') || slug.includes('subtitle');
  const isVoiceMic = slug.includes('voice-recorder') || slug.includes('mic') || slug.includes('dictation');

  const testColors = ['#ff0000', '#00ff00', '#0000ff', '#ffffff', '#000000'];

  return (
    <div className="p-6 md:p-8 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xl space-y-6">
      {isTone ? (
        <div className="space-y-6">
          <div className="p-8 rounded-2xl bg-neutral-900 text-white flex flex-col items-center justify-center text-center space-y-3">
            <Radio className="w-8 h-8 text-blue-400" />
            <div className="text-4xl font-mono font-bold">{frequency} Hz</div>
            <div className="text-xs text-neutral-400">Current Frequency Tone</div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
                Frequency (20 Hz - 2,000 Hz)
              </label>
              <input
                type="range"
                min={20}
                max={2000}
                value={frequency}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setFrequency(val);
                  if (oscRef.current) oscRef.current.frequency.value = val;
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
                    waveType === t ? 'bg-blue-600 text-white' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
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
      ) : isRefresh ? (
        <div className="p-12 rounded-2xl bg-neutral-900 text-white flex flex-col items-center justify-center text-center space-y-4">
          <Monitor className="w-12 h-12 text-blue-400" />
          <div className="text-6xl font-mono font-extrabold text-blue-400">
            {refreshRate ? `${refreshRate} Hz` : 'Detecting...'}
          </div>
          <div className="text-xs text-neutral-400 max-w-sm">
            Measured via requestAnimationFrame display frame timing.
          </div>
        </div>
      ) : isDeadPixel ? (
        <div
          className="w-full h-64 rounded-2xl border border-neutral-300 dark:border-neutral-700 cursor-pointer flex items-center justify-center text-center p-4 transition-colors"
          style={{ backgroundColor: testColors[testColorIndex] }}
          onClick={() => setTestColorIndex((i) => (i + 1) % testColors.length)}
        >
          <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${testColors[testColorIndex] === '#000000' ? 'bg-white text-black' : 'bg-black text-white'}`}>
            Click box to cycle test screen colors ({testColors[testColorIndex]})
          </span>
        </div>
      ) : isSpeaker ? (
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
      ) : isMetronome ? (
        <div className="p-8 rounded-2xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-center space-y-5">
          <div className="text-5xl font-mono font-black text-blue-600 dark:text-blue-400">{bpm} BPM</div>
          <input
            type="range"
            min={40}
            max={240}
            value={bpm}
            onChange={(e) => setBpm(Number(e.target.value))}
            className="w-full max-w-md mx-auto block"
          />
          <button
            onClick={handleTapBpm}
            className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md transition"
          >
            Tap Here Repeatedly to Measure Tempo
          </button>
        </div>
      ) : isSubtitle ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1.5">
              Input Subtitles (SRT / VTT)
            </label>
            <textarea
              rows={9}
              value={subtitleText}
              onChange={(e) => setSubtitleText(e.target.value)}
              className="w-full p-3.5 rounded-2xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 text-xs font-mono"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1.5">
              Converted Subtitle Output
            </label>
            <textarea
              rows={9}
              readOnly
              value={convertedSubtitle}
              className="w-full p-3.5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-100/60 dark:bg-neutral-900/60 text-xs font-mono"
            />
          </div>
        </div>
      ) : isVoiceMic ? (
        <div className="p-8 rounded-2xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 flex flex-col items-center justify-center space-y-4 text-center">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center ${recording ? 'bg-red-500 text-white animate-pulse' : 'bg-blue-100 text-blue-600'}`}>
            <Mic className="w-8 h-8" />
          </div>
          <div className="flex gap-4">
            {!recording ? (
              <button onClick={startRecording} className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition">
                Start Recording
              </button>
            ) : (
              <button onClick={stopRecording} className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-xs transition">
                Stop Recording
              </button>
            )}
          </div>
          {recordedAudioUrl && (
            <div className="pt-4 flex flex-col items-center gap-3 w-full max-w-md">
              <audio src={recordedAudioUrl} controls className="w-full" />
              <a href={recordedAudioUrl} download="recorded-audio.webm" className="text-xs text-blue-600 font-semibold flex items-center gap-1 hover:underline">
                <Download className="w-3.5 h-3.5" /> Download Audio File
              </a>
            </div>
          )}
        </div>
      ) : (
        /* Media Studio (Video / Audio / GIF local upload & inspector) */
        <div className="space-y-5">
          <label className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-neutral-300 dark:border-neutral-700 rounded-2xl hover:border-blue-500 hover:bg-blue-50/20 dark:hover:bg-blue-950/20 cursor-pointer transition text-center group">
            <Upload className="w-10 h-10 text-neutral-400 group-hover:text-blue-500 mb-2 transition" />
            <span className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
              Click or drag &amp; drop Video, Audio, or GIF file here
            </span>
            <span className="text-xs text-neutral-500 mt-1">
              Runs 100% client-side in your browser memory (MP4, WebM, MP3, WAV, GIF)
            </span>
            <input type="file" accept="video/*,audio/*,image/gif" onChange={handleMediaUpload} className="hidden" />
          </label>

          {mediaFile && mediaUrl && (
            <div className="space-y-4 p-5 rounded-2xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-neutral-600 dark:text-neutral-400">
                <span className="flex items-center gap-1.5 font-semibold text-neutral-900 dark:text-white">
                  <Film className="w-4 h-4 text-blue-500" /> {mediaFile.name}
                </span>
                <span>{(mediaFile.size / (1024 * 1024)).toFixed(2)} MB &bull; {mediaFile.type || 'media'}</span>
              </div>

              {mediaFile.type.startsWith('audio/') ? (
                <audio ref={audioRef} src={mediaUrl} controls className="w-full" />
              ) : mediaFile.type === 'image/gif' ? (
                <img src={mediaUrl} alt="Uploaded GIF preview" className="max-h-80 mx-auto rounded-xl border border-neutral-200 dark:border-neutral-800" />
              ) : (
                <video
                  ref={videoRef}
                  src={mediaUrl}
                  controls
                  style={{ transform: `rotate(${videoRotate}deg)` }}
                  className="max-h-80 w-full rounded-xl bg-black"
                />
              )}

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <label className="text-xs font-semibold flex items-center gap-2">
                  Speed: {playbackSpeed}x
                  <input
                    type="range"
                    min={0.5}
                    max={2}
                    step={0.25}
                    value={playbackSpeed}
                    onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
                  />
                </label>
                <button
                  type="button"
                  onClick={() => setMuted(!muted)}
                  className="px-3 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 text-xs font-semibold"
                >
                  {muted ? 'Unmute Audio' : 'Mute Audio'}
                </button>
                {mediaFile.type.startsWith('video/') && (
                  <>
                    <button
                      type="button"
                      onClick={() => setVideoRotate((r) => (r + 90) % 360)}
                      className="px-3 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 text-xs font-semibold"
                    >
                      Rotate 90° ({videoRotate}°)
                    </button>
                    <button
                      type="button"
                      onClick={grabVideoFrame}
                      className="px-4 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold flex items-center gap-1.5"
                    >
                      <Camera className="w-3.5 h-3.5" /> Capture Frame PNG
                    </button>
                  </>
                )}
              </div>

              {frameUrl && (
                <div className="pt-3 flex flex-wrap items-center gap-4">
                  <img src={frameUrl} alt="Captured video frame" className="h-24 rounded-lg border border-neutral-300" />
                  <a
                    href={frameUrl}
                    download="captured-frame.png"
                    className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" /> Download Frame PNG
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
