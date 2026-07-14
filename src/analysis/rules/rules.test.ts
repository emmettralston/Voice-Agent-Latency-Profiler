import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { runRules } from './engine'
import { parseCall } from '../../ingest/parseCall'
import type { Call, Turn } from '../../types/schema'

function loadSample(name: string): Call {
  const url = new URL(`../../../public/samples/${name}`, import.meta.url)
  return parseCall(readFileSync(url, 'utf8')).call
}

function ids(call: Call): string[] {
  return runRules(call).map((f) => f.ruleId)
}

function turn(
  index: number,
  durations: { vad: number; stt: number; llm: number; tts: number },
  flags: { stt: boolean; tts: boolean } = { stt: true, tts: true },
): Turn {
  const { vad, stt, llm, tts } = durations
  return {
    type: 'turn',
    index,
    userText: '',
    sttStreaming: flags.stt,
    ttsStreaming: flags.tts,
    stages: {
      vad: { startMs: 0, durationMs: vad },
      stt: { startMs: vad, durationMs: stt },
      llm: { startMs: vad + stt, durationMs: llm },
      tts: { startMs: vad + stt + llm, durationMs: tts },
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

describe('runRules on the bundled samples', () => {
  it('leads with context bloat and suppresses the duplicate budget-share finding', () => {
    const result = ids(loadSample('context-bloat.jsonl'))
    expect(result[0]).toBe('llm-context-bloat')
    expect(result).toContain('latency-outliers')
    // LLM also dominates the budget, but that finding points at the same stage and is deduped away.
    expect(result).not.toContain('stage-dominates-budget')
    expect(result).not.toContain('tts-not-streaming')
  })

  it('flags non-streaming TTS and the endpointing drift without a false context-bloat', () => {
    const result = ids(loadSample('tts-not-streaming.jsonl'))
    expect(result[0]).toBe('tts-not-streaming')
    expect(result).toContain('rising-stage')
    expect(result).not.toContain('llm-context-bloat')
    // VAD is rising AND high; the trend finding wins the same-stage dedupe.
    expect(result).not.toContain('vad-endpointing-high')
  })

  it('gives a healthy call a clean bill (no findings)', () => {
    expect(runRules(loadSample('healthy-call.jsonl'))).toEqual([])
  })
})

describe('runRules edge cases', () => {
  it('fires stt-not-streaming when transcription is slow and batched', () => {
    const c = call(
      Array.from({ length: 5 }, (_, i) =>
        turn(
          i,
          { vad: 150, stt: 600, llm: 300, tts: 100 },
          { stt: false, tts: true },
        ),
      ),
    )
    expect(ids(c)).toContain('stt-not-streaming')
  })

  it('fires stage-dominates-budget on a flat-but-heavy stage that is not trending', () => {
    const c = call(
      Array.from({ length: 5 }, (_, i) =>
        turn(i, { vad: 150, stt: 120, llm: 250, tts: 500 }),
      ),
      1000,
    )
    const result = ids(c)
    expect(result).toContain('stage-dominates-budget')
    expect(result).not.toContain('rising-stage')
  })
})
