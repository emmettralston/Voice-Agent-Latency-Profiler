import type { Call, Stage } from '../../types/schema'
import type { StageTrend, TurnComparison } from '../baseline'

export type Severity = 'critical' | 'warn'

export interface Citation {
  source: string
  url?: string
}

// What a finding is measured against, surfaced so a rule of thumb never reads as an outside benchmark.
export type Basis = 'median' | 'budget' | 'trend' | 'heuristic'

export interface Finding {
  ruleId: string
  severity: Severity
  // Sort key, higher is worse: tier weight plus the trigger's magnitude.
  rank: number
  stage?: Stage
  title: string
  detail: string
  fix: string
  evidence: string
  basis: Basis
  citation?: Citation
  turnIndexes?: number[]
}

export interface RuleContext {
  call: Call
  comparisons: TurnComparison[]
  latencyMedian: number
  stageMedians: Record<Stage, number>
  stageTrends: StageTrend[]
  outliers: TurnComparison[]
}

export type Rule = (ctx: RuleContext) => Finding | null

const TIER_WEIGHT: Record<Severity, number> = { critical: 3, warn: 2 }

export function rank(severity: Severity, magnitude: number): number {
  return TIER_WEIGHT[severity] * 1000 + magnitude
}
