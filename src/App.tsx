import { useEffect, useState, useCallback, useRef } from 'react';
import { MiniWidget } from './components/MiniWidget';
import { FullDashboard } from './components/FullDashboard';
import { useSpeechRecognition } from './hooks/useSpeechRecognition';
import { AppMode, RecordingState, ClinicalProblem, RAFResult, HEDISResult, Demographics } from './types';
import { extractProblems } from './engine/clinicalNLP';
import { calculateRAF } from './engine/rafEngine';
import { extractDemographics } from './engine/patterns';
import { analyzeTranscript } from './engine/analyzer'; // HEDIS
import { AnalysisResult } from './types';

const STORAGE_KEY = 'hedis_visit_history_v2';

function loadVisits(): AnalysisResult[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]'); } catch { return []; }
}

export default function App() {
  const [mode, setMode] = useState<AppMode>('mini');
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');

  // Core data
  const [demographics, setDemographics] = useState<Demographics>({ age: null, gender: 'UNKNOWN', confidence: 'LOW' });
  const [problems, setProblems] = useState<ClinicalProblem[]>([]);
  const [raf, setRaf] = useState<RAFResult | null>(null);
  const [hedis, setHedis] = useState<HEDISResult | null>(null);
  const [visits, setVisits] = useState<AnalysisResult[]>(loadVisits);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { transcript, interimTranscript, isSupported, start, pause, stop, reset } =
    useSpeechRecognition();

  // ── Analysis runner ────────────────────────────────────────────────────────
  const runAnalysis = useCallback((text: string) => {
    if (text.trim().length < 5) return;

    // Demographics
    const demo = extractDemographics(text);
    const demoTyped: Demographics = {
      age: demo.age,
      gender: demo.gender as Demographics['gender'],
      confidence: demo.confidence,
    };
    setDemographics(demoTyped);

    // ICD-10 + HCC + RAF
    const extracted = extractProblems(text);
    setProblems(extracted);
    const rafResult = calculateRAF(extracted, demo.age, demo.gender);
    setRaf(rafResult);

    // HEDIS (secondary)
    const hedisResult = analyzeTranscript(text);
    setHedis({ gaps: hedisResult.gaps, metrics: hedisResult.metrics });
  }, []);

  // Debounced real-time analysis as transcript grows
  useEffect(() => {
    const combined = transcript + ' ' + interimTranscript;
    if (combined.trim().length < 10) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runAnalysis(combined), 500);
  }, [transcript, interimTranscript, runAnalysis]);

  // ── Recording controls ─────────────────────────────────────────────────────
  const handleRecord = useCallback(() => {
    if (recordingState === 'idle') {
      reset();
      setProblems([]);
      setRaf(null);
      setHedis(null);
      setDemographics({ age: null, gender: 'UNKNOWN', confidence: 'LOW' });
      start();
      setRecordingState('recording');
    } else if (recordingState === 'recording') {
      pause();
      setRecordingState('paused');
    } else if (recordingState === 'paused') {
      start();
      setRecordingState('recording');
    }
  }, [recordingState, reset, start, pause]);

  const handleStop = useCallback(() => {
    stop();
    setRecordingState('stopped');
    const full = (transcript + ' ' + interimTranscript).trim();
    runAnalysis(full);
    setMode('full');
  }, [stop, transcript, interimTranscript, runAnalysis]);

  const handleCodeChange = useCallback((id: string, code: string, desc: string) => {
    setProblems((prev) => {
      const next = prev.map((p) =>
        p.id === id ? { ...p, selectedCode: code, selectedDescription: desc } : p
      );
      // Recalculate RAF with updated codes
      const rafResult = calculateRAF(next, demographics.age, demographics.gender);
      setRaf(rafResult);
      return next;
    });
  }, [demographics]);

  const handleNewVisit = useCallback(() => {
    // Save current visit to history
    if (transcript && hedis) {
      const result = analyzeTranscript(transcript);
      setVisits((prev) => {
        const next = [...prev, result].slice(-20);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        return next;
      });
    }
    reset();
    setProblems([]);
    setRaf(null);
    setHedis(null);
    setDemographics({ age: null, gender: 'UNKNOWN', confidence: 'LOW' });
    setRecordingState('idle');
    setMode('mini');
  }, [transcript, hedis, reset]);

  // Mini widget quick stats
  const quickClosed = hedis?.metrics.closed ?? 0;
  const quickMissed = hedis?.metrics.missed ?? 0;

  return (
    <>
      {mode === 'mini' && (
        <MiniWidget
          recordingState={recordingState}
          transcript={transcript}
          interimTranscript={interimTranscript}
          analysis={hedis ? {
            id: 'x', timestamp: '', transcript, demographics,
            gaps: hedis.gaps, metrics: hedis.metrics,
          } : null}
          isSupported={isSupported}
          onRecord={handleRecord}
          onStop={handleStop}
          onExpand={() => setMode('full')}
        />
      )}
      {mode === 'full' && (
        <FullDashboard
          transcript={transcript}
          demographics={demographics}
          problems={problems}
          raf={raf}
          hedis={hedis}
          visits={visits}
          onCodeChange={handleCodeChange}
          onNewVisit={handleNewVisit}
          onCollapse={() => setMode('mini')}
        />
      )}
    </>
  );
}
