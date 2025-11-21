import { Low } from "lowdb";
import { JSONFile } from "lowdb/node";
import type { Skill } from "@hrh/shared";
import path from "node:path";

/**
 * 定义 lowdb 的数据库结构类型
 */
export type DbData = {
  skills: Skill[];
  stats: { visits: number; visitors: number; likes: number };
};

/**
 * 创建并返回 lowdb 实例
 */
export function createDb(file = path.resolve(process.cwd(), "../../data/db.json")) {
  const adapter = new JSONFile<DbData>(file);
  const db = new Low<DbData>(adapter, {
    skills: [],
    stats: { visits: 0, visitors: 0, likes: 0 },
  });
  return db;
}