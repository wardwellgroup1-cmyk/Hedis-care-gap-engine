// ── ICD-10 Specificity Engine ─────────────────────────────────────────────────
// Applies combination codes and upgrades CKD staging based on transcript context.
// Run AFTER extractProblems(), BEFORE calculateRAF().
//
// Rules implemented:
//   1. DM + CKD (separate) → upgrade DM code to E11.22
//   2. HTN + CKD → upgrade HTN code to I12.9 (or I12.10 for stage 5/ESRD)
//   3. Insulin mention → add Z79.4 (long-term insulin use)
//   4. GFR value in transcript → upgrade unspecified CKD to staged N18.xx
//   5. CKD stage text → upgrade unspecified CKD to staged N18.xx

import { ClinicalProblem, ICD10Suggestion } from '../types';

// ── CKD stage data ─────────────────────────────────────────────────────────────

interface CKDStageData {
  code: string;
  desc: string;
  hccNum: number;
  hccDesc: string;
  hccRaf: number;
}

const CKD_STAGE_MAP: Record<string, CKDStageData> = {
  '1':    { code: 'N18.1',  desc: 'Chronic kidney disease, stage 1',          hccNum: 0,   hccDesc: '',                           hccRaf: 0 },
  '2':    { code: 'N18.2',  desc: 'Chronic kidney disease, stage 2 (mild)',   hccNum: 0,   hccDesc: '',                           hccRaf: 0 },
  '3':    { code: 'N18.30', desc: 'Chronic kidney disease, stage 3 unspecified', hccNum: 138, hccDesc: 'CKD, Moderate (Stage 3)', hccRaf: 0.083 },
  '3a':   { code: 'N18.31', desc: 'Chronic kidney disease, stage 3a',         hccNum: 138, hccDesc: 'CKD, Moderate (Stage 3)',    hccRaf: 0.083 },
  '3b':   { code: 'N18.32', desc: 'Chronic kidney disease, stage 3b',         hccNum: 138, hccDesc: 'CKD, Moderate (Stage 3)',    hccRaf: 0.083 },
  '4':    { code: 'N18.4',  desc: 'Chronic kidney disease, stage 4 (severe)', hccNum: 137, hccDesc: 'CKD, Severe (Stage 4)',      hccRaf: 0.237 },
  '5':    { code: 'N18.5',  desc: 'Chronic kidney disease, stage 5',          hccNum: 136, hccDesc: 'CKD, Stage 5',               hccRaf: 0.421 },
  'esrd': { code: 'N18.6',  desc: 'End stage renal disease',                  hccNum: 134, hccDesc: 'Dialysis Status',            hccRaf: 0.421 },
};

// Map eGFR numeric value to CKD stage string
function gfrToStage(gfr: number): string {
  if (gfr < 15) return '5';
  if (gfr < 30) return '4';
  if (gfr < 45) return '3b';
  if (gfr < 60) return '3a';
  if (gfr < 90) return '2';
  return '1';
}

// Extract GFR numeric value from transcript
function extractGFR(transcript: string): number | null {
  const match = transcript.match(
    /(?:eGFR|GFR|glomerular\s*filtration\s*rate)\s*(?:is|of|=|:|was)?\s*(?:about\s*)?(\d{1,3})/i
  );
  return match ? parseInt(match[1], 10) : null;
}

// Extract CKD stage text from transcript (e.g. "CKD 3a", "stage 4 CKD", "ckd stage 3b")
function extractCKDStageText(transcript: string): string | null {
  const match = transcript.match(
    /ckd\s*(?:stage\s*)?(3[ab]?|4|5|esrd)|(?:stage\s*)(3[ab]?|4|5)\s*ckd|chronic\s*kidney\s*disease\s*(?:stage\s*)?(3[ab]?|4|5)/i
  );
  if (!match) return null;
  const raw = (match[1] || match[2] || match[3]).toLowerCase();
  return raw; // e.g. "3a", "3b", "4", "5"
}

// ── Insulin patterns ──────────────────────────────────────────────────────────

const INSULIN_PATTERNS: RegExp[] = [
  /\binsulin\b/i,
  /\bglargine\b/i, /\bdetemir\b/i, /\baspart\b/i, /\blispro\b/i,
  /\bBasaglar\b/i, /\bLantus\b/i, /\bLevemir\b/i, /\bHumalog\b/i,
  /\bNovoLog\b/i,  /\bTresiba\b/i, /\bToujeo\b/i,  /\bNovolin\b/i,
  /\bHumulin\b/i,  /\bafrezza\b/i,
];

// ── Specificity result ────────────────────────────────────────────────────────

export interface SpecificityResult {
  problems: ClinicalProblem[];
  changes: string[];   // human-readable list of upgrades applied
}

// ── Main function ─────────────────────────────────────────────────────────────

export function applyComboCodes(
  problems: ClinicalProblem[],
  transcript: string
): SpecificityResult {
  const changes: string[] = [];
  let updated = [...problems];

  // Flags
  const hasDM = updated.some((p) =>
    ['dm2', 'dm1', 'dm2_neuropathy', 'dm2_eye'].includes(p.id) && !p.negated
  );
  const hasDMWithCKDCombo = updated.some((p) => p.id === 'dm2_ckd' && !p.negated);
  const hasCKDAny = updated.some((p) =>
    ['ckd_unspec', 'ckd3', 'ckd4', 'ckd5', 'esrd_dialysis', 'aki'].includes(p.id) && !p.negated
  );
  const hasCKD5orESRD = updated.some((p) =>
    ['ckd5', 'esrd_dialysis'].includes(p.id) && !p.negated
  );
  const hasHTN = updated.some((p) => p.id === 'htn' && !p.negated);
  const hasInsulin = INSULIN_PATTERNS.some((p) => p.test(transcript));

  // ── 1. DM + CKD combo → E11.22 ─────────────────────────────────────────────
  if (hasDM && hasCKDAny && !hasDMWithCKDCombo) {
    updated = updated.map((p) => {
      if (['dm2', 'dm1', 'dm2_neuropathy', 'dm2_eye'].includes(p.id) && !p.negated) {
        const newSugg: ICD10Suggestion = {
          code: 'E11.22',
          description: 'Type 2 diabetes mellitus with diabetic chronic kidney disease, stage 1-2',
          confidence: 'HIGH',
        };
        changes.push(`${p.label} → E11.22 (DM + CKD combo code applied)`);
        return {
          ...p,
          selectedCode: 'E11.22',
          selectedDescription: 'Type 2 diabetes mellitus with diabetic chronic kidney disease',
          suggestedCodes: [newSugg, ...p.suggestedCodes.filter((s) => s.code !== 'E11.22')],
          hcc: {
            number: 18,
            description: 'Diabetes with Chronic Complications',
            raf: 0.318,
            suppressedByHierarchy: false,
          },
        };
      }
      return p;
    });
  }

  // ── 2. HTN + CKD combo → I12.x ──────────────────────────────────────────────
  if (hasHTN && hasCKDAny) {
    const comboCode = hasCKD5orESRD ? 'I12.10' : 'I12.9';
    const comboDesc = hasCKD5orESRD
      ? 'Hypertensive chronic kidney disease with stage 5 CKD or ESRD'
      : 'Hypertensive chronic kidney disease with stage 1 through stage 4 CKD, or unspecified CKD';

    updated = updated.map((p) => {
      if (p.id === 'htn' && !p.negated) {
        const newSugg: ICD10Suggestion = {
          code: comboCode,
          description: comboDesc,
          confidence: 'HIGH',
        };
        changes.push(`HTN → ${comboCode} (Hypertensive CKD combo code applied)`);
        return {
          ...p,
          label: 'Hypertensive Chronic Kidney Disease',
          selectedCode: comboCode,
          selectedDescription: comboDesc,
          suggestedCodes: [
            newSugg,
            { code: 'I10', description: 'Essential hypertension', confidence: 'LOW' },
          ],
          // I12 codes do not carry an independent HCC — CKD HCC still applies
        };
      }
      return p;
    });
  }

  // ── 3. Insulin use → Z79.4 ───────────────────────────────────────────────────
  if (hasInsulin && hasDM) {
    const alreadyHasZ794 = updated.some((p) => p.selectedCode === 'Z79.4');
    if (!alreadyHasZ794) {
      changes.push('Z79.4 added — long-term insulin use detected in dictation');
      const insulinProblem: ClinicalProblem = {
        id: 'insulin_use',
        rawText: 'insulin',
        label: 'Long-term Insulin Use',
        negated: false,
        uncertain: false,
        toad: {
          type: 'Long-term Insulin Dependency',
          onset: 'chronic',
          anatomy: 'Endocrine / Systemic',
          detail:
            'Z code — documents ongoing insulin therapy; required for accurate HCC/RAF risk adjustment when DM is managed with insulin',
        },
        attributes: {},
        suggestedCodes: [
          { code: 'Z79.4', description: 'Long-term (current) use of insulin', confidence: 'HIGH' },
        ],
        selectedCode: 'Z79.4',
        selectedDescription: 'Long-term (current) use of insulin',
      };
      updated.push(insulinProblem);
    }
  }

  // ── 4 & 5. CKD stage upgrade (GFR value or text mention) ────────────────────
  const gfr = extractGFR(transcript);
  const stageFromText = extractCKDStageText(transcript);
  const detectedStage = gfr !== null ? gfrToStage(gfr) : stageFromText;

  if (detectedStage && CKD_STAGE_MAP[detectedStage]) {
    const stageData = CKD_STAGE_MAP[detectedStage];

    // Only upgrade to HCC-relevant stages (3, 3a, 3b, 4, 5, esrd)
    if (stageData.hccNum > 0) {
      updated = updated.map((p) => {
        // Upgrade unspecified CKD
        if (p.id === 'ckd_unspec' && !p.negated) {
          const source = gfr !== null ? `eGFR ${gfr}` : 'text mention';
          changes.push(
            `CKD → ${stageData.code} (Stage ${detectedStage.toUpperCase()}) — staged from ${source}`
          );
          return {
            ...p,
            id: `ckd${detectedStage.replace(/[ab]/, '')}`,
            label: `CKD Stage ${detectedStage.toUpperCase()}`,
            selectedCode: stageData.code,
            selectedDescription: stageData.desc,
            suggestedCodes: [
              { code: stageData.code, description: stageData.desc, confidence: 'HIGH' },
            ],
            hcc:
              stageData.hccNum > 0
                ? {
                    number: stageData.hccNum,
                    description: stageData.hccDesc,
                    raf: stageData.hccRaf,
                    suppressedByHierarchy: false,
                  }
                : undefined,
          };
        }

        // Refine CKD Stage 3 to 3a or 3b substage
        if (
          p.id === 'ckd3' &&
          !p.negated &&
          (detectedStage === '3a' || detectedStage === '3b')
        ) {
          const source = gfr !== null ? `eGFR ${gfr}` : 'text mention';
          changes.push(
            `CKD Stage 3 → ${stageData.code} (3${detectedStage === '3a' ? 'a' : 'b'}) — substaged from ${source}`
          );
          return {
            ...p,
            label: `CKD Stage ${detectedStage.toUpperCase()}`,
            selectedCode: stageData.code,
            selectedDescription: stageData.desc,
            suggestedCodes: [
              { code: stageData.code, description: stageData.desc, confidence: 'HIGH' },
              ...p.suggestedCodes.filter((s) => s.code !== stageData.code),
            ],
          };
        }

        return p;
      });
    }
  }

  return { problems: updated, changes };
}
