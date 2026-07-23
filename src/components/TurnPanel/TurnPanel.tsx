import { STAGES, type Turn } from '../../types/schema'
import type { TurnComparison } from '../../analysis/baseline'
import type { Finding } from '../../analysis/rules'
import type { CallWarning } from '../../ingest/geometry'
import { Waterfall } from '../Waterfall/Waterfall'
import { TurnDetail } from '../TurnDetail/TurnDetail'
import { referencePoints } from '../../reference'
import { STAGE_LABELS } from '../Waterfall/stageStyle'
import styles from './TurnPanel.module.css'

interface TurnPanelProps {
  turn: Turn
  comparison: TurnComparison
  findings: Finding[]
  warnings: CallWarning[]
  budgetMs: number
  hasPrev: boolean
  hasNext: boolean
  onPrev: () => void
  onNext: () => void
}

export function TurnPanel({
  turn,
  comparison,
  findings,
  warnings,
  budgetMs,
  hasPrev,
  hasNext,
  onPrev,
  onNext,
}: TurnPanelProps) {
  return (
    <section className={styles.panel} aria-label={`Turn ${turn.index} detail`}>
      <div className={styles.head}>
        <span className={styles.heading}>Turn {turn.index}</span>
        <div className={styles.nav}>
          <button type="button" onClick={onPrev} disabled={!hasPrev}>
            ‹ prev
          </button>
          <button type="button" onClick={onNext} disabled={!hasNext}>
            next ›
          </button>
        </div>
      </div>

      <TurnDetail comparison={comparison} findings={findings} />

      <Waterfall
        turn={turn}
        budgetMs={budgetMs}
        references={referencePoints}
        replayKey={`${turn.index}`}
      />

      {warnings.length > 0 && (
        <ul className={styles.warnings}>
          {warnings.map((w) => (
            <li key={`${w.kind}-${w.message}`} className={styles.warning}>
              {w.message}
            </li>
          ))}
        </ul>
      )}

      <dl className={styles.references}>
        <dt className={styles.referencesLabel}>Reference</dt>
        {STAGES.map((stage) => {
          const point = referencePoints.find((r) => r.stage === stage)
          return (
            <dd key={stage} className={styles.reference}>
              <span className={styles.referenceStage}>
                {STAGE_LABELS[stage]}
              </span>
              {point ? (
                <span className={styles.referenceValue}>
                  {point.p50Ms}ms p50 · {point.source}
                </span>
              ) : (
                <span className={styles.referenceEmpty}>no citable number yet</span>
              )}
            </dd>
          )
        })}
      </dl>
      <p className={styles.referencesInvite}>
        Reference numbers are only added with a public, citable source.
        Have one? PRs welcome.
      </p>
    </section>
  )
}
