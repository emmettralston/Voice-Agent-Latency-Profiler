import { STAGES, type Call } from '../../types/schema'
import {
  latencyMedian,
  turnComparison,
  trendingStage,
} from '../../analysis/baseline'
import { STAGE_COLORS, STAGE_LABELS } from '../Waterfall/stageStyle'
import styles from './CallOverview.module.css'

interface CallOverviewProps {
  call: Call
  selectedIndex: number
  onSelect: (index: number) => void
}

function ratioClass(ratio: number, isOutlier: boolean): string {
  if (isOutlier) return styles.badgeOutlier
  if (ratio > 1.2) return styles.badgeWarn
  return styles.badge
}

export function CallOverview({
  call,
  selectedIndex,
  onSelect,
}: CallOverviewProps) {
  const comparisons = turnComparison(call)
  const medianLatency = latencyMedian(call)
  const trend = trendingStage(call)
  const outlierCount = comparisons.filter((c) => c.isOutlier).length
  const maxLatency = Math.max(...comparisons.map((c) => c.latencyMs), 1)

  return (
    <section className={styles.wrap} aria-label="Call overview">
      <div className={styles.summary}>
        <span className={styles.stat}>
          <span className={styles.statLabel}>median latency</span>
          <span className={styles.statValue}>
            {Math.round(medianLatency)}ms
          </span>
        </span>
        {trend && (
          <span className={styles.stat}>
            <span className={styles.statLabel}>rising stage</span>
            <span className={styles.statValue}>
              <span
                className={styles.swatch}
                style={{ background: STAGE_COLORS[trend.stage] }}
              />
              {STAGE_LABELS[trend.stage]} climbing{' '}
              {trend.growthRatio.toFixed(1)}× across the call
            </span>
          </span>
        )}
        <span className={styles.stat}>
          <span className={styles.statLabel}>outlier turns</span>
          <span className={styles.statValue}>
            {outlierCount > 0 ? `${outlierCount} over 1.5× median` : 'none'}
          </span>
        </span>
      </div>

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
                aria-current={active}
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
                <span
                  className={ratioClass(c.latencyRatio, c.isOutlier)}
                  title={c.isOutlier ? 'Over 1.5× the call median' : undefined}
                >
                  {c.isOutlier && <span aria-hidden="true">⚠ </span>}
                  {c.latencyRatio.toFixed(1)}×
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
