import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  // Production is served from the GitHub Pages project subpath; dev stays at root.
  base: command === 'build' ? '/Voice-Agent-Latency-Profiler/' : '/',
  plugins: [react()],
  test: {
    // Logic (parsing, baseline math, rules) is environment-agnostic.
    // Switch to 'jsdom' per-file when we start testing React components.
    environment: 'node',
  },
}))
