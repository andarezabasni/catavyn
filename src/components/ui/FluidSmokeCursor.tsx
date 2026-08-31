import { useEffect, useRef } from 'react'
import { useTheme } from '../../context/ThemeContext'

interface RibbonPoint {
  x: number
  y: number
  vx: number
  vy: number
  age: number
  maxAge: number
  width: number
  color: string
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

    const points: RibbonPoint[] = []
    let lastX = 0
    let lastY = 0
    let lastTime = performance.now()

    const onPointerMove = (e: MouseEvent | TouchEvent) => {
      const now = performance.now()
      const dt = Math.max(1, now - lastTime)
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY

      if (lastX === 0 && lastY === 0) {
        lastX = clientX
        lastY = clientY
        lastTime = now
        return
      }

      const dx = clientX - lastX
      const dy = clientY - lastY
      const dist = Math.hypot(dx, dy)
      const speed = (dist / dt) * 16.67 // speed normalized

      const isHighVelocity = speed > 20
      const pointWidth = isHighVelocity ? Math.min(38, 16 + speed * 0.4) : Math.min(22, 10 + speed * 0.25)
      const maxAge = isHighVelocity ? 35 : 22

      // Catavyn palette
      const gold = isDarkRef.current ? '218, 178, 85' : '196, 168, 77'
      const sage = isDarkRef.current ? '135, 175, 135' : '107, 139, 106'
      const activeColor = isHighVelocity ? gold : (Math.random() > 0.4 ? gold : sage)

      // Add point with velocity momentum
      points.push({
        x: clientX,
        y: clientY,
        vx: (dx / dt) * 2,
        vy: (dy / dt) * 2,
        age: 0,
        maxAge,
        width: pointWidth,
        color: activeColor,
      })

      // If high velocity flick (hentakan cepat), inject expanding shockwave trail puffs
      if (isHighVelocity) {
        for (let i = 0; i < 3; i++) {
          const angle = Math.random() * Math.PI * 2
          const puffSpeed = Math.random() * 3 + 2
          points.push({
            x: clientX + Math.cos(angle) * 6,
            y: clientY + Math.sin(angle) * 6,
            vx: Math.cos(angle) * puffSpeed + (dx / dt) * 1.2,
            vy: Math.sin(angle) * puffSpeed + (dy / dt) * 1.2,
            age: 0,
            maxAge: 25,
            width: Math.random() * 24 + 14,
            color: gold,
          })
        }
      }

      lastX = clientX
      lastY = clientY
      lastTime = now
    }

    window.addEventListener('mousemove', onPointerMove, { passive: true })
    window.addEventListener('touchmove', onPointerMove, { passive: true })

    let animId: number

    const render = () => {
      ctx.clearRect(0, 0, width, height)

      // Age points and apply fluid drift
      for (let i = points.length - 1; i >= 0; i--) {
        const pt = points[i]
        pt.age++
        pt.x += pt.vx
        pt.y += pt.vy
        pt.vx *= 0.92
        pt.vy *= 0.92

        if (pt.age >= pt.maxAge) {
          points.splice(i, 1)
        }
      }

      // Draw smooth flowing ribbon curve
      if (points.length > 2) {
        for (let i = 1; i < points.length; i++) {
          const p0 = points[i - 1]
          const p1 = points[i]
          const progress = p1.age / p1.maxAge
          const alpha = (1 - progress) * (isDarkRef.current ? 0.35 : 0.28)
          const currentWidth = p1.width * (1 - progress * 0.5)

          ctx.save()
          ctx.beginPath()
          ctx.moveTo(p0.x, p0.y)
          ctx.lineTo(p1.x, p1.y)
          ctx.lineCap = 'round'
          ctx.lineJoin = 'round'
          ctx.lineWidth = currentWidth
          ctx.strokeStyle = `rgba(${p1.color}, ${alpha})`
          ctx.stroke()
          ctx.restore()
        }
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
