import { useEffect, useMemo, useState } from 'react'
import { parseCall, type ParseResult } from './ingest/parseCall'
import { STAGES } from './types/schema'
import { Waterfall } from './components/Waterfall/Waterfall'
import { CallOverview } from './components/CallOverview/CallOverview'
import { VerdictCard } from './components/VerdictCard/VerdictCard'
import { TurnDetail } from './components/TurnDetail/TurnDetail'
import { latencyMedian, turnComparison } from './analysis/baseline'
import { runRules } from './analysis/rules'
import {
  STAGE_COLORS,
  STAGE_LABELS,
  STAGE_SUBLABELS,
} from './components/Waterfall/stageStyle'
import { referencePoints } from './reference'
import styles from './App.module.css'

interface SampleEntry {
  file: string
  label: string
}

const base = import.meta.env.BASE_URL

function App() {
  const [samples, setSamples] = useState<SampleEntry[]>([])
  const [selected, setSelected] = useState('')
  const [result, setResult] = useState<ParseResult | null>(null)
  const [turnIndex, setTurnIndex] = useState(0)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    fetch(`${base}samples/index.json`)
      .then((r) => r.json())
      .then((entries: SampleEntry[]) => {
        if (!active) return
        setSamples(entries)
        if (entries.length > 0) setSelected(entries[0].file)
      })
      .catch((e) => active && setError(String(e)))
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (!selected) return
    let active = true
    fetch(`${base}samples/${selected}`)
      .then((r) => r.text())
      .then((text) => {
        if (!active) return
        try {
          setResult(parseCall(text))
          setTurnIndex(0)
          setError('')
        } catch (e) {
          setResult(null)
          setError(String(e))
        }
      })
      .catch((e) => active && setError(String(e)))
    return () => {
      active = false
    }
  }, [selected])

  const call = result?.call
  const turn = call?.turns[turnIndex]
  const findings = useMemo(() => (call ? runRules(call) : []), [call])
  const comparisons = useMemo(() => (call ? turnComparison(call) : []), [call])
  const medianLatency = useMemo(() => (call ? latencyMedian(call) : 0), [call])

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Voice Agent Latency Profiler</h1>
        <p className={styles.subtitle}>
          See where the milliseconds go in a voice turn.
        </p>
      </header>

      <div className={styles.legend} aria-label="Pipeline stages">
        <span className={styles.legendLabel}>Pipeline</span>
        <ol className={styles.legendStages}>
          {STAGES.map((stage) => (
            <li key={stage} className={styles.legendItem}>
              <span
                className={styles.legendSwatch}
                style={{ background: STAGE_COLORS[stage] }}
              />
              <span className={styles.legendName}>{STAGE_LABELS[stage]}</span>
              <span className={styles.legendSub}>{STAGE_SUBLABELS[stage]}</span>
            </li>
          ))}
        </ol>
      </div>

      <label className={styles.control}>
        <span>Sample</span>
        <select value={selected} onChange={(e) => setSelected(e.target.value)}>
          {samples.map((s) => (
            <option key={s.file} value={s.file}>
              {s.label}
            </option>
          ))}
        </select>
      </label>

      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}

      {call && turn && (
        <>
          <dl className={styles.callMeta}>
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
              <dt>response budget</dt>
              <dd>{call.budgetMs}ms</dd>
            </div>
            <div className={styles.metaItem}>
              <dt>turns</dt>
              <dd>{call.turns.length}</dd>
            </div>
          </dl>

          <div className={styles.sectionHead}>
            <span className={styles.eyebrow}>Findings</span>
            <p className={styles.sectionHelp}>
              Deterministic checks over this call. Each names what it measured
              against &mdash; your own median, your budget, or a labeled rule of
              thumb &mdash; never an outside benchmark.
            </p>
          </div>

          <VerdictCard findings={findings} medianLatencyMs={medianLatency} />

          <div className={styles.sectionHead}>
            <span className={styles.eyebrow}>Call overview</span>
            <p className={styles.sectionHelp}>
              Each row is one turn, sized and scored against this call&rsquo;s
              own median latency. Click a turn to open its waterfall below.
            </p>
          </div>

          <CallOverview
            call={call}
            selectedIndex={turnIndex}
            onSelect={setTurnIndex}
          />

          <div className={styles.sectionHead}>
            <span className={styles.eyebrow}>Turn {turnIndex} · Waterfall</span>
            <p className={styles.sectionHelp}>
              Each stage measured from when the user stopped speaking (t = 0) to
              first audio out. The dashed red line is the response budget.
            </p>
          </div>

          <section className={styles.panel} aria-label="Turn waterfall">
            <Waterfall
              turn={turn}
              budgetMs={call.budgetMs}
              references={referencePoints}
              replayKey={`${selected}:${turnIndex}`}
            />
          </section>

          {comparisons[turnIndex] && (
            <TurnDetail
              comparison={comparisons[turnIndex]}
              findings={findings}
            />
          )}
        </>
      )}
    </main>
  )
}

export default App
