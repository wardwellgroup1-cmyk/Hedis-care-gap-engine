import { useState, useCallback, useEffect, useRef } from 'react';
import { AnalysisResult } from '../types';
import { analyzeTranscript } from '../engine/analyzer';

const STORAGE_KEY = 'hedis_visit_history';
const MAX_VISITS = 20;

function loadVisits(): AnalysisResult[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveVisitsToStorage(visits: AnalysisResult[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(visits.slice(-MAX_VISITS)));
  } catch { /* quota exceeded */ }
}

export function useHEDIS() {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [visits, setVisits] = useState<AnalysisResult[]>(loadVisits);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    saveVisitsToStorage(visits);
  }, [visits]);

  const analyze = useCallback((transcript: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (transcript.trim().length < 5) return;
      const result = analyzeTranscript(transcript);
      setAnalysis(result);
    }, 400);
  }, []);

  const analyzeImmediate = useCallback((transcript: string) => {
    if (transcript.trim().length < 5) return;
    const result = analyzeTranscript(transcript);
    setAnalysis(result);
  }, []);

  const saveVisit = useCallback((result: AnalysisResult) => {
    setVisits((prev) => {
      const next = [...prev, result];
      return next.slice(-MAX_VISITS);
    });
  }, []);

  const clearCurrentVisit = useCallback(() => {
    setAnalysis(null);
  }, []);

  const clearHistory = useCallback(() => {
    setVisits([]);
  }, []);

  return { analysis, visits, analyze, analyzeImmediate, saveVisit, clearCurrentVisit, clearHistory };
}
