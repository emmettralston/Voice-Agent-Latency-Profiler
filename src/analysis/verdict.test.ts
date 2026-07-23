import { describe, expect, it } from 'vitest'
import { verdictFor } from './verdict'
import type { Finding } from './rules'

function finding(over: Partial<Finding> = {}): Finding {
  return {
    ruleId: 'test-rule',
    severity: 'warn',
    rank: 2000,
    title: 'Something is slow',
    detail: 'It is slower than it should be.',
    fix: 'Make it faster.',
    evidence: 'slow',
    basis: 'median',
    ...over,
  }
}

describe('verdictFor', () => {
  it('reports an all-clear when nothing fired', () => {
    const verdict = verdictFor([], 850)
    expect(verdict.tone).toBe('clean')
    expect(verdict.headline).toBe('No systemic latency issues found')
    expect(verdict.detail).toContain('850ms')
    expect(verdict.otherFindingCount).toBe(0)
  })

  it('takes its headline and tone from the worst finding', () => {
    const worst = finding({
      severity: 'critical',
      rank: 3500,
      title: 'LLM first-token is climbing',
      detail: 'It rose 2.1x across the call.',
    })
    const verdict = verdictFor([worst, finding(), finding()], 850)
    expect(verdict.tone).toBe('critical')
    expect(verdict.headline).toBe('LLM first-token is climbing')
    expect(verdict.detail).toBe('It rose 2.1x across the call.')
  })

  it('counts the findings behind the headline, excluding it', () => {
    expect(
      verdictFor([finding(), finding(), finding()], 850).otherFindingCount,
    ).toBe(2)
    expect(verdictFor([finding()], 850).otherFindingCount).toBe(0)
  })

  it('rounds the median for display', () => {
    expect(verdictFor([], 849.6).detail).toContain('850ms')
  })
})
