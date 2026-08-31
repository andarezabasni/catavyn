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
    const gl = (canvas.getContext('webgl2') || canvas.getContext('webgl') || canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null
    if (!gl) return

    let width = (canvas.width = Math.floor(window.innerWidth / 2))
    let height = (canvas.height = Math.floor(window.innerHeight / 2))

    const handleResize = () => {
      if (!canvas) return
      width = canvas.width = Math.floor(window.innerWidth / 2)
      height = canvas.height = Math.floor(window.innerHeight / 2)
      gl.viewport(0, 0, width, height)
    }
    window.addEventListener('resize', handleResize)

    // Minimal high-performance fluid shader
    const vertShaderSrc = `
      attribute vec2 a_pos;
      varying vec2 v_uv;
      void main() {
        v_uv = a_pos * 0.5 + 0.5;
        gl_Position = vec4(a_pos, 0.0, 1.0);
      }
    `

    const fragShaderSrc = `
      precision highp float;
      varying vec2 v_uv;
      uniform sampler2D u_tex;
      uniform vec2 u_mouse;
      uniform vec2 u_vel;
      uniform float u_time;
      uniform vec3 u_color;
      uniform float u_decay;
      uniform float u_aspect;

      void main() {
        vec2 uv = v_uv;
        // Advect with slight curl distortion
        vec2 offset = texture2D(u_tex, uv).xy * 0.003;
        vec4 prev = texture2D(u_tex, uv - offset) * u_decay;

        // Splat at mouse
        vec2 m = u_mouse;
        vec2 diff = (uv - m);
        diff.x *= u_aspect;
        float d = length(diff);
        float splat = exp(-d * d * 800.0) * length(u_vel) * 0.08;

        vec3 col = prev.rgb + u_color * splat;
        gl_FragColor = vec4(col, max(prev.a * u_decay, splat * 1.5));
      }
    `

    function createShader(glCtx: WebGLRenderingContext, type: number, src: string) {
      const shader = glCtx.createShader(type)!
      glCtx.shaderSource(shader, src)
      glCtx.compileShader(shader)
      return shader
    }

    const program = gl.createProgram()!
    gl.attachShader(program, createShader(gl, gl.VERTEX_SHADER, vertShaderSrc))
    gl.attachShader(program, createShader(gl, gl.FRAGMENT_SHADER, fragShaderSrc))
    gl.linkProgram(program)
    gl.useProgram(program)

    // Fullscreen quad
    const quadBuf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW)
    const aPos = gl.getAttribLocation(program, 'a_pos')
    gl.enableVertexAttribArray(aPos)
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0)

    // Double buffer FBOs for silky ping-pong fluid persistence
    function createFBO() {
      const tex = gl!.createTexture()!
      gl!.bindTexture(gl!.TEXTURE_2D, tex)
      gl!.texImage2D(gl!.TEXTURE_2D, 0, gl!.RGBA, width, height, 0, gl!.RGBA, gl!.UNSIGNED_BYTE, null)
      gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_MIN_FILTER, gl!.LINEAR)
      gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_MAG_FILTER, gl!.LINEAR)
      gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_WRAP_S, gl!.CLAMP_TO_EDGE)
      gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_WRAP_T, gl!.CLAMP_TO_EDGE)

      const fbo = gl!.createFramebuffer()!
      gl!.bindFramebuffer(gl!.FRAMEBUFFER, fbo)
      gl!.framebufferTexture2D(gl!.FRAMEBUFFER, gl!.COLOR_ATTACHMENT0, gl!.TEXTURE_2D, tex, 0)
      return { fbo, tex }
    }

    let fbo1 = createFBO()
    let fbo2 = createFBO()

    const uTex = gl.getUniformLocation(program, 'u_tex')
    const uMouse = gl.getUniformLocation(program, 'u_mouse')
    const uVel = gl.getUniformLocation(program, 'u_vel')
    const uColor = gl.getUniformLocation(program, 'u_color')
    const uDecay = gl.getUniformLocation(program, 'u_decay')
    const uAspect = gl.getUniformLocation(program, 'u_aspect')

    let mouseX = 0.5
    let mouseY = 0.5
    let velX = 0
    let velY = 0
    let lastX = 0
    let lastY = 0

    const onMove = (e: MouseEvent | TouchEvent) => {
      const cx = 'touches' in e ? e.touches[0].clientX : e.clientX
      const cy = 'touches' in e ? e.touches[0].clientY : e.clientY

      const curX = cx / window.innerWidth
      const curY = 1.0 - cy / window.innerHeight

      velX = (curX - lastX) * 50
      velY = (curY - lastY) * 50
      mouseX = curX
      mouseY = curY
      lastX = curX
      lastY = curY
    }

    window.addEventListener('mousemove', onMove, { passive: true })
    window.addEventListener('touchmove', onMove, { passive: true })

    let animId: number

    const render = () => {
      // Damping velocity
      velX *= 0.88
      velY *= 0.88

      // Palette: Warm Gold / Subtle Sage
      const color = isDarkRef.current
        ? [0.77, 0.66, 0.30] // Glowing Gold in dark mode
        : [0.65, 0.55, 0.28] // Warm refined parchment gold

      // Step 1: Render into FBO2 reading from FBO1
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo2.fbo)
      gl.viewport(0, 0, width, height)
      gl.activeTexture(gl.TEXTURE0)
      gl.bindTexture(gl.TEXTURE_2D, fbo1.tex)
      gl.uniform1i(uTex, 0)
      gl.uniform2f(uMouse, mouseX, mouseY)
      gl.uniform2f(uVel, velX, velY)
      gl.uniform3f(uColor, color[0], color[1], color[2])
      gl.uniform1f(uDecay, 0.955)
      gl.uniform1f(uAspect, width / height)
      gl.drawArrays(gl.TRIANGLES, 0, 6)

      // Step 2: Render to screen
      gl.bindFramebuffer(gl.FRAMEBUFFER, null)
      gl.viewport(0, 0, width, height)
      gl.bindTexture(gl.TEXTURE_2D, fbo2.tex)
      gl.drawArrays(gl.TRIANGLES, 0, 6)

      // Swap buffers
      const temp = fbo1
      fbo1 = fbo2
      fbo2 = temp

      animId = requestAnimationFrame(render)
    }

    render()

    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('touchmove', onMove)
      cancelAnimationFrame(animId)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-50 h-full w-full opacity-60 mix-blend-screen dark:mix-blend-screen select-none"
    />
  )
}
