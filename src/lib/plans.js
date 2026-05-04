// ─── Plan constants shared across the app ────────────────────────────────────

export const FREE_COLORS = [
  '#ef4444', // Red
  '#f97316', // Orange
  '#eab308', // Yellow
  '#22c55e', // Green
  '#3b82f6', // Blue
  '#a855f7', // Purple
  '#e5e7eb', // White
  '#1f2937', // Black
]

export const FREE_DOMAIN_LIMIT = 3
export const FREE_EVENT_LIMIT  = 10

/** Returns true for pro and admin users */
export function isPlanPro(plan) {
  return plan === 'pro' || plan === 'admin'
}
