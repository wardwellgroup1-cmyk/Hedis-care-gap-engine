// ── Chronic Condition Recall Engine ──────────────────────────────────────────
// Persists chronic conditions across visits so providers are reminded to
// re-document (and re-code) conditions from prior encounters that weren't
// mentioned in today's dictation.
//
// Storage: localStorage key 'hedis_chronic_recall_v1'
// Alert trigger: chronic condition seen in past 12 months, NOT in today's problems

import { ClinicalProblem, RecallCondition, MEATStatus } from '../types';
import { detectMEAT } from './meatDetector';

const RECALL_KEY = 'hedis_chronic_recall_v1';

// Condition IDs that qualify as chronic (worth recalling across visits)
const CHRONIC_CONDITION_IDS = new Set([
  'dm2', 'dm2_ckd', 'dm2_neuropathy', 'dm2_eye', 'dm2_hyperosmolar', 'dm2_dka', 'dm1',
  'chf', 'chf_systolic', 'chf_diastolic',
  'acute_mi', 'cad', 'afib', 'aflutter', 'htn', 'pvd', 'dvt', 'pe',
  'ischemic_stroke', 'hemorrhagic_stroke', 'tia', 'hemiplegia',
  'parkinsons', 'alzheimers', 'ms', 'epilepsy', 'als',
  'copd', 'copd_exacerbation', 'asthma', 'pulm_fibrosis', 'cystic_fibrosis',
  'ckd_unspec', 'ckd3', 'ckd4', 'ckd5', 'esrd_dialysis',
  'schizophrenia', 'bipolar', 'mdd', 'anxiety', 'ptsd', 'drug_dependence',
  'esld', 'cirrhosis', 'chronic_hep',
  'metastatic_cancer', 'lung_cancer', 'colorectal_cancer', 'breast_cancer', 'prostate_cancer', 'lymphoma',
  'ra', 'osteoporosis', 'morbid_obesity',
  'hypothyroid', 'hyperthyroid', 'malnutrition', 'sickle_cell', 'anemia',
  'ibd', 'hiv', 'hyperlipidemia',
]);

// ── CRUD ───────────────────────────────────────────────────────────────────────

export function loadRecallConditions(): RecallCondition[] {
  try {
    return JSON.parse(localStorage.getItem(RECALL_KEY) ?? '[]');
  } catch {
    return [];
  }
}

export function saveRecallConditions(conditions: RecallCondition[]): void {
  localStorage.setItem(RECALL_KEY, JSON.stringify(conditions));
}

/** Call at end of visit (handleNewVisit) to persist chronic conditions */
export function updateRecallFromProblems(problems: ClinicalProblem[]): void {
  const existing = loadRecallConditions();
  const today = new Date().toISOString().split('T')[0];

  for (const p of problems) {
    if (!CHRONIC_CONDITION_IDS.has(p.id) || p.negated) continue;

    const idx = existing.findIndex((e) => e.id === p.id);
    if (idx >= 0) {
      // Update existing entry
      existing[idx].lastSeen = today;
      existing[idx].encounters += 1;
      existing[idx].icd10Code = p.selectedCode;
      existing[idx].label = p.label;
      if (p.hcc) {
        existing[idx].hccNumber = p.hcc.number;
        existing[idx].hccRAF = p.hcc.raf;
      }
    } else {
      // New entry
      existing.push({
        id: p.id,
        label: p.label,
        icd10Code: p.selectedCode,
        lastSeen: today,
        encounters: 1,
        hccNumber: p.hcc?.number,
        hccRAF: p.hcc?.raf,
      });
    }
  }

  saveRecallConditions(existing);
}

/** Returns prior chronic conditions NOT mentioned in today's problems */
export function getRecallAlerts(currentProblems: ClinicalProblem[]): RecallCondition[] {
  const all = loadRecallConditions();
  const currentIds = new Set(currentProblems.map((p) => p.id));

  // Cutoff: 12 months ago
  const cutoffDate = new Date();
  cutoffDate.setFullYear(cutoffDate.getFullYear() - 1);
  const cutoff = cutoffDate.toISOString().split('T')[0];

  return all
    .filter((c) => !currentIds.has(c.id) && c.lastSeen >= cutoff)
    .sort((a, b) => {
      // Sort HCC conditions first (highest RAF first), then alphabetically
      const rafA = a.hccRAF ?? 0;
      const rafB = b.hccRAF ?? 0;
      return rafB - rafA;
    });
}

/** How many days ago was a condition last seen */
export function daysSinceLastSeen(lastSeen: string): number {
  const last = new Date(lastSeen).getTime();
  const now = Date.now();
  return Math.floor((now - last) / (1000 * 60 * 60 * 24));
}

/** Creates a synthetic ClinicalProblem from a recalled condition for injection into the session */
export function createProblemFromRecall(
  condition: RecallCondition,
  transcript: string
): ClinicalProblem {
  const syntheticProblem: ClinicalProblem = {
    id: condition.id,
    rawText: '[recalled from prior visit]',
    label: condition.label,
    negated: false,
    uncertain: false,
    toad: {
      type: `${condition.label} — recalled condition`,
      onset: 'chronic',
      anatomy: 'See prior visit documentation',
      detail: `Last documented on ${condition.lastSeen} · ${condition.encounters} prior encounter(s) · Recoded: ${condition.icd10Code}`,
    },
    attributes: {},
    suggestedCodes: [
      { code: condition.icd10Code, description: condition.label, confidence: 'HIGH' },
    ],
    selectedCode: condition.icd10Code,
    selectedDescription: condition.label,
    hcc: condition.hccNumber
      ? {
          number: condition.hccNumber,
          description: `HCC ${condition.hccNumber}`,
          raf: condition.hccRAF ?? 0,
          suppressedByHierarchy: false,
        }
      : undefined,
    isRecalled: true,
  };

  // Run MEAT detection against current transcript
  syntheticProblem.meat = detectMEAT(syntheticProblem, transcript);

  return syntheticProblem;
}

/** Remove a specific condition from recall (e.g. patient resolved it) */
export function removeFromRecall(conditionId: string): void {
  const existing = loadRecallConditions().filter((c) => c.id !== conditionId);
  saveRecallConditions(existing);
}

/** Clear all recall data (useful for demo/reset) */
export function clearRecall(): void {
  localStorage.removeItem(RECALL_KEY);
}
