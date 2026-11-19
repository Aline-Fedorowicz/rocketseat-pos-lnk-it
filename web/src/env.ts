import { z } from 'zod'

const envSchema = z.object({
  VITE_FRONTEND_URL: z.string().url(),
  VITE_BACKEND_URL: z.string().url(),
})

const parsed = envSchema.parse(import.meta.env)

export const env = {
  frontendUrl: parsed.VITE_FRONTEND_URL.replace(/\/$/, ''),
  backendUrl: parsed.VITE_BACKEND_URL.replace(/\/$/, ''),
}

export const shortUrlHost = new URL(env.frontendUrl).host
