import { useEffect, useRef } from 'react'

export default function BobyardCanvasIntro() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    // We will build this step-by-step in the tutorial
  }, [])

  return (
    <div style={{ width: '100%', height: '55vh', border: '1px solid #d4d4d8', borderRadius: 8 }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
    </div>
  )
}
