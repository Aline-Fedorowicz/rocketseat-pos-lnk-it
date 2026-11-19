import { eq } from 'drizzle-orm'
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { db } from '../../db'
import { links } from '../../db/schemas/links'
import { errorSchema, linkIdParamsSchema } from '../schemas/link'

export const deleteLinkRoute: FastifyPluginAsyncZod = async app => {
  app.delete(
    '/links/:id',
    {
      schema: {
        tags: ['Links'],
        summary: 'Remove um link',
        params: linkIdParamsSchema,
        response: {
          204: z.null().describe('Link removido.'),
          404: errorSchema.describe('Link não encontrado.'),
        },
      },
    },
    async (request, reply) => {
      const deleted = await db
        .delete(links)
        .where(eq(links.id, request.params.id))
        .returning({ id: links.id })

      if (deleted.length === 0) {
        return reply.status(404).send({ message: 'Link não encontrado.' })
      }

      return reply.status(204).send(null)
    }
  )
}
