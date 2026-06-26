import { describe, expect, it } from 'vitest'
import { buildTicks, layoutTurn, scaleLinear } from './layout'
import type { Turn } from '../../types/schema'
import type { ReferencePoint } from '../../types/reference'

function turn(stages: Partial<Turn['stages']> = {}): Turn {
  return {
    type: 'turn',
    index: 0,
    userText: '',
    sttStreaming: true,
    ttsStreaming: true,
    stages: {
      vad: { startMs: 0, durationMs: 200 },
      stt: { startMs: 200, durationMs: 100 },
      llm: { startMs: 300, durationMs: 400 },
      tts: { startMs: 700, durationMs: 100 },
      ...stages,
    },
  }
}

describe('scaleLinear', () => {
  it('maps the domain onto the width', () => {
    const scale = scaleLinear(1000, 500)
    expect(scale(0)).toBe(0)
    expect(scale(1000)).toBe(500)
    expect(scale(500)).toBe(250)
  })

  it('returns 0 for an empty domain', () => {
    expect(scaleLinear(0, 500)(100)).toBe(0)
  })
})

describe('buildTicks', () => {
  it('starts at zero and stays within the domain', () => {
    const ticks = buildTicks(1500)
    expect(ticks[0]).toBe(0)
    expect(ticks[ticks.length - 1]).toBeLessThanOrEqual(1500)
  })

  it('uses an evenly spaced nice step', () => {
    const ticks = buildTicks(1500)
    const step = ticks[1] - ticks[0]
    for (let i = 1; i < ticks.length; i++) {
      expect(ticks[i] - ticks[i - 1]).toBe(step)
    }
  })
})

describe('layoutTurn', () => {
  const width = 1000

  it('keeps an in-budget turn left of the budget line', () => {
    const { overBudget, playheadX, budgetX, bars } = layoutTurn(
      turn(),
      1500,
      width,
    )
    expect(overBudget).toBe(false)
    expect(playheadX).toBeLessThan(budgetX)
    expect(bars.every((b) => b.clipX === null)).toBe(true)
  })

  it('clips a bar that straddles the budget line', () => {
    const overBudgetTurn = turn({ tts: { startMs: 1400, durationMs: 600 } })
    const { overBudget, bars } = layoutTurn(overBudgetTurn, 1500, width)
    const tts = bars.find((b) => b.stage === 'tts')!
    expect(overBudget).toBe(true)
    expect(tts.overBudget).toBe(true)
    expect(tts.clipX).not.toBeNull()
  })

  it('renders a gap as empty space between bars', () => {
    const gapped = turn({ tts: { startMs: 760, durationMs: 100 } })
    const { bars } = layoutTurn(gapped, 1500, width)
    const llm = bars.find((b) => b.stage === 'llm')!
    const tts = bars.find((b) => b.stage === 'tts')!
    expect(tts.x).toBeGreaterThan(llm.x + llm.width)
  })

  it('places a reference marker when one matches the stage', () => {
    const references: ReferencePoint[] = [
      { stage: 'llm', p50Ms: 500, source: 'test' },
    ]
    const { bars, domainMaxMs } = layoutTurn(turn(), 1500, width, references)
    const llm = bars.find((b) => b.stage === 'llm')!
    expect(llm.referenceX).toBeCloseTo((500 / domainMaxMs) * width)
    expect(bars.find((b) => b.stage === 'vad')!.referenceX).toBeNull()
  })
})
