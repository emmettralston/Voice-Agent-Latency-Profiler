// Collapses the ranked findings into the single call-level verdict the report leads with.
import type { Finding, Severity } from './rules'

export type VerdictTone = 'clean' | Severity

export interface Verdict {
  tone: VerdictTone
  headline: string
  detail: string
  otherFindingCount: number
}

export function verdictFor(
  findings: Finding[],
  medianLatencyMs: number,
): Verdict {
  const worst = findings[0]
  if (!worst) {
    return {
      tone: 'clean',
      headline: 'No systemic latency issues found',
      detail: `Every turn clusters near this call's ${Math.round(medianLatencyMs)}ms median, and no stage drifts or spikes stand out.`,
      otherFindingCount: 0,
    }
  }
  return {
    tone: worst.severity,
    headline: worst.title,
    detail: worst.detail,
    otherFindingCount: findings.length - 1,
  }
}
