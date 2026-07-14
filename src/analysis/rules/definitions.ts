// The deterministic pattern -> advice rules. Add or edit a rule here without touching the views.
import { OUTLIER_RATIO } from '../baseline'
import { STAGES, type Call, type Stage } from '../../types/schema'
import { THRESHOLDS } from './thresholds'
import { rank, type Rule } from './types'

function tokenGrowth(call: Call): { first: number; last: number } | null {
  const first = call.turns[0]?.promptTokens
  const last = call.turns[call.turns.length - 1]?.promptTokens
  if (first === undefined || last === undefined || last <= first) return null
  return { first, last }
}

const contextBloat: Rule = (ctx) => {
  const llm = ctx.stageTrends.find((t) => t.stage === 'llm')
  if (!llm) return null
  const tokens = tokenGrowth(ctx.call)
  return {
    ruleId: 'llm-context-bloat',
    severity: 'critical',
    rank: rank('critical', llm.growthRatio),
    stage: 'llm',
    title: 'LLM time-to-first-token is climbing across the call',
    detail: `First-token latency rose ${llm.growthRatio.toFixed(1)}× from the first half of the call to the second — the signature of the full history being resent every turn.`,
    fix: 'Summarize or truncate older turns, or use a rolling context window, so the prompt stops growing.',
    evidence:
      `LLM first-token ${Math.round(llm.firstHalfMs)}ms → ${Math.round(llm.secondHalfMs)}ms` +
      (tokens ? ` as prompt grew ${tokens.first}→${tokens.last} tokens` : ''),
    basis: 'trend',
  }
}

const RISING_COPY: Record<
  Exclude<Stage, 'llm'>,
  { title: string; fix: string }
> = {
  vad: {
    title: 'Endpointing delay is creeping up across the call',
    fix: 'Tighten the end-of-speech silence threshold or use a faster endpointer.',
  },
  stt: {
    title: 'STT latency is climbing across the call',
    fix: 'Check for a degrading or non-streaming transcription path.',
  },
  tts: {
    title: 'TTS latency is climbing across the call',
    fix: 'Check for TTS backpressure or a growing synthesis payload.',
  },
}

const risingStage: Rule = (ctx) => {
  const trend = ctx.stageTrends.find((t) => t.stage !== 'llm')
  if (!trend) return null
  const stage = trend.stage as Exclude<Stage, 'llm'>
  return {
    ruleId: 'rising-stage',
    severity: 'warn',
    rank: rank('warn', trend.growthRatio),
    stage: trend.stage,
    title: RISING_COPY[stage].title,
    detail: `${trend.stage.toUpperCase()} median rose ${trend.growthRatio.toFixed(1)}× from the first half of the call to the second.`,
    fix: RISING_COPY[stage].fix,
    evidence: `${trend.stage.toUpperCase()} median ${Math.round(trend.firstHalfMs)}ms → ${Math.round(trend.secondHalfMs)}ms`,
    basis: 'trend',
  }
}

const overBudget: Rule = (ctx) => {
  if (ctx.latencyMedian <= ctx.call.budgetMs) return null
  return {
    ruleId: 'call-over-budget',
    severity: 'critical',
    rank: rank('critical', ctx.latencyMedian / ctx.call.budgetMs),
    title: 'The median turn misses your response budget',
    detail: `Half your turns finish slower than your ${ctx.call.budgetMs}ms budget (median ${Math.round(ctx.latencyMedian)}ms).`,
    fix: 'Cut time from the dominant stage below — the whole call is running late, not one turn.',
    evidence: `median ${Math.round(ctx.latencyMedian)}ms vs ${ctx.call.budgetMs}ms budget`,
    basis: 'budget',
  }
}

const stageDominates: Rule = (ctx) => {
  let worst: { stage: Stage; share: number; ms: number } | null = null
  for (const stage of STAGES) {
    const share = ctx.stageMedians[stage] / ctx.call.budgetMs
    if (share < THRESHOLDS.stageBudgetShare) continue
    if (!worst || share > worst.share)
      worst = { stage, share, ms: ctx.stageMedians[stage] }
  }
  if (!worst) return null
  const pct = Math.round(worst.share * 100)
  return {
    ruleId: 'stage-dominates-budget',
    severity: 'warn',
    rank: rank('warn', worst.share),
    stage: worst.stage,
    title: `${worst.stage.toUpperCase()} is the largest slice of your budget`,
    detail: `${worst.stage.toUpperCase()} alone takes ${pct}% of your ${ctx.call.budgetMs}ms budget (median ${Math.round(worst.ms)}ms).`,
    fix: 'Start optimization here — it has the most headroom to give back.',
    evidence: `${worst.stage.toUpperCase()} median ${Math.round(worst.ms)}ms = ${pct}% of budget`,
    basis: 'budget',
  }
}

const latencyOutliers: Rule = (ctx) => {
  if (ctx.outliers.length === 0) return null
  const worst = ctx.outliers[0]
  const plural = ctx.outliers.length > 1
  return {
    ruleId: 'latency-outliers',
    severity: 'warn',
    rank: rank('warn', worst.latencyRatio),
    title: `${ctx.outliers.length} turn${plural ? 's' : ''} spiked well above your typical latency`,
    detail: `${ctx.outliers.length} turn${plural ? 's' : ''} ran over ${OUTLIER_RATIO}× your median — the worst was turn ${worst.index} at ${worst.latencyRatio.toFixed(1)}×.`,
    fix: 'Inspect those turns for one-off stalls: cold caches, retries, or unusually long input.',
    evidence: `turn ${worst.index} at ${worst.latencyRatio.toFixed(1)}× median`,
    basis: 'median',
    turnIndexes: ctx.outliers.map((o) => o.index),
  }
}

const ttsNotStreaming: Rule = (ctx) => {
  if (!ctx.call.turns.every((t) => !t.ttsStreaming)) return null
  const ms = ctx.stageMedians.tts
  if (ms <= THRESHOLDS.ttsFirstAudioMs) return null
  return {
    ruleId: 'tts-not-streaming',
    severity: 'critical',
    rank: rank('critical', ms / THRESHOLDS.ttsFirstAudioMs),
    stage: 'tts',
    title: 'TTS is not streaming its first audio',
    detail: `First-audio averages ${Math.round(ms)}ms with streaming disabled — the synth is finishing whole utterances before playback starts.`,
    fix: 'Enable streaming (chunked) TTS so audio starts on the first synthesized chunk.',
    evidence: `TTS first-audio median ${Math.round(ms)}ms, streaming off (rule of thumb: stream past ${THRESHOLDS.ttsFirstAudioMs}ms)`,
    basis: 'heuristic',
  }
}

const sttNotStreaming: Rule = (ctx) => {
  if (!ctx.call.turns.every((t) => !t.sttStreaming)) return null
  const ms = ctx.stageMedians.stt
  if (ms <= THRESHOLDS.sttTranscribeMs) return null
  return {
    ruleId: 'stt-not-streaming',
    severity: 'critical',
    rank: rank('critical', ms / THRESHOLDS.sttTranscribeMs),
    stage: 'stt',
    title: 'STT is not streaming transcripts',
    detail: `Transcription averages ${Math.round(ms)}ms with streaming disabled — the recognizer waits for the full utterance before returning.`,
    fix: 'Enable streaming STT so transcription overlaps the user speaking.',
    evidence: `STT median ${Math.round(ms)}ms, streaming off (rule of thumb: stream past ${THRESHOLDS.sttTranscribeMs}ms)`,
    basis: 'heuristic',
  }
}

const vadEndpointingHigh: Rule = (ctx) => {
  const ms = ctx.stageMedians.vad
  if (ms <= THRESHOLDS.vadEndpointingMs) return null
  return {
    ruleId: 'vad-endpointing-high',
    severity: 'warn',
    rank: rank('warn', ms / THRESHOLDS.vadEndpointingMs),
    stage: 'vad',
    title: 'Endpointing adds noticeable delay',
    detail: `VAD waits a median ${Math.round(ms)}ms after speech before handing off — the user hears that as lag.`,
    fix: 'Lower the end-of-speech silence threshold or use a faster endpointer.',
    evidence: `VAD median ${Math.round(ms)}ms (rule of thumb: tune past ${THRESHOLDS.vadEndpointingMs}ms)`,
    basis: 'heuristic',
  }
}

export const ALL_RULES: Rule[] = [
  contextBloat,
  ttsNotStreaming,
  sttNotStreaming,
  overBudget,
  risingStage,
  stageDominates,
  vadEndpointingHigh,
  latencyOutliers,
]
