import { writeFileSync } from 'node:fs'
import { z } from 'zod'
import { CallHeaderSchema, TurnSchema } from '../src/types/schema.ts'

// Generated from the Zod schemas so the documented format can't drift from the parser.
const lineSchema = z.union([CallHeaderSchema, TurnSchema])
const jsonSchema = z.toJSONSchema(lineSchema, { target: 'draft-2020-12' })

const outputPath = new URL('./schema.json', import.meta.url)
writeFileSync(outputPath, JSON.stringify(jsonSchema, null, 2) + '\n')

console.log(`Wrote ${outputPath.pathname}`)
