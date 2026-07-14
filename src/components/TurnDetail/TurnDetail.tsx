import { STAGES, type Stage } from '../../types/schema'
import type { TurnComparison } from '../../analysis/baseline'
import type { Finding } from '../../analysis/rules'
import { STAGE_COLORS, STAGE_LABELS } from '../Waterfall/stageStyle'
import styles from './TurnDetail.module.css'

// A stage within ~10% of its own median isn't worth calling out as this turn's slow spot.
const NOTABLE_RATIO = 1.1

interface TurnDetailProps {
  comparison: TurnComparison
  findings: Finding[]
}

function worstStage(comparison: TurnComparison): {
  stage: Stage
  ratio: number
} {
  let worst: Stage = STAGES[0]
  for (const stage of STAGES) {
    if (comparison.stageRatios[stage] > comparison.stageRatios[worst])
      worst = stage
  }
  return { stage: worst, ratio: comparison.stageRatios[worst] }
}

export function TurnDetail({ comparison, findings }: TurnDetailProps) {
  const worst = worstStage(comparison)
  const related = findings.filter((f) =>
    f.turnIndexes?.includes(comparison.index),
  )

  return (
    <div className={styles.wrap}>
      <p className={styles.line}>
        {worst.ratio > NOTABLE_RATIO ? (
          <>
            <span
              className={styles.swatch}
              style={{ background: STAGE_COLORS[worst.stage] }}
              aria-hidden="true"
            />
            <strong>{STAGE_LABELS[worst.stage]}</strong> was this turn’s slow
            stage — {worst.ratio.toFixed(1)}× its own median across the call.
          </>
        ) : (
          <>This turn tracks the call median across every stage.</>
        )}
      </p>
      {related.length > 0 && (
        <p className={styles.tie}>
          Flagged by:{' '}
          {related.map((f, i) => (
            <span key={f.ruleId}>
              {i > 0 && ', '}
              {f.title.toLowerCase()}
            </span>
          ))}
          .
        </p>
      )}
    </div>
  )
}
