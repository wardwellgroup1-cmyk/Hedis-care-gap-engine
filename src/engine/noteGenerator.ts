import { AnalysisResult } from '../types';

export interface PhysicianNote {
  chiefComplaint: string;
  hpi: string;
  reviewOfSystems: string;
  assessment: string;
  plan: string;
  fullText: string;
}

// ── Extraction helpers ────────────────────────────────────────────────────────

const CC_PATTERNS = [
  /(?:presents?(?:\s+today)?\s+(?:with|for)|here\s+(?:today\s+)?(?:for|with)|comes?\s+in\s+(?:for|with)|visit(?:ing)?\s+(?:for|today\s+for)|follow[\s-]?up\s+(?:for|on)|c\/o|complains?\s+(?:of|about))\s+([^.]{5,80})/i,
  /(?:chief\s+complaint|reason\s+for\s+visit)\s*[:\-]?\s*([^.]{5,80})/i,
];

const DIAGNOSIS_KEYWORDS = [
  'hypertension', 'htn', 'diabetes', 'dm', 'type 2', 'type 1',
  'hyperlipidemia', 'hypercholesterolemia', 'obesity', 'copd', 'asthma',
  'heart failure', 'chf', 'atrial fibrillation', 'afib', 'cad',
  'coronary artery disease', 'ckd', 'chronic kidney disease',
  'hypothyroidism', 'hyperthyroidism', 'anxiety', 'depression',
  'osteoporosis', 'osteoarthritis', 'arthritis', 'gerd', 'reflux',
  'anemia', 'chronic pain', 'neuropathy', 'peripheral vascular disease',
  'stroke', 'tia', 'dementia', 'alzheimer', 'parkinson',
  'cancer', 'malignancy', 'tumor', 'carcinoma',
];

const SYMPTOM_KEYWORDS = [
  'pain', 'fatigue', 'shortness of breath', 'sob', 'dyspnea',
  'chest pain', 'palpitations', 'dizziness', 'headache', 'nausea',
  'vomiting', 'diarrhea', 'constipation', 'swelling', 'edema',
  'cough', 'fever', 'chills', 'weight loss', 'weight gain',
  'weakness', 'numbness', 'tingling', 'blurred vision', 'urinary',
  'polyuria', 'polydipsia', 'insomnia', 'anxiety', 'depression',
];

const MEDICATION_PATTERNS = [
  /\b(metformin|lisinopril|amlodipine|atorvastatin|rosuvastatin|simvastatin|metoprolol|carvedilol|losartan|valsartan|olmesartan|hydrochlorothiazide|hctz|furosemide|spironolactone|aspirin|clopidogrel|warfarin|apixaban|rivaroxaban|levothyroxine|omeprazole|pantoprazole|gabapentin|pregabalin|sertraline|fluoxetine|escitalopram|bupropion|duloxetine|albuterol|tiotropium|insulin|glipizide|januvia|jardiance|ozempic|trulicity|victoza|semaglutide|liraglutide|empagliflozin|dapagliflozin|prednisone|methylprednisolone|amoxicillin|azithromycin)\b/gi,
];

const VITALS_PATTERN = /(?:bp|blood\s+pressure)\s+(\d{2,3}\/\d{2,3})|(?:heart\s+rate|hr|pulse)\s+(\d{2,3})|(?:temp(?:erature)?)\s+(\d{2,3}(?:\.\d)?)|(?:weight|wt)\s+(\d{2,3}(?:\.\d+)?)\s*(?:lbs?|kg)?|(?:bmi)\s+(\d{2}(?:\.\d)?)/gi;

const PLAN_ACTION_PATTERNS = [
  /(?:ordered?|prescrib\w*|start\w*|continu\w*|refill\w*|referr\w*|schedul\w*|administer\w*|gave|given|perform\w*|complet\w*)\s+[^.,;]{5,60}/gi,
];

// ── Sentence utilities ────────────────────────────────────────────────────────

function sentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 10);
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function extractChiefComplaint(transcript: string): string {
  for (const pattern of CC_PATTERNS) {
    const m = transcript.match(pattern);
    if (m?.[1]) return capitalize(m[1].trim().replace(/[.,;]$/, ''));
  }
  // Fallback: first meaningful clause after demographics
  const clean = transcript.replace(/\d+[\s-]*(?:year|yr)s?[\s-]*old\s+(?:male|female|man|woman)/i, '').trim();
  const first = clean.split(/[.,;]/)[0]?.trim();
  if (first && first.length > 10) return capitalize(first);
  return 'Established patient visit';
}

function extractHPI(transcript: string, demographics: AnalysisResult['demographics']): string {
  const { age, gender } = demographics;
  const pronoun = gender === 'FEMALE' ? 'She' : gender === 'MALE' ? 'He' : 'The patient';
  const possessive = gender === 'FEMALE' ? 'her' : gender === 'MALE' ? 'his' : 'their';

  const parts: string[] = [];

  // Opening line
  if (age) {
    const genderLabel = gender === 'FEMALE' ? 'female' : gender === 'MALE' ? 'male' : 'patient';
    parts.push(`${age}-year-old ${genderLabel} presenting for evaluation.`);
  } else {
    parts.push('Patient presenting for evaluation.');
  }

  // Diagnoses found in transcript
  const foundDx = DIAGNOSIS_KEYWORDS.filter((dx) =>
    new RegExp(`\\b${dx}\\b`, 'i').test(transcript)
  );
  if (foundDx.length > 0) {
    const dxList = foundDx.slice(0, 5).map((d) => d.toLowerCase()).join(', ');
    parts.push(`${pronoun} has a history of ${dxList}.`);
  }

  // Symptoms found
  const foundSx = SYMPTOM_KEYWORDS.filter((sx) =>
    new RegExp(`\\b${sx}\\b`, 'i').test(transcript)
  );
  if (foundSx.length > 0) {
    const sxList = foundSx.slice(0, 4).join(', ');
    parts.push(`${pronoun} reports ${sxList}.`);
  }

  // Vitals if found
  const vitalMatches: string[] = [];
  let vm: RegExpExecArray | null;
  const vp = new RegExp(VITALS_PATTERN.source, 'gi');
  while ((vm = vp.exec(transcript)) !== null) {
    vitalMatches.push(vm[0].trim());
  }
  if (vitalMatches.length > 0) {
    parts.push(`Vitals noted: ${vitalMatches.join(', ')}.`);
  }

  // Medications
  const meds: string[] = [];
  for (const mp of MEDICATION_PATTERNS) {
    const medMatches = transcript.match(mp) ?? [];
    meds.push(...medMatches.map((m) => m.toLowerCase()));
  }
  const uniqueMeds = [...new Set(meds)];
  if (uniqueMeds.length > 0) {
    parts.push(`${pronoun} is currently on ${uniqueMeds.slice(0, 6).join(', ')}.`);
  }

  // Remaining clinical context (sentences not already captured)
  const allSentences = sentences(transcript);
  const extras = allSentences.filter(
    (s) =>
      !/\d+[\s-]*(?:year|yr)s?[\s-]*old/i.test(s) &&
      !/\b(?:male|female|man|woman)\b/i.test(s) &&
      s.length > 20 &&
      s.length < 200
  );
  if (extras.length > 0) {
    parts.push(extras.slice(0, 3).join(' '));
  }

  return parts.join(' ');
}

function extractAssessment(transcript: string, result: AnalysisResult): string {
  const foundDx = DIAGNOSIS_KEYWORDS.filter((dx) =>
    new RegExp(`\\b${dx}\\b`, 'i').test(transcript)
  );

  const lines: string[] = [];

  if (foundDx.length > 0) {
    foundDx.slice(0, 6).forEach((dx, i) => {
      lines.push(`${i + 1}. ${capitalize(dx)}`);
    });
  } else {
    lines.push('1. Established patient, condition as per HPI');
  }

  // Add HEDIS care gap status line
  const { closed, missed, total } = result.metrics;
  if (total > 0) {
    lines.push(`${lines.length + 1}. Preventive care: ${closed} of ${total} eligible HEDIS measures addressed`);
  }

  return lines.join('\n');
}

function extractPlan(transcript: string, result: AnalysisResult): string {
  const lines: string[] = [];

  // Pull action sentences from transcript
  const actionMatches: string[] = [];
  let am: RegExpExecArray | null;
  const ap = new RegExp(PLAN_ACTION_PATTERNS[0].source, 'gi');
  while ((am = ap.exec(transcript)) !== null) {
    const clean = capitalize(am[0].trim().replace(/[.,;]$/, ''));
    if (clean.length > 10 && !actionMatches.includes(clean)) {
      actionMatches.push(clean);
    }
  }

  actionMatches.slice(0, 8).forEach((action, i) => {
    lines.push(`${i + 1}. ${action}`);
  });

  // Add nudges from HEDIS as plan items
  const redGaps = result.gaps.filter((g) => g.status === 'RED' && g.nudge);
  if (redGaps.length > 0) {
    const offset = lines.length;
    redGaps.slice(0, 5).forEach((g, i) => {
      lines.push(`${offset + i + 1}. [HEDIS] ${g.nudge}`);
    });
  }

  if (lines.length === 0) {
    lines.push('1. Continue current management');
    lines.push('2. Follow up as clinically indicated');
  } else {
    lines.push(`${lines.length + 1}. Follow up as clinically indicated`);
  }

  return lines.join('\n');
}

// ── Main export ───────────────────────────────────────────────────────────────

export function generateNote(transcript: string, result: AnalysisResult): PhysicianNote {
  const { demographics } = result;
  const date = new Date().toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  });

  const chiefComplaint = extractChiefComplaint(transcript);
  const hpi = extractHPI(transcript, demographics);
  const assessment = extractAssessment(transcript, result);
  const plan = extractPlan(transcript, result);

  const ros = 'Per dictation — reviewed systems pertinent to chief complaint.';

  const fullText = [
    `DATE: ${date}`,
    `PATIENT: ${demographics.age ? demographics.age + '-year-old' : 'Age unknown'} ${demographics.gender !== 'UNKNOWN' ? demographics.gender.toLowerCase() : 'patient'}`,
    '',
    `CHIEF COMPLAINT:`,
    chiefComplaint,
    '',
    `HISTORY OF PRESENT ILLNESS:`,
    hpi,
    '',
    `REVIEW OF SYSTEMS:`,
    ros,
    '',
    `ASSESSMENT:`,
    assessment,
    '',
    `PLAN:`,
    plan,
    '',
    `Electronically signed — ${date}`,
  ].join('\n');

  return { chiefComplaint, hpi, reviewOfSystems: ros, assessment, plan, fullText };
}
