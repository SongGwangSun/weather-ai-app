export type Plan = 'free' | 'paid';

export const PLAN_LIMITS = {
  free: {
    dailyRecommendations: 5,
    maxProfiles: 1,
    label: '무료',
    priceMonthly: null,
    priceAnnual: null,
  },
  paid: {
    dailyRecommendations: Infinity,
    maxProfiles: 10,
    label: 'PRO',
    priceMonthly: 1900,   // ₩1,900/월
    priceAnnual: 14900,   // ₩14,900/년
  },
} as const;

export function isPlanExpired(planExpiresAt: string | null): boolean {
  if (!planExpiresAt) return true;
  return new Date(planExpiresAt) < new Date();
}

export function getEffectivePlan(plan: Plan, planExpiresAt: string | null): Plan {
  if (plan === 'paid' && isPlanExpired(planExpiresAt)) return 'free';
  return plan;
}
