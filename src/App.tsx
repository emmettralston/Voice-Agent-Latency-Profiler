import { useEffect, useState } from 'react'
import { parseCall, type ParseResult } from './ingest/parseCall'
import { turnLatencyMs } from './ingest/geometry'
import { STAGES } from './types/schema'
import { Waterfall } from './components/Waterfall/Waterfall'
import { STAGE_LABELS } from './components/Waterfall/stageStyle'
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

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Voice Agent Latency Profiler</h1>
        <p className={styles.subtitle}>
          See where the milliseconds go in a voice turn.
        </p>
      </header>

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
          <p className={styles.callMeta}>
            <code>{call.id}</code> · {call.model}/{call.provider} · budget{' '}
            {call.budgetMs}ms · {call.turns.length} turns
          </p>

          <section className={styles.panel} aria-label="Turn waterfall">
            <Waterfall
              turn={turn}
              budgetMs={call.budgetMs}
              references={referencePoints}
              replayKey={`${selected}:${turnIndex}`}
            />
          </section>

          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>#</th>
                  {STAGES.map((stage) => (
                    <th key={stage}>{STAGE_LABELS[stage]}</th>
                  ))}
                  <th>latency</th>
                  <th>utterance</th>
                </tr>
              </thead>
              <tbody>
                {call.turns.map((t) => {
                  const latency = turnLatencyMs(t)
                  const over = latency > call.budgetMs
                  return (
                    <tr
                      key={t.index}
                      className={
                        t.index === turnIndex ? styles.rowActive : styles.row
                      }
                      aria-selected={t.index === turnIndex}
                      tabIndex={0}
                      onClick={() => setTurnIndex(t.index)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          setTurnIndex(t.index)
                        }
                      }}
                    >
                      <td>{t.index}</td>
                      {STAGES.map((stage) => (
                        <td key={stage} className={styles.num}>
                          {t.stages[stage].durationMs}
                        </td>
                      ))}
                      <td className={over ? styles.numOver : styles.num}>
                        {latency}
                      </td>
                      <td className={styles.utterance}>{t.userText}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </main>
  )
}

export default App
