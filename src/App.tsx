import { useState } from 'react'
import type { ParseResult } from './ingest/parseCall'
import { FrontDoor } from './components/FrontDoor/FrontDoor'
import { CallOverview } from './components/CallOverview/CallOverview'
import { Waterfall } from './components/Waterfall/Waterfall'
import { referencePoints } from './reference'

function App() {
  const [result, setResult] = useState<ParseResult | null>(null)
  const [turnIndex, setTurnIndex] = useState(0)

  if (!result) return <FrontDoor onLoad={setResult} />

  const call = result.call
  return (
    <main>
      <button type="button" onClick={() => setResult(null)}>
        Load another call
      </button>
      <CallOverview
        call={call}
        selectedIndex={turnIndex}
        onSelect={setTurnIndex}
      />
      <Waterfall
        turn={call.turns[turnIndex]}
        budgetMs={call.budgetMs}
        references={referencePoints}
        replayKey={`${call.id}:${turnIndex}`}
      />
    </main>
  )
}

export default App
