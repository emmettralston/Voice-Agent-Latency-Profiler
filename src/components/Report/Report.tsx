import { useMemo, useState } from 'react'
import type { ParseResult } from '../../ingest/parseCall'
import { latencyMedian } from '../../analysis/baseline'
import { CallOverview } from '../CallOverview/CallOverview'
import { Waterfall } from '../Waterfall/Waterfall'
import { referencePoints } from '../../reference'
import styles from './Report.module.css'

interface ReportProps {
  result: ParseResult
  onUnload: () => void
}

export function Report({ result, onUnload }: ReportProps) {
  const { call } = result
  const [turnIndex, setTurnIndex] = useState(0)
  const median = useMemo(() => latencyMedian(call), [call])

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

      <CallOverview
        call={call}
        selectedIndex={turnIndex}
        onSelect={setTurnIndex}
      />
      <Waterfall
        turn={call.turns[turnIndex]}
        budgetMs={call.budgetMs}
        references={referencePoints}
        replayKey={`${call.id}:${turnIndex}`}
      />
    </main>
  )
}
