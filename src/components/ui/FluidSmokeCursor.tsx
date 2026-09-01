import { useEffect, useRef } from 'react'
import { useTheme } from '../../context/ThemeContext'

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

    // Interactive Displacement & Subtle Mist Trail
    interface Ripple {
      x: number
      y: number
      radius: number
      maxRadius: number
      strength: number
      life: number
      maxLife: number
      vx: number
      vy: number
    }

    interface MistParticle {
      x: number
      y: number
      vx: number
      vy: number
      size: number
      alpha: number
      life: number
      maxLife: number
    }

    const ripples: Ripple[] = []
    const mist: MistParticle[] = []

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

      // Spawn subtle water/fluid wave ripple (Jesper Landberg style displacement)
      if (dist > 4) {
        ripples.push({
          x: cx,
          y: cy,
          radius: 12,
          maxRadius: Math.min(130, 45 + speed * 1.6),
          strength: Math.min(1.0, 0.2 + speed * 0.03),
          life: 0,
          maxLife: 42,
          vx: (dx / dt) * 0.4,
          vy: (dy / dt) * 0.4,
        })
        if (ripples.length > 35) ripples.shift()
      }

      // Spawn very light, airy ambient mist (translucent, non-distracting)
      if (Math.random() > 0.3) {
        mist.push({
          x: cx + (Math.random() - 0.5) * 10,
          y: cy + (Math.random() - 0.5) * 10,
          vx: (dx / dt) * 0.15 + (Math.random() - 0.5) * 0.5,
          vy: (dy / dt) * 0.15 - 0.15, // light buoyant rise
          size: Math.random() * 22 + 16,
          alpha: isDarkRef.current ? 0.12 : 0.08,
          life: 0,
          maxLife: Math.random() * 30 + 25,
        })
        if (mist.length > 50) mist.shift()
      }

      // If high-velocity shockwave flick, trigger expanding distortion wave
      if (speed > 22) {
        for (let r = 0; r < 2; r++) {
          ripples.push({
            x: cx + (Math.random() - 0.5) * 15,
            y: cy + (Math.random() - 0.5) * 15,
            radius: 20,
            maxRadius: 180 + speed * 1.5,
            strength: 0.9,
            life: 0,
            maxLife: 55,
            vx: (dx / dt) * 0.6,
            vy: (dy / dt) * 0.6,
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

      // Smooth lag target cursor
      smoothX += (mouseX - smoothX) * 0.2
      smoothY += (mouseY - smoothY) * 0.2

      const goldR = isDarkRef.current ? 220 : 196
      const goldG = isDarkRef.current ? 185 : 168
      const goldB = isDarkRef.current ? 90 : 77

      // 1. Render Jesper Landberg Fluid Displacement Wave Rings
      for (let i = ripples.length - 1; i >= 0; i--) {
        const rip = ripples[i]
        rip.life++
        rip.x += rip.vx
        rip.y += rip.vy
        rip.vx *= 0.95
        rip.vy *= 0.95

        const progress = rip.life / rip.maxLife
        const curRadius = rip.radius + (rip.maxRadius - rip.radius) * Math.sin(progress * Math.PI * 0.5)
        const curAlpha = (1 - progress) * rip.strength * (isDarkRef.current ? 0.18 : 0.12)

        if (rip.life >= rip.maxLife) {
          ripples.splice(i, 1)
          continue
        }

        ctx.save()
        ctx.beginPath()
        ctx.arc(rip.x, rip.y, curRadius, 0, Math.PI * 2)
        ctx.lineWidth = Math.max(1, (1 - progress) * 6)
        ctx.strokeStyle = `rgba(${goldR}, ${goldG}, ${goldB}, ${curAlpha})`
        ctx.stroke()

        // Subtle fluid refraction wave fill
        const grad = ctx.createRadialGradient(rip.x, rip.y, curRadius * 0.4, rip.x, rip.y, curRadius)
        grad.addColorStop(0, `rgba(${goldR}, ${goldG}, ${goldB}, 0)`)
        grad.addColorStop(0.7, `rgba(${goldR}, ${goldG}, ${goldB}, ${curAlpha * 0.4})`)
        grad.addColorStop(1, `rgba(${goldR}, ${goldG}, ${goldB}, 0)`)
        ctx.fillStyle = grad
        ctx.fill()
        ctx.restore()
      }

      // 2. Render airy translucent mist (halus & tidak tebal)
      for (let m = mist.length - 1; m >= 0; m--) {
        const pt = mist[m]
        pt.life++
        pt.x += pt.vx
        pt.y += pt.vy
        pt.vx *= 0.95
        pt.vy *= 0.95

        const prog = pt.life / pt.maxLife
        const curSize = pt.size * (0.8 + prog * 0.6)
        const curAlpha = pt.alpha * (1 - prog)

        if (pt.life >= pt.maxLife) {
          mist.splice(m, 1)
          continue
        }

        ctx.save()
        const mistGrad = ctx.createRadialGradient(pt.x, pt.y, 0, pt.x, pt.y, curSize)
        mistGrad.addColorStop(0, `rgba(${goldR}, ${goldG}, ${goldB}, ${curAlpha})`)
        mistGrad.addColorStop(0.5, `rgba(${goldR}, ${goldG}, ${goldB}, ${curAlpha * 0.4})`)
        mistGrad.addColorStop(1, `rgba(${goldR}, ${goldG}, ${goldB}, 0)`)
        ctx.fillStyle = mistGrad
        ctx.beginPath()
        ctx.arc(pt.x, pt.y, curSize, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      }

      // 3. Subtle floating leading aura at pointer
      if (smoothX > 0 && smoothY > 0) {
        ctx.save()
        const auraGrad = ctx.createRadialGradient(smoothX, smoothY, 0, smoothX, smoothY, 28)
        auraGrad.addColorStop(0, `rgba(${goldR}, ${goldG}, ${goldB}, ${isDarkRef.current ? 0.2 : 0.14})`)
        auraGrad.addColorStop(0.5, `rgba(${goldR}, ${goldG}, ${goldB}, 0.05)`)
        auraGrad.addColorStop(1, `rgba(${goldR}, ${goldG}, ${goldB}, 0)`)
        ctx.fillStyle = auraGrad
        ctx.beginPath()
        ctx.arc(smoothX, smoothY, 28, 0, Math.PI * 2)
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
