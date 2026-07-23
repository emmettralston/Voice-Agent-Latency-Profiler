import { STAGES, type Call } from '../../types/schema'
import { turnComparison } from '../../analysis/baseline'
import { STAGE_COLORS, STAGE_LABELS } from '../Waterfall/stageStyle'
import styles from './TurnList.module.css'

interface TurnListProps {
  call: Call
  selectedIndex: number | null
  onSelect: (index: number) => void
}

function ratioClass(ratio: number, isOutlier: boolean): string {
  if (isOutlier) return styles.badgeOutlier
  if (ratio > 1.2) return styles.badgeWarn
  return styles.badge
}

export function TurnList({ call, selectedIndex, onSelect }: TurnListProps) {
  const comparisons = turnComparison(call)
  const maxLatency = Math.max(...comparisons.map((c) => c.latencyMs), 1)

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
            <li key={c.index}>
              <button
                type="button"
                className={active ? styles.rowActive : styles.row}
                aria-expanded={active}
                onClick={() => onSelect(c.index)}
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
            </li>
          )
        })}
      </ol>
    </section>
  )
}
