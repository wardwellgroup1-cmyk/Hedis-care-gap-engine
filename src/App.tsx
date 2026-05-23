import { useEffect, useState, useCallback, useRef } from 'react';
import { MiniWidget } from './components/MiniWidget';
import { FullDashboard } from './components/FullDashboard';
import { useSpeechRecognition } from './hooks/useSpeechRecognition';
import {
  AppMode, RecordingState, ClinicalProblem, RAFResult,
  HEDISResult, Demographics, RecallCondition,
} from './types';
import { extractProblems } from './engine/clinicalNLP';
import { calculateRAF } from './engine/rafEngine';
import { extractDemographics } from './engine/patterns';
import { analyzeTranscript } from './engine/analyzer'; // HEDIS
import { applyComboCodes } from './engine/icdSpecificity';
import { detectMEAT } from './engine/meatDetector';
import {
  getRecallAlerts,
  updateRecallFromProblems,
  createProblemFromRecall,
} from './engine/chronicRecall';
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

  // Coding enhancements
  const [specChanges, setSpecChanges] = useState<string[]>([]);
  const [recallAlerts, setRecallAlerts] = useState<RecallCondition[]>([]);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { transcript, interimTranscript, isSupported, start, pause, stop, reset } =
    useSpeechRecognition();

  // ── Full analysis pipeline ────────────────────────────────────────────────
  const runAnalysis = useCallback((text: string) => {
    if (text.trim().length < 5) return;

    // 1. Demographics
    const demo = extractDemographics(text);
    const demoTyped: Demographics = {
      age: demo.age,
      gender: demo.gender as Demographics['gender'],
      confidence: demo.confidence,
    };
    setDemographics(demoTyped);

    // 2. ICD-10 extraction
    let extracted = extractProblems(text);

    // 3. ICD specificity — combo codes, CKD staging, insulin Z79.4
    const { problems: withCombos, changes } = applyComboCodes(extracted, text);
    setSpecChanges(changes);

    // 4. MEAT detection for each problem
    const withMEAT: ClinicalProblem[] = withCombos.map((p) => ({
      ...p,
      meat: detectMEAT(p, text),
    }));

    setProblems(withMEAT);

    // 5. RAF calculation (uses updated codes from combo engine)
    const rafResult = calculateRAF(withMEAT, demo.age, demo.gender);
    setRaf(rafResult);

    // 6. Chronic recall alerts (conditions NOT in today's list)
    const recalls = getRecallAlerts(withMEAT);
    setRecallAlerts(recalls);

    // 7. HEDIS (secondary)
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

  // ── Recording controls ────────────────────────────────────────────────────
  const handleRecord = useCallback(() => {
    if (recordingState === 'idle') {
      reset();
      setProblems([]);
      setRaf(null);
      setHedis(null);
      setSpecChanges([]);
      setRecallAlerts([]);
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

  // ── Code change (provider selects alternate ICD-10) ───────────────────────
  const handleCodeChange = useCallback((id: string, code: string, desc: string) => {
    setProblems((prev) => {
      const next = prev.map((p) =>
        p.id === id ? { ...p, selectedCode: code, selectedDescription: desc } : p
      );
      const rafResult = calculateRAF(next, demographics.age, demographics.gender);
      setRaf(rafResult);
      return next;
    });
  }, [demographics]);

  // ── Add recalled condition to current session ─────────────────────────────
  const handleAddRecalled = useCallback((condition: RecallCondition) => {
    const currentText = (transcript + ' ' + interimTranscript).trim();
    const newProblem = createProblemFromRecall(condition, currentText);

    setProblems((prev) => {
      // Don't add duplicate
      if (prev.some((p) => p.id === condition.id)) return prev;
      const next = [...prev, newProblem];
      // Recalculate RAF
      const rafResult = calculateRAF(next, demographics.age, demographics.gender);
      setRaf(rafResult);
      // Remove from recall alerts
      setRecallAlerts((r) => r.filter((a) => a.id !== condition.id));
      return next;
    });
  }, [transcript, interimTranscript, demographics]);

  // ── New visit (saves recall + clears state) ───────────────────────────────
  const handleNewVisit = useCallback(() => {
    // Persist chronic conditions to recall storage
    if (problems.length > 0) {
      updateRecallFromProblems(problems);
    }

    // Save to visit history
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
    setSpecChanges([]);
    setRecallAlerts([]);
    setDemographics({ age: null, gender: 'UNKNOWN', confidence: 'LOW' });
    setRecordingState('idle');
    setMode('mini');
  }, [transcript, hedis, problems, reset]);

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
          specChanges={specChanges}
          recallAlerts={recallAlerts}
          onCodeChange={handleCodeChange}
          onAddRecalled={handleAddRecalled}
          onNewVisit={handleNewVisit}
          onCollapse={() => setMode('mini')}
        />
      )}
    </>
  );
}
