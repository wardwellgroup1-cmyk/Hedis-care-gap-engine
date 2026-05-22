export type Gender = 'MALE' | 'FEMALE' | 'BOTH' | 'UNKNOWN';
export type GapStatus = 'GREEN' | 'RED' | 'NA';
export type Confidence = 'HIGH' | 'MEDIUM' | 'LOW';
export type Domain = 'cancer' | 'vaccines' | 'cardiovascular' | 'diabetes' | 'other';
export type RecordingState = 'idle' | 'recording' | 'paused' | 'stopped';
export type AppMode = 'mini' | 'full';

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

export interface Demographics {
  age: number | null;
  gender: Gender;
  confidence: Confidence;
}

export interface AnalysisResult {
  id: string;
  timestamp: string;
  transcript: string;
  demographics: Demographics;
  gaps: GapResult[];
  metrics: {
    closed: number;
    missed: number;
    total: number;
    rate: number;
  };
}

export interface DomainStats {
  domain: Domain;
  label: string;
  closed: number;
  total: number;
  rate: number;
}
