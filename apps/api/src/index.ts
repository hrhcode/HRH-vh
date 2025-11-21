import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { createDb } from "./db";

/**
 * 创建 Hono 应用并配置中间件
 */
function createApp() {
  const app = new Hono();
  app.use("*", cors());
  app.use("*", logger());
  return app;
}

/**
 * 注册 API 路由
 */
async function registerRoutes(app: Hono) {
  const db = createDb();
  await db.read();

  app.get("/api/skills", (c) => c.json(db.data.skills));

  /**
   * 获取站点访问统计
   */
  app.get("/api/stats", (c) => c.json(db.data.stats));

  /**
   * 访问数 +1（每次页面加载调用）
   */
  app.post("/api/visit", async (c) => {
    await db.read();
    db.data.stats.visits = (db.data.stats.visits ?? 0) + 1;
    await db.write();
    return c.json({ ok: true, visits: db.data.stats.visits });
  });

  /**
   * 点赞 +1
   */
  app.post("/api/like", async (c) => {
    await db.read();
    db.data.stats.likes = (db.data.stats.likes ?? 0) + 1;
    await db.write();
    return c.json({ ok: true, likes: db.data.stats.likes });
  });

  /**
   * 管理员编辑统计（持久化指定字段）
   */
  app.post("/api/admin/stats", async (c) => {
    await db.read();
    let body: any = {};
    try { body = await c.req.json(); } catch {}
    const { visits, visitors, likes } = body || {};
    if (typeof visits === "number") db.data.stats.visits = visits;
    if (typeof visitors === "number") db.data.stats.visitors = visitors;
    if (typeof likes === "number") db.data.stats.likes = likes;
    await db.write();
    return c.json({ ok: true, stats: db.data.stats });
  });
}

/**
 * 启动 HTTP 服务
 */
async function start() {
  const app = createApp();
  await registerRoutes(app);
  const port = Number(process.env.PORT || 8787);
  console.log(`API listening on http://localhost:${port}`);
  serve({ fetch: app.fetch, port });
}

start();