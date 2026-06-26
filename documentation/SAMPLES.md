# Bundled samples

The example call logs in [`public/samples/`](../public/samples), fetched by the app at runtime.
Each has realistic, jittered timings with a clearly planted failure pattern so the tool's reading
of a call is easy to demo. Load one from the sample picker.

<!-- sync-docs:begin sample-catalog -->

| Sample                    | Planted pattern                                                                                                               |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `healthy-call.jsonl`      | Well-tuned baseline — streaming on, every turn comfortably under the 1500ms budget, no warnings. The control case.            |
| `context-bloat.jsonl`     | LLM TTFT and prompt-token count climb turn over turn as history accumulates; the later turns blow the budget.                 |
| `tts-not-streaming.jsonl` | Non-streaming TTS pinned high (~460–580ms) every turn, plus a planted slow-STT outlier turn, creeping endpointing, and a gap. |

<!-- sync-docs:end sample-catalog -->
