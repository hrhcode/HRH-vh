<template>
  <div class="min-h-screen flex flex-col relative">
    <canvas ref="globalCanvas" class="global-bg" aria-hidden></canvas>
    <!-- 首页按钮：单击导航，1.5 秒内五连击打开管理员弹窗；悬浮展示品牌层叠效果 -->
    <a href="/" aria-label="返回首页" class="home-btn brand-hover" @click="onHomeClick">
      <span class="brand-layer brand-default"><span aria-hidden>🏠</span> 首页</span>
      <span class="brand-layer brand-alt">HRH</span>
      <!-- <img class="brand-icon" src="/icons/网站图标.jpg" alt="" />  -->
    </a>
    <div class="flex-1">
      <Hero />
    </div>
    <Footer />
    <AdminModal :open="adminOpen" @close="closeAdmin" @submit="submitAdmin" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from "vue";
import Hero from "./components/Hero.vue";
import Footer from "./components/Footer.vue";
import AdminModal from "./components/AdminModal.vue";

/**
 * 全局交互式科幻背景：覆盖整个视口的星空 + 霓虹网络
 */
const globalCanvas = ref<HTMLCanvasElement | null>(null);
const adminOpen = ref(false);
let clickCount = 0;
let firstClickAt = 0;
let navTimer: number | null = null;

/**
 * 处理首页按钮点击：
 * - 单击：在很短的延迟后导航到首页（避免与多击冲突）
 * - 1.5 秒内达到五连击：取消导航并打开管理员弹窗
 */
function onHomeClick(e: MouseEvent) {
  e.preventDefault();
  const now = Date.now();
  // 超时或首次点击则重置窗口
  if (clickCount === 0 || now - firstClickAt > 1500) {
    clickCount = 0;
    firstClickAt = now;
  }
  clickCount++;

  // 达到五连击：取消待导航，打开弹窗
  if (clickCount >= 5) {
    clickCount = 0;
    firstClickAt = 0;
    if (navTimer) { clearTimeout(navTimer); navTimer = null; }
    adminOpen.value = true;
    return;
  }

  // 尚未达到五击：安排一次轻微延迟的导航；如果期间继续点击，则重新安排
  if (navTimer) { clearTimeout(navTimer); }
  navTimer = window.setTimeout(() => {
    // 若在窗口期内已继续点击到五次，这里不会执行（已被清除）
    navTimer = null;
    clickCount = 0;
    firstClickAt = 0;
    // 无路由情况下使用硬导航到首页
    window.location.assign('/');
  }, 220);
}

/**
 * 关闭管理员弹窗
 */
function closeAdmin() { adminOpen.value = false; }

/**
 * 管理员提交编辑：调用后端持久化并广播更新（Hero 监听刷新展示）
 */
async function submitAdmin(payload: { visits?: number, visitors?: number, likes?: number }) {
  try {
    const res = await fetch('/api/admin/stats', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const ct = res.headers.get('content-type') || '';
    if (!res.ok || !ct.includes('application/json')) return;
    const data = await res.json();
    const stats = data.stats || payload;
    window.dispatchEvent(new CustomEvent('hrh-admin-update', { detail: stats }));
  } catch {}
}

/**
 * 初始化并启动全局背景动画
 */
function initGlobalBackground() {
  const canvas = globalCanvas.value!;
  const ctx = canvas.getContext("2d")!;

  const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
  let width = 0;
  let height = 0;
  let animationId = 0;

  // 主题色读取（回退为霓虹蓝）
  const rootStyles = getComputedStyle(document.documentElement);
  const neon = (rootStyles.getPropertyValue("--link-color") || "#00d4ff").trim();
  const bg = (rootStyles.getPropertyValue("--modal-bg") || "#0b1020").trim();

  // 鼠标状态（平滑跟随）
  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };

  // 星星与节点容器
  let stars: Array<{ x: number; y: number; z: number; s: number; vx: number; vy: number }> = [];
  let nodes: Array<{ x: number; y: number }> = [];
  let ripples: Array<{ x: number; y: number; r: number; life: number }>= [];

  /**
   * 设置画布尺寸为全视口
   */
  function setupCanvas() {
    width = Math.floor(window.innerWidth);
    height = Math.floor(window.innerHeight);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
  }

  /**
   * 创建星空粒子
   */
  function createStars(count = 160) {
    stars = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      z: Math.random() * 1 + 0.4,
      s: Math.random() * 1.2 + 0.3,
      vx: (Math.random() - 0.5) * 0.2,
      vy: (Math.random() - 0.5) * 0.2,
    }));
  }

  /**
   * 创建霓虹网络节点（规则网格轻度抖动）
   */
  function createNodes(grid = 160) {
    const cols = Math.max(6, Math.floor(width / grid));
    const rows = Math.max(4, Math.floor(height / grid));
    nodes = [];
    for (let r = 0; r <= rows; r++) {
      for (let c = 0; c <= cols; c++) {
        const jitter = 12;
        nodes.push({
          x: c * grid + (Math.random() - 0.5) * jitter,
          y: r * grid + (Math.random() - 0.5) * jitter,
        });
      }
    }
  }

  /**
   * 绘制星空层
   */
  function drawStars() {
    ctx.save();
    ctx.fillStyle = bg;
    ctx.globalAlpha = 0.85;
    ctx.fillRect(0, 0, width, height);

    ctx.globalAlpha = 1;
    for (const st of stars) {
      st.x += st.vx + (mouse.x - width / 2) * 0.0006;
      st.y += st.vy + (mouse.y - height / 2) * 0.0006;
      if (st.x < -10) st.x = width + 10;
      if (st.x > width + 10) st.x = -10;
      if (st.y < -10) st.y = height + 10;
      if (st.y > height + 10) st.y = -10;

      const r = st.s * st.z;
      const g = ctx.createRadialGradient(st.x, st.y, 0, st.x, st.y, r * 6);
      g.addColorStop(0, `${neon}ff`);
      g.addColorStop(1, `${neon}00`);
      ctx.fillStyle = g as unknown as string;
      ctx.beginPath();
      ctx.arc(st.x, st.y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  /**
   * 绘制霓虹网络（靠近鼠标的节点被激活）
   */
  function drawNetwork(time: number) {
    const pulse = (Math.sin(time * 0.002) + 1) * 0.5;
    for (const n of nodes) {
      const dx = n.x - mouse.x;
      const dy = n.y - mouse.y;
      const dist = Math.hypot(dx, dy);
      const radius = 220;

      if (dist < radius * 1.2) {
        const alpha = Math.max(0, 1 - dist / (radius * 1.2));
        ctx.fillStyle = `rgba(0, 212, 255, ${0.08 + alpha * 0.35})`;
        ctx.beginPath();
        ctx.arc(n.x, n.y, 1.6 + pulse * 0.8, 0, Math.PI * 2);
        ctx.fill();
      }

      if (dist < radius) {
        const alpha = Math.max(0, 1 - dist / radius) * (0.5 + pulse * 0.4);
        ctx.strokeStyle = `rgba(0, 212, 255, ${alpha})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(n.x, n.y);
        ctx.lineTo(mouse.x, mouse.y);
        ctx.stroke();
      }
    }
  }

  /**
   * 绘制鼠标涟漪（仅点击触发的同心波纹）
   */
  function drawRipples() {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (const rp of ripples) {
      rp.r += 2.2;
      rp.life -= 0.015;
      if (rp.life <= 0) continue;
      ctx.strokeStyle = `rgba(0,212,255,${rp.life * 0.6})`;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(rp.x, rp.y, rp.r, 0, Math.PI * 2);
      ctx.stroke();
    }
    ripples = ripples.filter(r => r.life > 0);
    ctx.restore();
  }

  /**
   * 主循环：清屏 + 星空 + 网络 + 涟漪
   */
  function loop(time: number) {
    ctx.clearRect(0, 0, width, height);
    drawStars();
    drawNetwork(time);
    drawRipples();
    animationId = requestAnimationFrame(loop);
  }

  /**
   * 处理窗口尺寸变化
   */
  function handleResize() {
    setupCanvas();
    createStars();
    createNodes();
  }

  /**
   * 鼠标移动时更新目标坐标（带有缓动）
   */
  function handleMouse(e: MouseEvent) {
    mouse.tx = e.clientX;
    mouse.ty = e.clientY;
  }

  /**
   * 鼠标点击触发同心波纹
   */
  function handleClick(e: MouseEvent) {
    ripples.push({ x: e.clientX, y: e.clientY, r: 2, life: 1 });
  }

  /**
   * 启动平滑跟随的插值定时器
   */
  function startMouseLerp() {
    const lerp = () => {
      mouse.x += (mouse.tx - mouse.x) * 0.08;
      mouse.y += (mouse.ty - mouse.y) * 0.08;
      requestAnimationFrame(lerp);
    };
    lerp();
  }

  // 初始化
  handleResize();
  mouse.x = width / 2;
  mouse.y = height / 2;
  mouse.tx = mouse.x;
  mouse.ty = mouse.y;
  startMouseLerp();
  animationId = requestAnimationFrame(loop);

  // 事件监听
  window.addEventListener("resize", handleResize);
  window.addEventListener("mousemove", handleMouse, { passive: true });
  window.addEventListener("click", handleClick, { passive: true });

  // 清理函数
  onBeforeUnmount(() => {
    cancelAnimationFrame(animationId);
    window.removeEventListener("resize", handleResize);
    window.removeEventListener("mousemove", handleMouse);
    window.removeEventListener("click", handleClick);
  });
}

/**
 * Vue 生命周期：挂载时开启全局背景
 */
onMounted(() => {
  initGlobalBackground();
});
</script>

<style scoped>
.global-bg {
  position: fixed;
  inset: 0;
  pointer-events: none;
  mix-blend-mode: screen;
  opacity: 0.9;
  z-index: 0;
}
.home-btn {
  position: fixed;
  top: 2rem;
  left: 2rem;
  z-index: 60;
  display: inline-block;
  padding: 0.6rem 1rem;
  border-radius: 9999px;
  border: 2px solid var(--link-color);
  color: var(--link-color);
  background-color: rgba(0,0,0,0.25);
  backdrop-filter: blur(6px);
  font-weight: 700;
  font-size: 1.2rem;
  transition: transform 180ms ease, box-shadow 180ms ease, background-color 180ms ease, border-color 180ms ease, color 180ms ease;
  overflow: hidden;
}
.home-btn:hover { transform: translateY(-1px) scale(1.2); box-shadow: 0 6px 14px rgba(0,0,0,0.25), 0 0 10px rgba(0,212,255,0.35); background-color: rgba(0,0,0,0.35); }
.home-btn:active { transform: translateY(0) scale(0.96); }

.home-icon { width: 20px; height: 20px; border-radius: 4px; box-shadow: 0 0 10px rgba(0,212,255,0.35); }
</style>