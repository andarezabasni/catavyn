import { useEffect, useRef } from 'react'
import { useTheme } from '../../context/ThemeContext'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  baseSize: number
  alpha: number
  maxAlpha: number
  life: number
  maxLife: number
  rotation: number
  vRot: number
  r: number
  g: number
  b: number
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
    const ctx = canvas.getContext('2d', { alpha: true })
    if (!ctx) return

    let animationFrameId: number
    let width = (canvas.width = window.innerWidth)
    let height = (canvas.height = window.innerHeight)

    const handleResize = () => {
      if (!canvas) return
      width = canvas.width = window.innerWidth
      height = canvas.height = window.innerHeight
    }
    window.addEventListener('resize', handleResize)

    // Palette Catavyn: warm gold, subtle sage green, warm paper mist
    const lightPalette = [
      { r: 196, g: 168, b: 77 }, // accent-gold (#C4A84D)
      { r: 107, g: 139, b: 106 }, // accent-green (#6B8B6A)
      { r: 196, g: 132, b: 77 }, // tag-personal warm orange (#C4844D)
      { r: 168, g: 155, b: 140 }, // paper smoke (#A89B8C)
    ]

    const darkPalette = [
      { r: 218, g: 188, b: 95 }, // glowing gold
      { r: 130, g: 170, b: 130 }, // luminous sage
      { r: 225, g: 160, b: 105 }, // ember
      { r: 180, g: 170, b: 160 }, // moonlight mist
    ]

    const particles: Particle[] = []
    const MAX_PARTICLES = 160

    let lastX = 0
    let lastY = 0
    let lastTime = performance.now()

    function spawnSmoke(x: number, y: number, vx: number, vy: number, speed: number) {
      const isHighVelocity = speed > 22
      const count = isHighVelocity ? 6 : Math.min(3, Math.max(1, Math.floor(speed / 4)))
      const palette = isDarkRef.current ? darkPalette : lightPalette

      for (let i = 0; i < count; i++) {
        if (particles.length >= MAX_PARTICLES) particles.shift()

        const color = palette[Math.floor(Math.random() * palette.length)]
        const angle = Math.random() * Math.PI * 2
        // Spread based on movement direction
        const spreadSpeed = (Math.random() * 1.5 + 0.5) * (isHighVelocity ? 2.5 : 1)
        const spreadX = Math.cos(angle) * spreadSpeed + vx * 0.15
        const spreadY = Math.sin(angle) * spreadSpeed + vy * 0.15 - 0.2 // subtle upward draft

        const baseSize = isHighVelocity
          ? Math.random() * 26 + 18
          : Math.random() * 14 + 10

        const maxLife = isHighVelocity ? Math.random() * 35 + 25 : Math.random() * 25 + 18
        const maxAlpha = isHighVelocity
          ? isDarkRef.current ? 0.35 : 0.28
          : isDarkRef.current ? 0.22 : 0.16

        particles.push({
          x: x + (Math.random() - 0.5) * 8,
          y: y + (Math.random() - 0.5) * 8,
          vx: spreadX,
          vy: spreadY,
          size: baseSize * 0.4,
          baseSize,
          alpha: maxAlpha,
          maxAlpha,
          life: 0,
          maxLife,
          rotation: Math.random() * Math.PI * 2,
          vRot: (Math.random() - 0.5) * 0.04,
          r: color.r,
          g: color.g,
          b: color.b,
          isShockwave: isHighVelocity,
        })
      }

      // If high velocity flick (hentakan cepat), spawn radiating shockwave ring particles
      if (isHighVelocity) {
        const ringCount = 8
        for (let i = 0; i < ringCount; i++) {
          if (particles.length >= MAX_PARTICLES) particles.shift()
          const ringAngle = (i / ringCount) * Math.PI * 2 + Math.random() * 0.2
          const ringSpeed = Math.random() * 3 + 3.5
          const goldColor = palette[0]

          particles.push({
            x,
            y,
            vx: Math.cos(ringAngle) * ringSpeed + vx * 0.2,
            vy: Math.sin(ringAngle) * ringSpeed + vy * 0.2,
            size: Math.random() * 10 + 6,
            baseSize: Math.random() * 18 + 12,
            alpha: isDarkRef.current ? 0.4 : 0.3,
            maxAlpha: isDarkRef.current ? 0.4 : 0.3,
            life: 0,
            maxLife: 20,
            rotation: 0,
            vRot: 0,
            r: goldColor.r,
            g: goldColor.g,
            b: goldColor.b,
            isShockwave: true,
          })
        }
      }
    }

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
      const speed = (dist / dt) * 16.67 // normalized speed per 60fps frame

      const vx = dx / (dt / 16.67)
      const vy = dy / (dt / 16.67)

      // Interpolate points for silky continuous smoke stream
      const steps = Math.min(6, Math.max(1, Math.floor(dist / 8)))
      for (let s = 1; s <= steps; s++) {
        const ratio = s / steps
        const ix = lastX + dx * ratio
        const iy = lastY + dy * ratio
        spawnSmoke(ix, iy, vx, vy, speed)
      }

      lastX = clientX
      lastY = clientY
      lastTime = now
    }

    window.addEventListener('mousemove', onPointerMove, { passive: true })
    window.addEventListener('touchmove', onPointerMove, { passive: true })

    // Render loop
    const render = () => {
      ctx.clearRect(0, 0, width, height)

      // Render smoke puff particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i]
        p.life++

        if (p.life >= p.maxLife) {
          particles.splice(i, 1)
          continue
        }

        // Physics: friction and buoyant drift
        p.x += p.vx
        p.y += p.vy
        p.vx *= 0.94
        p.vy *= 0.94
        p.rotation += p.vRot

        const progress = p.life / p.maxLife
        // Expand puff as it disperses
        p.size = p.baseSize * (0.5 + progress * 1.5)
        // Smooth fade out
        const currentAlpha = p.maxAlpha * (1 - Math.pow(progress, 1.2))

        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate(p.rotation)

        // Radial gradient for realistic soft volumetric smoke puff
        const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, p.size)
        grad.addColorStop(0, `rgba(${p.r}, ${p.g}, ${p.b}, ${currentAlpha})`)
        grad.addColorStop(0.45, `rgba(${p.r}, ${p.g}, ${p.b}, ${currentAlpha * 0.6})`)
        grad.addColorStop(0.8, `rgba(${p.r}, ${p.g}, ${p.b}, ${currentAlpha * 0.15})`)
        grad.addColorStop(1, `rgba(${p.r}, ${p.g}, ${p.b}, 0)`)

        ctx.fillStyle = grad
        ctx.beginPath()
        ctx.arc(0, 0, p.size, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      }

      animationFrameId = requestAnimationFrame(render)
    }

    render()

    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('mousemove', onPointerMove)
      window.removeEventListener('touchmove', onPointerMove)
      cancelAnimationFrame(animationFrameId)
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
