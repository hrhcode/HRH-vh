<template>
  <!-- 技术栈弹窗：覆盖层 + 可视化画布 + 信息面板 -->
  <div v-if="open" class="fixed inset-0 z-[100]">
    <div class="overlay" @click="emitClose" />
    <div class="modal mx-auto p-0 rounded-lg overflow-hidden" role="dialog" aria-modal="true">
      <button class="modal-close" aria-label="关闭" @click="emitClose">×</button>
      <header class="modal-header">
        <div class="flex items-center gap-3">
          <span aria-hidden class="text-2xl">💻</span>
          <h2 class="modal-title">全栈工程师</h2>
        </div>
      </header>
      <section class="modal-body column">
        <div class="pane center">
          <canvas ref="cloudCanvas" class="viz-canvas" aria-hidden></canvas>
        </div>
        <aside class="info below">
          <h3 class="info-title">技术栈</h3>
          <p class="info-text">{{ infoText }}</p>
        </aside>
      </section>
    </div>
  </div>
  <!-- /技术栈弹窗 -->
</template>

<script setup lang="ts">
import { ref, watch, onBeforeUnmount } from 'vue'
const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ (e: 'close'): void }>()
/**
 * 关闭弹窗
 */
function emitClose() { emit('close') }

/**
 * 视图数据状态
 */
const cloudCanvas = ref<HTMLCanvasElement | null>(null)
const defaultInfo = '「路漫漫其修远兮，吾将上下而求索。」'
const infoText = ref<string>(defaultInfo)
const hoveredIndex = ref<number | null>(null)
const techItems = ref<Array<{ name: string; desc: string; icon: string; size: number }>>([])

/**
 * 从后端加载技术栈云数据
 */
async function loadCloudData() {
  const mapArea = (tags: string[] = []) => {
    const t = tags.map(s => s.toLowerCase())
    if (t.includes('frontend') || t.includes('css') || t.includes('spa')) return 'frontend'
    if (t.includes('backend') || t.includes('server')) return 'backend'
    if (t.includes('ops') || t.includes('devops') || t.includes('nginx')) return 'ops'
    return 'tool'
  }
  try {
    // 通过 Nginx 反向代理，统一使用相对路径
    const res = await fetch('/api/skills')
    const ct = res.headers.get('content-type') || ''
    if (!res.ok || !ct.includes('application/json')) {
      throw new Error('技能接口不可用或返回非JSON')
    }
    const list = await res.json()
    techItems.value = Array.isArray(list)
      ? list.map((s: any, i: number) => ({ name: s.name, desc: s.desc ?? '', icon: s.icon, size: 3 + (i % 3) }))
      : []
  } catch {}
}

/**
 * 初始化球面技术栈云（3D球面+磁线，词条正对用户）
 */
function initSphereCloud() {
  const canvas = cloudCanvas.value!
  const ctx = canvas.getContext('2d')!
  const root = getComputedStyle(document.documentElement)
  const neon = (root.getPropertyValue('--link-color') || '#00d4ff').trim()
  const bg = (root.getPropertyValue('--modal-bg') || '#0b1020').trim()
  const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1))
  let width = 0, height = 0, raf = 0
  const fov = 400
  let rotX = 0, rotY = 0
  let vx = 0, vy = 0
  const inertia = 0.92
  const radiusFactor = 0.42
  const rotateSpeed = 0.003
  let lastDirX = 0, lastDirY = 1
  let rotXTarget = 0, rotYTarget = 0
  let focusing = false
  const mouse = { x: 0, y: 0, down: false, lx: 0, ly: 0 }
  const items = techItems.value.map(t => ({ ...t, theta: 0, y: 0, x: 0, z: 0, px: 0, py: 0, scale: 1, ds: 1 })) as Array<any>
  let edges: Array<{ i: number; j: number; type: 'near' | 'ring' }> = []
  let introProgress = 0

  /**
   * 设置画布大小与标签极坐标布局
   */
  function setup() {
    const rect = canvas.getBoundingClientRect()
    width = Math.floor(rect.width)
    height = Math.floor(rect.height)
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`
    canvas.width = Math.floor(width * dpr)
    canvas.height = Math.floor(height * dpr)
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.scale(dpr, dpr)
  }

  function distribute() {
    const N = items.length
    const golden = Math.PI * (3 - Math.sqrt(5))
    for (let i = 0; i < N; i++) {
      const y = 1 - (i / Math.max(1, N - 1)) * 2
      const radius = Math.sqrt(Math.max(0, 1 - y * y))
      const theta = golden * i
      items[i].theta = theta
      items[i].y = y
      items[i].x = Math.cos(theta) * radius
      items[i].z = Math.sin(theta) * radius
    }
    buildEdges()
  }

  /**
   * 生成磁感线（环形+近邻）
   */
  function buildEdges() {
    edges = []
    const N = items.length
    // 环形保证整体连接
    for (let i = 0; i < N; i++) edges.push({ i, j: (i + 1) % N, type: 'ring' })
    // 近邻（按角距离挑选两个）
    for (let i = 0; i < N; i++) {
      const base = items[i]
      const candidates = items
        .map((it, j) => ({ j, d: angleDistance(base, it) }))
        .filter(c => c.j !== i)
        .sort((a, b) => a.d - b.d)
        .slice(0, 2)
      candidates.forEach(c => edges.push({ i, j: c.j, type: 'near' }))
    }
  }

  /**
   * 球面角距离
   */
  function angleDistance(a: any, b: any) {
    const dot = a.x * b.x + a.y * b.y + a.z * b.z
    return Math.acos(Math.max(-1, Math.min(1, dot)))
  }

  /**
   * 绘制技术栈云
   */
  /**
   * 更新旋转与投影（自转方向跟随最近拖拽方向）
   */
  function update() {
    // 依据最近的惯性速度确定自转方向
    const mag = Math.hypot(vx, vy)
    if (mag > 0.0001) { lastDirX = vx / mag; lastDirY = vy / mag }
    if (focusing) {
      // 缓动旋转到目标
      const s = 0.08
      rotX += (rotXTarget - rotX) * s
      rotY += (rotYTarget - rotY) * s
      vx *= 0.9; vy *= 0.9
      if (Math.abs(rotXTarget - rotX) < 0.0008 && Math.abs(rotYTarget - rotY) < 0.0008) {
        focusing = false
      }
    } else {
      rotX += vx + rotateSpeed * lastDirX
      rotY += vy + rotateSpeed * lastDirY
    }
    vx *= inertia; vy *= inertia
    // 球心向外散开动效（Ease-Out）
    introProgress = Math.min(1, introProgress + 0.03)
    const ease = 1 - Math.pow(1 - introProgress, 3)
    const R = Math.min(width, height) * radiusFactor * ease
    const sinX = Math.sin(rotX), cosX = Math.cos(rotX)
    const sinY = Math.sin(rotY), cosY = Math.cos(rotY)
    for (const it of items) {
      let x = it.x, y = it.y, z = it.z
      let y1 = y * cosX - z * sinX
      let z1 = y * sinX + z * cosX
      let x2 = x * cosY + z1 * sinY
      let z2 = -x * sinY + z1 * cosY
      const depth = z2 * R
      const scale = fov / (fov + depth)
      it.px = width / 2 + x2 * R * scale
      it.py = height / 2 + y1 * R * scale
      it.scale = scale
      it.ds += (it.scale - it.ds) * 0.12
    }
  }

  /**
   * 将选中词条旋转到正前方
   */
  function focusItem(i: number) {
    const it = items[i]
    const x = it.x, y = it.y, z = it.z
    // 先绕X使垂直居中：y1 = 0
    rotXTarget = Math.atan2(y, z)
    const z1 = y * Math.sin(rotXTarget) + z * Math.cos(rotXTarget)
    // 再绕Y使水平居中：x2 = 0
    rotYTarget = Math.atan2(-x, z1) + Math.PI
    focusing = true
  }

  /**
   * 绘制磁感线（能量流渐变）
   */
  function renderEdges(tick: number) {
    for (const e of edges) {
      const a = items[e.i], b = items[e.j]
      const alpha = Math.min(a.scale, b.scale)
      const p = (Math.sin(tick * 0.02 + e.i) + 1) / 2
      const grad = ctx.createLinearGradient(a.px, a.py, b.px, b.py)
      grad.addColorStop(Math.max(0, p - 0.2), `rgba(0,212,255,0)`)
      grad.addColorStop(p, `rgba(0,212,255,${0.55 * alpha})`)
      grad.addColorStop(Math.min(1, p + 0.2), `rgba(0,212,255,0)`)
      // 悬停相关线增强
      const active = hoveredIndex.value != null && (hoveredIndex.value === e.i || hoveredIndex.value === e.j)
      // 基础磁线：保持可见的连线
      const baseWidth = (active ? 1.4 : 1.0) * (0.6 + alpha)
      ctx.strokeStyle = `rgba(0,212,255,${0.18 * (0.6 + alpha)})`
      ctx.lineWidth = baseWidth
      ctx.beginPath(); ctx.moveTo(a.px, a.py); ctx.lineTo(b.px, b.py); ctx.stroke()
      // 叠加能量流渐变
      ctx.strokeStyle = grad as any
      ctx.lineWidth = baseWidth * (active ? 1.5 : 1.2)
      ctx.beginPath(); ctx.moveTo(a.px, a.py); ctx.lineTo(b.px, b.py); ctx.stroke()
    }
  }

  function renderLabels() {
    let nearestIdx: number | null = null
    let nearestDist = Infinity
    for (let i = 0; i < items.length; i++) {
      const it = items[i]
      const near = Math.hypot(it.px - mouse.x, it.py - mouse.y)
      const glow = Math.max(0, 1 - near / 160)
      const isHovered = hoveredIndex.value === i
      const fontSize = (8 + it.size * 3 * it.ds) * (isHovered ? 1.2 : 1)
      ctx.font = `${fontSize}px system-ui, Segoe UI, Arial`
      ctx.shadowColor = neon
      ctx.shadowBlur = (6 + glow * 16 * it.ds) * (isHovered ? 1.2 : 1)
      ctx.fillStyle = `rgba(255,255,255,${(0.7 + glow * 0.3) * (isHovered ? 1 : 0.95)})`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(it.name, it.px, it.py)
      const threshold = (18 + it.size * 2) * it.ds
      if (near < threshold && near < nearestDist) { nearestDist = near; nearestIdx = i }
    }
    if (nearestIdx !== hoveredIndex.value) {
      hoveredIndex.value = nearestIdx
      infoText.value = nearestIdx != null ? (items[nearestIdx].desc || defaultInfo) : defaultInfo
    }
  }

  let tick = 0
  function loop() {
    tick++
    ctx.clearRect(0, 0, width, height)
    update()
    renderEdges(tick)
    renderLabels()
    raf = requestAnimationFrame(loop)
  }

  /**
   * 启动渲染循环与事件
   */
  function bind() {
    canvas.addEventListener('mousedown', (e) => { mouse.down = true; mouse.lx = e.clientX; mouse.ly = e.clientY })
    window.addEventListener('mouseup', () => { mouse.down = false })
    canvas.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect()
      mouse.x = e.clientX - rect.left
      mouse.y = e.clientY - rect.top
      if (mouse.down) {
        const dx = e.clientX - mouse.lx
        const dy = e.clientY - mouse.ly
        mouse.lx = e.clientX; mouse.ly = e.clientY
        vy += dx * 0.002
        vx += dy * 0.002
      }
    })
    // 触控支持：手机端拖拽旋转
    canvas.addEventListener('touchstart', (e) => {
      if (e.touches.length === 0) return; e.preventDefault()
      const t = e.touches[0]
      mouse.down = true; mouse.lx = t.clientX; mouse.ly = t.clientY
    }, { passive: false })
    canvas.addEventListener('touchmove', (e) => {
      if (e.touches.length === 0) return; e.preventDefault()
      const t = e.touches[0]
      const rect = canvas.getBoundingClientRect()
      mouse.x = t.clientX - rect.left
      mouse.y = t.clientY - rect.top
      if (mouse.down) {
        const dx = t.clientX - mouse.lx
        const dy = t.clientY - mouse.ly
        mouse.lx = t.clientX; mouse.ly = t.clientY
        vy += dx * 0.002
        vx += dy * 0.002
      }
    }, { passive: false })
    canvas.addEventListener('touchend', () => { mouse.down = false })
    canvas.addEventListener('touchcancel', () => { mouse.down = false })
    canvas.addEventListener('mouseleave', () => { hoveredIndex.value = null; infoText.value = defaultInfo })
    canvas.addEventListener('click', () => { if (hoveredIndex.value != null) focusItem(hoveredIndex.value) })
    window.addEventListener('resize', setup)
  }

  setup(); distribute(); bind(); loop()
  onBeforeUnmount(() => cancelAnimationFrame(raf))
}

/**
 * 打开弹窗时加载数据并初始化技术栈云
 */
watch(() => props.open, async (v) => {
  if (!v) return
  await loadCloudData()
  setTimeout(() => { initSphereCloud() }, 50)
})
</script>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(0,0,0,0.35);
  backdrop-filter: blur(6px);
}
.modal {
  position: relative;
  margin-top: 8vh;
  background-color: var(--modal-bg);
  border: 2px solid var(--link-color);
  border-radius: 18px;
  box-shadow: var(--modal-shadow);
  will-change: box-shadow;
}
.modal { width: 90vw; }
@media (min-width: 768px) { .modal { width: 68vw; } }
@media (min-width: 1280px) { .modal { width: 56vw; } }
.modal::after {
  content: "";
  position: absolute;
  inset: -3px;
  border-radius: 20px;
  pointer-events: none;
  box-shadow: 0 0 0 0 rgba(0, 212, 255, 0.2), 0 0 12px rgba(0, 212, 255, 0.25);
  animation: modalPulse 2.4s ease-in-out infinite;
}
@keyframes modalPulse {
  0% { box-shadow: 0 0 0 0 rgba(0, 212, 255, 0.2), 0 0 12px rgba(0, 212, 255, 0.25); }
  50% { box-shadow: 0 0 0 3px rgba(0, 212, 255, 0.5), 0 0 24px rgba(0, 212, 255, 0.7); }
  100% { box-shadow: 0 0 0 0 rgba(0, 212, 255, 0.2), 0 0 12px rgba(0, 212, 255, 0.25); }
}
.modal-title { color: var(--fg); font-weight: 800; font-size: 1.35rem; }
.modal-text { color: var(--muted); }
.modal-quote { color: var(--muted); font-style: italic; }
.section-title { color: var(--fg); font-weight: 700; }
.modal-close {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  width: 32px;
  height: 32px;
  display: grid;
  place-items: center;
  border-radius: 9999px;
  border: 2px solid var(--link-color);
  background-color: transparent;
  color: var(--link-color);
  font-weight: 900;
  cursor: pointer;
  transition: transform 160ms ease, box-shadow 160ms ease, background-color 160ms ease, border-color 160ms ease, color 160ms ease;
  will-change: transform, box-shadow;
}
.modal-close:hover {
  transform: translateY(-1px) scale(1.05);
  background-color: rgba(59, 130, 246, 0.12);
  box-shadow: 0 0 12px rgba(0, 212, 255, 0.35), 0 6px 14px rgba(0, 0, 0, 0.35);
}
.modal-close:active {
  transform: translateY(0) scale(0.94);
  box-shadow: 0 0 6px rgba(0, 212, 255, 0.25), 0 2px 6px rgba(0, 0, 0, 0.25);
}
.modal-close:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px rgba(0, 212, 255, 0.6), 0 0 12px rgba(0, 212, 255, 0.45);
}
/* 点击涟漪效果 */
.modal-close::after {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  pointer-events: none;
  transform: scale(0.6);
  opacity: 0;
}
.modal-close:active::after {
  animation: rippleFx 420ms ease-out;
}
@keyframes rippleFx {
  0% { opacity: 0.35; transform: scale(0.6); box-shadow: 0 0 0 0 rgba(0, 212, 255, 0.6); }
  60% { opacity: 0.15; transform: scale(1.25); box-shadow: 0 0 0 10px rgba(0, 212, 255, 0.25); }
  100% { opacity: 0; transform: scale(1.45); box-shadow: 0 0 0 16px rgba(0, 212, 255, 0.0); }
}

.modal-header { padding: 1rem 1.25rem 0.5rem; border-bottom: 1px solid rgba(6,182,212,0.2); }
.modal-body.column { display: flex; flex-direction: column; min-height: 60vh; }
.pane.center { flex: 1; display: grid; place-items: center; }
.viz-canvas { width: 92%; height: 48vh; display: block; mix-blend-mode: normal; background-color: transparent; }
.info.below { padding: 1rem 1.25rem; text-align: center; }
.info-title { color: var(--fg); font-weight: 800; }
.info-text, .info-meta { color: var(--muted); }
.info-text { white-space: pre-line; }
</style>