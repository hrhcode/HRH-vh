<template>
  <!-- 管理员弹窗：密钥校验 → 数据编辑表单 -->
  <div v-if="open" class="admin-overlay">
    <div class="admin-modal">
      <div class="admin-title"><span aria-hidden>⚠️</span> 管理员登录</div>
      <!-- 步骤一：输入密钥 -->
      <div v-if="step==='key'" class="admin-body">
        <label class="admin-label">请输入密钥</label>
        <input v-model="keyInput" class="admin-input" type="password" placeholder="密钥" @keydown.enter="confirmKey" />
        <div class="admin-actions">
          <button type="button" class="btn btn-primary btn-pill" @click="confirmKey">确定</button>
          <button type="button" class="btn btn-pill" @click="emitClose">取消</button>
        </div>
      </div>
      <!-- 步骤二：编辑统计数据 -->
      <div v-else class="admin-body">
        <label class="admin-label">访问数</label>
        <input v-model="visitsInput" class="admin-input" type="number" placeholder="留空则不改" @keydown.enter="submitEdits" />
        <label class="admin-label">访客数</label>
        <input v-model="visitorsInput" class="admin-input" type="number" placeholder="留空则不改" @keydown.enter="submitEdits" />
        <label class="admin-label">点赞数</label>
        <input v-model="likesInput" class="admin-input" type="number" placeholder="留空则不改" @keydown.enter="submitEdits" />
        <div class="admin-actions">
          <button type="button" class="btn btn-primary btn-pill" @click="submitEdits">确定</button>
          <button type="button" class="btn btn-pill" @click="emitClose">取消</button>
        </div>
      </div>
    </div>
  </div>
  <!-- /管理员弹窗 -->
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ (e: 'close'): void, (e: 'submit', payload: { visits?: number, visitors?: number, likes?: number }): void }>()

const step = ref<'key'|'edit'>('key')
const keyInput = ref('')
const visitsInput = ref('')
const visitorsInput = ref('')
const likesInput = ref('')

/**
 * 关闭弹窗并重置内部状态
 */
function emitClose() {
  step.value = 'key'
  keyInput.value = ''
  visitsInput.value = ''
  visitorsInput.value = ''
  likesInput.value = ''
  emit('close')
}

/**
 * 校验密钥并进入编辑步骤
 */
function confirmKey() {
  const ok = keyInput.value.trim() === 'hrh666'
  if (ok) {
    step.value = 'edit'
  } else {
    emitClose()
  }
}

/**
 * 收集输入并提交，仅提交有值的项目
 */
function submitEdits() {
  const payload: { visits?: number, visitors?: number, likes?: number } = {}
  const v1 = visitsInput.value
  const v2 = visitorsInput.value
  const v3 = likesInput.value
  if (v1 !== '' && v1 != null && !Number.isNaN(Number(v1))) payload.visits = Number(v1)
  if (v2 !== '' && v2 != null && !Number.isNaN(Number(v2))) payload.visitors = Number(v2)
  if (v3 !== '' && v3 != null && !Number.isNaN(Number(v3))) payload.likes = Number(v3)
  emit('submit', payload)
  emitClose()
}

watch(() => props.open, (v) => { if (!v) step.value = 'key' })
</script>

<style scoped>
.admin-overlay { position: fixed; inset: 0; z-index: 95; background: rgba(0,0,0,0.45); backdrop-filter: blur(6px); }
.admin-modal { position: absolute; left: 50%; transform: translateX(-50%); top: 14vh; width: min(92vw, 560px); background: var(--modal-bg); border: 2px solid #ef4444; border-radius: 18px; padding: 1rem; box-shadow: var(--modal-shadow); }
.admin-title { display: flex; align-items: center; gap: 0.5rem; font-weight: 900; color: #ef4444; margin-bottom: 0.6rem; }
.admin-body { display: grid; gap: 0.6rem; }
.admin-label { color: var(--fg); font-weight: 800; }
.admin-input { width: 100%; padding: 0.5rem 0.75rem; border-radius: 10px; border: 1px solid #ef4444; background: rgba(0,0,0,0.35); color: var(--fg); outline: none; }
.admin-input:focus { box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.6); }
.admin-actions { display: flex; justify-content: flex-end; gap: 0.6rem; margin-top: 0.4rem; }
</style>