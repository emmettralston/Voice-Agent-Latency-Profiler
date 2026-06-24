import { useEffect, useState } from 'react'
import { parseCall, type ParseResult } from './ingest/parseCall'
import { turnLatencyMs } from './ingest/geometry'
import { STAGES } from './types/schema'

// Throwaway view to eyeball that samples fetch, parse, and validate.

interface SampleEntry {
  file: string
  label: string
}

const base = import.meta.env.BASE_URL

function App() {
  const [samples, setSamples] = useState<SampleEntry[]>([])
  const [selected, setSelected] = useState('')
  const [result, setResult] = useState<ParseResult | null>(null)
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

  return (
    <main>
      <h1>Voice Agent Latency Profiler</h1>
      <p>Load a call log to see where the milliseconds go.</p>

      <label>
        Sample:{' '}
        <select value={selected} onChange={(e) => setSelected(e.target.value)}>
          {samples.map((s) => (
            <option key={s.file} value={s.file}>
              {s.label}
            </option>
          ))}
        </select>
      </label>

      {error && <p role="alert">Error: {error}</p>}

      {result && (
        <>
          <p>
            Call <code>{result.call.id}</code> — {result.call.model}/
            {result.call.provider}, budget {result.call.budgetMs}ms,{' '}
            {result.call.turns.length} turns
          </p>

          <table>
            <thead>
              <tr>
                <th>#</th>
                {STAGES.map((stage) => (
                  <th key={stage}>{stage}</th>
                ))}
                <th>latency</th>
                <th>utterance</th>
              </tr>
            </thead>
            <tbody>
              {result.call.turns.map((turn) => (
                <tr key={turn.index}>
                  <td>{turn.index}</td>
                  {STAGES.map((stage) => (
                    <td key={stage}>{turn.stages[stage].durationMs}</td>
                  ))}
                  <td>{turnLatencyMs(turn)}</td>
                  <td>{turn.userText}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {result.warnings.length > 0 && (
            <ul>
              {result.warnings.map((w, i) => (
                <li key={i}>
                  turn {w.turnIndex} [{w.kind}]: {w.message}
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </main>
  )
}

export default App
