import { z } from 'zod'

export const createLinkSchema = z.object({
  originalUrl: z
    .string()
    .trim()
    .url()
    .refine((url) => /^https?:\/\//i.test(url), 'Use an HTTP or HTTPS URL'),
  shortCode: z
    .string()
    .trim()
    .min(3)
    .max(32)
    .regex(/^[a-zA-Z0-9_-]+$/)
    .transform((code) => code.toLowerCase())
    .refine((code) => !['api', 'health', 'docs'].includes(code), 'This code is reserved')
    .optional(),
})

export const linkIdParamsSchema = z.object({
  id: z.string().uuid(),
})

export const shortCodeParamsSchema = z.object({
  shortCode: z.string().min(1),
})
