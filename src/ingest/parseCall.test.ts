import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { parseCall } from './parseCall'
import { turnLatencyMs } from './geometry'

function loadSample(file: string) {
  const url = new URL(`../../public/samples/${file}`, import.meta.url)
  return parseCall(readFileSync(url, 'utf8'))
}

describe('healthy-call sample', () => {
  const { call, warnings } = loadSample('healthy-call.jsonl')

  it('validates and parses every turn', () => {
    expect(call.turns).toHaveLength(9)
  })

  it('keeps every turn under the response budget', () => {
    for (const turn of call.turns) {
      expect(turnLatencyMs(turn)).toBeLessThan(call.budgetMs)
    }
  })

  it('raises no warnings', () => {
    expect(warnings).toEqual([])
  })
})

describe('context-bloat sample', () => {
  const { call } = loadSample('context-bloat.jsonl')

  it('has monotonically rising TTFT', () => {
    const ttft = call.turns.map((t) => t.stages.llm.durationMs)
    for (let i = 1; i < ttft.length; i++) {
      expect(ttft[i]).toBeGreaterThan(ttft[i - 1])
    }
  })

  it('has monotonically rising prompt token counts', () => {
    const tokens = call.turns.map((t) => t.promptTokens ?? 0)
    for (let i = 1; i < tokens.length; i++) {
      expect(tokens[i]).toBeGreaterThan(tokens[i - 1])
    }
  })
})

describe('tts-not-streaming sample', () => {
  const { call, warnings } = loadSample('tts-not-streaming.jsonl')

  it('has non-streaming, consistently slow TTS on every turn', () => {
    for (const turn of call.turns) {
      expect(turn.ttsStreaming).toBe(false)
      expect(turn.stages.tts.durationMs).toBeGreaterThan(300)
    }
  })

  it('plants a slow-STT outlier turn', () => {
    const slowStt = call.turns.filter((t) => t.stages.stt.durationMs > 400)
    expect(slowStt).toHaveLength(1)
  })

  it('has creeping endpointing waits across the call', () => {
    const first = call.turns[0].stages.vad.durationMs
    const last = call.turns[call.turns.length - 1].stages.vad.durationMs
    expect(last).toBeGreaterThan(first)
  })

  it('surfaces gap and over-budget warnings', () => {
    expect(warnings.some((w) => w.kind === 'stage-gap')).toBe(true)
    expect(warnings.some((w) => w.kind === 'over-budget')).toBe(true)
  })
})

describe('parse errors', () => {
  it('rejects an empty log', () => {
    expect(() => parseCall('')).toThrow(/empty/i)
  })

  it('rejects a turn missing required timing', () => {
    const jsonl = [
      '{"type":"call","schemaVersion":1,"id":"x","model":"m","provider":"p","budgetMs":1500}',
      '{"type":"turn","index":0,"userText":"hi","stages":{"vad":{"startMs":0,"durationMs":100}}}',
    ].join('\n')
    expect(() => parseCall(jsonl)).toThrow(/Line 2/)
  })

  it('applies defaults for absent streaming flags', () => {
    const jsonl = [
      '{"type":"call","schemaVersion":1,"id":"x","model":"m","provider":"p","budgetMs":1500}',
      '{"type":"turn","index":0,"userText":"hi","stages":{"vad":{"startMs":0,"durationMs":100},"stt":{"startMs":100,"durationMs":100},"llm":{"startMs":200,"durationMs":100},"tts":{"startMs":300,"durationMs":100}}}',
    ].join('\n')
    const { call } = parseCall(jsonl)
    expect(call.turns[0].sttStreaming).toBe(false)
    expect(call.turns[0].ttsStreaming).toBe(false)
  })
})
