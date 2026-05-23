// ── Shared ────────────────────────────────────────────────────────────────────
export type Gender = 'MALE' | 'FEMALE' | 'BOTH' | 'UNKNOWN';
export type Confidence = 'HIGH' | 'MEDIUM' | 'LOW';
export type AppMode = 'mini' | 'full';
export type RecordingState = 'idle' | 'recording' | 'paused' | 'stopped';
export type DashTab = 'coding' | 'note' | 'hedis';

// ── Demographics ──────────────────────────────────────────────────────────────
export interface Demographics {
  age: number | null;
  gender: Gender;
  confidence: Confidence;
}

// ── ICD-10 / HCC / RAF ────────────────────────────────────────────────────────
export interface ICD10Suggestion {
  code: string;
  description: string;
  confidence: Confidence;
}

export interface HCCAssignment {
  number: number;
  description: string;
  raf: number;                // CMS-HCC v28 2024, community non-dual aged
  suppressedByHierarchy: boolean;
}

export interface ClinicalProblem {
  id: string;
  rawText: string;            // text as extracted from transcript
  label: string;              // normalized display label
  negated: boolean;
  uncertain: boolean;
  attributes: {
    laterality?: 'left' | 'right' | 'bilateral';
    acuity?: 'acute' | 'chronic';
    severity?: 'mild' | 'moderate' | 'severe';
  };
  suggestedCodes: ICD10Suggestion[];
  selectedCode: string;       // code the provider accepted (default = top suggestion)
  selectedDescription: string;
  hcc?: HCCAssignment;
}

export interface RAFResult {
  demographicRAF: number;
  conditionRAF: number;
  interactionRAF: number;
  totalRAF: number;
  activeHCCs: HCCAssignment[];
  interactionsApplied: string[];
}

export interface CodingResult {
  id: string;
  timestamp: string;
  transcript: string;
  demographics: Demographics;
  problems: ClinicalProblem[];
  raf: RAFResult;
}

// ── HEDIS (secondary) ─────────────────────────────────────────────────────────
export type GapStatus = 'GREEN' | 'RED' | 'NA';
export type Domain = 'cancer' | 'vaccines' | 'cardiovascular' | 'diabetes' | 'other';

export interface EligibilityRule {
  id: string;
  name: string;
  gender: Gender;
  ageMin: number;
  ageMax: number;
  domain: Domain;
  nudge: string;
}

export interface GapResult {
  id: string;
  name: string;
  domain: Domain;
  status: GapStatus;
  confidence: Confidence;
  evidence?: string;
  nudge?: string;
  eligible: boolean;
}

export interface HEDISResult {
  gaps: GapResult[];
  metrics: { closed: number; missed: number; total: number; rate: number };
}

export interface DomainStats {
  domain: Domain;
  label: string;
  closed: number;
  total: number;
  rate: number;
}

// ── AnalysisResult (HEDIS shape — kept for backward compat) ──────────────────
export interface AnalysisResult {
  id: string;
  timestamp: string;
  transcript: string;
  demographics: Demographics;
  gaps: GapResult[];
  metrics: { closed: number; missed: number; total: number; rate: number };
}

// ── Visit ─────────────────────────────────────────────────────────────────────
export interface VisitResult {
  id: string;
  timestamp: string;
  transcript: string;
  demographics: Demographics;
  coding: CodingResult;
  hedis: HEDISResult;
}
