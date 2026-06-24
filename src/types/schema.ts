import { z } from 'zod'

// Stage order shared by the parser, geometry pass, and waterfall.
export const STAGES = ['vad', 'stt', 'llm', 'tts'] as const

export const StageSchema = z.enum(STAGES)
export type Stage = z.infer<typeof StageSchema>

export const StageTimingSchema = z.object({
  startMs: z.number().nonnegative(),
  durationMs: z.number().nonnegative(),
})
export type StageTiming = z.infer<typeof StageTimingSchema>

const TurnStagesSchema = z.object({
  vad: StageTimingSchema,
  stt: StageTimingSchema,
  llm: StageTimingSchema,
  tts: StageTimingSchema,
})

export const TurnSchema = z.object({
  type: z.literal('turn'),
  index: z.number().int().nonnegative(),
  userText: z.string(),
  // Optional: real logs may omit it, and the context-bloat rule just won't fire then.
  promptTokens: z.number().int().nonnegative().optional(),
  // Default false so the "enable streaming" rule still has something to flag.
  sttStreaming: z.boolean().default(false),
  ttsStreaming: z.boolean().default(false),
  // Per-turn override of the call defaults, for mid-call model swaps.
  model: z.string().optional(),
  provider: z.string().optional(),
  stages: TurnStagesSchema,
})
export type Turn = z.infer<typeof TurnSchema>

export const CallHeaderSchema = z.object({
  type: z.literal('call'),
  schemaVersion: z.literal(1),
  id: z.string(),
  model: z.string(),
  provider: z.string(),
  budgetMs: z.number().positive().default(1500),
})
export type CallHeader = z.infer<typeof CallHeaderSchema>

export type Call = Omit<CallHeader, 'type'> & { turns: Turn[] }
