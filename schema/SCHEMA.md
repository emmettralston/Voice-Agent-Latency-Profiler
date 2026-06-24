# Call log schema

A call log is a [JSON Lines](https://jsonlines.org/) (`.jsonl`) file. The **first
line** is a `call` header; **every subsequent line** is a `turn`, in order.

`schema.json` in this folder is the [JSON Schema](https://json-schema.org/)
for a single line. It is **generated** from the Zod definitions in
[`src/types/schema.ts`](../src/types/schema.ts) — edit those, then run
`npm run schema:gen`. Don't hand-edit `schema.json`.

## Timing model

Time-zero for a turn is **the moment the user stops speaking** — the latency that
matters is the dead air before the agent responds, not how long the user talked.

Every stage is `{ startMs, durationMs }`, measured from that time-zero. Storing an
explicit start (rather than chaining durations) lets a log show **unattributed gaps**
between stages — queueing, network, framework overhead — and streaming **overlap**,
both of which a profiler should surface.

| Stage | Meaning                                                                                                                                    |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `vad` | Endpointing wait — the silence the system waits through before deciding the user is done. Often the largest tunable chunk of felt latency. |
| `stt` | Time to finalize the transcript after endpointing.                                                                                         |
| `llm` | Time to first token (TTFT) — first token is what unblocks TTS, not full generation.                                                        |
| `tts` | Time to the first audio chunk.                                                                                                             |

A turn's headline latency is `tts.startMs + tts.durationMs` — when the first audio
reaches the user.

## Call header line

```json
{
  "type": "call",
  "schemaVersion": 1,
  "id": "support-call-01",
  "model": "gpt-4o",
  "provider": "openai",
  "budgetMs": 1500
}
```

| Field           | Type     | Required | Notes                                       |
| --------------- | -------- | -------- | ------------------------------------------- |
| `type`          | `"call"` | yes      | Discriminates the header line.              |
| `schemaVersion` | `1`      | yes      | Format version.                             |
| `id`            | string   | yes      | Call identifier.                            |
| `model`         | string   | yes      | Default LLM for the call.                   |
| `provider`      | string   | yes      | Default LLM provider.                       |
| `budgetMs`      | number   | no       | Response budget marker. Defaults to `1500`. |

## Turn line

```json
{
  "type": "turn",
  "index": 0,
  "userText": "...",
  "promptTokens": 850,
  "sttStreaming": true,
  "ttsStreaming": true,
  "stages": {
    "vad": { "startMs": 0, "durationMs": 220 },
    "stt": { "startMs": 220, "durationMs": 180 },
    "llm": { "startMs": 400, "durationMs": 540 },
    "tts": { "startMs": 940, "durationMs": 280 }
  }
}
```

| Field                | Type     | Required | Notes                                                           |
| -------------------- | -------- | -------- | --------------------------------------------------------------- |
| `type`               | `"turn"` | yes      | Discriminates a turn line.                                      |
| `index`              | integer  | yes      | 0-based turn order.                                             |
| `userText`           | string   | yes      | The user's utterance.                                           |
| `stages`             | object   | yes      | All four stages, each `{ startMs, durationMs }`, non-negative.  |
| `promptTokens`       | integer  | no       | Prompt size; feeds the context-bloat rule. Strongly encouraged. |
| `sttStreaming`       | boolean  | no       | Defaults to `false`.                                            |
| `ttsStreaming`       | boolean  | no       | Defaults to `false`.                                            |
| `model` / `provider` | string   | no       | Per-turn override of the call defaults.                         |

Unknown fields are ignored, so the format can grow without breaking existing logs.

## Adding your own logs

Other trace formats are welcome via an adapter that maps onto this schema — **PRs
welcome**.
