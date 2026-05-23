// ICD-10 + HCC v28 (2024) coding database
// RAF values: CMS-HCC v28, Community Non-Dual Aged (most common MA population)
// Hierarchy groups: within a group, only the highest-ranked HCC counts

export interface TOADDefaults {
  type: string;
  onset: string;
  anatomy: string;
  detail: string;
}

export interface CodeEntry {
  id: string;
  label: string;
  patterns: RegExp[];
  icd10Code: string;
  icd10Desc: string;
  toad?: TOADDefaults;  // built dynamically in clinicalNLP if not set
  hcc?: {
    number: number;
    description: string;
    raf: number;
    hierarchyGroup?: string;
    hierarchyRank?: number; // higher = more severe = wins
  };
  laterality?: boolean;
  checkAcuity?: boolean;
}

export const CODE_DATABASE: CodeEntry[] = [
  // ── DIABETES ────────────────────────────────────────────────────────────────
  {
    id: 'dm2_hyperosmolar',
    label: 'Type 2 DM with hyperosmolar coma',
    patterns: [/type\s*2\s*diabet\w*\s*(?:with\s*)?hyperosmolar/i, /hyperosmolar\s*(?:non)?(?:ketotic)?\s*(?:state|coma)/i],
    icd10Code: 'E11.00',
    icd10Desc: 'Type 2 diabetes mellitus with hyperosmolarity without NKHHC',
    hcc: { number: 17, description: 'Diabetes with Acute Complications', raf: 0.360, hierarchyGroup: 'diabetes', hierarchyRank: 3 },
  },
  {
    id: 'dm2_dka',
    label: 'Type 2 DM with DKA',
    patterns: [/type\s*2\s*diabet\w*\s*(?:with\s*)?(?:dka|diabetic\s*ketoacidosis)/i, /\b(?:dka)\b/i],
    icd10Code: 'E11.10',
    icd10Desc: 'Type 2 diabetes mellitus with ketoacidosis without coma',
    hcc: { number: 17, description: 'Diabetes with Acute Complications', raf: 0.360, hierarchyGroup: 'diabetes', hierarchyRank: 3 },
  },
  {
    id: 'dm2_neuropathy',
    label: 'Type 2 DM with diabetic neuropathy',
    patterns: [/diabet\w*\s*neuropath\w*/i, /type\s*2\s*diabet\w*\s*(?:with\s*)?neuropath\w*/i, /peripheral\s*neuropath\w*\s*(?:due\s*to\s*)?diabet\w*/i],
    icd10Code: 'E11.40',
    icd10Desc: 'Type 2 diabetes mellitus with diabetic neuropathy, unspecified',
    hcc: { number: 18, description: 'Diabetes with Chronic Complications', raf: 0.318, hierarchyGroup: 'diabetes', hierarchyRank: 2 },
  },
  {
    id: 'dm2_ckd',
    label: 'Type 2 DM with CKD',
    patterns: [/diabet\w*\s*(?:nephropathy|kidney\s*disease)/i, /type\s*2\s*diabet\w*\s*(?:with\s*)?(?:ckd|chronic\s*kidney)/i],
    icd10Code: 'E11.65',
    icd10Desc: 'Type 2 diabetes mellitus with hyperglycemia and CKD',
    hcc: { number: 18, description: 'Diabetes with Chronic Complications', raf: 0.318, hierarchyGroup: 'diabetes', hierarchyRank: 2 },
  },
  {
    id: 'dm2_eye',
    label: 'Type 2 DM with diabetic retinopathy',
    patterns: [/diabet\w*\s*retinopath\w*/i, /type\s*2\s*diabet\w*\s*(?:with\s*)?retinopath\w*/i, /proliferative\s*diabet\w*\s*retinopath\w*/i],
    icd10Code: 'E11.311',
    icd10Desc: 'Type 2 diabetes mellitus with unspecified diabetic retinopathy with macular edema',
    hcc: { number: 18, description: 'Diabetes with Chronic Complications', raf: 0.318, hierarchyGroup: 'diabetes', hierarchyRank: 2 },
  },
  {
    id: 'dm2',
    label: 'Type 2 Diabetes Mellitus',
    patterns: [/type\s*2\s*diabet\w*/i, /\bt2\s*dm\b/i, /\bdm\s*2\b/i, /non[\s-]*insulin[\s-]*depend\w*\s*diabet\w*/i, /\bniddm\b/i, /adult[\s-]*onset\s*diabet\w*/i],
    icd10Code: 'E11.9',
    icd10Desc: 'Type 2 diabetes mellitus without complications',
    hcc: { number: 19, description: 'Diabetes without Complication', raf: 0.302, hierarchyGroup: 'diabetes', hierarchyRank: 1 },
  },
  {
    id: 'dm1',
    label: 'Type 1 Diabetes Mellitus',
    patterns: [/type\s*1\s*diabet\w*/i, /\bt1\s*dm\b/i, /\bdm\s*1\b/i, /insulin[\s-]*depend\w*\s*diabet\w*/i, /\biddm\b/i, /juvenile\s*diabet\w*/i],
    icd10Code: 'E10.9',
    icd10Desc: 'Type 1 diabetes mellitus without complications',
    hcc: { number: 19, description: 'Diabetes without Complication', raf: 0.302, hierarchyGroup: 'diabetes', hierarchyRank: 1 },
  },

  // ── CARDIOVASCULAR ───────────────────────────────────────────────────────────
  {
    id: 'chf_systolic',
    label: 'CHF, systolic',
    patterns: [/systolic\s*(?:heart\s*failure|chf)/i, /heart\s*failure\s*(?:with\s*)?(?:reduced|decreased)\s*(?:ef|ejection)/i, /\bhfref\b/i],
    icd10Code: 'I50.20',
    icd10Desc: 'Unspecified systolic (congestive) heart failure',
    hcc: { number: 85, description: 'Congestive Heart Failure', raf: 0.323, hierarchyGroup: 'heart', hierarchyRank: 4 },
  },
  {
    id: 'chf_diastolic',
    label: 'CHF, diastolic',
    patterns: [/diastolic\s*(?:heart\s*failure|chf)/i, /heart\s*failure\s*(?:with\s*)?(?:preserved|normal)\s*(?:ef|ejection)/i, /\bhfpef\b/i],
    icd10Code: 'I50.30',
    icd10Desc: 'Unspecified diastolic (congestive) heart failure',
    hcc: { number: 85, description: 'Congestive Heart Failure', raf: 0.323, hierarchyGroup: 'heart', hierarchyRank: 4 },
  },
  {
    id: 'chf',
    label: 'Congestive Heart Failure',
    patterns: [/\bchf\b/i, /(?:congestive\s*)?heart\s*failure/i, /cardiac\s*failure/i],
    icd10Code: 'I50.9',
    icd10Desc: 'Heart failure, unspecified',
    hcc: { number: 85, description: 'Congestive Heart Failure', raf: 0.323, hierarchyGroup: 'heart', hierarchyRank: 4 },
  },
  {
    id: 'acute_mi',
    label: 'Acute Myocardial Infarction',
    patterns: [/acute\s*(?:mi|myocardial\s*infarction)/i, /\bnstemi\b/i, /\bstemi\b/i, /acute\s*coronary\s*syndrome/i, /\bacs\b/i],
    icd10Code: 'I21.9',
    icd10Desc: 'Acute myocardial infarction, unspecified',
    hcc: { number: 86, description: 'Acute Myocardial Infarction', raf: 0.231, hierarchyGroup: 'heart', hierarchyRank: 3 },
  },
  {
    id: 'cad',
    label: 'Coronary Artery Disease',
    patterns: [/coronary\s*artery\s*disease/i, /\bcad\b/i, /ischem\w*\s*heart\s*disease/i, /\bihd\b/i, /coronary\s*artery\s*disease/i, /angina\s*pectoris/i],
    icd10Code: 'I25.10',
    icd10Desc: 'Atherosclerotic heart disease of native coronary artery without angina pectoris',
    hcc: { number: 88, description: 'Angina Pectoris/Stable CAD', raf: 0.085, hierarchyGroup: 'heart', hierarchyRank: 1 },
  },
  {
    id: 'afib',
    label: 'Atrial Fibrillation',
    patterns: [/atrial\s*fib\w*/i, /\bafib\b/i, /\ba\.?\s*fib\b/i, /\baf\b/i],
    icd10Code: 'I48.91',
    icd10Desc: 'Unspecified atrial fibrillation',
    hcc: { number: 96, description: 'Specified Heart Arrhythmias', raf: 0.280 },
  },
  {
    id: 'aflutter',
    label: 'Atrial Flutter',
    patterns: [/atrial\s*flutter/i, /\ba\.?\s*flutter\b/i],
    icd10Code: 'I48.4',
    icd10Desc: 'Typical atrial flutter',
    hcc: { number: 96, description: 'Specified Heart Arrhythmias', raf: 0.280 },
  },
  {
    id: 'htn',
    label: 'Essential Hypertension',
    patterns: [/\bhypertension\b/i, /\bhtn\b/i, /high\s*blood\s*pressure/i, /elevated\s*blood\s*pressure/i],
    icd10Code: 'I10',
    icd10Desc: 'Essential (primary) hypertension',
    // No HCC for uncomplicated HTN
  },
  {
    id: 'pvd',
    label: 'Peripheral Vascular Disease',
    patterns: [/peripheral\s*(?:vascular|artery|arterial)\s*disease/i, /\bpvd\b/i, /\bpad\b/i, /peripheral\s*arterial\s*occlusive/i],
    icd10Code: 'I73.9',
    icd10Desc: 'Peripheral vascular disease, unspecified',
    hcc: { number: 108, description: 'Vascular Disease', raf: 0.288, hierarchyGroup: 'vascular', hierarchyRank: 1 },
  },
  {
    id: 'dvt',
    label: 'Deep Vein Thrombosis',
    patterns: [/deep\s*(?:vein|venous)\s*thrombosis/i, /\bdvt\b/i],
    icd10Code: 'I82.401',
    icd10Desc: 'Acute DVT of unspecified deep veins of right lower extremity',
    hcc: { number: 107, description: 'Vascular Disease with Complications', raf: 0.412, hierarchyGroup: 'vascular', hierarchyRank: 2 },
    laterality: true,
  },
  {
    id: 'pe',
    label: 'Pulmonary Embolism',
    patterns: [/pulmonary\s*embol\w*/i, /\bpe\b(?!\s*tube)/i],
    icd10Code: 'I26.99',
    icd10Desc: 'Other pulmonary embolism without acute cor pulmonale',
    hcc: { number: 107, description: 'Vascular Disease with Complications', raf: 0.412, hierarchyGroup: 'vascular', hierarchyRank: 2 },
  },

  // ── STROKE / NEURO ───────────────────────────────────────────────────────────
  {
    id: 'ischemic_stroke',
    label: 'Ischemic Stroke / CVA',
    patterns: [/ischem\w*\s*stroke/i, /cerebrovascular\s*accident/i, /\bcva\b/i, /cerebral\s*infarct\w*/i],
    icd10Code: 'I63.9',
    icd10Desc: 'Cerebral infarction, unspecified',
    hcc: { number: 100, description: 'Ischemic or Unspecified Stroke', raf: 0.194, hierarchyGroup: 'stroke', hierarchyRank: 1 },
  },
  {
    id: 'hemorrhagic_stroke',
    label: 'Hemorrhagic Stroke / ICH',
    patterns: [/hemorrhag\w*\s*stroke/i, /intracerebral\s*hemorrhage/i, /\bich\b/i, /cerebral\s*hemorrhage/i],
    icd10Code: 'I61.9',
    icd10Desc: 'Nontraumatic intracerebral hemorrhage, unspecified',
    hcc: { number: 99, description: 'Cerebral Hemorrhage', raf: 0.480, hierarchyGroup: 'stroke', hierarchyRank: 2 },
  },
  {
    id: 'tia',
    label: 'Transient Ischemic Attack',
    patterns: [/transient\s*ischem\w*\s*attack/i, /\btia\b/i],
    icd10Code: 'G45.9',
    icd10Desc: 'Transient cerebral ischemic attack, unspecified',
    // TIA is not HCC but clinically important
  },
  {
    id: 'hemiplegia',
    label: 'Hemiplegia / Hemiparesis',
    patterns: [/hemiplegia/i, /hemiparesis/i],
    icd10Code: 'G81.90',
    icd10Desc: 'Hemiplegia, unspecified affecting unspecified side',
    hcc: { number: 103, description: 'Hemiplegia/Hemiparesis', raf: 0.391, hierarchyGroup: 'paralysis', hierarchyRank: 4 },
    laterality: true,
  },
  {
    id: 'parkinsons',
    label: "Parkinson's Disease",
    patterns: [/parkinson\w*\s*disease/i, /\bpd\b(?!\s*\d)/i, /parkinsonism/i],
    icd10Code: 'G20',
    icd10Desc: "Parkinson's disease",
    hcc: { number: 78, description: "Parkinson's and Huntington's Diseases", raf: 0.418 },
  },
  {
    id: 'alzheimers',
    label: "Alzheimer's Disease / Dementia",
    patterns: [/alzheimer\w*/i, /dementia/i, /major\s*neurocognitive\s*disorder/i, /\bmci\b/i],
    icd10Code: 'G30.9',
    icd10Desc: "Alzheimer's disease, unspecified",
    hcc: { number: 79, description: "Alzheimer's Disease", raf: 0.367 },
  },
  {
    id: 'ms',
    label: 'Multiple Sclerosis',
    patterns: [/multiple\s*sclerosis/i, /\bms\b(?!\s*(?:mg|mcg|ml))/i],
    icd10Code: 'G35',
    icd10Desc: 'Multiple sclerosis',
    hcc: { number: 75, description: 'Multiple Sclerosis', raf: 0.418 },
  },
  {
    id: 'epilepsy',
    label: 'Epilepsy / Seizure Disorder',
    patterns: [/epilepsy/i, /seizure\s*(?:disorder|history)/i, /\bseizures?\b/i, /convulsions?/i],
    icd10Code: 'G40.909',
    icd10Desc: 'Epilepsy, unspecified, not intractable, without status epilepticus',
    hcc: { number: 76, description: 'Seizure Disorders and Convulsions', raf: 0.261 },
  },
  {
    id: 'als',
    label: 'Amyotrophic Lateral Sclerosis',
    patterns: [/amyotrophic\s*lateral\s*sclerosis/i, /\bals\b/i, /lou\s*gehrig/i],
    icd10Code: 'G12.21',
    icd10Desc: 'Amyotrophic lateral sclerosis',
    hcc: { number: 73, description: 'Amyotrophic Lateral Sclerosis', raf: 0.756 },
  },

  // ── RESPIRATORY ──────────────────────────────────────────────────────────────
  {
    id: 'copd_exacerbation',
    label: 'COPD with Acute Exacerbation',
    patterns: [/copd\s*(?:with\s*)?(?:acute\s*)?exacerbation/i, /acute\s*exacerbation\s*(?:of\s*)?copd/i, /\baecopd\b/i],
    icd10Code: 'J44.1',
    icd10Desc: 'Chronic obstructive pulmonary disease with acute exacerbation',
    hcc: { number: 111, description: 'Chronic Obstructive Pulmonary Disease', raf: 0.335, hierarchyGroup: 'lung', hierarchyRank: 2 },
  },
  {
    id: 'copd',
    label: 'COPD',
    patterns: [/\bcopd\b/i, /chronic\s*obstructive\s*pulmonary\s*disease/i, /emphysema/i, /chronic\s*bronchitis/i],
    icd10Code: 'J44.9',
    icd10Desc: 'Chronic obstructive pulmonary disease, unspecified',
    hcc: { number: 111, description: 'Chronic Obstructive Pulmonary Disease', raf: 0.335, hierarchyGroup: 'lung', hierarchyRank: 1 },
  },
  {
    id: 'asthma',
    label: 'Asthma',
    patterns: [/\basthma\b/i, /reactive\s*airway\s*disease/i],
    icd10Code: 'J45.909',
    icd10Desc: 'Unspecified asthma, uncomplicated',
    // Asthma alone is not HCC
  },
  {
    id: 'pulm_fibrosis',
    label: 'Pulmonary Fibrosis / Interstitial Lung Disease',
    patterns: [/pulmonary\s*fibrosis/i, /interstitial\s*lung\s*disease/i, /\bild\b/i, /\bipf\b/i],
    icd10Code: 'J84.10',
    icd10Desc: 'Pulmonary fibrosis, unspecified',
    hcc: { number: 112, description: 'Fibrosis of Lung and Other Chronic Lung Disorders', raf: 0.196, hierarchyGroup: 'lung', hierarchyRank: 1 },
  },
  {
    id: 'cystic_fibrosis',
    label: 'Cystic Fibrosis',
    patterns: [/cystic\s*fibrosis/i, /\bcf\b(?!\s*(?:mg|mcg))/i],
    icd10Code: 'E84.9',
    icd10Desc: 'Cystic fibrosis, unspecified',
    hcc: { number: 110, description: 'Cystic Fibrosis', raf: 0.363 },
  },
  {
    id: 'aspiration_pna',
    label: 'Aspiration Pneumonia',
    patterns: [/aspiration\s*pneum\w*/i],
    icd10Code: 'J69.0',
    icd10Desc: 'Pneumonitis due to inhalation of food and vomit',
    hcc: { number: 114, description: 'Aspiration and Specified Bacterial Pneumonias', raf: 0.573 },
  },

  // ── RENAL ─────────────────────────────────────────────────────────────────────
  {
    id: 'esrd_dialysis',
    label: 'ESRD on Dialysis',
    patterns: [/\besrd\b/i, /end[\s-]*stage\s*renal\s*disease/i, /end[\s-]*stage\s*kidney\s*disease/i, /\bdialysis\b/i, /hemodialysis/i, /peritoneal\s*dialysis/i],
    icd10Code: 'N18.6',
    icd10Desc: 'End stage renal disease',
    hcc: { number: 134, description: 'Dialysis Status', raf: 0.421, hierarchyGroup: 'ckd', hierarchyRank: 4 },
  },
  {
    id: 'ckd5',
    label: 'CKD Stage 5',
    patterns: [/ckd\s*(?:stage\s*)?5/i, /chronic\s*kidney\s*disease\s*(?:stage\s*)?5/i, /ckd\s*v\b/i],
    icd10Code: 'N18.5',
    icd10Desc: 'Chronic kidney disease, stage 5',
    hcc: { number: 136, description: 'Chronic Kidney Disease, Stage 5', raf: 0.421, hierarchyGroup: 'ckd', hierarchyRank: 3 },
  },
  {
    id: 'ckd4',
    label: 'CKD Stage 4',
    patterns: [/ckd\s*(?:stage\s*)?4/i, /chronic\s*kidney\s*disease\s*(?:stage\s*)?4/i, /ckd\s*iv\b/i, /severe\s*ckd/i],
    icd10Code: 'N18.4',
    icd10Desc: 'Chronic kidney disease, stage 4 (severe)',
    hcc: { number: 137, description: 'Chronic Kidney Disease, Severe (Stage 4)', raf: 0.237, hierarchyGroup: 'ckd', hierarchyRank: 2 },
  },
  {
    id: 'ckd3',
    label: 'CKD Stage 3',
    patterns: [/ckd\s*(?:stage\s*)?3[ab]?/i, /chronic\s*kidney\s*disease\s*(?:stage\s*)?3/i, /ckd\s*iii\b/i, /moderate\s*ckd/i],
    icd10Code: 'N18.30',
    icd10Desc: 'Chronic kidney disease, stage 3 unspecified',
    hcc: { number: 138, description: 'Chronic Kidney Disease, Moderate (Stage 3)', raf: 0.083, hierarchyGroup: 'ckd', hierarchyRank: 1 },
  },
  {
    id: 'ckd_unspec',
    label: 'Chronic Kidney Disease',
    patterns: [/\bckd\b/i, /chronic\s*kidney\s*disease/i, /chronic\s*renal\s*(?:failure|disease|insufficiency)/i, /\bcrf\b/i],
    icd10Code: 'N18.9',
    icd10Desc: 'Chronic kidney disease, unspecified',
    // No HCC for unspecified CKD without stage
  },
  {
    id: 'aki',
    label: 'Acute Kidney Injury',
    patterns: [/acute\s*kidney\s*injury/i, /\baki\b/i, /acute\s*renal\s*failure/i, /\barf\b/i],
    icd10Code: 'N17.9',
    icd10Desc: 'Acute kidney failure, unspecified',
    hcc: { number: 135, description: 'Acute Renal Failure', raf: 0.421, hierarchyGroup: 'ckd', hierarchyRank: 4 },
  },

  // ── MENTAL HEALTH ─────────────────────────────────────────────────────────────
  {
    id: 'schizophrenia',
    label: 'Schizophrenia',
    patterns: [/schizophrenia/i, /schizoaffective/i, /psychosis\s*nos/i],
    icd10Code: 'F20.9',
    icd10Desc: 'Schizophrenia, unspecified',
    hcc: { number: 57, description: 'Schizophrenia', raf: 0.704, hierarchyGroup: 'psychiatric', hierarchyRank: 3 },
  },
  {
    id: 'bipolar',
    label: 'Bipolar Disorder',
    patterns: [/bipolar\s*(?:disorder|affective\s*disorder|i|ii)?/i, /manic[\s-]*depressive/i],
    icd10Code: 'F31.9',
    icd10Desc: 'Bipolar disorder, unspecified',
    hcc: { number: 58, description: 'Major Depressive/Bipolar and Paranoid Disorders', raf: 0.395, hierarchyGroup: 'psychiatric', hierarchyRank: 2 },
  },
  {
    id: 'mdd',
    label: 'Major Depressive Disorder',
    patterns: [/major\s*depressive\s*disorder/i, /\bmdd\b/i, /major\s*depression/i, /\bdepression\b/i, /depressive\s*disorder/i],
    icd10Code: 'F32.9',
    icd10Desc: 'Major depressive disorder, single episode, unspecified',
    hcc: { number: 47, description: 'Depressive Disorders', raf: 0.395, hierarchyGroup: 'psychiatric', hierarchyRank: 1 },
  },
  {
    id: 'anxiety',
    label: 'Anxiety Disorder',
    patterns: [/anxiety\s*disorder/i, /generalized\s*anxiety/i, /\bgad\b/i, /panic\s*disorder/i],
    icd10Code: 'F41.9',
    icd10Desc: 'Anxiety disorder, unspecified',
    hcc: { number: 48, description: 'Anxiety Disorders', raf: 0.090 },
  },
  {
    id: 'ptsd',
    label: 'PTSD',
    patterns: [/\bptsd\b/i, /post[\s-]*traumatic\s*stress/i],
    icd10Code: 'F43.10',
    icd10Desc: 'Post-traumatic stress disorder, unspecified',
    hcc: { number: 49, description: 'Other Psychiatric Disorders', raf: 0.321 },
  },
  {
    id: 'drug_dependence',
    label: 'Substance Use Disorder',
    patterns: [/(?:opioid|alcohol|substance)\s*(?:use\s*disorder|dependence|abuse)/i, /\baud\b/i, /\boud\b/i, /addiction/i],
    icd10Code: 'F19.20',
    icd10Desc: 'Other psychoactive substance dependence, uncomplicated',
    hcc: { number: 55, description: 'Drug/Alcohol Dependence', raf: 0.321 },
  },

  // ── LIVER ─────────────────────────────────────────────────────────────────────
  {
    id: 'esld',
    label: 'End-Stage Liver Disease',
    patterns: [/end[\s-]*stage\s*liver\s*disease/i, /\besld\b/i, /liver\s*failure/i, /hepatic\s*failure/i],
    icd10Code: 'K72.90',
    icd10Desc: 'Hepatic failure, unspecified without coma',
    hcc: { number: 27, description: 'End-Stage Liver Disease', raf: 0.970, hierarchyGroup: 'liver', hierarchyRank: 3 },
  },
  {
    id: 'cirrhosis',
    label: 'Cirrhosis of the Liver',
    patterns: [/cirrhosis/i, /hepatic\s*cirrhosis/i],
    icd10Code: 'K74.60',
    icd10Desc: 'Unspecified cirrhosis of liver',
    hcc: { number: 28, description: 'Cirrhosis of Liver', raf: 0.372, hierarchyGroup: 'liver', hierarchyRank: 2 },
  },
  {
    id: 'chronic_hep',
    label: 'Chronic Hepatitis',
    patterns: [/chronic\s*hepatitis\s*[bc]/i, /hepatitis\s*[bc]\s*(?:chronic|infection)/i, /\bhcv\b/i, /\bhbv\b/i],
    icd10Code: 'B18.2',
    icd10Desc: 'Chronic viral hepatitis C',
    hcc: { number: 29, description: 'Chronic Hepatitis', raf: 0.152, hierarchyGroup: 'liver', hierarchyRank: 1 },
  },

  // ── CANCER ────────────────────────────────────────────────────────────────────
  {
    id: 'metastatic_cancer',
    label: 'Metastatic Cancer',
    patterns: [/metastat\w*\s*(?:cancer|carcinoma|malignancy|disease)/i, /cancer\s*with\s*metastasis/i, /stage\s*(?:4|iv)\s*cancer/i],
    icd10Code: 'C80.1',
    icd10Desc: 'Malignant (primary) neoplasm, unspecified',
    hcc: { number: 8, description: 'Metastatic Cancer and Acute Leukemia', raf: 2.659, hierarchyGroup: 'cancer', hierarchyRank: 5 },
  },
  {
    id: 'lung_cancer',
    label: 'Lung Cancer',
    patterns: [/lung\s*cancer/i, /pulmonary\s*(?:carcinoma|malignancy)/i, /non[\s-]*small\s*cell\s*lung/i, /small\s*cell\s*lung/i, /\bnsclc\b/i, /\bsclc\b/i],
    icd10Code: 'C34.10',
    icd10Desc: 'Malignant neoplasm of upper lobe, bronchus or lung, unspecified side',
    hcc: { number: 9, description: 'Lung and Other Severe Cancers', raf: 1.044, hierarchyGroup: 'cancer', hierarchyRank: 4 },
    laterality: true,
  },
  {
    id: 'colorectal_cancer',
    label: 'Colorectal Cancer',
    patterns: [/colorectal\s*cancer/i, /colon\s*cancer/i, /rectal\s*cancer/i, /colonic\s*(?:carcinoma|malignancy)/i],
    icd10Code: 'C18.9',
    icd10Desc: 'Malignant neoplasm of colon, unspecified',
    hcc: { number: 12, description: 'Breast, Prostate, Colorectal and Other Cancers', raf: 0.661, hierarchyGroup: 'cancer', hierarchyRank: 2 },
  },
  {
    id: 'breast_cancer',
    label: 'Breast Cancer',
    patterns: [/breast\s*cancer/i, /breast\s*(?:carcinoma|malignancy)/i, /\bbca\b/i],
    icd10Code: 'C50.919',
    icd10Desc: 'Malignant neoplasm of unspecified site of unspecified female breast',
    hcc: { number: 12, description: 'Breast, Prostate, Colorectal and Other Cancers', raf: 0.661, hierarchyGroup: 'cancer', hierarchyRank: 2 },
    laterality: true,
  },
  {
    id: 'prostate_cancer',
    label: 'Prostate Cancer',
    patterns: [/prostate\s*cancer/i, /prostatic\s*(?:carcinoma|malignancy)/i],
    icd10Code: 'C61',
    icd10Desc: 'Malignant neoplasm of prostate',
    hcc: { number: 12, description: 'Breast, Prostate, Colorectal and Other Cancers', raf: 0.661, hierarchyGroup: 'cancer', hierarchyRank: 2 },
  },
  {
    id: 'lymphoma',
    label: 'Lymphoma',
    patterns: [/lymphoma/i, /hodgkin\w*/i, /non[\s-]*hodgkin/i],
    icd10Code: 'C85.90',
    icd10Desc: 'Non-Hodgkin lymphoma, unspecified, unspecified site',
    hcc: { number: 10, description: 'Lymphoma and Other Cancers', raf: 0.661, hierarchyGroup: 'cancer', hierarchyRank: 3 },
  },

  // ── MUSCULOSKELETAL ───────────────────────────────────────────────────────────
  {
    id: 'ra',
    label: 'Rheumatoid Arthritis',
    patterns: [/rheumatoid\s*arthritis/i, /\bra\b(?!\s*(?:ct|xr|\d))/i],
    icd10Code: 'M06.9',
    icd10Desc: 'Rheumatoid arthritis, unspecified',
    hcc: { number: 38, description: 'Rheumatoid Arthritis and Specified Autoimmune Disorders', raf: 0.422 },
  },
  {
    id: 'osteoporosis',
    label: 'Osteoporosis',
    patterns: [/osteoporosis/i, /osteopenia/i],
    icd10Code: 'M81.0',
    icd10Desc: 'Age-related osteoporosis without current pathological fracture',
  },

  // ── ENDOCRINE / METABOLIC ─────────────────────────────────────────────────────
  {
    id: 'morbid_obesity',
    label: 'Morbid Obesity',
    patterns: [/morbid\s*obesity/i, /class\s*(?:3|iii)\s*obesity/i, /severe\s*obesity/i, /bmi\s*(?:of\s*)?(?:4\d|[5-9]\d)/i],
    icd10Code: 'E66.01',
    icd10Desc: 'Morbid (severe) obesity due to excess calories',
    hcc: { number: 22, description: 'Morbid Obesity', raf: 0.244 },
  },
  {
    id: 'obesity',
    label: 'Obesity',
    patterns: [/\bobesity\b/i, /\bobese\b/i, /overweight/i],
    icd10Code: 'E66.9',
    icd10Desc: 'Obesity, unspecified',
    // No HCC for uncomplicated obesity
  },
  {
    id: 'hypothyroid',
    label: 'Hypothyroidism',
    patterns: [/hypothyroid\w*/i, /\bunderactive\s*thyroid\b/i],
    icd10Code: 'E03.9',
    icd10Desc: 'Hypothyroidism, unspecified',
  },
  {
    id: 'hyperthyroid',
    label: 'Hyperthyroidism',
    patterns: [/hyperthyroid\w*/i, /\boveractive\s*thyroid\b/i, /grave\w*\s*disease/i],
    icd10Code: 'E05.90',
    icd10Desc: 'Thyrotoxicosis, unspecified without thyrotoxic crisis',
  },
  {
    id: 'malnutrition',
    label: 'Protein-Calorie Malnutrition',
    patterns: [/malnutrition/i, /protein[\s-]*calorie\s*malnutrition/i, /kwashiorkor/i, /cachexia/i],
    icd10Code: 'E46',
    icd10Desc: 'Unspecified protein-calorie malnutrition',
    hcc: { number: 21, description: 'Protein-Calorie Malnutrition', raf: 0.520 },
  },

  // ── HEMATOLOGY ────────────────────────────────────────────────────────────────
  {
    id: 'sickle_cell',
    label: 'Sickle Cell Anemia',
    patterns: [/sickle\s*cell\s*(?:anemia|disease)/i, /\bhbss\b/i],
    icd10Code: 'D57.1',
    icd10Desc: 'Sickle-cell disease without crisis',
    hcc: { number: 42, description: 'Sickle Cell Anemia', raf: 0.397 },
  },
  {
    id: 'anemia',
    label: 'Anemia',
    patterns: [/\banemia\b/i, /iron\s*deficiency\s*anemia/i, /\bida\b/i],
    icd10Code: 'D64.9',
    icd10Desc: 'Anaemia, unspecified',
  },

  // ── GI ───────────────────────────────────────────────────────────────────────
  {
    id: 'ibd',
    label: "Crohn's / Inflammatory Bowel Disease",
    patterns: [/crohn\w*\s*disease/i, /inflammatory\s*bowel\s*disease/i, /\bibd\b/i, /ulcerative\s*colitis/i],
    icd10Code: 'K50.90',
    icd10Desc: "Crohn's disease of small intestine without complications",
    hcc: { number: 33, description: 'Inflammatory Bowel Disease', raf: 0.266 },
  },
  {
    id: 'gerd',
    label: 'GERD / Acid Reflux',
    patterns: [/\bgerd\b/i, /gastroesophageal\s*reflux/i, /acid\s*reflux/i, /heartburn/i],
    icd10Code: 'K21.9',
    icd10Desc: 'Gastro-esophageal reflux disease without oesophagitis',
  },

  // ── HIV ───────────────────────────────────────────────────────────────────────
  {
    id: 'hiv',
    label: 'HIV / AIDS',
    patterns: [/\bhiv\b/i, /human\s*immunodeficiency\s*virus/i, /\baids\b/i, /hiv\s*positive/i],
    icd10Code: 'B20',
    icd10Desc: 'Human immunodeficiency virus [HIV] disease',
    hcc: { number: 1, description: 'HIV/AIDS', raf: 0.267 },
  },

  // ── COMMON ACUTE CONDITIONS ────────────────────────────────────────────────
  {
    id: 'pneumonia',
    label: 'Pneumonia',
    patterns: [/\bpneumonia\b/i, /\bpna\b/i, /lobar\s*pneumonia/i, /bacterial\s*pneumonia/i],
    icd10Code: 'J18.9',
    icd10Desc: 'Pneumonia, unspecified organism',
  },
  {
    id: 'uti',
    label: 'Urinary Tract Infection',
    patterns: [/urinary\s*tract\s*infection/i, /\buti\b/i, /cystitis/i, /\bpyelonephritis\b/i],
    icd10Code: 'N39.0',
    icd10Desc: 'Urinary tract infection, site not specified',
  },
  {
    id: 'otitis_media',
    label: 'Otitis Media',
    patterns: [/otitis\s*media/i, /middle\s*ear\s*infection/i, /ear\s*infection/i],
    icd10Code: 'H66.90',
    icd10Desc: 'Otitis media, unspecified, unspecified ear',
    laterality: true,
    checkAcuity: true,
  },
  {
    id: 'sinusitis',
    label: 'Sinusitis',
    patterns: [/sinusitis/i, /sinus\s*infection/i],
    icd10Code: 'J32.9',
    icd10Desc: 'Chronic sinusitis, unspecified',
    checkAcuity: true,
  },
  {
    id: 'back_pain',
    label: 'Low Back Pain',
    patterns: [/(?:low|lower)\s*back\s*pain/i, /\blbp\b/i, /lumbar\s*(?:pain|strain|radiculopathy)/i, /lumbago/i],
    icd10Code: 'M54.50',
    icd10Desc: 'Low back pain, unspecified',
  },
  {
    id: 'hyperlipidemia',
    label: 'Hyperlipidemia / Hypercholesterolemia',
    patterns: [/hyperlipidemia/i, /hypercholesterolemia/i, /dyslipidemia/i, /elevated\s*(?:cholesterol|lipids)/i, /high\s*cholesterol/i],
    icd10Code: 'E78.5',
    icd10Desc: 'Hyperlipidemia, unspecified',
  },
];
