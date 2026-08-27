export type AnalysisViewMode = 'all' | 'pros_cons' | 'comparison' | 'swot' | 'verdict' | 'simulator';

export interface ProConItem {
  id: string;
  text: string;
  detail?: string;
  impact: number; // 1 to 5
  category: 'financial' | 'emotional' | 'strategic' | 'time' | 'risk' | 'growth' | 'other';
  isCustom?: boolean;
}

export interface SwotAnalysis {
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
}

export interface OptionAnalysis {
  id: string;
  optionName: string;
  tagline: string;
  pros: ProConItem[];
  cons: ProConItem[];
  swot: SwotAnalysis;
  score: number; // 0 to 100
  overallSummary: string;
}

export interface DimensionRating {
  score: number; // 1 to 10
  verdict: string;
}

export interface ComparisonDimension {
  id: string;
  dimension: string;
  description: string;
  importanceWeight: number; // 1 to 5
  ratings: Record<string, DimensionRating>;
  winnerOption: string;
}

export interface ConditionalAdvice {
  condition: string;
  chooseOption: string;
  explanation: string;
}

export interface DevilsAdvocateChallenge {
  targetOption: string;
  challenge: string;
  gutCheckQuestion: string;
}

export interface TiebreakerVerdict {
  recommendedOption: string;
  confidenceScore: number; // 0 to 100
  coreRationale: string;
  conditionalAdvice: ConditionalAdvice[];
  tenTenTenRule: {
    tenMinutes: string;
    tenMonths: string;
    tenYears: string;
  };
  devilsAdvocate: DevilsAdvocateChallenge[];
  blindSpots: string[];
  actionSteps: string[];
}

export interface FullDecisionAnalysis {
  id: string;
  timestamp: number;
  title: string;
  context?: string;
  options: OptionAnalysis[];
  comparisonMatrix: ComparisonDimension[];
  verdict: TiebreakerVerdict;
  customNotes?: string;
  userChoice?: string;
  outcomeNotes?: string;
}

export interface DecisionPreset {
  id: string;
  title: string;
  category: string;
  description: string;
  options: string[];
  context: string;
  priorities: string[];
}
