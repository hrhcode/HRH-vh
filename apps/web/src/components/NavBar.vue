<template>
  <nav class="nav-bar fixed top-0 left-0 right-0 z-50">
    <div class="nav-container container mx-auto px-6 h-14 flex items-center justify-between">
      <!-- 品牌层叠链接：悬浮时从“首页”切换到“HRH” -->
      <a href="/" class="nav-brand brand-hover">
        <span class="brand-layer brand-default"><span aria-hidden>🏠</span> 首页</span>
        <span class="brand-layer brand-alt">HRH</span>
      </a>
    </div>
    
  </nav>
</template>

<script setup lang="ts">
/**
 * 顶部导航栏组件
 */
</script>

<style scoped>
/* 仅保留容器的溢出隐藏，层叠样式复用全局 styles.css */
.nav-brand { position: relative; display: inline-block; overflow: hidden; }
</style>