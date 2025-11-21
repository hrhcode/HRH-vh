import { z } from "zod";

/**
 * 定义个人信息的 Zod 模型
 */
export const ProfileSchema = z.object({
  name: z.string(),
  title: z.string(),
  avatar: z.string().optional(),
  bio: z.string().optional(),
  links: z
    .array(
      z.object({
        name: z.string(),
        url: z.string().url(),
      })
    )
    .default([]),
});

/**
 * 定义技能信息的 Zod 模型
 */
export const SkillSchema = z.object({
  name: z.string(),
  level: z.number().min(1).max(5),
  tags: z.array(z.string()).default([]),
  icon: z.string().optional(),
});

/**
 * 定义项目信息的 Zod 模型
 */
export const ProjectSchema = z.object({
  name: z.string(),
  description: z.string(),
  tags: z.array(z.string()).default([]),
  links: z
    .object({
      github: z.string().url().optional(),
      demo: z.string().url().optional(),
    })
    .optional(),
  cover: z.string().optional(),
});

/**
 * 定义联系人留言的 Zod 模型
 */
export const ContactSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  message: z.string().min(1),
  createdAt: z.string().optional(),
});

export type Profile = z.infer<typeof ProfileSchema>;
export type Skill = z.infer<typeof SkillSchema>;
export type Project = z.infer<typeof ProjectSchema>;
export type Contact = z.infer<typeof ContactSchema>;