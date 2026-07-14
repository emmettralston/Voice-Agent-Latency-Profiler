import type { Call } from '../../types/schema'
import {
  latencyMedian,
  outlierTurns,
  stageMedians,
  stageTrends,
  turnComparison,
} from '../baseline'
import { ALL_RULES } from './definitions'
import type { Finding } from './types'

export function runRules(call: Call): Finding[] {
  const ctx = {
    call,
    comparisons: turnComparison(call),
    latencyMedian: latencyMedian(call),
    stageMedians: stageMedians(call),
    stageTrends: stageTrends(call),
    outliers: outlierTurns(call),
  }
  const findings = ALL_RULES.map((rule) => rule(ctx)).filter(
    (f): f is Finding => f !== null,
  )
  return dedupeByStage(findings).sort((a, b) => b.rank - a.rank)
}

// When two rules implicate the same stage, keep the stronger so the list never says the same thing twice.
function dedupeByStage(findings: Finding[]): Finding[] {
  const strongestForStage = new Map<string, Finding>()
  const unscoped: Finding[] = []
  for (const finding of findings) {
    if (finding.stage === undefined) {
      unscoped.push(finding)
      continue
    }
    const current = strongestForStage.get(finding.stage)
    if (!current || finding.rank > current.rank)
      strongestForStage.set(finding.stage, finding)
  }
  return [...unscoped, ...strongestForStage.values()]
}
