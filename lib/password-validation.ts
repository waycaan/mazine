import { z } from 'zod'

export const usernameSchema = z.string()
  .min(1, '用户名不能为空')
  .max(50, '用户名过长')

export const passwordSchema = z.string()
  .min(6, '密码至少6个字符')
  .max(100, '密码过长') 