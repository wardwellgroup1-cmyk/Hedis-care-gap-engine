// ── MEAT Detection Engine ──────────────────────────────────────────────────────
// Monitoring · Evaluation · Assessment · Treatment
// RAF validity rule: Assessment AND at least one of (Monitoring | Evaluation | Treatment)
// This validates that a condition was actively addressed during the encounter,
// not just mentioned historically.

import { ClinicalProblem, MEATStatus } from '../types';

// ── Global patterns (apply to any condition) ──────────────────────────────────

const GLOBAL_MONITORING: RegExp[] = [
  /\b(?:lab(?:s|oratory)?|blood\s*work|panel|CBC|CMP|BMP|metabolic\s*panel|lab\s*results?)\b/i,
  /\b(?:A1c|hemoglobin\s*A1c|HbA1c)\b/i,
  /\b(?:GFR|creatinine|BUN|eGFR|glomerular)\b/i,
  /\b(?:BNP|NT[\s-]*proBNP|troponin)\b/i,
  /\b(?:monitor(?:ing)?|follow[\s-]*up|repeat|recheck|retest|track(?:ing)?|trending)\b/i,
  /\b(?:vital(?:s)?|blood\s*pressure|BP|weight|pulse|O2\s*sat|SpO2|heart\s*rate)\b/i,
  /\b(?:EKG|ECG|echo|echocardiogram|spirometry|PFT|stress\s*test|nuclear)\b/i,
  /\b(?:imaging|CT\s*scan|MRI|x[\s-]?ray|ultrasound|Doppler)\b/i,
  /\b(?:lipid\s*panel|cholesterol|LDL|triglycerides|HDL)\b/i,
  /\b(?:order(?:ed|ing)?|obtain(?:ing)?|check(?:ing)?)\s+\w+/i,
];

const GLOBAL_EVALUATION: RegExp[] = [
  /\b(?:stable|unstable|worsening|improving|improved|controlled|uncontrolled|well[\s-]*controlled|poorly\s*controlled)\b/i,
  /\b(?:assess(?:ed|ment|ing)?|evaluat(?:ed|ion|ing)?|examin(?:ed|ation|ing)?|review(?:ed|ing)?)\b/i,
  /\b(?:presents?\s*with|complain(?:t|ing|s)\s*of|report(?:ed|s|ing)?)\b/i,
  /\b(?:NYHA|class\s*[IVXLC]+|stage\s*[1-5]|grade\s*[1-4]|severity)\b/i,
  /\b(?:functional\s*status|quality\s*of\s*life|symptom\s*burden)\b/i,
  /\b(?:progress(?:ing)?|deteriorat(?:ing|ion)?|remission|response)\b/i,
];

const GLOBAL_TREATMENT: RegExp[] = [
  /\b(?:continu(?:e|ing|ed)|maintain(?:ing)?|keep(?:ing)?)\s+\w+/i,
  /\b(?:start(?:ed|ing)?|initiat(?:e|ed|ing)?|prescrib(?:e|ed|ing)?|add(?:ed|ing)?)\s+\w+/i,
  /\b(?:increas(?:e|ed|ing)?|decreas(?:e|ed|ing)?|adjust(?:ed|ing)?|titrat(?:e|ed|ing)?|uptitrat(?:e|ed|ing)?)\b/i,
  /\b(?:discontinu(?:e|ed|ing)?|stop(?:ped|ping)?|hold(?:ing)?)\s+\w+/i,
  /\b(?:refer(?:red|ring|ral)?|consult(?:ed|ation|ing)?)\s+\w+/i,
  /\b(?:diet|exercise|lifestyle|weight\s*loss|counsel(?:ing|ed)?|education)\b/i,
  /\b(?:procedure|surgery|intervention|stent|ablation|surgery)\b/i,
  /\b(?:medication|medic(?:ine|ation)s?|drug|therapy|treatment|regimen)\b/i,
];

// ── Condition-specific MEAT patterns ─────────────────────────────────────────

interface ConditionMEAT {
  monitoring?: RegExp[];
  evaluation?: RegExp[];
  treatment?: RegExp[];
  suggestions: { m?: string; e?: string; t?: string };
}

const CONDITION_MEAT: Record<string, ConditionMEAT> = {
  dm2: {
    monitoring: [/\b(?:A1c|HbA1c|glucose|CGM|blood\s*sugar|glucometer|fasting\s*glucose|post[\s-]*prandial)\b/i, /\b(?:BMP|CMP|metabolic\s*panel)\b/i],
    evaluation: [/\b(?:controlled|uncontrolled|goal|target|optimized|glycemic|hyperglycemic|hypoglycemic)\b/i],
    treatment: [/\b(?:metformin|insulin|glipizide|glimepiride|sitagliptin|empagliflozin|liraglutide|semaglutide|ozempic|jardiance|januvia|victoza|farxiga|dapagliflozin|trulicity|dulaglutide|mounjaro|tirzepatide|Wegovy|rybelsus|glargine|detemir|aspart|lispro|lantus|levemir|humalog|novolog|toujeo|tresiba|basaglar|Jardiance|Ozempic|Trulicity|Mounjaro)\b/i],
    suggestions: { m: 'Order HbA1c (if not done in past 3 months)', e: 'Document glycemic control status (controlled vs uncontrolled)', t: 'Document DM medication or diet/lifestyle management plan' },
  },
  dm1: {
    monitoring: [/\b(?:A1c|HbA1c|CGM|glucose|blood\s*sugar)\b/i],
    evaluation: [/\b(?:controlled|uncontrolled|goal|target|glycemic|hypoglycemic)\b/i],
    treatment: [/\b(?:insulin|glargine|detemir|aspart|lispro|lantus|levemir|humalog|novolog|toujeo|tresiba|basaglar|pump|basal|bolus)\b/i],
    suggestions: { m: 'Document A1c and glucose monitoring', e: 'Document glycemic control status', t: 'Document insulin regimen (basal/bolus)' },
  },
  dm2_ckd: {
    monitoring: [/\b(?:A1c|HbA1c|GFR|eGFR|creatinine|urine\s*albumin|UACR|BMP|CMP)\b/i],
    evaluation: [/\b(?:controlled|uncontrolled|stable|worsening|nephropathy|kidney\s*function)\b/i],
    treatment: [/\b(?:metformin|SGLT2|empagliflozin|dapagliflozin|jardiance|farxiga|ACE|ARB|lisinopril|losartan|finerenone|kerendia)\b/i],
    suggestions: { m: 'Check eGFR and urine albumin:creatinine ratio (UACR)', e: 'Document kidney function status and DM control', t: 'Document SGLT2 inhibitor or ACE/ARB for nephroprotection' },
  },
  dm2_neuropathy: {
    monitoring: [/\b(?:monofilament|nerve\s*conduction|EMG|foot\s*exam|sensory\s*exam|vibration)\b/i],
    evaluation: [/\b(?:neuropathic|tingling|numbness|burning|pain|sensation|sensory\s*loss)\b/i],
    treatment: [/\b(?:gabapentin|pregabalin|duloxetine|amitriptyline|capsaicin|lyrica|cymbalta|neurontin)\b/i],
    suggestions: { m: 'Document monofilament foot exam (10-point test)', e: 'Document neuropathy symptoms (tingling, numbness, pain)', t: 'Document neuropathy treatment (gabapentin, duloxetine, etc)' },
  },
  dm2_eye: {
    monitoring: [/\b(?:eye\s*exam|retinal\s*exam|ophthalmology|ophthalm\w+|fundus|OCT)\b/i],
    evaluation: [/\b(?:retinopathy|macular\s*edema|proliferative|non[\s-]*proliferative|vision)\b/i],
    treatment: [/\b(?:anti[\s-]*VEGF|bevacizumab|ranibizumab|laser|photocoagulation|ophthalmology\s*referral)\b/i],
    suggestions: { m: 'Document annual dilated eye exam (ophthalmology)', e: 'Document retinopathy stage and macular status', t: 'Document ophthalmology referral and treatment plan' },
  },
  chf: {
    monitoring: [/\b(?:echo|echocardiogram|BNP|NT[\s-]*proBNP|EKG|weight|daily\s*weight|fluid\s*balance|I&?O)\b/i],
    evaluation: [/\b(?:NYHA|ejection\s*fraction|EF|volume\s*status|edema|dyspnea|orthopnea|PND|compensated|decompensated)\b/i],
    treatment: [/\b(?:Lasix|furosemide|carvedilol|metoprolol|lisinopril|sacubitril|valsartan|entresto|spironolactone|eplerenone|digoxin|diuretic|GDMT|guideline[\s-]*directed)\b/i],
    suggestions: { m: 'Document recent echo/EF or BNP level', e: 'Document NYHA class and volume status (compensated vs decompensated)', t: 'Document guideline-directed medical therapy (GDMT)' },
  },
  chf_systolic: {
    monitoring: [/\b(?:echo|echocardiogram|EF|ejection\s*fraction|BNP|NT[\s-]*proBNP)\b/i],
    evaluation: [/\b(?:EF|ejection\s*fraction|\d+\s*%|compensated|decompensated|NYHA|HFrEF)\b/i],
    treatment: [/\b(?:Lasix|furosemide|carvedilol|metoprolol|lisinopril|sacubitril|entresto|spironolactone|eplerenone|dapagliflozin|empagliflozin)\b/i],
    suggestions: { m: 'Document echo with EF percentage', e: 'Document NYHA functional class and EF', t: 'Document GDMT: ACEi/ARBi/ARNI + beta-blocker + MRA + SGLT2i' },
  },
  chf_diastolic: {
    monitoring: [/\b(?:echo|echocardiogram|BNP|NT[\s-]*proBNP|E\/e'|diastolic\s*function)\b/i],
    evaluation: [/\b(?:preserved\s*EF|diastolic\s*dysfunction|NYHA|HFpEF|compensated)\b/i],
    treatment: [/\b(?:Lasix|furosemide|metoprolol|carvedilol|lisinopril|verapamil|diltiazem|diuretic|spironolactone|empagliflozin)\b/i],
    suggestions: { m: 'Document echo confirming preserved EF and diastolic function grade', e: 'Document NYHA class and symptoms', t: 'Document diuretic, rate control, and comorbidity management' },
  },
  htn: {
    monitoring: [/\b(?:blood\s*pressure|BP|\d{2,3}\/\d{2,3}|home\s*BP|ambulatory\s*BP|ABPM|cuff)\b/i],
    evaluation: [/\b(?:controlled|uncontrolled|target|goal|hypertensive\s*urgency|hypertensive\s*emergency)\b/i],
    treatment: [/\b(?:lisinopril|amlodipine|metoprolol|losartan|hydrochlorothiazide|HCTZ|valsartan|atenolol|carvedilol|clonidine|chlorthalidone|olmesartan|benazepril|ramipril|antihypertensive)\b/i],
    suggestions: { m: 'Document BP reading in note', e: 'Document BP control status (controlled vs uncontrolled)', t: 'Document antihypertensive medication(s)' },
  },
  afib: {
    monitoring: [/\b(?:EKG|ECG|Holter|telemetry|heart\s*rate|HR|INR|anticoagulation|rhythm)\b/i],
    evaluation: [/\b(?:rate[\s-]*controlled|rhythm[\s-]*controlled|CHA2DS2|CHADS|paroxysmal|persistent|permanent|long[\s-]*standing)\b/i],
    treatment: [/\b(?:Eliquis|apixaban|Xarelto|rivaroxaban|warfarin|Coumadin|amiodarone|metoprolol|carvedilol|diltiazem|digoxin|anticoagulant|cardioversion|ablation|flecainide|propafenone)\b/i],
    suggestions: { m: 'Document heart rate and EKG rhythm', e: 'Document CHA2DS2-VASc score and rate/rhythm control status', t: 'Document anticoagulation and rate/rhythm control therapy' },
  },
  cad: {
    monitoring: [/\b(?:stress\s*test|nuclear|angiogram|angiography|lipid\s*panel|LDL|cholesterol|troponin)\b/i],
    evaluation: [/\b(?:stable\s*angina|unstable|angina|asymptomatic|controlled|symptom[\s-]*free)\b/i],
    treatment: [/\b(?:statin|aspirin|clopidogrel|Plavix|ticagrelor|nitrate|nitroglycerin|beta[\s-]?blocker|metoprolol|atenolol|ACE|lisinopril|ranolazine)\b/i],
    suggestions: { m: 'Document lipid panel and cardiac stress test results', e: 'Document angina symptom burden and functional capacity', t: 'Document aspirin, statin, and anti-anginal therapy' },
  },
  acute_mi: {
    monitoring: [/\b(?:troponin|EKG|ECG|echo|cardiac\s*enzymes|BNP|Holter)\b/i],
    evaluation: [/\b(?:STEMI|NSTEMI|ACS|ejection\s*fraction|EF|Killip|post[\s-]*MI)\b/i],
    treatment: [/\b(?:aspirin|clopidogrel|Plavix|ticagrelor|heparin|statin|beta[\s-]?blocker|ACE|lisinopril|stent|PCI|CABG|thrombolytic)\b/i],
    suggestions: { m: 'Document troponin trend and EKG', e: 'Document MI type (STEMI/NSTEMI) and EF', t: 'Document dual antiplatelet, statin, and beta blocker' },
  },
  copd: {
    monitoring: [/\b(?:spirometry|PFT|FEV1|FEV1\/FVC|O2\s*sat|SpO2|pulse\s*ox|ABG|peak\s*flow)\b/i],
    evaluation: [/\b(?:GOLD|stage\s*[IVXLC]+|exacerbation|stable|dyspnea|breathless|wheez|mMRC|CAT\s*score)\b/i],
    treatment: [/\b(?:albuterol|SABA|LABA|LAMA|inhaler|Spiriva|tiotropium|umeclidinium|salmeterol|formoterol|budesonide|fluticasone|Advair|Symbicort|Breo|Trelegy|Striverdi|prednisone|steroid|supplemental\s*O2|oxygen)\b/i],
    suggestions: { m: 'Document spirometry/PFTs or O2 saturation', e: 'Document GOLD stage and exacerbation history (past 12 months)', t: 'Document inhaler regimen (SABA/LABA/LAMA/ICS) and rescue use' },
  },
  copd_exacerbation: {
    monitoring: [/\b(?:O2\s*sat|SpO2|ABG|CBC|CXR|chest\s*x[\s-]?ray|procalcitonin)\b/i],
    evaluation: [/\b(?:exacerbation|acute|worsening|dyspnea|breathless|wheez|severe|mild|moderate)\b/i],
    treatment: [/\b(?:albuterol|ipratropium|Atrovent|nebulizer|prednisone|methylprednisolone|steroid|azithromycin|doxycycline|antibiotic|O2|oxygen|CPAP|BiPAP|Duoneb)\b/i],
    suggestions: { m: 'Document O2 saturation, CXR, and CBC', e: 'Document exacerbation severity and triggers', t: 'Document bronchodilators, systemic steroids, and antibiotics' },
  },
  ckd_unspec: {
    monitoring: [/\b(?:GFR|eGFR|creatinine|BUN|BMP|CMP|urine\s*protein|proteinuria|UACR|albumin\/creatinine)\b/i],
    evaluation: [/\b(?:stage|stable|worsening|progressive|declining|GFR\s+\d|creatinine\s+\d)\b/i],
    treatment: [/\b(?:ACE|ARB|lisinopril|losartan|benazepril|ramipril|SGLT2|empagliflozin|dapagliflozin|bicarbonate|phosphate\s*binder|nephrology|low[\s-]*protein\s*diet)\b/i],
    suggestions: { m: 'Document eGFR value and urine protein:creatinine ratio (UACR)', e: 'Document CKD stage and progression trajectory', t: 'Document nephroprotective therapy (ACE/ARB or SGLT2i)' },
  },
  ckd3: {
    monitoring: [/\b(?:GFR|eGFR|creatinine|BUN|BMP|CMP|UACR|urine\s*albumin)\b/i],
    evaluation: [/\b(?:3a|3b|stage\s*3|stable|worsening|GFR\s+[34][0-9])\b/i],
    treatment: [/\b(?:ACE|ARB|lisinopril|losartan|SGLT2|empagliflozin|diet|protein\s*restriction|nephrology)\b/i],
    suggestions: { m: 'Document eGFR value to substage as 3a (45-59) or 3b (30-44)', e: 'Document kidney function trajectory (stable vs declining)', t: 'Document nephroprotective therapy and dietary modifications' },
  },
  ckd4: {
    monitoring: [/\b(?:GFR|eGFR|creatinine|BUN|BMP|CMP|phosphorus|potassium|bicarbonate|PTH|parathyroid|CBC)\b/i],
    evaluation: [/\b(?:stage\s*4|GFR\s+[12][0-9]|dialysis\s*planning|pre[\s-]*dialysis|uremia)\b/i],
    treatment: [/\b(?:ACE|ARB|lisinopril|losartan|erythropoietin|ESA|phosphate\s*binder|bicarbonate|calcitriol|nephrology|AV\s*fistula)\b/i],
    suggestions: { m: 'Document eGFR, PTH, phosphorus, potassium, and CBC', e: 'Document CKD stage 4 burden and uremic symptoms', t: 'Document nephrology referral and CKD complication management' },
  },
  ckd5: {
    monitoring: [/\b(?:GFR|eGFR|creatinine|BUN|BMP|CMP|dialysis\s*access|AV\s*fistula|vascular\s*access)\b/i],
    evaluation: [/\b(?:stage\s*5|pre[\s-]*dialysis|uremia|uremic|dialysis\s*planning|imminent)\b/i],
    treatment: [/\b(?:dialysis|nephrology|transplant|AV\s*fistula|peritoneal|erythropoietin|ESA|vascular\s*access)\b/i],
    suggestions: { m: 'Document eGFR and vascular access status', e: 'Document CKD stage 5 symptoms and dialysis readiness', t: 'Document dialysis modality planning and nephrology management' },
  },
  esrd_dialysis: {
    monitoring: [/\b(?:dialysis|hemodialysis|peritoneal|Kt\/V|URR|adequacy|iron|ferritin|PTH|phosphorus)\b/i],
    evaluation: [/\b(?:on\s*dialysis|dialysis\s*adequacy|ESRD|end\s*stage|tolerating|access\s*function)\b/i],
    treatment: [/\b(?:hemodialysis|peritoneal\s*dialysis|HD|PD|erythropoietin|ESA|iron\s*sucrose|ferric\s*carboxymaltose|phosphate\s*binder|transplant)\b/i],
    suggestions: { m: 'Document dialysis modality and adequacy (Kt/V or URR)', e: 'Document ESRD management, access function, and complications', t: 'Document dialysis prescription and ancillary medications' },
  },
  aki: {
    monitoring: [/\b(?:creatinine|BUN|BMP|CMP|urine\s*output|Foley|fluid\s*balance|I&?O)\b/i],
    evaluation: [/\b(?:AKIN|RIFLE|stage|oliguric|anuric|resolving|improving|cause)\b/i],
    treatment: [/\b(?:fluid|IV\s*fluid|normal\s*saline|LR|dialysis|nephrology|diuretic|hold|discontinue)\b/i],
    suggestions: { m: 'Document creatinine trend and urine output', e: 'Document AKI severity/stage and etiology', t: 'Document IV fluid management and nephrotoxin avoidance' },
  },
  schizophrenia: {
    monitoring: [/\b(?:metabolic|glucose|lipid|prolactin|EPS|AIMS|tardive\s*dyskinesia|weight)\b/i],
    evaluation: [/\b(?:psychosis|hallucination|delusion|paranoia|GAF|stable|decompensated|relapse|positive\s*symptom)\b/i],
    treatment: [/\b(?:antipsychotic|haloperidol|risperidone|olanzapine|quetiapine|aripiprazole|clozapine|paliperidone|lurasidone|ziprasidone|depot|LAI|long[\s-]*acting)\b/i],
    suggestions: { m: 'Document metabolic monitoring (glucose, lipids, weight)', e: 'Document psychotic symptom burden and stability', t: 'Document antipsychotic medication and adherence' },
  },
  bipolar: {
    monitoring: [/\b(?:mood\s*chart|lithium\s*level|valproate\s*level|thyroid|renal|CBC|liver\s*function)\b/i],
    evaluation: [/\b(?:manic|depressive|hypomanic|euthymic|mixed|episode|stable|cycling|rapid\s*cycle)\b/i],
    treatment: [/\b(?:lithium|valproate|Depakote|lamotrigine|Lamictal|aripiprazole|quetiapine|lurasidone|mood\s*stabilizer|Abilify)\b/i],
    suggestions: { m: 'Document mood diary and medication levels (lithium/valproate)', e: 'Document current mood episode and stability status', t: 'Document mood stabilizer and adjunctive therapy' },
  },
  mdd: {
    monitoring: [/\b(?:PHQ[\s-]*9|PHQ[\s-]*2|depression\s*screen|mood|energy|sleep|appetite|suicidal)\b/i],
    evaluation: [/\b(?:PHQ|remission|response|episode|severity|mild|moderate|severe|recurrent|single)\b/i],
    treatment: [/\b(?:SSRI|SNRI|sertraline|Zoloft|fluoxetine|Prozac|escitalopram|Lexapro|citalopram|venlafaxine|Effexor|duloxetine|Cymbalta|bupropion|Wellbutrin|mirtazapine|antidepressant|therapy|CBT|TMS|ECT)\b/i],
    suggestions: { m: 'Document PHQ-9 score at visit', e: 'Document depression severity and treatment response', t: 'Document antidepressant and psychotherapy plan' },
  },
  anxiety: {
    monitoring: [/\b(?:GAD[\s-]*7|anxiety\s*screen|panic|frequency|severity)\b/i],
    evaluation: [/\b(?:GAD|controlled|uncontrolled|panic\s*attack|generalized|stable|worsening)\b/i],
    treatment: [/\b(?:SSRI|SNRI|buspirone|benzodiazepine|lorazepam|clonazepam|alprazolam|sertraline|escitalopram|venlafaxine|duloxetine|CBT|therapy)\b/i],
    suggestions: { m: 'Document GAD-7 score', e: 'Document anxiety severity and functional impact', t: 'Document pharmacotherapy and psychotherapy plan' },
  },
  ptsd: {
    monitoring: [/\b(?:PCL[\s-]*5|PTSD\s*screen|trauma|symptoms|nightmares|flashback|avoidance)\b/i],
    evaluation: [/\b(?:controlled|stable|worsening|hyperarousal|intrusion|avoidance|PCL)\b/i],
    treatment: [/\b(?:SSRI|sertraline|Zoloft|paroxetine|Paxil|prazosin|venlafaxine|EMDR|CPT|therapy|psychotherapy)\b/i],
    suggestions: { m: 'Document PCL-5 score or PTSD symptom frequency', e: 'Document PTSD symptom domains (intrusion, avoidance, arousal)', t: 'Document SSRI and evidence-based psychotherapy' },
  },
  drug_dependence: {
    monitoring: [/\b(?:urine\s*drug\s*screen|UDS|toxicology|COWS|CIWA|opioid\s*fill|prescription\s*drug\s*monitoring)\b/i],
    evaluation: [/\b(?:sober|recovery|relapse|abstinence|craving|AUDIT|DAST|CAGE|controlled)\b/i],
    treatment: [/\b(?:buprenorphine|Suboxone|Subutex|methadone|naltrexone|Vivitrol|Revia|naloxone|Narcan|MAT|medication[\s-]*assisted|counseling|AA|NA|rehab|detox)\b/i],
    suggestions: { m: 'Document urine drug screen results', e: 'Document substance use status and cravings', t: 'Document medication-assisted treatment and counseling plan' },
  },
  pvd: {
    monitoring: [/\b(?:ABI|ankle[\s-]*brachial|Doppler|arterial\s*study|wound|ulcer|claudication\s*distance)\b/i],
    evaluation: [/\b(?:claudication|rest\s*pain|wound|ulcer|Rutherford|Fontaine|limb\s*threat|gangrene)\b/i],
    treatment: [/\b(?:statin|aspirin|clopidogrel|cilostazol|Pletal|revascularization|angioplasty|stent|bypass|wound\s*care|vascular\s*surgery)\b/i],
    suggestions: { m: 'Document ABI measurement and wound/ulcer status', e: 'Document claudication severity (Rutherford class)', t: 'Document antiplatelet, statin, and revascularization plan' },
  },
  ischemic_stroke: {
    monitoring: [/\b(?:MRI|CT\s*head|imaging|INR|platelet|INR|TPA|carotid|Doppler)\b/i],
    evaluation: [/\b(?:NIHSS|neurological|deficit|aphasia|hemiplegia|hemiparesis|dysphagia|recovery|rehabilitation)\b/i],
    treatment: [/\b(?:aspirin|clopidogrel|Plavix|ticagrelor|anticoagulant|warfarin|Eliquis|Xarelto|statin|tPA|alteplase|rehabilitation|speech\s*therapy|PT|OT)\b/i],
    suggestions: { m: 'Document neuroimaging and carotid studies', e: 'Document NIHSS score and neurological deficit status', t: 'Document antiplatelet/anticoagulant therapy and rehabilitation' },
  },
  hemorrhagic_stroke: {
    monitoring: [/\b(?:CT\s*head|MRI|imaging|neurosurgery|ICP|intracranial\s*pressure)\b/i],
    evaluation: [/\b(?:NIHSS|neurological|GCS|hematoma|midline\s*shift|herniation|recovery)\b/i],
    treatment: [/\b(?:blood\s*pressure\s*control|reversal|surgery|craniotomy|evacuation|rehabilitation|PT|OT|speech\s*therapy)\b/i],
    suggestions: { m: 'Document CT/MRI imaging and hematoma size', e: 'Document neurological status and GCS', t: 'Document BP management and neurosurgical plan' },
  },
  ra: {
    monitoring: [/\b(?:CRP|ESR|RF|anti[\s-]*CCP|CBC|LFT|liver\s*function|joint\s*count|DAS28|CDAI)\b/i],
    evaluation: [/\b(?:disease\s*activity|remission|flare|joint\s*swelling|tenderness|DAS|CDAI|SDAI|low\s*disease|moderate\s*disease)\b/i],
    treatment: [/\b(?:methotrexate|hydroxychloroquine|Plaquenil|leflunomide|Arava|biologic|TNF|etanercept|Enbrel|adalimumab|Humira|abatacept|Orencia|JAK|tofacitinib|Xeljanz|baricitinib|DMARD|prednisone|steroids)\b/i],
    suggestions: { m: 'Document inflammatory markers (CRP/ESR) and joint count', e: 'Document disease activity score (DAS28)', t: 'Document DMARD/biologic therapy and tolerability' },
  },
  morbid_obesity: {
    monitoring: [/\b(?:BMI|weight|waist\s*circumference|blood\s*pressure|glucose|A1c|sleep\s*study|PSG|polysomnography)\b/i],
    evaluation: [/\b(?:BMI\s*[34]\d|obesity\s*class|apnea|sleep\s*disorder|metabolic\s*syndrome|comorbid)\b/i],
    treatment: [/\b(?:diet|exercise|lifestyle|bariatric|surgery|Wegovy|Ozempic|semaglutide|tirzepatide|Mounjaro|phentermine|qsymia|contrave|orlistat|weight\s*loss\s*program)\b/i],
    suggestions: { m: 'Document BMI and obesity-related comorbidity screening', e: 'Document obesity class and complication burden', t: 'Document weight management plan (pharmacotherapy or bariatric referral)' },
  },
  alzheimers: {
    monitoring: [/\b(?:MMSE|MoCA|cognitive\s*test|cognition|brain\s*MRI|PET|neuropsych|clock\s*draw)\b/i],
    evaluation: [/\b(?:cognitive|memory\s*loss|dementia|MMSE|MoCA|stage|mild|moderate|severe|functional\s*decline|ADL)\b/i],
    treatment: [/\b(?:donepezil|Aricept|rivastigmine|Exelon|galantamine|Razadyne|memantine|Namenda|lecanemab|Leqembi|caregiver|safety|capacity)\b/i],
    suggestions: { m: 'Document cognitive assessment (MMSE or MoCA score)', e: 'Document dementia stage and functional status (ADLs)', t: 'Document cholinesterase inhibitor and safety/care plan' },
  },
  parkinsons: {
    monitoring: [/\b(?:UPDRS|Hoehn|Yahr|dopamine|DaTscan|gait|tremor\s*severity)\b/i],
    evaluation: [/\b(?:UPDRS|Hoehn|Yahr|tremor|rigidity|bradykinesia|postural|ON|OFF|wearing[\s-]*off|dyskinesia)\b/i],
    treatment: [/\b(?:levodopa|carbidopa|Sinemet|Rytary|dopamine\s*agonist|pramipexole|ropinirole|rotigotine|Neupro|rasagiline|selegiline|entacapone|DBS|deep\s*brain\s*stimulation)\b/i],
    suggestions: { m: 'Document UPDRS score and motor function assessment', e: 'Document disease stage (Hoehn & Yahr) and motor fluctuations', t: 'Document levodopa/carbidopa regimen and DBS status' },
  },
  ms: {
    monitoring: [/\b(?:MRI\s*brain|MRI\s*spine|lesion|gadolinium|EDSS|relapse\s*rate|infusion)\b/i],
    evaluation: [/\b(?:EDSS|relapse|remission|progressive|stable|attack|exacerbation|disability)\b/i],
    treatment: [/\b(?:interferon|beta\s*interferon|glatiramer|Copaxone|natalizumab|Tysabri|ocrelizumab|Ocrevus|siponimod|fingolimod|Gilenya|DMT|disease[\s-]*modifying|steroids|methylprednisolone)\b/i],
    suggestions: { m: 'Document MRI activity and EDSS score', e: 'Document relapse frequency and disability level', t: 'Document disease-modifying therapy (DMT) and adherence' },
  },
  epilepsy: {
    monitoring: [/\b(?:EEG|drug\s*level|valproate\s*level|phenytoin\s*level|levetiracetam\s*level|seizure\s*diary|frequency)\b/i],
    evaluation: [/\b(?:seizure\s*free|controlled|breakthrough|frequency|type|focal|generalized|absence|tonic)\b/i],
    treatment: [/\b(?:levetiracetam|Keppra|valproate|Depakote|lamotrigine|Lamictal|carbamazepine|Tegretol|oxcarbazepine|phenytoin|Dilantin|gabapentin|topiramate|Topamax|lacosamide|Vimpat|AED|antiepileptic)\b/i],
    suggestions: { m: 'Document seizure frequency and drug levels', e: 'Document seizure type and control status', t: 'Document antiepileptic drug regimen and adherence' },
  },
  esld: {
    monitoring: [/\b(?:LFT|liver\s*function|bilirubin|albumin|INR|AFP|ultrasound|EGD|varices|ammonia)\b/i],
    evaluation: [/\b(?:MELD|Child[\s-]*Pugh|decompensated|ascites|encephalopathy|varices|hepatorenal|jaundice)\b/i],
    treatment: [/\b(?:lactulose|rifaximin|Xifaxan|diuretic|spironolactone|nadolol|propranolol|paracentesis|TIPS|transplant|hepatology)\b/i],
    suggestions: { m: 'Document LFTs, INR, bilirubin, and MELD score', e: 'Document decompensation status and Child-Pugh class', t: 'Document hepatic encephalopathy prevention and portal HTN management' },
  },
  cirrhosis: {
    monitoring: [/\b(?:LFT|liver\s*function|bilirubin|albumin|INR|AFP|ultrasound|EGD|varices)\b/i],
    evaluation: [/\b(?:MELD|Child[\s-]*Pugh|compensated|decompensated|ascites|fibrosis|stage)\b/i],
    treatment: [/\b(?:diuretic|spironolactone|nadolol|propranolol|banding|beta\s*blocker|hepatology|alcohol\s*cessation|antiviral)\b/i],
    suggestions: { m: 'Document LFTs, platelets, and liver imaging (ultrasound)', e: 'Document cirrhosis stage (compensated vs decompensated)', t: 'Document portal hypertension prophylaxis (beta-blocker/banding)' },
  },
  hiv: {
    monitoring: [/\b(?:CD4|viral\s*load|HIV\s*RNA|VL|undetectable|CBC|lipid\s*panel|kidney\s*function)\b/i],
    evaluation: [/\b(?:controlled|undetectable|viremic|CD4\s*count|AIDS|opportunistic|suppressed)\b/i],
    treatment: [/\b(?:ART|antiretroviral|HAART|Biktarvy|Genvoya|Descovy|Triumeq|Atripla|tenofovir|emtricitabine|dolutegravir|cabotegravir|rilpivirine)\b/i],
    suggestions: { m: 'Document CD4 count and HIV viral load', e: 'Document HIV suppression status (suppressed vs viremic)', t: 'Document ART regimen and adherence' },
  },
  malnutrition: {
    monitoring: [/\b(?:albumin|prealbumin|weight|BMI|calorie\s*count|MUST|MNA|nutrition\s*screen)\b/i],
    evaluation: [/\b(?:mild|moderate|severe|wasting|cachexia|weight\s*loss|underweight|BMI\s*1\d|intake)\b/i],
    treatment: [/\b(?:nutrition|dietitian|supplement|Ensure|Boost|TPN|tube\s*feed|calorie\s*goal|protein\s*goal|enteral)\b/i],
    suggestions: { m: 'Document albumin/prealbumin and weight trend', e: 'Document malnutrition severity and etiology', t: 'Document nutrition plan (oral supplements, enteral, or TPN)' },
  },
  ibd: {
    monitoring: [/\b(?:colonoscopy|endoscopy|CRP|ESR|fecal\s*calprotectin|stool|CBC|albumin)\b/i],
    evaluation: [/\b(?:remission|flare|active|HBI|Harvey[\s-]*Bradshaw|Mayo\s*score|controlled|Crohn|colitis)\b/i],
    treatment: [/\b(?:mesalamine|Asacol|Pentasa|azathioprine|6[\s-]*MP|biologics|infliximab|Remicade|adalimumab|Humira|vedolizumab|Entyvio|ustekinumab|Stelara|steroids|prednisone)\b/i],
    suggestions: { m: 'Document fecal calprotectin, CRP, and endoscopy results', e: 'Document disease activity score and remission status', t: 'Document maintenance therapy (5-ASA, immunomodulator, or biologic)' },
  },
  lung_cancer: {
    monitoring: [/\b(?:CT\s*chest|PET\s*scan|imaging|tumor\s*marker|CEA|biopsy|staging)\b/i],
    evaluation: [/\b(?:stage|response|progression|stable\s*disease|partial\s*response|complete\s*response|ECOG|performance\s*status)\b/i],
    treatment: [/\b(?:chemotherapy|immunotherapy|pembrolizumab|Keytruda|nivolumab|Opdivo|EGFR|ALK|osimertinib|Tagrisso|radiation|surgery|lobectomy|oncology)\b/i],
    suggestions: { m: 'Document CT/PET staging and tumor biomarkers', e: 'Document cancer stage, ECOG status, and treatment response', t: 'Document oncology treatment plan and supportive care' },
  },
  metastatic_cancer: {
    monitoring: [/\b(?:CT|PET|MRI|imaging|tumor\s*marker|biopsy|staging|palliative)\b/i],
    evaluation: [/\b(?:stage\s*4|stage\s*IV|metastatic|progression|response|palliative|hospice|ECOG|performance)\b/i],
    treatment: [/\b(?:chemotherapy|immunotherapy|targeted\s*therapy|radiation|palliative|hospice|oncology|best\s*supportive)\b/i],
    suggestions: { m: 'Document imaging and tumor response assessment', e: 'Document metastatic burden, ECOG status, and goals of care', t: 'Document systemic therapy, palliative care, or hospice plan' },
  },
  sickle_cell: {
    monitoring: [/\b(?:CBC|hemoglobin|reticulocyte|ferritin|LDH|bilirubin|transcranial\s*Doppler|TCD)\b/i],
    evaluation: [/\b(?:crisis|vaso[\s-]*occlusive|pain|acute\s*chest|stroke|splenic|sequestration|stable)\b/i],
    treatment: [/\b(?:hydroxyurea|Droxia|Siklos|voxelotor|Oxbryta|crizanlizumab|Adakveo|folic\s*acid|transfusion|exchange\s*transfusion|penicillin|hematology)\b/i],
    suggestions: { m: 'Document CBC with differential, reticulocyte count, and LDH', e: 'Document sickle cell disease status and crisis frequency', t: 'Document hydroxyurea or disease-modifying therapy' },
  },
  hyperlipidemia: {
    monitoring: [/\b(?:lipid\s*panel|cholesterol|LDL|HDL|triglycerides|non[\s-]*HDL)\b/i],
    evaluation: [/\b(?:controlled|uncontrolled|goal|target|LDL\s*[\d<>]+|at\s*goal|ASCVD|10[\s-]*year\s*risk)\b/i],
    treatment: [/\b(?:statin|atorvastatin|Lipitor|rosuvastatin|Crestor|simvastatin|Zocor|pravastatin|pitavastatin|ezetimibe|Zetia|PCSK9|evolocumab|Repatha|alirocumab|Praluent|fenofibrate|niacin|omega[\s-]*3|Vascepa)\b/i],
    suggestions: { m: 'Document fasting lipid panel (LDL goal depends on ASCVD risk)', e: 'Document LDL-C vs target goal and ASCVD risk category', t: 'Document statin therapy and intensity (low/moderate/high)' },
  },
};

// ── Main MEAT detection function ──────────────────────────────────────────────

export function detectMEAT(problem: ClinicalProblem, transcript: string): MEATStatus {
  const specific = CONDITION_MEAT[problem.id];

  // Assessment: always true if condition was mentioned and not negated
  const assessment = !problem.negated;

  // If negated — no MEAT applies
  if (problem.negated) {
    return {
      monitoring: false, evaluation: false, assessment: false, treatment: false,
      isRAFValid: false,
      missingElements: [],
      suggestions: [],
    };
  }

  // Check monitoring — global + condition-specific
  let monitoring = GLOBAL_MONITORING.some((p) => p.test(transcript));
  if (!monitoring && specific?.monitoring) {
    monitoring = specific.monitoring.some((p) => p.test(transcript));
  } else if (specific?.monitoring) {
    monitoring = monitoring || specific.monitoring.some((p) => p.test(transcript));
  }

  // Check evaluation — global + condition-specific
  let evaluation = GLOBAL_EVALUATION.some((p) => p.test(transcript));
  if (!evaluation && specific?.evaluation) {
    evaluation = specific.evaluation.some((p) => p.test(transcript));
  } else if (specific?.evaluation) {
    evaluation = evaluation || specific.evaluation.some((p) => p.test(transcript));
  }

  // Check treatment — global + condition-specific
  let treatment = GLOBAL_TREATMENT.some((p) => p.test(transcript));
  if (!treatment && specific?.treatment) {
    treatment = specific.treatment.some((p) => p.test(transcript));
  } else if (specific?.treatment) {
    treatment = treatment || specific.treatment.some((p) => p.test(transcript));
  }

  // RAF validity: Assessment AND at least one of M/E/T
  const isRAFValid = assessment && (monitoring || evaluation || treatment);

  // Missing elements
  const missingElements: string[] = [];
  if (!monitoring) missingElements.push('Monitoring');
  if (!evaluation) missingElements.push('Evaluation');
  if (!treatment) missingElements.push('Treatment');

  // Condition-specific suggestions for missing elements
  const suggestions: string[] = [];
  if (!monitoring && specific?.suggestions.m) suggestions.push(specific.suggestions.m);
  if (!evaluation && specific?.suggestions.e) suggestions.push(specific.suggestions.e);
  if (!treatment && specific?.suggestions.t) suggestions.push(specific.suggestions.t);

  return { monitoring, evaluation, assessment, treatment, isRAFValid, missingElements, suggestions };
}
