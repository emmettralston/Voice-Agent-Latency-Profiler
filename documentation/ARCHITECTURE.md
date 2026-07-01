# Architecture

A pure client-side SPA: it reads JSONL call logs in the browser, validates them, and renders
a per-turn latency waterfall. There is no backend and no LLM in the analysis path.

## Module map

<!-- sync-docs:begin module-map -->

- `types/` — shared TypeScript types, derived from Zod schemas: `Call`, `Turn`, `Stage`, `StageTiming`, and the `ReferencePoint` benchmark slot.
- `ingest/` — JSONL parsing and validation (`parseCall`) plus the non-fatal stage-geometry warning pass (`checkGeometry`, `turnLatencyMs`).
- `analysis/` — within-call comparison math (`stageMedians`, `latencyMedian`, `turnComparison`, `outlierTurns`, `trendingStage`); every signal is relative to the call's own median, no absolute thresholds.
- `reference/` — the v1.1 per-stage reference-number slot (`referencePoints`), empty until numbers are cited.
- `components/Waterfall/` — the single-turn SVG waterfall: pure `layout` math (`scaleLinear`, `buildTicks`, `layoutTurn`), the `Waterfall` view, and shared stage colors/labels.
- `components/CallOverview/` — the multi-turn overview: per-turn rows with stage mini-bars and median-relative ratio badges, plus a summary strip naming the rising stage and outlier turns.

<!-- sync-docs:end module-map -->

## Component graph

<!-- sync-docs:begin architecture -->

```mermaid
flowchart LR
  samples["public/samples/*.jsonl"] --> ingest["ingest<br/>parseCall + checkGeometry"]
  ingest --> types["types<br/>Call / Turn"]
  types --> analysis["analysis<br/>baseline (median / outliers / trend)"]
  types --> waterfall["components/Waterfall"]
  analysis --> overview["components/CallOverview"]
  reference["reference<br/>ReferencePoint slot"] --> waterfall
  overview --> app["App"]
  waterfall --> app
  analysis -.-> rules["rules / verdict (planned)"]
  rules -.-> app
```

<!-- sync-docs:end architecture -->

## Stage pipeline (data flow)

The waterfall measures one turn's pipeline. Time-zero is the moment the user stops speaking;
each stage's duration is measured from there, and a turn's latency is the end of TTS first-audio.

<!-- sync-docs:begin data-flow -->

```mermaid
flowchart LR
  speech["User stops speaking<br/>t = 0"] --> vad["VAD<br/>endpointing wait"]
  vad --> stt["STT<br/>transcript finalize"]
  stt --> llm["LLM<br/>time to first token"]
  llm --> tts["TTS<br/>first audio chunk"]
  tts --> resp["Response starts<br/>latency = end of TTS"]
```

<!-- sync-docs:end data-flow -->
