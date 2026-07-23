// The bundled sample catalog. Logs stay in public/ as fetchable JSONL so users can read them.
export interface SampleEntry {
  file: string
  name: string
  blurb: string
}

const base = import.meta.env.BASE_URL

export async function fetchSampleIndex(): Promise<SampleEntry[]> {
  const response = await fetch(`${base}samples/index.json`)
  if (!response.ok) throw new Error('Could not load the sample list')
  return (await response.json()) as SampleEntry[]
}

export async function fetchSampleText(file: string): Promise<string> {
  const response = await fetch(`${base}samples/${file}`)
  if (!response.ok) throw new Error(`Could not load sample ${file}`)
  return response.text()
}
