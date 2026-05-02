export interface LotteryResult {
  issueNumber: string;
  number: string;
  colour: string;
  premium: string;
}

export interface AnalysisInsight {
  label: string;
  value: string | number;
  type: 'momentum' | 'volume' | 'pattern' | 'oscillation';
  impact: 'low' | 'medium' | 'high' | 'critical';
}

export interface Prediction {
  issueNumber: string;
  number?: number;
  color?: string;
  size?: 'big' | 'small';
  confidence: number;
  reasoning?: string;
  analysis?: AnalysisInsight[];
  timestamp: Date;
}

export interface AccuracyLog {
  issueNumber: string;
  predictedNumber: number | string;
  predictedColor: string;
  predictedSize: string;
  confidence: number;
  actualNumber: string;
  actualColor: string;
  isCorrect: boolean;
  timestamp: Date;
}

export interface ApiConfig {
  token: string;
  signature: string;
  timestamp: string;
  random: string;
}
