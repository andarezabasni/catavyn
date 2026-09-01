import { useEffect, useRef } from 'react'
import { useTheme } from '../../context/ThemeContext'

interface TrailPoint {
  x: number
  y: number
  vx: number
  vy: number
  age: number
  maxAge: number
  baseRadius: number
  r: number
  g: number
  b: number
  alpha: number
  isShockwave?: boolean
}

export default function FluidSmokeCursor() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const { isDark } = useTheme()
  const isDarkRef = useRef(isDark)

  useEffect(() => {
    isDarkRef.current = isDark
  }, [isDark])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let width = (canvas.width = window.innerWidth)
    let height = (canvas.height = window.innerHeight)

    const handleResize = () => {
      if (!canvas) return
      width = canvas.width = window.innerWidth
      height = canvas.height = window.innerHeight
    }
    window.addEventListener('resize', handleResize)

    // Palette: Jesper Landberg luxury fluid feel adapted to Catavyn (Gold & Sage mist)
    const lightPalette = [
      { r: 196, g: 168, b: 77 }, // #C4A84D Warm Gold
      { r: 107, g: 139, b: 106 }, // #6B8B6A Sage Green
      { r: 210, g: 155, b: 90 }, // Ember Amber
    ]

    const darkPalette = [
      { r: 230, g: 195, b: 95 }, // Luminous Gold
      { r: 140, g: 185, b: 140 }, // Luminous Sage
      { r: 240, g: 170, b: 110 }, // Warm Amber
    ]

    const points: TrailPoint[] = []
    const MAX_POINTS = 220

    let mouseX = -100
    let mouseY = -100
    let lastX = -100
    let lastY = -100
    let smoothX = -100
    let smoothY = -100
    let lastTime = performance.now()

    const onPointerMove = (e: MouseEvent | TouchEvent) => {
      const now = performance.now()
      const dt = Math.max(1, now - lastTime)
      const cx = 'touches' in e ? e.touches[0].clientX : e.clientX
      const cy = 'touches' in e ? e.touches[0].clientY : e.clientY

      if (lastX < 0) {
        lastX = smoothX = mouseX = cx
        lastY = smoothY = mouseY = cy
        lastTime = now
        return
      }

      mouseX = cx
      mouseY = cy

      const dx = cx - lastX
      const dy = cy - lastY
      const dist = Math.hypot(dx, dy)
      const speed = (dist / dt) * 16.67 // speed normalized

      const isHighVelocity = speed > 18
      const palette = isDarkRef.current ? darkPalette : lightPalette

      // Interpolate along movement vector for seamless continuous viscous fluid body
      const steps = Math.min(8, Math.max(2, Math.floor(dist / 6)))
      for (let s = 1; s <= steps; s++) {
        const ratio = s / steps
        const ix = lastX + dx * ratio
        const iy = lastY + dy * ratio

        if (points.length >= MAX_POINTS) points.shift()

        const col = palette[Math.floor(Math.random() * palette.length)]
        const baseRadius = isHighVelocity
          ? Math.min(65, 30 + speed * 0.9)
          : Math.min(38, 16 + speed * 0.4)

        const maxAge = isHighVelocity ? Math.random() * 40 + 35 : Math.random() * 26 + 20
        const alpha = isHighVelocity
          ? isDarkRef.current ? 0.38 : 0.32
          : isDarkRef.current ? 0.24 : 0.18

        points.push({
          x: ix,
          y: iy,
          vx: (dx / dt) * (Math.random() * 0.4 + 0.2),
          vy: (dy / dt) * (Math.random() * 0.4 + 0.2),
          age: 0,
          maxAge,
          baseRadius,
          r: col.r,
          g: col.g,
          b: col.b,
          alpha,
          isShockwave: isHighVelocity,
        })
      }

      // If high velocity flick (hentakan cepat), spawn fluid wave distortion ripples
      if (isHighVelocity) {
        const burstCount = 6
        for (let b = 0; b < burstCount; b++) {
          if (points.length >= MAX_POINTS) points.shift()
          const angle = Math.random() * Math.PI * 2
          const burstSpeed = Math.random() * 4 + 2
          const col = palette[0]

          points.push({
            x: cx + Math.cos(angle) * 8,
            y: cy + Math.sin(angle) * 8,
            vx: Math.cos(angle) * burstSpeed + (dx / dt) * 0.3,
            vy: Math.sin(angle) * burstSpeed + (dy / dt) * 0.3,
            age: 0,
            maxAge: 32,
            baseRadius: Math.random() * 45 + 25,
            r: col.r,
            g: col.g,
            b: col.b,
            alpha: isDarkRef.current ? 0.42 : 0.34,
            isShockwave: true,
          })
        }
      }

      lastX = cx
      lastY = cy
      lastTime = now
    }

    window.addEventListener('mousemove', onPointerMove, { passive: true })
    window.addEventListener('touchmove', onPointerMove, { passive: true })

    let animId: number

    const render = () => {
      ctx.clearRect(0, 0, width, height)

      // Smooth cursor leading aura (viscous trailing dot like Jesper Landberg)
      smoothX += (mouseX - smoothX) * 0.22
      smoothY += (mouseY - smoothY) * 0.22

      // Draw subtle ambient cursor glow
      if (smoothX > 0 && smoothY > 0) {
        const leadGrad = ctx.createRadialGradient(smoothX, smoothY, 0, smoothX, smoothY, 24)
        const gColor = isDarkRef.current ? '230, 195, 95' : '196, 168, 77'
        leadGrad.addColorStop(0, `rgba(${gColor}, 0.28)`)
        leadGrad.addColorStop(0.5, `rgba(${gColor}, 0.1)`)
        leadGrad.addColorStop(1, `rgba(${gColor}, 0)`)
        ctx.fillStyle = leadGrad
        ctx.beginPath()
        ctx.arc(smoothX, smoothY, 24, 0, Math.PI * 2)
        ctx.fill()
      }

      // Update and render fluid wave points with soft metaball radial gradients
      for (let i = points.length - 1; i >= 0; i--) {
        const p = points[i]
        p.age++

        if (p.age >= p.maxAge) {
          points.splice(i, 1)
          continue
        }

        // Fluid momentum and viscous damping
        p.x += p.vx
        p.y += p.vy
        p.vx *= 0.94
        p.vy *= 0.94

        const progress = p.age / p.maxAge
        // Fluid wave expands and dissipates smoothly
        const currentRadius = p.baseRadius * (0.6 + Math.sin(progress * Math.PI * 0.5) * 1.1)
        const currentAlpha = p.alpha * (1 - Math.pow(progress, 1.4))

        ctx.save()
        // Radial soft liquid glow gradient
        const radGrad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, currentRadius)
        radGrad.addColorStop(0, `rgba(${p.r}, ${p.g}, ${p.b}, ${currentAlpha})`)
        radGrad.addColorStop(0.35, `rgba(${p.r}, ${p.g}, ${p.b}, ${currentAlpha * 0.75})`)
        radGrad.addColorStop(0.7, `rgba(${p.r}, ${p.g}, ${p.b}, ${currentAlpha * 0.2})`)
        radGrad.addColorStop(1, `rgba(${p.r}, ${p.g}, ${p.b}, 0)`)

        ctx.fillStyle = radGrad
        ctx.beginPath()
        ctx.arc(p.x, p.y, currentRadius, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      }

      animId = requestAnimationFrame(render)
    }

    render()

    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('mousemove', onPointerMove)
      window.removeEventListener('touchmove', onPointerMove)
      cancelAnimationFrame(animId)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-50 h-full w-full select-none"
    />
  )
}
