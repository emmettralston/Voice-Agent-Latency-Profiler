import type { Stage } from './schema'

// Per-stage benchmark joined in at render time; lives app-side, never fabricated.
export interface ReferencePoint {
  stage: Stage
  model?: string
  provider?: string
  p50Ms: number
  source: string
  url?: string
}
