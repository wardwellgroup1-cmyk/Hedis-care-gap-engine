// ── RecallAlert ───────────────────────────────────────────────────────────────
// Shown at the top of the Coding tab when prior chronic conditions
// weren't mentioned in today's dictation.
// Provider can "Add to Visit" to inject a condition into the current session.

import { useState } from 'react';
import { History, Plus, X, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';
import { RecallCondition } from '../types';
import { daysSinceLastSeen } from '../engine/chronicRecall';

interface Props {
  alerts: RecallCondition[];
  onAdd: (condition: RecallCondition) => void;
  onDismiss: () => void;
}

export function RecallAlert({ alerts, onAdd, onDismiss }: Props) {
  const [expanded, setExpanded] = useState(true);
  const [added, setAdded] = useState<Set<string>>(new Set());

  if (alerts.length === 0) return null;

  const hccAlerts = alerts.filter((a) => a.hccNumber);
  const nonHccAlerts = alerts.filter((a) => !a.hccNumber);

  function handleAdd(condition: RecallCondition) {
    setAdded((prev) => new Set(prev).add(condition.id));
    onAdd(condition);
  }

  return (
    <div className="mx-4 mt-3 rounded-xl border border-amber-700/50 bg-amber-950/30 animate-slide-up">
      {/* Header */}
      <div
        className="flex items-center gap-2 px-3 py-2.5 cursor-pointer hover:bg-amber-900/10 rounded-t-xl"
        onClick={() => setExpanded((e) => !e)}
      >
        <History className="w-4 h-4 text-amber-400 shrink-0" />
        <div className="flex-1 min-w-0">
          <span className="text-sm font-semibold text-amber-300">
            {alerts.length} Recalled Condition{alerts.length !== 1 ? 's' : ''} Not Yet Documented
          </span>
          <p className="text-xs text-amber-600 mt-0.5">
            Chronic conditions from prior visits — add to today's visit if still active
          </p>
        </div>
        {hccAlerts.length > 0 && (
          <span className="text-xs bg-amber-900/60 text-amber-400 border border-amber-700/60 px-1.5 py-0.5 rounded font-bold shrink-0">
            {hccAlerts.length} HCC
          </span>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); onDismiss(); }}
          className="p-1 rounded hover:bg-slate-700 text-slate-500 hover:text-slate-300 transition-colors shrink-0"
          title="Dismiss for this session"
        >
          <X className="w-3.5 h-3.5" />
        </button>
        {expanded
          ? <ChevronUp className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          : <ChevronDown className="w-3.5 h-3.5 text-slate-500 shrink-0" />
        }
      </div>

      {/* Condition list */}
      {expanded && (
        <div className="border-t border-amber-800/30 px-3 pb-3 pt-2 space-y-1.5">
          {/* HCC conditions first */}
          {hccAlerts.length > 0 && (
            <>
              <p className="text-xs text-amber-700 font-semibold uppercase tracking-wider px-1 mb-1">
                HCC Conditions (RAF Impact)
              </p>
              {hccAlerts.map((c) => (
                <RecallRow
                  key={c.id}
                  condition={c}
                  added={added.has(c.id)}
                  onAdd={handleAdd}
                />
              ))}
            </>
          )}

          {/* Non-HCC conditions */}
          {nonHccAlerts.length > 0 && (
            <>
              {hccAlerts.length > 0 && (
                <p className="text-xs text-slate-600 font-semibold uppercase tracking-wider px-1 mt-2 mb-1">
                  Other Chronic Conditions
                </p>
              )}
              {nonHccAlerts.map((c) => (
                <RecallRow
                  key={c.id}
                  condition={c}
                  added={added.has(c.id)}
                  onAdd={handleAdd}
                />
              ))}
            </>
          )}

          <p className="text-xs text-amber-800 flex items-center gap-1 mt-2 px-1">
            <AlertTriangle className="w-3 h-3" />
            Added conditions need MEAT documentation for RAF validity — dictate assessment &amp; treatment
          </p>
        </div>
      )}
    </div>
  );
}

// ── Individual recall row ─────────────────────────────────────────────────────

function RecallRow({
  condition,
  added,
  onAdd,
}: {
  condition: RecallCondition;
  added: boolean;
  onAdd: (c: RecallCondition) => void;
}) {
  const days = daysSinceLastSeen(condition.lastSeen);
  const weeksAgo = Math.floor(days / 7);
  const monthsAgo = Math.floor(days / 30);
  const timeLabel =
    days < 8 ? `${days}d ago` :
    days < 60 ? `${weeksAgo}w ago` :
    `${monthsAgo}mo ago`;

  return (
    <div
      className={`flex items-center gap-2 px-2.5 py-2 rounded-lg border transition-all ${
        added
          ? 'bg-emerald-950/40 border-emerald-800/40'
          : 'bg-slate-900/60 border-slate-700/60 hover:border-amber-700/40'
      }`}
    >
      {/* Label + code */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`text-sm font-medium ${added ? 'text-emerald-300' : 'text-slate-200'}`}>
            {condition.label}
          </span>
          <span className="font-mono text-xs text-slate-500 bg-slate-800 px-1 py-0.5 rounded">
            {condition.icd10Code}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-slate-500">
            {condition.encounters} encounter{condition.encounters !== 1 ? 's' : ''} · last {timeLabel}
          </span>
          {condition.hccNumber && (
            <span className="text-xs text-emerald-500 font-medium">
              HCC {condition.hccNumber} · +{(condition.hccRAF ?? 0).toFixed(3)} RAF
            </span>
          )}
        </div>
      </div>

      {/* Add button */}
      {added ? (
        <span className="text-xs text-emerald-400 font-semibold shrink-0 flex items-center gap-1">
          ✓ Added
        </span>
      ) : (
        <button
          onClick={() => onAdd(condition)}
          className="flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold bg-amber-900/60 text-amber-300 border border-amber-700/60 hover:bg-amber-800/60 transition-colors shrink-0"
        >
          <Plus className="w-3 h-3" /> Add
        </button>
      )}
    </div>
  );
}
