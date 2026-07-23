import { useState } from 'react'
import type { ParseResult } from './ingest/parseCall'
import { FrontDoor } from './components/FrontDoor/FrontDoor'
import { Report } from './components/Report/Report'

function App() {
  const [result, setResult] = useState<ParseResult | null>(null)

  if (!result) return <FrontDoor onLoad={setResult} />
  return <Report result={result} onUnload={() => setResult(null)} />
}

export default App
