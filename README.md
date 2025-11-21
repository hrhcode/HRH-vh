# HRH-vh 个人展示网站（vue + hono）版本
- 本版本目前停止维护，新版本将使用vue + springboot重构

## 技术栈
- 前端：Vue 3 + TypeScript + TailwindCSS + @vueuse/motion + shadcn-vue
- 后端：Hono + TypeScript + Zod + lowdb
- 网关：Nginx（静态站点 + `/api` 反向代理）
- 管理：pnpm + Monorepo

## Monorepo 结构
- `apps/web` 前端应用（Vite）
- `apps/api` 后端服务（Hono）
- `packages/shared` 前后端共享类型（Zod 模型）
- `infra/nginx` Nginx 配置与 Dockerfile
- `data/db.json` lowdb 开发数据

## 关键功能
- 首屏 Hero：赛博霓虹视觉、交互动效
- 技术栈云弹窗：3D 环形旋转的技术栈展示，标题与说明分区
- 导航栏：极客风样式与交互，固定顶部、扫描线效果
- 主题：默认黑夜主题（已去除白天主题和切换入口）

## 路由与数据
- `GET /api/health` 健康检查（`apps/api/src/index.ts:20`）
- `GET /api/profile` 个人信息（`apps/api/src/index.ts:22`）
- `GET /api/skills` 技能列表（`apps/api/src/index.ts:24`）
- `GET /api/projects` 项目列表，支持 `?tag=`（`apps/api/src/index.ts:26`）
- 数据模型：`packages/shared/src/schemas.ts:1`

## 启动方式（开发）
1. 安装依赖（Windows 建议使用 `pnpm.cmd`）：
   - `pnpm.cmd install`
2. 构建共享类型（确保后端能加载到构建产物）：
   - `pnpm.cmd -F @hrh/shared build`
3. 启动后端（默认 `http://localhost:8787`）：
   - `pnpm.cmd -F api dev`
4. 启动前端（默认 `http://localhost:5173`）：
   - `pnpm.cmd -F web dev`

## 访问
- 前端预览：`http://localhost:5173/`
- 后端 API：`http://localhost:8787/api/*`

## Nginx（可选生产）
- `infra/nginx/nginx.conf`：静态站点与 `/api` 代理
- 构建前端后将产物复制到 `infra/nginx/web-dist` 再构建镜像

## 注意事项
- Windows 下如遇 PowerShell 执行限制，请使用 `pnpm.cmd` 或调整执行策略
- 后端开发使用 `esbuild-register` 运行 TS，避免 Node 18 与 tsx 的兼容问题
- 主题已固定为黑夜：`apps/web/src/main.ts:13` 应用 `theme-dark`

## 项目目标
- 打造极客风格、动效酷炫且性能可控的个人展示网站，前后端分离，类型统一，部署简单