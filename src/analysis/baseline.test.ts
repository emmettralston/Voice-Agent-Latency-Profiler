import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import {
  latencyMedian,
  outlierTurns,
  stageMedians,
  trendingStage,
} from './baseline'
import { parseCall } from '../ingest/parseCall'
import type { Call, Turn } from '../types/schema'

function loadSample(name: string): Call {
  const url = new URL(`../../public/samples/${name}`, import.meta.url)
  return parseCall(readFileSync(url, 'utf8')).call
}

function turn(
  index: number,
  durations: { vad: number; stt: number; llm: number; tts: number },
): Turn {
  const { vad, stt, llm, tts } = durations
  return {
    type: 'turn',
    index,
    userText: '',
    sttStreaming: true,
    ttsStreaming: true,
    stages: {
      vad: { startMs: 0, durationMs: vad },
      stt: { startMs: vad, durationMs: stt },
      llm: { startMs: vad + stt, durationMs: llm },
      tts: { startMs: vad + stt + llm, durationMs: tts },
    },
  }
}

function call(turns: Turn[]): Call {
  return {
    schemaVersion: 1,
    id: 'test',
    model: 'm',
    provider: 'p',
    budgetMs: 1500,
    turns,
  }
}

describe('stageMedians', () => {
  it('averages the two middle values on an even turn count', () => {
    const c = call([
      turn(0, { vad: 100, stt: 100, llm: 200, tts: 100 }),
      turn(1, { vad: 100, stt: 100, llm: 400, tts: 100 }),
    ])
    expect(stageMedians(c).llm).toBe(300)
  })
})

describe('trendingStage', () => {
  it('names the LLM as the rising stage on a context-bloat call', () => {
    expect(trendingStage(loadSample('context-bloat.jsonl'))?.stage).toBe('llm')
  })

  it('stays silent on a healthy call', () => {
    expect(trendingStage(loadSample('healthy-call.jsonl'))).toBeNull()
  })

  it('names the creeping endpointing (VAD), not the one-off STT spike', () => {
    const trend = trendingStage(loadSample('tts-not-streaming.jsonl'))
    expect(trend?.stage).toBe('vad')
  })

  it('returns null below the minimum turn count', () => {
    const c = call([
      turn(0, { vad: 100, stt: 100, llm: 100, tts: 100 }),
      turn(1, { vad: 100, stt: 100, llm: 400, tts: 100 }),
      turn(2, { vad: 100, stt: 100, llm: 900, tts: 100 }),
    ])
    expect(trendingStage(c)).toBeNull()
  })
})

describe('outlierTurns', () => {
  it('flags the worst turn on a context-bloat call, worst first', () => {
    const outliers = outlierTurns(loadSample('context-bloat.jsonl'))
    expect(outliers[0].index).toBe(8)
    expect(outliers[0].latencyRatio).toBeGreaterThan(1.5)
  })

  it('finds no outliers on a healthy call', () => {
    expect(outlierTurns(loadSample('healthy-call.jsonl'))).toEqual([])
  })
})

describe('latencyMedian', () => {
  it('measures to the end of first audio', () => {
    const c = call([turn(0, { vad: 100, stt: 100, llm: 100, tts: 100 })])
    expect(latencyMedian(c)).toBe(400)
  })
})
