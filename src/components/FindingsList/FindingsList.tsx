// The ranked findings: what the rules found wrong, worst first, each expandable to its fix and evidence.
import { useState } from 'react'
import type { Basis, Finding } from '../../analysis/rules'
import { STAGE_COLORS } from '../Waterfall/stageStyle'
import styles from './FindingsList.module.css'

const BASIS_LABEL: Record<Basis, string> = {
  median: 'vs this call’s median',
  budget: 'vs your response budget',
  trend: 'trend across the call',
  heuristic: 'rule of thumb',
}

interface FindingsListProps {
  findings: Finding[]
  medianLatencyMs: number
  onSelectTurn: (index: number) => void
}

export function FindingsList({
  findings,
  medianLatencyMs,
  onSelectTurn,
}: FindingsListProps) {
  const [openId, setOpenId] = useState(findings[0]?.ruleId ?? '')

  if (findings.length === 0) {
    return (
      <section className={styles.clean} role="status">
        <span className={styles.cleanDot} aria-hidden="true" />
        <div>
          <p className={styles.cleanTitle}>No systemic latency issues found</p>
          <p className={styles.cleanBody}>
            Every turn clusters near this call’s {Math.round(medianLatencyMs)}ms
            median, and no stage drifts or spikes stand out.
          </p>
        </div>
      </section>
    )
  }

  return (
    <section className={styles.wrap} aria-label="Findings">
      <h3 className={styles.heading}>
        {findings.length} finding{findings.length > 1 ? 's' : ''}
      </h3>
      <ol className={styles.list}>
        {findings.map((f) => {
          const open = f.ruleId === openId
          return (
            <li key={f.ruleId} className={styles[f.severity]}>
              <button
                type="button"
                className={styles.head}
                aria-expanded={open}
                onClick={() => setOpenId(open ? '' : f.ruleId)}
              >
                {f.stage && (
                  <span
                    className={styles.swatch}
                    style={{ background: STAGE_COLORS[f.stage] }}
                    aria-hidden="true"
                  />
                )}
                <span className={styles.title}>{f.title}</span>
                <span className={styles.basis}>{BASIS_LABEL[f.basis]}</span>
              </button>
              {open && (
                <div className={styles.body}>
                  <p className={styles.detail}>{f.detail}</p>
                  <p className={styles.fix}>
                    <span className={styles.fixLabel}>Fix</span>
                    {f.fix}
                  </p>
                  <p className={styles.evidence}>{f.evidence}</p>
                  {f.turnIndexes && f.turnIndexes.length > 0 && (
                    <p className={styles.turns}>
                      {f.turnIndexes.map((index) => (
                        <button
                          key={index}
                          type="button"
                          className={styles.turnLink}
                          onClick={() => onSelectTurn(index)}
                        >
                          Turn {index} →
                        </button>
                      ))}
                    </p>
                  )}
                </div>
              )}
            </li>
          )
        })}
      </ol>
    </section>
  )
}
