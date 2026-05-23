import { ClinicalProblem, RAFResult, HCCAssignment } from '../types';
import { CODE_DATABASE } from './codingData';

// ── Demographic RAF (CMS-HCC v28 2024, Community Non-Dual) ────────────────────
// Community Non-Dual Aged: most common Medicare Advantage population
const DEMO_RAF: Record<string, Record<string, number>> = {
  female: {
    '0-34': 0.267, '35-44': 0.319, '45-54': 0.355,
    '55-59': 0.376, '60-64': 0.421,
    '65-69': 0.379, '70-74': 0.421, '75-79': 0.470,
    '80-84': 0.527, '85-89': 0.568, '90-94': 0.610, '95+': 0.641,
  },
  male: {
    '0-34': 0.267, '35-44': 0.335, '45-54': 0.387,
    '55-59': 0.421, '60-64': 0.481,
    '65-69': 0.421, '70-74': 0.481, '75-79': 0.557,
    '80-84': 0.621, '85-89': 0.668, '90-94': 0.715, '95+': 0.762,
  },
};

function ageGroup(age: number): string {
  if (age < 35) return '0-34';
  if (age < 45) return '35-44';
  if (age < 55) return '45-54';
  if (age < 60) return '55-59';
  if (age < 65) return '60-64';
  if (age < 70) return '65-69';
  if (age < 75) return '70-74';
  if (age < 80) return '75-79';
  if (age < 85) return '80-84';
  if (age < 90) return '85-89';
  if (age < 95) return '90-94';
  return '95+';
}

export function getDemographicRAF(age: number | null, gender: string): number {
  if (age === null) return 0.42; // average fallback
  const g = gender === 'FEMALE' ? 'female' : gender === 'MALE' ? 'male' : 'female';
  const ag = ageGroup(age);
  return DEMO_RAF[g]?.[ag] ?? 0.42;
}

// ── HCC Hierarchy groups ───────────────────────────────────────────────────────
// Within each group, only the HCC with the highest hierarchyRank counts
const HIERARCHY_GROUPS: Record<string, string[]> = {
  diabetes:    ['dm2_hyperosmolar','dm2_dka','dm2_neuropathy','dm2_ckd','dm2_eye','dm2','dm1'],
  ckd:         ['esrd_dialysis','aki','ckd5','ckd4','ckd3','ckd_unspec'],
  heart:       ['chf_systolic','chf_diastolic','chf','acute_mi','cad'],
  vascular:    ['pe','dvt','pvd'],
  stroke:      ['hemorrhagic_stroke','ischemic_stroke'],
  paralysis:   ['hemiplegia'],
  psychiatric: ['schizophrenia','bipolar','mdd'],
  liver:       ['esld','cirrhosis','chronic_hep'],
  cancer:      ['metastatic_cancer','lymphoma','lung_cancer','colorectal_cancer','breast_cancer','prostate_cancer'],
  lung:        ['copd_exacerbation','copd','pulm_fibrosis'],
};

// ── Interaction factors (CMS-HCC v28, community non-dual aged) ─────────────────
interface Interaction {
  label: string;
  hccs: number[];     // must ALL be present and active
  value: number;
}

const INTERACTIONS: Interaction[] = [
  { label: 'CHF + AFib', hccs: [85, 96], value: 0.115 },
  { label: 'CHF + COPD', hccs: [85, 111], value: 0.206 },
  { label: 'DM + CHF', hccs: [19, 85], value: 0.121 },
  { label: 'DM (chronic) + CHF', hccs: [18, 85], value: 0.121 },
  { label: 'Renal + Cardiovascular', hccs: [136, 85], value: 0.152 },
  { label: 'Renal (Stage 4) + Cardiovascular', hccs: [137, 85], value: 0.098 },
  { label: 'Cancer + Immune', hccs: [8, 1], value: 0.206 },
  { label: 'COPD + CHF + AFib', hccs: [111, 85, 96], value: 0.156 },
];

// ── Main RAF calculator ────────────────────────────────────────────────────────

export function calculateRAF(
  problems: ClinicalProblem[],
  age: number | null,
  gender: string
): RAFResult {
  const demographicRAF = getDemographicRAF(age, gender);

  // Only non-negated, non-suppressed problems with HCC assignments count
  const active = problems.filter((p) => !p.negated && p.hcc);

  // Apply hierarchy: for each group, mark lower-rank HCCs as suppressed
  const groupWinners: Record<string, string> = {};
  for (const [groupName, ids] of Object.entries(HIERARCHY_GROUPS)) {
    let winner: ClinicalProblem | null = null;
    let winnerRank = -1;
    const inGroup = active.filter((p) => ids.includes(p.id));
    for (const p of inGroup) {
      const entry = CODE_DATABASE.find((e) => e.id === p.id);
      const rank = entry?.hcc?.hierarchyRank ?? 0;
      if (rank > winnerRank) { winner = p; winnerRank = rank; }
    }
    if (winner) {
      groupWinners[groupName] = winner.id;
      for (const p of inGroup) {
        if (p !== winner && p.hcc) {
          p.hcc.suppressedByHierarchy = true;
        }
      }
    }
  }

  // Collect active (non-suppressed) HCCs, deduplicated by HCC number
  const seenHCCNumbers = new Set<number>();
  const activeHCCs: HCCAssignment[] = [];
  for (const p of active) {
    if (!p.hcc || p.hcc.suppressedByHierarchy) continue;
    if (seenHCCNumbers.has(p.hcc.number)) continue;
    seenHCCNumbers.add(p.hcc.number);
    activeHCCs.push({ ...p.hcc });
  }

  const conditionRAF = activeHCCs.reduce((sum, h) => sum + h.raf, 0);

  // Calculate interaction factors
  const activeHCCNumbers = new Set(activeHCCs.map((h) => h.number));
  let interactionRAF = 0;
  const interactionsApplied: string[] = [];
  for (const interaction of INTERACTIONS) {
    if (interaction.hccs.every((n) => activeHCCNumbers.has(n))) {
      interactionRAF += interaction.value;
      interactionsApplied.push(interaction.label);
    }
  }

  const totalRAF = parseFloat((demographicRAF + conditionRAF + interactionRAF).toFixed(3));

  return {
    demographicRAF: parseFloat(demographicRAF.toFixed(3)),
    conditionRAF: parseFloat(conditionRAF.toFixed(3)),
    interactionRAF: parseFloat(interactionRAF.toFixed(3)),
    totalRAF,
    activeHCCs,
    interactionsApplied,
  };
}
