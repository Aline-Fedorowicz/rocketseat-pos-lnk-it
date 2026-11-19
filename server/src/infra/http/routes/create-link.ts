import { eq } from 'drizzle-orm'
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { db } from '../../db'
import { links } from '../../db/schemas/links'
import { createLinkBodySchema, errorSchema, linkSchema } from '../schemas/link'

export const createLinkRoute: FastifyPluginAsyncZod = async app => {
  app.post(
    '/links',
    {
      schema: {
        tags: ['Links'],
        summary: 'Cria um link encurtado',
        body: createLinkBodySchema,
        response: {
          201: linkSchema.describe('Link criado.'),
          409: errorSchema.describe('O link encurtado já existe.'),
        },
      },
    },
    async (request, reply) => {
      const { originalUrl, shortCode } = request.body

      const existing = await db
        .select({ id: links.id })
        .from(links)
        .where(eq(links.shortCode, shortCode))
        .limit(1)

      if (existing.length > 0) {
        return reply
          .status(409)
          .send({ message: 'Essa URL encurtada já existe.' })
      }

      const [link] = await db
        .insert(links)
        .values({ originalUrl, shortCode })
        .onConflictDoNothing({ target: links.shortCode })
        .returning()

      if (!link) {
        return reply
          .status(409)
          .send({ message: 'Essa URL encurtada já existe.' })
      }

      return reply.status(201).send(link)
    }
  )
}
