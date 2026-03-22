export type PricingPlan = {
  name: string
  commission: number
  tax: number
}

export const PLANS = {
  LOCAL: { name: 'Venda Local / Própria', commission: 0, tax: 2.5 }, // Cartão de crédito padrão
  IFOOD_BASIC: { name: 'iFood Básico', commission: 12, tax: 3.2 },
  IFOOD_DELIVERY: { name: 'iFood Entrega', commission: 23, tax: 0 },
}

export function calculatePrice(
  cost: number,
  fixedFees: number,
  marginPct: number,
  plan: PricingPlan,
  discountPct: number = 0,
): number {
  const totalDeductions = marginPct + plan.commission + plan.tax + discountPct
  const divisor = 1 - totalDeductions / 100

  // Prevent infinite or negative prices if deductions > 100%
  if (divisor <= 0) return 0

  return (cost + fixedFees) / divisor
}

export function roundToPsychological(price: number): number {
  if (price <= 0) return 0
  const intPart = Math.floor(price)
  const decPart = price - intPart

  if (decPart < 0.3) return intPart + 0.5
  if (decPart < 0.7) return intPart + 0.9
  return intPart + 0.99
}

export function calculateProfit(
  price: number,
  cost: number,
  fixedFees: number,
  plan: PricingPlan,
  discountPct: number = 0,
) {
  const deductions = (plan.commission + plan.tax + discountPct) / 100
  const netRevenue = price * (1 - deductions)
  return netRevenue - cost - fixedFees
}
