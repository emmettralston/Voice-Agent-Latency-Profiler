import { describe, expect, it } from 'vitest'
import { checkGeometry, turnLatencyMs } from './geometry'
import type { Call, Turn } from '../types/schema'

function turn(overrides: Partial<Turn['stages']> = {}, index = 0): Turn {
  return {
    type: 'turn',
    index,
    userText: '',
    sttStreaming: true,
    ttsStreaming: true,
    stages: {
      vad: { startMs: 0, durationMs: 100 },
      stt: { startMs: 100, durationMs: 100 },
      llm: { startMs: 200, durationMs: 100 },
      tts: { startMs: 300, durationMs: 100 },
      ...overrides,
    },
  }
}

function call(turns: Turn[], budgetMs = 1500): Call {
  return {
    schemaVersion: 1,
    id: 'test',
    model: 'm',
    provider: 'p',
    budgetMs,
    turns,
  }
}

describe('turnLatencyMs', () => {
  it('measures to the end of the first audio chunk', () => {
    expect(turnLatencyMs(turn())).toBe(400)
  })
})

describe('checkGeometry', () => {
  it('is quiet for a clean, in-budget turn', () => {
    expect(checkGeometry(call([turn()]))).toEqual([])
  })

  it('flags a stage that starts before the previous one', () => {
    const warnings = checkGeometry(
      call([turn({ llm: { startMs: 50, durationMs: 100 } })]),
    )
    expect(warnings).toContainEqual(
      expect.objectContaining({ kind: 'stage-out-of-order', turnIndex: 0 }),
    )
  })

  it('flags an unattributed gap between stages', () => {
    const warnings = checkGeometry(
      call([turn({ tts: { startMs: 360, durationMs: 100 } })]),
    )
    expect(warnings).toContainEqual(
      expect.objectContaining({ kind: 'stage-gap' }),
    )
  })

  it('flags streaming overlap between stages', () => {
    const warnings = checkGeometry(
      call([turn({ tts: { startMs: 250, durationMs: 100 } })]),
    )
    expect(warnings).toContainEqual(
      expect.objectContaining({ kind: 'stage-overlap' }),
    )
  })

  it('flags a turn over the response budget', () => {
    const warnings = checkGeometry(call([turn()], 300))
    expect(warnings).toContainEqual(
      expect.objectContaining({ kind: 'over-budget' }),
    )
  })
})
