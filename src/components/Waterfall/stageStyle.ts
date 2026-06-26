import type { Stage } from '../../types/schema'

export const STAGE_COLORS: Record<Stage, string> = {
  vad: '#5B7CFA',
  stt: '#22D3EE',
  llm: '#FBBF24',
  tts: '#FB6F92',
}

export const STAGE_LABELS: Record<Stage, string> = {
  vad: 'VAD',
  stt: 'STT',
  llm: 'LLM',
  tts: 'TTS',
}
