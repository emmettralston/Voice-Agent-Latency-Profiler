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

- **Call overview** — every turn's latency with stage breakdown, aligned so outlier turns and systematically-slow stages pop out against the call's own median.
- **Single-turn waterfall** — click a turn to see VAD → STT → LLM TTFT → TTS against a time axis, with a configurable response budget marker.
- **Prescriptive insights** — deterministic rules map detected patterns to concrete fixes (no LLM calls; free, instant, reproducible).
- **Verdict** — a top-level summary naming the dominant bottleneck and which rules fired.

## Input

- **JSONL schema** — the documented format. See [`schema/SCHEMA.md`](./schema/SCHEMA.md).
- **Pipecat adapter** — maps Pipecat trace output into the schema.
- **Bundled samples** — realistic example calls with planted failure patterns. See [`public/samples/`](./public/samples).

  **PRs welcome**.

## License

[MIT](./LICENSE)
