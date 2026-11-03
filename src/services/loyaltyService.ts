export interface Wallet {
  id: string;
  customer: string;
  points: number;
  tier: "Silver" | "Gold" | "Platinum";
}

export function calculatePointsEarned(spendAmount: number, multiplier: number): number {
  if (spendAmount <= 0) return 0;
  return Math.floor(spendAmount * multiplier);
}

export function determineTier(spendAmount: number): "Silver" | "Gold" | "Platinum" {
  if (spendAmount >= 75000) return "Platinum";
  if (spendAmount >= 25000) return "Gold";
  return "Silver";
}
