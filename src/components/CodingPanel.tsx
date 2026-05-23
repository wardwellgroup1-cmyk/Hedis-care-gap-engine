import { useState, useCallback } from 'react';
import {
  CheckCircle2, AlertTriangle, XCircle, ChevronDown, ChevronUp,
  Copy, CheckCheck, Activity,
} from 'lucide-react';
import { ClinicalProblem, RAFResult } from '../types';
import { toStructuredJSON } from '../engine/clinicalNLP';

// ── Problem Card ──────────────────────────────────────────────────────────────

function ProblemCard({ problem, onChange }: {
  problem: ClinicalProblem;
  onChange: (id: string, code: string, desc: string) => void;
}) {
  const [open, setOpen] = useState(false);

  const { negated, uncertain, hcc } = problem;
  const hasHCC = !!hcc && !hcc.suppressedByHierarchy;

  const borderColor = negated
    ? 'border-slate-700'
    : uncertain
    ? 'border-amber-700/60'
    : hasHCC
    ? 'border-emerald-700/60'
    : 'border-slate-700';

  const badgeBg = negated
    ? 'bg-slate-700 text-slate-400'
    : uncertain
    ? 'bg-amber-900/60 text-amber-400'
    : hasHCC
    ? 'bg-emerald-900/60 text-emerald-400'
    : 'bg-slate-800 text-slate-400';

  return (
    <div className={`rounded-lg border ${borderColor} bg-slate-900/60 animate-slide-up transition-all`}>
      {/* Header row */}
      <div
        className="flex items-center gap-2 px-3 py-2.5 cursor-pointer hover:bg-slate-800/40 rounded-t-lg"
        onClick={() => setOpen((o) => !o)}
      >
        {negated ? (
          <XCircle className="w-4 h-4 text-slate-500 shrink-0" />
        ) : uncertain ? (
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
        ) : (
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
        )}

        <div className="flex-1 min-w-0">
          <span className={`text-sm font-medium ${negated ? 'text-slate-500 line-through' : uncertain ? 'text-amber-200' : 'text-white'}`}>
            {problem.label}
          </span>
          {Object.keys(problem.attributes).length > 0 && (
            <span className="ml-1.5 text-xs text-slate-500">
              {[problem.attributes.laterality, problem.attributes.acuity, problem.attributes.severity]
                .filter(Boolean).join(' · ')}
            </span>
          )}
        </div>

        {/* ICD-10 badge */}
        <span className="font-mono text-xs text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded shrink-0">
          {problem.selectedCode}
        </span>

        {/* HCC badge */}
        {hasHCC && !negated && (
          <span className={`text-xs font-bold px-2 py-0.5 rounded ${badgeBg} shrink-0`}>
            HCC {hcc!.number} · +{hcc!.raf.toFixed(3)}
          </span>
        )}

        {hcc?.suppressedByHierarchy && !negated && (
          <span className="text-xs text-slate-600 px-1.5 rounded border border-slate-700 shrink-0">
            HCC {hcc.number} suppressed
          </span>
        )}

        {uncertain && (
          <span className="text-xs text-amber-500 shrink-0">Uncertain</span>
        )}
        {negated && (
          <span className="text-xs text-slate-500 shrink-0">Negated</span>
        )}

        {open ? <ChevronUp className="w-3.5 h-3.5 text-slate-500 shrink-0" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-500 shrink-0" />}
      </div>

      {/* Expanded detail */}
      {open && (
        <div className="px-3 pb-3 pt-1 border-t border-slate-800 space-y-2">
          <p className="text-xs text-slate-400 mb-2">{problem.selectedDescription}</p>

          {/* TOAD Framework */}
          <div className="bg-slate-800/60 border border-slate-700 rounded-lg overflow-hidden">
            <div className="px-3 py-1.5 bg-slate-800 border-b border-slate-700">
              <span className="text-xs font-bold text-slate-400 tracking-widest uppercase">TOAD</span>
            </div>
            <div className="grid grid-cols-2 gap-0">
              {[
                { label: 'T · Type', value: problem.toad.type },
                { label: 'O · Onset', value: problem.toad.onset },
                { label: 'A · Anatomy', value: problem.toad.anatomy },
                { label: 'D · Detail', value: problem.toad.detail },
              ].map(({ label, value }) => (
                <div key={label} className="px-3 py-2 border-b border-r border-slate-700/50 last:border-b-0">
                  <p className="text-xs text-slate-500 font-semibold mb-0.5">{label}</p>
                  <p className="text-xs text-slate-200 leading-relaxed">{value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Alternative code picker */}
          {problem.suggestedCodes.length > 1 && (
            <div>
              <p className="text-xs text-slate-500 mb-1">Select ICD-10 code:</p>
              <div className="space-y-1">
                {problem.suggestedCodes.map((s) => (
                  <button
                    key={s.code}
                    onClick={() => onChange(problem.id, s.code, s.description)}
                    className={`w-full text-left flex items-center gap-2 px-2 py-1.5 rounded text-xs transition-colors ${
                      s.code === problem.selectedCode
                        ? 'bg-blue-900/60 border border-blue-700 text-blue-200'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-400'
                    }`}
                  >
                    <span className="font-mono shrink-0">{s.code}</span>
                    <span className="flex-1">{s.description}</span>
                    <span className={`text-xs px-1 rounded ${
                      s.confidence === 'HIGH' ? 'text-emerald-400' :
                      s.confidence === 'MEDIUM' ? 'text-amber-400' : 'text-slate-500'
                    }`}>{s.confidence}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {hasHCC && !negated && (
            <div className="flex items-center gap-2 bg-emerald-950/40 border border-emerald-800/40 rounded px-2 py-1.5">
              <Activity className="w-3 h-3 text-emerald-400 shrink-0" />
              <span className="text-xs text-emerald-300">
                HCC {hcc!.number}: {hcc!.description} — RAF contribution: <strong>+{hcc!.raf.toFixed(3)}</strong>
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── RAF Summary ───────────────────────────────────────────────────────────────

function RAFSummary({ raf }: { raf: RAFResult }) {
  const color =
    raf.totalRAF >= 2.0 ? 'text-red-400' :
    raf.totalRAF >= 1.5 ? 'text-amber-400' :
    raf.totalRAF >= 1.0 ? 'text-yellow-400' : 'text-emerald-400';

  return (
    <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4 space-y-3">
      {/* Total RAF */}
      <div className="flex items-end gap-2">
        <span className={`text-4xl font-black ${color}`}>{raf.totalRAF.toFixed(3)}</span>
        <span className="text-slate-400 text-sm mb-1">Total RAF Score</span>
      </div>

      {/* Breakdown */}
      <div className="space-y-1.5 text-xs">
        <div className="flex justify-between text-slate-400">
          <span>Demographic (Age/Gender)</span>
          <span className="font-mono text-slate-300">+{raf.demographicRAF.toFixed(3)}</span>
        </div>
        {raf.activeHCCs.map((h) => (
          <div key={h.number} className="flex justify-between text-slate-300">
            <span>HCC {h.number}: {h.description}</span>
            <span className="font-mono text-emerald-400">+{h.raf.toFixed(3)}</span>
          </div>
        ))}
        {raf.interactionsApplied.map((label) => (
          <div key={label} className="flex justify-between text-blue-300">
            <span>Interaction: {label}</span>
            <span className="font-mono text-blue-400">+{(raf.interactionRAF / raf.interactionsApplied.length).toFixed(3)}</span>
          </div>
        ))}
        <div className="border-t border-slate-700 pt-1.5 flex justify-between font-semibold text-white">
          <span>Total RAF</span>
          <span className={`font-mono ${color}`}>{raf.totalRAF.toFixed(3)}</span>
        </div>
      </div>

      {/* Risk tier */}
      <div className={`text-xs rounded px-2 py-1 ${
        raf.totalRAF >= 2.0 ? 'bg-red-900/40 text-red-300 border border-red-800/40' :
        raf.totalRAF >= 1.5 ? 'bg-amber-900/40 text-amber-300 border border-amber-800/40' :
        raf.totalRAF >= 1.0 ? 'bg-yellow-900/40 text-yellow-300 border border-yellow-800/40' :
        'bg-slate-800 text-slate-400 border border-slate-700'
      }`}>
        {raf.totalRAF >= 2.0 ? '⚠️ High complexity patient — significant resource utilization expected' :
         raf.totalRAF >= 1.5 ? '⚡ Above average complexity — close care coordination recommended' :
         raf.totalRAF >= 1.0 ? '📊 Moderate complexity — active chronic condition management' :
         '✅ Lower complexity — routine preventive focus'}
      </div>
    </div>
  );
}

// ── Main CodingPanel ──────────────────────────────────────────────────────────

interface Props {
  problems: ClinicalProblem[];
  raf: RAFResult | null;
  onCodeChange: (id: string, code: string, desc: string) => void;
}

export function CodingPanel({ problems, raf, onCodeChange }: Props) {
  const [copied, setCopied] = useState(false);

  const copyJSON = useCallback(() => {
    const json = toStructuredJSON(problems);
    navigator.clipboard.writeText(JSON.stringify(json, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [problems]);

  const active = problems.filter((p) => !p.negated);
  const negated = problems.filter((p) => p.negated);
  const hccCount = problems.filter((p) => !p.negated && p.hcc && !p.hcc.suppressedByHierarchy).length;

  return (
    <div className="flex gap-0 h-full overflow-hidden">
      {/* Left: problem list */}
      <div className="flex-1 flex flex-col overflow-hidden border-r border-slate-800">
        <div className="px-4 py-3 border-b border-slate-800 shrink-0 flex items-center gap-3">
          <span className="text-sm font-semibold text-white">Extracted Problems</span>
          <span className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full">{active.length} active</span>
          {hccCount > 0 && (
            <span className="text-xs bg-emerald-900/60 text-emerald-400 px-2 py-0.5 rounded-full">{hccCount} HCC</span>
          )}
          <button
            onClick={copyJSON}
            className="ml-auto flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg bg-slate-700 text-slate-300 hover:bg-slate-600 transition-colors"
          >
            {copied ? <><CheckCheck className="w-3 h-3 text-emerald-400" /> Copied</> : <><Copy className="w-3 h-3" /> Copy JSON</>}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
          {problems.length === 0 && (
            <div className="text-center py-12 text-slate-600">
              <p className="text-sm">No diagnoses extracted yet.</p>
              <p className="text-xs mt-1">Record a dictation note to begin.</p>
            </div>
          )}

          {/* Active problems */}
          {active.map((p) => (
            <ProblemCard key={p.id} problem={p} onChange={onCodeChange} />
          ))}

          {/* Negated problems (collapsed section) */}
          {negated.length > 0 && (
            <div className="pt-2">
              <p className="text-xs text-slate-600 mb-1.5 px-1">Negated / Ruled Out</p>
              {negated.map((p) => (
                <ProblemCard key={p.id} problem={p} onChange={onCodeChange} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right: RAF summary */}
      <div className="w-72 shrink-0 flex flex-col overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-800 shrink-0">
          <span className="text-sm font-semibold text-white">HCC / RAF Score</span>
          <p className="text-xs text-slate-500 mt-0.5">CMS-HCC v28 · 2024</p>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {raf ? (
            <RAFSummary raf={raf} />
          ) : (
            <div className="text-center py-12 text-slate-600 text-sm">
              Record dictation to calculate RAF score.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
