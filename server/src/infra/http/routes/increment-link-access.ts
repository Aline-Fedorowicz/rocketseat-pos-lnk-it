import { eq, sql } from 'drizzle-orm'
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { db } from '../../db'
import { links } from '../../db/schemas/links'
import { errorSchema, linkIdParamsSchema } from '../schemas/link'

export const incrementLinkAccessRoute: FastifyPluginAsyncZod = async app => {
  app.patch(
    '/links/:id/access',
    {
      schema: {
        tags: ['Links'],
        summary: 'Incrementa a quantidade de acessos de um link',
        params: linkIdParamsSchema,
        response: {
          200: z.object({ accessCount: z.number().int() }),
          404: errorSchema.describe('Link não encontrado.'),
        },
      },
    },
    async (request, reply) => {
      const [link] = await db
        .update(links)
        .set({ accessCount: sql`${links.accessCount} + 1` })
        .where(eq(links.id, request.params.id))
        .returning({ accessCount: links.accessCount })

      if (!link) {
        return reply.status(404).send({ message: 'Link não encontrado.' })
      }

      return link
    }
  )
}
