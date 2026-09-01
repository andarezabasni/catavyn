import { useEffect, useRef } from 'react'

export default function FluidSmokeCursor() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

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

    // Smooth inertia tracking (Jesper Landberg core principle)
    let targetX = width / 2
    let targetY = height / 2
    let currentX = width / 2
    let currentY = height / 2
    let isMoving = false
    let idleTimer: number

    // Trail history of positions for elastic jelly wave deformation
    const trailLength = 8
    const trail: { x: number; y: number }[] = []
    for (let i = 0; i < trailLength; i++) {
      trail.push({ x: currentX, y: currentY })
    }

    let vx = 0
    let vy = 0
    let lastX = width / 2
    let lastY = height / 2

    const onPointerMove = (e: MouseEvent | TouchEvent) => {
      const cx = 'touches' in e ? e.touches[0].clientX : e.clientX
      const cy = 'touches' in e ? e.touches[0].clientY : e.clientY

      targetX = cx
      targetY = cy
      isMoving = true

      window.clearTimeout(idleTimer)
      idleTimer = window.setTimeout(() => {
        isMoving = false
      }, 150)
    }

    window.addEventListener('mousemove', onPointerMove, { passive: true })
    window.addEventListener('touchmove', onPointerMove, { passive: true })

    let animId: number

    const render = () => {
      ctx.clearRect(0, 0, width, height)

      // Spring / Inertia physics towards cursor (slow, heavy, ultra-smooth)
      currentX += (targetX - currentX) * 0.12
      currentY += (targetY - currentY) * 0.12

      vx = targetX - lastX
      vy = targetY - lastY
      lastX = targetX
      lastY = targetY

      const speed = Math.hypot(vx, vy)
      const angle = Math.atan2(vy, vx)

      // Update smooth trail points
      trail[0].x = currentX
      trail[0].y = currentY
      for (let i = 1; i < trailLength; i++) {
        trail[i].x += (trail[i - 1].x - trail[i].x) * 0.35
        trail[i].y += (trail[i - 1].y - trail[i].y) * 0.35
      }

      // Draw the organic jelly/liquid deformation wave
      // When moving fast, it stretches into an oval droplet along movement angle
      const baseRadius = 24
      const stretch = Math.min(2.2, 1 + speed * 0.04)
      const shrink = Math.max(0.65, 1 / Math.sqrt(stretch))

      ctx.save()
      ctx.translate(currentX, currentY)
      ctx.rotate(angle)
      ctx.scale(stretch, shrink)

      // Soft ambient organic aura (backdrop distortion feel)
      const auraGrad = ctx.createRadialGradient(0, 0, 4, 0, 0, baseRadius * 1.8)
      auraGrad.addColorStop(0, 'rgba(196, 168, 77, 0.22)')
      auraGrad.addColorStop(0.5, 'rgba(196, 168, 77, 0.08)')
      auraGrad.addColorStop(1, 'rgba(196, 168, 77, 0)')

      ctx.fillStyle = auraGrad
      ctx.beginPath()
      ctx.arc(0, 0, baseRadius * 1.8, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()

      // Trailing trailing droplet tail
      if (speed > 2) {
        ctx.save()
        for (let i = 1; i < trailLength; i++) {
          const pt = trail[i]
          const ratio = 1 - i / trailLength
          const r = baseRadius * 0.9 * ratio
          const grad = ctx.createRadialGradient(pt.x, pt.y, 0, pt.x, pt.y, r)
          grad.addColorStop(0, `rgba(196, 168, 77, ${0.12 * ratio})`)
          grad.addColorStop(1, 'rgba(196, 168, 77, 0)')

          ctx.fillStyle = grad
          ctx.beginPath()
          ctx.arc(pt.x, pt.y, r, 0, Math.PI * 2)
          ctx.fill()
        }
        ctx.restore()
      }

      // Center crisp pinpoint
      ctx.save()
      ctx.beginPath()
      ctx.arc(targetX, targetY, isMoving ? 3.5 : 4.5, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(196, 168, 77, 0.75)'
      ctx.fill()
      ctx.restore()

      animId = requestAnimationFrame(render)
    }

    render()

    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('mousemove', onPointerMove)
      window.removeEventListener('touchmove', onPointerMove)
      window.clearTimeout(idleTimer)
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
