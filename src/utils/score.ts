export type ScoreSeverity = 'success' | 'warn' | 'danger' | 'secondary'

export function getScoreSeverity(value: number | null): ScoreSeverity {
  if (value == null) return 'secondary'
  if (value >= 4) return 'success'
  if (value >= 3) return 'warn'
  return 'danger'
}

export function getScoreColor(value: number | null): string {
  if (value == null) return 'var(--p-text-muted-color)'
  if (value >= 4) return '#22c55e'
  if (value >= 3) return '#f97316'
  return '#ef4444'
}
