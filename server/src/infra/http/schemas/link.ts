import { z } from 'zod'

export const shortCodeSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, 'O link encurtado deve ter pelo menos 3 caracteres.')
  .max(32, 'O link encurtado deve ter no máximo 32 caracteres.')
  .regex(
    /^[a-z0-9-]+$/,
    'Informe uma URL minúscula e sem espaço/caracter especial.'
  )

export const createLinkBodySchema = z.object({
  originalUrl: z
    .string()
    .trim()
    .url('Informe uma URL válida.')
    .refine(url => /^https?:\/\//i.test(url), 'Informe uma URL HTTP ou HTTPS.'),
  shortCode: shortCodeSchema,
})

export const linkSchema = z.object({
  id: z.string(),
  originalUrl: z.string(),
  shortCode: z.string(),
  accessCount: z.number().int(),
  createdAt: z.date(),
})

export const linkIdParamsSchema = z.object({
  id: z.string().uuid('ID de link inválido.'),
})

export const errorSchema = z.object({
  message: z.string(),
})
