export interface UserProfile {
  uid: string;
  email: string | null;
  username: string;
}

export interface Factor {
  id: string;
  name: string;
  isDefault?: boolean;
  category?: 'drink' | 'activity' | 'routine' | 'other';
  icon?: string;
  isArchived?: boolean;
}

export interface SleepLog {
  id: string;
  date: string; // 'YYYY-MM-DD'
  totalMinutes: number; // e.g. 450 = 7h 30m
  deepMinutes: number; // e.g. 105 = 1h 45m
  remMinutes: number; // e.g. 90 = 1h 30m
  lightMinutes: number; // calculated total - (deep + rem)
  activeFactors: string[]; // factor ids
  timestamp: number;
}

export interface FactorImpact {
  factorId: string;
  factorName: string;
  occurrences: number;
  totalDays: number;
  // Deep sleep impact
  avgDeepMinutesWith: number;
  avgDeepMinutesWithout: number;
  avgDeepPercentWith: number;
  avgDeepPercentWithout: number;
  deepDiffPercent: number; // e.g. -12.5 means 12.5% less deep sleep
  // REM impact
  avgRemMinutesWith: number;
  avgRemMinutesWithout: number;
  avgRemPercentWith: number;
  avgRemPercentWithout: number;
  remDiffPercent: number; // e.g. -20.0
  // Total sleep impact
  avgTotalMinutesWith: number;
  avgTotalMinutesWithout: number;
  totalDiffPercent: number;
  // Primary impact summary
  primaryMetric: 'deep' | 'rem' | 'total' | 'both';
  primaryDiffPercent: number;
  secondaryDiffPercent?: number;
  summaryText: string;
  isNegative: boolean;
  severity: 'red' | 'orange' | 'green'; // red = >=12% drop, orange = 5-11.9% drop, green = positive (>=5%)
}

export interface SynergyImpact {
  factorAId: string;
  factorBId: string;
  factorAName: string;
  factorBName: string;
  occurrences: number;
  avgDeepPercentBoth: number;
  avgRemPercentBoth: number;
  combinedDeepDiffPercent: number;
  combinedRemDiffPercent: number;
  expectedSumPercent: number;
  synergyDeltaPercent: number; // difference beyond simple addition
  metric: 'deep' | 'rem';
  summaryText: string;
  isNegative: boolean;
  severity: 'red' | 'orange' | 'green';
}

export interface SleepBaseline {
  totalLogs: number;
  avgTotalMinutes: number;
  avgDeepMinutes: number;
  avgRemMinutes: number;
  avgLightMinutes: number;
  avgDeepPercent: number;
  avgRemPercent: number;
}

export interface NotificationRule {
  id: string;
  days: number[]; // 0 = Mo … 6 = So
  time: string; // e.g. "08:00"
}

export interface NotificationSettings {
  enabled: boolean;
  morningEnabled: boolean;
  morningRules: NotificationRule[]; // e.g. Mo–Fr 06:00, Sa–So 09:00
  bedtimeEnabled: boolean;
  bedtimeRules: NotificationRule[];
}
