// Within-call comparison math: every signal is relative to the call's own median, never an absolute
// benchmark. Absolute-threshold judgments (flat-high stages, "consistently slow X") belong to the rule layer.
import { STAGES, type Stage, type Call } from '../types/schema'
import { turnLatencyMs } from '../ingest/geometry'

// A turn this far above the call's median latency reads as a genuine outlier, not normal jitter.
export const OUTLIER_RATIO = 1.5

// Below this the half-over-half split is too noisy to call a trend.
const MIN_TURNS_FOR_TREND = 4

// A stage must rise by this much, first half to second, to count as trending upward.
const TREND_GROWTH_RATIO = 1.4

function median(values: number[]): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid]
}

export function stageMedians(call: Call): Record<Stage, number> {
  const medians = {} as Record<Stage, number>
  for (const stage of STAGES) {
    medians[stage] = median(call.turns.map((t) => t.stages[stage].durationMs))
  }
  return medians
}

export function latencyMedian(call: Call): number {
  return median(call.turns.map(turnLatencyMs))
}

export interface TurnComparison {
  index: number
  latencyMs: number
  latencyRatio: number
  stageRatios: Record<Stage, number>
  isOutlier: boolean
}

export function turnComparison(call: Call): TurnComparison[] {
  const medianLatency = latencyMedian(call)
  const medians = stageMedians(call)
  return call.turns.map((turn) => {
    const latencyMs = turnLatencyMs(turn)
    const latencyRatio = medianLatency > 0 ? latencyMs / medianLatency : 1
    const stageRatios = {} as Record<Stage, number>
    for (const stage of STAGES) {
      const stageMedian = medians[stage]
      stageRatios[stage] =
        stageMedian > 0 ? turn.stages[stage].durationMs / stageMedian : 1
    }
    return {
      index: turn.index,
      latencyMs,
      latencyRatio,
      stageRatios,
      isOutlier: latencyRatio > OUTLIER_RATIO,
    }
  })
}

export function outlierTurns(call: Call): TurnComparison[] {
  return turnComparison(call)
    .filter((t) => t.isOutlier)
    .sort((a, b) => b.latencyRatio - a.latencyRatio)
}

export interface StageTrend {
  stage: Stage
  firstHalfMs: number
  secondHalfMs: number
  growthRatio: number
}

// Median of each half (not mean) so one freak spike can't masquerade as a rising trend.
export function trendingStage(call: Call): StageTrend | null {
  if (call.turns.length < MIN_TURNS_FOR_TREND) return null

  const half = Math.floor(call.turns.length / 2)
  const firstTurns = call.turns.slice(0, half)
  const secondTurns = call.turns.slice(call.turns.length - half)

  let strongest: StageTrend | null = null
  for (const stage of STAGES) {
    const firstHalfMs = median(
      firstTurns.map((t) => t.stages[stage].durationMs),
    )
    const secondHalfMs = median(
      secondTurns.map((t) => t.stages[stage].durationMs),
    )
    if (firstHalfMs === 0) continue
    const growthRatio = secondHalfMs / firstHalfMs
    if (growthRatio < TREND_GROWTH_RATIO) continue
    if (!strongest || growthRatio > strongest.growthRatio) {
      strongest = { stage, firstHalfMs, secondHalfMs, growthRatio }
    }
  }
  return strongest
}
