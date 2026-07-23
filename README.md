# Voice Agent Latency Profiler

A web tool that shows where the time goes in a voice agent call. It reads a call log and breaks each turn into its four pipeline stages: VAD, STT, LLM, and TTS. Think of the network waterfall in browser devtools, but for a voice conversation.

## Why

When a voice agent feels slow, it is hard to see which stage in which turn caused it. This tool makes that clear. It compares each turn against the call's own median, flags the slow ones, and names the likely cause and fix.

## Quick start

```bash
npm install
npm run dev
```

Open the local URL. Drop in your own JSONL call log, or try one of the bundled sample calls.

## Status

In progress. The core flow works. Load a call, read the verdict at the top, scan the turns, and open any turn to see its stage waterfall.

A fuller README with screenshots, an adapter for Pipecat logs, and reference benchmark numbers are planned.

## License

MIT
