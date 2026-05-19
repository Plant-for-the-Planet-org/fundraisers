export type HighlightImpactUnit = 'funding' | 'trees' | 'restoredM2';

export interface AlltimeStats {
  stats: {
    donationCount: number;
    goal: { amount: number; currency: string };
    daysLeft: number;
    raised: { total: number; currency: string };
    impact: {
      trees: number;
      conservedM2: number;
      restoredM2: number;
      funding: number;
    };
    lastUpdated: string;
  };
  settings: {
    enabled: boolean;
    show_goal: boolean;
    show_days_left: boolean;
    show_impact: boolean;
    highlight_impact: HighlightImpactUnit;
  };
}
