// Cold-landing screen: intro, pipeline diagram, drop zone, and sample picker.
import { useEffect, useState } from 'react'
import { parseCall, type ParseResult } from '../../ingest/parseCall'
import {
  fetchSampleIndex,
  fetchSampleText,
  type SampleEntry,
} from '../../ingest/samples'
import { STAGES } from '../../types/schema'
import {
  STAGE_COLORS,
  STAGE_LABELS,
  STAGE_SUBLABELS,
} from '../Waterfall/stageStyle'
import styles from './FrontDoor.module.css'

interface FrontDoorProps {
  onLoad: (result: ParseResult) => void
}

export function FrontDoor({ onLoad }: FrontDoorProps) {
  const [samples, setSamples] = useState<SampleEntry[]>([])
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    fetchSampleIndex()
      .then((entries) => active && setSamples(entries))
      .catch((e) => active && setError(String(e)))
    return () => {
      active = false
    }
  }, [])

  function load(text: string) {
    try {
      onLoad(parseCall(text))
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    }
  }

  function loadFile(file: File) {
    setError('')
    file
      .text()
      .then(load)
      .catch((e) => setError(String(e)))
  }

  function loadSample(entry: SampleEntry) {
    setError('')
    fetchSampleText(entry.file)
      .then(load)
      .catch((e) => setError(String(e)))
  }

  return (
    <main className={styles.page}>
      <h1 className={styles.title}>Voice Agent Latency Profiler</h1>
      <p className={styles.subtitle}>
        Load a call log and see where the milliseconds go.
      </p>

      <ol className={styles.pipeline}>
        {STAGES.map((stage) => (
          <li key={stage} className={styles.stage}>
            <span
              className={styles.swatch}
              style={{ background: STAGE_COLORS[stage] }}
            />
            <span className={styles.stageName}>{STAGE_LABELS[stage]}</span>
            <span className={styles.stageSub}>{STAGE_SUBLABELS[stage]}</span>
          </li>
        ))}
      </ol>

      <label
        className={dragging ? styles.dropActive : styles.drop}
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragging(false)
          const file = e.dataTransfer.files[0]
          if (file) loadFile(file)
        }}
      >
        <input
          type="file"
          accept=".jsonl"
          className={styles.fileInput}
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) loadFile(file)
          }}
        />
        <span className={styles.dropTitle}>Drop a call log</span>
        <span className={styles.dropHint}>.jsonl · or click to browse</span>
      </label>

      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}

      <div className={styles.samples}>
        <span className={styles.samplesLabel}>Or try a sample</span>
        {samples.map((entry) => (
          <button
            key={entry.file}
            type="button"
            className={styles.sample}
            onClick={() => loadSample(entry)}
          >
            <span className={styles.sampleName}>{entry.name}</span>
            <span className={styles.sampleBlurb}>{entry.blurb}</span>
          </button>
        ))}
      </div>

      <footer className={styles.footer}>
        <a href="https://github.com/emmettralston/VoiceAgentEval#readme">
          Schema and docs
        </a>
      </footer>
    </main>
  )
}
