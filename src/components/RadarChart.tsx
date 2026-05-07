import { useEffect, useRef } from 'react'

interface RadarChartProps {
  data: { label: string; value: number }[]
  size?: number
  color?: string
  mini?: boolean
}

export default function RadarChart({ data, size = 200, color = '#F7FF19', mini = false }: RadarChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    canvas.width = size * dpr
    canvas.height = size * dpr
    canvas.style.width = `${size}px`
    canvas.style.height = `${size}px`
    ctx.scale(dpr, dpr)

    ctx.clearRect(0, 0, size, size)

    const cx = size / 2
    const cy = size / 2
    const radius = mini ? size * 0.38 : size * 0.36
    const n = data.length
    const angleStep = (Math.PI * 2) / n
    const startAngle = -Math.PI / 2

    // Grid rings
    const rings = mini ? 3 : 5
    for (let r = 1; r <= rings; r++) {
      ctx.beginPath()
      for (let i = 0; i < n; i++) {
        const angle = startAngle + i * angleStep
        const x = cx + (radius * r) / rings * Math.cos(angle)
        const y = cy + (radius * r) / rings * Math.sin(angle)
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
      }
      ctx.closePath()
      ctx.strokeStyle = r === rings ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.07)'
      ctx.lineWidth = r === rings ? 1 : 0.5
      ctx.stroke()
    }

    // Spokes
    if (!mini) {
      for (let i = 0; i < n; i++) {
        const angle = startAngle + i * angleStep
        ctx.beginPath()
        ctx.moveTo(cx, cy)
        ctx.lineTo(cx + radius * Math.cos(angle), cy + radius * Math.sin(angle))
        ctx.strokeStyle = 'rgba(255,255,255,0.08)'
        ctx.lineWidth = 0.5
        ctx.stroke()
      }
    }

    // Data polygon
    ctx.beginPath()
    data.forEach((d, i) => {
      const angle = startAngle + i * angleStep
      const r = (d.value / 100) * radius
      const x = cx + r * Math.cos(angle)
      const y = cy + r * Math.sin(angle)
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
    })
    ctx.closePath()
    ctx.fillStyle = color.replace(')', ', 0.25)').replace('rgb', 'rgba').replace('#F7FF19', 'rgba(247,255,25,0.22)')
    ctx.fill()
    ctx.strokeStyle = color
    ctx.lineWidth = mini ? 1.5 : 2
    ctx.stroke()

    // Dots
    data.forEach((d, i) => {
      const angle = startAngle + i * angleStep
      const r = (d.value / 100) * radius
      const x = cx + r * Math.cos(angle)
      const y = cy + r * Math.sin(angle)
      ctx.beginPath()
      ctx.arc(x, y, mini ? 2 : 3, 0, Math.PI * 2)
      ctx.fillStyle = color
      ctx.fill()
    })

    // Labels
    if (!mini) {
      ctx.font = `bold 10px Inter, sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillStyle = 'rgba(255,255,255,0.7)'
      const labelRadius = radius + 18
      data.forEach((d, i) => {
        const angle = startAngle + i * angleStep
        const x = cx + labelRadius * Math.cos(angle)
        const y = cy + labelRadius * Math.sin(angle)
        ctx.fillText(d.label, x, y)
      })
    }
  }, [data, size, color, mini])

  return <canvas ref={canvasRef} style={{ width: size, height: size }} />
}
