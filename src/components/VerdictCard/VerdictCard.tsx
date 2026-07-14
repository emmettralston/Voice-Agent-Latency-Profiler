import type { Basis, Finding } from '../../analysis/rules'
import { STAGE_COLORS } from '../Waterfall/stageStyle'
import styles from './VerdictCard.module.css'

const BASIS_LABEL: Record<Basis, string> = {
  median: 'vs this call’s median',
  budget: 'vs your response budget',
  trend: 'trend across the call',
  heuristic: 'rule of thumb',
}

interface VerdictCardProps {
  findings: Finding[]
  medianLatencyMs: number
}

export function VerdictCard({ findings, medianLatencyMs }: VerdictCardProps) {
  if (findings.length === 0) {
    return (
      <div className={styles.clean} role="status">
        <span className={styles.cleanDot} aria-hidden="true" />
        <div>
          <p className={styles.cleanTitle}>No systemic latency issues found</p>
          <p className={styles.cleanBody}>
            Every turn clusters near this call’s {Math.round(medianLatencyMs)}ms
            median, and no stage drifts or spikes stand out.
          </p>
        </div>
      </div>
    )
  }

  return (
    <ol className={styles.list} aria-label="Findings">
      {findings.map((f) => (
        <li key={f.ruleId} className={styles[f.severity]}>
          <div className={styles.head}>
            <span className={styles.dot} aria-hidden="true" />
            {f.stage && (
              <span
                className={styles.swatch}
                style={{ background: STAGE_COLORS[f.stage] }}
                aria-hidden="true"
              />
            )}
            <span className={styles.title}>{f.title}</span>
            <span className={styles.basis}>{BASIS_LABEL[f.basis]}</span>
          </div>
          <p className={styles.detail}>{f.detail}</p>
          <p className={styles.fix}>
            <span className={styles.fixLabel}>Fix</span>
            {f.fix}
          </p>
          <p className={styles.evidence}>{f.evidence}</p>
        </li>
      ))}
    </ol>
  )
}
