import { createApp } from "vue";
import App from "./App.vue";
import "./styles.css";
import { MotionPlugin } from "@vueuse/motion";

/**
 * 启动前端应用并注册 Motion 插件
 * - 初始化 Vue 应用
 * - 安装 @vueuse/motion 以提供轻量动画指令
 * - 挂载到根容器
 */
function bootstrap() {
  const app = createApp(App);
  app.use(MotionPlugin);
  app.mount("#app");
}

/**
 * 应用默认主题（深色）
 * - 在应用启动前设置 `theme-dark` 以避免 FOUC
 */
function applyDefaultTheme() {
  document.body.classList.add("theme-dark");
}
applyDefaultTheme();
bootstrap();