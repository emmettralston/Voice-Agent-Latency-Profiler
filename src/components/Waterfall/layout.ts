import { STAGES, type Stage, type Turn } from '../../types/schema'
import { turnLatencyMs } from '../../ingest/geometry'
import type { ReferencePoint } from '../../types/reference'

// Headroom so the budget line and playhead never sit flush against the edge.
const DOMAIN_HEADROOM = 1.05
const NICE_STEPS_MS = [50, 100, 200, 250, 500, 1000, 2000, 5000]

export interface BarLayout {
  stage: Stage
  x: number
  width: number
  startMs: number
  endMs: number
  durationMs: number
  overBudget: boolean
  clipX: number | null
  referenceX: number | null
  referenceMs: number | null
}

export interface Tick {
  ms: number
  x: number
}

export interface WaterfallLayout {
  width: number
  domainMaxMs: number
  bars: BarLayout[]
  ticks: Tick[]
  budgetX: number
  playheadX: number
  latencyMs: number
  overBudget: boolean
}

export function scaleLinear(
  domainMaxMs: number,
  width: number,
): (ms: number) => number {
  return (ms) => (domainMaxMs <= 0 ? 0 : (ms / domainMaxMs) * width)
}

export function buildTicks(domainMaxMs: number, targetCount = 6): number[] {
  const rough = domainMaxMs / targetCount
  const step =
    NICE_STEPS_MS.find((s) => s >= rough) ??
    NICE_STEPS_MS[NICE_STEPS_MS.length - 1]
  const ticks: number[] = []
  for (let ms = 0; ms <= domainMaxMs; ms += step) ticks.push(ms)
  return ticks
}

export function layoutTurn(
  turn: Turn,
  budgetMs: number,
  width: number,
  references: ReferencePoint[] = [],
): WaterfallLayout {
  const latencyMs = turnLatencyMs(turn)
  const domainMaxMs = Math.max(latencyMs, budgetMs) * DOMAIN_HEADROOM
  const scale = scaleLinear(domainMaxMs, width)
  const budgetX = scale(budgetMs)

  const bars: BarLayout[] = STAGES.map((stage) => {
    const { startMs, durationMs } = turn.stages[stage]
    const endMs = startMs + durationMs
    const x = scale(startMs)
    const overBudget = endMs > budgetMs
    const reference = references.find(
      (r) =>
        r.stage === stage && (r.model === undefined || r.model === turn.model),
    )
    return {
      stage,
      x,
      width: scale(endMs) - x,
      startMs,
      endMs,
      durationMs,
      overBudget,
      // Where the budget line crosses a bar that straddles it, for the clip overlay.
      clipX: overBudget && startMs < budgetMs ? budgetX : null,
      referenceX: reference ? scale(reference.p50Ms) : null,
      referenceMs: reference ? reference.p50Ms : null,
    }
  })

  return {
    width,
    domainMaxMs,
    bars,
    ticks: buildTicks(domainMaxMs).map((ms) => ({ ms, x: scale(ms) })),
    budgetX,
    playheadX: scale(latencyMs),
    latencyMs,
    overBudget: latencyMs > budgetMs,
  }
}
