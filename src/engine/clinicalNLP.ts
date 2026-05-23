import { ClinicalProblem, ICD10Suggestion } from '../types';
import { CODE_DATABASE, CodeEntry } from './codingData';

// ── Negation / Uncertainty context ────────────────────────────────────────────

const NEGATION_BEFORE = [
  /\b(?:no|not|without|denies|denying|absent|absence\s+of|rules?\s+out|ruled\s+out|never|negative\s+for|doesn'?t?\s+have|does\s+not\s+have|free\s+of|no\s+evidence\s+of|no\s+history\s+of)\b/i,
];

const UNCERTAINTY_BEFORE = [
  /\b(?:possible|possibly|probable|probably|suspected|suspect|r\/o|rule\s+out|may\s+have|might\s+have|question\s+of|questionable|likely|concern\s+for|cannot\s+rule\s+out|possible)\b/i,
];

const HISTORICAL_BEFORE = [
  /\b(?:history\s+of|hx\s+of|h\/o|past\s+history\s+of|prior\s+history\s+of|previous\s+history\s+of|formerly|previously\s+had)\b/i,
];

function getWindowBefore(text: string, matchIndex: number, words: number = 8): string {
  const before = text.substring(Math.max(0, matchIndex - 80), matchIndex);
  return before.split(/\s+/).slice(-words).join(' ');
}

function checkContext(window: string) {
  const negated = NEGATION_BEFORE.some((p) => p.test(window));
  const uncertain = UNCERTAINTY_BEFORE.some((p) => p.test(window));
  const historical = HISTORICAL_BEFORE.some((p) => p.test(window));
  return { negated, uncertain, historical };
}

// ── Attribute extraction ───────────────────────────────────────────────────────

function extractLaterality(window: string, after: string): 'left' | 'right' | 'bilateral' | undefined {
  const combined = window + ' ' + after;
  if (/\bbilateral\b/i.test(combined)) return 'bilateral';
  if (/\bright\b/i.test(combined)) return 'right';
  if (/\bleft\b/i.test(combined)) return 'left';
  return undefined;
}

function extractAcuity(window: string, after: string): 'acute' | 'chronic' | undefined {
  const combined = window + ' ' + after;
  if (/\bacute\b/i.test(combined)) return 'acute';
  if (/\bchronic\b/i.test(combined)) return 'chronic';
  return undefined;
}

function extractSeverity(window: string): 'mild' | 'moderate' | 'severe' | undefined {
  if (/\bmild\b/i.test(window)) return 'mild';
  if (/\bmoderate\b/i.test(window)) return 'moderate';
  if (/\bsevere\b/i.test(window)) return 'severe';
  return undefined;
}

// ── ICD-10 code refinement based on attributes ────────────────────────────────

function refineCode(entry: CodeEntry, laterality?: string, acuity?: string): { code: string; desc: string } {
  let code = entry.icd10Code;
  let desc = entry.icd10Desc;

  // Laterality refinement for common bilateral codes
  if (laterality === 'right' && code.endsWith('0')) {
    code = code.slice(0, -1) + '1';
    desc = desc.replace('unspecified', 'right');
  } else if (laterality === 'left' && code.endsWith('0')) {
    code = code.slice(0, -1) + '2';
    desc = desc.replace('unspecified', 'left');
  }

  // Acuity refinement for otitis media
  if (entry.id === 'otitis_media' && acuity === 'acute') {
    code = laterality === 'right' ? 'H66.001' : laterality === 'left' ? 'H66.002' : 'H66.009';
    desc = `Acute suppurative otitis media without spontaneous rupture of ear drum, ${laterality || 'unspecified'} ear`;
  }
  if (entry.id === 'sinusitis' && acuity === 'acute') {
    code = 'J01.90';
    desc = 'Acute sinusitis, unspecified';
  }

  return { code, desc };
}

// ── Main extractor ────────────────────────────────────────────────────────────

export function extractProblems(transcript: string): ClinicalProblem[] {
  const found: ClinicalProblem[] = [];
  const matchedIds = new Set<string>();

  for (const entry of CODE_DATABASE) {
    for (const pattern of entry.patterns) {
      const match = transcript.match(pattern);
      if (!match || match.index === undefined) continue;
      if (matchedIds.has(entry.id)) break; // already found this condition

      const matchIndex = match.index;
      const windowBefore = getWindowBefore(transcript, matchIndex);
      const windowAfter = transcript.substring(matchIndex, matchIndex + 60);

      const { negated, uncertain, historical } = checkContext(windowBefore);

      const laterality = entry.laterality ? extractLaterality(windowBefore, windowAfter) : undefined;
      const acuity = entry.checkAcuity ? extractAcuity(windowBefore, windowAfter) : undefined;
      const severity = extractSeverity(windowBefore);

      const { code, desc } = refineCode(entry, laterality, acuity);

      const suggestions: ICD10Suggestion[] = [
        { code, description: desc, confidence: 'HIGH' },
      ];

      // Add alternative codes for common conditions
      if (entry.id === 'dm2') {
        suggestions.push({ code: 'E11.65', description: 'T2DM with hyperglycemia', confidence: 'MEDIUM' });
        suggestions.push({ code: 'E11.40', description: 'T2DM with diabetic neuropathy', confidence: 'LOW' });
      }
      if (entry.id === 'chf') {
        suggestions.push({ code: 'I50.20', description: 'Systolic CHF, unspecified', confidence: 'MEDIUM' });
        suggestions.push({ code: 'I50.30', description: 'Diastolic CHF, unspecified', confidence: 'MEDIUM' });
      }
      if (entry.id === 'ckd_unspec') {
        suggestions.push({ code: 'N18.3', description: 'CKD Stage 3', confidence: 'MEDIUM' });
        suggestions.push({ code: 'N18.4', description: 'CKD Stage 4', confidence: 'LOW' });
      }

      const hcc = entry.hcc
        ? {
            number: entry.hcc.number,
            description: entry.hcc.description,
            raf: entry.hcc.raf,
            suppressedByHierarchy: false,
          }
        : undefined;

      found.push({
        id: entry.id,
        rawText: match[0],
        label: entry.label,
        negated,
        uncertain,
        attributes: {
          ...(laterality ? { laterality } : {}),
          ...(acuity ? { acuity } : {}),
          ...(severity ? { severity } : {}),
        },
        suggestedCodes: suggestions,
        selectedCode: code,
        selectedDescription: desc,
        ...(hcc ? { hcc } : {}),
      });

      matchedIds.add(entry.id);
      break; // stop checking other patterns for same entry
    }
  }

  return found;
}

// ── JSON export (structured like the format the user requested) ───────────────

export function toStructuredJSON(problems: ClinicalProblem[]) {
  return {
    problems: problems.map((p) => ({
      text: p.label,
      icd10: p.selectedCode,
      description: p.selectedDescription,
      negated: p.negated,
      uncertain: p.uncertain,
      attributes: {
        ...(p.attributes.laterality ? { laterality: p.attributes.laterality } : {}),
        ...(p.attributes.acuity ? { acute: p.attributes.acuity === 'acute', chronic: p.attributes.acuity === 'chronic' } : {}),
        ...(p.attributes.severity ? { severity: p.attributes.severity } : {}),
      },
      hcc: p.hcc ? { number: p.hcc.number, description: p.hcc.description } : null,
      raf: p.hcc && !p.hcc.suppressedByHierarchy ? p.hcc.raf : 0,
    })),
  };
}
