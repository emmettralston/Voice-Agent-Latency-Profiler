import { useMemo, useState } from 'react'
import type { ParseResult } from '../../ingest/parseCall'
import { latencyMedian } from '../../analysis/baseline'
import { runRules } from '../../analysis/rules'
import { verdictFor } from '../../analysis/verdict'
import { TurnList } from '../TurnList/TurnList'
import { VerdictBanner } from '../VerdictBanner/VerdictBanner'
import { FindingsList } from '../FindingsList/FindingsList'
import styles from './Report.module.css'

interface ReportProps {
  result: ParseResult
  onUnload: () => void
}

export function Report({ result, onUnload }: ReportProps) {
  const { call, warnings } = result
  const [turnIndex, setTurnIndex] = useState<number | null>(null)
  const median = useMemo(() => latencyMedian(call), [call])
  const findings = useMemo(() => runRules(call), [call])
  const verdict = useMemo(
    () => verdictFor(findings, median),
    [findings, median],
  )

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <dl className={styles.meta}>
          <div className={styles.metaItem}>
            <dt>call</dt>
            <dd>
              <code>{call.id}</code>
            </dd>
          </div>
          <div className={styles.metaItem}>
            <dt>model</dt>
            <dd>
              {call.model} · {call.provider}
            </dd>
          </div>
          <div className={styles.metaItem}>
            <dt>budget</dt>
            <dd>{call.budgetMs}ms</dd>
          </div>
          <div className={styles.metaItem}>
            <dt>turns</dt>
            <dd>{call.turns.length}</dd>
          </div>
          <div className={styles.metaItem}>
            <dt>median latency</dt>
            <dd>{Math.round(median)}ms</dd>
          </div>
        </dl>
        <button type="button" className={styles.unload} onClick={onUnload}>
          Load another call
        </button>
      </header>

      <VerdictBanner verdict={verdict} />
      <FindingsList findings={findings} onSelectTurn={setTurnIndex} />

      <TurnList
        call={call}
        findings={findings}
        warnings={warnings}
        selectedIndex={turnIndex}
        onSelect={setTurnIndex}
      />
    </main>
  )
}
