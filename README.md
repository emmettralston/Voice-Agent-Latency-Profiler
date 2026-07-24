# Voice Agent Latency Profiler

A web tool that shows where the time goes in a voice agent call. It reads a call log and breaks each turn into its four pipeline stages: VAD, STT, LLM, and TTS. Think of the network waterfall in browser devtools, but for a voice conversation.

## Try it live

**[emmettralston.github.io/Voice-Agent-Latency-Profiler](https://emmettralston.github.io/Voice-Agent-Latency-Profiler/)**

No install needed. Open the demo, click a bundled sample, and read the findings. Or drop in your own JSONL call log.

<!-- TODO(screenshot): add a still of the front door and a report with an open turn waterfall -->

## Why

When a voice agent feels slow, it is hard to see which stage in which turn caused it. Latency is a chain, and one bad stage in one turn can sink the whole response. This tool makes that clear. It compares each turn against the call's own median, flags the slow ones, and names the likely cause and the fix.

## What it does

<!-- sync-docs:begin feature-list -->

- **Load a call, no setup** - Drop a JSONL log onto the front door, or try a bundled sample. Everything runs in the browser.
- **Findings and a plain-language read** - Deterministic rules rank what is wrong, each with a likely cause, a concrete fix, and a label for what it measured against (your own median, your response budget, or a stated rule of thumb, never an outside benchmark). A clean call gets an explicit all-clear.
- **Turn overview** - Every turn sized and scored against the call's own median latency, with outlier turns flagged, a per-turn stage mini-bar, and a note when a stage keeps rising across the call.
- **Single-turn waterfall** - Click a turn and its VAD, STT, LLM, and TTS stages unfurl on a time axis, with a response-budget marker, per-turn geometry warnings, and a slot for citable reference numbers.
- **JSONL format with validation** - A documented schema, parsed and checked in the browser with clear errors.
- **Bundled samples** - Realistic example calls with planted failure patterns to explore right away.

_Planned:_ a Pipecat adapter and a citable per-stage benchmark layer.

<!-- sync-docs:end feature-list -->

## Quick start

```bash
npm install
npm run dev
```

Open the local URL, then drop in a JSONL log or click a bundled sample.

## Input

- **JSONL schema** - The documented format. See [`schema/SCHEMA.md`](./schema/SCHEMA.md).
- **Bundled samples** - Realistic example calls with planted failure patterns. See [`public/samples/`](./public/samples).
- **Pipecat adapter** _(planned)_ - Will map Pipecat trace output into the schema.

## Status

In progress. The core flow works. Load a call, read the findings at the top, scan the turns, and open any turn to see its stage waterfall.

Planned next: a Pipecat adapter for real logs, and a small set of citable per-stage reference numbers. Reference numbers are only ever added with a public, citable source, never fabricated. Have one to contribute? PRs welcome.

## License

[MIT](./LICENSE)
