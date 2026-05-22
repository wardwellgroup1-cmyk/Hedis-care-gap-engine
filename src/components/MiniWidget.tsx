import { useRef, useState, useCallback } from 'react';
import { Mic, MicOff, Square, Maximize2, Activity } from 'lucide-react';
import { AnalysisResult, RecordingState } from '../types';

interface Props {
  recordingState: RecordingState;
  transcript: string;
  interimTranscript: string;
  analysis: AnalysisResult | null;
  isSupported: boolean;
  onRecord: () => void;
  onStop: () => void;
  onExpand: () => void;
}

export function MiniWidget({
  recordingState,
  transcript,
  interimTranscript,
  analysis,
  isSupported,
  onRecord,
  onStop,
  onExpand,
}: Props) {
  const dragRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: window.innerWidth - 360, y: 24 });
  const dragging = useRef(false);
  const origin = useRef({ mx: 0, my: 0, px: 0, py: 0 });

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    dragging.current = true;
    origin.current = { mx: e.clientX, my: e.clientY, px: pos.x, py: pos.y };
    e.preventDefault();
  }, [pos]);

  const onMouseMove = useCallback((e: MouseEvent) => {
    if (!dragging.current) return;
    const nx = origin.current.px + (e.clientX - origin.current.mx);
    const ny = origin.current.py + (e.clientY - origin.current.my);
    setPos({
      x: Math.max(0, Math.min(window.innerWidth - 340, nx)),
      y: Math.max(0, Math.min(window.innerHeight - 160, ny)),
    });
  }, []);

  const onMouseUp = useCallback(() => { dragging.current = false; }, []);

  // Attach global drag listeners
  useState(() => {
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  });

  const isRecording = recordingState === 'recording';
  const isPaused = recordingState === 'paused';
  const isActive = isRecording || isPaused;
  const hasTranscript = transcript.length > 0 || interimTranscript.length > 0;

  const preview = (transcript + ' ' + interimTranscript).trim();
  const previewText = preview.length > 80 ? '…' + preview.slice(-80) : preview;

  return (
    <div
      ref={dragRef}
      style={{ left: pos.x, top: pos.y }}
      className="fixed z-50 w-80 select-none animate-fade-in"
    >
      {/* Header — drag handle */}
      <div
        className="bg-slate-900 border border-slate-700 rounded-t-xl px-3 py-2 flex items-center gap-2 cursor-grab active:cursor-grabbing"
        onMouseDown={onMouseDown}
      >
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <Activity className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="text-xs font-bold text-white tracking-wide">HEDIS</span>
          <span className="text-xs text-slate-500">Care Gap Engine</span>
        </div>
        {isRecording && (
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse-fast" />
            <span className="text-xs text-red-400 font-medium">REC</span>
          </div>
        )}
        {isPaused && (
          <span className="text-xs text-amber-400 font-medium">PAUSED</span>
        )}
        <button
          onClick={onExpand}
          className="ml-1 p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          title="Expand to full dashboard"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Body */}
      <div className="bg-slate-800/95 backdrop-blur border-x border-slate-700 px-3 py-2">
        {!isSupported && (
          <p className="text-xs text-amber-400">
            Voice not supported in this browser. Use Chrome or Edge.
          </p>
        )}

        {/* Live transcript preview */}
        {hasTranscript && (
          <p className="text-xs text-slate-300 leading-relaxed mb-2 min-h-[2rem]">
            <span className="text-white">{transcript.slice(-60)}</span>
            {interimTranscript && (
              <span className="text-slate-500 italic"> {interimTranscript.slice(0, 40)}…</span>
            )}
          </p>
        )}

        {!hasTranscript && !isActive && (
          <p className="text-xs text-slate-500 mb-2">Press record to begin dictation</p>
        )}

        {/* Quick stats */}
        {analysis && analysis.metrics.total > 0 && (
          <div className="flex items-center gap-3 mb-2">
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-xs text-emerald-400 font-semibold">{analysis.metrics.closed} closed</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              <span className="text-xs text-red-400 font-semibold">{analysis.metrics.missed} missed</span>
            </div>
            {analysis.demographics.age && (
              <span className="text-xs text-slate-500 ml-auto">
                {analysis.demographics.age}
                {analysis.demographics.gender !== 'UNKNOWN' ? analysis.demographics.gender[0] : '?'}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="bg-slate-900 border border-slate-700 rounded-b-xl px-3 py-2 flex items-center gap-2">
        <button
          onClick={onRecord}
          disabled={!isSupported || recordingState === 'stopped'}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            isRecording
              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 hover:bg-amber-500/30'
              : isPaused
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/30'
              : 'bg-red-500/20 text-red-400 border border-red-500/40 hover:bg-red-500/30 disabled:opacity-40'
          }`}
        >
          {isRecording ? (
            <><MicOff className="w-3.5 h-3.5" /> Pause</>
          ) : isPaused ? (
            <><Mic className="w-3.5 h-3.5" /> Resume</>
          ) : (
            <><Mic className="w-3.5 h-3.5" /> Record</>
          )}
        </button>

        {isActive && (
          <button
            onClick={onStop}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-700 text-white hover:bg-slate-600 transition-colors"
          >
            <Square className="w-3 h-3" /> Stop & Analyze
          </button>
        )}

        {recordingState === 'stopped' && analysis && (
          <button
            onClick={onExpand}
            className="flex-1 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-500 transition-colors text-center"
          >
            View Full Results →
          </button>
        )}
      </div>
    </div>
  );
}
