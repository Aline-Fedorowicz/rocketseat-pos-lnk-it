import { eq } from 'drizzle-orm'
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { db } from '../../db'
import { links } from '../../db/schemas/links'
import { errorSchema, linkSchema } from '../schemas/link'

export const getLinkByShortCodeRoute: FastifyPluginAsyncZod = async app => {
  app.get(
    '/links/:shortCode',
    {
      schema: {
        tags: ['Links'],
        summary: 'Obtém a URL original a partir da URL encurtada',
        params: z.object({ shortCode: z.string().trim().toLowerCase() }),
        response: {
          200: linkSchema,
          404: errorSchema.describe('Link não encontrado.'),
        },
      },
    },
    async (request, reply) => {
      const [link] = await db
        .select()
        .from(links)
        .where(eq(links.shortCode, request.params.shortCode))
        .limit(1)

      if (!link) {
        return reply.status(404).send({ message: 'Link não encontrado.' })
      }

      return link
    }
  )
}
