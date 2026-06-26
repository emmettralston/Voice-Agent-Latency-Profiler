# Voice Agent Latency Profiler

> A waterfall latency profiler for voice agent calls. See **where the milliseconds go** — Voice Activity Detection (VAD) → Speech-to-Text (STT) → LLM Time to First Token (TTFT) → Text-to-Speeach (TTS) — across a whole call, find the slow turn and systematically-slow stage, and get a verdict on the likely cause and fix.

**Status:** early development.

## Quick start

```bash
npm install
npm run dev
```

Then open the local URL and load a bundled sample.

<!-- TODO(Phase 5): screenshot / GIF of the call overview + single-turn waterfall -->

## What it does

<!-- sync-docs:begin feature-list -->

- **Single-turn waterfall** — click a turn to see its VAD → STT → LLM TTFT → TTS stages on a time axis, with a configurable response-budget marker and over-budget stages flagged.
- **JSONL call format + validation** — a documented schema parsed and validated in the browser with clear errors; stage-geometry oddities (gaps, overlap, over-budget) surface as warnings.
- **Bundled samples** — realistic example calls with planted failure patterns to explore immediately.

_Planned:_ a multi-turn call overview comparing each turn to the call's own median, deterministic prescriptive rules, a top-level verdict, and a Pipecat adapter.

<!-- sync-docs:end feature-list -->

## Input

- **JSONL schema** — the documented format. See [`schema/SCHEMA.md`](./schema/SCHEMA.md).
- **Pipecat adapter** _(planned)_ — will map Pipecat trace output into the schema.
- **Bundled samples** — realistic example calls with planted failure patterns. See [`public/samples/`](./public/samples).

  **PRs welcome**.

## License

[MIT](./LICENSE)
