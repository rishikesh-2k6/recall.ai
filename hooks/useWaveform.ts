"use client"

import { useRef, useEffect, useCallback } from "react"

export function useWaveform(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  isRecording: boolean,
  stream?: MediaStream | null
) {
  const animFrameRef = useRef<number>(0)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)

  const drawIdle = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const w = canvas.width
    const h = canvas.height
    const time = Date.now() / 1000

    ctx.clearRect(0, 0, w, h)

    // Gentle sine wave in muted accent color
    ctx.strokeStyle = "rgba(124, 110, 240, 0.3)"
    ctx.lineWidth = 2
    ctx.beginPath()
    for (let x = 0; x < w; x++) {
      const y = h / 2 + Math.sin((x / w) * 4 * Math.PI + time * 2) * 12
        + Math.sin((x / w) * 6 * Math.PI + time * 1.5) * 6
      if (x === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.stroke()

    animFrameRef.current = requestAnimationFrame(drawIdle)
  }, [canvasRef])

  const drawActive = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    const analyser = analyserRef.current

    const w = canvas.width
    const h = canvas.height

    ctx.clearRect(0, 0, w, h)

    if (analyser) {
      const dataArray = new Uint8Array(analyser.frequencyBinCount)
      analyser.getByteFrequencyData(dataArray)

      const bars = 48
      const barWidth = w / bars
      for (let i = 0; i < bars; i++) {
        const amplitude = dataArray[i * 3] / 255
        const barH = Math.max(amplitude * h * 0.8, 2)
        
        // gradient purple for bars
        const gradient = ctx.createLinearGradient(0, h / 2 - barH / 2, 0, h / 2 + barH / 2)
        gradient.addColorStop(0, "rgba(124, 110, 240, 0.9)")
        gradient.addColorStop(1, "rgba(124, 110, 240, 0.3)")
        ctx.fillStyle = gradient
        
        const x = i * barWidth + 2
        const bw = barWidth - 4
        const radius = Math.min(bw / 2, 3)
        
        // Rounded bars
        ctx.beginPath()
        ctx.roundRect(x, h / 2 - barH / 2, bw, barH, radius)
        ctx.fill()
      }
    } else {
      // Simulated bars when no real audio analyser
      const bars = 48
      const barWidth = w / bars
      const time = Date.now() / 1000
      for (let i = 0; i < bars; i++) {
        const amplitude = (Math.sin(time * 3 + i * 0.4) + 1) / 2 * 0.5 + 0.1
        const barH = amplitude * h * 0.7
        const gradient = ctx.createLinearGradient(0, h / 2 - barH / 2, 0, h / 2 + barH / 2)
        gradient.addColorStop(0, "rgba(240, 92, 92, 0.9)")
        gradient.addColorStop(1, "rgba(240, 92, 92, 0.3)")
        ctx.fillStyle = gradient
        
        const x = i * barWidth + 2
        const bw = barWidth - 4
        const radius = Math.min(bw / 2, 3)
        ctx.beginPath()
        ctx.roundRect(x, h / 2 - barH / 2, bw, barH, radius)
        ctx.fill()
      }
    }

    animFrameRef.current = requestAnimationFrame(drawActive)
  }, [canvasRef])

  // Set up audio analyser when stream is available
  useEffect(() => {
    if (isRecording && stream) {
      try {
        const audioCtx = new AudioContext()
        const source = audioCtx.createMediaStreamSource(stream)
        const analyser = audioCtx.createAnalyser()
        analyser.fftSize = 256
        source.connect(analyser)
        audioCtxRef.current = audioCtx
        analyserRef.current = analyser
      } catch (e) {
        console.warn("Could not create audio analyser:", e)
      }
    }

    return () => {
      if (audioCtxRef.current) {
        audioCtxRef.current.close()
        audioCtxRef.current = null
        analyserRef.current = null
      }
    }
  }, [isRecording, stream])

  // Start/stop draw loop
  useEffect(() => {
    cancelAnimationFrame(animFrameRef.current)

    if (isRecording) {
      drawActive()
    } else {
      drawIdle()
    }

    return () => cancelAnimationFrame(animFrameRef.current)
  }, [isRecording, drawActive, drawIdle])
}
