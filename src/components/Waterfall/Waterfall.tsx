import { useEffect, useMemo, useRef, useState } from 'react'
import { STAGES, type Stage, type Turn } from '../../types/schema'
import type { ReferencePoint } from '../../types/reference'
import { layoutTurn } from './layout'
import { STAGE_COLORS, STAGE_LABELS } from './stageStyle'
import styles from './Waterfall.module.css'

// The single-turn waterfall: stage lanes on a shared time axis with a budget redline.

const LEFT = 56
const RIGHT = 92
const TOP_STRIP = 24
const LANE_H = 40
const BAR_H = 20
const BOTTOM_STRIP = 26

interface WaterfallProps {
  turn: Turn
  budgetMs: number
  references?: ReferencePoint[]
  // Changing this remounts the bars so the sweep replays on each sample/turn switch.
  replayKey: string
}

interface Tooltip {
  stage: Stage
  x: number
  y: number
}

function useMeasuredWidth() {
  const ref = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new ResizeObserver((entries) => {
      setWidth(entries[0].contentRect.width)
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  return { ref, width }
}

export function Waterfall({
  turn,
  budgetMs,
  references = [],
  replayKey,
}: WaterfallProps) {
  const { ref, width } = useMeasuredWidth()
  const [tooltip, setTooltip] = useState<Tooltip | null>(null)

  const plotWidth = Math.max(width - LEFT - RIGHT, 0)
  const lanesBottom = TOP_STRIP + STAGES.length * LANE_H
  const height = lanesBottom + BOTTOM_STRIP

  const layout = useMemo(
    () => layoutTurn(turn, budgetMs, plotWidth, references),
    [turn, budgetMs, plotWidth, references],
  )

  const laneCenter = (i: number) => TOP_STRIP + i * LANE_H + LANE_H / 2

  return (
    <div className={styles.wrap} ref={ref}>
      {plotWidth > 0 && (
        <svg
          className={styles.svg}
          width={width}
          height={height}
          role="img"
          aria-label={`Latency waterfall for turn ${turn.index}`}
        >
          <defs>
            <pattern
              id="clip-hatch"
              width="7"
              height="7"
              patternUnits="userSpaceOnUse"
              patternTransform="rotate(45)"
            >
              <rect width="7" height="7" fill="#FF4D4D" fillOpacity="0.55" />
              <line
                x1="0"
                y1="0"
                x2="0"
                y2="7"
                stroke="#5e0c18"
                strokeWidth="2.5"
              />
            </pattern>
          </defs>

          {layout.ticks.map((tick) => (
            <g key={tick.ms}>
              <line
                className={styles.gridline}
                x1={LEFT + tick.x}
                y1={TOP_STRIP}
                x2={LEFT + tick.x}
                y2={lanesBottom}
              />
              <text
                className={styles.tickLabel}
                x={LEFT + tick.x}
                y={lanesBottom + 16}
                textAnchor="middle"
              >
                {tick.ms}
              </text>
            </g>
          ))}

          <line
            className={styles.budgetLine}
            x1={LEFT + layout.budgetX}
            y1={TOP_STRIP}
            x2={LEFT + layout.budgetX}
            y2={lanesBottom}
          />
          <text
            className={styles.budgetLabel}
            x={LEFT + layout.budgetX - 5}
            y={lanesBottom + 16}
            textAnchor="end"
          >
            budget {budgetMs}ms
          </text>

          <line
            className={
              layout.overBudget ? styles.playheadOver : styles.playhead
            }
            x1={LEFT + layout.playheadX}
            y1={TOP_STRIP}
            x2={LEFT + layout.playheadX}
            y2={lanesBottom}
          />
          <text
            className={
              layout.overBudget ? styles.latencyLabelOver : styles.latencyLabel
            }
            x={LEFT + layout.playheadX}
            y={14}
            textAnchor="middle"
          >
            {layout.latencyMs}ms
          </text>

          <g key={replayKey}>
            {layout.bars.map((bar, i) => {
              const center = laneCenter(i)
              const barY = center - BAR_H / 2
              const active = tooltip?.stage === bar.stage
              return (
                <g key={bar.stage}>
                  {active && (
                    <rect
                      x={LEFT}
                      y={TOP_STRIP + i * LANE_H}
                      width={plotWidth}
                      height={LANE_H}
                      className={styles.laneHighlight}
                    />
                  )}
                  <text
                    className={styles.laneLabel}
                    x={LEFT - 10}
                    y={center}
                    textAnchor="end"
                    dominantBaseline="middle"
                  >
                    {STAGE_LABELS[bar.stage]}
                  </text>

                  {bar.referenceX !== null && (
                    <line
                      className={styles.reference}
                      x1={LEFT + bar.referenceX}
                      y1={barY - 6}
                      x2={LEFT + bar.referenceX}
                      y2={barY + BAR_H + 6}
                    />
                  )}

                  <g
                    className={styles.bar}
                    style={{ animationDelay: `${i * 0.08}s` }}
                  >
                    <rect
                      x={LEFT + bar.x}
                      y={barY}
                      width={Math.max(bar.width, 1)}
                      height={BAR_H}
                      rx={2}
                      fill={STAGE_COLORS[bar.stage]}
                    />
                    {bar.clipX !== null && (
                      <rect
                        x={LEFT + bar.clipX}
                        y={barY}
                        width={LEFT + bar.x + bar.width - (LEFT + bar.clipX)}
                        height={BAR_H}
                        rx={2}
                        fill="url(#clip-hatch)"
                      />
                    )}
                  </g>

                  <text
                    className={styles.durationLabel}
                    x={LEFT + bar.x + bar.width + 6}
                    y={center}
                    dominantBaseline="middle"
                  >
                    {bar.durationMs}ms
                  </text>

                  <rect
                    x={LEFT}
                    y={TOP_STRIP + i * LANE_H}
                    width={plotWidth}
                    height={LANE_H}
                    fill="transparent"
                    onMouseMove={(e) => {
                      const box = ref.current?.getBoundingClientRect()
                      if (!box) return
                      setTooltip({
                        stage: bar.stage,
                        x: e.clientX - box.left,
                        y: e.clientY - box.top,
                      })
                    }}
                    onMouseLeave={() => setTooltip(null)}
                  />
                </g>
              )
            })}
          </g>
        </svg>
      )}

      {tooltip &&
        (() => {
          const bar = layout.bars.find((b) => b.stage === tooltip.stage)!
          return (
            <div
              className={styles.tooltip}
              style={{ left: tooltip.x + 12, top: tooltip.y + 12 }}
            >
              {STAGE_LABELS[bar.stage]} · {bar.startMs}→{bar.endMs}ms ·{' '}
              {bar.durationMs}ms
            </div>
          )
        })()}
    </div>
  )
}
