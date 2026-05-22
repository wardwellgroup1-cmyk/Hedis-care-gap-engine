import { AnalysisResult, GapResult, GapStatus, Confidence, DomainStats, Domain } from '../types';
import { ELIGIBILITY_RULES } from './eligibility';
import { matchGreenPattern, extractDemographics } from './patterns';

export function analyzeTranscript(transcript: string): AnalysisResult {
  const demographics = extractDemographics(transcript);
  const { age, gender } = demographics;

  const gaps: GapResult[] = ELIGIBILITY_RULES.map((rule) => {
    // Eligibility check
    const ageOk = age !== null && age >= rule.ageMin && age <= rule.ageMax;
    const genderOk =
      rule.gender === 'BOTH' ||
      rule.gender === gender ||
      (rule.gender === 'FEMALE' && gender === 'FEMALE') ||
      (rule.gender === 'MALE' && gender === 'MALE');

    const eligible = ageOk && genderOk;

    if (!eligible) {
      return {
        id: rule.id,
        name: rule.name,
        domain: rule.domain,
        status: 'NA' as GapStatus,
        confidence: 'HIGH' as Confidence,
        eligible: false,
      };
    }

    // Pattern match
    const match = matchGreenPattern(rule.id, transcript);

    if (match.matched) {
      return {
        id: rule.id,
        name: rule.name,
        domain: rule.domain,
        status: 'GREEN' as GapStatus,
        confidence: match.confidence,
        evidence: match.evidence,
        eligible: true,
      };
    }

    return {
      id: rule.id,
      name: rule.name,
      domain: rule.domain,
      status: 'RED' as GapStatus,
      confidence: 'HIGH' as Confidence,
      nudge: rule.nudge,
      eligible: true,
    };
  });

  const eligible = gaps.filter((g) => g.eligible);
  const closed = eligible.filter((g) => g.status === 'GREEN').length;
  const missed = eligible.filter((g) => g.status === 'RED').length;
  const total = eligible.length;
  const rate = total > 0 ? Math.round((closed / total) * 100) : 0;

  return {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    transcript,
    demographics: { age, gender, confidence: demographics.confidence },
    gaps,
    metrics: { closed, missed, total, rate },
  };
}

const DOMAIN_LABELS: Record<Domain, string> = {
  cancer: 'Cancer Screening',
  vaccines: 'Vaccines',
  cardiovascular: 'CV Health',
  diabetes: 'Diabetes',
  other: 'Preventive',
};

export function computeDomainStats(visits: AnalysisResult[]): DomainStats[] {
  const domains: Domain[] = ['cancer', 'vaccines', 'cardiovascular', 'diabetes', 'other'];
  return domains.map((domain) => {
    let closed = 0;
    let total = 0;
    visits.forEach((v) => {
      v.gaps.forEach((g) => {
        if (g.domain === domain && g.eligible) {
          total++;
          if (g.status === 'GREEN') closed++;
        }
      });
    });
    return {
      domain,
      label: DOMAIN_LABELS[domain],
      closed,
      total,
      rate: total > 0 ? Math.round((closed / total) * 100) : 0,
    };
  });
}
