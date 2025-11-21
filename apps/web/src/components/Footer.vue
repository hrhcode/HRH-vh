<template>
  <!-- 页脚：备案号与年份显示 -->
  <footer class="border-t py-8 text-center" :style="{ color: 'var(--footer-fg)', borderColor: 'var(--footer-border)' }">
    © {{ year }} 鲁ICP备2024132578号
  </footer>
  <!-- /页脚 -->
</template>

<script setup lang="ts">
/**
 * 页脚组件
 * - 计算并显示当前年份
 */
const year = new Date().getFullYear();
</script>

<style scoped>
</style>