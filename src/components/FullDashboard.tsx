import { useState, useCallback } from 'react';
import {
  Minimize2, Plus, Copy, CheckCircle2, User, BarChart3,
  ClipboardList, Activity, ShieldCheck,
} from 'lucide-react';
import { ClinicalProblem, RAFResult, HEDISResult, Demographics, DashTab, RecallCondition } from '../types';
import { CodingPanel } from './CodingPanel';
import { NotePanel } from './NotePanel';
import { generateNote } from '../engine/noteGenerator';

// ── HEDIS sub-panels (lazy import to keep bundle lean) ───────────────────────
import { Heatmap } from './Heatmap';
import { GapResult, DomainStats, AnalysisResult, GapStatus, Confidence } from '../types';
import { computeDomainStats } from '../engine/analyzer';

// Build a minimal AnalysisResult shape the existing HEDIS helpers expect
function makeAnalysis(transcript: string, demographics: Demographics, hedis: HEDISResult): AnalysisResult {
  return {
    id: 'current',
    timestamp: new Date().toISOString(),
    transcript,
    demographics,
    gaps: hedis.gaps,
    metrics: hedis.metrics,
  };
}

function HEDISPanel({ hedis, visits }: { hedis: HEDISResult; visits: AnalysisResult[] }) {
  const allVisits = [...visits, makeAnalysis('', { age: null, gender: 'UNKNOWN', confidence: 'LOW' }, hedis)];
  const domainStats: DomainStats[] = computeDomainStats(allVisits);
  const green = hedis.gaps.filter((g) => g.status === 'GREEN');
  const red = hedis.gaps.filter((g) => g.status === 'RED');

  return (
    <div className="flex h-full overflow-hidden gap-0">
      {/* Green */}
      <div className="flex-1 border-r border-slate-800 flex flex-col overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-800 shrink-0 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span className="text-sm font-semibold text-white">Gaps Closed</span>
          <span className="ml-auto bg-emerald-900/60 text-emerald-400 text-xs font-bold px-2 py-0.5 rounded-full">{green.length}</span>
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1.5">
          {green.length === 0 && <p className="text-sm text-slate-600 italic px-1">No gaps closed in this dictation.</p>}
          {green.map((g) => (
            <div key={g.id} className="bg-emerald-950/40 border border-emerald-800/50 rounded-lg px-3 py-2">
              <p className="text-sm text-emerald-300 font-medium">{g.name}</p>
              {g.evidence && <p className="text-xs text-emerald-500 mt-0.5">"{g.evidence}"</p>}
            </div>
          ))}
        </div>
      </div>
      {/* Red */}
      <div className="flex-1 border-r border-slate-800 flex flex-col overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-800 shrink-0 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-red-400" />
          <span className="text-sm font-semibold text-white">Gaps Missed</span>
          <span className="ml-auto bg-red-900/60 text-red-400 text-xs font-bold px-2 py-0.5 rounded-full">{red.length}</span>
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1.5">
          {red.length === 0 && <p className="text-sm text-slate-600 italic px-1">All eligible gaps addressed!</p>}
          {red.map((g) => (
            <div key={g.id} className="bg-red-950/40 border border-red-800/50 rounded-lg px-3 py-2">
              <p className="text-sm text-red-300 font-medium">{g.name}</p>
              {g.nudge && <p className="text-xs text-amber-400/80 mt-0.5">{g.nudge}</p>}
            </div>
          ))}
        </div>
      </div>
      {/* Performance */}
      <div className="w-56 shrink-0 flex flex-col overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-800 shrink-0">
          <span className="text-sm font-semibold text-white">Performance</span>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <Heatmap stats={domainStats} />
          <div className="mt-4 text-center">
            <div className={`text-2xl font-black ${hedis.metrics.rate >= 70 ? 'text-emerald-400' : hedis.metrics.rate >= 40 ? 'text-amber-400' : 'text-red-400'}`}>
              {hedis.metrics.rate}%
            </div>
            <div className="text-xs text-slate-500">Closure Rate</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main FullDashboard ────────────────────────────────────────────────────────

interface Props {
  transcript: string;
  demographics: Demographics;
  problems: ClinicalProblem[];
  raf: RAFResult | null;
  hedis: HEDISResult | null;
  visits: AnalysisResult[];
  specChanges?: string[];
  recallAlerts?: RecallCondition[];
  onCodeChange: (id: string, code: string, desc: string) => void;
  onAddRecalled?: (condition: RecallCondition) => void;
  onNewVisit: () => void;
  onCollapse: () => void;
}

export function FullDashboard({
  transcript,
  demographics,
  problems,
  raf,
  hedis,
  visits,
  specChanges = [],
  recallAlerts = [],
  onCodeChange,
  onAddRecalled,
  onNewVisit,
  onCollapse,
}: Props) {
  const [activeTab, setActiveTab] = useState<DashTab>('coding');
  const [copied, setCopied] = useState(false);

  const note = transcript ? generateNote(transcript, {
    id: 'n', timestamp: new Date().toISOString(), transcript,
    demographics, gaps: hedis?.gaps ?? [],
    metrics: hedis?.metrics ?? { closed: 0, missed: 0, total: 0, rate: 0 },
  }) : null;

  const exportJSON = useCallback(() => {
    const payload = {
      visit_date: new Date().toISOString().split('T')[0],
      patient: { age: demographics.age, gender: demographics.gender },
      raf_score: raf?.totalRAF ?? 0,
      hcc_count: raf?.activeHCCs.length ?? 0,
      problems: problems.filter((p) => !p.negated).map((p) => ({
        label: p.label,
        icd10: p.selectedCode,
        description: p.selectedDescription,
        hcc: p.hcc && !p.hcc.suppressedByHierarchy ? p.hcc.number : null,
        raf_contribution: p.hcc && !p.hcc.suppressedByHierarchy ? p.hcc.raf : 0,
        uncertain: p.uncertain,
      })),
      hedis_metrics: hedis?.metrics,
    };
    navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [demographics, problems, raf, hedis]);

  const tabs = [
    { id: 'coding' as DashTab, label: 'ICD-10 / HCC / RAF', icon: Activity },
    { id: 'note' as DashTab, label: 'Physician Note', icon: ClipboardList },
    { id: 'hedis' as DashTab, label: 'HEDIS Gaps', icon: ShieldCheck },
  ];

  return (
    <div className="fixed inset-0 bg-slate-950 z-40 flex flex-col overflow-hidden animate-fade-in">
      {/* Top Bar */}
      <div className="flex items-center gap-3 px-5 py-2.5 bg-slate-900 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-emerald-400" />
          <span className="text-white font-bold text-sm tracking-wide">Clinical Coding Engine</span>
        </div>

        {/* Patient badge */}
        {demographics.age && (
          <div className="flex items-center gap-1.5 bg-slate-800 rounded-lg px-2.5 py-1">
            <User className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-sm text-white font-semibold">
              {demographics.age}{demographics.gender !== 'UNKNOWN' ? ` ${demographics.gender}` : ''}
            </span>
          </div>
        )}

        {/* RAF score badge */}
        {raf && (
          <div className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 ${
            raf.totalRAF >= 2.0 ? 'bg-red-900/60 border border-red-800' :
            raf.totalRAF >= 1.5 ? 'bg-amber-900/60 border border-amber-800' :
            raf.totalRAF >= 1.0 ? 'bg-yellow-900/40 border border-yellow-800' :
            'bg-slate-800 border border-slate-700'
          }`}>
            <Activity className="w-3.5 h-3.5 text-slate-300" />
            <span className="text-sm font-bold text-white">RAF {raf.totalRAF.toFixed(3)}</span>
            <span className="text-xs text-slate-400">· {raf.activeHCCs.length} HCC</span>
          </div>
        )}

        {/* Tab bar */}
        <div className="flex items-center gap-1 ml-2 bg-slate-800 rounded-lg p-0.5">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                activeTab === id
                  ? 'bg-slate-700 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              } ${id === 'hedis' && activeTab !== 'hedis' ? 'opacity-60' : ''}`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
              {id === 'hedis' && hedis && hedis.metrics.missed > 0 && (
                <span className="ml-0.5 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
                  {hedis.metrics.missed}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={exportJSON}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-700 text-slate-300 hover:bg-slate-600 transition-colors"
          >
            {copied ? <><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Copied!</> : <><Copy className="w-3.5 h-3.5" /> Export</>}
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

      {/* Tab content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'coding' && (
          <CodingPanel
            problems={problems}
            raf={raf}
            specChanges={specChanges}
            recallAlerts={recallAlerts}
            onCodeChange={onCodeChange}
            onAddRecalled={onAddRecalled}
          />
        )}
        {activeTab === 'note' && note && (
          <NotePanel note={note} />
        )}
        {activeTab === 'note' && !note && (
          <div className="flex items-center justify-center h-full text-slate-600 text-sm">
            Record a dictation first to generate a note.
          </div>
        )}
        {activeTab === 'hedis' && hedis && (
          <HEDISPanel hedis={hedis} visits={visits} />
        )}
        {activeTab === 'hedis' && !hedis && (
          <div className="flex items-center justify-center h-full text-slate-600 text-sm">
            Record a dictation first to evaluate HEDIS gaps.
          </div>
        )}
      </div>
    </div>
  );
}
