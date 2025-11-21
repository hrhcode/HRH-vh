<template>
  <section ref="sectionEl" class="min-h-[70vh] md:min-h-[80vh] h-full grid place-items-center relative overflow-hidden">
    <canvas ref="bgCanvas" class="bg-canvas absolute inset-0 z-0" aria-hidden></canvas>
    <div class="text-center space-y-6 relative z-10 hero-up">
      <h1
        v-motion
        :initial="{ opacity: 0, y: -20 }"
        :enter="{ opacity: 1, y: 0 }"
        class="text-4xl md:text-6xl font-extrabold tracking-widest"
        style="text-shadow: var(--glow)"
      >
        <span ref="titleSpan" class="select-none hero-top" style="color: var(--hero-hello-color)">人类朋友，你好</span>
        <span ref="subtitleContainer" class="block text-2xl md:text-3xl leading-relaxed md:leading-loose mt-4 md:mt-6 select-none hero-scale"></span>
      </h1>
      
      <div class="flex items-center justify-center gap-4">
        <button ref="heroBtn" type="button" class="select btn btn-primary btn-pill text-lg md:text-xl inline-flex items-center gap-2 btn-hidden btn-draggable hero-big-btn" @click="openModal"><span aria-hidden="true">💻</span> 全栈工程师</button>
      </div>
    </div>
    <div v-if="cardsVisible" class="cards-row cards-enter">
      <button ref="likeCard" class="card stats-card" @click="likeOnce">
        <div class="card-stats">
          <div class="stat"><span aria-hidden>👀</span><div class="num">{{ stats.visits }}</div><div class="label">访问数</div></div>
          <div class="stat"><span aria-hidden>🧑</span><div class="num">{{ stats.visitors }}</div><div class="label">访客数</div></div>
          <div class="stat"><span aria-hidden ref="heartIcon">❤️</span><div class="num">{{ stats.likes }}</div><div class="label">点赞</div></div>
        </div>
      </button>
      <button class="card" @click="openProjects">
        <div class="card-title">我的项目</div>
      </button>
      <button class="card" @click="confirmCSDN">
        <div class="card-title">我的文章</div>
      </button>
    </div>
  </section>
  <TechStackModal :open="modalOpen" @close="closeModal" />
  <ProjectsModal :open="projectsOpen" @close="closeProjects" />
  <div class="toast-stack">
    <div
      v-for="(t,i) in toasts"
      :key="t.id"
      class="toast"
      :class="t.type"
      :style="{ '--offset': (i*12) + 'px', '--z': (100 - i) }"
    >
      {{ t.message }}
    </div>
  </div>
  <div v-if="nameInfoOpen" class="confirm-overlay">
    <div class="confirm-modal" :style="{ borderColor: 'var(--link-color)' }">
      <div class="confirm-title" :style="{ color: 'var(--link-color)' }">名字的由来——</div>
      <div class="confirm-text">这是我真名的拼音首字母啦。</div>
      <div class="confirm-actions">
        <button type="button" class="btn btn-pill" @click="closeNameInfo">知道了</button>
      </div>
    </div>
  </div>
  <div v-if="articleConfirmOpen" class="confirm-overlay">
    <div class="confirm-modal">
      <div class="confirm-title"><span aria-hidden>⚠️</span> 跳转到 CSDN</div>
      <div class="confirm-text">是否跳转到CSDN？</div>
      <div class="confirm-actions">
        <button type="button" class="btn btn-primary btn-pill" @click="goCSDN">确定</button>
        <button type="button" class="btn btn-pill" @click="closeArticleConfirm">取消</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from "vue";
import TechStackModal from "./TechStackModal.vue";
import ProjectsModal from "./ProjectsModal.vue";

/**
 * 控制技术栈弹窗的显示状态
 */
const modalOpen = ref(false);
const projectsOpen = ref(false);
const cardsVisible = ref(false);
const stats = ref<{ visits: number; visitors: number; likes: number }>({ visits: 0, visitors: 0, likes: 0 });
const likeCard = ref<HTMLElement | null>(null);
const heartIcon = ref<HTMLElement | null>(null);
const likedOnce = ref(false);
const toasts = ref<Array<{ id: number; message: string; type: 'ok' | 'warn' }>>([]);
const articleConfirmOpen = ref(false);
/**
 * 名字由来警示框显示状态
 */
const nameInfoOpen = ref(false);

/**
 * 显示顶部提示（自动消失）
 */
function showToast(message: string, type: 'ok' | 'warn' = 'ok', ttl = 2200) {
  const id = Date.now() + Math.random();
  toasts.value.unshift({ id, message, type });
  if (toasts.value.length > 3) toasts.value = toasts.value.slice(0, 3);
  window.setTimeout(() => {
    toasts.value = toasts.value.filter(t => t.id !== id);
  }, ttl);
}

/**
 * 从心形图标上方缓慢飘出爱心（上方随机角度，逐渐淡出直至消失）
 */
function spawnFireworks() {
  const heartSpan = heartIcon.value;
  if (!heartSpan) return;
  const rect = heartSpan.getBoundingClientRect();
  const startX = rect.left + rect.width / 2;
  const startY = rect.top - rect.height * 0.4;
  const el = document.createElement('div');
  el.textContent = '❤️';
  el.style.position = 'fixed';
  el.style.left = '0';
  el.style.top = '0';
  el.style.transform = `translate(${startX}px, ${startY}px)`;
  el.style.fontSize = '1.6rem';
  el.style.pointerEvents = 'none';
  el.style.zIndex = '95';
  el.style.filter = 'drop-shadow(0 0 8px rgba(0,212,255,0.6))';
  el.style.willChange = 'transform, opacity';
  document.body.appendChild(el);

  const angle = -Math.PI / 2 + (Math.random() - 0.5) * (Math.PI * 0.6);
  const speed = 0.22; // px/ms
  const sway = (Math.random() - 0.5) * 0.06; // 轻微左右摆动
  const duration = 1400; // ms
  const start = performance.now();
  let last = start;
  let x = startX;
  let y = startY;
  let rot = (Math.random() - 0.5) * 16; // 轻微旋转角度

  function step(now: number) {
    const dt = now - last; last = now;
    const t = Math.min(1, (now - start) / duration);
    const v = speed * (1 - t * 0.85); // 距离越远速度越慢（近快远慢）
    x += Math.cos(angle) * v * dt + Math.sin(now * 0.005) * (sway * (1 - t));
    y += Math.sin(angle) * v * dt; // 向上渐慢
    (el.style as any).transform = `translate(${x}px, ${y}px) rotate(${rot}deg)`;
    el.style.opacity = String(1 - t);
    if (t < 1) {
      requestAnimationFrame(step);
    } else {
      el.remove();
    }
  }
  requestAnimationFrame(step);
}

/**
 * 打开技术栈弹窗
 */
function openModal() {
  modalOpen.value = true;
}

/**
 * 关闭技术栈弹窗
 */
function closeModal() {
  modalOpen.value = false;
}
function openProjects() { projectsOpen.value = true; }
function closeProjects() { projectsOpen.value = false; }

/**
 * 从后端拉取站点访问统计
 */
async function loadStats() {
  try {
    const res = await fetch('/api/stats');
    const ct = res.headers.get('content-type') || '';
    if (!res.ok || !ct.includes('application/json')) return;
    const data = await res.json();
    stats.value = data;
  } catch {}
}

/**
 * 记录一次页面访问：向后端提交访问数 +1，并本地更新显示
 */
async function recordVisit() {
  try {
    // 乐观更新：无论接口是否可用，先在本地 +1，确保视觉反馈
    stats.value.visits = (stats.value.visits ?? 0) + 1;
    const res = await fetch('/api/visit', { method: 'POST' });
    const ct = res.headers.get('content-type') || '';
    if (!res.ok || !ct.includes('application/json')) return;
    const data = await res.json();
    if (typeof data.visits === 'number') stats.value.visits = data.visits;
  } catch {}
}

/**
 * 点赞 +1 并刷新显示
 */
/**
 * 点赞：首赞触发服务端 + 提示“谢谢你的点赞~”；多次则仅提示“点过了嗷！再点要收你点赞费了！”
 */
async function likeOnce() {
  try {
    spawnFireworks();
    const first = !likedOnce.value;
    const res = await fetch('/api/like', { method: 'POST' });
    const ct = res.headers.get('content-type') || '';
    if (!res.ok || !ct.includes('application/json')) return;
    const data = await res.json();
    stats.value.likes = data.likes ?? stats.value.likes + 1;
    if (first) {
      likedOnce.value = true;
      try { localStorage.setItem('hrh_liked', '1'); } catch {}
      showToast('谢谢你的点赞~', 'ok', 1800);
    } else {
      showToast('点过了嗷！再点要收你点赞费了！', 'warn', 1800);
    }
  } catch {}
}

/**
 * 文章跳转确认
 */
function confirmCSDN() {
  articleConfirmOpen.value = true;
}
function closeArticleConfirm() {
  articleConfirmOpen.value = false;
}
function goCSDN() {
  window.open('https://blog.csdn.net/hrh1234h?type=blog', '_blank', 'noopener');
  articleConfirmOpen.value = false;
}

/**
 * 打开“名字的由来”警示框
 */
function openNameInfo() {
  nameInfoOpen.value = true;
}
/**
 * 关闭“名字的由来”警示框
 */
function closeNameInfo() {
  nameInfoOpen.value = false;
}

/**
 * 初始化首屏动画：标题故障闪烁 → 副标题打字机 → 按钮摇晃
 */
const titleSpan = ref<HTMLElement | null>(null);
const subtitleContainer = ref<HTMLElement | null>(null);
const heroBtn = ref<HTMLButtonElement | null>(null);

/**
 * 播放科幻故障闪烁抖动动画
 */
function playGlitchOnce(el: HTMLElement) {
  el.classList.add("glitch-once");
  setTimeout(() => el.classList.remove("glitch-once"), 1200);
}

/**
 * 以打字机方式依次渲染副标题："我叫 ", "HRH", "，是个"
 */
function typeSubtitle(target: HTMLElement, speed = 60, done?: () => void) {
  target.innerHTML = "";
  const pre = document.createTextNode("");
  const hrh = document.createElement("span");
  hrh.className = "hover-fx";
  hrh.setAttribute("data-text", "HRH");
  hrh.style.color = "var(--hero-world-color)";
  hrh.style.setProperty("--hover-shadow-color", "var(--hero-world-color)");
  hrh.style.cursor = "pointer";
  const post = document.createTextNode("");
  target.append(pre, hrh, post);
  hrh.addEventListener("click", openNameInfo);

  const seq: Array<() => void> = [];
  const preText = "我叫 ";
  const hrhText = "HRH";
  const postText = "，是个";
  for (const ch of preText) seq.push(() => (pre.textContent += ch));
  for (const ch of hrhText) seq.push(() => (hrh.textContent += ch));
  for (const ch of postText) seq.push(() => (post.textContent += ch));

  let i = 0;
  const tick = () => {
    if (i < seq.length) {
      seq[i++]();
      setTimeout(tick, speed);
    } else {
      done && done();
    }
  };
  tick();
}

/**
 * 按钮左右摇晃两下
 */
/**
 * 显示按钮并触发极客感震动
 */
function showButtonWithVibration(btn: HTMLElement) {
  btn.classList.remove("btn-hidden");
  btn.classList.add("btn-reveal");
  btn.addEventListener(
    "animationend",
    () => {
      btn.classList.remove("btn-reveal");
      btn.classList.add("btn-vibrate");
      cardsVisible.value = true;
      btn.addEventListener("animationend", () => btn.classList.remove("btn-vibrate"), { once: true });
    },
    { once: true }
  );
}

/**
 * 运行首屏动画序列
 */
function runIntroAnimations() {
  const t = titleSpan.value;
  const s = subtitleContainer.value;
  const b = heroBtn.value;
  if (!t || !s || !b) return;
  playGlitchOnce(t);
  setTimeout(() => {
    typeSubtitle(s, 60, () => showButtonWithVibration(b));
  }, 1000);
}

/**
 * 启用按钮可拖拽（限制在 section 边缘范围内，越界视为松手）
 */
function enableDraggableButton(btn: HTMLElement, host: HTMLElement) {
  let dragging = false;
  let activePointerId: number | null = null;
  let startX = 0;
  let startY = 0;
  let currentX = 0;
  let currentY = 0;
  let prevX = 0;
  let prevY = 0;
  let lastDX = 0;
  let lastDY = 0;
  let hostRect: DOMRect;
  let btnRect: DOMRect;
  let centerX = 0;
  let centerY = 0;
  let movedEnough = false;
  let suppressNextClick = false;
  const MOVE_THRESHOLD = 4; // 判定拖拽的最小位移
  btn.style.transform = "";

  /**
   * 位移限制在宿主容器边缘内（以按钮中心为基准）
   */
  function clampToHost(dx: number, dy: number) {
    const minX = hostRect.left + btnRect.width / 2 - centerX;
    const maxX = hostRect.right - btnRect.width / 2 - centerX;
    const minY = hostRect.top + btnRect.height / 2 - centerY;
    const maxY = hostRect.bottom - btnRect.height / 2 - centerY;
    return {
      x: Math.max(minX, Math.min(maxX, dx)),
      y: Math.max(minY, Math.min(maxY, dy)),
    };
  }

  /**
   * 指针按下开始拖拽（同时支持鼠标与触控）
   */
  function onPointerDown(e: PointerEvent) {
    e.preventDefault();
    dragging = true;
    activePointerId = e.pointerId ?? null;
    btn.classList.add("btn-dragging");
    startX = e.clientX;
    startY = e.clientY;
    hostRect = host.getBoundingClientRect();
    btnRect = btn.getBoundingClientRect();
    centerX = btnRect.left + btnRect.width / 2;
    centerY = btnRect.top + btnRect.height / 2;
    currentX = 0;
    currentY = 0;
    prevX = 0;
    prevY = 0;
    movedEnough = false;
    suppressNextClick = false;
    // 取消可能存在的摇晃动画，以免冲突
    btn.classList.remove("btn-vibrate", "btn-vibrate-2");
    btn.style.transition = "none";
    try { btn.setPointerCapture(e.pointerId); } catch {}
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerCancel);
  }

  /**
   * 指针移动时更新位移（带边界约束）
   */
  function onPointerMove(e: PointerEvent) {
    if (dragging) e.preventDefault();
    if (!dragging) return;
    // 鼠标越出宿主边界则判定松手
    if (
      e.clientX < hostRect.left ||
      e.clientX > hostRect.right ||
      e.clientY < hostRect.top ||
      e.clientY > hostRect.bottom
    ) {
      onPointerUp();
      return;
    }
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    const c = clampToHost(dx, dy);
    currentX = c.x;
    currentY = c.y;
    lastDX = currentX - prevX;
    lastDY = currentY - prevY;
    prevX = currentX;
    prevY = currentY;
    if (!movedEnough && Math.hypot(currentX, currentY) > MOVE_THRESHOLD) {
      movedEnough = true;
      suppressNextClick = true;
    }
    btn.style.setProperty("--tx", `${currentX}px`);
    btn.style.setProperty("--ty", `${currentY}px`);
  }

  /**
   * 指针松开后回弹到原位，并晃动两下
   */
  function onPointerUp(e?: PointerEvent) {
    if (!dragging) return;
    dragging = false;
    btn.classList.remove("btn-dragging");
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", onPointerUp);
    window.removeEventListener("pointercancel", onPointerCancel);
    try {
      const pid = e?.pointerId ?? activePointerId;
      if (pid != null) btn.releasePointerCapture(pid);
    } catch {}
    // 物理感惯性：先沿拖拽反方向越过原位，再按拖拽方向弱化震荡，最后归零
    // 以当前位移为初始振幅，沿当前位移方向作为震荡轴
    const lenCurr = Math.hypot(currentX, currentY) || 1;
    const dirX = currentX / lenCurr;
    const dirY = currentY / lenCurr;
    const A0 = lenCurr; // 初始振幅取释放时位移
    const cycles = 3; // 往复几次
    const duration = 800; // ms，总时长
    const damping = 3.2; // 衰减强度
    const startTime = performance.now();

    btn.style.transition = "none";

    function animate() {
      const now = performance.now();
      const t = Math.min(1, (now - startTime) / duration);
      // 阻尼余弦：从当前位移开始，越过原位到反方向，再逐步减弱回归
      const disp = A0 * Math.exp(-damping * t) * Math.cos(2 * Math.PI * cycles * t);
      const ox = dirX * disp;
      const oy = dirY * disp;
      btn.style.setProperty("--tx", `${ox}px`);
      btn.style.setProperty("--ty", `${oy}px`);
      if (t < 1) {
        requestAnimationFrame(animate);
      } else {
        // 末尾微调至原位，确保完全归零
        btn.style.transition = "transform 160ms ease-out";
        btn.style.setProperty("--tx", `0px`);
        btn.style.setProperty("--ty", `0px`);
        const onTransitionEnd = () => {
          btn.style.transition = "";
          btn.style.transform = "";
          btn.removeEventListener("transitionend", onTransitionEnd);
        };
        btn.addEventListener("transitionend", onTransitionEnd);
      }
    }
    requestAnimationFrame(animate);
  }

  /**
   * 指针被取消（例如触发系统手势）时，按松手处理
   */
  function onPointerCancel(e: PointerEvent) {
    onPointerUp(e);
  }

  /**
   * 仅在未发生拖拽时才允许点击触发
   */
  function onClickCapture(e: MouseEvent) {
    if (suppressNextClick) {
      e.preventDefault();
      e.stopPropagation();
      suppressNextClick = false;
    }
  }

  btn.addEventListener("click", onClickCapture, { capture: true });
  btn.addEventListener("pointerdown", onPointerDown);

  // 组件卸载时清理
  onBeforeUnmount(() => {
    btn.removeEventListener("pointerdown", onPointerDown);
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", onPointerUp);
    window.removeEventListener("pointercancel", onPointerCancel);
  });
}

/**
 * 交互式科幻背景：星空 + 霓虹网络，随鼠标产生响应
 */
const sectionEl = ref<HTMLElement | null>(null);
const bgCanvas = ref<HTMLCanvasElement | null>(null);

/**
 * 初始化并启动背景动画
 */
function initInteractiveBackground() {
  const canvas = bgCanvas.value!;
  const host = sectionEl.value!;
  if (document.querySelector('.global-bg')) return;

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

  // 增强科幻感：鼠标点击触发涟漪
  let ripples: Array<{ x: number; y: number; r: number; life: number }>= [];

  /**
   * 设置画布尺寸，依据容器大小与像素比
   */
  function setupCanvas() {
    const rect = host.getBoundingClientRect();
    width = Math.floor(rect.width);
    height = Math.floor(rect.height);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    ctx.scale(dpr, dpr);
  }

  /**
   * 创建星空粒子
   */
  function createStars(count = 140) {
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
  function createNodes(grid = 140) {
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

    // 星星发光
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
      g.addColorStop(0, `${neon}ff`); // 内核
      g.addColorStop(1, `${neon}00`); // 衰减
      ctx.fillStyle = g as unknown as string;
      ctx.beginPath();
      ctx.arc(st.x, st.y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // 底部渐隐过渡，避免与下方区域出现明显断层
    const fade = ctx.createLinearGradient(0, height * 0.7, 0, height);
    fade.addColorStop(0, "rgba(0,0,0,0)");
    fade.addColorStop(1, "rgba(0,0,0,0.85)");
    ctx.fillStyle = fade as unknown as string;
    ctx.fillRect(0, height * 0.7, width, height * 0.3);
  }

  /**
   * 绘制霓虹网络（靠近鼠标的节点被激活）
   */
  function drawNetwork(time: number) {
    const pulse = (Math.sin(time * 0.002) + 1) * 0.5; // 0..1
    for (const n of nodes) {
      const dx = n.x - mouse.x;
      const dy = n.y - mouse.y;
      const dist = Math.hypot(dx, dy);
      const radius = 200;

      // 节点发光
      if (dist < radius * 1.2) {
        const alpha = Math.max(0, 1 - dist / (radius * 1.2));
        ctx.fillStyle = `rgba(0, 212, 255, ${0.08 + alpha * 0.35})`;
        ctx.beginPath();
        ctx.arc(n.x, n.y, 1.6 + pulse * 0.8, 0, Math.PI * 2);
        ctx.fill();
      }

      // 与鼠标的连线（随距离淡出）
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
   * 主循环：清屏 + 星空 + 网络
   */
  function loop(time: number) {
    ctx.clearRect(0, 0, width, height);
    drawStars();
    drawNetwork(time);
    drawRipples();
    animationId = requestAnimationFrame(loop);
  }

  /**
   * 处理窗口/容器尺寸变化
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
    const rect = host.getBoundingClientRect();
    mouse.tx = e.clientX - rect.left;
    mouse.ty = e.clientY - rect.top;
  }

  /**
   * 鼠标点击触发同心波纹
   */
  function handleClick(e: MouseEvent) {
    const rect = host.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    ripples.push({ x, y, r: 2, life: 1 });
  }

  /**
   * 鼠标离开时将目标坐标缓慢回归中心
   */
  function handleLeave() {
    mouse.tx = width / 2;
    mouse.ty = height / 2;
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
  host.addEventListener("mousemove", handleMouse);
  host.addEventListener("click", handleClick);
  host.addEventListener("mouseleave", handleLeave);

  // 清理函数
  onBeforeUnmount(() => {
    cancelAnimationFrame(animationId);
    window.removeEventListener("resize", handleResize);
    host.removeEventListener("mousemove", handleMouse);
    host.removeEventListener("click", handleClick);
    host.removeEventListener("mouseleave", handleLeave);
  });
}

/**
 * Vue 生命周期：挂载时开启科幻背景
 */
onMounted(() => {
  initInteractiveBackground();
  runIntroAnimations();
  const b = heroBtn.value;
  const host = sectionEl.value;
  if (b && host) enableDraggableButton(b, host);
  loadStats().then(() => recordVisit());
  try { likedOnce.value = localStorage.getItem('hrh_liked') === '1'; } catch {}
});

/**
 * 监听管理员编辑事件并更新统计数据
 */
window.addEventListener('hrh-admin-update', (e: Event) => {
  const detail = (e as CustomEvent<{ visits?: number, visitors?: number, likes?: number }>).detail
  if (!detail) return
  if (typeof detail.visits === 'number') stats.value.visits = detail.visits
  if (typeof detail.visitors === 'number') stats.value.visitors = detail.visitors
  if (typeof detail.likes === 'number') stats.value.likes = detail.likes
})
</script>

<style scoped>
.bg-canvas {
  pointer-events: none;
  mix-blend-mode: screen;
  opacity: 0.9;
}
.hero-top {font-size: 1.15em;}
.hero-scale { font-size: 0.6em; }
.hero-big-btn { font-size: 1.2em; padding: 1rem 1.25rem; }
.hero-big-btn { transition: transform 160ms ease-out; transform: translate(var(--tx, 0), var(--ty, 0)); will-change: transform; }
.hero-big-btn:hover { transform: translate(var(--tx, 0), var(--ty, 0)) scale(1.06); }
.hero-up { transform: translateY(-5vh); }
.cards-row { position: absolute; bottom: 5vh; left: 50%; transform: translateX(-50%); width: min(92vw, 1000px); display: grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap: 1.5rem; }
.cards-enter { animation: cardsReveal 200ms ease-out both; }
.card { position: relative; padding: 1rem; border-radius: 16px; border: 2px solid var(--link-color); background: rgba(0,0,0,0.25); backdrop-filter: blur(6px); color: var(--fg); transition: transform 160ms ease, box-shadow 160ms ease, background-color 160ms ease, border-color 160ms ease; overflow: hidden; }
.card:hover { transform: translateY(-2px) scale(1.06); box-shadow: 0 8px 18px rgba(0,0,0,0.25), 0 0 12px rgba(0,212,255,0.38); background-color: rgba(0,0,0,0.35); border-color: #00d4ff; }
.card-title { font-weight: 800; margin-bottom: 0.5rem; }
.card-stats { display: grid; grid-template-columns: repeat(3, 1fr); justify-items: center; align-items: center; gap: 0; padding: 0.4rem 0.2rem; font-weight: 700; }
.stat { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; text-align: center; gap: 0.25rem; padding: 0 0.6rem; border-right: 1px solid rgba(255,255,255,0.2); }
.stat:last-child { border-right: none; }
.stat [aria-hidden] { font-size: 1.4rem; line-height: 1; }
.stat .num { color: #facc15; font-size: 1.1rem; line-height: 1.1; font-weight: 800; }
.stat .label { color: var(--muted); font-size: 0.9rem; line-height: 0.5; }
.card-tip { margin-top: 0.6rem; color: var(--muted); font-size: 0.85rem; text-align: center; }
@keyframes cardsReveal { 0% { opacity: 0; transform: translate(-50%, 20px); } 100% { opacity: 1; transform: translate(-50%, 0); } }
.card { position: relative; padding: 1rem; border-radius: 16px; border: 2px solid var(--link-color); background: rgba(0,0,0,0.25); backdrop-filter: blur(6px); color: var(--fg); transition: transform 160ms ease, box-shadow 160ms ease, background-color 160ms ease; }
.card:hover { transform: translateY(-2px) scale(1.06); box-shadow: 0 8px 18px rgba(0,0,0,0.25), 0 0 12px rgba(0,212,255,0.28); background-color: rgba(0,0,0,0.35); }

.projects-overlay { position: fixed; inset: 0; z-index: 80; background: rgba(0,0,0,0.45); backdrop-filter: blur(6px); }
.projects-modal { position: absolute; left: 50%; transform: translateX(-50%); top: -70vh; width: min(92vw, 960px); background: var(--modal-bg); border: 2px solid var(--link-color); border-radius: 18px; padding: 1rem; box-shadow: var(--modal-shadow); animation: slideDown 420ms ease-out forwards; }
.projects-close { position: absolute; top: 0.75rem; right: 0.75rem; width: 32px; height: 32px; display: grid; place-items: center; border-radius: 9999px; border: 2px solid var(--link-color); background-color: transparent; color: var(--link-color); font-weight: 900; }
.projects-content { color: var(--fg); min-height: 40vh; display: grid; place-items: center; }
@keyframes slideDown { to { top: 10vh; } }
/* 按钮初始隐藏与显隐动画 */
.btn-hidden { opacity: 0; visibility: hidden; transform: scale(0.96) translateY(6px); }
.btn-reveal { animation: btnReveal 320ms ease-out both; }
@keyframes btnReveal {
  0% { opacity: 0; visibility: visible; transform: scale(0.96) translateY(6px); }
  100% { opacity: 1; visibility: visible; transform: scale(1) translateY(0); }
}
/* 标题一次性科幻故障闪烁抖动 */
.glitch-once {
  animation: glitchFlicker 1.2s ease-in-out both;
}
@keyframes glitchFlicker {
  0% { opacity: 1; transform: translateX(0) }
  15% { opacity: 0.7; transform: translateX(-0.6px) }
  25% { opacity: 0.4; transform: translateX(1px) }
  35% { opacity: 0.85; transform: translateX(-0.8px) }
  50% { opacity: 0.3; filter: drop-shadow(0 0 10px var(--hero-hello-color)); }
  65% { opacity: 0.9; transform: translateX(0.6px) }
  80% { opacity: 0.5; transform: translateX(-1px) }
  100% { opacity: 1; transform: translateX(0) }
}
/* 按钮极客感震动（短促多向抖动，收尾复位） */
.btn-vibrate { animation: nerdVibrate 0.9s cubic-bezier(0.36, 0.07, 0.19, 0.97) 1 both; will-change: transform, box-shadow; }
@keyframes nerdVibrate {
  0%   { transform: translate(0,0) rotate(0deg) scale(1); box-shadow: 0 0 0 0 rgba(0, 212, 255, 0); }
  10%  { transform: translate(3px,-3px) rotate(-1deg) scale(1.02); box-shadow: 0 0 12px rgba(0, 212, 255, 0.45); }
  20%  { transform: translate(-4px,3px) rotate(0.8deg) scale(0.98); box-shadow: 0 0 18px rgba(0, 212, 255, 0.55); }
  30%  { transform: translate(6px,2px) rotate(-0.9deg) scale(1.03); box-shadow: 0 0 22px rgba(0, 212, 255, 0.6); }
  40%  { transform: translate(-6px,-3px) rotate(1deg) scale(0.99); box-shadow: 0 0 16px rgba(0, 212, 255, 0.5); }
  50%  { transform: translate(5px,6px) rotate(-0.8deg) scale(1.02); box-shadow: 0 0 24px rgba(0, 212, 255, 0.65); }
  60%  { transform: translate(-5px,-7px) rotate(1.1deg) scale(0.98); box-shadow: 0 0 16px rgba(0, 212, 255, 0.5); }
  70%  { transform: translate(4px,3px) rotate(-0.7deg) scale(1.01); box-shadow: 0 0 20px rgba(0, 212, 255, 0.6); }
  80%  { transform: translate(-4px,2px) rotate(0.6deg) scale(1.02); box-shadow: 0 0 18px rgba(0, 212, 255, 0.55); }
  90%  { transform: translate(3px,-2px) rotate(-0.4deg) scale(0.99); box-shadow: 0 0 12px rgba(0, 212, 255, 0.4); }
  100% { transform: translate(0,0) rotate(0deg) scale(1); box-shadow: 0 0 0 0 rgba(0, 212, 255, 0); }
}
/* 顶部提示样式（可叠层，最多3个），新提示从顶部滑入并压住旧提示 */
.toast-stack { position: fixed; top: 1.6vh; left: 50%; transform: translateX(-50%); z-index: 90; pointer-events: none; }
.toast { position: absolute; left: 50%; transform: translateX(-50%) translateY(var(--offset)); z-index: var(--z); padding: 0.7rem 1.1rem; border-radius: 16px; border: 1px solid var(--link-color); color: var(--link-color); background: rgba(0,0,0,0.35); backdrop-filter: blur(6px); font-weight: 800; box-shadow: 0 6px 14px rgba(0,0,0,0.25), 0 0 10px rgba(0,212,255,0.35); animation: toastIn 280ms ease-out both; writing-mode: horizontal-tb; white-space: nowrap; display: inline-flex; align-items: center; overflow: hidden; }
.toast.warn { border-color: var(--link-color); color: var(--link-color); box-shadow: 0 6px 14px rgba(0,0,0,0.25), 0 0 10px rgba(0,212,255,0.35); }
@keyframes toastIn {
  0% { transform: translateX(-50%) translateY(calc(var(--offset) - 18px)); opacity: 0; }
  100% { transform: translateX(-50%) translateY(var(--offset)); opacity: 1; }
}
/* 警示确认框 */
.confirm-overlay { position: fixed; inset: 0; z-index: 95; background: rgba(0,0,0,0.45); backdrop-filter: blur(6px); }
.confirm-modal { position: absolute; left: 50%; transform: translateX(-50%); top: 14vh; width: min(92vw, 560px); background: var(--modal-bg); border: 2px solid #f59e0b; border-radius: 18px; padding: 1rem; box-shadow: var(--modal-shadow); }
.confirm-title { display: flex; align-items: center; gap: 0.5rem; font-weight: 900; color: #f59e0b; margin-bottom: 0.4rem; }
.confirm-text { color: var(--fg); font-size: 1rem; margin-bottom: 0.8rem; }
.confirm-actions { display: flex; justify-content: flex-end; gap: 0.6rem; }
/* 响应式布局：手机端第一张卡片独占一行，第二第三并排 */
@media (max-width: 640px) {
  .cards-row {
    grid-template-columns: repeat(2, minmax(0,1fr));
    gap: 1rem;
    width: min(96vw, 680px);
  }
  .stats-card {
    grid-column: 1 / -1;
  }
}
</style>
.btn-draggable { cursor: grab; user-select: none; }
.btn-dragging { cursor: grabbing; }
.btn-draggable { touch-action: none; }
.btn-vibrate-2 { animation: nerdVibrate 0.7s cubic-bezier(0.36, 0.07, 0.19, 0.97) 2 both; }