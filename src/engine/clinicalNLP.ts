import { ClinicalProblem, ICD10Suggestion, TOAD } from '../types';
import { CODE_DATABASE, CodeEntry } from './codingData';

// ── TOAD Builder ──────────────────────────────────────────────────────────────

// Anatomy defaults by condition ID
const ANATOMY_MAP: Record<string, string> = {
  dm2_hyperosmolar: 'Endocrine / Pancreas', dm2_dka: 'Endocrine / Pancreas',
  dm2_neuropathy: 'Endocrine / Peripheral Nervous System', dm2_ckd: 'Endocrine + Renal',
  dm2_eye: 'Endocrine / Retina', dm2: 'Endocrine / Pancreas', dm1: 'Endocrine / Pancreas',
  chf_systolic: 'Cardiovascular / Left Ventricle', chf_diastolic: 'Cardiovascular / Left Ventricle',
  chf: 'Cardiovascular / Cardiac', acute_mi: 'Cardiovascular / Coronary Artery',
  cad: 'Cardiovascular / Coronary Artery', afib: 'Cardiovascular / Cardiac Rhythm',
  aflutter: 'Cardiovascular / Cardiac Rhythm', htn: 'Cardiovascular / Systemic Vasculature',
  pvd: 'Vascular / Peripheral Arteries', dvt: 'Vascular / Deep Veins',
  pe: 'Pulmonary / Vasculature',
  ischemic_stroke: 'Cerebrovascular / Brain', hemorrhagic_stroke: 'Cerebrovascular / Brain',
  tia: 'Cerebrovascular / Brain', hemiplegia: 'Neurological / Motor Cortex',
  parkinsons: 'Neurological / Basal Ganglia', alzheimers: 'Neurological / Cortex',
  ms: 'Neurological / CNS White Matter', epilepsy: 'Neurological / Cortex', als: 'Neurological / Motor Neurons',
  copd_exacerbation: 'Respiratory / Lungs', copd: 'Respiratory / Lungs',
  asthma: 'Respiratory / Airways', pulm_fibrosis: 'Respiratory / Interstitium',
  cystic_fibrosis: 'Respiratory / Lungs + Exocrine', aspiration_pna: 'Respiratory / Lungs',
  esrd_dialysis: 'Renal / Kidney (ESRD)', ckd5: 'Renal / Kidney', ckd4: 'Renal / Kidney',
  ckd3: 'Renal / Kidney', ckd_unspec: 'Renal / Kidney', aki: 'Renal / Kidney (Acute)',
  schizophrenia: 'Psychiatric / CNS', bipolar: 'Psychiatric / CNS', mdd: 'Psychiatric / CNS',
  anxiety: 'Psychiatric / CNS', ptsd: 'Psychiatric / CNS', drug_dependence: 'Psychiatric / CNS',
  esld: 'Hepatic / Liver', cirrhosis: 'Hepatic / Liver', chronic_hep: 'Hepatic / Liver',
  metastatic_cancer: 'Oncology / Systemic', lung_cancer: 'Oncology / Lungs',
  colorectal_cancer: 'Oncology / Colon & Rectum', breast_cancer: 'Oncology / Breast',
  prostate_cancer: 'Oncology / Prostate', lymphoma: 'Oncology / Lymphatic System',
  ra: 'Rheumatology / Joints', osteoporosis: 'Musculoskeletal / Bone',
  morbid_obesity: 'Metabolic / Body Composition', obesity: 'Metabolic / Body Composition',
  hypothyroid: 'Endocrine / Thyroid', hyperthyroid: 'Endocrine / Thyroid',
  malnutrition: 'Nutritional / Systemic', sickle_cell: 'Hematology / RBC',
  anemia: 'Hematology / RBC', ibd: 'Gastrointestinal / Colon', gerd: 'Gastrointestinal / Esophagus',
  hiv: 'Infectious Disease / Immune', pneumonia: 'Respiratory / Lungs',
  uti: 'Urinary / Bladder & Urethra', otitis_media: 'ENT / Middle Ear',
  sinusitis: 'ENT / Paranasal Sinuses', back_pain: 'Musculoskeletal / Lumbar Spine',
  hyperlipidemia: 'Metabolic / Lipid',
};

// Onset defaults by condition ID
const ONSET_MAP: Record<string, string> = {
  dm2_hyperosmolar: 'acute-on-chronic', dm2_dka: 'acute-on-chronic',
  dm2_neuropathy: 'chronic', dm2_ckd: 'chronic', dm2_eye: 'chronic',
  dm2: 'chronic', dm1: 'chronic',
  chf_systolic: 'chronic', chf_diastolic: 'chronic', chf: 'chronic',
  acute_mi: 'acute', cad: 'chronic', afib: 'chronic', aflutter: 'chronic',
  htn: 'chronic', pvd: 'chronic', dvt: 'acute', pe: 'acute',
  ischemic_stroke: 'acute', hemorrhagic_stroke: 'acute', tia: 'acute',
  hemiplegia: 'chronic', parkinsons: 'chronic', alzheimers: 'chronic',
  ms: 'chronic', epilepsy: 'chronic', als: 'chronic',
  copd_exacerbation: 'acute-on-chronic', copd: 'chronic',
  asthma: 'chronic', pulm_fibrosis: 'chronic', cystic_fibrosis: 'chronic',
  aspiration_pna: 'acute', esrd_dialysis: 'chronic', ckd5: 'chronic',
  ckd4: 'chronic', ckd3: 'chronic', ckd_unspec: 'chronic', aki: 'acute',
  schizophrenia: 'chronic', bipolar: 'chronic', mdd: 'chronic',
  anxiety: 'chronic', ptsd: 'chronic', drug_dependence: 'chronic',
  esld: 'chronic', cirrhosis: 'chronic', chronic_hep: 'chronic',
  metastatic_cancer: 'chronic', lung_cancer: 'chronic', colorectal_cancer: 'chronic',
  breast_cancer: 'chronic', prostate_cancer: 'chronic', lymphoma: 'chronic',
  ra: 'chronic', osteoporosis: 'chronic', morbid_obesity: 'chronic',
  obesity: 'chronic', hypothyroid: 'chronic', hyperthyroid: 'chronic',
  malnutrition: 'chronic', sickle_cell: 'chronic', anemia: 'chronic',
  ibd: 'chronic', gerd: 'chronic', hiv: 'chronic',
  pneumonia: 'acute', uti: 'acute', otitis_media: 'acute',
  sinusitis: 'acute', back_pain: 'acute', hyperlipidemia: 'chronic',
};

function buildTOAD(
  entry: CodeEntry,
  laterality: string | undefined,
  acuity: string | undefined,
  severity: string | undefined,
  negated: boolean,
  uncertain: boolean
): TOAD {
  // TYPE: refined label incorporating attributes
  let type = entry.label;
  if (laterality) type = `${type}, ${laterality} side`;
  if (acuity === 'acute' && !type.toLowerCase().includes('acute')) type = `Acute ${type}`;
  if (acuity === 'chronic' && !type.toLowerCase().includes('chronic')) type = `Chronic ${type}`;
  if (uncertain) type = `Possible ${type}`;

  // ONSET: use extracted acuity or condition default
  let onset = acuity ?? ONSET_MAP[entry.id] ?? 'unspecified';
  if (negated) onset = 'n/a (negated)';

  // ANATOMY: base from map + laterality refinement
  let anatomy = ANATOMY_MAP[entry.id] ?? 'Unspecified';
  if (laterality && laterality !== 'bilateral') {
    anatomy = anatomy.replace(/Middle Ear$/, `${laterality.charAt(0).toUpperCase() + laterality.slice(1)} Middle Ear`);
    anatomy = anatomy.replace(/Breast$/, `${laterality.charAt(0).toUpperCase() + laterality.slice(1)} Breast`);
    anatomy = anatomy.replace(/Lungs$/, `${laterality.charAt(0).toUpperCase() + laterality.slice(1)} Lung`);
  }
  if (laterality === 'bilateral') anatomy += ' (bilateral)';

  // DETAIL: clinical specifics
  const details: string[] = [];
  if (severity) details.push(`severity: ${severity}`);
  if (entry.hcc) details.push(`HCC ${entry.hcc.number}`);
  if (negated) details.push('ruled out / negated');
  if (uncertain) details.push('uncertain — requires confirmation');

  // Condition-specific details
  if (entry.id === 'dm2') details.push('without documented complications');
  if (entry.id === 'dm2_neuropathy') details.push('peripheral sensory involvement');
  if (entry.id === 'dm2_ckd') details.push('diabetic nephropathy');
  if (entry.id === 'chf') details.push('ejection fraction unspecified');
  if (entry.id === 'chf_systolic') details.push('reduced ejection fraction (HFrEF)');
  if (entry.id === 'chf_diastolic') details.push('preserved ejection fraction (HFpEF)');
  if (entry.id === 'copd_exacerbation') details.push('acute exacerbation requiring treatment');
  if (entry.id === 'esrd_dialysis') details.push('on dialysis');
  if (entry.id === 'otitis_media') details.push(acuity === 'acute' ? 'no spontaneous rupture documented' : 'chronic/recurrent involvement');

  const detail = details.length > 0 ? details.join('; ') : 'no additional qualifiers documented';

  return { type, onset, anatomy, detail };
}

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

      const toad = buildTOAD(entry, laterality, acuity, severity, negated, uncertain);

      found.push({
        id: entry.id,
        rawText: match[0],
        label: entry.label,
        negated,
        uncertain,
        toad,
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
      problem: p.label,
      icd10: p.selectedCode,
      icd10_description: p.selectedDescription,
      negated: p.negated,
      uncertain: p.uncertain,
      TOAD: {
        type: p.toad.type,
        onset: p.toad.onset,
        anatomy: p.toad.anatomy,
        detail: p.toad.detail,
      },
      hcc: p.hcc ? { number: p.hcc.number, description: p.hcc.description, suppressed: p.hcc.suppressedByHierarchy } : null,
      raf_contribution: p.hcc && !p.hcc.suppressedByHierarchy ? p.hcc.raf : 0,
    })),
  };
}
