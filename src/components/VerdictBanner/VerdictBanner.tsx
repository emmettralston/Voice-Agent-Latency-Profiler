// The single call-level verdict the report leads with, above the evidence.
import type { Verdict } from '../../analysis/verdict'
import styles from './VerdictBanner.module.css'

interface VerdictBannerProps {
  verdict: Verdict
}

export function VerdictBanner({ verdict }: VerdictBannerProps) {
  return (
    <section className={styles[verdict.tone]} aria-label="Verdict">
      <span className={styles.dot} aria-hidden="true" />
      <div>
        <h2 className={styles.headline}>{verdict.headline}</h2>
        <p className={styles.detail}>{verdict.detail}</p>
        {verdict.otherFindingCount > 0 && (
          <p className={styles.more}>
            and {verdict.otherFindingCount} more finding
            {verdict.otherFindingCount > 1 ? 's' : ''} below
          </p>
        )}
      </div>
    </section>
  )
}
