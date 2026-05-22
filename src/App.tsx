import { useEffect, useState, useCallback } from 'react';
import { MiniWidget } from './components/MiniWidget';
import { FullDashboard } from './components/FullDashboard';
import { useSpeechRecognition } from './hooks/useSpeechRecognition';
import { useHEDIS } from './hooks/useHEDIS';
import { AppMode, RecordingState } from './types';

export default function App() {
  const [mode, setMode] = useState<AppMode>('mini');
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');

  const { transcript, interimTranscript, isSupported, start, pause, stop, reset } =
    useSpeechRecognition();

  const { analysis, visits, analyze, analyzeImmediate, saveVisit, clearCurrentVisit } =
    useHEDIS();

  // Real-time analysis as transcript grows
  useEffect(() => {
    if (transcript.length > 10) {
      analyze(transcript + ' ' + interimTranscript);
    }
  }, [transcript, interimTranscript, analyze]);

  const handleRecord = useCallback(() => {
    if (recordingState === 'idle') {
      reset();
      clearCurrentVisit();
      start();
      setRecordingState('recording');
    } else if (recordingState === 'recording') {
      pause();
      setRecordingState('paused');
    } else if (recordingState === 'paused') {
      start();
      setRecordingState('recording');
    }
  }, [recordingState, reset, clearCurrentVisit, start, pause]);

  const handleStop = useCallback(() => {
    stop();
    setRecordingState('stopped');
    const full = transcript + ' ' + interimTranscript;
    analyzeImmediate(full.trim());
    setMode('full');
  }, [stop, transcript, interimTranscript, analyzeImmediate]);

  const handleNewVisit = useCallback(() => {
    if (analysis) saveVisit(analysis);
    clearCurrentVisit();
    reset();
    setRecordingState('idle');
    setMode('mini');
  }, [analysis, saveVisit, clearCurrentVisit, reset]);

  return (
    <>
      {mode === 'mini' && (
        <MiniWidget
          recordingState={recordingState}
          transcript={transcript}
          interimTranscript={interimTranscript}
          analysis={analysis}
          isSupported={isSupported}
          onRecord={handleRecord}
          onStop={handleStop}
          onExpand={() => setMode('full')}
        />
      )}
      {mode === 'full' && (
        <FullDashboard
          analysis={analysis}
          visits={visits}
          onNewVisit={handleNewVisit}
          onCollapse={() => setMode('mini')}
        />
      )}
    </>
  );
}
