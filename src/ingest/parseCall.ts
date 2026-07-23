import { z } from 'zod'
import {
  CallHeaderSchema,
  TurnSchema,
  type Call,
  type Turn,
} from '../types/schema'
import { checkGeometry, type CallWarning } from './geometry'

export interface ParseResult {
  call: Call
  warnings: CallWarning[]
}

function formatIssues(error: z.ZodError): string {
  return error.issues
    .map((issue) => {
      const path = issue.path.join('.')
      return path ? `${path}: ${issue.message}` : issue.message
    })
    .join('; ')
}

function parseJsonLine(line: string, lineNumber: number): unknown {
  try {
    return JSON.parse(line)
  } catch {
    throw new Error(`Line ${lineNumber}: not valid JSON`)
  }
}

// Structural problems throw; stage-geometry oddities come back as warnings.
export function parseCall(jsonl: string): ParseResult {
  const lines = jsonl
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)

  if (lines.length === 0) {
    throw new Error('Empty call log')
  }

  const header = CallHeaderSchema.safeParse(parseJsonLine(lines[0], 1))
  if (!header.success) {
    throw new Error(`Line 1 (call header): ${formatIssues(header.error)}`)
  }

  const turns: Turn[] = []
  for (let i = 1; i < lines.length; i++) {
    const lineNumber = i + 1
    const turn = TurnSchema.safeParse(parseJsonLine(lines[i], lineNumber))
    if (!turn.success) {
      throw new Error(`Line ${lineNumber} (turn): ${formatIssues(turn.error)}`)
    }
    turns.push(turn.data)
  }

  // Downstream code treats turn.index as its array position; enforce that regardless of what the log declared.
  const reindexed = turns.map((turn, i) => ({ ...turn, index: i }))

  const call: Call = {
    schemaVersion: header.data.schemaVersion,
    id: header.data.id,
    model: header.data.model,
    provider: header.data.provider,
    budgetMs: header.data.budgetMs,
    turns: reindexed,
  }

  return { call, warnings: checkGeometry(call) }
}
