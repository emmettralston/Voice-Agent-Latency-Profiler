// Fire conditions for the absolute-threshold rules. These are rules of thumb, not benchmarks: each is
// a trigger for advice, never a claim about what "good" is. The citable-benchmark layer lives in reference/.
// Most rules ride the call's own median or the user's budget instead; only these few need a fixed number.
export const THRESHOLDS = {
  // Above this, non-streaming TTS is likely synthesizing whole utterances before playback starts.
  ttsFirstAudioMs: 300,
  // Streaming STT surfaces partials well before this; a higher median suggests a batch transcription path.
  sttTranscribeMs: 400,
  // Endpointing much beyond this adds dead air the user hears as sluggishness.
  vadEndpointingMs: 250,
  // A single stage past this share of the response budget is the bottleneck worth naming.
  stageBudgetShare: 0.4,
}
