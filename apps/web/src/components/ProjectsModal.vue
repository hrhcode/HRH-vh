<template>
  <!-- 项目弹窗：覆盖层 + 模态框 + 关闭按钮 -->
  <div v-if="open" class="projects-overlay">
    <div class="projects-modal">
      <button class="projects-close" aria-label="关闭" @click="emitClose">×</button>
      <div class="projects-content">施工中。</div>
    </div>
  </div>
  <!-- /项目弹窗 -->
</template>

<script setup lang="ts">
const props = defineProps<{ open: boolean }>();
const emit = defineEmits<{ (e: 'close'): void }>();
/**
 * 关闭弹窗
 */
function emitClose() { emit('close'); }
</script>

<style scoped>
/* 覆盖层：背景模糊与半透明遮罩 */
.projects-overlay { position: fixed; inset: 0; z-index: 80; background: rgba(0,0,0,0.45); backdrop-filter: blur(6px); }
/* 模态框：从顶部滑入到视口内 */
.projects-modal { position: absolute; left: 50%; transform: translateX(-50%); top: -80vh; width: min(95vw, 1200px); background: var(--modal-bg); border: 2px solid var(--link-color); border-radius: 18px; padding: 1.25rem; box-shadow: var(--modal-shadow); animation: slideDownBig 480ms ease-out forwards; }
/* 关闭按钮：带悬浮/按压反馈与波纹效果 */
.projects-close { position: absolute; top: 0.75rem; right: 0.75rem; width: 32px; height: 32px; display: grid; place-items: center; border-radius: 9999px; border: 2px solid var(--link-color); background-color: transparent; color: var(--link-color); font-weight: 900; cursor: pointer; transition: transform 160ms ease, box-shadow 160ms ease, background-color 160ms ease, border-color 160ms ease, color 160ms ease; will-change: transform, box-shadow; }
.projects-close:hover { transform: translateY(-1px) scale(1.05); background-color: rgba(59, 130, 246, 0.12); box-shadow: 0 0 12px rgba(0, 212, 255, 0.35), 0 6px 14px rgba(0, 0, 0, 0.35); }
.projects-close:active { transform: translateY(0) scale(0.94); box-shadow: 0 0 6px rgba(0, 212, 255, 0.25), 0 2px 6px rgba(0, 0, 0, 0.25); }
.projects-close:focus-visible { outline: none; box-shadow: 0 0 0 2px rgba(0, 212, 255, 0.6), 0 0 12px rgba(0, 212, 255, 0.45); }
.projects-close::after { content: ""; position: absolute; inset: 0; border-radius: inherit; pointer-events: none; transform: scale(0.6); opacity: 0; }
.projects-close:active::after { animation: rippleFx 420ms ease-out; }
@keyframes rippleFx { 0% { opacity: 0.35; transform: scale(0.6); box-shadow: 0 0 0 0 rgba(0, 212, 255, 0.6); } 60% { opacity: 0.15; transform: scale(1.25); box-shadow: 0 0 0 10px rgba(0, 212, 255, 0.25); } 100% { opacity: 0; transform: scale(1.45); box-shadow: 0 0 0 16px rgba(0, 212, 255, 0.0); } }
.projects-content { color: var(--fg); min-height: 50vh; display: grid; place-items: center; }
@keyframes slideDownBig { to { top: 8vh; } }
</style>