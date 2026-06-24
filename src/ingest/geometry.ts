import { STAGES, type Call, type Turn } from '../types/schema'

export type WarningKind =
  | 'stage-out-of-order'
  | 'stage-gap'
  | 'stage-overlap'
  | 'over-budget'

export interface CallWarning {
  turnIndex: number
  kind: WarningKind
  message: string
}

// Perceived response latency: when the first audio chunk reaches the user.
export function turnLatencyMs(turn: Turn): number {
  return turn.stages.tts.startMs + turn.stages.tts.durationMs
}

// Warn rather than reject: real logs carry clock skew and streaming overlap.
export function checkGeometry(call: Call): CallWarning[] {
  const warnings: CallWarning[] = []

  for (const turn of call.turns) {
    for (let i = 1; i < STAGES.length; i++) {
      const prevStage = STAGES[i - 1]
      const currStage = STAGES[i]
      const prev = turn.stages[prevStage]
      const curr = turn.stages[currStage]
      const prevEnd = prev.startMs + prev.durationMs

      if (curr.startMs < prev.startMs) {
        warnings.push({
          turnIndex: turn.index,
          kind: 'stage-out-of-order',
          message: `${currStage} starts before ${prevStage}`,
        })
      } else if (curr.startMs > prevEnd) {
        warnings.push({
          turnIndex: turn.index,
          kind: 'stage-gap',
          message: `${curr.startMs - prevEnd}ms unattributed gap before ${currStage}`,
        })
      } else if (curr.startMs < prevEnd) {
        warnings.push({
          turnIndex: turn.index,
          kind: 'stage-overlap',
          message: `${currStage} overlaps ${prevStage} (likely streaming)`,
        })
      }
    }

    const latency = turnLatencyMs(turn)
    if (latency > call.budgetMs) {
      warnings.push({
        turnIndex: turn.index,
        kind: 'over-budget',
        message: `${latency}ms exceeds ${call.budgetMs}ms budget`,
      })
    }
  }

  return warnings
}
