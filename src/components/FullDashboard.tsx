import { useState, useCallback } from 'react';
import {
  Minimize2, Plus, Copy, CheckCircle2, XCircle,
  Lightbulb, History, BarChart3, User, FileText, ChevronDown, ChevronUp, ClipboardList, X,
} from 'lucide-react';
import { AnalysisResult, GapResult, DomainStats } from '../types';
import { Heatmap } from './Heatmap';
import { computeDomainStats } from '../engine/analyzer';
import { generateNote } from '../engine/noteGenerator';
import { NotePanel } from './NotePanel';

interface Props {
  analysis: AnalysisResult | null;
  visits: AnalysisResult[];
  onNewVisit: () => void;
  onCollapse: () => void;
}

function GapPill({ gap }: { gap: GapResult }) {
  const [open, setOpen] = useState(false);
  const isGreen = gap.status === 'GREEN';

  return (
    <div
      className={`rounded-lg border transition-all cursor-pointer animate-slide-up ${
        isGreen
          ? 'bg-emerald-950/60 border-emerald-800/60 hover:border-emerald-600'
          : 'bg-red-950/60 border-red-800/60 hover:border-red-600'
      }`}
      onClick={() => setOpen((o) => !o)}
    >
      <div className="flex items-center gap-2 px-3 py-2">
        {isGreen
          ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          : <XCircle className="w-4 h-4 text-red-400 shrink-0" />}
        <span className={`text-sm font-medium flex-1 ${isGreen ? 'text-emerald-300' : 'text-red-300'}`}>
          {gap.name}
        </span>
        <span className={`text-xs px-1.5 py-0.5 rounded font-mono ${
          gap.confidence === 'HIGH'
            ? 'bg-slate-700 text-slate-300'
            : gap.confidence === 'MEDIUM'
            ? 'bg-amber-900/60 text-amber-400'
            : 'bg-slate-800 text-slate-500'
        }`}>
          {gap.confidence}
        </span>
        {open ? <ChevronUp className="w-3 h-3 text-slate-500" /> : <ChevronDown className="w-3 h-3 text-slate-500" />}
      </div>
      {open && (
        <div className={`px-3 pb-2 text-xs ${isGreen ? 'text-emerald-400/80' : 'text-red-400/80'}`}>
          {isGreen && gap.evidence && <span>Evidence: "{gap.evidence}"</span>}
          {!isGreen && <span>No documentation found in transcript.</span>}
        </div>
      )}
    </div>
  );
}

function VisitCard({ visit, index }: { visit: AnalysisResult; index: number }) {
  const date = new Date(visit.timestamp).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
  const { age, gender } = visit.demographics;

  return (
    <div className="bg-slate-800/60 border border-slate-700 rounded-lg px-3 py-2 animate-slide-up">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-slate-400">Visit {index + 1} · {date}</span>
        {age && (
          <span className="text-xs text-slate-500">
            {age}{gender !== 'UNKNOWN' ? gender[0] : '?'}
          </span>
        )}
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-xs text-emerald-400 font-semibold">{visit.metrics.closed}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-red-500" />
          <span className="text-xs text-red-400 font-semibold">{visit.metrics.missed}</span>
        </div>
        <div className="ml-auto">
          <span className={`text-xs font-bold ${visit.metrics.rate >= 70 ? 'text-emerald-400' : visit.metrics.rate >= 40 ? 'text-amber-400' : 'text-red-400'}`}>
            {visit.metrics.rate}%
          </span>
        </div>
      </div>
      <div className="mt-1.5 w-full bg-slate-700 rounded-full h-1">
        <div
          className={`h-1 rounded-full transition-all ${visit.metrics.rate >= 70 ? 'bg-emerald-500' : visit.metrics.rate >= 40 ? 'bg-amber-500' : 'bg-red-500'}`}
          style={{ width: `${visit.metrics.rate}%` }}
        />
      </div>
    </div>
  );
}

export function FullDashboard({ analysis, visits, onNewVisit, onCollapse }: Props) {
  const [copied, setCopied] = useState(false);
  const [showNote, setShowNote] = useState(false);

  const note = analysis ? generateNote(analysis.transcript, analysis) : null;

  const allVisits = analysis ? [...visits, analysis] : visits;
  const domainStats: DomainStats[] = computeDomainStats(allVisits);

  const exportJSON = useCallback(() => {
    if (!analysis) return;
    const payload = {
      visit_date: new Date(analysis.timestamp).toISOString().split('T')[0],
      patient: {
        age: analysis.demographics.age,
        gender: analysis.demographics.gender,
        extraction_confidence: analysis.demographics.confidence,
      },
      care_gaps: analysis.gaps
        .filter((g) => g.eligible)
        .map((g) => ({ name: g.name, status: g.status, confidence: g.confidence })),
      real_time_nudges: analysis.gaps
        .filter((g) => g.status === 'RED' && g.nudge)
        .map((g) => ({ care_gap: g.name, prompt: g.nudge })),
      metrics: analysis.metrics,
    };
    navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [analysis]);

  const green = analysis?.gaps.filter((g) => g.status === 'GREEN') ?? [];
  const red = analysis?.gaps.filter((g) => g.status === 'RED') ?? [];
  const nudges = analysis?.gaps.filter((g) => g.status === 'RED' && g.nudge) ?? [];

  return (
    <div className="fixed inset-0 bg-slate-950 z-40 flex flex-col overflow-hidden animate-fade-in">
      {/* Top Bar */}
      <div className="flex items-center gap-4 px-6 py-3 bg-slate-900 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-emerald-400" />
          <span className="text-white font-bold text-sm tracking-wide">HEDIS Care Gap Engine</span>
        </div>

        {/* Demographics badge */}
        {analysis?.demographics.age && (
          <div className="flex items-center gap-1.5 bg-slate-800 rounded-lg px-3 py-1">
            <User className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-sm text-white font-semibold">
              {analysis.demographics.age}
              {analysis.demographics.gender !== 'UNKNOWN' ? ` ${analysis.demographics.gender}` : ''}
            </span>
            <span className={`text-xs ml-1 ${analysis.demographics.confidence === 'HIGH' ? 'text-emerald-400' : 'text-amber-400'}`}>
              {analysis.demographics.confidence}
            </span>
          </div>
        )}

        {/* Metrics */}
        {analysis && (
          <div className="flex items-center gap-4 ml-2">
            <div className="text-center">
              <div className="text-lg font-bold text-emerald-400">{analysis.metrics.closed}</div>
              <div className="text-xs text-slate-500">Closed</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-red-400">{analysis.metrics.missed}</div>
              <div className="text-xs text-slate-500">Missed</div>
            </div>
            <div className="text-center">
              <div className={`text-lg font-bold ${analysis.metrics.rate >= 70 ? 'text-emerald-400' : analysis.metrics.rate >= 40 ? 'text-amber-400' : 'text-red-400'}`}>
                {analysis.metrics.rate}%
              </div>
              <div className="text-xs text-slate-500">Rate</div>
            </div>
          </div>
        )}

        <div className="ml-auto flex items-center gap-2">
          {analysis && (
            <button
              onClick={() => setShowNote((v) => !v)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                showNote
                  ? 'bg-blue-600 text-white hover:bg-blue-500'
                  : 'bg-blue-900/60 text-blue-300 border border-blue-700 hover:bg-blue-800/60'
              }`}
            >
              <ClipboardList className="w-3.5 h-3.5" />
              {showNote ? 'Hide Note' : 'Generate Note'}
            </button>
          )}
          <button
            onClick={exportJSON}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-700 text-slate-300 hover:bg-slate-600 transition-colors"
          >
            {copied ? <><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Copied!</> : <><Copy className="w-3.5 h-3.5" /> Export JSON</>}
          </button>
          <button
            onClick={onNewVisit}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-500 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> New Visit
          </button>
          <button
            onClick={onCollapse}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
            title="Collapse to mini widget"
          >
            <Minimize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 5-Column Grid + optional Note Panel */}
      <div className="flex-1 flex overflow-hidden">
      {/* Note slide-in panel */}
      {showNote && note && (
        <div className="w-96 shrink-0 border-r border-slate-700 bg-slate-950 flex flex-col overflow-hidden animate-slide-up">
          <NotePanel note={note} />
        </div>
      )}

      {/* 5-Column Grid */}
      <div className="flex-1 grid grid-cols-5 gap-0 overflow-hidden">
        {/* Col 1: Transcript */}
        <div className="border-r border-slate-800 flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-800 shrink-0">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-semibold text-white">Transcript</span>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-3">
            {analysis ? (
              <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                {analysis.transcript}
              </p>
            ) : (
              <p className="text-sm text-slate-600 italic">No transcript yet. Record dictation first.</p>
            )}
          </div>
        </div>

        {/* Col 2: Green Gaps */}
        <div className="border-r border-slate-800 flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-800 shrink-0">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span className="text-sm font-semibold text-white">Gaps Closed</span>
              {green.length > 0 && (
                <span className="ml-auto bg-emerald-900/60 text-emerald-400 text-xs font-bold px-2 py-0.5 rounded-full">
                  {green.length}
                </span>
              )}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
            {green.length === 0 && (
              <p className="text-sm text-slate-600 italic px-1">
                {analysis ? 'No gaps documented in transcript.' : 'Record to detect closed gaps.'}
              </p>
            )}
            {green.map((g) => <GapPill key={g.id} gap={g} />)}
          </div>
        </div>

        {/* Col 3: Red Gaps */}
        <div className="border-r border-slate-800 flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-800 shrink-0">
            <div className="flex items-center gap-2">
              <XCircle className="w-4 h-4 text-red-400" />
              <span className="text-sm font-semibold text-white">Gaps Missed</span>
              {red.length > 0 && (
                <span className="ml-auto bg-red-900/60 text-red-400 text-xs font-bold px-2 py-0.5 rounded-full">
                  {red.length}
                </span>
              )}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
            {red.length === 0 && (
              <p className="text-sm text-slate-600 italic px-1">
                {analysis ? 'All eligible gaps documented! Great work.' : 'Record to detect missed gaps.'}
              </p>
            )}
            {red.map((g) => <GapPill key={g.id} gap={g} />)}
          </div>
        </div>

        {/* Col 4: Nudges */}
        <div className="border-r border-slate-800 flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-800 shrink-0">
            <div className="flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-amber-400" />
              <span className="text-sm font-semibold text-white">Clinical Nudges</span>
              {nudges.length > 0 && (
                <span className="ml-auto bg-amber-900/60 text-amber-400 text-xs font-bold px-2 py-0.5 rounded-full">
                  {nudges.length}
                </span>
              )}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
            {nudges.length === 0 && (
              <p className="text-sm text-slate-600 italic px-1">
                {analysis ? 'No nudges — all eligible gaps addressed.' : 'Nudges appear for missed care opportunities.'}
              </p>
            )}
            {nudges.map((g) => (
              <div key={g.id} className="bg-amber-950/40 border border-amber-800/50 rounded-lg p-3 animate-slide-up">
                <div className="flex items-start gap-2">
                  <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-amber-400 mb-1">{g.name}</p>
                    <p className="text-xs text-amber-200/80 leading-relaxed">{g.nudge}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Col 5: History + Heatmap */}
        <div className="flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-800 shrink-0">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-semibold text-white">Visit History</span>
              {visits.length > 0 && (
                <span className="ml-auto bg-blue-900/60 text-blue-400 text-xs font-bold px-2 py-0.5 rounded-full">
                  {visits.length}
                </span>
              )}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
            {visits.length === 0 && (
              <p className="text-sm text-slate-600 italic px-1">No prior visits saved.</p>
            )}
            {visits.slice().reverse().map((v, i) => (
              <VisitCard key={v.id} visit={v} index={visits.length - 1 - i} />
            ))}
          </div>

          {/* Performance heatmap */}
          <div className="border-t border-slate-800 px-3 py-3 shrink-0">
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Performance</span>
            </div>
            <Heatmap stats={domainStats} />
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
