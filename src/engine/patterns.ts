import { Confidence } from '../types';

export interface PatternMatch {
  matched: boolean;
  evidence: string;
  confidence: Confidence;
}

// Each entry: [pattern, confidence]
type PatternEntry = [RegExp, Confidence];

export const GREEN_PATTERNS: Record<string, PatternEntry[]> = {
  mammogram: [
    [/(?:ordered?|complet\w*|perform\w*|done|scheduled?|had)\s+mammog\w*/i, 'HIGH'],
    [/mammog\w+\s+(?:ordered?|done|complet\w*|perform\w*|scheduled?|today|last\s+\w+)/i, 'HIGH'],
    [/breast\s+(?:cancer\s+)?screening\s+(?:done|complet\w*|ordered?|today|perform\w*)/i, 'HIGH'],
    [/screening\s+mammog\w*/i, 'HIGH'],
    [/breast\s+imaging/i, 'MEDIUM'],
  ],
  cervical: [
    [/(?:ordered?|complet\w*|perform\w*|done)\s+(?:pap|cervical\s+screen\w*|colposcop\w*)/i, 'HIGH'],
    [/pap\s+(?:smear|test)\s+(?:ordered?|done|complet\w*|today|recent\w*|perform\w*)/i, 'HIGH'],
    [/cervical\s+(?:cancer\s+)?screening\s+(?:done|complet\w*|perform\w*|ordered?)/i, 'HIGH'],
    [/hpv\s+(?:co.?test|test)\s+(?:ordered?|done|complet\w*)/i, 'HIGH'],
    [/pap\s+(?:and|&)\s+hpv\s+(?:ordered?|done)/i, 'HIGH'],
  ],
  prostate: [
    [/psa\s+(?:ordered?|check\w*|done|result\w*|today|test\w*)/i, 'HIGH'],
    [/(?:ordered?|check\w*|done|complet\w*)\s+psa/i, 'HIGH'],
    [/prostate\s+(?:screen\w*|check\w*|exam\w*|antigen)/i, 'HIGH'],
    [/(?:digital\s+)?rectal\s+exam\s+(?:perform\w*|done|complet\w*)/i, 'HIGH'],
    [/dre\s+(?:perform\w*|done|complet\w*)/i, 'HIGH'],
    [/prostate\s+specific\s+antigen/i, 'HIGH'],
  ],
  colorectal: [
    [/(?:ordered?|complet\w*|perform\w*|done|scheduled?)\s+colonoscop\w*/i, 'HIGH'],
    [/colonoscop\w+\s+(?:ordered?|done|complet\w*|scheduled?|today|recent\w*)/i, 'HIGH'],
    [/fit\s+test\s+(?:ordered?|done|complet\w*|given|today)/i, 'HIGH'],
    [/cologuard\s+(?:ordered?|done|complet\w*|sent|today)/i, 'HIGH'],
    [/stool\s+(?:test|sample|card|dna)\s+(?:ordered?|given|done|complet\w*)/i, 'HIGH'],
    [/colorectal\s+(?:cancer\s+)?screening\s+(?:done|complet\w*|ordered?)/i, 'HIGH'],
    [/colon\s+screen\w+\s+(?:done|complet\w*|ordered?)/i, 'HIGH'],
    [/flex\w*\s+sig\w*\s+(?:done|perform\w*|ordered?)/i, 'HIGH'],
    [/fecal\s+(?:occult|immunochem\w*)/i, 'HIGH'],
  ],
  flu: [
    [/flu\s+(?:shot|vaccine|vaccination)\s+(?:given|administr\w*|today|done|receiv\w*)/i, 'HIGH'],
    [/influenza\s+vaccine\s+(?:given|administr\w*|today|done)/i, 'HIGH'],
    [/(?:given|administr\w*)\s+(?:the\s+)?flu\s+(?:shot|vaccine)/i, 'HIGH'],
    [/influenza\s+immuniz\w+\s+(?:given|done|administr\w*)/i, 'HIGH'],
    [/flu\s+shot\s+today/i, 'HIGH'],
  ],
  pneumococcal: [
    [/pneumo(?:coccal|vax|23|20)\s+(?:given|administr\w*|done|ordered?|today)/i, 'HIGH'],
    [/(?:given|administr\w*|ordered?)\s+pneumo\w+/i, 'HIGH'],
    [/prevnar\s+(?:given|administr\w*|done|today)/i, 'HIGH'],
    [/ppsv23\s+(?:given|done|administr\w*)/i, 'HIGH'],
    [/pcv20\s+(?:given|done|administr\w*)/i, 'HIGH'],
    [/pneumococcal\s+vaccine\s+(?:given|done|administr\w*)/i, 'HIGH'],
  ],
  tdap: [
    [/tdap\s+(?:given|administr\w*|done|ordered?|today)/i, 'HIGH'],
    [/(?:given|administr\w*)\s+tdap/i, 'HIGH'],
    [/tetanus\s+(?:booster|vaccine|shot)\s+(?:given|done|today|administr\w*)/i, 'HIGH'],
    [/dtap\s+(?:given|administr\w*|done)/i, 'HIGH'],
    [/tetanus\s+up\s+to\s+date/i, 'HIGH'],
  ],
  rsv: [
    [/rsv\s+vaccine\s+(?:given|administr\w*|done|ordered?|today)/i, 'HIGH'],
    [/(?:given|administr\w*)\s+rsv\s+vaccine/i, 'HIGH'],
    [/arexvy\s+(?:given|done|administr\w*|today)/i, 'HIGH'],
    [/abrysvo\s+(?:given|done|administr\w*|today)/i, 'HIGH'],
  ],
  bp: [
    [/blood\s+pressure\s+(?:check\w*|control\w*|manag\w*|address\w*|treat\w*|measur\w*)/i, 'HIGH'],
    [/blood\s+pressure\s+\d+\/\d+\s+(?:treat\w*|manag\w*|control\w*)/i, 'HIGH'],
    [/bp\s+(?:check\w*|control\w*|treat\w*|measur\w*|today|at\s+goal)/i, 'HIGH'],
    [/bp\s+\d+\/\d+\s+(?:treat\w*|manag\w*|control\w*)/i, 'HIGH'],
    [/hypertension\s+(?:control\w*|manag\w*|treat\w*|address\w*)/i, 'HIGH'],
    [/antihypertensive\s+(?:start\w*|adjust\w*|prescrib\w*|continu\w*)/i, 'HIGH'],
    [/(?:treat\w*|start\w*|adjust\w*|increas\w*|continu\w*)\s+with\s+(?:lisinopril|amlodipine|metoprolol|losartan|hydrochlorothiazide|carvedilol|valsartan|olmesartan)/i, 'HIGH'],
    [/(?:start\w*|adjust\w*|increas\w*|continu\w*|prescrib\w*)\s+(?:lisinopril|amlodipine|metoprolol|losartan|hydrochlorothiazide|carvedilol|valsartan|olmesartan)/i, 'HIGH'],
    [/(?:lisinopril|amlodipine|metoprolol|losartan|hydrochlorothiazide|carvedilol|valsartan|olmesartan)\s+(?:continu\w*|prescrib\w*|ordered?|adjust\w*)/i, 'HIGH'],
    [/bp\s+\d+\/\d+/i, 'MEDIUM'],
  ],
  lipid: [
    [/(?:ordered?|check\w*|done|result\w*|review\w*)\s+(?:lipid\s+panel|cholesterol)/i, 'HIGH'],
    [/lipid\s+panel\s+(?:ordered?|done|result\w*|check\w*|today|review\w*)/i, 'HIGH'],
    [/cholesterol\s+(?:check\w*|test\w*|panel|screen\w*|result\w*)/i, 'HIGH'],
    [/(?:ldl|hdl|triglyceride)\s+(?:ordered?|check\w*|result\w*|review\w*)/i, 'HIGH'],
    [/statin\s+(?:start\w*|prescrib\w*|ordered?|continu\w*)/i, 'HIGH'],
    [/(?:start\w*|prescrib\w*)\s+(?:atorvastatin|rosuvastatin|simvastatin|pravastatin|lovastatin)/i, 'HIGH'],
  ],
  a1c: [
    [/(?:check\w*|ordered?|done|result\w*|review\w*|test\w*)\s+a1c/i, 'HIGH'],
    [/a1c\s+(?:result\w*|value|is|check\w*|test\w*|ordered?|today|of|at|\d)/i, 'HIGH'],
    [/hemoglobin\s+a1c\s+(?:ordered?|check\w*|result\w*|done|today)/i, 'HIGH'],
    [/glycat\w+\s+hemoglobin/i, 'HIGH'],
    [/hba1c\s+(?:ordered?|check\w*|result\w*|done)/i, 'HIGH'],
    [/a1c\s+(?:was|came\s+back|is)\s+\d/i, 'HIGH'],
  ],
  eye_exam: [
    [/(?:ordered?|referr\w*|schedul\w*)\s+(?:eye\s+exam|optom\w*|ophthalm\w*)/i, 'HIGH'],
    [/diabetic\s+eye\s+(?:exam|screen\w*|check)/i, 'HIGH'],
    [/retinal\s+(?:exam|screen\w*|imaging|photo)/i, 'HIGH'],
    [/optom\w+\s+(?:referr\w*|ordered?|schedul\w*)/i, 'HIGH'],
    [/ophthalmol\w+\s+(?:referr\w*|ordered?|schedul\w*)/i, 'HIGH'],
    [/eye\s+exam\s+(?:ordered?|schedul\w*|done|complet\w*|today)/i, 'HIGH'],
    [/dilat\w+\s+eye\s+exam/i, 'HIGH'],
  ],
  foot_exam: [
    [/(?:perform\w*|done|complet\w*)\s+(?:diabetic\s+)?foot\s+exam/i, 'HIGH'],
    [/foot\s+exam\s+(?:perform\w*|done|complet\w*|today)/i, 'HIGH'],
    [/diabetic\s+foot\s+(?:exam|check\w*|inspect\w*)/i, 'HIGH'],
    [/monofilament\s+(?:test|exam|check\w*)\s+(?:perform\w*|done)/i, 'HIGH'],
    [/peripheral\s+(?:pulse|sensory|neuropath\w*)\s+(?:check\w*|exam\w*|assess\w*)/i, 'HIGH'],
    [/foot\s+inspect\w+\s+(?:perform\w*|done|complet\w*)/i, 'HIGH'],
  ],
  microalbumin: [
    [/microalbumin\s+(?:ordered?|check\w*|done|result\w*|today)/i, 'HIGH'],
    [/urine\s+albumin\s+(?:ordered?|check\w*|done|result\w*)/i, 'HIGH'],
    [/(?:acr|albumin.creatinine\s+ratio)\s+(?:ordered?|done|check\w*|result\w*)/i, 'HIGH'],
    [/kidney\s+(?:function\s+)?(?:test\w*|check\w*|monitor\w*|panel)\s+(?:ordered?|done|result\w*)/i, 'HIGH'],
    [/renal\s+(?:function\s+)?(?:test\w*|check\w*|panel)\s+(?:ordered?|done)/i, 'HIGH'],
    [/urine\s+protein\s+(?:ordered?|check\w*|done)/i, 'MEDIUM'],
  ],
  dexa: [
    [/(?:ordered?|schedul\w*|done|complet\w*)\s+(?:dexa|dxa)\s+(?:scan)?/i, 'HIGH'],
    [/(?:dexa|dxa)\s+scan\s+(?:ordered?|schedul\w*|done|complet\w*)/i, 'HIGH'],
    [/bone\s+(?:density|densitom\w*)\s+(?:ordered?|scan|test\w*|check\w*|done)/i, 'HIGH'],
    [/osteoporos\w+\s+screen\w+\s+(?:done|complet\w*|ordered?)/i, 'HIGH'],
    [/dual.energy\s+x.ray\s+absorptiomet\w*/i, 'HIGH'],
  ],
  depression: [
    [/(?:perform\w*|done|complet\w*|administer\w*)\s+(?:phq.?\d*|depression\s+screen\w*)/i, 'HIGH'],
    [/phq.?\d+\s+(?:perform\w*|done|complet\w*|score\w*|today|administer\w*)/i, 'HIGH'],
    [/depression\s+screen\w+\s+(?:perform\w*|done|complet\w*|today)/i, 'HIGH'],
    [/depression\s+(?:assess\w*|screen\w*)\s+(?:done|complet\w*|perform\w*)/i, 'HIGH'],
    [/patient\s+(?:screen\w*|assess\w*)\s+for\s+depression/i, 'HIGH'],
  ],
  wellness: [
    [/annual\s+wellness\s+visit\s+(?:complet\w*|perform\w*|done|today)/i, 'HIGH'],
    [/awv\s+(?:perform\w*|done|complet\w*|today)/i, 'HIGH'],
    [/preventive\s+(?:visit|care|exam)\s+(?:done|complet\w*|perform\w*|today)/i, 'HIGH'],
    [/well(?:ness)?\s+(?:exam|visit|check)\s+(?:done|complet\w*|today)/i, 'HIGH'],
    [/health\s+maintenance\s+(?:visit|exam|review)\s+(?:done|complet\w*)/i, 'HIGH'],
    [/annual\s+physical\s+(?:done|complet\w*|today)/i, 'MEDIUM'],
  ],
  bmi: [
    [/(?:address\w*|counsel\w*|discuss\w*)\s+(?:bmi|weight\s+manag\w*|obesity)/i, 'HIGH'],
    [/weight\s+manag\w+\s+(?:counsel\w*|discuss\w*|referr\w*|program)/i, 'HIGH'],
    [/nutritional\s+counsel\w+\s+(?:provid\w*|done|referr\w*)/i, 'HIGH'],
    [/(?:referr\w*|ordered?)\s+(?:dietit\w*|nutritionist)/i, 'HIGH'],
    [/obesity\s+(?:manag\w*|counsel\w*|treat\w*|address\w*)/i, 'HIGH'],
    [/bmi\s+(?:discuss\w*|address\w*|counsel\w*)/i, 'HIGH'],
  ],
};

export function matchGreenPattern(gapId: string, transcript: string): PatternMatch {
  const patterns = GREEN_PATTERNS[gapId];
  if (!patterns) return { matched: false, evidence: '', confidence: 'LOW' };

  for (const [regex, confidence] of patterns) {
    const match = transcript.match(regex);
    if (match) {
      return { matched: true, evidence: match[0].trim(), confidence };
    }
  }
  return { matched: false, evidence: '', confidence: 'LOW' };
}

const AGE_PATTERNS: RegExp[] = [
  /(\d{1,3})\s*[-\s]?\s*(?:year|yr)s?\s*[-\s]?\s*old/i,
  /(\d{1,3})\s*yo\b/i,
  /(\d{1,3})\s*y\/o\b/i,
  /age[d]?\s+(\d{1,3})/i,
  /(\d{1,3})\s*year\s*old/i,
];

const FEMALE_PATTERNS = /\b(?:female|woman|women|girl|she|her)\b/i;
const MALE_PATTERNS = /\b(?:male|man|men|gentleman|boy|he|him|his)\b/i;

export function extractDemographics(transcript: string) {
  let age: number | null = null;
  for (const pattern of AGE_PATTERNS) {
    const match = transcript.match(pattern);
    if (match) {
      const parsed = parseInt(match[1], 10);
      if (parsed >= 1 && parsed <= 120) {
        age = parsed;
        break;
      }
    }
  }

  const hasExplicitFemale = /\b(?:female|woman|women)\b/i.test(transcript);
  const hasExplicitMale = /\b(?:male|man|men|gentleman)\b/i.test(transcript);
  const hasFemalePronouns = /\b(?:she|her)\b/i.test(transcript);
  const hasMalePronouns = /\b(?:he|him|his)\b/i.test(transcript);

  let gender: 'MALE' | 'FEMALE' | 'UNKNOWN' = 'UNKNOWN';
  let confidence: 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';

  if (hasExplicitFemale && !hasExplicitMale) {
    gender = 'FEMALE';
    confidence = 'HIGH';
  } else if (hasExplicitMale && !hasExplicitFemale) {
    gender = 'MALE';
    confidence = 'HIGH';
  } else if (hasFemalePronouns && !hasMalePronouns) {
    gender = 'FEMALE';
    confidence = 'MEDIUM';
  } else if (hasMalePronouns && !hasFemalePronouns) {
    gender = 'MALE';
    confidence = 'MEDIUM';
  } else if (FEMALE_PATTERNS.test(transcript)) {
    gender = 'FEMALE';
    confidence = 'LOW';
  } else if (MALE_PATTERNS.test(transcript)) {
    gender = 'MALE';
    confidence = 'LOW';
  }

  if (age !== null && confidence === 'LOW') confidence = 'MEDIUM';
  if (age !== null && gender !== 'UNKNOWN') confidence = 'HIGH';

  return { age, gender, confidence };
}
