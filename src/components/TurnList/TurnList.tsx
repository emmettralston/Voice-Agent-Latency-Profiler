import { useEffect, useRef } from 'react'
import { STAGES, type Call } from '../../types/schema'
import { turnComparison } from '../../analysis/baseline'
import type { Finding } from '../../analysis/rules'
import type { CallWarning } from '../../ingest/geometry'
import { STAGE_COLORS, STAGE_LABELS } from '../Waterfall/stageStyle'
import { TurnPanel } from '../TurnPanel/TurnPanel'
import styles from './TurnList.module.css'

interface TurnListProps {
  call: Call
  findings: Finding[]
  warnings: CallWarning[]
  selectedIndex: number | null
  onSelect: (index: number | null) => void
}

function ratioClass(ratio: number, isOutlier: boolean): string {
  if (isOutlier) return styles.badgeOutlier
  if (ratio > 1.2) return styles.badgeWarn
  return styles.badge
}

export function TurnList({
  call,
  findings,
  warnings,
  selectedIndex,
  onSelect,
}: TurnListProps) {
  const comparisons = turnComparison(call)
  const maxLatency = Math.max(...comparisons.map((c) => c.latencyMs), 1)
  const selectedRow = useRef<HTMLLIElement>(null)

  // Selection can jump from a finding pill far below the fold; scroll it into view so the response is visible.
  useEffect(() => {
    if (selectedIndex === null) return
    selectedRow.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [selectedIndex])

  return (
    <section className={styles.wrap} aria-label="Turns">
      <div className={styles.columnHead} aria-hidden="true">
        <span className={styles.index}>#</span>
        <span>Turn pipeline</span>
        <span className={styles.latencyHead}>Latency</span>
        <span className={styles.ratioHead}>vs median</span>
        <span>What the user said</span>
      </div>

      <ol className={styles.rows}>
        {comparisons.map((c) => {
          const turn = call.turns[c.index]
          const active = c.index === selectedIndex
          return (
            <li key={c.index} ref={active ? selectedRow : null}>
              <button
                type="button"
                className={active ? styles.rowActive : styles.row}
                aria-expanded={active}
                onClick={() => onSelect(active ? null : c.index)}
              >
                <span className={styles.index}>{c.index}</span>
                <span className={styles.track}>
                  <span
                    className={styles.bar}
                    style={{ width: `${(c.latencyMs / maxLatency) * 100}%` }}
                  >
                    {STAGES.map((stage) => (
                      <span
                        key={stage}
                        className={styles.segment}
                        style={{
                          flexGrow: turn.stages[stage].durationMs,
                          background: STAGE_COLORS[stage],
                        }}
                        title={`${STAGE_LABELS[stage]} ${turn.stages[stage].durationMs}ms`}
                      />
                    ))}
                  </span>
                </span>
                <span className={styles.latency}>{c.latencyMs}ms</span>
                <span className={ratioClass(c.latencyRatio, c.isOutlier)}>
                  {c.isOutlier && <span aria-hidden="true">⚠ </span>}
                  {c.latencyRatio.toFixed(1)}× median
                </span>
                <span className={styles.utterance}>{turn.userText}</span>
              </button>
              {active && (
                <TurnPanel
                  turn={turn}
                  comparison={c}
                  findings={findings}
                  warnings={warnings.filter((w) => w.turnIndex === c.index)}
                  budgetMs={call.budgetMs}
                  hasPrev={c.index > 0}
                  hasNext={c.index < call.turns.length - 1}
                  onPrev={() => onSelect(c.index - 1)}
                  onNext={() => onSelect(c.index + 1)}
                />
              )}
            </li>
          )
        })}
      </ol>
    </section>
  )
}
